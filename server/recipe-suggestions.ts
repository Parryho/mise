/**
 * Recipe Suggestions: Smart recipe recommendations based on variety, season,
 * category balance, and recency. Optionally uses Claude AI for more nuanced ranking.
 */

import { db } from "./db";
import { storage } from "./storage";
import { recipes, ingredients, menuPlans, rotationSlots } from "@shared/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";
import { RECIPE_CATEGORIES } from "@shared/schema";
import type { Recipe } from "@shared/schema";
import { formatLocalDate } from "@shared/constants";

// Seasonal mapping: which recipe categories/tags fit which months
const SUMMER_MONTHS = [5, 6, 7, 8]; // May-Aug
const WINTER_MONTHS = [11, 12, 1, 2]; // Nov-Feb
const TRANSITION_MONTHS = [3, 4, 9, 10]; // Mar-Apr, Sep-Oct

// Category groups to avoid duplicates within same meal
const CATEGORY_GROUPS: Record<string, string> = {
  ClearSoups: "soup",
  CreamSoups: "soup",
  MainMeat: "main",
  MainFish: "main",
  MainVegan: "main",
  Sides: "side",
  ColdSauces: "sauce",
  HotSauces: "sauce",
  Salads: "salad",
  HotDesserts: "dessert",
  ColdDesserts: "dessert",
};

// Season fitness by category
const SUMMER_FAVORED = ["Salads", "ColdDesserts", "ColdSauces", "MainFish", "MainVegan"];
const WINTER_FAVORED = ["CreamSoups", "ClearSoups", "HotDesserts", "HotSauces", "MainMeat"];

interface SuggestionResult {
  recipeId: number;
  recipeName: string;
  category: string;
  categoryLabel: string;
  score: number;
  reasons: string[];
  seasonTag?: string;
  tags: string[];
}

interface SuggestionOptions {
  locationId?: number;
  date: string;
  meal: string;
  currentMenuIds?: number[];
}

/**
 * Get recipe suggestions scored by variety, season, category balance, and recency.
 */
export async function getRecipeSuggestions(options: SuggestionOptions): Promise<SuggestionResult[]> {
  const { locationId, date, meal, currentMenuIds = [] } = options;

  // 1. Load all recipes
  const allRecipes = await storage.getRecipes();
  if (allRecipes.length === 0) return [];

  // 2. Get what's already planned for the week (Mon-Sun around the target date)
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay() || 7; // 1=Mon, 7=Sun
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - (dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = formatLocalDate(monday);
  const weekEnd = formatLocalDate(sunday);

  const weekPlans = await storage.getMenuPlans(weekStart, weekEnd);

  // Filter by location if specified
  const relevantPlans = locationId
    ? weekPlans.filter(p => p.locationId === locationId)
    : weekPlans;

  // Recipes already used this week
  const weekRecipeIds = new Set(relevantPlans.filter(p => p.recipeId).map(p => p.recipeId!));

  // Recipes already planned for this exact date+meal
  const dayMealPlans = relevantPlans.filter(p => p.date === date && p.meal === meal);
  const dayMealRecipeIds = new Set(dayMealPlans.filter(p => p.recipeId).map(p => p.recipeId!));
  const dayMealCategories = dayMealPlans
    .filter(p => p.recipeId)
    .map(p => {
      const recipe = allRecipes.find(r => r.id === p.recipeId);
      return recipe ? CATEGORY_GROUPS[recipe.category] || recipe.category : null;
    })
    .filter(Boolean) as string[];

  // 3. Get recent usage (last 4 weeks) for recency penalty
  const fourWeeksAgo = new Date(targetDate);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentStart = formatLocalDate(fourWeeksAgo);

  const recentPlans = await storage.getMenuPlans(recentStart, weekEnd);
  const recentRecipeUsage: Record<number, number> = {};
  for (const plan of recentPlans) {
    if (plan.recipeId) {
      recentRecipeUsage[plan.recipeId] = (recentRecipeUsage[plan.recipeId] || 0) + 1;
    }
  }

  // 4. Determine season
  const month = targetDate.getMonth() + 1; // 1-12
  let seasonType: "summer" | "winter" | "transition" = "transition";
  if (SUMMER_MONTHS.includes(month)) seasonType = "summer";
  else if (WINTER_MONTHS.includes(month)) seasonType = "winter";

  // 5. Score each recipe
  const scored: SuggestionResult[] = [];

  for (const recipe of allRecipes) {
    // Skip recipes already on current menu for this slot
    if (currentMenuIds.includes(recipe.id)) continue;
    if (dayMealRecipeIds.has(recipe.id)) continue;

    let score = 50; // Base score
    const reasons: string[] = [];

    // --- Variety bonus: not used this week ---
    if (!weekRecipeIds.has(recipe.id)) {
      score += 15;
      reasons.push("Nicht diese Woche geplant");
    } else {
      score -= 20;
      reasons.push("Bereits diese Woche eingeplant");
    }

    // --- Recency penalty: penalize recently used recipes ---
    const recentCount = recentRecipeUsage[recipe.id] || 0;
    if (recentCount === 0) {
      score += 10;
      reasons.push("Lange nicht verwendet");
    } else if (recentCount >= 3) {
      score -= 15;
      reasons.push(`${recentCount}x in letzten 4 Wochen`);
    } else if (recentCount >= 1) {
      score -= 5;
    }

    // --- Seasonal fit ---
    let seasonTag: string | undefined;
    const recipeSeason = recipe.season || "all";

    if (seasonType === "summer") {
      if (SUMMER_FAVORED.includes(recipe.category)) {
        score += 10;
        seasonTag = "Sommerlich";
        reasons.push("Passt zur Sommersaison");
      }
      if (recipeSeason === "summer" || recipeSeason === "all") {
        score += 5;
      }
      if (recipeSeason === "winter") {
        score -= 10;
        reasons.push("Wintergericht im Sommer");
      }
    } else if (seasonType === "winter") {
      if (WINTER_FAVORED.includes(recipe.category)) {
        score += 10;
        seasonTag = "Winterlich";
        reasons.push("Passt zur Wintersaison");
      }
      if (recipeSeason === "winter" || recipeSeason === "all") {
        score += 5;
      }
      if (recipeSeason === "summer") {
        score -= 10;
        reasons.push("Sommergericht im Winter");
      }
    } else {
      // Transition months: slight bonus for all-season recipes
      if (recipeSeason === "all") {
        score += 3;
        seasonTag = "Ganzjahres";
      }
    }

    // --- Category balance: avoid 2 of same category group in one meal ---
    const categoryGroup = CATEGORY_GROUPS[recipe.category] || recipe.category;
    const sameCategoryCount = dayMealCategories.filter(c => c === categoryGroup).length;
    if (sameCategoryCount > 0) {
      score -= 15 * sameCategoryCount;
      reasons.push(`Bereits ${sameCategoryCount}x ${categoryGroup} geplant`);
    } else {
      score += 5;
      reasons.push("Gute Kategoriebalance");
    }

    // --- Tags bonus ---
    const recipeTags = recipe.tags || [];
    if (recipeTags.includes("beliebt")) {
      score += 5;
      reasons.push("Beliebtes Gericht");
    }
    if (recipeTags.includes("schnell")) {
      score += 3;
    }

    // Get category label
    const catDef = RECIPE_CATEGORIES.find(c => c.id === recipe.category);
    const categoryLabel = catDef ? `${catDef.symbol} ${catDef.label}` : recipe.category;

    scored.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      category: recipe.category,
      categoryLabel,
      score: Math.max(0, Math.min(100, score)),
      reasons: reasons.slice(0, 3), // Top 3 reasons
      seasonTag,
      tags: recipeTags,
    });
  }

  // Sort by score descending, return top 10
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}

/**
 * Optional: Use Claude AI for more nuanced suggestions.
 * Falls back gracefully if API key is not set.
 */
export async function getAISuggestions(
  context: { recipeSuggestions: SuggestionResult[]; date: string; meal: string; plannedRecipes: string[] }
): Promise<{ enhanced: boolean; commentary?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { enhanced: false };
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const recipeList = context.recipeSuggestions
      .map((r, i) => `${i + 1}. ${r.recipeName} (${r.categoryLabel}, Score: ${r.score})`)
      .join("\n");

    const planned = context.plannedRecipes.length > 0
      ? `Bereits geplant: ${context.plannedRecipes.join(", ")}`
      : "Noch nichts geplant.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Du bist ein Küchenchef-Assistent. Bewerte diese Rezeptvorschläge für ${context.meal} am ${context.date}.

${planned}

Vorschläge:
${recipeList}

Gib eine kurze Empfehlung (2-3 Sätze) auf Deutsch, welche Kombination am besten passt.`,
      }],
    });

    const textBlock = message.content.find(b => b.type === "text");
    return {
      enhanced: true,
      commentary: textBlock?.text || undefined,
    };
  } catch (error) {
    console.error("AI suggestions failed, using algorithmic only:", error);
    return { enhanced: false };
  }
}

/**
 * Route handler: GET /api/recipes/suggestions
 */
export async function handleGetSuggestions(req: any, res: any): Promise<void> {
  try {
    const date = String(req.query.date || "");
    const meal = String(req.query.meal || "");
    const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
    const currentMenuIdsStr = String(req.query.currentMenuIds || "");
    const currentMenuIds = currentMenuIdsStr
      ? currentMenuIdsStr.split(",").map(Number).filter(n => !isNaN(n))
      : [];
    const useAI = req.query.ai === "true";

    if (!date || !meal) {
      res.status(400).json({ error: "date und meal sind erforderlich" });
      return;
    }

    const suggestions = await getRecipeSuggestions({ locationId, date, meal, currentMenuIds });

    let aiCommentary: string | undefined;
    if (useAI) {
      // Get names of currently planned recipes for context
      const weekPlans = await storage.getMenuPlans(date, date);
      const plannedRecipeIds = weekPlans.filter(p => p.recipeId).map(p => p.recipeId!);
      const allRecipes = await storage.getRecipes();
      const plannedNames = plannedRecipeIds
        .map(id => allRecipes.find(r => r.id === id)?.name)
        .filter(Boolean) as string[];

      const aiResult = await getAISuggestions({
        recipeSuggestions: suggestions,
        date,
        meal,
        plannedRecipes: plannedNames,
      });
      aiCommentary = aiResult.commentary;
    }

    res.json({
      suggestions,
      aiCommentary,
      meta: {
        date,
        meal,
        locationId,
        count: suggestions.length,
      },
    });
  } catch (error: any) {
    console.error("Recipe suggestions error:", error);
    res.status(500).json({ error: error.message });
  }
}

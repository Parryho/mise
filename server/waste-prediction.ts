/**
 * Waste Prediction: Identifies ingredients at risk of expiry based on
 * planned menus, ingredient shelf life, and usage patterns.
 */

import { db } from "./db";
import { storage } from "./storage";
import { menuPlans, ingredients, recipes, masterIngredients } from "@shared/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";
import { INGREDIENT_CATEGORIES } from "@shared/constants";
import type { Recipe, Ingredient, MasterIngredient } from "@shared/schema";

// Estimated shelf life in days by ingredient category
const SHELF_LIFE_DAYS: Record<string, number> = {
  fleisch: 2,
  fisch: 1,
  milchprodukte: 5,
  gemuese: 4,
  trockenwaren: 30,
  gewuerze: 90,
  eier_fette: 7,
  obst: 3,
  tiefkuehl: 90,
  sonstiges: 7,
};

interface AtRiskIngredient {
  ingredientName: string;
  category: string;
  categoryLabel: string;
  plannedDate: string;
  expiryEstimate: string;
  daysUntilExpiry: number;
  riskLevel: "red" | "yellow" | "green";
  usedInRecipes: string[];
  suggestedRecipes: Array<{
    recipeId: number;
    recipeName: string;
    category: string;
  }>;
}

interface WastePredictionResult {
  atRisk: AtRiskIngredient[];
  summary: {
    totalAtRisk: number;
    redCount: number;
    yellowCount: number;
    greenCount: number;
    topCategories: Array<{ category: string; label: string; count: number }>;
  };
}

/**
 * Analyze planned menus to identify ingredients that may go to waste.
 * Looks at ingredients planned early in the date range but not used later.
 */
export async function getWastePredictions(
  locationId: number | undefined,
  startDate: string,
  endDate: string
): Promise<WastePredictionResult> {
  // 1. Get all menu plans in the date range
  const plans = await storage.getMenuPlans(startDate, endDate);
  const filteredPlans = locationId
    ? plans.filter(p => p.locationId === locationId)
    : plans;

  if (filteredPlans.length === 0) {
    return {
      atRisk: [],
      summary: { totalAtRisk: 0, redCount: 0, yellowCount: 0, greenCount: 0, topCategories: [] },
    };
  }

  // 2. Get all recipes and their ingredients
  const recipeIds = Array.from(new Set(filteredPlans.filter(p => p.recipeId).map(p => p.recipeId!)));
  const allRecipes = await storage.getRecipes();
  const recipeMap: Record<number, Recipe> = {};
  for (const r of allRecipes) recipeMap[r.id] = r;

  // Fetch ingredients for all used recipes
  const allIngredients: Array<Ingredient & { recipeName: string }> = [];
  for (const recipeId of recipeIds) {
    const ings = await storage.getIngredients(recipeId);
    const recipe = recipeMap[recipeId];
    for (const ing of ings) {
      allIngredients.push({ ...ing, recipeName: recipe?.name || `#${recipeId}` });
    }
  }

  // 3. Get master ingredients for category/shelf life info
  const masterIngs = await storage.getMasterIngredients();
  const masterByName: Record<string, MasterIngredient> = {};
  for (const mi of masterIngs) {
    masterByName[mi.name.toLowerCase()] = mi;
  }

  // 4. Build an ingredient-to-dates map: when each ingredient is used
  interface IngredientUsage {
    name: string;
    category: string;
    dates: string[];
    recipes: string[];
  }

  const ingredientUsage: Record<string, IngredientUsage> = {};

  for (const plan of filteredPlans) {
    if (!plan.recipeId) continue;
    const recipe = recipeMap[plan.recipeId];
    if (!recipe) continue;

    const recipeIngs = allIngredients.filter(i => i.recipeId === plan.recipeId);
    for (const ing of recipeIngs) {
      const key = ing.name.toLowerCase();
      if (!ingredientUsage[key]) {
        const master = masterByName[key];
        ingredientUsage[key] = {
          name: ing.name,
          category: master?.category || "sonstiges",
          dates: [],
          recipes: [],
        };
      }
      if (!ingredientUsage[key].dates.includes(plan.date)) {
        ingredientUsage[key].dates.push(plan.date);
      }
      if (!ingredientUsage[key].recipes.includes(recipe.name)) {
        ingredientUsage[key].recipes.push(recipe.name);
      }
    }
  }

  // 5. For each ingredient, check if it's at risk
  // An ingredient is at risk if:
  //   - It's used early in the range (day 1-2) but not later
  //   - Its shelf life is short
  //   - There's a gap between uses that exceeds shelf life
  const atRisk: AtRiskIngredient[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  for (const [key, usage] of Object.entries(ingredientUsage)) {
    const shelfLife = SHELF_LIFE_DAYS[usage.category] || 7;

    // Skip long-shelf-life items
    if (shelfLife >= 30) continue;

    // Sort dates
    const sortedDates = [...usage.dates].sort();
    const firstUseDate = sortedDates[0];
    const lastUseDate = sortedDates[sortedDates.length - 1];

    // Calculate expiry estimate from first planned use
    const firstDate = new Date(firstUseDate);
    const expiryDate = new Date(firstDate);
    expiryDate.setDate(firstDate.getDate() + shelfLife);
    const expiryStr = expiryDate.toISOString().split("T")[0];

    // Check if there are dates after shelf life expires with no use
    // (ingredient bought for first use, may expire before next use)
    const endDateObj = new Date(endDate);
    const hasLaterUse = sortedDates.some(d => {
      const dDate = new Date(d);
      return dDate > expiryDate;
    });

    // If ingredient only used on one day and has short shelf life, or
    // if there's a gap longer than shelf life between uses
    let isAtRisk = false;
    let riskReason = "";

    if (sortedDates.length === 1 && shelfLife <= 5) {
      // Only used once with short shelf life -> leftover risk
      isAtRisk = true;
      riskReason = "Nur einmal geplant, kurze Haltbarkeit";
    }

    // Check gaps between consecutive uses
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);
      const gapDays = Math.ceil((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (gapDays > shelfLife) {
        isAtRisk = true;
        riskReason = `${gapDays} Tage Pause zwischen Einsätzen (Haltbarkeit: ${shelfLife} Tage)`;
        break;
      }
    }

    if (!isAtRisk) continue;

    // Calculate days until expiry from today or from first planned date
    const referenceDate = firstDate > today ? firstDate : today;
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine risk level
    let riskLevel: "red" | "yellow" | "green" = "green";
    if (daysUntilExpiry <= 1) riskLevel = "red";
    else if (daysUntilExpiry <= 3) riskLevel = "yellow";

    // Find other recipes that use this ingredient (not already planned)
    const suggestedRecipes: AtRiskIngredient["suggestedRecipes"] = [];
    for (const recipe of allRecipes) {
      if (recipeIds.includes(recipe.id)) continue; // Already in plan
      const recipeIngs = await storage.getIngredients(recipe.id);
      const usesIngredient = recipeIngs.some(
        ri => ri.name.toLowerCase() === key
      );
      if (usesIngredient) {
        suggestedRecipes.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          category: recipe.category,
        });
        if (suggestedRecipes.length >= 3) break; // Limit suggestions
      }
    }

    const categoryLabel = INGREDIENT_CATEGORIES[usage.category] || usage.category;

    atRisk.push({
      ingredientName: usage.name,
      category: usage.category,
      categoryLabel,
      plannedDate: firstUseDate,
      expiryEstimate: expiryStr,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      riskLevel,
      usedInRecipes: usage.recipes,
      suggestedRecipes,
    });
  }

  // Sort: red first, then yellow, then green; within same level by days
  const riskOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  atRisk.sort((a, b) => {
    const levelDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (levelDiff !== 0) return levelDiff;
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  // Summary
  const redCount = atRisk.filter(i => i.riskLevel === "red").length;
  const yellowCount = atRisk.filter(i => i.riskLevel === "yellow").length;
  const greenCount = atRisk.filter(i => i.riskLevel === "green").length;

  // Top categories
  const categoryCount: Record<string, number> = {};
  for (const item of atRisk) {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  }
  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      label: INGREDIENT_CATEGORIES[category] || category,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    atRisk,
    summary: {
      totalAtRisk: atRisk.length,
      redCount,
      yellowCount,
      greenCount,
      topCategories,
    },
  };
}

/**
 * Route handler: GET /api/analytics/waste-prediction
 */
export async function handleGetWastePrediction(req: any, res: any): Promise<void> {
  try {
    const startDate = String(req.query.startDate || "");
    const endDate = String(req.query.endDate || "");
    const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;

    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate und endDate sind erforderlich" });
      return;
    }

    const result = await getWastePredictions(locationId, startDate, endDate);
    res.json(result);
  } catch (error: any) {
    console.error("Waste prediction error:", error);
    res.status(500).json({ error: error.message });
  }
}

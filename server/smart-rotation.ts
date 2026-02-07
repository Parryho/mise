/**
 * Smart Rotation — AI-powered rotation optimizer using Claude API.
 *
 * Analyzes the 6-week meal rotation for variety, seasonality, cost optimization,
 * and allergen balance, and suggests swaps to improve the rotation.
 *
 * NOTE: "@anthropic-ai/sdk" is NOT in package.json — install with:
 *   npm install @anthropic-ai/sdk
 */

import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import type { Recipe, RotationSlot } from "@shared/schema";
import { RECIPE_CATEGORIES } from "@shared/schema";
import { MEAL_SLOTS, MEAL_SLOT_LABELS, type MealSlotName } from "@shared/constants";
import type { Request, Response } from "express";

// ── Types ───────────────────────────────────────────────────────────────

interface OptimizeOptions {
  focusSeason?: boolean;
  focusCost?: boolean;
  focusVariety?: boolean;
}

interface SuggestedSwap {
  weekNr: number;
  dayOfWeek: number;
  meal: string;
  course: string;
  currentRecipeId: number | null;
  currentRecipeName: string | null;
  suggestedRecipeId: number;
  suggestedRecipeName: string;
  reason: string;
}

interface RotationAnalysis {
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  fillPercentage: number;
  varietyScore: number;            // 0-100
  allergenCoverage: Record<string, number>;
  categoryDistribution: Record<string, number>;
  duplicatesPerWeek: Record<number, number>;
  recipesUsedMultipleTimes: { recipeId: number; recipeName: string; count: number }[];
  weeklyBalance: { weekNr: number; filled: number; total: number }[];
  seasonalFit: number;           // 0-100
}

// ── Helpers ─────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: "Sonntag",
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
};

function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0-based
  if (month >= 2 && month <= 4) return "fruehling";
  if (month >= 5 && month <= 7) return "sommer";
  if (month >= 8 && month <= 10) return "herbst";
  return "winter";
}

function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    fruehling: "Frühling",
    sommer: "Sommer",
    herbst: "Herbst",
    winter: "Winter",
    all: "Ganzjährig",
  };
  return labels[season] || season;
}

function getCategoryLabel(categoryId: string): string {
  const found = RECIPE_CATEGORIES.find((c) => c.id === categoryId);
  return found ? found.label : categoryId;
}

// ── Analysis (no AI) ────────────────────────────────────────────────────

export async function getRotationAnalysis(
  templateId: number
): Promise<RotationAnalysis> {
  const allSlots = await storage.getRotationSlots(templateId);
  const allRecipes = await storage.getRecipes();
  const recipeMap = new Map<number, Recipe>();
  for (const r of allRecipes) recipeMap.set(r.id, r);

  const currentSeason = getCurrentSeason();

  const totalSlots = allSlots.length;
  const filledSlots = allSlots.filter((s) => s.recipeId !== null).length;
  const emptySlots = totalSlots - filledSlots;
  const fillPercentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  // Variety score: count unique recipes vs total filled (excluding dessert)
  const nonDessertFilled = allSlots.filter(
    (s) => s.recipeId !== null && s.course !== "dessert"
  );
  const uniqueRecipes = new Set(nonDessertFilled.map((s) => s.recipeId));
  const varietyScore =
    nonDessertFilled.length > 0
      ? Math.round((uniqueRecipes.size / nonDessertFilled.length) * 100)
      : 0;

  // Allergen coverage: how many slots have each allergen
  const allergenCoverage: Record<string, number> = {};
  for (const slot of allSlots) {
    if (!slot.recipeId) continue;
    const recipe = recipeMap.get(slot.recipeId);
    if (!recipe || !recipe.allergens) continue;
    for (const allergen of recipe.allergens) {
      allergenCoverage[allergen] = (allergenCoverage[allergen] || 0) + 1;
    }
  }

  // Category distribution
  const categoryDistribution: Record<string, number> = {};
  for (const slot of allSlots) {
    if (!slot.recipeId) continue;
    const recipe = recipeMap.get(slot.recipeId);
    if (!recipe) continue;
    const label = getCategoryLabel(recipe.category);
    categoryDistribution[label] = (categoryDistribution[label] || 0) + 1;
  }

  // Duplicates per week: same recipe used on same day within a week
  const duplicatesPerWeek: Record<number, number> = {};
  for (let w = 1; w <= 6; w++) {
    const weekSlots = allSlots.filter((s) => s.weekNr === w);
    let dupes = 0;
    for (let dow = 0; dow <= 6; dow++) {
      const daySlots = weekSlots.filter(
        (s) => s.dayOfWeek === dow && s.recipeId !== null && s.course !== "dessert"
      );
      const seen = new Set<number>();
      for (const s of daySlots) {
        if (seen.has(s.recipeId!)) dupes++;
        else seen.add(s.recipeId!);
      }
    }
    duplicatesPerWeek[w] = dupes;
  }

  // Recipes used multiple times
  const recipeCounts = new Map<number, number>();
  for (const slot of nonDessertFilled) {
    recipeCounts.set(slot.recipeId!, (recipeCounts.get(slot.recipeId!) || 0) + 1);
  }
  const recipesUsedMultipleTimes = Array.from(recipeCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([recipeId, count]) => ({
      recipeId,
      recipeName: recipeMap.get(recipeId)?.name || `Rezept #${recipeId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Weekly balance
  const weeklyBalance: { weekNr: number; filled: number; total: number }[] = [];
  for (let w = 1; w <= 6; w++) {
    const weekSlots = allSlots.filter((s) => s.weekNr === w);
    const filled = weekSlots.filter(
      (s) => s.recipeId !== null || s.course === "dessert"
    ).length;
    weeklyBalance.push({ weekNr: w, filled, total: weekSlots.length });
  }

  // Seasonal fit: how many filled slots have a recipe that matches current season or "all"
  let seasonalMatch = 0;
  let seasonalTotal = 0;
  for (const slot of allSlots) {
    if (!slot.recipeId || slot.course === "dessert") continue;
    const recipe = recipeMap.get(slot.recipeId);
    if (!recipe) continue;
    seasonalTotal++;
    if (recipe.season === "all" || recipe.season === currentSeason) {
      seasonalMatch++;
    }
  }
  const seasonalFit =
    seasonalTotal > 0 ? Math.round((seasonalMatch / seasonalTotal) * 100) : 0;

  return {
    totalSlots,
    filledSlots,
    emptySlots,
    fillPercentage,
    varietyScore,
    allergenCoverage,
    categoryDistribution,
    duplicatesPerWeek,
    recipesUsedMultipleTimes,
    weeklyBalance,
    seasonalFit,
  };
}

// ── AI Optimization ─────────────────────────────────────────────────────

export async function optimizeRotation(
  templateId: number,
  options: OptimizeOptions = {}
): Promise<{ swaps: SuggestedSwap[]; summary: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ist nicht konfiguriert. Bitte in den Umgebungsvariablen setzen."
    );
  }

  const anthropic = new Anthropic({ apiKey });

  const allSlots = await storage.getRotationSlots(templateId);
  const allRecipes = await storage.getRecipes();
  const recipeMap = new Map<number, Recipe>();
  for (const r of allRecipes) recipeMap.set(r.id, r);

  const currentSeason = getCurrentSeason();

  // Build rotation summary for the prompt
  const rotationLines: string[] = [];
  for (let w = 1; w <= 6; w++) {
    rotationLines.push(`\n=== Woche ${w} ===`);
    const weekSlots = allSlots
      .filter((s) => s.weekNr === w)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.meal.localeCompare(b.meal));

    for (let dow = 0; dow <= 6; dow++) {
      const daySlots = weekSlots.filter((s) => s.dayOfWeek === dow);
      if (daySlots.length === 0) continue;
      rotationLines.push(`  ${DAY_LABELS[dow]}:`);

      for (const slot of daySlots) {
        const recipe = slot.recipeId ? recipeMap.get(slot.recipeId) : null;
        const recipeName = recipe ? recipe.name : "(leer)";
        const allergens =
          recipe && recipe.allergens && recipe.allergens.length > 0
            ? ` [Allergene: ${recipe.allergens.join(", ")}]`
            : "";
        const season =
          recipe && recipe.season !== "all"
            ? ` [Saison: ${getSeasonLabel(recipe.season)}]`
            : "";
        const category = recipe ? ` (${getCategoryLabel(recipe.category)})` : "";
        const courseLabel =
          MEAL_SLOT_LABELS[slot.course as MealSlotName] || slot.course;
        rotationLines.push(
          `    ${slot.locationSlug} ${slot.meal} | ${courseLabel}: ${recipeName}${category}${allergens}${season} [slotId:${slot.id}, recipeId:${slot.recipeId || "null"}]`
        );
      }
    }
  }

  // Build available recipes list
  const recipeLines: string[] = allRecipes.map((r) => {
    const allergens =
      r.allergens && r.allergens.length > 0
        ? ` [Allergene: ${r.allergens.join(", ")}]`
        : "";
    const season =
      r.season !== "all" ? ` [Saison: ${getSeasonLabel(r.season)}]` : "";
    return `  ID:${r.id} "${r.name}" (${getCategoryLabel(r.category)})${allergens}${season} PrepTime:${r.prepTime}min`;
  });

  // Build focus areas
  const focusAreas: string[] = [];
  if (options.focusVariety !== false) {
    focusAreas.push(
      "- ABWECHSLUNG: Dasselbe Gericht sollte nicht innerhalb von 2 Wochen wiederholt werden. Vermeide Wiederholungen auf demselben Wochentag."
    );
  }
  if (options.focusSeason) {
    focusAreas.push(
      `- SAISON: Aktuelle Saison ist ${getSeasonLabel(currentSeason)}. Bevorzuge Rezepte die zur aktuellen Saison passen oder ganzjährig sind.`
    );
  }
  if (options.focusCost) {
    focusAreas.push(
      "- KOSTEN: Bevorzuge Rezepte mit kürzerer Zubereitungszeit und einfacheren Zutaten. Vermeide teure Hauptzutaten wie Fisch wenn günstigere Alternativen passen."
    );
  }
  if (focusAreas.length === 0) {
    focusAreas.push(
      "- ABWECHSLUNG: Dasselbe Gericht sollte nicht innerhalb von 2 Wochen wiederholt werden."
    );
  }

  const systemPrompt = `Du bist ein erfahrener Küchenchef-Berater für Großküchen in österreichischen Hotels.
Du analysierst 6-Wochen-Rotationspläne und schlägst konkrete Verbesserungen vor.

Antworte immer im folgenden JSON-Format (kein Markdown, nur JSON):
{
  "swaps": [
    {
      "weekNr": <number 1-6>,
      "dayOfWeek": <number 0=So, 1=Mo, ..., 6=Sa>,
      "meal": "<lunch|dinner>",
      "course": "<soup|main1|side1a|side1b|main2|side2a|side2b|dessert>",
      "currentRecipeId": <number|null>,
      "currentRecipeName": "<string|null>",
      "suggestedRecipeId": <number>,
      "suggestedRecipeName": "<string>",
      "reason": "<kurze Begründung auf Deutsch>"
    }
  ],
  "summary": "<2-3 Sätze Zusammenfassung der Optimierung auf Deutsch>"
}

Regeln:
- Schlage nur Rezepte vor die in der verfügbaren Rezeptliste existieren (verwende die exakte ID).
- Ersetze ein Rezept nur durch ein Rezept der GLEICHEN Kategorie (z.B. Suppe durch Suppe, Beilage durch Beilage).
- Behalte Dessert-Slots bei — diese sind fest ("Dessertvariation"), nicht ändern.
- Schlage maximal 15 Swaps vor, priorisiere die wichtigsten.
- Beachte die unten genannten Optimierungsschwerpunkte.`;

  const userPrompt = `Analysiere die folgende 6-Wochen-Rotation und schlage Verbesserungen vor.

OPTIMIERUNGSSCHWERPUNKTE:
${focusAreas.join("\n")}

AKTUELLE ROTATION:
${rotationLines.join("\n")}

VERFÜGBARE REZEPTE:
${recipeLines.join("\n")}

Analysiere die Rotation und schlage konkrete Tausch-Vorschläge vor. Antworte nur mit dem JSON-Objekt.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  // Extract text from response
  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON from response (may be wrapped in code fences)
  let jsonStr = responseText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: { swaps: SuggestedSwap[]; summary: string };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      "KI-Antwort konnte nicht geparst werden. Bitte erneut versuchen."
    );
  }

  // Validate that suggested recipes actually exist
  const validSwaps = (parsed.swaps || []).filter((swap) => {
    if (!swap.suggestedRecipeId) return false;
    return recipeMap.has(swap.suggestedRecipeId);
  });

  return {
    swaps: validSwaps,
    summary: parsed.summary || "Optimierung abgeschlossen.",
  };
}

// ── API Handlers ────────────────────────────────────────────────────────

export async function handleOptimizeRotation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { templateId, options } = req.body;
    if (!templateId) {
      res.status(400).json({ error: "templateId erforderlich" });
      return;
    }

    const template = await storage.getRotationTemplate(templateId);
    if (!template) {
      res.status(404).json({ error: "Rotation-Template nicht gefunden" });
      return;
    }

    const result = await optimizeRotation(templateId, options || {});
    res.json(result);
  } catch (error: any) {
    console.error("Smart rotation optimize error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleGetAnalysis(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const templateId = parseInt(String(req.params.templateId));
    if (isNaN(templateId)) {
      res.status(400).json({ error: "Ungültige templateId" });
      return;
    }

    const template = await storage.getRotationTemplate(templateId);
    if (!template) {
      res.status(404).json({ error: "Rotation-Template nicht gefunden" });
      return;
    }

    const analysis = await getRotationAnalysis(templateId);
    res.json(analysis);
  } catch (error: any) {
    console.error("Smart rotation analysis error:", error);
    res.status(500).json({ error: error.message });
  }
}

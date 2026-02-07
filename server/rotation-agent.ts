/**
 * Küchenchef-Agent: Rule-based auto-fill for rotation slots.
 *
 * Kulinarische Regeln:
 * - side1a/side2a = NUR Stärkebeilage (Reis, Knödel, Kartoffeln, Spätzle etc.)
 * - side1b/side2b = NUR Gemüsebeilage (Bratgemüse, Rotkraut, Sauerkraut etc.)
 * - Alles mit Tag "kein-rotation" wird IGNORIERT (Salate, Jause, Aufstriche, Frühstück)
 * - Dessert ist immer "Dessertvariation" (nicht auto-filled)
 * - Keine 2× gleiche Beilagen-Art am selben Tag (z.B. nicht Pommes + Bratkartoffeln)
 * - Keine Wiederholung am selben Tag (Mittag ≠ Abend)
 * - Jeder Standort bekommt unabhängige Rezept-Rotation
 */

import { storage } from "./storage";
import type { Recipe, RotationSlot } from "@shared/schema";
import type { MealSlotName } from "@shared/constants";

// ============================================================
// Kulinarische Gruppen für Stärkebeilagen (Kollisionsvermeidung)
// ============================================================
const STARCH_GROUPS: Record<string, string> = {
  "Reis": "reis",
  "Spätzle": "teig",
  "Butternockerl": "teig",
  "Semmelknödel": "knödel",
  "Serviettenknödel": "knödel",
  "Petersilkartoffeln": "kartoffel",
  "Bratkartoffeln": "kartoffel",
  "Erdäpfelpüree": "kartoffel",
  "Pommes Frites": "kartoffel",
  "Kroketten": "kartoffel",
};

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Get the starch group of a recipe (for collision avoidance) */
function getStarchGroup(recipe: Recipe): string {
  return STARCH_GROUPS[recipe.name] || recipe.name.toLowerCase();
}

// ============================================================
// Pool-based iterator with collision avoidance
// ============================================================
interface RecipePool {
  recipes: Recipe[];
  idx: number;
}

function createPool(recipes: Recipe[]): RecipePool {
  return { recipes: shuffle([...recipes]), idx: 0 };
}

/**
 * Pick next recipe from pool, avoiding:
 * - Same recipe used today (usedIds)
 * - Same starch group used today for starch pools (usedStarchGroups)
 */
function pickNext(
  pool: RecipePool,
  usedIds: Set<number>,
  usedStarchGroups?: Set<string>,
): Recipe | null {
  if (pool.recipes.length === 0) return null;

  for (let attempt = 0; attempt < pool.recipes.length; attempt++) {
    const recipe = pool.recipes[pool.idx % pool.recipes.length];
    pool.idx++;

    if (usedIds.has(recipe.id)) continue;

    // For starch sides: avoid same group (no 2× Kartoffel, no 2× Knödel)
    if (usedStarchGroups) {
      const group = getStarchGroup(recipe);
      if (usedStarchGroups.has(group)) continue;
    }

    return recipe;
  }

  // Fallback: just pick one (all collide)
  const recipe = pool.recipes[pool.idx % pool.recipes.length];
  pool.idx++;
  return recipe;
}

// ============================================================
// Main auto-fill logic
// ============================================================
interface AutoFillOptions {
  overwrite?: boolean;
}

export async function autoFillRotation(
  templateId: number,
  options: AutoFillOptions = {}
): Promise<{ filled: number; skipped: number }> {
  const { overwrite = false } = options;

  const recipes = await storage.getRecipes();
  const allSlots = await storage.getRotationSlots(templateId);

  // ── Build recipe pools by role ──
  const soups: Recipe[] = [];
  const mainsMeat: Recipe[] = [];
  const mainsVegan: Recipe[] = [];
  const sidesStarch: Recipe[] = [];
  const sidesVeg: Recipe[] = [];

  for (const r of recipes) {
    // Skip anything tagged kein-rotation
    if (r.tags && r.tags.includes("kein-rotation")) continue;

    switch (r.category) {
      case "ClearSoups":
      case "CreamSoups":
        soups.push(r);
        break;
      case "MainMeat":
      case "MainFish":
        mainsMeat.push(r);
        break;
      case "MainVegan":
        mainsVegan.push(r);
        break;
      case "Sides":
        // Only use tagged sides
        if (r.tags && r.tags.includes("stärke")) {
          sidesStarch.push(r);
        } else if (r.tags && r.tags.includes("gemüse")) {
          sidesVeg.push(r);
        }
        // Untagged sides are skipped (safety net)
        break;
      // Salads, Sauces, Desserts = not used in rotation
    }
  }

  console.log(`[rotation-agent] Pools: ${soups.length} Suppen, ${mainsMeat.length} Fleisch, ${mainsVegan.length} Vegan, ${sidesStarch.length} Stärke, ${sidesVeg.length} Gemüse`);

  // ── Create per-location pools ──
  const locationSlugs = Array.from(new Set(allSlots.map(s => s.locationSlug)));

  type LocationPools = {
    soup: RecipePool;
    main1: RecipePool;
    main2: RecipePool;
    starch: RecipePool;
    veg: RecipePool;
  };

  const poolsByLocation = new Map<string, LocationPools>();
  for (const loc of locationSlugs) {
    poolsByLocation.set(loc, {
      soup: createPool(soups),
      main1: createPool(mainsMeat),
      main2: createPool(mainsVegan),
      starch: createPool(sidesStarch),
      veg: createPool(sidesVeg),
    });
  }

  // ── Group slots for lookup ──
  const slotGroups = new Map<string, RotationSlot[]>();
  for (const slot of allSlots) {
    const key = `${slot.weekNr}-${slot.dayOfWeek}-${slot.locationSlug}-${slot.meal}`;
    const group = slotGroups.get(key) || [];
    group.push(slot);
    slotGroups.set(key, group);
  }

  let filled = 0;
  let skipped = 0;

  const weekNrs = Array.from(new Set(allSlots.map(s => s.weekNr))).sort();
  const daysOfWeek = Array.from(new Set(allSlots.map(s => s.dayOfWeek))).sort();

  for (const weekNr of weekNrs) {
    for (const dow of daysOfWeek) {
      for (const locSlug of locationSlugs) {
        const pools = poolsByLocation.get(locSlug)!;

        // Track per-day collisions
        const usedIds = new Set<number>();
        const usedStarchGroups = new Set<string>();

        for (const meal of ["lunch", "dinner"]) {
          const key = `${weekNr}-${dow}-${locSlug}-${meal}`;
          const groupSlots = slotGroups.get(key) || [];

          // Sort slots so we fill in order: soup → main1 → side1a → side1b → main2 → side2a → side2b → dessert
          const slotOrder: MealSlotName[] = ["soup", "main1", "side1a", "side1b", "main2", "side2a", "side2b", "dessert"];
          const sorted = [...groupSlots].sort((a, b) => {
            const ai = slotOrder.indexOf(a.course as MealSlotName);
            const bi = slotOrder.indexOf(b.course as MealSlotName);
            return ai - bi;
          });

          for (const slot of sorted) {
            // Dessert = always "Dessertvariation" (handled in UI, not auto-filled)
            if (slot.course === "dessert") {
              if (overwrite && slot.recipeId !== null) {
                await storage.updateRotationSlot(slot.id, { recipeId: null });
              }
              skipped++;
              continue;
            }

            // Skip already filled slots (unless overwrite)
            if (slot.recipeId !== null && !overwrite) {
              usedIds.add(slot.recipeId);
              // Track starch group for existing starch sides
              if (slot.course === "side1a" || slot.course === "side2a") {
                const existing = recipes.find(r => r.id === slot.recipeId);
                if (existing) usedStarchGroups.add(getStarchGroup(existing));
              }
              skipped++;
              continue;
            }

            // ── Pick recipe based on slot type ──
            let picked: Recipe | null = null;

            switch (slot.course) {
              case "soup":
                picked = pickNext(pools.soup, usedIds);
                break;
              case "main1":
                picked = pickNext(pools.main1, usedIds);
                break;
              case "main2":
                picked = pickNext(pools.main2, usedIds);
                break;
              case "side1a":
              case "side2a":
                // Stärkebeilage — with starch group collision avoidance
                picked = pickNext(pools.starch, usedIds, usedStarchGroups);
                if (picked) usedStarchGroups.add(getStarchGroup(picked));
                break;
              case "side1b":
              case "side2b":
                // Gemüsebeilage
                picked = pickNext(pools.veg, usedIds);
                break;
            }

            if (picked === null) {
              skipped++;
              continue;
            }

            await storage.updateRotationSlot(slot.id, { recipeId: picked.id });
            usedIds.add(picked.id);
            filled++;
          }
        }
      }
    }
  }

  return { filled, skipped };
}

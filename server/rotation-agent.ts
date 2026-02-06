/**
 * Küchenchef-Agent: Rule-based auto-fill for rotation slots.
 * Maps recipe categories to meal slot types and distributes recipes
 * across the 6-week rotation using round-robin with collision avoidance.
 *
 * Rules:
 * - No salads in the menu (salads are self-service buffet)
 * - Dessert is always "Dessertvariation" (not auto-filled)
 * - Each location gets an independent recipe rotation
 * - Same recipe should not appear on the same day across meals
 * - Beilagen (sides) are only from the Sides category
 */

import { storage } from "./storage";
import type { Recipe, RotationSlot } from "@shared/schema";
import type { MealSlotName } from "@shared/constants";

// Map each course slot to matching recipe categories
// NO Salads, NO Desserts (dessert is hardcoded "Dessertvariation")
const SLOT_CATEGORY_MAP: Partial<Record<MealSlotName, string[]>> = {
  soup: ["ClearSoups", "CreamSoups"],
  main1: ["MainMeat", "MainFish"],
  side1a: ["Sides"],
  side1b: ["Sides"],
  main2: ["MainVegan"],
  side2a: ["Sides"],
  side2b: ["Sides"],
  // dessert: intentionally omitted — always "Dessertvariation A,C,G"
};

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Create fresh round-robin iterators for a given recipe pool */
function buildIterators(recipesByCategory: Map<string, Recipe[]>) {
  const iterators = new Map<string, { pool: Recipe[]; idx: number }>();
  for (const [course, categories] of Object.entries(SLOT_CATEGORY_MAP)) {
    const pool: Recipe[] = [];
    for (const cat of categories!) {
      const catRecipes = recipesByCategory.get(cat) || [];
      pool.push(...catRecipes);
    }
    // Each location gets a fresh shuffle
    shuffle(pool);
    iterators.set(course, { pool: [...pool], idx: 0 });
  }
  return iterators;
}

interface AutoFillOptions {
  /** If true, overwrite existing recipe assignments */
  overwrite?: boolean;
}

export async function autoFillRotation(
  templateId: number,
  options: AutoFillOptions = {}
): Promise<{ filled: number; skipped: number }> {
  const { overwrite = false } = options;

  const recipes = await storage.getRecipes();
  const allSlots = await storage.getRotationSlots(templateId);

  // Group recipes by category
  const recipesByCategory = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const list = recipesByCategory.get(r.category) || [];
    list.push(r);
    recipesByCategory.set(r.category, list);
  }

  // Create SEPARATE iterators per location so each gets different recipes
  const locationSlugs = [...new Set(allSlots.map(s => s.locationSlug))];
  const iteratorsByLocation = new Map<string, Map<string, { pool: Recipe[]; idx: number }>>();
  for (const loc of locationSlugs) {
    iteratorsByLocation.set(loc, buildIterators(recipesByCategory));
  }

  // Helper: get next recipe from location-specific iterator
  function nextRecipe(locSlug: string, course: string, usedToday: Set<number>): number | null {
    const locIterators = iteratorsByLocation.get(locSlug);
    if (!locIterators) return null;
    const iter = locIterators.get(course);
    if (!iter || iter.pool.length === 0) return null;

    // Try each recipe in pool once, avoiding same-day collisions
    for (let attempt = 0; attempt < iter.pool.length; attempt++) {
      const recipe = iter.pool[iter.idx % iter.pool.length];
      iter.idx++;
      if (!usedToday.has(recipe.id)) {
        return recipe.id;
      }
    }
    // If all collide, just pick the current one
    const recipe = iter.pool[iter.idx % iter.pool.length];
    iter.idx++;
    return recipe.id;
  }

  // Group slots for lookup
  const slotGroups = new Map<string, RotationSlot[]>();
  for (const slot of allSlots) {
    const key = `${slot.weekNr}-${slot.dayOfWeek}-${slot.locationSlug}-${slot.meal}`;
    const group = slotGroups.get(key) || [];
    group.push(slot);
    slotGroups.set(key, group);
  }

  let filled = 0;
  let skipped = 0;

  const weekNrs = [...new Set(allSlots.map(s => s.weekNr))].sort();
  const daysOfWeek = [...new Set(allSlots.map(s => s.dayOfWeek))].sort();

  for (const weekNr of weekNrs) {
    for (const dow of daysOfWeek) {
      // Track used recipes per day per location (to avoid lunch=dinner same dish)
      const usedByLocation = new Map<string, Set<number>>();
      for (const loc of locationSlugs) usedByLocation.set(loc, new Set());

      for (const locSlug of locationSlugs) {
        const usedToday = usedByLocation.get(locSlug)!;

        for (const meal of ["lunch", "dinner"]) {
          const key = `${weekNr}-${dow}-${locSlug}-${meal}`;
          const groupSlots = slotGroups.get(key) || [];

          for (const slot of groupSlots) {
            // Skip dessert — always "Dessertvariation A,C,G" (handled in UI)
            if (slot.course === "dessert") {
              // Clear dessert slot if overwriting
              if (overwrite && slot.recipeId !== null) {
                await storage.updateRotationSlot(slot.id, { recipeId: null });
              }
              skipped++;
              continue;
            }

            if (slot.recipeId !== null && !overwrite) {
              skipped++;
              usedToday.add(slot.recipeId);
              continue;
            }

            const recipeId = nextRecipe(locSlug, slot.course, usedToday);
            if (recipeId === null) {
              skipped++;
              continue;
            }

            await storage.updateRotationSlot(slot.id, { recipeId });
            usedToday.add(recipeId);
            filled++;
          }
        }
      }
    }
  }

  return { filled, skipped };
}

/**
 * Küchenchef-Agent: Rule-based auto-fill for rotation slots.
 * Maps recipe categories to meal slot types and distributes recipes
 * across the 6-week rotation using round-robin with collision avoidance.
 */

import { storage } from "./storage";
import type { Recipe, RotationSlot } from "@shared/schema";
import type { MealSlotName } from "@shared/constants";

// Map each course slot to matching recipe categories
const SLOT_CATEGORY_MAP: Record<MealSlotName, string[]> = {
  soup: ["ClearSoups", "CreamSoups"],
  main1: ["MainMeat", "MainFish"],
  side1a: ["Sides"],
  side1b: ["Sides", "Salads"],
  main2: ["MainVegan"],
  side2a: ["Sides"],
  side2b: ["Sides", "Salads"],
  dessert: ["HotDesserts", "ColdDesserts"],
};

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

  // Build round-robin iterators per course type
  const courseIterators = new Map<MealSlotName, { pool: Recipe[]; idx: number }>();
  for (const [course, categories] of Object.entries(SLOT_CATEGORY_MAP)) {
    const pool: Recipe[] = [];
    for (const cat of categories) {
      const catRecipes = recipesByCategory.get(cat) || [];
      pool.push(...catRecipes);
    }
    shuffle(pool);
    courseIterators.set(course as MealSlotName, { pool, idx: 0 });
  }

  // Helper: get next recipe from iterator, avoiding same-day collisions
  function nextRecipe(course: MealSlotName, usedToday: Set<number>): number | null {
    const iter = courseIterators.get(course);
    if (!iter || iter.pool.length === 0) return null;

    // Try each recipe in pool once
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

  // Group slots by weekNr → dayOfWeek → locationSlug → meal
  type SlotKey = string;
  const slotGroups = new Map<SlotKey, RotationSlot[]>();
  for (const slot of allSlots) {
    const key = `${slot.weekNr}-${slot.dayOfWeek}-${slot.locationSlug}-${slot.meal}`;
    const group = slotGroups.get(key) || [];
    group.push(slot);
    slotGroups.set(key, group);
  }

  let filled = 0;
  let skipped = 0;

  // Process day by day to track used recipes per day
  const weekNrs = [...new Set(allSlots.map(s => s.weekNr))].sort();
  const daysOfWeek = [...new Set(allSlots.map(s => s.dayOfWeek))].sort();
  const locationSlugs = [...new Set(allSlots.map(s => s.locationSlug))];

  for (const weekNr of weekNrs) {
    for (const dow of daysOfWeek) {
      const usedToday = new Set<number>();

      for (const locSlug of locationSlugs) {
        for (const meal of ["lunch", "dinner"]) {
          const key = `${weekNr}-${dow}-${locSlug}-${meal}`;
          const groupSlots = slotGroups.get(key) || [];

          for (const slot of groupSlots) {
            if (slot.recipeId !== null && !overwrite) {
              skipped++;
              usedToday.add(slot.recipeId);
              continue;
            }

            const recipeId = nextRecipe(slot.course as MealSlotName, usedToday);
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

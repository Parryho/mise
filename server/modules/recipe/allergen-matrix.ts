/**
 * Allergen analysis: Daily/weekly allergen matrix for menu plans.
 * Combines recipe allergens with ingredient allergens.
 */

import { storage } from "../../storage";
import { db } from "../../db";
import { menuPlans, recipes, ingredients, guestAllergenProfiles } from "@shared/schema";
import { and, gte, lte, eq, inArray } from "drizzle-orm";
import { ALLERGENS } from "@shared/allergens";
import { formatLocalDate } from "@shared/constants";

interface DishAllergenInfo {
  recipeId: number;
  recipeName: string;
  course: string;
  allergens: string[];
}

interface DayAllergenMatrix {
  date: string;
  meal: string;
  locationId: number | null;
  locationSlug: string;
  dishes: DishAllergenInfo[];
  allAllergens: string[];
}

interface GuestWarning {
  profileId: number;
  groupName: string;
  personCount: number;
  conflictingAllergens: string[];
  conflictingDishes: string[];
}

export async function getDailyAllergenMatrix(date: string, locationId?: number): Promise<{
  matrix: DayAllergenMatrix[];
  dishes: Array<{ id: number; name: string; allergens: string[]; meal: string }>;
  guestWarnings: GuestWarning[];
}> {
  const conditions: any[] = [eq(menuPlans.date, date)];
  if (locationId) conditions.push(eq(menuPlans.locationId, locationId));

  const plans = await db.select().from(menuPlans).where(and(...conditions));

  const locs = await storage.getLocations();
  const locMap: Record<number, string> = {};
  for (const loc of locs) locMap[loc.id] = loc.slug;

  // Batch load recipes + ingredients (avoid N+1)
  const recipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!)));
  const recipeAllergens: Record<number, { name: string; allergens: string[] }> = {};

  if (recipeIds.length > 0) {
    const allRecipes = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));
    const recipeMap = new Map(allRecipes.map(r => [r.id, r]));

    const allIngs = await storage.getIngredientsByRecipeIds(recipeIds);
    const ingsByRecipe = new Map<number, typeof allIngs>();
    for (const ing of allIngs) {
      if (!ingsByRecipe.has(ing.recipeId)) ingsByRecipe.set(ing.recipeId, []);
      ingsByRecipe.get(ing.recipeId)!.push(ing);
    }

    for (const id of recipeIds) {
      const recipe = recipeMap.get(id);
      if (!recipe) continue;
      const ings = ingsByRecipe.get(id) || [];
      const allCodes = new Set<string>(recipe.allergens || []);
      for (const ing of ings) {
        for (const a of (ing.allergens || [])) allCodes.add(a);
      }
      recipeAllergens[id] = { name: recipe.name, allergens: Array.from(allCodes).sort() };
    }
  }

  // Group by meal+location
  const groups: Record<string, typeof plans> = {};
  for (const plan of plans) {
    const key = `${plan.meal}-${plan.locationId || 0}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(plan);
  }

  const matrix: DayAllergenMatrix[] = [];
  const allDishAllergens: DishAllergenInfo[] = [];

  for (const [key, group] of Object.entries(groups)) {
    const [meal] = key.split('-');
    const locId = group[0].locationId;
    const locSlug = locMap[locId || 0] || 'city';

    const dishes: DishAllergenInfo[] = [];
    const dayAllergens = new Set<string>();

    for (const plan of group) {
      if (!plan.recipeId) continue;
      const info = recipeAllergens[plan.recipeId];
      if (!info) continue;
      const dish: DishAllergenInfo = {
        recipeId: plan.recipeId,
        recipeName: info.name,
        course: plan.course,
        allergens: info.allergens,
      };
      dishes.push(dish);
      allDishAllergens.push(dish);
      for (const a of info.allergens) dayAllergens.add(a);
    }

    matrix.push({
      date,
      meal,
      locationId: locId,
      locationSlug: locSlug,
      dishes,
      allAllergens: Array.from(dayAllergens).sort(),
    });
  }

  // Check guest profiles for conflicts
  const profiles = await storage.getGuestAllergenProfilesByDateRange(date, date, locationId);
  const guestWarnings: GuestWarning[] = [];

  for (const profile of profiles) {
    const guestAllergens = new Set(profile.allergens || []);
    const conflicts: string[] = [];
    const conflictDishes: string[] = [];

    for (const dish of allDishAllergens) {
      const matching = dish.allergens.filter(a => guestAllergens.has(a));
      if (matching.length > 0) {
        for (const m of matching) if (!conflicts.includes(m)) conflicts.push(m);
        if (!conflictDishes.includes(dish.recipeName)) conflictDishes.push(dish.recipeName);
      }
    }

    if (conflicts.length > 0) {
      guestWarnings.push({
        profileId: profile.id,
        groupName: profile.groupName,
        personCount: profile.personCount,
        conflictingAllergens: conflicts.sort(),
        conflictingDishes: conflictDishes,
      });
    }
  }

  // Flatten dishes for the client's AllergenOverview.tsx which expects { dishes, guestWarnings }
  const dishes = allDishAllergens.map(d => ({
    id: d.recipeId,
    name: d.recipeName,
    allergens: d.allergens,
    meal: d.course,
  }));

  return { matrix, dishes, guestWarnings };
}

export async function getWeeklyAllergenMatrix(startDate: string, endDate: string, locationId?: number): Promise<{
  days: Array<{ date: string; matrix: DayAllergenMatrix[]; guestWarnings: GuestWarning[] }>;
}> {
  // Generate dates in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: Array<{ date: string; matrix: DayAllergenMatrix[]; guestWarnings: GuestWarning[] }> = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatLocalDate(d);
    const result = await getDailyAllergenMatrix(dateStr, locationId);
    days.push({ date: dateStr, ...result });
  }

  return { days };
}

/**
 * Production list: Calculate ingredient quantities based on PAX and menu plans.
 * Ported from Menuplaner (Project A) and adapted for Drizzle.
 */

import { storage } from "./storage";
import { db } from "./db";
import { recipes, ingredients, menuPlans, guestCounts, locations } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { calculateCost, type Unit } from "@shared/units";
import { getWeekDateRange } from "@shared/constants";

const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45, ak: 80 };

interface ProductionDish {
  slot: string;
  dishName: string;
  dishId: number;
  ingredients: Array<{
    name: string;
    quantityPerPortion: number;
    totalQuantity: number;
    unit: string;
    preparationNote: string;
    cost: number;
  }>;
}

interface ProductionEntry {
  date: string;
  meal: string;
  locationSlug: string;
  pax: number;
  dishes: ProductionDish[];
}

export async function getProductionList(startDate: string, endDate: string): Promise<ProductionEntry[]> {
  // Get menu plans for date range
  const plans = await db.select().from(menuPlans)
    .where(and(gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)));

  // Get guest counts
  const counts = await db.select().from(guestCounts)
    .where(and(gte(guestCounts.date, startDate), lte(guestCounts.date, endDate)));

  // Get locations
  const locs = await storage.getLocations();
  const locMap: Record<number, string> = {};
  for (const loc of locs) locMap[loc.id] = loc.slug;

  // Build guest count lookup by date+meal+locationId
  const guestLookup: Record<string, number> = {};
  for (const gc of counts) {
    const key = `${gc.date}-${gc.meal}-${gc.locationId || 0}`;
    guestLookup[key] = gc.adults + gc.children;
  }

  // Collect unique recipe IDs
  const recipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!)));
  if (recipeIds.length === 0) return [];

  // Load recipes and their ingredients
  const recipeMap: Record<number, { name: string; ingredients: Array<{ name: string; amount: number; unit: string }> }> = {};
  for (const id of recipeIds) {
    const recipe = await storage.getRecipe(id);
    if (!recipe) continue;
    const ings = await storage.getIngredients(id);
    recipeMap[id] = {
      name: recipe.name,
      ingredients: ings.map(i => ({ name: i.name, amount: i.amount, unit: i.unit })),
    };
  }

  // Build production entries
  const result: ProductionEntry[] = [];

  // Group plans by date+meal+location
  const grouped: Record<string, typeof plans> = {};
  for (const plan of plans) {
    const key = `${plan.date}-${plan.meal}-${plan.locationId || 0}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(plan);
  }

  for (const [key, group] of Object.entries(grouped)) {
    const [date, meal, locIdStr] = key.split('-');
    const locId = parseInt(locIdStr);
    const locSlug = locMap[locId] || 'city';
    const pax = guestLookup[key] || DEFAULT_PAX[locSlug] || 50;

    const dishes: ProductionDish[] = [];
    for (const plan of group) {
      if (!plan.recipeId) continue;
      const recipe = recipeMap[plan.recipeId];
      if (!recipe) continue;

      dishes.push({
        slot: plan.course,
        dishName: recipe.name,
        dishId: plan.recipeId,
        ingredients: recipe.ingredients.map(i => ({
          name: i.name,
          quantityPerPortion: i.amount,
          totalQuantity: i.amount * pax,
          unit: i.unit,
          preparationNote: '',
          cost: 0,
        })),
      });
    }

    result.push({ date, meal, locationSlug: locSlug, pax, dishes });
  }

  result.sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal) || a.locationSlug.localeCompare(b.locationSlug));
  return result;
}

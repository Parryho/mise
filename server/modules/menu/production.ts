/**
 * Production list: Calculate ingredient quantities based on PAX and menu plans.
 * V2: Includes sub-recipe resolution, cost per line, preparation order.
 */

import { storage } from "../../storage";
import { db } from "../../db";
import { menuPlans, guestCounts, recipes } from "@shared/schema";
import { and, gte, lte, inArray } from "drizzle-orm";
import { calculateCost, type Unit } from "@shared/units";
import { resolveRecipeIngredients } from "../recipe/sub-recipes";

const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45, ak: 80 };

interface ProductionDish {
  slot: string;
  dishName: string;
  dishId: number;
  prepTime: number;
  ingredients: Array<{
    name: string;
    quantityPerPortion: number;
    totalQuantity: number;
    unit: string;
    preparationNote: string;
    cost: number;
    fromSubRecipe?: string;
  }>;
  totalCost: number;
}

interface ProductionEntry {
  date: string;
  meal: string;
  locationSlug: string;
  pax: number;
  dishes: ProductionDish[];
  mealTotalCost: number;
}

export async function getProductionList(startDate: string, endDate: string): Promise<ProductionEntry[]> {
  const plans = await db.select().from(menuPlans)
    .where(and(gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)));

  const counts = await db.select().from(guestCounts)
    .where(and(gte(guestCounts.date, startDate), lte(guestCounts.date, endDate)));

  const locs = await storage.getLocations();
  const locMap: Record<number, string> = {};
  for (const loc of locs) locMap[loc.id] = loc.slug;

  const guestLookup: Record<string, number> = {};
  for (const gc of counts) {
    const key = `${gc.date}-${gc.meal}-${gc.locationId || 0}`;
    guestLookup[key] = gc.adults + gc.children;
  }

  // Collect unique recipe IDs and load master ingredients
  const recipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!)));
  if (recipeIds.length === 0) return [];

  const masterIngs = await storage.getMasterIngredients();
  const masterByName: Record<string, typeof masterIngs[0]> = {};
  for (const mi of masterIngs) masterByName[mi.name.toLowerCase()] = mi;

  // Batch load recipes (avoid N+1), then resolve ingredients per recipe
  const allRecipes = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));
  const recipeLookup = new Map(allRecipes.map(r => [r.id, r]));

  const recipeMap: Record<number, {
    name: string;
    prepTime: number;
    ingredients: Array<{ name: string; amount: number; unit: string; fromSubRecipe?: string }>;
  }> = {};

  for (const id of recipeIds) {
    const recipe = recipeLookup.get(id);
    if (!recipe) continue;
    const resolved = await resolveRecipeIngredients(id);
    recipeMap[id] = {
      name: recipe.name,
      prepTime: recipe.prepTime || 0,
      ingredients: resolved.map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        fromSubRecipe: i.fromSubRecipe,
      })),
    };
  }

  // Group plans by date+meal+location
  const grouped: Record<string, typeof plans> = {};
  for (const plan of plans) {
    const key = `${plan.date}-${plan.meal}-${plan.locationId || 0}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(plan);
  }

  const result: ProductionEntry[] = [];

  for (const [key, group] of Object.entries(grouped)) {
    const [date, meal, locIdStr] = key.split('-');
    const locId = parseInt(locIdStr);
    const locSlug = locMap[locId] || 'city';
    const pax = guestLookup[key] || DEFAULT_PAX[locSlug] || 50;

    const dishes: ProductionDish[] = [];
    let mealTotalCost = 0;

    for (const plan of group) {
      if (!plan.recipeId) continue;
      const recipe = recipeMap[plan.recipeId];
      if (!recipe) continue;

      let dishCost = 0;
      const ingredients = recipe.ingredients.map(i => {
        const totalQty = i.amount * pax;
        const master = masterByName[i.name.toLowerCase()];
        const cost = master
          ? calculateCost(totalQty, i.unit as Unit, master.pricePerUnit, master.priceUnit as Unit)
          : 0;
        dishCost += cost;
        return {
          name: i.name,
          quantityPerPortion: i.amount,
          totalQuantity: Math.round(totalQty * 100) / 100,
          unit: i.unit,
          preparationNote: '',
          cost: Math.round(cost * 100) / 100,
          fromSubRecipe: i.fromSubRecipe,
        };
      });

      dishes.push({
        slot: plan.course,
        dishName: recipe.name,
        dishId: plan.recipeId,
        prepTime: recipe.prepTime,
        ingredients,
        totalCost: Math.round(dishCost * 100) / 100,
      });
      mealTotalCost += dishCost;
    }

    // Sort dishes by prep time (longest first = start earliest)
    dishes.sort((a, b) => b.prepTime - a.prepTime);

    result.push({
      date,
      meal,
      locationSlug: locSlug,
      pax,
      dishes,
      mealTotalCost: Math.round(mealTotalCost * 100) / 100,
    });
  }

  result.sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal) || a.locationSlug.localeCompare(b.locationSlug));
  return result;
}

/**
 * Cost calculation: Wareneinsatz per dish, per day, per week.
 * Ported from Menuplaner (Project A) and adapted for Drizzle.
 */

import { storage } from "./storage";
import { db } from "./db";
import { menuPlans, guestCounts, recipes } from "@shared/schema";
import { and, gte, lte, inArray } from "drizzle-orm";
import { calculateCost, type Unit } from "@shared/units";
import { resolveRecipeIngredients } from "./sub-recipes";

const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45, ak: 80 };

export async function getDishCost(
  recipeId: number,
  preloadedMaster?: Record<string, any>
): Promise<{
  recipeId: number;
  costPerPortion: number;
  ingredients: Array<{ name: string; quantity: number; unit: string; cost: number; fromSubRecipe?: string }>;
}> {
  // Resolve all ingredients including sub-recipes
  const resolvedIngs = await resolveRecipeIngredients(recipeId);
  let masterByName: Record<string, any>;
  if (preloadedMaster) {
    masterByName = preloadedMaster;
  } else {
    const masterIngs = await storage.getMasterIngredients();
    masterByName = {};
    for (const mi of masterIngs) masterByName[mi.name.toLowerCase()] = mi;
  }

  const ingredientCosts = resolvedIngs.map(i => {
    const master = masterByName[i.name.toLowerCase()];
    const cost = master
      ? calculateCost(i.amount, i.unit as Unit, master.pricePerUnit, master.priceUnit as Unit)
      : 0;
    return {
      name: i.name,
      quantity: i.amount,
      unit: i.unit,
      cost: Math.round(cost * 100) / 100,
      fromSubRecipe: i.fromSubRecipe,
    };
  });

  return {
    recipeId,
    costPerPortion: Math.round(ingredientCosts.reduce((sum, i) => sum + i.cost, 0) * 100) / 100,
    ingredients: ingredientCosts,
  };
}

export async function getWeeklyCostReport(startDate: string, endDate: string): Promise<{
  summary: { weekTotal: number; avgPerDay: number; avgPerGuest: number; totalPax: number };
  days: Array<{
    date: string;
    meals: Array<{
      meal: string;
      locationSlug: string;
      pax: number;
      dishes: Array<{ name: string; costPerPortion: number; totalCost: number }>;
      totalCost: number;
      costPerGuest: number;
    }>;
    dayTotal: number;
    dayPax: number;
  }>;
}> {
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

  // Batch load recipes + precompute costs (avoid N+1)
  const recipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!)));
  const dishCosts: Record<number, number> = {};
  const dishNames: Record<number, string> = {};

  if (recipeIds.length > 0) {
    const allRecipes = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));
    for (const r of allRecipes) dishNames[r.id] = r.name;
  }

  // Load master ingredients once for all getDishCost calls
  const masterIngs = await storage.getMasterIngredients();
  const masterByName: Record<string, typeof masterIngs[0]> = {};
  for (const mi of masterIngs) masterByName[mi.name.toLowerCase()] = mi;

  for (const id of recipeIds) {
    const costInfo = await getDishCost(id, masterByName);
    dishCosts[id] = costInfo.costPerPortion;
  }

  // Group plans by date
  const dayMap: Record<string, typeof plans> = {};
  for (const plan of plans) {
    if (!dayMap[plan.date]) dayMap[plan.date] = [];
    dayMap[plan.date].push(plan);
  }

  let weekTotal = 0;
  let weekPax = 0;
  const days: Array<{
    date: string;
    meals: Array<{ meal: string; locationSlug: string; pax: number; dishes: Array<{ name: string; costPerPortion: number; totalCost: number }>; totalCost: number; costPerGuest: number }>;
    dayTotal: number;
    dayPax: number;
  }> = [];

  for (const [date, dayPlans] of Object.entries(dayMap)) {
    // Group by meal+location
    const mealGroups: Record<string, typeof dayPlans> = {};
    for (const plan of dayPlans) {
      const locSlug = locMap[plan.locationId || 0] || 'city';
      const key = `${plan.meal}-${locSlug}`;
      if (!mealGroups[key]) mealGroups[key] = [];
      mealGroups[key].push(plan);
    }

    const meals: typeof days[0]['meals'] = [];
    let dayTotal = 0;
    let dayPax = 0;

    for (const [mealKey, group] of Object.entries(mealGroups)) {
      const [meal, locSlug] = mealKey.split('-');
      const locId = group[0].locationId || 0;
      const key = `${date}-${meal}-${locId}`;
      const pax = guestLookup[key] || DEFAULT_PAX[locSlug] || 50;

      const dishes: Array<{ name: string; costPerPortion: number; totalCost: number }> = [];
      let mealTotal = 0;

      for (const plan of group) {
        if (!plan.recipeId) continue;
        const cpp = dishCosts[plan.recipeId] || 0;
        const total = cpp * pax;
        dishes.push({
          name: dishNames[plan.recipeId] || `#${plan.recipeId}`,
          costPerPortion: cpp,
          totalCost: Math.round(total * 100) / 100,
        });
        mealTotal += total;
      }

      meals.push({
        meal,
        locationSlug: locSlug,
        pax,
        dishes,
        totalCost: Math.round(mealTotal * 100) / 100,
        costPerGuest: pax > 0 ? Math.round((mealTotal / pax) * 100) / 100 : 0,
      });

      dayTotal += mealTotal;
      dayPax += pax;
    }

    days.push({
      date,
      meals: meals.sort((a, b) => a.meal.localeCompare(b.meal) || a.locationSlug.localeCompare(b.locationSlug)),
      dayTotal: Math.round(dayTotal * 100) / 100,
      dayPax,
    });

    weekTotal += dayTotal;
    weekPax += dayPax;
  }

  days.sort((a, b) => a.date.localeCompare(b.date));
  const activeDays = days.filter(d => d.dayTotal > 0).length || 1;

  return {
    summary: {
      weekTotal: Math.round(weekTotal * 100) / 100,
      avgPerDay: Math.round((weekTotal / activeDays) * 100) / 100,
      avgPerGuest: weekPax > 0 ? Math.round((weekTotal / weekPax) * 100) / 100 : 0,
      totalPax: weekPax,
    },
    days,
  };
}

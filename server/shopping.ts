/**
 * Shopping list: Aggregate ingredients across a week's menu plans.
 * Ported from Menuplaner (Project A) and adapted for Drizzle.
 */

import { storage } from "./storage";
import { db } from "./db";
import { menuPlans, guestCounts, masterIngredients } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { convertUnit, calculateCost, type Unit } from "@shared/units";

const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45, ak: 80 };

interface ShoppingItem {
  ingredientName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  estimatedCost: number;
  supplier: string;
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
  subtotal: number;
}

export async function getShoppingList(startDate: string, endDate: string): Promise<{
  categories: ShoppingCategory[];
  grandTotal: number;
}> {
  // Get plans and guest counts
  const plans = await db.select().from(menuPlans)
    .where(and(gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)));
  const counts = await db.select().from(guestCounts)
    .where(and(gte(guestCounts.date, startDate), lte(guestCounts.date, endDate)));

  // Location lookup
  const locs = await storage.getLocations();
  const locMap: Record<number, string> = {};
  for (const loc of locs) locMap[loc.id] = loc.slug;

  // Guest count lookup
  const guestLookup: Record<string, number> = {};
  for (const gc of counts) {
    const key = `${gc.date}-${gc.meal}-${gc.locationId || 0}`;
    guestLookup[key] = gc.adults + gc.children;
  }

  // Collect dish-pax pairs
  const dishPax: Array<{ recipeId: number; pax: number }> = [];
  for (const plan of plans) {
    if (!plan.recipeId) continue;
    const locSlug = locMap[plan.locationId || 0] || 'city';
    const key = `${plan.date}-${plan.meal}-${plan.locationId || 0}`;
    const pax = guestLookup[key] || DEFAULT_PAX[locSlug] || 50;
    dishPax.push({ recipeId: plan.recipeId, pax });
  }

  if (dishPax.length === 0) return { categories: [], grandTotal: 0 };

  // Load master ingredients for price lookup
  const masterIngs = await storage.getMasterIngredients();
  const masterByName: Record<string, typeof masterIngs[0]> = {};
  for (const mi of masterIngs) masterByName[mi.name.toLowerCase()] = mi;

  // Aggregate ingredients
  const aggregated: Record<string, {
    name: string;
    category: string;
    totalQuantity: number;
    unit: string;
    totalCost: number;
    supplier: string;
  }> = {};

  const uniqueRecipeIds = Array.from(new Set(dishPax.map(d => d.recipeId)));
  const recipeIngredients: Record<number, Array<{ name: string; amount: number; unit: string }>> = {};
  for (const id of uniqueRecipeIds) {
    const ings = await storage.getIngredients(id);
    recipeIngredients[id] = ings.map(i => ({ name: i.name, amount: i.amount, unit: i.unit }));
  }

  for (const dp of dishPax) {
    const items = recipeIngredients[dp.recipeId] || [];
    for (const item of items) {
      const key = item.name.toLowerCase();
      const master = masterByName[key];

      if (!aggregated[key]) {
        aggregated[key] = {
          name: item.name,
          category: master?.category || 'sonstiges',
          totalQuantity: 0,
          unit: item.unit,
          totalCost: 0,
          supplier: master?.supplier || '',
        };
      }

      const agg = aggregated[key];
      const converted = convertUnit(item.amount * dp.pax, item.unit as Unit, agg.unit as Unit);
      agg.totalQuantity += converted;

      if (master) {
        agg.totalCost += calculateCost(item.amount * dp.pax, item.unit as Unit, master.pricePerUnit, master.priceUnit as Unit);
      }
    }
  }

  // Group by category
  const categoryMap: Record<string, ShoppingItem[]> = {};
  let grandTotal = 0;

  for (const agg of Object.values(aggregated)) {
    if (!categoryMap[agg.category]) categoryMap[agg.category] = [];
    const cost = Math.round(agg.totalCost * 100) / 100;
    categoryMap[agg.category].push({
      ingredientName: agg.name,
      category: agg.category,
      totalQuantity: Math.round(agg.totalQuantity * 100) / 100,
      unit: agg.unit,
      estimatedCost: cost,
      supplier: agg.supplier,
    });
    grandTotal += cost;
  }

  const categories = Object.entries(categoryMap).map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
    subtotal: Math.round(items.reduce((sum, i) => sum + i.estimatedCost, 0) * 100) / 100,
  })).sort((a, b) => a.category.localeCompare(b.category));

  return { categories, grandTotal: Math.round(grandTotal * 100) / 100 };
}

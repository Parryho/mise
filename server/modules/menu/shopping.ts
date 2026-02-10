/**
 * Shopping list: Aggregate ingredients across a week's menu plans.
 * V2: Supplier grouping, daily breakdown, sub-recipe resolution.
 */

import { storage } from "../../storage";
import { db } from "../../db";
import { menuPlans, guestCounts } from "@shared/schema";
import { and, gte, lte } from "drizzle-orm";
import { convertUnit, calculateCost, type Unit } from "@shared/units";
import { resolveRecipeIngredients } from "../recipe/sub-recipes";

const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45, ak: 80 };

interface ShoppingItem {
  ingredientName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  estimatedCost: number;
  supplier: string;
  supplierId: number | null;
  dailyBreakdown: Record<string, number>; // date -> quantity
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
  subtotal: number;
}

interface SupplierGroup {
  supplierId: number | null;
  supplierName: string;
  items: ShoppingItem[];
  subtotal: number;
}

export async function getShoppingList(startDate: string, endDate: string): Promise<{
  categories: ShoppingCategory[];
  supplierGroups: SupplierGroup[];
  grandTotal: number;
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

  // Collect dish-pax pairs with dates
  const dishPax: Array<{ recipeId: number; pax: number; date: string }> = [];
  for (const plan of plans) {
    if (!plan.recipeId) continue;
    const locSlug = locMap[plan.locationId || 0] || 'city';
    const key = `${plan.date}-${plan.meal}-${plan.locationId || 0}`;
    const pax = guestLookup[key] || DEFAULT_PAX[locSlug] || 50;
    dishPax.push({ recipeId: plan.recipeId, pax, date: plan.date });
  }

  if (dishPax.length === 0) return { categories: [], supplierGroups: [], grandTotal: 0 };

  // Load master ingredients and suppliers
  const masterIngs = await storage.getMasterIngredients();
  const masterByName: Record<string, typeof masterIngs[0]> = {};
  for (const mi of masterIngs) masterByName[mi.name.toLowerCase()] = mi;

  const supplierList = await storage.getSuppliers();
  const supplierMap: Record<number, string> = {};
  for (const s of supplierList) supplierMap[s.id] = s.name;

  // Resolve ingredients for each recipe (with sub-recipes)
  const uniqueRecipeIds = Array.from(new Set(dishPax.map(d => d.recipeId)));
  const recipeIngredients: Record<number, Array<{ name: string; amount: number; unit: string }>> = {};
  for (const id of uniqueRecipeIds) {
    const resolved = await resolveRecipeIngredients(id);
    recipeIngredients[id] = resolved.map(i => ({ name: i.name, amount: i.amount, unit: i.unit }));
  }

  // Aggregate ingredients
  const aggregated: Record<string, {
    name: string;
    category: string;
    totalQuantity: number;
    unit: string;
    totalCost: number;
    supplier: string;
    supplierId: number | null;
    dailyBreakdown: Record<string, number>;
  }> = {};

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
          supplier: master?.supplierId ? (supplierMap[master.supplierId] || master.supplier || '') : (master?.supplier || ''),
          supplierId: master?.supplierId || null,
          dailyBreakdown: {},
        };
      }

      const agg = aggregated[key];
      const qty = item.amount * dp.pax;
      const converted = convertUnit(qty, item.unit as Unit, agg.unit as Unit);
      agg.totalQuantity += converted;

      // Daily breakdown
      agg.dailyBreakdown[dp.date] = (agg.dailyBreakdown[dp.date] || 0) + converted;

      if (master) {
        agg.totalCost += calculateCost(qty, item.unit as Unit, master.pricePerUnit, master.priceUnit as Unit);
      }
    }
  }

  // Group by category
  const categoryMap: Record<string, ShoppingItem[]> = {};
  let grandTotal = 0;

  const allItems: ShoppingItem[] = [];

  for (const agg of Object.values(aggregated)) {
    if (!categoryMap[agg.category]) categoryMap[agg.category] = [];
    const cost = Math.round(agg.totalCost * 100) / 100;
    const item: ShoppingItem = {
      ingredientName: agg.name,
      category: agg.category,
      totalQuantity: Math.round(agg.totalQuantity * 100) / 100,
      unit: agg.unit,
      estimatedCost: cost,
      supplier: agg.supplier,
      supplierId: agg.supplierId,
      dailyBreakdown: Object.fromEntries(
        Object.entries(agg.dailyBreakdown).map(([d, q]) => [d, Math.round(q * 100) / 100])
      ),
    };
    categoryMap[agg.category].push(item);
    allItems.push(item);
    grandTotal += cost;
  }

  const categories = Object.entries(categoryMap).map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
    subtotal: Math.round(items.reduce((sum, i) => sum + i.estimatedCost, 0) * 100) / 100,
  })).sort((a, b) => a.category.localeCompare(b.category));

  // Group by supplier
  const supplierGroupMap: Record<string, ShoppingItem[]> = {};
  for (const item of allItems) {
    const key = item.supplier || 'Kein Lieferant';
    if (!supplierGroupMap[key]) supplierGroupMap[key] = [];
    supplierGroupMap[key].push(item);
  }

  const supplierGroups: SupplierGroup[] = Object.entries(supplierGroupMap).map(([name, items]) => ({
    supplierId: items[0].supplierId,
    supplierName: name,
    items: items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
    subtotal: Math.round(items.reduce((sum, i) => sum + i.estimatedCost, 0) * 100) / 100,
  })).sort((a, b) => a.supplierName.localeCompare(b.supplierName));

  return { categories, supplierGroups, grandTotal: Math.round(grandTotal * 100) / 100 };
}

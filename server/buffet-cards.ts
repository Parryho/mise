/**
 * Buffet allergen cards: Generate printable cards for each dish
 * showing allergen information per EU-Verordnung 1169/2011.
 */

import { storage } from "./storage";
import { ALLERGENS } from "@shared/allergens";

interface BuffetCard {
  recipeId: number;
  recipeName: string;
  category: string;
  allergens: Array<{ code: string; nameDE: string }>;
  allergenCodes: string;
}

export async function getBuffetCards(recipeIds: number[]): Promise<BuffetCard[]> {
  const cards: BuffetCard[] = [];

  for (const id of recipeIds) {
    const recipe = await storage.getRecipe(id);
    if (!recipe) continue;

    const ings = await storage.getIngredients(id);
    const allCodes = new Set<string>(recipe.allergens || []);
    for (const ing of ings) {
      for (const a of (ing.allergens || [])) allCodes.add(a);
    }

    const sortedCodes = Array.from(allCodes).sort();

    cards.push({
      recipeId: id,
      recipeName: recipe.name,
      category: recipe.category,
      allergens: sortedCodes.map(code => ({
        code,
        nameDE: ALLERGENS[code]?.nameDE || code,
      })),
      allergenCodes: sortedCodes.join(','),
    });
  }

  return cards;
}

/**
 * Get buffet cards for all dishes on a given date + location.
 */
export async function getBuffetCardsForDate(date: string, locationId?: number): Promise<BuffetCard[]> {
  const { menuPlans } = await import("@shared/schema");
  const { db } = await import("./db");
  const { and, eq } = await import("drizzle-orm");

  const conditions: any[] = [eq(menuPlans.date, date)];
  if (locationId) conditions.push(eq(menuPlans.locationId, locationId));

  const plans = await db.select().from(menuPlans).where(and(...conditions));
  const recipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!)));

  return getBuffetCards(recipeIds);
}

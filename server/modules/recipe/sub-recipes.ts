/**
 * Sub-recipe resolution: Recursively resolve ingredient lists
 * from parent→child recipe links, with cycle detection.
 */

import { storage } from "../../storage";

interface ResolvedIngredient {
  name: string;
  amount: number;
  unit: string;
  allergens: string[];
  fromSubRecipe?: string;
}

/**
 * Recursively resolve all ingredients for a recipe, including sub-recipes.
 * @param recipeId - The recipe to resolve
 * @param portionMultiplier - Multiplier for scaling
 * @param visited - Set of recipe IDs already visited (cycle detection)
 * @returns Flat list of all ingredients (including from sub-recipes)
 */
export async function resolveRecipeIngredients(
  recipeId: number,
  portionMultiplier = 1,
  visited: Set<number> = new Set()
): Promise<ResolvedIngredient[]> {
  if (visited.has(recipeId)) {
    return []; // Cycle detected — skip
  }
  visited.add(recipeId);

  const recipe = await storage.getRecipe(recipeId);
  if (!recipe) return [];

  // Direct ingredients
  const directIngs = await storage.getIngredients(recipeId);
  const result: ResolvedIngredient[] = directIngs.map(i => ({
    name: i.name,
    amount: i.amount * portionMultiplier,
    unit: i.unit,
    allergens: i.allergens || [],
  }));

  // Sub-recipe ingredients
  const links = await storage.getSubRecipeLinks(recipeId);
  for (const link of links) {
    const childRecipe = await storage.getRecipe(link.childRecipeId);
    const childName = childRecipe?.name || `Recipe #${link.childRecipeId}`;
    const childIngs = await resolveRecipeIngredients(
      link.childRecipeId,
      portionMultiplier * link.portionMultiplier,
      new Set(visited)
    );
    for (const ing of childIngs) {
      result.push({ ...ing, fromSubRecipe: ing.fromSubRecipe || childName });
    }
  }

  return result;
}

/**
 * Check if adding a sub-recipe link would create a cycle.
 */
export async function wouldCreateCycle(parentId: number, childId: number): Promise<boolean> {
  if (parentId === childId) return true;

  const visited = new Set<number>([parentId]);
  const queue = [childId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === parentId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const links = await storage.getSubRecipeLinks(current);
    for (const link of links) {
      queue.push(link.childRecipeId);
    }
  }

  return false;
}

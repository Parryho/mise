/**
 * Complete ALL recipes with ingredients, steps, and allergens.
 * Covers all 335 recipes from seed-recipe-pool.ts.
 *
 * Idempotent:
 * - Skips ingredient insertion if recipe already has ingredients
 * - Skips steps update if recipe already has steps
 * - Skips allergen update if recipe already has allergens
 *
 * Usage:
 *   npx tsx script/complete-recipes.ts
 *   DATABASE_URL=postgresql://... npx tsx script/complete-recipes.ts
 */

import { Pool } from "pg";

// Import data from split files
import { SOUP_DATA } from "./recipe-data/soups";
import { MEAT_FISH_DATA } from "./recipe-data/meat-fish";
import { VEGETARIAN_DATA } from "./recipe-data/vegetarian";
import { SIDES_STARCH_DATA } from "./recipe-data/sides-starch";
import { SIDES_VEG_DATA } from "./recipe-data/sides-veg";
import { DESSERTS_SAUCES_DATA } from "./recipe-data/desserts-sauces";
import { GARNISH_DATA } from "./recipe-data/garnishes";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

export interface IngredientData {
  name: string;
  amount: number;
  unit: string;
  allergens: string[];
}

export interface RecipeCompletion {
  ingredients: IngredientData[];
  steps: string[];
  allergens: string[];  // Aggregated allergen codes for the recipe
}

export type RecipeCompletionMap = Record<string, RecipeCompletion>;

function log(msg: string) {
  console.log(`[complete-recipes] ${msg}`);
}

async function main() {
  // Merge all data
  const ALL_DATA: RecipeCompletionMap = {
    ...SOUP_DATA,
    ...MEAT_FISH_DATA,
    ...VEGETARIAN_DATA,
    ...SIDES_STARCH_DATA,
    ...SIDES_VEG_DATA,
    ...DESSERTS_SAUCES_DATA,
    ...GARNISH_DATA,
  };

  const recipeNames = Object.keys(ALL_DATA);
  log(`Database: ${DB_URL.replace(/:[^@]+@/, ":***@")}`);
  log(`Recipes with completion data: ${recipeNames.length}`);

  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let ingredientsAdded = 0;
    let ingredientsSkipped = 0;
    let stepsAdded = 0;
    let stepsSkipped = 0;
    let allergensAdded = 0;
    let allergensSkipped = 0;
    let notFound = 0;

    for (const [recipeName, data] of Object.entries(ALL_DATA)) {
      // Find recipe by name
      const recipeResult = await client.query(
        `SELECT id, steps, allergens FROM recipes WHERE name = $1`,
        [recipeName]
      );

      if (recipeResult.rows.length === 0) {
        log(`  NOT FOUND: "${recipeName}"`);
        notFound++;
        continue;
      }

      const recipe = recipeResult.rows[0];
      const recipeId = recipe.id;

      // 1) Insert ingredients if missing
      if (data.ingredients.length > 0) {
        const existingIngredients = await client.query(
          `SELECT COUNT(*) as count FROM ingredients WHERE recipe_id = $1`,
          [recipeId]
        );

        if (parseInt(existingIngredients.rows[0].count) === 0) {
          for (const ing of data.ingredients) {
            await client.query(
              `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens)
               VALUES ($1, $2, $3, $4, $5)`,
              [recipeId, ing.name, ing.amount, ing.unit, ing.allergens]
            );
          }
          ingredientsAdded++;
        } else {
          ingredientsSkipped++;
        }
      }

      // 2) Update steps if empty
      const existingSteps = recipe.steps;
      const hasSteps = existingSteps && Array.isArray(existingSteps) && existingSteps.length > 0;

      if (!hasSteps && data.steps.length > 0) {
        await client.query(
          `UPDATE recipes SET steps = $1 WHERE id = $2`,
          [data.steps, recipeId]
        );
        stepsAdded++;
      } else {
        stepsSkipped++;
      }

      // 3) Update allergens if empty
      const existingAllergens = recipe.allergens;
      const hasAllergens = existingAllergens && Array.isArray(existingAllergens) && existingAllergens.length > 0;

      if (!hasAllergens && data.allergens.length > 0) {
        await client.query(
          `UPDATE recipes SET allergens = $1 WHERE id = $2`,
          [data.allergens, recipeId]
        );
        allergensAdded++;
      } else {
        allergensSkipped++;
      }
    }

    await client.query("COMMIT");

    log("══ Summary ══");
    log(`Ingredients added:   ${ingredientsAdded} recipes`);
    log(`Ingredients skipped: ${ingredientsSkipped} (already have ingredients)`);
    log(`Steps added:         ${stepsAdded} recipes`);
    log(`Steps skipped:       ${stepsSkipped} (already have steps)`);
    log(`Allergens added:     ${allergensAdded} recipes`);
    log(`Allergens skipped:   ${allergensSkipped} (already have allergens)`);
    log(`Not found:           ${notFound}`);
    log("=== Done ===");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

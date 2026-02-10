/**
 * Backfill allergen data for recipes that have ingredients but no allergens.
 *
 * - Reads all ingredients per recipe
 * - Runs detectAllergens() on each ingredient name
 * - Aggregates to recipe-level allergens
 * - Sets allergen_status = 'auto'
 * - Marks the 108 seed recipes (id <= 108) as 'verified'
 *
 * Usage:
 *   npx tsx script/backfill-allergens.ts
 *   npx tsx script/backfill-allergens.ts --dry-run
 */

import { Pool } from "pg";
import { detectAllergens } from "../server/modules/recipe/allergen-detection";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");

function log(msg: string) {
  console.log(`[backfill-allergens] ${msg}`);
}

async function main() {
  const pool = new Pool({ connectionString: DB_URL });

  log(`Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  // 1. Find recipes with ingredients but empty/null allergens
  const { rows: recipesToBackfill } = await pool.query(`
    SELECT r.id, r.name, r.allergens
    FROM recipes r
    WHERE (r.allergens IS NULL OR r.allergens = '{}' OR array_length(r.allergens, 1) IS NULL)
      AND EXISTS (SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id)
    ORDER BY r.id
  `);

  log(`Rezepte mit Zutaten aber ohne Allergene: ${recipesToBackfill.length}`);

  let updated = 0;
  for (const recipe of recipesToBackfill) {
    const { rows: ings } = await pool.query(
      `SELECT id, name FROM ingredients WHERE recipe_id = $1`,
      [recipe.id]
    );

    const allAllergens = new Set<string>();
    for (const ing of ings) {
      const detected = detectAllergens(ing.name);
      // Also update ingredient-level allergens
      if (detected.length > 0 && !DRY_RUN) {
        await pool.query(
          `UPDATE ingredients SET allergens = $1 WHERE id = $2`,
          [detected, ing.id]
        );
      }
      for (const code of detected) allAllergens.add(code);
    }

    const recipeAllergens = Array.from(allAllergens).sort();
    log(`  ${recipe.name} (ID ${recipe.id}): ${recipeAllergens.length > 0 ? recipeAllergens.join(', ') : 'keine'}`);

    if (!DRY_RUN) {
      await pool.query(
        `UPDATE recipes SET allergens = $1, allergen_status = 'auto' WHERE id = $2`,
        [recipeAllergens, recipe.id]
      );
    }
    updated++;
  }

  // 2. Mark seed recipes (first 108) as 'verified' if they have allergens
  if (!DRY_RUN) {
    const { rowCount: verifiedCount } = await pool.query(`
      UPDATE recipes SET allergen_status = 'verified'
      WHERE id <= 108
        AND allergen_status IS NULL
        AND allergens IS NOT NULL
        AND array_length(allergens, 1) > 0
    `);
    log(`Seed-Rezepte als 'verified' markiert: ${verifiedCount}`);
  }

  log("");
  log("== Zusammenfassung ==");
  log(`Backfilled: ${updated}`);
  log("=== Fertig ===");

  await pool.end();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

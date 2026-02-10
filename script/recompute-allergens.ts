/**
 * Recompute ALL allergens from scratch using the updated detection logic.
 *
 * - Recalculates allergens for every ingredient in the DB
 * - Re-aggregates recipe-level allergens
 * - Preserves allergen_status = 'verified' (does not downgrade)
 * - Sets allergen_status = 'auto' for non-verified recipes that changed
 *
 * Usage:
 *   npx tsx script/recompute-allergens.ts
 *   npx tsx script/recompute-allergens.ts --dry-run
 *   DATABASE_URL=postgresql://... npx tsx script/recompute-allergens.ts
 */

import { Pool } from "pg";
import { detectAllergens } from "../server/modules/recipe/allergen-detection";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");

function log(msg: string) {
  console.log(`[recompute] ${msg}`);
}

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  log(`Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  // 1. Recompute ingredient-level allergens
  const { rows: allIngredients } = await pool.query(
    `SELECT id, recipe_id, name, allergens FROM ingredients ORDER BY id`
  );
  log(`Zutaten gesamt: ${allIngredients.length}`);

  let ingUpdated = 0;
  for (const ing of allIngredients) {
    const newAllergens = detectAllergens(ing.name);
    const oldStr = (ing.allergens || []).sort().join(",");
    const newStr = newAllergens.sort().join(",");

    if (oldStr !== newStr) {
      ingUpdated++;
      if (!DRY_RUN) {
        await pool.query(
          `UPDATE ingredients SET allergens = $1 WHERE id = $2`,
          [newAllergens, ing.id]
        );
      }
    }
  }
  log(`Zutaten aktualisiert: ${ingUpdated}`);

  // 2. Recompute recipe-level allergens from ingredients
  const { rows: recipes } = await pool.query(
    `SELECT id, name, allergens, allergen_status FROM recipes ORDER BY id`
  );
  log(`Rezepte gesamt: ${recipes.length}`);

  let recipeUpdated = 0;
  let recipeUnchanged = 0;
  let verifiedPreserved = 0;
  const changes: string[] = [];

  for (const recipe of recipes) {
    const { rows: ings } = await pool.query(
      `SELECT name FROM ingredients WHERE recipe_id = $1`, [recipe.id]
    );

    // Aggregate allergens from all ingredients
    const allAllergens = new Set<string>();
    for (const ing of ings) {
      for (const code of detectAllergens(ing.name)) allAllergens.add(code);
    }
    const newAllergens = Array.from(allAllergens).sort();
    const oldAllergens = (recipe.allergens || []).sort();
    const oldStr = oldAllergens.join(",");
    const newStr = newAllergens.join(",");

    if (oldStr !== newStr) {
      const isVerified = recipe.allergen_status === "verified";
      changes.push(
        `  ${isVerified ? "⚡" : "→"} ${recipe.name} (ID ${recipe.id}): ${oldStr || "keine"} → ${newStr || "keine"}${isVerified ? " [verified]" : ""}`
      );

      if (!DRY_RUN) {
        if (isVerified) {
          // Preserve verified status, still update allergens
          await pool.query(
            `UPDATE recipes SET allergens = $1 WHERE id = $2`,
            [newAllergens, recipe.id]
          );
          verifiedPreserved++;
        } else {
          await pool.query(
            `UPDATE recipes SET allergens = $1, allergen_status = 'auto' WHERE id = $2`,
            [newAllergens, recipe.id]
          );
        }
      }
      recipeUpdated++;
    } else {
      recipeUnchanged++;
    }
  }

  // Print changes
  if (changes.length > 0) {
    log(`\nÄnderungen:`);
    for (const c of changes) log(c);
  }

  log("");
  log("══ Zusammenfassung ══");
  log(`Zutaten aktualisiert: ${ingUpdated} von ${allIngredients.length}`);
  log(`Rezepte aktualisiert: ${recipeUpdated} von ${recipes.length}`);
  log(`Rezepte unverändert: ${recipeUnchanged}`);
  if (verifiedPreserved > 0) log(`Verified-Status bewahrt: ${verifiedPreserved}`);
  log("=== Fertig ===");

  await pool.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });

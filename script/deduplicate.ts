/**
 * Deduplicate: Find and merge duplicate recipes.
 *
 * After both migrations (A + B) run, there may be recipes with the same name.
 * This script:
 *   1. Finds recipes with identical or near-identical names
 *   2. Keeps the "richer" version (more steps, more ingredients)
 *   3. Merges A-specific fields (season, prepInstructions) into the kept version
 *   4. Updates all FK references (ingredients, rotation_slots, menu_plans, catering_menu_items)
 *   5. Deletes the duplicate
 *
 * Usage:
 *   npx tsx script/deduplicate.ts [--dry-run]
 */

import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

function log(msg: string) {
  console.log(`[deduplicate] ${msg}`);
}

interface RecipeRow {
  id: number;
  name: string;
  category: string;
  steps: string[];
  allergens: string[];
  tags: string[];
  season: string;
  prep_instructions: string | null;
  portions: number;
  prep_time: number;
  image: string | null;
  source_url: string | null;
}

async function main() {
  log(`Database: ${DB_URL.replace(/:[^@]+@/, ':***@')}`);
  log(`Dry run: ${DRY_RUN}`);

  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  try {
    // Find duplicates by lowercase name
    const dupes = await client.query(`
      SELECT LOWER(name) as lname, array_agg(id ORDER BY id) as ids, count(*) as cnt
      FROM recipes
      GROUP BY LOWER(name)
      HAVING count(*) > 1
      ORDER BY LOWER(name)
    `);

    log(`Found ${dupes.rows.length} duplicate groups`);

    if (dupes.rows.length === 0) {
      log("No duplicates found. Done.");
      return;
    }

    if (!DRY_RUN) await client.query("BEGIN");

    let mergedCount = 0;
    let deletedCount = 0;

    for (const group of dupes.rows) {
      const ids: number[] = group.ids;
      log(`\n  "${group.lname}" (${ids.length} copies, IDs: ${ids.join(', ')})`);

      // Fetch all versions
      const versions = (await client.query(
        "SELECT * FROM recipes WHERE id = ANY($1) ORDER BY id",
        [ids]
      )).rows as RecipeRow[];

      // Score each version: more steps, more ingredients, has image, has source_url
      const scored = await Promise.all(versions.map(async (v) => {
        const ingCount = (await client.query(
          "SELECT count(*) as cnt FROM ingredients WHERE recipe_id = $1",
          [v.id]
        )).rows[0].cnt;

        const score =
          (v.steps?.length || 0) * 3 +        // Steps are valuable
          parseInt(ingCount) * 2 +              // Ingredients matter
          (v.image ? 5 : 0) +                   // Image is nice
          (v.source_url ? 2 : 0) +              // Source URL
          (v.allergens?.length || 0) +           // Allergens
          (v.tags?.length || 0) +                // Tags
          (v.prep_time > 0 ? 1 : 0) +           // Prep time
          (v.season !== "all" ? 1 : 0) +         // Season info
          (v.prep_instructions ? 2 : 0);         // Prep instructions

        return { recipe: v, score, ingCount: parseInt(ingCount) };
      }));

      scored.sort((a, b) => b.score - a.score);
      const keeper = scored[0];
      const toDelete = scored.slice(1);

      log(`    KEEP: id=${keeper.recipe.id} (score=${keeper.score}, steps=${keeper.recipe.steps?.length || 0}, ings=${keeper.ingCount})`);

      // Merge fields from deleted versions into keeper
      for (const dup of toDelete) {
        log(`    DELETE: id=${dup.recipe.id} (score=${dup.score}, steps=${dup.recipe.steps?.length || 0}, ings=${dup.ingCount})`);

        if (!DRY_RUN) {
          // Merge A-specific fields if keeper doesn't have them
          const updates: string[] = [];
          const params: any[] = [];
          let paramIdx = 1;

          if (!keeper.recipe.season || keeper.recipe.season === "all") {
            if (dup.recipe.season && dup.recipe.season !== "all") {
              updates.push(`season = $${paramIdx++}`);
              params.push(dup.recipe.season);
            }
          }
          if (!keeper.recipe.prep_instructions && dup.recipe.prep_instructions) {
            updates.push(`prep_instructions = $${paramIdx++}`);
            params.push(dup.recipe.prep_instructions);
          }
          if ((keeper.recipe.allergens?.length || 0) === 0 && (dup.recipe.allergens?.length || 0) > 0) {
            updates.push(`allergens = $${paramIdx++}`);
            params.push(dup.recipe.allergens);
          }

          if (updates.length > 0) {
            params.push(keeper.recipe.id);
            await client.query(
              `UPDATE recipes SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
              params
            );
            log(`    -> Merged ${updates.length} fields into keeper`);
          }

          // Update all FK references from dup -> keeper
          const fkUpdates = [
            { table: "ingredients", col: "recipe_id" },
            { table: "rotation_slots", col: "recipe_id" },
            { table: "menu_plans", col: "recipe_id" },
            { table: "catering_menu_items", col: "recipe_id" },
          ];

          for (const fk of fkUpdates) {
            const result = await client.query(
              `UPDATE ${fk.table} SET ${fk.col} = $1 WHERE ${fk.col} = $2`,
              [keeper.recipe.id, dup.recipe.id]
            );
            if (result.rowCount && result.rowCount > 0) {
              log(`    -> Updated ${result.rowCount} rows in ${fk.table}`);
            }
          }

          // Delete the duplicate recipe
          await client.query("DELETE FROM recipes WHERE id = $1", [dup.recipe.id]);
          deletedCount++;
        }
      }
      mergedCount++;
    }

    if (!DRY_RUN) {
      await client.query("COMMIT");
      log(`\n=== Deduplication committed: ${mergedCount} groups merged, ${deletedCount} recipes deleted ===`);
    } else {
      log(`\n=== Dry run: would merge ${mergedCount} groups, delete ${deletedCount} recipes ===`);
    }

    // Final count
    const finalCount = (await client.query("SELECT count(*) as cnt FROM recipes")).rows[0].cnt;
    log(`Final recipe count: ${finalCount}`);

  } catch (err) {
    if (!DRY_RUN) await client.query("ROLLBACK");
    console.error("Deduplication failed:", err);
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

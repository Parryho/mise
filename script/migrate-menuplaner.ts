/**
 * Migration: Menuplaner (SQLite) -> mise (PostgreSQL)
 *
 * Reads from the Menuplaner SQLite database and inserts into the mise PostgreSQL database.
 * - dishes -> recipes (with category mapping + allergen array conversion)
 * - ingredients (master) -> master_ingredients
 * - recipe_items -> ingredients (per-recipe)
 * - rotation_weeks -> rotation_templates + rotation_slots (denormalized -> normalized)
 * - weekly_plans -> menu_plans
 * - guest_counts -> guest_counts
 * - ak_events -> catering_events
 * - ak_event_menu_items -> catering_menu_items
 * - temperature_logs -> menu_plan_temperatures
 *
 * Usage:
 *   npx tsx script/migrate-menuplaner.ts [--dry-run]
 */

import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";

// ========================
// Configuration
// ========================

const SQLITE_PATH = process.env.MENUPLANER_DB || path.resolve(__dirname, "../../Menuplaner/data/menuplan.db");
const DRY_RUN = process.argv.includes("--dry-run");

const CATEGORY_MAP: Record<string, string> = {
  suppe: "ClearSoups",
  fleisch: "MainMeat",
  fisch: "MainFish",
  vegetarisch: "MainVegan",
  dessert: "HotDesserts",
  beilage: "Sides",
};

const MEAL_MAP: Record<string, string> = {
  mittag: "lunch",
  abend: "dinner",
};

// Rotation slot names -> course mapping
const SLOT_COURSES: Record<string, string> = {
  soup: "soup",
  main1: "main1",
  side1a: "side1a",
  side1b: "side1b",
  main2: "main2",
  side2a: "side2a",
  side2b: "side2b",
  dessert: "dessert",
};

// ========================
// Helpers
// ========================

function parseAllergens(str: string): string[] {
  if (!str) return [];
  return str.split("").filter(c => /[A-R]/i.test(c)).map(c => c.toUpperCase());
}

function log(msg: string) {
  console.log(`[migrate-menuplaner] ${msg}`);
}

function logCount(table: string, count: number) {
  log(`  ${table}: ${count} rows`);
}

// ========================
// Main Migration
// ========================

async function main() {
  log(`SQLite source: ${SQLITE_PATH}`);
  log(`Dry run: ${DRY_RUN}`);

  // Open SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  sqlite.pragma("journal_mode = WAL");

  // Open PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise" });
  const client = await pool.connect();

  try {
    if (!DRY_RUN) await client.query("BEGIN");

    // ----------------------------------------
    // 1. Ensure locations exist
    // ----------------------------------------
    log("--- Ensuring locations ---");
    if (!DRY_RUN) {
      await client.query(`
        INSERT INTO locations (slug, name, default_pax, is_active)
        VALUES ('city', 'Küche City', 60, true),
               ('sued', 'Küche SÜD', 45, true),
               ('ak', 'Catering', 80, true)
        ON CONFLICT (slug) DO NOTHING
      `);
    }
    // Get location IDs
    const locResult = await client.query("SELECT id, slug FROM locations");
    const locBySlug: Record<string, number> = {};
    for (const row of locResult.rows) locBySlug[row.slug] = row.id;
    log(`  Locations: ${JSON.stringify(locBySlug)}`);

    // ----------------------------------------
    // 2. Migrate dishes -> recipes
    // ----------------------------------------
    log("--- Migrating dishes -> recipes ---");
    const dishes = sqlite.prepare("SELECT * FROM dishes ORDER BY id").all() as any[];
    logCount("source dishes", dishes.length);

    const dishIdMap: Record<number, number> = {}; // old SQLite ID -> new PG ID

    for (const dish of dishes) {
      const category = CATEGORY_MAP[dish.category] || dish.category;
      const allergens = parseAllergens(dish.allergens || "");
      const season = dish.season || "all";
      const prepInstructions = dish.prep_instructions || null;

      if (DRY_RUN) {
        dishIdMap[dish.id] = dish.id; // placeholder
        continue;
      }

      // Check if recipe with same name already exists (from B migration)
      const existing = await client.query(
        "SELECT id FROM recipes WHERE LOWER(name) = LOWER($1)",
        [dish.name]
      );

      if (existing.rows.length > 0) {
        dishIdMap[dish.id] = existing.rows[0].id;
        // Update with A-specific fields if missing
        await client.query(
          `UPDATE recipes SET
            season = COALESCE(NULLIF(season, 'all'), $1),
            prep_instructions = COALESCE(prep_instructions, $2),
            allergens = CASE WHEN allergens = '{}' THEN $3::text[] ELSE allergens END
          WHERE id = $4`,
          [season, prepInstructions, allergens, existing.rows[0].id]
        );
      } else {
        const result = await client.query(
          `INSERT INTO recipes (name, category, portions, prep_time, steps, allergens, tags, season, prep_instructions, updated_at)
          VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING id`,
          [dish.name, category, dish.prep_time_minutes || 0, [], allergens, [], season, prepInstructions]
        );
        dishIdMap[dish.id] = result.rows[0].id;
      }
    }
    logCount("mapped recipes", Object.keys(dishIdMap).length);

    // ----------------------------------------
    // 3. Migrate ingredients (master) -> master_ingredients
    // ----------------------------------------
    log("--- Migrating ingredients -> master_ingredients ---");
    const masterIngs = sqlite.prepare("SELECT * FROM ingredients ORDER BY id").all() as any[];
    logCount("source ingredients", masterIngs.length);

    const masterIngIdMap: Record<number, number> = {};

    for (const ing of masterIngs) {
      if (DRY_RUN) {
        masterIngIdMap[ing.id] = ing.id;
        continue;
      }

      const existing = await client.query(
        "SELECT id FROM master_ingredients WHERE LOWER(name) = LOWER($1)",
        [ing.name]
      );

      if (existing.rows.length > 0) {
        masterIngIdMap[ing.id] = existing.rows[0].id;
      } else {
        const result = await client.query(
          `INSERT INTO master_ingredients (name, category, unit, price_per_unit, price_unit, supplier)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [ing.name, ing.category, ing.unit, ing.price_per_unit || 0, ing.price_unit || "kg", ing.supplier || ""]
        );
        masterIngIdMap[ing.id] = result.rows[0].id;
      }
    }
    logCount("mapped master_ingredients", Object.keys(masterIngIdMap).length);

    // ----------------------------------------
    // 4. Migrate recipe_items -> ingredients (per-recipe)
    // ----------------------------------------
    log("--- Migrating recipe_items -> ingredients ---");
    const recipeItems = sqlite.prepare("SELECT * FROM recipe_items ORDER BY id").all() as any[];
    logCount("source recipe_items", recipeItems.length);

    let ingredientCount = 0;
    for (const item of recipeItems) {
      const newRecipeId = dishIdMap[item.dish_id];
      if (!newRecipeId) {
        log(`  WARN: No recipe mapping for dish_id=${item.dish_id}, skipping`);
        continue;
      }

      // Get ingredient name from master
      const masterIng = masterIngs.find(m => m.id === item.ingredient_id);
      if (!masterIng) {
        log(`  WARN: No master ingredient for id=${item.ingredient_id}, skipping`);
        continue;
      }

      if (DRY_RUN) {
        ingredientCount++;
        continue;
      }

      // Check if ingredient already exists for this recipe
      const existing = await client.query(
        "SELECT id FROM ingredients WHERE recipe_id = $1 AND LOWER(name) = LOWER($2)",
        [newRecipeId, masterIng.name]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens)
          VALUES ($1, $2, $3, $4, $5)`,
          [newRecipeId, masterIng.name, item.quantity, item.unit, []]
        );
        ingredientCount++;
      }
    }
    logCount("inserted ingredients", ingredientCount);

    // ----------------------------------------
    // 5. Migrate rotation_weeks -> rotation_templates + rotation_slots
    // ----------------------------------------
    log("--- Migrating rotation_weeks -> rotation_templates + rotation_slots ---");
    const rotWeeks = sqlite.prepare("SELECT * FROM rotation_weeks ORDER BY week_nr, day_of_week, meal, location").all() as any[];
    logCount("source rotation_weeks", rotWeeks.length);

    // Create one template per location
    const templateIds: Record<string, number> = {};
    if (!DRY_RUN) {
      for (const locSlug of ["city", "sued"]) {
        const existing = await client.query(
          "SELECT id FROM rotation_templates WHERE name = $1",
          [`Rotation ${locSlug.toUpperCase()}`]
        );
        if (existing.rows.length > 0) {
          templateIds[locSlug] = existing.rows[0].id;
        } else {
          const result = await client.query(
            `INSERT INTO rotation_templates (name, week_count, location_id, is_active)
            VALUES ($1, 6, $2, true)
            RETURNING id`,
            [`Rotation ${locSlug.toUpperCase()}`, locBySlug[locSlug] || null]
          );
          templateIds[locSlug] = result.rows[0].id;
        }
      }
    } else {
      templateIds["city"] = 1;
      templateIds["sued"] = 2;
    }

    let slotCount = 0;
    for (const rw of rotWeeks) {
      const templateId = templateIds[rw.location] || templateIds["city"];
      const meal = MEAL_MAP[rw.meal] || rw.meal;

      // Denormalize: one row with 8 dish columns -> up to 8 rows in rotation_slots
      const slotEntries: Array<{ course: string; recipeId: number | null }> = [
        { course: "soup", recipeId: rw.soup_id },
        { course: "main1", recipeId: rw.main1_id },
        { course: "side1a", recipeId: rw.side1a_id },
        { course: "side1b", recipeId: rw.side1b_id },
        { course: "main2", recipeId: rw.main2_id },
        { course: "side2a", recipeId: rw.side2a_id },
        { course: "side2b", recipeId: rw.side2b_id },
        { course: "dessert", recipeId: rw.dessert_id },
      ];

      for (const entry of slotEntries) {
        const newRecipeId = entry.recipeId ? (dishIdMap[entry.recipeId] || null) : null;

        if (DRY_RUN) {
          slotCount++;
          continue;
        }

        await client.query(
          `INSERT INTO rotation_slots (template_id, week_nr, day_of_week, meal, location_slug, course, recipe_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [templateId, rw.week_nr, rw.day_of_week, meal, rw.location, entry.course, newRecipeId]
        );
        slotCount++;
      }
    }
    logCount("inserted rotation_slots", slotCount);

    // ----------------------------------------
    // 6. Migrate guest_counts
    // ----------------------------------------
    log("--- Migrating guest_counts ---");
    const guestRows = sqlite.prepare("SELECT * FROM guest_counts ORDER BY id").all() as any[];
    logCount("source guest_counts", guestRows.length);

    let gcCount = 0;
    for (const gc of guestRows) {
      const locId = locBySlug[gc.location] || null;
      const meal = MEAL_MAP[gc.meal_type] || gc.meal_type;

      if (DRY_RUN) { gcCount++; continue; }

      await client.query(
        `INSERT INTO guest_counts (date, meal, adults, children, notes, location_id, source)
        VALUES ($1, $2, $3, 0, NULL, $4, $5)`,
        [gc.date, meal, gc.count, locId, gc.source || "manual"]
      );
      gcCount++;
    }
    logCount("inserted guest_counts", gcCount);

    // ----------------------------------------
    // 7. Migrate ak_events -> catering_events
    // ----------------------------------------
    log("--- Migrating ak_events -> catering_events ---");
    const akEvents = sqlite.prepare("SELECT * FROM ak_events ORDER BY id").all() as any[];
    logCount("source ak_events", akEvents.length);

    const eventIdMap: Record<number, number> = {};
    const akLocId = locBySlug["ak"] || null;

    for (const ev of akEvents) {
      if (DRY_RUN) { eventIdMap[ev.id] = ev.id; continue; }

      // Check for existing by airtable_id
      if (ev.airtable_id) {
        const existing = await client.query(
          "SELECT id FROM catering_events WHERE airtable_id = $1",
          [ev.airtable_id]
        );
        if (existing.rows.length > 0) {
          eventIdMap[ev.id] = existing.rows[0].id;
          continue;
        }
      }

      const result = await client.query(
        `INSERT INTO catering_events
          (client_name, event_name, date, time, person_count, dishes, notes,
           event_type, time_start, time_end, contact_person, room, status, airtable_id, location_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id`,
        [
          ev.contact_person || "AK",
          ev.description || `AK Event ${ev.date}`,
          ev.date,
          ev.time_start || "",
          ev.pax || 0,
          [],
          ev.menu_notes || "",
          ev.event_type || "sonstiges",
          ev.time_start || null,
          ev.time_end || null,
          ev.contact_person || null,
          ev.room || null,
          ev.status || "geplant",
          ev.airtable_id || null,
          akLocId,
        ]
      );
      eventIdMap[ev.id] = result.rows[0].id;
    }
    logCount("mapped catering_events", Object.keys(eventIdMap).length);

    // ----------------------------------------
    // 8. Migrate ak_event_menu_items -> catering_menu_items
    // ----------------------------------------
    log("--- Migrating ak_event_menu_items -> catering_menu_items ---");
    const menuItems = sqlite.prepare("SELECT * FROM ak_event_menu_items ORDER BY id").all() as any[];
    logCount("source ak_event_menu_items", menuItems.length);

    let miCount = 0;
    for (const mi of menuItems) {
      const newEventId = eventIdMap[mi.event_id];
      if (!newEventId) continue;

      const newRecipeId = mi.dish_id ? (dishIdMap[mi.dish_id] || null) : null;
      const customAllergens = parseAllergens(mi.custom_allergens || "");

      if (DRY_RUN) { miCount++; continue; }

      await client.query(
        `INSERT INTO catering_menu_items (event_id, category, recipe_id, custom_name, custom_allergens, sort_order, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newEventId, mi.category, newRecipeId, mi.custom_name || null, customAllergens, mi.sort_order || 0, mi.notes || null]
      );
      miCount++;
    }
    logCount("inserted catering_menu_items", miCount);

    // ----------------------------------------
    // 9. Migrate weekly_plans -> menu_plans
    // ----------------------------------------
    log("--- Migrating weekly_plans -> menu_plans ---");
    const weeklyPlans = sqlite.prepare("SELECT * FROM weekly_plans ORDER BY id").all() as any[];
    logCount("source weekly_plans", weeklyPlans.length);

    // We need to map weekly_plans to dates
    // weekly_plans have: year, calendar_week, day_of_week, meal, location, [dish slots], rotation_week_nr
    const planIdMap: Record<number, number[]> = {}; // old plan ID -> list of new menuPlan IDs

    let mpCount = 0;
    for (const wp of weeklyPlans) {
      const locId = locBySlug[wp.location] || null;
      const meal = MEAL_MAP[wp.meal] || wp.meal;

      // Convert year + calendar_week + day_of_week to YYYY-MM-DD
      const date = isoWeekToDate(wp.year, wp.calendar_week, wp.day_of_week);
      planIdMap[wp.id] = [];

      const slotEntries: Array<{ course: string; recipeId: number | null }> = [
        { course: "soup", recipeId: wp.soup_id },
        { course: "main1", recipeId: wp.main1_id },
        { course: "side1a", recipeId: wp.side1a_id },
        { course: "side1b", recipeId: wp.side1b_id },
        { course: "main2", recipeId: wp.main2_id },
        { course: "side2a", recipeId: wp.side2a_id },
        { course: "side2b", recipeId: wp.side2b_id },
        { course: "dessert", recipeId: wp.dessert_id },
      ];

      for (const entry of slotEntries) {
        if (!entry.recipeId) continue;
        const newRecipeId = dishIdMap[entry.recipeId] || null;
        if (!newRecipeId) continue;

        if (DRY_RUN) { mpCount++; continue; }

        const result = await client.query(
          `INSERT INTO menu_plans (date, meal, course, recipe_id, portions, notes, location_id, rotation_week_nr)
          VALUES ($1, $2, $3, $4, 1, NULL, $5, $6)
          RETURNING id`,
          [date, meal, entry.course, newRecipeId, locId, wp.rotation_week_nr || null]
        );
        planIdMap[wp.id].push(result.rows[0].id);
        mpCount++;
      }
    }
    logCount("inserted menu_plans", mpCount);

    // ----------------------------------------
    // 10. Migrate temperature_logs -> menu_plan_temperatures
    // ----------------------------------------
    log("--- Migrating temperature_logs -> menu_plan_temperatures ---");
    const tempLogs = sqlite.prepare("SELECT * FROM temperature_logs ORDER BY id").all() as any[];
    logCount("source temperature_logs", tempLogs.length);

    let tempCount = 0;
    for (const tl of tempLogs) {
      if (!tl.plan_id) continue;
      // Find the matching menu_plan entry for this plan + slot
      const newPlanIds = planIdMap[tl.plan_id];
      if (!newPlanIds || newPlanIds.length === 0) continue;

      // We use the first menu_plan created for this weekly_plan as reference
      const menuPlanId = newPlanIds[0];

      if (DRY_RUN) { tempCount++; continue; }

      const tempCore = tl.temp_core ? parseFloat(tl.temp_core) : null;
      const tempServing = tl.temp_serving ? parseFloat(tl.temp_serving) : null;

      if (tempCore === null && tempServing === null) continue;

      await client.query(
        `INSERT INTO menu_plan_temperatures (menu_plan_id, dish_slot, temp_core, temp_serving, recorded_at, recorded_by)
        VALUES ($1, $2, $3, $4, $5, NULL)`,
        [menuPlanId, tl.dish_slot || "main", tempCore, tempServing, tl.recorded_at ? new Date(tl.recorded_at) : new Date()]
      );
      tempCount++;
    }
    logCount("inserted menu_plan_temperatures", tempCount);

    // ----------------------------------------
    // Commit
    // ----------------------------------------
    if (!DRY_RUN) {
      await client.query("COMMIT");
      log("=== Migration committed successfully ===");
    } else {
      log("=== Dry run complete (no changes made) ===");
    }

    // Summary
    log("\n--- Summary ---");
    log(`  Recipes: ${Object.keys(dishIdMap).length}`);
    log(`  Master Ingredients: ${Object.keys(masterIngIdMap).length}`);
    log(`  Recipe Ingredients: ${ingredientCount}`);
    log(`  Rotation Slots: ${slotCount}`);
    log(`  Guest Counts: ${gcCount}`);
    log(`  Catering Events: ${Object.keys(eventIdMap).length}`);
    log(`  Catering Menu Items: ${miCount}`);
    log(`  Menu Plans: ${mpCount}`);
    log(`  Temperature Logs: ${tempCount}`);
  } catch (err) {
    if (!DRY_RUN) await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

// ========================
// Utility: ISO Week + Day -> Date
// ========================

function isoWeekToDate(year: number, week: number, dow: number): string {
  // dow: 0=Sunday, 1=Monday...6=Saturday
  // ISO: Week 1 is the week with Jan 4th. Monday = first day.
  const jan4 = new Date(year, 0, 4);
  const jan4Dow = jan4.getDay() || 7; // 1=Mon...7=Sun
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - jan4Dow + 1);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  // dow: 0=Sun -> offset 6 from Monday, 1=Mon -> 0, ... 6=Sat -> 5
  const offset = dow === 0 ? 6 : dow - 1;
  const targetDate = new Date(targetMonday);
  targetDate.setDate(targetMonday.getDate() + offset);

  return targetDate.toISOString().split("T")[0];
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

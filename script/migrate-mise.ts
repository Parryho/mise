/**
 * Migration: Mise-Before-Serve (PostgreSQL) -> mise (PostgreSQL)
 *
 * Copies data from the original mise-before-serve database into the new mise database.
 * Since both are PostgreSQL with Drizzle, the table structures are similar.
 * Main changes: add default locationId, ensure new columns have defaults.
 *
 * Prerequisites:
 * - The new mise DB must have the schema already pushed (drizzle-kit push)
 * - The original mise-before-serve DB must be accessible
 *
 * Usage:
 *   npx tsx script/migrate-mise.ts [--dry-run]
 */

import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");

const SOURCE_URL = process.env.SOURCE_DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/postgres";
const TARGET_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

function log(msg: string) {
  console.log(`[migrate-mise] ${msg}`);
}

async function main() {
  log(`Source: ${SOURCE_URL.replace(/:[^@]+@/, ':***@')}`);
  log(`Target: ${TARGET_URL.replace(/:[^@]+@/, ':***@')}`);
  log(`Dry run: ${DRY_RUN}`);

  const source = new Pool({ connectionString: SOURCE_URL });
  const target = new Pool({ connectionString: TARGET_URL });

  const srcClient = await source.connect();
  const tgtClient = await target.connect();

  try {
    if (!DRY_RUN) await tgtClient.query("BEGIN");

    // ----------------------------------------
    // 1. Ensure locations exist
    // ----------------------------------------
    log("--- Ensuring locations ---");
    if (!DRY_RUN) {
      await tgtClient.query(`
        INSERT INTO locations (slug, name, default_pax, is_active)
        VALUES ('city', 'JUFA City', 60, true),
               ('sued', 'JUFA SÜD', 45, true),
               ('ak', 'AK Catering', 80, true)
        ON CONFLICT (slug) DO NOTHING
      `);
    }
    const locResult = await tgtClient.query("SELECT id, slug FROM locations");
    const locBySlug: Record<string, number> = {};
    for (const row of locResult.rows) locBySlug[row.slug] = row.id;
    const defaultLocId = locBySlug["city"] || 1;
    log(`  Locations: ${JSON.stringify(locBySlug)}, default=${defaultLocId}`);

    // ----------------------------------------
    // 2. Migrate users
    // ----------------------------------------
    log("--- Migrating users ---");
    const users = (await srcClient.query("SELECT * FROM users ORDER BY created_at")).rows;
    log(`  Source: ${users.length} users`);

    for (const u of users) {
      if (DRY_RUN) continue;
      await tgtClient.query(
        `INSERT INTO users (id, username, password, name, email, position, role, is_approved, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [u.id, u.username, u.password, u.name, u.email, u.position, u.role, u.is_approved, u.created_at]
      );
    }

    // ----------------------------------------
    // 3. Migrate app_settings
    // ----------------------------------------
    log("--- Migrating app_settings ---");
    const settings = (await srcClient.query("SELECT * FROM app_settings")).rows;
    log(`  Source: ${settings.length} settings`);

    for (const s of settings) {
      if (DRY_RUN) continue;
      await tgtClient.query(
        `INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [s.key, s.value]
      );
    }

    // ----------------------------------------
    // 4. Migrate recipes
    // ----------------------------------------
    log("--- Migrating recipes ---");
    const recipes = (await srcClient.query("SELECT * FROM recipes ORDER BY id")).rows;
    log(`  Source: ${recipes.length} recipes`);

    const recipeIdMap: Record<number, number> = {};
    for (const r of recipes) {
      if (DRY_RUN) { recipeIdMap[r.id] = r.id; continue; }

      const existing = await tgtClient.query(
        "SELECT id FROM recipes WHERE LOWER(name) = LOWER($1)",
        [r.name]
      );

      if (existing.rows.length > 0) {
        recipeIdMap[r.id] = existing.rows[0].id;
      } else {
        const result = await tgtClient.query(
          `INSERT INTO recipes (name, category, portions, prep_time, image, source_url, steps, allergens, tags, updated_at, season, prep_instructions)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'all', NULL)
          RETURNING id`,
          [r.name, r.category, r.portions, r.prep_time, r.image, r.source_url, r.steps, r.allergens, r.tags, r.updated_at]
        );
        recipeIdMap[r.id] = result.rows[0].id;
      }
    }
    log(`  Mapped: ${Object.keys(recipeIdMap).length} recipes`);

    // ----------------------------------------
    // 5. Migrate ingredients (recipe ingredients)
    // ----------------------------------------
    log("--- Migrating ingredients ---");
    const ings = (await srcClient.query("SELECT * FROM ingredients ORDER BY id")).rows;
    log(`  Source: ${ings.length} ingredients`);

    let ingCount = 0;
    for (const i of ings) {
      const newRecipeId = recipeIdMap[i.recipe_id];
      if (!newRecipeId) continue;
      if (DRY_RUN) { ingCount++; continue; }

      await tgtClient.query(
        `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens)
        VALUES ($1, $2, $3, $4, $5)`,
        [newRecipeId, i.name, i.amount, i.unit, i.allergens || []]
      );
      ingCount++;
    }
    log(`  Inserted: ${ingCount} ingredients`);

    // ----------------------------------------
    // 6. Migrate fridges
    // ----------------------------------------
    log("--- Migrating fridges ---");
    const fridges = (await srcClient.query("SELECT * FROM fridges ORDER BY id")).rows;
    log(`  Source: ${fridges.length} fridges`);

    const fridgeIdMap: Record<number, number> = {};
    for (const f of fridges) {
      if (DRY_RUN) { fridgeIdMap[f.id] = f.id; continue; }
      const result = await tgtClient.query(
        `INSERT INTO fridges (name, temp_min, temp_max, location_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [f.name, f.temp_min, f.temp_max, defaultLocId]
      );
      fridgeIdMap[f.id] = result.rows[0].id;
    }

    // ----------------------------------------
    // 7. Migrate haccp_logs
    // ----------------------------------------
    log("--- Migrating haccp_logs ---");
    const haccpLogs = (await srcClient.query("SELECT * FROM haccp_logs ORDER BY id")).rows;
    log(`  Source: ${haccpLogs.length} haccp_logs`);

    let haccpCount = 0;
    for (const h of haccpLogs) {
      const newFridgeId = fridgeIdMap[h.fridge_id];
      if (!newFridgeId) continue;
      if (DRY_RUN) { haccpCount++; continue; }

      await tgtClient.query(
        `INSERT INTO haccp_logs (fridge_id, temperature, timestamp, "user", status, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [newFridgeId, h.temperature, h.timestamp, h.user, h.status, h.notes]
      );
      haccpCount++;
    }
    log(`  Inserted: ${haccpCount} haccp_logs`);

    // ----------------------------------------
    // 8. Migrate guest_counts
    // ----------------------------------------
    log("--- Migrating guest_counts ---");
    const guestCounts = (await srcClient.query("SELECT * FROM guest_counts ORDER BY id")).rows;
    log(`  Source: ${guestCounts.length} guest_counts`);

    let gcCount = 0;
    for (const gc of guestCounts) {
      if (DRY_RUN) { gcCount++; continue; }
      await tgtClient.query(
        `INSERT INTO guest_counts (date, meal, adults, children, notes, location_id, source)
        VALUES ($1, $2, $3, $4, $5, $6, 'manual')`,
        [gc.date, gc.meal, gc.adults, gc.children, gc.notes, defaultLocId]
      );
      gcCount++;
    }
    log(`  Inserted: ${gcCount} guest_counts`);

    // ----------------------------------------
    // 9. Migrate catering_events
    // ----------------------------------------
    log("--- Migrating catering_events ---");
    const events = (await srcClient.query("SELECT * FROM catering_events ORDER BY id")).rows;
    log(`  Source: ${events.length} catering_events`);

    const eventIdMap: Record<number, number> = {};
    for (const e of events) {
      if (DRY_RUN) { eventIdMap[e.id] = e.id; continue; }
      const result = await tgtClient.query(
        `INSERT INTO catering_events
          (client_name, event_name, date, time, person_count, dishes, notes,
           event_type, time_start, time_end, contact_person, room, status, airtable_id, location_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id`,
        [
          e.client_name, e.event_name, e.date, e.time, e.person_count,
          e.dishes || [], e.notes,
          e.event_type || "sonstiges", e.time_start, e.time_end,
          e.contact_person, e.room, e.status || "geplant", e.airtable_id,
          defaultLocId,
        ]
      );
      eventIdMap[e.id] = result.rows[0].id;
    }
    log(`  Mapped: ${Object.keys(eventIdMap).length} catering_events`);

    // ----------------------------------------
    // 10. Migrate staff
    // ----------------------------------------
    log("--- Migrating staff ---");
    const staffRows = (await srcClient.query("SELECT * FROM staff ORDER BY id")).rows;
    log(`  Source: ${staffRows.length} staff`);

    const staffIdMap: Record<number, number> = {};
    for (const s of staffRows) {
      if (DRY_RUN) { staffIdMap[s.id] = s.id; continue; }
      const result = await tgtClient.query(
        `INSERT INTO staff (name, role, color, email, phone, user_id, location_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [s.name, s.role, s.color, s.email, s.phone, s.user_id, defaultLocId]
      );
      staffIdMap[s.id] = result.rows[0].id;
    }

    // ----------------------------------------
    // 11. Migrate shift_types
    // ----------------------------------------
    log("--- Migrating shift_types ---");
    const shifts = (await srcClient.query("SELECT * FROM shift_types ORDER BY id")).rows;
    log(`  Source: ${shifts.length} shift_types`);

    const shiftIdMap: Record<number, number> = {};
    for (const s of shifts) {
      if (DRY_RUN) { shiftIdMap[s.id] = s.id; continue; }
      const result = await tgtClient.query(
        `INSERT INTO shift_types (name, start_time, end_time, color) VALUES ($1, $2, $3, $4) RETURNING id`,
        [s.name, s.start_time, s.end_time, s.color]
      );
      shiftIdMap[s.id] = result.rows[0].id;
    }

    // ----------------------------------------
    // 12. Migrate schedule_entries
    // ----------------------------------------
    log("--- Migrating schedule_entries ---");
    const schedules = (await srcClient.query("SELECT * FROM schedule_entries ORDER BY id")).rows;
    log(`  Source: ${schedules.length} schedule_entries`);

    let schedCount = 0;
    for (const se of schedules) {
      const newStaffId = staffIdMap[se.staff_id];
      if (!newStaffId) continue;
      const newShiftId = se.shift_type_id ? (shiftIdMap[se.shift_type_id] || null) : null;
      if (DRY_RUN) { schedCount++; continue; }

      await tgtClient.query(
        `INSERT INTO schedule_entries (staff_id, date, type, shift_type_id, shift, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [newStaffId, se.date, se.type, newShiftId, se.shift, se.notes]
      );
      schedCount++;
    }
    log(`  Inserted: ${schedCount} schedule_entries`);

    // ----------------------------------------
    // 13. Migrate menu_plans
    // ----------------------------------------
    log("--- Migrating menu_plans ---");
    const menuPlans = (await srcClient.query("SELECT * FROM menu_plans ORDER BY id")).rows;
    log(`  Source: ${menuPlans.length} menu_plans`);

    let mpCount = 0;
    for (const mp of menuPlans) {
      const newRecipeId = mp.recipe_id ? (recipeIdMap[mp.recipe_id] || null) : null;
      if (DRY_RUN) { mpCount++; continue; }

      await tgtClient.query(
        `INSERT INTO menu_plans (date, meal, course, recipe_id, portions, notes, location_id, rotation_week_nr)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
        [mp.date, mp.meal, mp.course || "main", newRecipeId, mp.portions, mp.notes, defaultLocId]
      );
      mpCount++;
    }
    log(`  Inserted: ${mpCount} menu_plans`);

    // ----------------------------------------
    // 14. Migrate tasks
    // ----------------------------------------
    log("--- Migrating tasks ---");
    const taskRows = (await srcClient.query("SELECT * FROM tasks ORDER BY id")).rows;
    log(`  Source: ${taskRows.length} tasks`);

    let taskCount = 0;
    for (const t of taskRows) {
      if (DRY_RUN) { taskCount++; continue; }
      await tgtClient.query(
        `INSERT INTO tasks (date, title, note, assigned_to_user_id, status, priority, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [t.date, t.title, t.note, t.assigned_to_user_id, t.status, t.priority, t.created_at]
      );
      taskCount++;
    }
    log(`  Inserted: ${taskCount} tasks`);

    // ----------------------------------------
    // 15. Migrate task_templates
    // ----------------------------------------
    log("--- Migrating task_templates ---");
    const templates = (await srcClient.query("SELECT * FROM task_templates ORDER BY id")).rows;
    log(`  Source: ${templates.length} task_templates`);

    let ttCount = 0;
    for (const tt of templates) {
      if (DRY_RUN) { ttCount++; continue; }
      await tgtClient.query(
        `INSERT INTO task_templates (name, items, created_at) VALUES ($1, $2, $3)`,
        [tt.name, tt.items, tt.created_at]
      );
      ttCount++;
    }
    log(`  Inserted: ${ttCount} task_templates`);

    // ----------------------------------------
    // Commit
    // ----------------------------------------
    if (!DRY_RUN) {
      await tgtClient.query("COMMIT");
      log("=== Migration committed successfully ===");
    } else {
      log("=== Dry run complete (no changes made) ===");
    }
  } catch (err) {
    if (!DRY_RUN) await tgtClient.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    srcClient.release();
    tgtClient.release();
    await source.end();
    await target.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

/**
 * Seed demo data for development/testing.
 * Creates locations, a sample admin user, and a few test recipes.
 *
 * Usage:
 *   npx tsx script/seed-demo.ts
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

function log(msg: string) {
  console.log(`[seed-demo] ${msg}`);
}

async function main() {
  log(`Database: ${DB_URL.replace(/:[^@]+@/, ':***@')}`);

  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ----------------------------------------
    // 1. Locations
    // ----------------------------------------
    log("--- Seeding locations ---");
    await client.query(`
      INSERT INTO locations (slug, name, default_pax, is_active)
      VALUES
        ('city', 'JUFA City', 60, true),
        ('sued', 'JUFA SÜD', 45, true),
        ('ak', 'AK Catering', 80, true)
      ON CONFLICT (slug) DO NOTHING
    `);

    // ----------------------------------------
    // 2. Admin user
    // ----------------------------------------
    log("--- Seeding admin user ---");
    const hashedPw = await bcrypt.hash("admin123", 10);
    await client.query(`
      INSERT INTO users (id, username, password, name, email, position, role, is_approved)
      VALUES (gen_random_uuid(), 'admin', $1, 'Küchenchef', 'admin@mise.at', 'Küchenchef', 'admin', true)
      ON CONFLICT (username) DO NOTHING
    `, [hashedPw]);

    // ----------------------------------------
    // 3. Sample recipes
    // ----------------------------------------
    log("--- Seeding sample recipes ---");
    const sampleRecipes = [
      { name: "Klare Rindsuppe mit Frittaten", category: "ClearSoups", allergens: ["A", "C", "G"], season: "all" },
      { name: "Kürbiscremesuppe", category: "CreamSoups", allergens: ["G"], season: "winter" },
      { name: "Wiener Schnitzel", category: "MainMeat", allergens: ["A", "C"], season: "all" },
      { name: "Gebratener Zanderfilet", category: "MainFish", allergens: ["D"], season: "all" },
      { name: "Gemüsecurry mit Basmatireis", category: "MainVegan", allergens: ["F"], season: "all" },
      { name: "Kartoffelpüree", category: "Sides", allergens: ["G"], season: "all" },
      { name: "Gemischter Blattsalat", category: "Salads", allergens: [], season: "summer" },
      { name: "Kaiserschmarrn", category: "HotDesserts", allergens: ["A", "C", "G"], season: "all" },
    ];

    for (const r of sampleRecipes) {
      await client.query(
        `INSERT INTO recipes (name, category, portions, prep_time, steps, allergens, tags, season, updated_at)
        VALUES ($1, $2, 1, 30, $3, $4, $5, $6, NOW())
        ON CONFLICT DO NOTHING`,
        [r.name, r.category, [], r.allergens, [], r.season]
      );
    }

    // ----------------------------------------
    // 4. Sample shift types
    // ----------------------------------------
    log("--- Seeding shift types ---");
    const shifts = [
      { name: "Frühdienst", start: "06:00", end: "14:30", color: "#22c55e" },
      { name: "Spätdienst", start: "14:00", end: "22:00", color: "#3b82f6" },
      { name: "Teildienst", start: "10:00", end: "14:00", color: "#f59e0b" },
    ];

    for (const s of shifts) {
      await client.query(
        `INSERT INTO shift_types (name, start_time, end_time, color)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM shift_types WHERE name = $1)`,
        [s.name, s.start, s.end, s.color]
      );
    }

    // ----------------------------------------
    // 5. Sample fridges
    // ----------------------------------------
    log("--- Seeding fridges ---");
    const locResult = await client.query("SELECT id FROM locations WHERE slug = 'city'");
    const cityLocId = locResult.rows[0]?.id || null;

    const fridges = [
      { name: "Kühlhaus 1 (Fleisch)", min: -2, max: 4 },
      { name: "Kühlhaus 2 (Gemüse)", min: 2, max: 7 },
      { name: "Tiefkühler", min: -25, max: -18 },
    ];

    for (const f of fridges) {
      await client.query(
        `INSERT INTO fridges (name, temp_min, temp_max, location_id)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM fridges WHERE name = $1)`,
        [f.name, f.min, f.max, cityLocId]
      );
    }

    await client.query("COMMIT");
    log("=== Demo data seeded successfully ===");

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

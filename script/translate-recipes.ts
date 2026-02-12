/**
 * Batch-Übersetzung aller Rezepte + Zutaten via Google Translate (gratis).
 *
 * Usage:
 *   npx tsx script/translate-recipes.ts              # Alle 3 Sprachen
 *   npx tsx script/translate-recipes.ts --lang en     # Nur Englisch
 *   npx tsx script/translate-recipes.ts --lang tr     # Nur Türkisch
 *   npx tsx script/translate-recipes.ts --lang uk     # Nur Ukrainisch
 *   npx tsx script/translate-recipes.ts --dry-run     # Nur zählen, nichts schreiben
 *
 * Resumable: Überspringt bereits übersetzte Einträge automatisch.
 * Rate-Limiting: 100ms Pause zwischen Requests.
 */

import { translate } from "@vitalets/google-translate-api";
import pkg from "pg";
const { Pool } = pkg;

// --- Config ---
const LANGS = ["en", "tr", "uk"] as const;
type Lang = (typeof LANGS)[number];
const DELAY_MS = 100; // Pause zwischen API-Calls
const BATCH_SIZE = 50; // DB-Insert Batch-Größe

// --- Args ---
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const langIdx = args.indexOf("--lang");
const selectedLangs: Lang[] = langIdx !== -1 && args[langIdx + 1]
  ? [args[langIdx + 1] as Lang]
  : [...LANGS];

// --- DB ---
const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:CyMmZyDm8LEUTwcNZrkomRjkkNIFkMg@localhost:5432/mise";

// Try Docker internal first, then localhost
async function createPool(): Promise<pkg.Pool> {
  // Check if we can reach the DB via Docker network
  for (const host of ["172.18.0.3", "172.17.0.1", "localhost", "127.0.0.1"]) {
    const url = DB_URL.replace("localhost", host).replace("127.0.0.1", host);
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 3000 });
    try {
      const client = await pool.connect();
      client.release();
      console.log(`DB connected via ${host}`);
      return pool;
    } catch {
      await pool.end();
    }
  }
  throw new Error("Kann keine DB-Verbindung herstellen");
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateText(text: string, to: Lang): Promise<string> {
  if (!text || text.trim() === "") return text;
  try {
    const result = await translate(text, { from: "de", to });
    return result.text;
  } catch (err: any) {
    // Bei Rate-Limit: warten und nochmal
    if (err.message?.includes("429") || err.message?.includes("Too Many")) {
      console.log("  ⏳ Rate-limit, warte 5s...");
      await sleep(5000);
      const result = await translate(text, { from: "de", to });
      return result.text;
    }
    console.error(`  ⚠ Übersetzungsfehler: ${err.message}`);
    return text; // Fallback: Original zurückgeben
  }
}

async function translateSteps(steps: string[], to: Lang): Promise<string[]> {
  if (!steps || steps.length === 0) return [];
  // Alle Steps als einen Text übersetzen (effizienter, weniger API-Calls)
  const separator = " ||| ";
  const joined = steps.join(separator);
  const translated = await translateText(joined, to);
  return translated.split(separator).map(s => s.trim());
}

interface Recipe {
  id: number;
  name: string;
  steps: string[];
  prep_instructions: string | null;
}

interface Ingredient {
  id: number;
  recipe_id: number;
  name: string;
}

async function main() {
  console.log("🌍 Rezept-Übersetzung gestartet");
  console.log(`   Sprachen: ${selectedLangs.join(", ")}`);
  console.log(`   Dry-Run: ${dryRun}`);
  console.log("");

  const pool = await createPool();

  try {
    for (const lang of selectedLangs) {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`📖 Sprache: ${lang.toUpperCase()}`);
      console.log(`${"=".repeat(50)}`);

      // --- Rezepte ---
      const allRecipes = await pool.query<Recipe>(
        "SELECT id, name, steps, prep_instructions FROM recipes ORDER BY id"
      );
      const existingRecipeTranslations = await pool.query<{ recipe_id: number }>(
        "SELECT recipe_id FROM recipe_translations WHERE lang = $1",
        [lang]
      );
      const translatedRecipeIds = new Set(existingRecipeTranslations.rows.map(r => r.recipe_id));
      const pendingRecipes = allRecipes.rows.filter(r => !translatedRecipeIds.has(r.id));

      console.log(`\n🍳 Rezepte: ${pendingRecipes.length} offen (${translatedRecipeIds.size} bereits übersetzt)`);

      if (!dryRun) {
        for (let i = 0; i < pendingRecipes.length; i++) {
          const recipe = pendingRecipes[i];
          const translatedName = await translateText(recipe.name, lang);
          await sleep(DELAY_MS);
          const translatedSteps = await translateSteps(recipe.steps, lang);
          await sleep(DELAY_MS);
          const translatedPrep = recipe.prep_instructions
            ? await translateText(recipe.prep_instructions, lang)
            : null;
          if (recipe.prep_instructions) await sleep(DELAY_MS);

          await pool.query(
            `INSERT INTO recipe_translations (recipe_id, lang, name, steps, prep_instructions)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (recipe_id, lang) DO UPDATE SET name = $3, steps = $4, prep_instructions = $5`,
            [recipe.id, lang, translatedName, translatedSteps, translatedPrep]
          );

          if ((i + 1) % 10 === 0 || i === pendingRecipes.length - 1) {
            console.log(`  ✅ Rezepte: ${i + 1}/${pendingRecipes.length} (${recipe.name} → ${translatedName})`);
          }
        }
      }

      // --- Zutaten ---
      const allIngredients = await pool.query<Ingredient>(
        "SELECT id, recipe_id, name FROM ingredients ORDER BY id"
      );
      const existingIngredientTranslations = await pool.query<{ ingredient_id: number }>(
        "SELECT ingredient_id FROM ingredient_translations WHERE lang = $1",
        [lang]
      );
      const translatedIngIds = new Set(existingIngredientTranslations.rows.map(r => r.ingredient_id));
      const pendingIngredients = allIngredients.rows.filter(r => !translatedIngIds.has(r.id));

      console.log(`\n🥕 Zutaten: ${pendingIngredients.length} offen (${translatedIngIds.size} bereits übersetzt)`);

      if (!dryRun) {
        // Zutaten in Batches übersetzen (effizienter)
        for (let i = 0; i < pendingIngredients.length; i += BATCH_SIZE) {
          const batch = pendingIngredients.slice(i, i + BATCH_SIZE);

          // Unique Namen sammeln um Duplikate zu vermeiden
          const uniqueNames = [...new Set(batch.map(ing => ing.name))];
          const separator = " ||| ";
          const joined = uniqueNames.join(separator);
          const translated = await translateText(joined, lang);
          const translatedNames = translated.split(separator).map(s => s.trim());

          // Map erstellen: originalName → translatedName
          const nameMap = new Map<string, string>();
          uniqueNames.forEach((name, idx) => {
            nameMap.set(name, translatedNames[idx] || name);
          });

          // In DB schreiben
          for (const ing of batch) {
            const translatedName = nameMap.get(ing.name) || ing.name;
            await pool.query(
              `INSERT INTO ingredient_translations (ingredient_id, lang, name)
               VALUES ($1, $2, $3)
               ON CONFLICT (ingredient_id, lang) DO UPDATE SET name = $3`,
              [ing.id, lang, translatedName]
            );
          }

          await sleep(DELAY_MS * 2);
          const done = Math.min(i + BATCH_SIZE, pendingIngredients.length);
          console.log(`  ✅ Zutaten: ${done}/${pendingIngredients.length}`);
        }
      }
    }

    // --- Fortschritt speichern ---
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM recipes) as total_recipes,
        (SELECT COUNT(DISTINCT recipe_id) FROM recipe_translations WHERE lang = 'en') as en_recipes,
        (SELECT COUNT(DISTINCT recipe_id) FROM recipe_translations WHERE lang = 'tr') as tr_recipes,
        (SELECT COUNT(DISTINCT recipe_id) FROM recipe_translations WHERE lang = 'uk') as uk_recipes,
        (SELECT COUNT(*) FROM ingredients) as total_ingredients,
        (SELECT COUNT(DISTINCT ingredient_id) FROM ingredient_translations WHERE lang = 'en') as en_ingredients,
        (SELECT COUNT(DISTINCT ingredient_id) FROM ingredient_translations WHERE lang = 'tr') as tr_ingredients,
        (SELECT COUNT(DISTINCT ingredient_id) FROM ingredient_translations WHERE lang = 'uk') as uk_ingredients
    `);
    const s = stats.rows[0];

    console.log(`\n${"=".repeat(50)}`);
    console.log("📊 FORTSCHRITT");
    console.log(`${"=".repeat(50)}`);
    console.log(`Rezepte (${s.total_recipes} total):`);
    console.log(`  EN: ${s.en_recipes}/${s.total_recipes}`);
    console.log(`  TR: ${s.tr_recipes}/${s.total_recipes}`);
    console.log(`  UK: ${s.uk_recipes}/${s.total_recipes}`);
    console.log(`Zutaten (${s.total_ingredients} total):`);
    console.log(`  EN: ${s.en_ingredients}/${s.total_ingredients}`);
    console.log(`  TR: ${s.tr_ingredients}/${s.total_ingredients}`);
    console.log(`  UK: ${s.uk_ingredients}/${s.total_ingredients}`);

  } finally {
    await pool.end();
  }

  console.log("\n✅ Fertig!");
}

main().catch(err => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});

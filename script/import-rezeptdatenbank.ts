/**
 * Import: Rezeptdatenbank.xlsb → mise DB
 *
 * Parses the hotel recipe database (Excel Binary) and:
 * - Matches recipes by name to existing DB entries
 * - Updates ingredients + allergens for matched recipes
 * - Optionally inserts new recipes (--insert-new)
 *
 * Usage:
 *   npx tsx script/import-rezeptdatenbank.ts <path-to-xlsb>
 *   npx tsx script/import-rezeptdatenbank.ts <path-to-xlsb> --dry-run
 *   npx tsx script/import-rezeptdatenbank.ts <path-to-xlsb> --insert-new
 *   npx tsx script/import-rezeptdatenbank.ts <path-to-xlsb> --limit 10
 *   DATABASE_URL=postgresql://... npx tsx script/import-rezeptdatenbank.ts <path-to-xlsb>
 */

import { Pool } from "pg";
import XLSX from "xlsx";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const INSERT_NEW = process.argv.includes("--insert-new");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 0;
})();

const FILE_PATH = process.argv.find(a => a.endsWith(".xlsb") || a.endsWith(".xlsx")) || "";

if (!FILE_PATH) {
  console.error("Usage: npx tsx script/import-rezeptdatenbank.ts <path-to-xlsb> [--dry-run] [--insert-new] [--limit N]");
  process.exit(1);
}

// ── Sheet-to-Category mapping ────────────────────────────────
const SHEET_CATEGORY: Record<string, string> = {
  "Suppen": "ClearSoups",
  "Salate": "Salads",
  "Sauce": "HotSauces",
  "Gemüsebeilage": "Sides",
  "Sättigungsbeilage": "Sides",
  "HS DIV": "MainMeat",
  "HS VEGET": "MainVegan",
  "HS FISCH": "MainFish",
  "HS SÜSS": "HotDesserts",
  "Kompotte": "ColdDesserts",
  "Dessert": "ColdDesserts",
  "Jause": "Sides",
  "Breie": "CreamSoups",
  "ABEND Kalt": "Salads",
  "ABEND Warm": "MainMeat",
};
const SKIP_SHEETS = new Set(["Muster", "VitalcremeVitalshake"]);

// ── Allergen normalization ───────────────────────────────────
// The xlsb uses both "ACGF" (concatenated) and "A,C,G,F" (comma-separated)
const VALID_ALLERGEN_CODES = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "L", "M", "N", "O", "P", "R"]);

function normalizeAllergens(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  // Remove spaces, split by comma or individual chars
  const cleaned = raw.replace(/\s+/g, "").replace(/,/g, "");
  const codes: string[] = [];
  for (const char of cleaned.toUpperCase()) {
    if (VALID_ALLERGEN_CODES.has(char) && !codes.includes(char)) {
      codes.push(char);
    }
  }
  return codes.sort();
}

// ── Parse ingredient blocks ──────────────────────────────────

interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  allergens: string[];
  supplier?: string;
}

interface ParsedRecipe {
  name: string;
  allergens: string[];
  category: string;
  sheet: string;
  kcal: number;
  ingredients: ParsedIngredient[];
  portions: number; // always 10 in this DB
}

// 4 recipe blocks per row group, each with specific column offsets
const BLOCK_DEFS = [
  { nameCol: 12, allergenCol: 15, amountCol: 16, unitCol: 17, supplierCol: 13, personsCol: 10 },
  { nameCol: 26, allergenCol: 29, amountCol: 30, unitCol: 31, supplierCol: 27, personsCol: 24 },
  { nameCol: 40, allergenCol: 43, amountCol: 44, unitCol: 45, supplierCol: 41, personsCol: 38 },
  { nameCol: 54, allergenCol: 57, amountCol: 58, unitCol: 59, supplierCol: 55, personsCol: 52 },
];

function parseSheet(wb: XLSX.WorkBook, sheetName: string): ParsedRecipe[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  const category = SHEET_CATEGORY[sheetName] || "Sides";

  // Find block-start rows: rows where col[10]='Anzahl Pers.:' or col[16]='Menge'
  const blockStarts: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    if (row[10] === "Anzahl Pers.:" || (row[16] === "Menge" && typeof row[12] === "string" && row[12].length > 2 && row[12] !== "Zutat")) {
      blockStarts.push(i);
    }
  }

  const recipes: ParsedRecipe[] = [];

  for (let b = 0; b < blockStarts.length; b++) {
    const startRow = blockStarts[b];
    const endRow = blockStarts[b + 1] || data.length;

    for (const block of BLOCK_DEFS) {
      const recipeName = data[startRow]?.[block.nameCol];
      if (!recipeName || typeof recipeName !== "string" || recipeName.length < 3) continue;

      const allergenRaw = data[startRow]?.[block.allergenCol] || "";
      const allergens = normalizeAllergens(String(allergenRaw));

      // Get portions (usually 10)
      const personsRow = data[startRow + 1];
      const portions = (personsRow && typeof personsRow[block.personsCol] === "number") ? personsRow[block.personsCol] : 10;

      // Parse ingredients (start 3 rows after block header to skip header rows)
      const ingredients: ParsedIngredient[] = [];
      for (let i = startRow + 3; i < endRow; i++) {
        const row = data[i];
        if (!row) continue;
        const zutat = row[block.nameCol];
        if (!zutat || typeof zutat !== "string" || !zutat.trim() || zutat === "Zutat") continue;

        const amount = typeof row[block.amountCol] === "number" ? row[block.amountCol] : 0;
        const unit = row[block.unitCol] || "Stk";
        const ingAllergen = row[block.allergenCol] ? normalizeAllergens(String(row[block.allergenCol])) : [];
        const supplier = row[block.supplierCol] || undefined;

        ingredients.push({
          name: zutat.trim(),
          amount: Math.round(amount * 1000) / 1000, // round to 3 decimal places
          unit: String(unit).trim(),
          allergens: ingAllergen,
          supplier: supplier ? String(supplier).trim() : undefined,
        });
      }

      // Find kcal from the left-side index
      let kcal = 0;
      for (let i = startRow; i < endRow; i++) {
        const row = data[i];
        if (row && row[3] === recipeName.trim() && typeof row[5] === "number") {
          kcal = row[5];
          break;
        }
      }

      recipes.push({
        name: recipeName.trim(),
        allergens,
        category,
        sheet: sheetName,
        kcal,
        ingredients,
        portions,
      });
    }
  }

  return recipes;
}

// ── Main ─────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[import-xlsb] ${msg}`);
}

async function main() {
  log(`Reading ${FILE_PATH}...`);
  const wb = XLSX.readFile(FILE_PATH);

  // Parse all sheets
  const allRecipes: ParsedRecipe[] = [];
  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) continue;
    const recipes = parseSheet(wb, sheetName);
    if (recipes.length > 0) {
      log(`  ${sheetName}: ${recipes.length} Rezepte`);
    }
    allRecipes.push(...recipes);
  }

  log(`Gesamt: ${allRecipes.length} Rezepte aus xlsb`);
  log(`  Davon mit Zutaten: ${allRecipes.filter(r => r.ingredients.length > 0).length}`);

  // Deduplicate by name (keep first occurrence)
  const seen = new Set<string>();
  const unique: ParsedRecipe[] = [];
  for (const r of allRecipes) {
    const key = r.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  log(`Unique Rezepte: ${unique.length} (${allRecipes.length - unique.length} Duplikate entfernt)`);

  const pool = new Pool({ connectionString: DB_URL });
  log(`Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}${INSERT_NEW ? " + INSERT NEW" : ""}`);
  if (LIMIT) log(`Limit: ${LIMIT}`);

  // Load existing recipes
  const { rows: existingRecipes } = await pool.query(`
    SELECT r.id, r.name, r.category, r.allergens, r.allergen_status,
      (SELECT COUNT(*) FROM ingredients i WHERE i.recipe_id = r.id) as ingredient_count
    FROM recipes r ORDER BY r.id
  `);
  log(`DB: ${existingRecipes.length} Rezepte vorhanden`);

  // Build name→recipe lookup (case-insensitive, trimmed)
  // Also try normalized forms: strip _lac, ", Beilage", "Gebr. " prefix
  const dbByName = new Map<string, typeof existingRecipes[0]>();
  for (const r of existingRecipes) {
    dbByName.set(r.name.toLowerCase().trim(), r);
  }

  function normalizeName(name: string): string {
    return name.toLowerCase()
      .replace(/_lac$/i, "")
      .replace(/, beilage$/i, "")
      .replace(/^gebr\.\s*/i, "gebratener ")
      .trim();
  }

  function findDbRecipe(xlsName: string) {
    const key = xlsName.toLowerCase().trim();
    // 1) Exact match
    if (dbByName.has(key)) return dbByName.get(key)!;
    // 2) Normalized xlsb name → exact DB name
    const norm = normalizeName(xlsName);
    if (norm !== key && dbByName.has(norm)) return dbByName.get(norm)!;
    // 3) Exact xlsb name → normalized DB names
    for (const [dbKey, dbRec] of dbByName) {
      if (normalizeName(dbKey) === key || normalizeName(dbKey) === norm) return dbRec;
    }
    return undefined;
  }

  let matched = 0;
  let updatedIngredients = 0;
  let updatedAllergens = 0;
  let inserted = 0;
  let noMatch = 0;
  let skippedVerified = 0;
  let processed = 0;
  const alreadyUpdated = new Set<number>(); // prevent double-updating from _LAC variants

  // Sort: prefer non-_LAC recipes first (they typically have more ingredients)
  const toProcess = (LIMIT ? unique.slice(0, LIMIT) : unique)
    .sort((a, b) => {
      const aLac = a.name.endsWith("_LAC") ? 1 : 0;
      const bLac = b.name.endsWith("_LAC") ? 1 : 0;
      return aLac - bLac;
    });

  for (const xlsRecipe of toProcess) {
    processed++;
    const dbRecipe = findDbRecipe(xlsRecipe.name);

    if (dbRecipe) {
      matched++;
      const needsIngredients = parseInt(dbRecipe.ingredient_count) === 0;
      const needsAllergens = !dbRecipe.allergens || dbRecipe.allergens.length === 0;
      const isVerified = dbRecipe.allergen_status === "verified";

      if ((isVerified && !needsIngredients) || alreadyUpdated.has(dbRecipe.id)) {
        skippedVerified++;
        continue;
      }
      alreadyUpdated.add(dbRecipe.id);

      if (!DRY_RUN) {
        // Update allergens from xlsb (authoritative source)
        if (xlsRecipe.allergens.length > 0 && !isVerified) {
          await pool.query(
            `UPDATE recipes SET allergens = $1, allergen_status = 'verified' WHERE id = $2`,
            [xlsRecipe.allergens, dbRecipe.id]
          );
          updatedAllergens++;
        }

        // Insert ingredients if recipe has none
        if (needsIngredients && xlsRecipe.ingredients.length > 0) {
          for (const ing of xlsRecipe.ingredients) {
            await pool.query(
              `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens) VALUES ($1, $2, $3, $4, $5)`,
              [dbRecipe.id, ing.name, ing.amount, ing.unit, ing.allergens]
            );
          }
          updatedIngredients++;
          log(`  ✓ ${xlsRecipe.name}: ${xlsRecipe.ingredients.length} Zutaten, Allergene: ${xlsRecipe.allergens.join(",") || "keine"}`);
        } else if (xlsRecipe.allergens.length > 0 && !isVerified) {
          log(`  ✓ ${xlsRecipe.name}: Allergene aktualisiert → ${xlsRecipe.allergens.join(",")}`);
        }
      } else {
        if (needsIngredients && xlsRecipe.ingredients.length > 0) {
          log(`  [dry] ${xlsRecipe.name}: würde ${xlsRecipe.ingredients.length} Zutaten importieren`);
          updatedIngredients++;
        }
        if (xlsRecipe.allergens.length > 0 && !isVerified) {
          updatedAllergens++;
        }
      }
    } else {
      noMatch++;
      if (INSERT_NEW && xlsRecipe.ingredients.length > 0) {
        if (!DRY_RUN) {
          const { rows } = await pool.query(
            `INSERT INTO recipes (name, category, allergens, allergen_status, portions)
             VALUES ($1, $2, $3, 'verified', $4) RETURNING id`,
            [xlsRecipe.name, xlsRecipe.category, xlsRecipe.allergens, xlsRecipe.portions]
          );
          const newId = rows[0].id;
          for (const ing of xlsRecipe.ingredients) {
            await pool.query(
              `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens) VALUES ($1, $2, $3, $4, $5)`,
              [newId, ing.name, ing.amount, ing.unit, ing.allergens]
            );
          }
          inserted++;
          log(`  + ${xlsRecipe.name}: NEU eingefügt (ID ${newId}, ${xlsRecipe.ingredients.length} Zutaten)`);
        } else {
          inserted++;
          log(`  [dry] ${xlsRecipe.name}: würde NEU eingefügt (${xlsRecipe.category}, ${xlsRecipe.ingredients.length} Zutaten)`);
        }
      }
    }
  }

  // Summary
  log("");
  log("══ Zusammenfassung ══");
  log(`Verarbeitet: ${processed} von ${unique.length}`);
  log(`DB-Matches: ${matched} (davon ${skippedVerified} bereits verified)`);
  log(`Zutaten aktualisiert: ${updatedIngredients}`);
  log(`Allergene aktualisiert: ${updatedAllergens}`);
  if (INSERT_NEW) log(`Neu eingefügt: ${inserted}`);
  log(`Kein Match in DB: ${noMatch}`);
  log("=== Fertig ===");

  await pool.end();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

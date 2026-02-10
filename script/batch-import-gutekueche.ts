/**
 * Batch-Import: Rezeptdaten von gutekueche.at nachschlagen.
 *
 * Sucht für jedes Rezept ohne Zutaten/Schritte auf gutekueche.at,
 * parst JSON-LD (Schema.org Recipe), und schreibt Zutaten + Schritte in die DB.
 *
 * Features:
 * - Resumable: persists discovered source_url so DDG is not re-queried
 * - Prefers stored source_url over DDG search
 * - Jittered delays to avoid rate-limiting
 * - Idempotent (überspringt Rezepte mit vorhandenen Daten)
 * - Fallback auf chefkoch.de wenn gutekueche.at kein Ergebnis liefert
 * - Detailliertes Logging
 *
 * Usage:
 *   npx tsx script/batch-import-gutekueche.ts
 *   npx tsx script/batch-import-gutekueche.ts --dry-run     # Nur suchen, nicht schreiben
 *   npx tsx script/batch-import-gutekueche.ts --limit 10    # Nur 10 Rezepte
 *   DATABASE_URL=postgresql://... npx tsx script/batch-import-gutekueche.ts
 */

import { Pool } from "pg";
import * as cheerio from "cheerio";
import { detectAllergens, getAllergensFromIngredients } from "../server/modules/recipe/allergen-detection";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 0;
})();

const SEARCH_DELAY_MS = 8000; // delay after DDG search to avoid rate-limiting
const LOOP_DELAY_MS = 2500;   // delay between recipe iterations
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ── Helpers ─────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitter(ms: number, pct = 0.4) {
  const d = ms * pct;
  return Math.round(ms - d + Math.random() * (2 * d));
}

function log(msg: string) {
  console.log(`[batch-import] ${msg}`);
}

// ── Search via DuckDuckGo HTML (bot-friendly, no JS needed) ─

async function searchRecipeUrl(recipeName: string, category?: string): Promise<{ url: string; source: string } | null> {
  // Try direct gutekueche.at URL first (slug-based, very fast, no DDG needed)
  const slug = recipeName.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const directUrl = `https://www.gutekueche.at/${slug}-rezept`;
  try {
    const probe = await fetch(directUrl, { method: "HEAD", headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
    if (probe.ok) {
      return { url: directUrl, source: "gutekueche.at" };
    }
  } catch { /* ignore */ }

  // Fallback: DDG search with quoted name
  for (const site of ["gutekueche.at", "chefkoch.de"]) {
    const name = `"${recipeName}"`;
    const query = encodeURIComponent(`${name} rezept site:${site}`);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;

    try {
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html",
          "Accept-Language": "de-DE,de;q=0.9",
        },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // DuckDuckGo HTML results: <a class="result__a" href="...">
      let foundUrl: string | null = null;

      $("a.result__a, a.result__url, a[href]").each((_, el) => {
        if (foundUrl) return;
        const href = $(el).attr("href") || "";

        // DuckDuckGo sometimes wraps: //duckduckgo.com/l/?uddg=ENCODED_URL
        if (href.includes("uddg=")) {
          const match = href.match(/uddg=([^&]+)/);
          if (match) {
            const decoded = decodeURIComponent(match[1]);
            // Accept any URL from the target site (not just those with "rezept" in path)
            if (decoded.includes(site) && decoded.startsWith("http")) {
              foundUrl = decoded;
            }
          }
        }
        // Direct URL from target site
        else if (href.includes(site)) {
          foundUrl = href.startsWith("http") ? href : `https:${href}`;
        }
      });

      if (foundUrl) {
        return { url: foundUrl, source: site };
      }
    } catch {
      continue;
    }

    await sleep(jitter(1000));
  }

  return null;
}

// ── Scrape recipe from URL (JSON-LD) ────────────────────────

interface ScrapedData {
  steps: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  portions: number;
  prepTime: number;
  image: string | null;
  sourceUrl: string;
}

async function scrapeRecipeUrl(url: string): Promise<ScrapedData | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9"
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse JSON-LD
    const scripts = $('script[type="application/ld+json"]').toArray();
    for (const script of scripts) {
      try {
        const data = JSON.parse($(script).html() || "");
        const recipe = findRecipeInJsonLd(data);
        if (recipe) {
          return { ...recipe, sourceUrl: url };
        }
      } catch { continue; }
    }
    return null;
  } catch {
    return null;
  }
}

function findRecipeInJsonLd(data: any): Omit<ScrapedData, "sourceUrl"> | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findRecipeInJsonLd(item);
      if (r) return r;
    }
    return null;
  }
  if (data?.["@type"] === "Recipe" || (Array.isArray(data?.["@type"]) && data["@type"].includes("Recipe"))) {
    return parseJsonLdRecipe(data);
  }
  if (data?.["@graph"]) return findRecipeInJsonLd(data["@graph"]);
  return null;
}

function parseJsonLdRecipe(data: any): Omit<ScrapedData, "sourceUrl"> {
  // Portions
  let portions = 4;
  if (data.recipeYield) {
    const y = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
    const m = String(y).match(/(\d+)/);
    if (m) portions = parseInt(m[1], 10);
  }

  // Prep time (ISO 8601)
  let prepTime = 0;
  const t = data.totalTime || data.prepTime || data.cookTime;
  if (t) {
    const h = String(t).match(/(\d+)H/i);
    const min = String(t).match(/(\d+)M/i);
    if (h) prepTime += parseInt(h[1], 10) * 60;
    if (min) prepTime += parseInt(min[1], 10);
  }

  // Image
  let image: string | null = null;
  if (data.image) {
    if (typeof data.image === "string") image = data.image;
    else if (Array.isArray(data.image)) image = typeof data.image[0] === "string" ? data.image[0] : data.image[0]?.url;
    else if (data.image.url) image = data.image.url;
  }

  // Steps
  let steps: string[] = [];
  if (data.recipeInstructions) {
    if (typeof data.recipeInstructions === "string") {
      steps = data.recipeInstructions.split(/\n+/).filter((s: string) => s.trim());
    } else if (Array.isArray(data.recipeInstructions)) {
      steps = data.recipeInstructions.map((inst: any) => {
        if (typeof inst === "string") return inst;
        if (inst.text) return inst.text;
        if (inst.itemListElement) return inst.itemListElement.map((i: any) => i.text || i).join(" ");
        return "";
      }).filter((s: string) => s.trim());
    }
  }

  // Ingredients
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  if (Array.isArray(data.recipeIngredient)) {
    for (const ing of data.recipeIngredient) {
      ingredients.push(parseIngredient(String(ing)));
    }
  }

  return { steps, ingredients, portions, prepTime, image };
}

function parseIngredient(str: string): { name: string; amount: number; unit: string } {
  str = str.trim()
    .replace(/½/g, "0.5").replace(/¼/g, "0.25").replace(/¾/g, "0.75")
    .replace(/⅓/g, "0.33").replace(/⅔/g, "0.67");

  const match = str.match(/^([\d.,/\s]+)?\s*([a-zA-ZäöüÄÖÜß]+\.?)?\s*(.+)$/);
  if (match) {
    let amount = 1;
    if (match[1]) {
      const a = match[1].trim();
      if (a.includes("/")) {
        const parts = a.split("/").map(n => parseFloat(n.replace(",", ".")));
        if (parts.length === 2 && parts[1] !== 0) amount = parts[0] / parts[1];
      } else {
        amount = parseFloat(a.replace(",", ".")) || 1;
      }
    }
    return { name: match[3]?.trim() || str, amount, unit: match[2] || "Stk" };
  }
  return { name: str, amount: 1, unit: "Stk" };
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: DB_URL });

  log(`Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  log(`Mode: ${DRY_RUN ? "DRY RUN (keine DB-Änderungen)" : "LIVE"}`);
  if (LIMIT) log(`Limit: ${LIMIT} Rezepte`);

  // Find recipes that need data
  const { rows: recipesNeedingData } = await pool.query(`
    SELECT r.id, r.name, r.category, r.steps, r.allergens, r.image, r.source_url,
      (SELECT COUNT(*) FROM ingredients i WHERE i.recipe_id = r.id) as ingredient_count
    FROM recipes r
    WHERE (
      r.steps IS NULL OR r.steps = '{}' OR array_length(r.steps, 1) IS NULL
      OR (SELECT COUNT(*) FROM ingredients i WHERE i.recipe_id = r.id) = 0
    )
    ORDER BY r.id
    ${LIMIT ? `LIMIT ${LIMIT}` : ""}
  `);

  log(`Rezepte ohne Zutaten oder Schritte: ${recipesNeedingData.length}`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;
  let storedUrlHits = 0;
  let ddgSearches = 0;

  for (const recipe of recipesNeedingData) {
    const needsIngredients = parseInt(recipe.ingredient_count) === 0;
    const needsSteps = !recipe.steps || recipe.steps.length === 0;

    log(`── ${recipe.name} (ID ${recipe.id}) — braucht: ${needsIngredients ? "Zutaten " : ""}${needsSteps ? "Schritte" : ""}`);

    // A) Prefer stored source_url over DDG search
    let found: { url: string; source: string } | null = null;

    if (recipe.source_url && typeof recipe.source_url === "string" && recipe.source_url.startsWith("http")) {
      found = {
        url: recipe.source_url,
        source: recipe.source_url.includes("chefkoch.de") ? "chefkoch.de" : "gutekueche.at",
      };
      log(`   → stored: ${found.url}`);
      storedUrlHits++;
    } else {
      found = await searchRecipeUrl(recipe.name, recipe.category);
      ddgSearches++;
      // Jittered delay after DDG search
      await sleep(jitter(SEARCH_DELAY_MS));
    }

    if (!found) {
      log(`   ✗ Nicht gefunden auf gutekueche.at / chefkoch.de`);
      notFound++;
      await sleep(jitter(LOOP_DELAY_MS));
      continue;
    }

    const { url, source } = found;
    if (!recipe.source_url || !recipe.source_url.startsWith("http")) {
      log(`   → ddg ${source}: ${url}`);
    }

    // B) Persist discovered URL so subsequent runs skip DDG
    if (!recipe.source_url || !recipe.source_url.startsWith("http")) {
      if (!DRY_RUN) {
        await pool.query(`UPDATE recipes SET source_url = $1 WHERE id = $2`, [url, recipe.id]);
        log(`   ↳ saved source_url`);
      }
    }

    // Scrape the recipe page
    const scraped = await scrapeRecipeUrl(url);
    if (!scraped || (scraped.ingredients.length === 0 && scraped.steps.length === 0)) {
      log(`   ✗ Keine Daten gescrapt`);
      errors++;
      await sleep(jitter(LOOP_DELAY_MS));
      continue;
    }

    log(`   ✓ ${scraped.ingredients.length} Zutaten, ${scraped.steps.length} Schritte`);

    if (DRY_RUN) {
      updated++;
      await sleep(jitter(LOOP_DELAY_MS));
      continue;
    }

    // Write to database
    try {
      // Update recipe steps, image, source URL
      if (needsSteps && scraped.steps.length > 0) {
        await pool.query(
          `UPDATE recipes SET steps = $1, source_url = $2 WHERE id = $3`,
          [scraped.steps, scraped.sourceUrl, recipe.id]
        );
      }

      // Update image if recipe has none
      if (!recipe.image && scraped.image) {
        await pool.query(
          `UPDATE recipes SET image = $1 WHERE id = $2`,
          [scraped.image, recipe.id]
        );
      }

      // Insert ingredients with allergen detection
      if (needsIngredients && scraped.ingredients.length > 0) {
        for (const ing of scraped.ingredients) {
          const ingAllergens = detectAllergens(ing.name);
          await pool.query(
            `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens) VALUES ($1, $2, $3, $4, $5)`,
            [recipe.id, ing.name, ing.amount, ing.unit, ingAllergens]
          );
        }

        // Aggregate allergens to recipe level
        const recipeAllergens = getAllergensFromIngredients(scraped.ingredients);
        await pool.query(
          `UPDATE recipes SET allergens = $1, allergen_status = 'auto' WHERE id = $2`,
          [recipeAllergens, recipe.id]
        );
        if (recipeAllergens.length > 0) {
          log(`   🔍 Allergene: ${recipeAllergens.join(', ')}`);
        }
      }

      updated++;
    } catch (err: any) {
      log(`   ✗ DB-Fehler: ${err.message}`);
      errors++;
    }

    await sleep(jitter(LOOP_DELAY_MS));
  }

  // Summary
  log("");
  log("══ Zusammenfassung ══");
  log(`Aktualisiert: ${updated}`);
  log(`Nicht gefunden: ${notFound}`);
  log(`Fehler: ${errors}`);
  log(`URL aus DB: ${storedUrlHits} | DDG-Suchen: ${ddgSearches}`);
  log("=== Fertig ===");

  await pool.end();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

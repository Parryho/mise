/**
 * Batch-Import: Rezeptdaten von mehreren Quellen nachschlagen.
 *
 * Sucht für jedes Rezept ohne Zutaten/Schritte auf gutekueche.at, chefkoch.de,
 * ichkoche.at, eatsmarter.de, lecker.de, kochbar.de, kuechengoetter.de,
 * parst JSON-LD (Schema.org Recipe), und schreibt Zutaten + Schritte in die DB.
 *
 * Features:
 * - Resumable: persists discovered source_url so search is not repeated
 * - Prefers stored source_url
 * - Site-internal search (no DuckDuckGo by default)
 * - URL validation via JSON-LD before persisting
 * - Jittered delays to avoid rate-limiting
 * - Idempotent (überspringt Rezepte mit vorhandenen Daten)
 * - Detailliertes Logging
 *
 * Usage:
 *   npx tsx script/batch-import-gutekueche.ts
 *   npx tsx script/batch-import-gutekueche.ts --dry-run
 *   npx tsx script/batch-import-gutekueche.ts --limit 10
 *   npx tsx script/batch-import-gutekueche.ts --sources gutekueche,chefkoch,ichkoche
 *   npx tsx script/batch-import-gutekueche.ts --enable-ddg
 *   DATABASE_URL=postgresql://... npx tsx script/batch-import-gutekueche.ts
 */

import { Pool } from "pg";
import * as cheerio from "cheerio";
import { detectAllergens, getAllergensFromIngredients } from "../server/modules/recipe/allergen-detection";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const ENABLE_DDG = process.argv.includes("--enable-ddg");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 0;
})();
const ALLOWED_SOURCES = (() => {
  const idx = process.argv.indexOf("--sources");
  if (idx >= 0 && process.argv[idx + 1]) {
    return new Set(process.argv[idx + 1].split(",").map(s => s.trim().toLowerCase()));
  }
  return null; // null = all sources
})();

const SEARCH_DELAY_MS = 4000;
const LOOP_DELAY_MS = 2000;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10000;

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

function sourceEnabled(name: string): boolean {
  return !ALLOWED_SOURCES || ALLOWED_SOURCES.has(name);
}

// ── Generic fetch + URL helpers ─────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function absoluteUrl(base: string, href: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/**
 * Validate that a URL is a real recipe page with JSON-LD Recipe data.
 */
async function validateRecipeUrl(url: string): Promise<boolean> {
  const html = await fetchHtml(url);
  if (!html) return false;
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const script of scripts) {
    try {
      const data = JSON.parse($(script).html() || "");
      if (findRecipeInJsonLd(data)) return true;
    } catch { continue; }
  }
  return false;
}

// ── Slug helpers ────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STOP_WORDS = new Set(["mit", "und", "auf", "in", "nach", "vom", "aus", "zum", "zur", "im", "am", "fuer", "von", "an", "ueber"]);
const COOKING_ADJ = new Set(["gebratener", "gebratene", "gebratenes", "gebackener", "gebackene", "gebackenes",
  "panierter", "panierte", "paniertes", "gratinierter", "gratinierte", "gratiniertes",
  "gemischter", "gemischte", "gemischtes", "frischer", "frische", "frisches",
  "einfacher", "einfache", "einfaches", "klassischer", "klassische", "klassisches",
  "warmer", "warme", "warmes", "kalter", "kalte", "kaltes"]);

function getSlugVariants(recipeName: string): string[] {
  const slug = slugify(recipeName);
  const variants: string[] = [slug];
  const words = slug.split("-").filter(w => !STOP_WORDS.has(w));
  const nouns = words.filter(w => !COOKING_ADJ.has(w));
  if (nouns.length > 0 && nouns.join("-") !== slug) variants.push(nouns.join("-"));
  for (let i = nouns.length - 1; i >= 0; i--) {
    if (nouns[i].length >= 4 && !variants.includes(nouns[i])) variants.push(nouns[i]);
  }
  const compoundSuffixes = ["filet", "suppe", "salat", "curry", "gulasch", "braten", "steak",
    "stueck", "scheiben", "pueree", "creme", "sauce", "sosse", "auflauf", "eintopf", "kuchen"];
  for (const word of nouns) {
    for (const suffix of compoundSuffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        const root = word.slice(0, -suffix.length);
        if (root.length >= 4 && !variants.includes(root)) variants.push(root);
        if (suffix.length >= 4 && !variants.includes(suffix)) variants.push(suffix);
      }
    }
  }
  return variants.slice(0, 6);
}

// ── Generic site-internal search ────────────────────────────

interface SiteConfig {
  name: string;
  domain: string;
  searchUrls: (query: string) => string[];
  linkSelector: string;
  linkFilter?: (href: string) => boolean;
}

const SITE_CONFIGS: SiteConfig[] = [
  {
    name: "chefkoch",
    domain: "chefkoch.de",
    searchUrls: (q) => [
      `https://www.chefkoch.de/rs/s0/${encodeURIComponent(q)}/Rezepte.html`,
    ],
    linkSelector: "a[href*='/rezepte/']",
    linkFilter: (href) => /\/rezepte\/\d+/.test(href),
  },
  {
    name: "ichkoche",
    domain: "ichkoche.at",
    searchUrls: (q) => [
      `https://www.ichkoche.at/suche?search=${encodeURIComponent(q)}`,
      `https://www.ichkoche.at/suche/${encodeURIComponent(q)}`,
    ],
    linkSelector: "a[href*='/rezepte/']",
    linkFilter: (href) => href.includes("/rezepte/") && !href.endsWith("/rezepte/"),
  },
  {
    name: "eatsmarter",
    domain: "eatsmarter.de",
    searchUrls: (q) => [
      `https://www.eatsmarter.de/rezepte/suche/${encodeURIComponent(q)}`,
      `https://www.eatsmarter.de/suche?q=${encodeURIComponent(q)}`,
    ],
    linkSelector: "a[href*='/rezepte/']",
    linkFilter: (href) => /\/rezepte\/[a-z]/.test(href) && !href.endsWith("/rezepte/"),
  },
  {
    name: "lecker",
    domain: "lecker.de",
    searchUrls: (q) => [
      `https://www.lecker.de/suche?search_api_fulltext=${encodeURIComponent(q)}`,
    ],
    linkSelector: "a[href*='-']",
    linkFilter: (href) => /lecker\.de\/[a-z].*-\d+\.html/.test(href),
  },
  {
    name: "kochbar",
    domain: "kochbar.de",
    searchUrls: (q) => [
      `https://www.kochbar.de/rezepte/${encodeURIComponent(q)}.html`,
      `https://www.kochbar.de/suche/${encodeURIComponent(q)}`,
    ],
    linkSelector: "a[href*='/rezept/']",
    linkFilter: (href) => /\/rezept\/\d+/.test(href),
  },
  {
    name: "kuechengoetter",
    domain: "kuechengoetter.de",
    searchUrls: (q) => [
      `https://www.kuechengoetter.de/suche?search=${encodeURIComponent(q)}`,
      `https://www.kuechengoetter.de/suche?q=${encodeURIComponent(q)}`,
    ],
    linkSelector: "a[href*='/rezepte/']",
    linkFilter: (href) => href.includes("/rezepte/") && !href.endsWith("/rezepte/"),
  },
];

/**
 * Generic internal search: fetch search page, parse links, validate top candidates.
 */
async function searchSiteInternal(config: SiteConfig, recipeName: string): Promise<string | null> {
  for (const searchUrl of config.searchUrls(recipeName)) {
    const html = await fetchHtml(searchUrl);
    if (!html) continue;

    const $ = cheerio.load(html);
    const candidates: string[] = [];

    $(config.linkSelector).each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const abs = absoluteUrl(searchUrl, href);
      if (!abs) return;
      if (config.linkFilter && !config.linkFilter(abs)) return;
      if (!candidates.includes(abs)) candidates.push(abs);
    });

    log(`   [search] ${config.domain} candidates: ${candidates.length} (via ${searchUrl.split("?")[0]})`);

    // Validate top 5 candidates
    for (const url of candidates.slice(0, 5)) {
      const valid = await validateRecipeUrl(url);
      if (valid) {
        log(`   [search] ${config.domain} validated: ${url}`);
        return url;
      }
      await sleep(jitter(500));
    }

    if (candidates.length > 0) {
      log(`   [search] ${config.domain} none validated`);
    }

    // Only try first working search URL per site
    break;
  }

  return null;
}

// ── gutekueche.at listing page search ───────────────────────

async function searchGutekuecheListing(recipeName: string): Promise<string | null> {
  const variants = getSlugVariants(recipeName);
  const nameSlug = slugify(recipeName);

  for (const variant of variants) {
    const listingUrl = `https://www.gutekueche.at/${variant}-rezepte`;
    const html = await fetchHtml(listingUrl);
    if (!html) continue;

    const $ = cheerio.load(html);
    let bestUrl: string | null = null;
    let bestScore = 0;
    const nameWords = nameSlug.split("-");

    $("a[href*='-rezept-']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const hrefSlug = href.replace(/^\//, "").replace(/-rezept-\d+$/, "");
      const hrefWords = hrefSlug.split("-");
      const matchCount = nameWords.filter(w => hrefWords.some(hw => hw.includes(w) || w.includes(hw))).length;
      const score = matchCount / nameWords.length;
      if (score > bestScore) {
        bestScore = score;
        bestUrl = href.startsWith("http") ? href : `https://www.gutekueche.at${href}`;
      }
    });

    if (bestUrl && (bestScore >= 0.4 || variant === nameSlug)) {
      return bestUrl;
    }
  }

  return null;
}

// ── DuckDuckGo search (disabled by default) ─────────────────

async function searchViaDDG(recipeName: string, site: string): Promise<string | null> {
  if (!ENABLE_DDG) return null;

  const query = encodeURIComponent(`"${recipeName}" rezept site:${site}`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
  const html = await fetchHtml(searchUrl);
  if (!html) return null;

  const $ = cheerio.load(html);
  let foundUrl: string | null = null;

  $("a.result__a, a.result__url, a[href]").each((_, el) => {
    if (foundUrl) return;
    const href = $(el).attr("href") || "";
    if (href.includes("uddg=")) {
      const match = href.match(/uddg=([^&]+)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.includes(site) && decoded.startsWith("http")) foundUrl = decoded;
      }
    } else if (href.includes(site)) {
      foundUrl = href.startsWith("http") ? href : `https:${href}`;
    }
  });

  return foundUrl;
}

// ── Main search orchestrator ────────────────────────────────

async function searchRecipeUrl(recipeName: string, category?: string): Promise<{ url: string; source: string } | null> {
  // 1) gutekueche.at listing page (fast, no rate-limiting risk)
  if (sourceEnabled("gutekueche")) {
    const result = await searchGutekuecheListing(recipeName);
    if (result) {
      // Validate before returning
      const valid = await validateRecipeUrl(result);
      if (valid) return { url: result, source: "gutekueche.at" };
      log(`   [search] gutekueche.at listing found but validation failed: ${result}`);
    }
  }

  // 2) Site-internal search for each configured site
  for (const config of SITE_CONFIGS) {
    if (!sourceEnabled(config.name)) continue;
    const result = await searchSiteInternal(config, recipeName);
    if (result) return { url: result, source: config.domain };
    await sleep(jitter(1500));
  }

  // 3) DDG fallback (only if --enable-ddg)
  if (ENABLE_DDG) {
    for (const site of ["gutekueche.at", "chefkoch.de"]) {
      const result = await searchViaDDG(recipeName, site);
      if (result) {
        const valid = await validateRecipeUrl(result);
        if (valid) return { url: result, source: site };
      }
      await sleep(jitter(1000));
    }
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
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const script of scripts) {
    try {
      const data = JSON.parse($(script).html() || "");
      const recipe = findRecipeInJsonLd(data);
      if (recipe) return { ...recipe, sourceUrl: url };
    } catch { continue; }
  }
  return null;
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
  let portions = 4;
  if (data.recipeYield) {
    const y = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
    const m = String(y).match(/(\d+)/);
    if (m) portions = parseInt(m[1], 10);
  }

  let prepTime = 0;
  const t = data.totalTime || data.prepTime || data.cookTime;
  if (t) {
    const h = String(t).match(/(\d+)H/i);
    const min = String(t).match(/(\d+)M/i);
    if (h) prepTime += parseInt(h[1], 10) * 60;
    if (min) prepTime += parseInt(min[1], 10);
  }

  let image: string | null = null;
  if (data.image) {
    if (typeof data.image === "string") image = data.image;
    else if (Array.isArray(data.image)) image = typeof data.image[0] === "string" ? data.image[0] : data.image[0]?.url;
    else if (data.image.url) image = data.image.url;
  }

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
  log(`Sources: ${ALLOWED_SOURCES ? [...ALLOWED_SOURCES].join(", ") : "alle"}`);
  log(`DDG: ${ENABLE_DDG ? "enabled" : "disabled (use --enable-ddg to enable)"}`);
  if (LIMIT) log(`Limit: ${LIMIT} Rezepte`);

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
  let webSearches = 0;
  const sourceCounts: Record<string, number> = {};

  for (const recipe of recipesNeedingData) {
    const needsIngredients = parseInt(recipe.ingredient_count) === 0;
    const needsSteps = !recipe.steps || recipe.steps.length === 0;

    log(`── ${recipe.name} (ID ${recipe.id}) — braucht: ${needsIngredients ? "Zutaten " : ""}${needsSteps ? "Schritte" : ""}`);

    // A) Prefer stored source_url (validate it still works)
    let found: { url: string; source: string } | null = null;

    if (recipe.source_url && typeof recipe.source_url === "string" && recipe.source_url.startsWith("http")) {
      found = {
        url: recipe.source_url,
        source: new URL(recipe.source_url).hostname.replace("www.", ""),
      };
      log(`   → stored: ${found.url}`);
      storedUrlHits++;
    } else {
      found = await searchRecipeUrl(recipe.name, recipe.category);
      webSearches++;
      await sleep(jitter(SEARCH_DELAY_MS));
    }

    if (!found) {
      log(`   ✗ Nicht gefunden`);
      notFound++;
      await sleep(jitter(LOOP_DELAY_MS));
      continue;
    }

    const { url, source } = found;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;

    if (!recipe.source_url || !recipe.source_url.startsWith("http")) {
      log(`   → found ${source}: ${url}`);
    }

    // B) Persist discovered URL ONLY after validation passed (already validated in search)
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

    // Step/ingredient consistency check: warn if steps mention ingredients not in the list
    if (scraped.steps.length > 0 && scraped.ingredients.length > 0) {
      const STEP_INGREDIENT_KEYWORDS = [
        "mehl", "butter", "milch", "sahne", "rahm", "ei", "eier", "öl", "zucker",
        "salz", "pfeffer", "knoblauch", "zwiebel", "senf", "essig", "wein",
        "käse", "parmesan", "obers", "topfen", "joghurt", "honig", "zitrone",
      ];
      const ingNamesLower = scraped.ingredients.map((i: any) => i.name.toLowerCase());
      const stepsText = scraped.steps.join(" ").toLowerCase();
      const missing = STEP_INGREDIENT_KEYWORDS.filter(kw =>
        stepsText.includes(kw) && !ingNamesLower.some((n: string) => n.includes(kw))
      );
      if (missing.length > 0) {
        log(`   ⚠ In Schritten erwähnt aber nicht in Zutaten: ${missing.join(", ")}`);
      }
    }

    if (DRY_RUN) {
      updated++;
      await sleep(jitter(LOOP_DELAY_MS));
      continue;
    }

    // Write to database
    try {
      if (needsSteps && scraped.steps.length > 0) {
        await pool.query(
          `UPDATE recipes SET steps = $1, source_url = $2 WHERE id = $3`,
          [scraped.steps, scraped.sourceUrl, recipe.id]
        );
      }

      if (!recipe.image && scraped.image) {
        await pool.query(
          `UPDATE recipes SET image = $1 WHERE id = $2`,
          [scraped.image, recipe.id]
        );
      }

      if (needsIngredients && scraped.ingredients.length > 0) {
        for (const ing of scraped.ingredients) {
          const ingAllergens = detectAllergens(ing.name);
          await pool.query(
            `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens) VALUES ($1, $2, $3, $4, $5)`,
            [recipe.id, ing.name, ing.amount, ing.unit, ingAllergens]
          );
        }

        const recipeAllergens = getAllergensFromIngredients(scraped.ingredients);
        await pool.query(
          `UPDATE recipes SET allergens = $1, allergen_status = 'auto' WHERE id = $2`,
          [recipeAllergens, recipe.id]
        );
        if (recipeAllergens.length > 0) {
          log(`   Allergene: ${recipeAllergens.join(", ")}`);
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
  log(`URL aus DB: ${storedUrlHits} | Web-Suchen: ${webSearches}`);
  if (Object.keys(sourceCounts).length > 0) {
    log(`Quellen: ${Object.entries(sourceCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }
  log("=== Fertig ===");

  await pool.end();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

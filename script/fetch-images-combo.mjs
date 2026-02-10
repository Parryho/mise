/**
 * Fetch images for recipes with image = NULL.
 * Strategy: 1) Chefkoch.de scraping  2) Pexels API fallback
 *
 * Usage:
 *   node script/fetch-images-combo.mjs --dry-run
 *   node script/fetch-images-combo.mjs
 *   DATABASE_URL=... node script/fetch-images-combo.mjs
 */

import pg from "pg";
const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const DEBUG = process.argv.includes("--debug");
const PEXELS_KEY = "hdFZokAFOLDxv26EIEbenblkthNmFHjcqzEf3LcL2RagZwQCPGzxauPK";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Pexels translations (Austrian → English search terms) ──

const translations = [
  [/^wiener schnitzel$/i, "wiener schnitzel breaded cutlet"],
  [/schnitzel|paniert/i, "breaded schnitzel cutlet"],
  [/cordon\s*bleu/i, "cordon bleu stuffed cutlet"],
  [/gulasch/i, "goulash beef stew"],
  [/schweinsbraten|kümmelbraten/i, "roast pork crackling"],
  [/tafelspitz/i, "boiled beef tafelspitz"],
  [/zwiebelrostbraten/i, "steak with fried onions"],
  [/rindsbraten|sauerbraten/i, "beef roast"],
  [/geschnetzeltes/i, "sliced meat cream sauce"],
  [/backhendl/i, "fried chicken golden"],
  [/kaiserschmarrn/i, "kaiserschmarrn shredded pancake"],
  [/palatschinken/i, "crepes filled"],
  [/eierspätzle|spätzle/i, "spaetzle egg noodles"],
  [/käsespätzle/i, "cheese spaetzle baked"],
  [/kürbis.*suppe|kürbiscreme/i, "pumpkin cream soup"],
  [/cremesuppe|creme.*suppe/i, "cream soup bowl"],
  [/tomaten.*suppe|tomate.*suppe/i, "tomato cream soup"],
  [/linsen/i, "lentil soup"],
  [/erbsen.*suppe/i, "pea soup green"],
  [/erdäpfel.*suppe|kartoffel.*suppe/i, "potato soup cream"],
  [/zwiebel.*suppe/i, "french onion soup"],
  [/grießnockerlsuppe/i, "semolina dumpling soup"],
  [/frittatensuppe/i, "beef broth pancake strips soup"],
  [/leberknödel.*suppe/i, "liver dumpling soup"],
  [/knoblauch.*suppe/i, "garlic cream soup"],
  [/schwammerl.*suppe/i, "mushroom cream soup"],
  [/sellerie.*suppe/i, "celery cream soup"],
  [/karfiol.*suppe/i, "cauliflower cream soup"],
  [/spargel.*suppe/i, "asparagus cream soup"],
  [/nudel.*suppe/i, "noodle soup broth"],
  [/käse.*suppe/i, "cheese cream soup"],
  [/lachs/i, "salmon fillet"],
  [/forelle/i, "trout fish baked"],
  [/zander/i, "pike perch fish fillet"],
  [/strudel.*apfel|apfelstrudel/i, "apple strudel pastry"],
  [/milchrahmstrudel/i, "milk cream strudel"],
  [/topfenstrudel/i, "cottage cheese strudel"],
  [/gemüsestrudel/i, "vegetable strudel savory"],
  [/krautstrudel/i, "cabbage strudel savory"],
  [/ratatouille/i, "ratatouille vegetables"],
  [/lasagne/i, "lasagna baked"],
  [/risotto/i, "risotto creamy"],
  [/curry/i, "curry dish rice"],
  [/auflauf|gratin/i, "casserole gratin baked"],
  [/sauerkraut/i, "sauerkraut fermented cabbage"],
  [/rotkraut|rotkohl/i, "braised red cabbage"],
  [/rahmspinat/i, "creamed spinach"],
  [/brokkoli/i, "broccoli steamed"],
  [/salat.*gemischt|gemischter salat/i, "mixed green salad"],
  [/bohnensalat/i, "green bean salad"],
  [/gurkensalat/i, "cucumber salad dill"],
  [/krautsalat/i, "coleslaw salad"],
  [/karottensalat/i, "carrot salad grated"],
  [/tomatensalat/i, "tomato salad fresh"],
  [/wurstsalat/i, "cold cut meat salad"],
  [/fisolensalat/i, "green bean salad warm"],
  [/fleischlaberl|frikadelle/i, "meatball patty fried"],
  [/leberkäse/i, "meatloaf bavarian leberkäse"],
  [/faschierter braten/i, "meatloaf sliced"],
  [/geselchtes/i, "smoked pork sauerkraut"],
  [/grammelknödel/i, "bacon dumpling"],
  [/stelze/i, "pork knuckle roasted crispy"],
  [/beuschel/i, "veal offal ragout"],
  [/schinkenfleckerl/i, "ham pasta baked"],
  [/germknödel/i, "yeast dumpling plum filling"],
  [/marillenknödel/i, "apricot dumpling"],
  [/topfenknödel/i, "cottage cheese dumpling sweet"],
  [/zwetschgenknödel/i, "plum dumpling"],
  [/powidltascherl/i, "plum jam dumpling"],
  [/buchteln/i, "sweet yeast buns jam"],
  [/grießschmarrn/i, "semolina scramble dessert"],
  [/mohnnudeln/i, "poppy seed noodles sweet"],
  [/marmorkuchen/i, "marble cake chocolate"],
  [/sachertorte/i, "sachertorte chocolate cake"],
  [/semmelknödel/i, "bread dumpling"],
  [/serviettenknödel/i, "napkin dumpling sliced"],
  [/spinatknödel/i, "spinach dumpling green"],
  [/butternockerl/i, "butter dumpling small"],
  [/kroketten/i, "potato croquettes fried"],
  [/pommes|frites/i, "french fries golden"],
  [/erdäpfelpüree|kartoffelpüree|püree/i, "mashed potatoes creamy"],
  [/petersilkartoffeln/i, "parsley potatoes boiled"],
  [/reis$/i, "steamed white rice"],
  [/polenta/i, "polenta creamy"],
  [/liptauer/i, "liptauer cheese spread paprika"],
  [/speckkraut/i, "bacon cabbage sauerkraut"],
  [/eiernockerl/i, "egg noodle dumpling"],
  [/eierschwammerl/i, "chanterelle mushroom dish"],
  [/erdäpfelgulasch/i, "potato goulash stew"],
  [/gemüselaibchen/i, "vegetable patty fried"],
  [/kalbsrahm/i, "veal cream sauce"],
  // generic fallbacks
  [/suppe/i, "soup bowl warm"],
  [/braten/i, "roast meat platter"],
  [/huhn|hendl|hähnchen/i, "chicken dish"],
  [/lamm/i, "lamb dish"],
  [/fisch/i, "fish dish plated"],
  [/nudel|pasta|penne|spaghetti/i, "pasta dish"],
  [/kartoffel|erdäpfel/i, "potato dish"],
  [/gemüse/i, "vegetable dish plated"],
  [/dessert|nachtisch/i, "dessert sweet"],
  [/kuchen|torte/i, "cake slice"],
  [/sauce|soße/i, "sauce"],
  [/knödel/i, "dumpling dish"],
  [/salat/i, "salad fresh bowl"],
];

function buildPexelsQuery(name) {
  const clean = name.replace(/\s*\(.*?\)\s*/g, "").trim();
  for (const [pat, trans] of translations) {
    if (pat.test(clean)) return trans + " food";
  }
  return clean + " food";
}

// ── Chefkoch.de scraping ──

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) {
      if (DEBUG) console.log(`  [debug] ${url} → ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    if (DEBUG) console.log(`  [debug] ${url} → ${e.message}`);
    return null;
  }
}

function extractImageFromHtml(html) {
  // 1. JSON-LD Recipe image
  const ldMatches = html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1]);
      const img = findImageInJsonLd(data);
      if (img && img.startsWith("http")) return img;
    } catch { /* ignore */ }
  }

  // 2. og:image
  const ogMatch = html.match(/<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:image["']/i);
  if (ogMatch && ogMatch[1].startsWith("http")) return ogMatch[1];

  return null;
}

function findImageInJsonLd(data) {
  if (Array.isArray(data)) {
    for (const item of data) { const r = findImageInJsonLd(item); if (r) return r; }
    return null;
  }
  if (data && (data["@type"] === "Recipe" || (Array.isArray(data["@type"]) && data["@type"].includes("Recipe")))) {
    if (!data.image) return null;
    if (typeof data.image === "string") return data.image;
    if (Array.isArray(data.image)) {
      const first = data.image[0];
      return typeof first === "string" ? first : first?.url || null;
    }
    return data.image.url || null;
  }
  if (data && data["@graph"]) return findImageInJsonLd(data["@graph"]);
  return null;
}

async function searchChefkoch(name) {
  // Simplify name for search (remove parenthetical, "mit X" parts for cleaner results)
  const searchName = name.replace(/\s*\(.*?\)\s*/g, "").trim();
  const searchUrl = `https://www.chefkoch.de/rs/s0/${encodeURIComponent(searchName)}/Rezepte.html`;
  if (DEBUG) console.log(`  [debug] chefkoch search: ${searchUrl}`);

  const html = await fetchHtml(searchUrl);
  if (!html) return null;

  // Find recipe links: /rezepte/DIGITS/name.html
  const linkPattern = /href\s*=\s*["']((?:https?:\/\/www\.chefkoch\.de)?\/rezepte\/\d+\/[^"'#]+)["']/gi;
  const seen = new Set();

  for (const match of html.matchAll(linkPattern)) {
    let href = match[1].split("#")[0].split("?")[0];
    if (!href.startsWith("http")) href = "https://www.chefkoch.de" + href;
    if (seen.has(href)) continue;
    seen.add(href);

    if (DEBUG) console.log(`  [debug] chefkoch recipe: ${href}`);
    await sleep(300);

    const pageHtml = await fetchHtml(href);
    if (!pageHtml) continue;

    const img = extractImageFromHtml(pageHtml);
    if (img) return img;
  }

  return null;
}

// ── Pexels API ──

async function searchPexels(name) {
  const query = buildPexelsQuery(name);
  if (DEBUG) console.log(`  [debug] pexels query: "${query}"`);

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status !== 200) {
      if (DEBUG) console.log(`  [debug] pexels → ${res.status}`);
      return null;
    }
    const data = await res.json();
    const photos = data.photos || [];
    if (photos.length === 0) return null;
    return photos[0].src.large;
  } catch (e) {
    if (DEBUG) console.log(`  [debug] pexels error: ${e.message}`);
    return null;
  }
}

// ── Validate image URL ──

async function isImageValid(url) {
  if (!url || !url.startsWith("http")) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return true;
    if (res.status === 405 || res.status === 403) {
      const g = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": UA, "Range": "bytes=0-0" },
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      return g.ok || g.status === 206;
    }
    return false;
  } catch { return false; }
}

// ── Main ──

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  console.log(`[fetch-img] Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  console.log(`[fetch-img] Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  const { rows: recipes } = await pool.query(
    `SELECT id, name, category FROM recipes WHERE image IS NULL ORDER BY name`
  );
  console.log(`[fetch-img] Rezepte ohne Bild: ${recipes.length}\n`);

  let chefkochOk = 0, pexelsOk = 0, fail = 0;
  const results = [];
  const failed = [];
  const newDomains = new Set();

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const num = `[${i + 1}/${recipes.length}]`;
    process.stdout.write(`${num} ${recipe.name} ... `);

    let imageUrl = null;
    let source = "";

    // 1. Pexels API (reliable, good translations for Austrian dishes)
    imageUrl = await searchPexels(recipe.name);
    if (imageUrl) {
      source = "pexels.com";
      pexelsOk++;
    } else {
      imageUrl = null;
      fail++;
      failed.push(recipe.name);
    }

    if (imageUrl) {
      results.push({ id: recipe.id, name: recipe.name, source, url: imageUrl.substring(0, 80) });
      try { newDomains.add(new URL(imageUrl).hostname); } catch {}
      console.log(`✅ ${source}`);

      if (!DRY_RUN) {
        await pool.query(`UPDATE recipes SET image = $1 WHERE id = $2`, [imageUrl, recipe.id]);
      }
    } else {
      console.log(`❌`);
    }

    await sleep(600);
  }

  console.log("\n══ Zusammenfassung ══");
  console.log(`Gesucht: ${recipes.length}`);
  console.log(`Chefkoch.de: ${chefkochOk}`);
  console.log(`Pexels.com: ${pexelsOk}`);
  console.log(`Nicht gefunden: ${fail}`);

  if (newDomains.size > 0) {
    console.log(`\nBild-Domains (für CSP):`);
    for (const d of newDomains) console.log(`  - ${d}`);
  }
  if (failed.length > 0) {
    console.log(`\nNicht gefunden:`);
    for (const f of failed) console.log(`  - ${f}`);
  }

  console.log("\n=== Fertig ===");
  await pool.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });

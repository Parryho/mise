/**
 * FINAL image fix: Replace ALL remaining Pexels images with gutekueche.at images.
 * URLs verified via WebSearch (fresh, not redirecting).
 *
 * node script/fix-images-final.mjs
 * node script/fix-images-final.mjs --dry-run
 */
import { execSync } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const SSH = `ssh -i ~/.ssh/id_ed25519 root@46.225.63.168`;
const DC = `docker compose -f /opt/mise/docker-compose.prod.yml exec -T db psql -U postgres -d mise`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[final] ${msg}`); }

function runSQL(sql) {
  const escaped = sql.replace(/'/g, "'\\''");
  try {
    return execSync(`${SSH} "${DC} -t -A -c '${escaped}'"`, {
      encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch (err) { return (err.stdout || "").trim(); }
}

async function fetchHtml(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "de-DE,de;q=0.9" },
      signal: ctrl.signal, redirect: "follow"
    });
    clearTimeout(t);
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

function extractImage(html) {
  // JSON-LD first
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html)) !== null) {
    try {
      const d = JSON.parse(m[1]);
      const img = findImg(d);
      if (img && (img.includes("gutekueche.at") || img.includes("chefkoch"))) return img;
    } catch {}
  }
  // Fallback: og:image
  const ogM = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogM) return ogM[1];
  // Fallback: direct gutekueche pattern
  const urlRe = /https?:\/\/www\.gutekueche\.at\/storage\/media\/recipe\/\d+\/conv\/[a-z0-9-]+-default\.jpg/gi;
  const matches = html.match(urlRe);
  if (matches) return matches[0];
  return null;
}

function findImg(d) {
  if (Array.isArray(d)) { for (const i of d) { const r = findImg(i); if (r) return r; } return null; }
  if (d?.["@type"] === "Recipe" || (Array.isArray(d?.["@type"]) && d["@type"].includes("Recipe"))) {
    if (d.image) {
      if (typeof d.image === "string") return d.image;
      if (Array.isArray(d.image)) return typeof d.image[0] === "string" ? d.image[0] : d.image[0]?.url;
      if (d.image.url) return d.image.url;
    }
  }
  if (d?.["@graph"]) return findImg(d["@graph"]);
  return null;
}

// VERIFIED URLs from WebSearch (2026-02-11, fresh)
const URL_MAP = {
  48: "https://www.gutekueche.at/gemuesestrudel-rezept-1271",
  51: "https://www.gutekueche.at/erdaepfelgulasch-rezept-3772",
  52: "https://www.gutekueche.at/eiernockerl-rezept-1327",
  53: "https://www.gutekueche.at/topfenknoedel-rezept-8082",
  54: "https://www.gutekueche.at/marillenknoedel-mit-topfenteig-rezept-784",
  55: "https://www.gutekueche.at/zwetschkenknodel-rezept-26277",
  56: "https://www.gutekueche.at/mohnnudeln-rezept-179",
  57: "https://www.gutekueche.at/krautstrudel-rezept-4436",
  59: "https://www.gutekueche.at/tiroler-kaesesuppe-rezept-7522",
  60: "https://www.gutekueche.at/reiberdatschi-rezept-20421",
  65: "https://www.gutekueche.at/schinkenfleckerl-rezept-4907",
  66: "https://www.gutekueche.at/perfekte-pommes-frites-rezept-109",
  67: "https://www.gutekueche.at/kartoffelpueree-rezept-1365",
  71: "https://www.gutekueche.at/kartoffel-butternockerl-rezept-16366",
  72: "https://www.gutekueche.at/kartoffelkroketten-rezept-1100",
  74: "https://www.gutekueche.at/serviettenknodel-rezept-44869",
  79: "https://www.gutekueche.at/bohnensalat-rezept-27298",
  80: "https://www.gutekueche.at/gurkensalat-rezept-3409",
  82: "https://www.gutekueche.at/krautsalat-rezept-3412",
  83: "https://www.gutekueche.at/karottensalat-rezept-3410",
  86: "https://www.gutekueche.at/gemischter-salat-rezept-3407",
  92: "https://www.gutekueche.at/wiener-apfelstrudel-rezept-852",
  93: "https://www.gutekueche.at/wiener-sachertorte-rezept-4289",
  95: "https://www.gutekueche.at/topfenstrudel-mit-blaetterteig-rezept-24112",
  96: "https://www.gutekueche.at/germknoedel-rezept-rezept-5015",
  97: "https://www.gutekueche.at/buchteln-rezept-913",
  99: "https://www.gutekueche.at/esterhazytorte-rezept-6756",
  101: "https://www.gutekueche.at/powidltascherl-rezept-4914",
  102: "https://www.gutekueche.at/grissschmarrn-rezept-5617",
  104: "https://www.gutekueche.at/milchrahmstrudel-rezept-27236",
  105: "https://www.gutekueche.at/nussschnitten-rezept-16117",
  112: "https://www.gutekueche.at/indianerkrapfen-rezept-30473",
  120: "https://www.gutekueche.at/tomatensalat-rezept-3411",
  121: "https://www.gutekueche.at/wurstsalat-rezept-5459",
  124: "https://www.gutekueche.at/fisolensalat-rezept-1449",
  134: "https://www.gutekueche.at/liptauer-rezept-7026",
  133: "https://www.gutekueche.at/kaeseaufstrich-rezept-7967",
  141: "https://www.gutekueche.at/langos-grundrezept-rezept-4916",
  171: "https://www.gutekueche.at/champignoncremesuppe-rezept-3671",
  175: "https://www.gutekueche.at/kartoffelcremesuppe-rezept-35056",
  184: "https://www.gutekueche.at/brotsuppe-rezept-8260",
  192: "https://www.gutekueche.at/gulaschsuppe-rezept-33749",
  194: "https://www.gutekueche.at/kichererbsensuppe-mit-frischem-gemuese-rezept-9753",
  217: "https://www.gutekueche.at/surschnitzel-rezept-3870",
  220: "https://www.gutekueche.at/sauerbraten-rezept-5677",
  232: "https://www.gutekueche.at/saftgulasch-rezept-5789",
  233: "https://www.gutekueche.at/fiakergulasch-rezept-5098",
  239: "https://www.gutekueche.at/kalbsgulasch-rezept-4312",
  295: "https://www.gutekueche.at/linsenlaibchen-rezept-18623",
  297: "https://www.gutekueche.at/rote-rueben-laibchen-rezept-17912",
  298: "https://www.gutekueche.at/hirselaibchen-rezept-1392",
  301: "https://www.gutekueche.at/krbislaibchen-rezept-44169",
  319: "https://www.gutekueche.at/salzkartoffeln-rezept-17631",
  321: "https://www.gutekueche.at/roesterdaepfel-rezept-17701",
  324: "https://www.gutekueche.at/kartoffelgratin-rezept-11877",
  325: "https://www.gutekueche.at/erdapfelsalat-rezept-29050",
  329: "https://www.gutekueche.at/herzoginkartoffeln-rezept-24493",
  342: "https://www.gutekueche.at/kartoffelnockerl-rezept-5582",
  108: "https://www.gutekueche.at/marmorkuchen-rezept-3836",
};

// For recipes without a verified URL, try these slug patterns on gutekueche.at
function slugify(name) {
  return name.toLowerCase()
    .replace(/\s*\(.*?\)/g, "").replace(/\s*\/\s*.+$/, "").trim()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Additional search terms for tricky recipes
const SEARCH_SLUGS = {
  69: ["petersilkartoffeln"],
  78: ["speckkraut"],
  116: ["kaeferbohnensalat", "steirischer-kaeferbohnensalat"],
  117: ["feldsalat", "nuesslisalat", "vogerlsalat"],
  128: ["eierspeis", "ruehrei"],
  129: ["speckbrot"],
  137: ["kaesekrainer"],
  138: ["frankfurter-wuerstel", "frankfurter"],
  139: ["leberkaese", "leberkaesesemmel"],
  147: ["wiener-einspaenner", "einspaenner"],
  164: ["buendnerfleisch"],
  179: ["rote-rueben-suppe", "rote-rueben-cremesuppe"],
  185: ["steirische-wurzelsuppe", "wurzelsuppe"],
  186: ["saure-suppe", "steirische-saure-suppe"],
  196: ["erdaepfelgulasch", "kartoffelgulasch"],
  200: ["kalte-gurkensuppe", "gurkensuppe"],
  211: ["bohnensuppe", "fisolensuppe"],
  218: ["huehnerschnitzel", "haehnchenschnitzel"],
  221: ["kalbsbraten"],
  223: ["selchfleisch", "geselchtes"],
  228: ["putenbraten"],
  240: ["gegrillte-huehnerkeulen", "huehnerkeulen"],
  242: ["grillhuhn", "grillhendl"],
  243: ["putenmedaillons"],
  253: ["fischstaebchen"],
  258: ["fischstaebchen", "backfisch"],
  267: ["penne-all-arrabbiata", "arrabiata"],
  272: ["rigatoni-mit-gemuese"],
  282: ["lauchquiche", "quiche"],
  286: ["schwammerlsauce", "schwammerl"],
  287: ["gemueseauflauf"],
  296: ["falafel"],
  302: ["kartoffelpuffer"],
  314: ["gefuellte-champignons"],
  322: ["kartoffelspalten", "wedges"],
  327: ["kartoffelpueree", "erdaepfelpueree"],
  333: ["kartoffelpuffer", "reibekuchen"],
  343: ["fusilli", "spiralnudeln"],
  346: ["basmatireis", "reis-kochen"],
  352: ["ebly", "weizenkoerner"],
  356: ["dampfnudeln"],
  357: ["polenta", "maisgriesschnitten"],
  361: ["griesschnitten", "griess"],
  373: ["wurzelgemuese", "ofengemuese"],
  375: ["pastinaken"],
  377: ["rote-rueben-gemuese", "rote-rueben"],
  379: ["petersilienwurzel"],
  380: ["steckrueben"],
  381: ["ofengemuese", "bratgemuese"],
  384: ["brokkoli"],
  386: ["fisolen", "gruene-bohnen"],
  387: ["fisolen-mit-speck", "speckfisolen"],
  389: ["erbsenreis", "erbsen"],
  401: ["champignons", "gebratene-champignons"],
  404: ["steinpilze"],
  405: ["pilzpfanne", "schwammerl"],
  406: ["gemischter-salat", "blattsalat"],
  407: ["preiselbeeren", "preiselbeermarmelade"],
  412: ["butterbroeseln", "butterbrösel"],
  413: ["puderzucker"],
  418: ["zimtschnecken", "zimt"],
  419: ["mohnnudeln"],
  420: ["nussstrudel", "nussbroeseln"],
  422: ["schokoladensauce"],
  423: ["himbeersosse", "fruchtsosse"],
  425: ["schlagobers"],
};

async function findImage(recipeId, recipeName) {
  // 1. Try verified URL
  if (URL_MAP[recipeId]) {
    const html = await fetchHtml(URL_MAP[recipeId]);
    if (html) {
      const img = extractImage(html);
      if (img) return { img, source: "verified" };
    }
  }

  // 2. Try search slugs
  const slugs = SEARCH_SLUGS[recipeId] || [slugify(recipeName)];
  for (const slug of slugs) {
    // Try listing page
    const listUrl = `https://www.gutekueche.at/${slug}-rezepte`;
    const html = await fetchHtml(listUrl);
    if (html) {
      // Extract first recipe link
      const linkMatch = html.match(/href=["']\/?([a-z0-9-]+-rezept-\d+)["']/i);
      if (linkMatch) {
        const recipeUrl = `https://www.gutekueche.at/${linkMatch[1]}`;
        const recipeHtml = await fetchHtml(recipeUrl);
        if (recipeHtml) {
          const img = extractImage(recipeHtml);
          if (img) return { img, source: `listing:${slug}` };
        }
      }
    }
    await sleep(500);
  }

  // 3. Try direct recipe page with slug
  for (const slug of slugs.slice(0, 2)) {
    // Construct possible recipe URLs
    const html = await fetchHtml(`https://www.gutekueche.at/${slug}-rezepte`);
    if (html) {
      const img = extractImage(html);
      if (img) return { img, source: `direct:${slug}` };
    }
    await sleep(500);
  }

  return null;
}

async function main() {
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  const raw = runSQL("SELECT id, name FROM recipes WHERE image LIKE '%pexels%' ORDER BY id");
  if (!raw) { log("No Pexels recipes found"); return; }

  const recipes = raw.split("\n").filter(l => l.trim()).map(l => {
    const [id, name] = l.split("|");
    return { id: parseInt(id), name };
  });

  log(`${recipes.length} recipes with Pexels images`);

  let updated = 0, failed = 0;
  const failedList = [];

  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    log(`[${i+1}/${recipes.length}] ${r.name} (ID ${r.id})`);

    const result = await findImage(r.id, r.name);

    if (result) {
      log(`  ✓ ${result.source}: ${result.img.substring(0, 70)}...`);
      if (!DRY_RUN) {
        const escaped = result.img.replace(/'/g, "''");
        runSQL(`UPDATE recipes SET image = '${escaped}' WHERE id = ${r.id}`);
      }
      updated++;
    } else {
      log(`  ✗ NOT FOUND`);
      failed++;
      failedList.push(`${r.id}: ${r.name}`);
    }

    await sleep(1500);
  }

  log("");
  log("═══════════════════════════════");
  log(`Updated: ${updated} | Failed: ${failed} / ${recipes.length}`);
  if (failedList.length) {
    log("FAILED:");
    failedList.forEach(f => log(`  - ${f}`));
  }
  log("Done.");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });

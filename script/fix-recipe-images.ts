/**
 * Fix recipe images: remove duplicated placeholders and assign recipe-correct images.
 *
 * Strategy:
 * 1. Recipes with source_url → scrape actual recipe image from JSON-LD
 * 2. Recipes without source_url → keyword-specific Unsplash image (getDefaultRecipeImage)
 * 3. Log every change: recipe_id, old_image, new_image, reason
 *
 * Usage:
 *   npx tsx script/fix-recipe-images.ts --dry-run
 *   npx tsx script/fix-recipe-images.ts
 *   DATABASE_URL=postgresql://... npx tsx script/fix-recipe-images.ts
 */

import { Pool } from "pg";
import * as cheerio from "cheerio";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 500; // delay between HTTP requests to avoid rate-limiting

function log(msg: string) {
  console.log(`[fix-images] ${msg}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Image extraction from URL (lightweight — only fetches image, not full scrape) ──

async function extractImageFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Try JSON-LD
    const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse($(script).html() || "");
        const img = findImageInJsonLd(data);
        if (img) return img;
      } catch {
        continue;
      }
    }

    // 2. Try og:image meta tag
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && ogImage.startsWith("http")) return ogImage;

    // 3. Try site-specific selectors
    const selectors = [
      "img.recipe-image", ".recipe-main-image img", ".recipe-image img",
      "img.ds-image", ".main-image img", 'img[class*="recipe"]',
      'img[class*="rezept"]', ".recipe-header img",
    ];
    for (const sel of selectors) {
      const src = $(sel).first().attr("src");
      if (src && src.startsWith("http")) return src;
    }

    return null;
  } catch {
    return null;
  }
}

function findImageInJsonLd(data: any): string | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findImageInJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  if (data && (data["@type"] === "Recipe" || (Array.isArray(data["@type"]) && data["@type"].includes("Recipe")))) {
    return extractImageFromJsonLd(data);
  }

  if (data && data["@graph"]) {
    return findImageInJsonLd(data["@graph"]);
  }

  return null;
}

function extractImageFromJsonLd(data: any): string | null {
  if (!data.image) return null;
  if (typeof data.image === "string") return data.image;
  if (Array.isArray(data.image)) {
    const first = data.image[0];
    return typeof first === "string" ? first : first?.url || null;
  }
  return data.image.url || null;
}

// ── Unsplash fallback (same logic as client/src/lib/recipe-images.ts) ──

const DISH_IMAGES: [RegExp, string][] = [
  [/kürbis.*suppe|kürbiscreme/i, "mFnbFaCIu1I"],
  [/tomate.*suppe|tomaten.*suppe/i, "Hk9oENaEPFQ"],
  [/spargel.*suppe/i, "EMKdJH3MNew"],
  [/champignon.*suppe|pilz.*suppe|schwammerl.*suppe/i, "FIKD9t5_5zQ"],
  [/brokkoli.*suppe/i, "F_gDXPdJvFo"],
  [/karotte.*suppe/i, "DcJsSagiinc"],
  [/linsen.*suppe|rote.?linsen/i, "IGyfB4tgfPM"],
  [/bohnen.*suppe|serbische.*bohnen/i, "KlQetBDtkWc"],
  [/minestrone/i, "Bkci_8qcdvQ"],
  [/zwiebel.*suppe|französische.*zwiebel/i, "QoGcamBq7Kc"],
  [/erbsen.*suppe/i, "F_gDXPdJvFo"],
  [/borschtsch|rote.?rüben.?suppe/i, "7-ORJL3BraM"],
  [/kokos.*suppe|thai/i, "vHnVtLK8rCc"],
  [/gazpacho|kalte.*gurken/i, "Hk9oENaEPFQ"],
  [/gulasch.*suppe|kartoffelgulasch/i, "hrlvr2ZlUNk"],
  [/leberknödel.*suppe/i, "pEGMsjMfVXQ"],
  [/grießnockerl|griesnockerl/i, "pEGMsjMfVXQ"],
  [/fritaten|flädle/i, "pEGMsjMfVXQ"],
  [/rinds.*suppe.*klar|klar.*suppe|backerbsen/i, "pEGMsjMfVXQ"],
  [/cremesuppe|creme.*suppe/i, "mFnbFaCIu1I"],
  [/erdäpfel.*suppe|kartoffel.*suppe/i, "Bkci_8qcdvQ"],
  [/schnitzel|paniert|pariser/i, "nUsJPqZL9RE"],
  [/cordon\s*bleu/i, "nUsJPqZL9RE"],
  [/backhendl|backhuhn/i, "2dDANFSyV5A"],
  [/surschnitzel/i, "nUsJPqZL9RE"],
  [/schweinsbraten|kümmelbraten|spanferkel/i, "AhLw1xvSsJY"],
  [/tafelspitz|tellerfleisch/i, "ssLprRPsqeE"],
  [/zwiebelrostbraten/i, "sBKLiRcdRTM"],
  [/rindsbraten|sauerbraten|rindfleisch/i, "sBKLiRcdRTM"],
  [/kalbsbraten|kalbs/i, "sBKLiRcdRTM"],
  [/faschierter?\s*braten/i, "HbTetDPyXrc"],
  [/stelze|schweinshaxe|haxe/i, "AhLw1xvSsJY"],
  [/lamm/i, "P7IwLMXOmhE"],
  [/ente|entenkeule/i, "GpoA8BIkVJE"],
  [/gans|gansl/i, "GpoA8BIkVJE"],
  [/reh|hirsch|wild/i, "P7IwLMXOmhE"],
  [/gulasch|saftgulasch|fiaker/i, "hrlvr2ZlUNk"],
  [/geschnetzeltes|zürcher/i, "ssLprRPsqeE"],
  [/stroganoff/i, "hrlvr2ZlUNk"],
  [/ragout/i, "P7IwLMXOmhE"],
  [/fleischlaberl|frikadelle/i, "HbTetDPyXrc"],
  [/leberkäse/i, "cX0Yg4a40Vs"],
  [/hühner.*keule|grillhendl|hendl/i, "2dDANFSyV5A"],
  [/cevapcici|cevap/i, "HbTetDPyXrc"],
  [/saltimbocca/i, "ssLprRPsqeE"],
  [/gröstl|blunzen/i, "HbTetDPyXrc"],
  [/bauernschmaus|geselchtes|selchfleisch/i, "AhLw1xvSsJY"],
  [/beuschel/i, "hrlvr2ZlUNk"],
  [/kalbsleber/i, "sBKLiRcdRTM"],
  [/krainer|würstel/i, "cX0Yg4a40Vs"],
  [/puten.*medaillon|schweinemedaillon/i, "ssLprRPsqeE"],
  [/lachs/i, "JlO3-oY5ZlQ"],
  [/forelle|müllerin/i, "G2HA50x1gUo"],
  [/zander|dorsch|seelachs|pangasius|scholle/i, "G2HA50x1gUo"],
  [/fischstäbchen|fischknusperle|gebacken.*karpfen|kabeljau/i, "JlO3-oY5ZlQ"],
  [/garnele|shrimp/i, "0uAQMclz45I"],
  [/thunfisch/i, "JlO3-oY5ZlQ"],
  [/matjes|karpfen/i, "G2HA50x1gUo"],
  [/käsespätzle|mac.*cheese/i, "2pCBG2mDNBQ"],
  [/lasagne/i, "z_PfaGGOOBc"],
  [/pasta|penne|rigatoni|spaghetti|tortellini|nudel.*auflauf|arrabiata|pomodoro|aglio/i, "kcA-c3f_3FE"],
  [/krautfleckerl|schinkenfleckerl/i, "kcA-c3f_3FE"],
  [/flammkuchen/i, "MQUqbmszGGM"],
  [/strudel/i, "fczBpWaFIHE"],
  [/quiche|tarte|zwiebelkuchen/i, "MQUqbmszGGM"],
  [/kaiserschmarrn/i, "Y6OgisiGBjM"],
  [/palatschinken/i, "8Tpkec1Ximo"],
  [/marillenknödel|zwetschgenknödel/i, "OMhDIph8KBI"],
  [/germknödel/i, "OMhDIph8KBI"],
  [/spinatknödel|kaspressknödel|topfenknödel/i, "OMhDIph8KBI"],
  [/mohnnudeln/i, "kcA-c3f_3FE"],
  [/auflauf|gratin|moussaka|überbacken|parmigiana/i, "z_PfaGGOOBc"],
  [/laibchen|bratlinge?|puffer|falafel|kichererbsen/i, "uvdtfFeRdB8"],
  [/ratatouille/i, "12eHC6FxPyg"],
  [/curry|dal|linsen.*dal/i, "6JBgMRVvGiU"],
  [/chili\s*sin/i, "6JBgMRVvGiU"],
  [/gefüllte?\s*paprika|gefüllte?\s*zucchini|gefüllte?\s*champignon/i, "12eHC6FxPyg"],
  [/wok|gemüsepfanne/i, "6JBgMRVvGiU"],
  [/polenta.*schwammerl|eierschwammerl.*knödel|erdäpfelgulasch|pilzragout/i, "oGiGVffOHhg"],
  [/eierspeise|bauernomelett|knödel.*ei/i, "Y6OgisiGBjM"],
  [/kartoffelpüree|erdäpfelpüree|püree/i, "2e3hm6vKQ3g"],
  [/bratkartoffel|röstkartoffel|rösterdäpfel|schwenkkartoffel/i, "tOYiQxFsPGE"],
  [/pommes|frites|wedges|kartoffelspalten/i, "vi0kZuoe0-8"],
  [/kartoffelgratin/i, "2e3hm6vKQ3g"],
  [/ofenkartoffel|hasselback/i, "tOYiQxFsPGE"],
  [/kartoffelrösti|reibekuchen|erdäpfelpuffer/i, "tOYiQxFsPGE"],
  [/herzoginkartoffel|krokette/i, "vi0kZuoe0-8"],
  [/petersilkartoffel|salzkartoffel/i, "2e3hm6vKQ3g"],
  [/erdäpfelsalat|kartoffelsalat/i, "08bOYnH_r_E"],
  [/semmelknödel|serviettenknödel|speckknödel|böhmische.*knödel/i, "OMhDIph8KBI"],
  [/kartoffelknödel|waldviertler|grammelknödel/i, "OMhDIph8KBI"],
  [/spätzle|eierspätzle|butternockerl|nockerl/i, "2pCBG2mDNBQ"],
  [/reis|basmatireis|safranreis/i, "jcLcWL8DIoI"],
  [/risotto/i, "12eHC6FxPyg"],
  [/polenta|maisgrieß/i, "jcLcWL8DIoI"],
  [/gnocchi|schupfnudeln/i, "kcA-c3f_3FE"],
  [/couscous|bulgur|ebly|quinoa|hirse|buchweizen/i, "jcLcWL8DIoI"],
  [/dampfnudel|griesschnitten/i, "OMhDIph8KBI"],
  [/fusilli|penne|bandnudel|spiralnudel/i, "kcA-c3f_3FE"],
  [/sauerkraut|speckkraut|rahmkraut/i, "qnKhZJPKFD8"],
  [/rotkraut|rotkohl/i, "qnKhZJPKFD8"],
  [/rahmspinat|blattspinat|mangold/i, "IGfIGP5ONV0"],
  [/brokkoli|broccoli/i, "kXQ3J7_2fpc"],
  [/karotten.*gemüse|glasiert/i, "kXQ3J7_2fpc"],
  [/champignon|schwammerl|eierschwammerl|steinpilz|pilzmischung/i, "oGiGVffOHhg"],
  [/salat|vogerlsalat|blattsalat|gurkensalat|tomatensalat|krautsalat/i, "IGfIGP5ONV0"],
  [/ofengemüse|bratgemüse|ratatouille.*beilage/i, "12eHC6FxPyg"],
  [/fisolen|grüne.*bohnen|zuckerschoten/i, "kXQ3J7_2fpc"],
  [/erbsen|erbsen.*karotten/i, "kXQ3J7_2fpc"],
  [/zucchini.*gemüse|paprika.*gemüse|melanzani|aubergine/i, "12eHC6FxPyg"],
  [/kohlrabi|kohlsprossen|rosenkohl|wirsing|spitzkohl|grünkohl|chinakohl/i, "qnKhZJPKFD8"],
  [/kürbis.*gemüse|wurzelgemüse|sellerie.*gemüse|pastinaken|rübengemüse|topinambur|petersilienwurzel|steckrüben/i, "kXQ3J7_2fpc"],
  [/spargel/i, "kXQ3J7_2fpc"],
  [/preiselbeeren?|apfelkren|semmelkren|schnittlauchsauce|kräuterdip|kräuterrahm/i, "IGfIGP5ONV0"],
  [/vanillesauce|vanilleeis|schlagobers|topfencreme/i, "mBGxm_yfxa4"],
  [/butterbrösel|staubzucker|zimtzucker|mohnbutter|nussbrösel/i, "mBGxm_yfxa4"],
  [/röster|kompott|fruchtcoulis|schokoladensauce/i, "doYk-KIqwJA"],
];

const CATEGORY_IMAGES: Record<string, string> = {
  ClearSoups: "pEGMsjMfVXQ",
  CreamSoups: "mFnbFaCIu1I",
  MainMeat: "sBKLiRcdRTM",
  MainFish: "JlO3-oY5ZlQ",
  MainVegan: "12eHC6FxPyg",
  Sides: "tOYiQxFsPGE",
  ColdSauces: "IGfIGP5ONV0",
  HotSauces: "hrlvr2ZlUNk",
  Salads: "IGfIGP5ONV0",
  HotDesserts: "Y6OgisiGBjM",
  ColdDesserts: "doYk-KIqwJA",
};

const DEFAULT_IMAGE = "sBKLiRcdRTM";

function buildUnsplashUrl(id: string): string {
  if (/^\d{13}-/.test(id)) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`;
  }
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;
}

function getDefaultRecipeImage(category: string | null, recipeName: string | null): string {
  if (recipeName) {
    for (const [pattern, photoId] of DISH_IMAGES) {
      if (pattern.test(recipeName)) {
        return buildUnsplashUrl(photoId);
      }
    }
  }
  const catId = (category && CATEGORY_IMAGES[category]) || DEFAULT_IMAGE;
  return buildUnsplashUrl(catId);
}

// ── Detect Pexels placeholder (all current bad images are Pexels) ──

function isPexelsPlaceholder(url: string | null): boolean {
  if (!url) return true;
  return url.includes("pexels.com");
}

// ── Main ──

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  log(`Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  const { rows: recipes } = await pool.query(`
    SELECT id, name, category, image, source_url
    FROM recipes ORDER BY id
  `);
  log(`Rezepte gesamt: ${recipes.length}`);

  const changes: { id: number; name: string; oldImage: string; newImage: string; reason: string }[] = [];
  let scraped = 0;
  let scrapeFailed = 0;
  let fallbackUsed = 0;
  let skipped = 0;

  for (const recipe of recipes) {
    const oldImage = recipe.image || "";

    // Skip non-Pexels images (= manually edited or already correct)
    if (!isPexelsPlaceholder(oldImage)) {
      skipped++;
      continue;
    }

    let newImage: string | null = null;
    let reason = "";

    // Strategy 1: scrape from source_url
    if (recipe.source_url) {
      newImage = await extractImageFromUrl(recipe.source_url);
      if (newImage) {
        reason = "scraped from " + new URL(recipe.source_url).hostname;
        scraped++;
      } else {
        scrapeFailed++;
        reason = "scrape failed, keyword fallback";
      }
      await sleep(DELAY_MS);
    }

    // Strategy 2: keyword-specific Unsplash fallback
    if (!newImage) {
      newImage = getDefaultRecipeImage(recipe.category, recipe.name);
      if (!reason) reason = "no source_url, keyword fallback";
      fallbackUsed++;
    }

    // Only log if actually changing
    if (newImage && newImage !== oldImage) {
      changes.push({
        id: recipe.id,
        name: recipe.name,
        oldImage: oldImage.substring(0, 60),
        newImage: newImage.substring(0, 60),
        reason,
      });

      if (!DRY_RUN) {
        await pool.query(`UPDATE recipes SET image = $1 WHERE id = $2`, [newImage, recipe.id]);
      }
    }

    // Progress every 50 recipes
    if (recipe.id % 50 === 0) {
      log(`  ... ${recipe.id}/${recipes.length} verarbeitet`);
    }
  }

  // Print changes
  log("\n══ Änderungen ══");
  for (const c of changes) {
    log(`  ID ${c.id}: ${c.name}`);
    log(`    Old: ${c.oldImage}...`);
    log(`    New: ${c.newImage}...`);
    log(`    Reason: ${c.reason}`);
  }

  // Summary
  log("\n══ Zusammenfassung ══");
  log(`Rezepte gesamt: ${recipes.length}`);
  log(`Übersprungen (nicht-Pexels): ${skipped}`);
  log(`Bild von Quelle gescrapt: ${scraped}`);
  log(`Scraping fehlgeschlagen: ${scrapeFailed}`);
  log(`Keyword-Fallback verwendet: ${fallbackUsed}`);
  log(`Änderungen gesamt: ${changes.length}`);

  // Check remaining duplicates
  if (!DRY_RUN) {
    const { rows: dupes } = await pool.query(`
      SELECT image, COUNT(*)::int AS cnt
      FROM recipes WHERE image IS NOT NULL
      GROUP BY image HAVING COUNT(*) > 1
      ORDER BY cnt DESC LIMIT 10
    `);
    if (dupes.length > 0) {
      log("\nVerbleibende Duplikate:");
      for (const d of dupes) {
        log(`  ${d.cnt}x: ${d.image?.substring(0, 80)}`);
      }
    } else {
      log("\nKeine Duplikate mehr!");
    }
  }

  log("=== Fertig ===");
  await pool.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });

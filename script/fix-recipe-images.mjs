/**
 * Fix Recipe Images — Comprehensive image quality check & replacement
 *
 * Identifies and replaces:
 * 1. Chefkoch placeholder images (assets/v2/img/placeholders)
 * 2. lecker.de fallback images (suesskartoffelsalat for everything)
 * 3. Clearly wrong Chefkoch images (name mismatch)
 * 4. Duplicate Pexels photos (same stock photo for different dishes)
 * 5. Generic/wrong Pexels photos for Austrian specialties
 *
 * Sources (in order of preference):
 * 1. gutekueche.at listing pages (Austrian recipes, no JS needed)
 * 2. Pexels API with specific Austrian food search terms
 * 3. NULL (SVG gradient fallback in UI is better than wrong photo)
 *
 * Usage:
 *   node script/fix-recipe-images.mjs --dry-run
 *   node script/fix-recipe-images.mjs
 *   node script/fix-recipe-images.mjs --pexels-only
 *   node script/fix-recipe-images.mjs --null-bad
 */

import pg from "pg";
const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const PEXELS_ONLY = process.argv.includes("--pexels-only");
const NULL_BAD = process.argv.includes("--null-bad");
const PEXELS_KEY = "hdFZokAFOLDxv26EIEbenblkthNmFHjcqzEf3LcL2RagZwQCPGzxauPK";

const pool = new Pool({ connectionString: DB_URL });

function log(msg) { console.log(`[fix-images] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.4)); }

// ── Known bad images ────────────────────────────────────────

function isPlaceholder(url) {
  if (!url) return true;
  return url.includes("assets/v2/img/placeholders");
}

function isLeckerFallback(url) {
  if (!url) return false;
  return url.includes("suesskartoffelsalat-mit-tahinsosse");
}

// Check if Chefkoch image slug matches the recipe name
function isChefkochMismatch(recipeName, imageUrl) {
  if (!imageUrl || !imageUrl.includes("chefkoch-cdn.de")) return false;

  const slugMatch = imageUrl.match(/crop-960x540\/([^.]+)/);
  if (!slugMatch) return false;
  const slug = slugMatch[1].toLowerCase();

  // Normalize recipe name to comparable form
  const nameNorm = recipeName.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ").trim();
  const nameWords = nameNorm.split(" ").filter(w => w.length >= 3);

  // Check how many name words appear in the slug
  const matches = nameWords.filter(w => slug.includes(w)).length;
  const ratio = nameWords.length > 0 ? matches / nameWords.length : 0;

  // If less than 30% of name words match → probably wrong image
  if (ratio < 0.3 && nameWords.length >= 2) return true;
  if (ratio === 0 && nameWords.length === 1) return true;

  return false;
}

// ── Explicitly wrong mappings (manual overrides) ────────────

const KNOWN_WRONG = new Set([
  // Chefkoch mismatches found in analysis
  112, // Indianer → lasagne-indian-style
  425, // Schlagobers → mozzarella-haehnchen
  413, // Staubzucker → quesadillas
  418, // Zimtzucker → rohrnudeln
  420, // Nussbrösel → nougatknödel
  138, // Frankfurter → frankfurter-kranz-schnitten
  128, // Eierspeis → shakshuka
  242, // Grillhendl → pollo-alla-farfalla
  240, // Hühnerkeule gegrillt → sate
  253, // Fischstäbchen → spinat-fischstaebchen-auflauf
  223, // Selchfleisch → selchfleischknoedel
  133, // Käseaufstrich → dattel-frischkaese
  147, // Einspänner → gerollte-einspaenner (Austrian coffee ≠ rolled wafers)
  402, // Champignons in Rahm → garnelen-champignon
  401, // Schwammerl → mariazeller-festtagsschnitzel
  405, // Pilzmischung → jaegerschnitzel
  386, // Fisolen → kichererbsen-raeuchertofu-salat
  381, // Bratgemüse (Mischung) → curry-gewuerzmischung
  327, // Kartoffelpüree mit Kräutern → mit-fischstaebchen
  319, // Salzkartoffeln → spinat-spiegelei
  343, // Spiralnudeln → rucola-spaetzle
  377, // Rote Rüben (warm) → rote-rueben-cremesuppe
  421, // Preiselbeerkompott → apfelkuechle
  422, // Warme Schokoladensauce → pochierte-birnen
  419, // Mohnbutter → schupfnudeln
  412, // Butterbrösel → gruener-spargel
  43,  // Hühnerkeule überbacken → haehnchenschlegel-im-bierteig
  218, // Hühnerschnitzel Natur paniert → auf-toast-mit-champignons
  297, // Rote-Rüben-Laibchen → rote-rueben-russisch
  164, // Bündnerfleisch → rote-bete-mousse-mit-buendnerfleisch
  12,  // Bärlauchcremesuppe → mit-croutons-und-chorizo (close enough but wrong)
  187, // Kalbsknochensuppe → fenchelcremesuppe (completely wrong)
  406, // Blattsalat → salatdressing-fuer-alle-blattsalate (dressing, not salad)
  404, // Steinpilze → tagliatelle-mit-steinpilzen (pasta, not mushrooms)
  352, // Ebly / Weizen → mit-schinkengulasch
  357, // Maisgrieß → polentaauflauf-mit-gemuese
  211, // Fisolen-Suppe → fasolada-griechische-bohnensuppe (Greek, not Austrian)
]);

// ── Austrian→English translations for Pexels ────────────────

const TRANSLATIONS = {
  // Soups
  "Grießnockerlsuppe": "semolina dumpling soup",
  "Leberknödelsuppe": "liver dumpling soup austrian",
  "Eiernockerl": "egg noodles austrian",
  "Frittatensuppe": "pancake strips soup",
  "Kaspressknödelsuppe": "cheese dumpling soup",
  "Nudelsuppe": "noodle soup clear",
  "Zwiebelsuppe": "french onion soup",
  "Backerbsensuppe": "clear broth soup",
  "Saure Suppe (Steirisch)": "sour cream soup",
  "Steirische Wurzelsuppe": "root vegetable soup",
  "Rindssuppe klar": "clear beef broth",
  "Leberreissuppe": "liver rice soup",
  "Markklößchensuppe": "bone marrow dumpling soup",
  "Hühnersuppe mit Einlage": "chicken soup with garnish",
  "Kalbsknochensuppe": "veal bone soup",
  "Rote-Rüben-Cremesuppe": "beetroot cream soup",
  "Fisolen-Suppe": "green bean soup",
  "Kartoffelgulaschsuppe": "potato goulash soup",
  // Cream soups
  "Blumenkohlcremesuppe": "cauliflower cream soup",
  "Brokkolicremesuppe": "broccoli cream soup",
  "Bärlauchcremesuppe": "wild garlic cream soup",
  "Champignoncremesuppe": "mushroom cream soup",
  "Erbsencremesuppe": "pea cream soup",
  "Fenchelcremesuppe": "fennel cream soup",
  "Karfiolcremesuppe": "cauliflower soup creamy",
  "Karottencremesuppe": "carrot cream soup",
  "Kartoffelcremesuppe": "potato cream soup",
  "Knoblauchcremesuppe": "garlic cream soup",
  "Kohlrabicremesuppe": "kohlrabi cream soup",
  "Lauchcremesuppe": "leek cream soup",
  "Maiscremesuppe": "corn cream soup",
  "Paprikacremesuppe": "bell pepper cream soup",
  "Selleriecremesuppe": "celery cream soup",
  "Spargelcremesuppe": "asparagus cream soup",
  "Spinatcremesuppe": "spinach cream soup",
  "Tomatencremesuppe": "tomato cream soup",
  "Zucchinicremesuppe": "zucchini cream soup",
  // Main Meat
  "Beuscherl": "offal ragout austrian",
  "Beuschel": "offal ragout stew",
  "Frankfurter": "frankfurter sausage vienna",
  "Eierspeis": "scrambled eggs austrian",
  "Grillhendl": "roast chicken grilled",
  "Hühnerkeule gegrillt": "grilled chicken leg",
  "Hühnerkeule überbacken": "chicken thigh baked",
  "Hühnerschnitzel Natur paniert": "breaded chicken schnitzel",
  "Selchfleisch": "smoked pork meat",
  "Surschnitzel": "cured pork schnitzel",
  "Steirisches Wurzelfleisch": "pork with root vegetables",
  "Leberkässemmel": "meatloaf sandwich bavarian",
  "Bündnerfleisch": "air dried beef sliced",
  // Main Fish
  "Fischstäbchen": "fish sticks breaded",
  // Main Vegan
  "Rigatoni mit Gemüseragout": "rigatoni vegetable ragout",
  "Eierspeise / Bauernomelett": "farmer omelette",
  // Cold Desserts
  "Esterházy Torte": "esterhazy torte cake",
  "Indianer": "chocolate cream puff pastry",
  "Einspänner": "viennese coffee whipped cream",
  "Schlagobers": "whipped cream dollop",
  "Staubzucker": "powdered sugar dusting",
  "Zimtzucker": "cinnamon sugar",
  "Nussbrösel": "nut crumble topping",
  // Hot Desserts
  "Butterbrösel": "butter breadcrumbs topping",
  // Sauces
  "Preiselbeerkompott": "lingonberry compote jar",
  "Preiselbeeren (Kompott)": "lingonberry jam compote",
  "Mohnbutter": "poppy seed butter",
  "Warme Schokoladensauce": "warm chocolate sauce pouring",
  "Fruchtcoulis": "berry fruit coulis",
  "Käseaufstrich": "cheese spread cream",
  "Schnittlauchsauce": "chive sauce cream",
  // Salads
  "Steirischer Käferbohnensalat": "runner bean salad austrian",
  "Blattsalat": "mixed green salad leaves",
  "Rote-Rüben-Laibchen": "beetroot patties",
  // Sides
  "Fisolen / Grüne Bohnen": "green beans steamed",
  "Bratgemüse (Mischung)": "roasted mixed vegetables",
  "Champignons in Rahm": "mushrooms cream sauce",
  "Schwammerl / Champignons": "sauteed mushrooms",
  "Pilzmischung": "mixed mushrooms sauteed",
  "Steinpilze": "porcini mushrooms cooked",
  "Kartoffelpüree mit Kräutern": "herb mashed potatoes",
  "Salzkartoffeln": "boiled potatoes salt",
  "Spiralnudeln / Fusilli": "fusilli pasta cooked",
  "Rote Rüben (warm)": "cooked beetroot warm",
  "Ebly / Weizen": "wheat berries cooked",
  "Maisgrieß": "polenta cooked plate",
  "Kartoffelgratin (als Beilage)": "potato gratin baked",
  "Polenta (als Beilage)": "polenta sliced grilled",
  "Rösterdäpfel": "roasted potatoes crispy",
  "Wedges / Kartoffelspalten": "potato wedges baked",
  "Serviettenknödel mit Schwammerlsauce": "bread dumpling mushroom sauce",
  "Stuffed Mushrooms / Gefüllte Champignons": "stuffed mushrooms baked",
  // Duplicated Pexels - need unique images
  "Marillenknödel": "apricot dumplings austrian",
  "Zwetschgenknödel": "plum dumplings austrian",
  "Germknödel": "yeast dumpling vanilla sauce",
  "Bohnensalat": "bean salad white",
  "Fisolensalat": "green bean salad vinaigrette",
  "Gemischter Salat": "mixed salad bowl colorful",
  "Geselchtes mit Sauerkraut": "smoked pork sauerkraut",
  "Sauerkraut": "sauerkraut plate",
  "Speckkraut": "bacon cabbage dish",
  "Erdäpfelgulasch": "potato goulash stew",
  "Rindsgulasch": "beef goulash hungarian",
};

// ── gutekueche.at image search ──────────────────────────────

function slugify(name) {
  return name.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function searchGutekueche(recipeName) {
  const slug = slugify(recipeName);
  // Try the listing page pattern that works
  const variants = [slug];

  // Add sub-variants
  const words = slug.split("-").filter(w => w.length >= 3 && !["mit","und","auf","als","fuer","von","nach","aus"].includes(w));
  if (words.length > 1) {
    // Try just main nouns
    const nouns = words.filter(w => !["gebratene","gebackene","panierte","gemischte","warme","kalte","einfache"].includes(w));
    if (nouns.length > 0 && nouns.join("-") !== slug) variants.push(nouns.join("-"));
    // Try individual long words
    for (const w of nouns) {
      if (w.length >= 5) variants.push(w);
    }
  }

  for (const variant of variants.slice(0, 4)) {
    const url = `https://www.gutekueche.at/${variant}-rezepte`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Find recipe images on the listing page
      const imgMatches = [...html.matchAll(/src="(https:\/\/www\.gutekueche\.at\/storage\/media\/recipe\/[^"]+)"/g)];
      if (imgMatches.length > 0) {
        // Return the first recipe image (most relevant)
        const imgUrl = imgMatches[0][1];
        // Make sure it's a reasonable size image
        return imgUrl.replace("-default.jpg", "-default.jpg"); // Already good format
      }
    } catch { continue; }
    await sleep(1500);
  }
  return null;
}

// ── Pexels API search ───────────────────────────────────────

async function searchPexels(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.landscape; // 940x650
    }
  } catch { /* ignore */ }
  return null;
}

// Track used Pexels photo IDs to avoid duplicates
const usedPexelsIds = new Set();

async function searchPexelsUnique(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.photos) {
      for (const photo of data.photos) {
        if (!usedPexelsIds.has(photo.id)) {
          usedPexelsIds.add(photo.id);
          return photo.src.landscape;
        }
      }
      // All duplicates, use first anyway
      if (data.photos.length > 0) {
        return data.photos[0].src.landscape;
      }
    }
  } catch { /* ignore */ }
  return null;
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Pexels-only: ${PEXELS_ONLY} | Null-bad: ${NULL_BAD}`);

  const { rows: recipes } = await pool.query(
    "SELECT id, name, category, image FROM recipes ORDER BY category, name"
  );

  log(`Total recipes: ${recipes.length}`);

  // Collect existing Pexels photo IDs to avoid duplicates
  for (const r of recipes) {
    if (r.image && r.image.includes("pexels.com")) {
      const match = r.image.match(/photos\/(\d+)\//);
      if (match) usedPexelsIds.add(parseInt(match[1]));
    }
  }

  // Identify problematic images
  const problems = [];
  const duplicatePexels = {};

  for (const r of recipes) {
    let reason = null;

    if (isPlaceholder(r.image)) {
      reason = "placeholder";
    } else if (isLeckerFallback(r.image)) {
      reason = "lecker-fallback";
    } else if (KNOWN_WRONG.has(r.id)) {
      reason = "known-wrong";
    } else if (isChefkochMismatch(r.name, r.image)) {
      reason = "name-mismatch";
    }

    // Track Pexels duplicates
    if (r.image && r.image.includes("pexels.com")) {
      const match = r.image.match(/photos\/(\d+)\//);
      if (match) {
        const photoId = match[1];
        if (!duplicatePexels[photoId]) duplicatePexels[photoId] = [];
        duplicatePexels[photoId].push(r);
      }
    }

    if (reason) {
      problems.push({ ...r, reason });
    }
  }

  // Add Pexels duplicates (keep first, replace rest)
  for (const [photoId, recs] of Object.entries(duplicatePexels)) {
    if (recs.length > 1) {
      for (let i = 1; i < recs.length; i++) {
        if (!problems.find(p => p.id === recs[i].id)) {
          problems.push({ ...recs[i], reason: `pexels-duplicate(${photoId})` });
        }
      }
    }
  }

  log(`Found ${problems.length} problematic images:`);
  const byReason = {};
  for (const p of problems) {
    const key = p.reason.startsWith("pexels-duplicate") ? "pexels-duplicate" : p.reason;
    byReason[key] = (byReason[key] || 0) + 1;
  }
  for (const [reason, count] of Object.entries(byReason)) {
    log(`  ${reason}: ${count}`);
  }

  if (DRY_RUN) {
    log("\n--- DRY RUN: Listing all problems ---");
    for (const p of problems) {
      log(`  [${p.reason}] ${p.id} | ${p.name} (${p.category})`);
    }
    await pool.end();
    return;
  }

  // Fix images
  let fixed = 0;
  let nulled = 0;
  let failed = 0;

  for (const p of problems) {
    log(`\nFixing: ${p.name} (${p.category}) — reason: ${p.reason}`);

    let newImage = null;

    // Try gutekueche.at first (unless pexels-only)
    if (!PEXELS_ONLY) {
      newImage = await searchGutekueche(p.name);
      if (newImage) {
        log(`  ✓ gutekueche.at: ${newImage.substring(0, 80)}...`);
      }
      await sleep(1500);
    }

    // Try Pexels if no gutekueche result
    if (!newImage) {
      const query = TRANSLATIONS[p.name] || p.name.replace(/[()\/]/g, " ").trim();
      newImage = await searchPexelsUnique(query + " food");
      if (newImage) {
        log(`  ✓ Pexels: ${newImage.substring(0, 80)}...`);
      }
      await sleep(500);
    }

    if (newImage) {
      await pool.query("UPDATE recipes SET image = $1 WHERE id = $2", [newImage, p.id]);
      fixed++;
    } else if (NULL_BAD) {
      await pool.query("UPDATE recipes SET image = NULL WHERE id = $2", [null, p.id]);
      log(`  ✗ Set to NULL (no replacement found)`);
      nulled++;
    } else {
      log(`  ✗ No replacement found, keeping current`);
      failed++;
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`Fixed: ${fixed} | Nulled: ${nulled} | Failed: ${failed} | Total problems: ${problems.length}`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

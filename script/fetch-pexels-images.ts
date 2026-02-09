/**
 * Fetch free food photos from Pexels for all recipes without a custom image.
 *
 * Usage:
 *   npx tsx script/fetch-pexels-images.ts
 *   npx tsx script/fetch-pexels-images.ts --dry-run      # preview only
 *   npx tsx script/fetch-pexels-images.ts --limit 10      # only first 10
 *   npx tsx script/fetch-pexels-images.ts --overwrite      # replace existing images too
 */

import { db } from "../server/db";
import { recipes } from "../shared/schema";
import { eq, isNull, or, sql } from "drizzle-orm";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_API_KEY) {
  console.error("PEXELS_API_KEY environment variable required");
  process.exit(1);
}
const PEXELS_BASE = "https://api.pexels.com/v1/search";

// Delay between requests to be nice to the API
const DELAY_MS = 300;

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
  };
  photographer: string;
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

// Build a search query from recipe name — translate common Austrian/German food terms
function buildSearchQuery(name: string): string {
  // Remove common suffixes/prefixes that don't help search
  let q = name
    .replace(/\s*\(.*?\)\s*/g, "") // remove parenthetical notes
    .replace(/nach\s+\w+\s+art/gi, "") // "nach Wiener Art" etc.
    .trim();

  // Map German food terms to English for better Pexels results
  const translations: [RegExp, string][] = [
    [/^wiener schnitzel$/i, "wiener schnitzel breaded cutlet"],
    [/schnitzel|paniert/i, "breaded schnitzel cutlet"],
    [/cordon\s*bleu/i, "cordon bleu"],
    [/gulasch/i, "goulash beef stew"],
    [/schweinsbraten|kümmelbraten/i, "roast pork"],
    [/tafelspitz/i, "boiled beef tafelspitz"],
    [/zwiebelrostbraten/i, "steak with onions"],
    [/rindsbraten|sauerbraten/i, "beef roast"],
    [/geschnetzeltes/i, "sliced meat cream sauce"],
    [/backhendl/i, "fried chicken"],
    [/kaiserschmarrn/i, "kaiserschmarrn shredded pancake"],
    [/palatschinken/i, "crepes filled"],
    [/knödel/i, q.toLowerCase().includes("marillen") ? "apricot dumplings" : "dumplings"],
    [/spätzle|eierspätzle/i, "spaetzle egg noodles"],
    [/käsespätzle/i, "cheese spaetzle"],
    [/erdäpfel|kartoffel/i, q.replace(/erdäpfel/gi, "potato").replace(/kartoffel/gi, "potato")],
    [/kürbis.*suppe|kürbiscreme/i, "pumpkin cream soup"],
    [/cremesuppe|creme.*suppe/i, "cream soup"],
    [/tomate.*suppe/i, "tomato soup"],
    [/linsen/i, "lentil dish"],
    [/lachs/i, "salmon fillet"],
    [/forelle/i, "trout fish"],
    [/zander/i, "pike perch fish"],
    [/strudel/i, q.toLowerCase().includes("topfen") || q.toLowerCase().includes("apfel") ? "apple strudel pastry" : "strudel"],
    [/ratatouille/i, "ratatouille vegetables"],
    [/lasagne/i, "lasagna"],
    [/risotto/i, "risotto"],
    [/curry/i, "curry dish"],
    [/auflauf|gratin/i, "casserole gratin"],
    [/sauerkraut/i, "sauerkraut"],
    [/rotkraut|rotkohl/i, "red cabbage"],
    [/rahmspinat/i, "creamed spinach"],
    [/brokkoli/i, "broccoli"],
    [/salat/i, "salad fresh"],
    [/fleischlaberl|frikadelle/i, "meatball patty"],
    [/leberkäse/i, "meatloaf bavarian"],
    [/topfenstrudel/i, "cheese strudel pastry"],
    [/germknödel/i, "yeast dumpling"],
    [/reis$/i, "steamed rice"],
    [/polenta/i, "polenta"],
    [/pommes|frites/i, "french fries"],
    [/püree/i, "mashed potatoes"],
  ];

  for (const [pattern, translation] of translations) {
    if (pattern.test(q)) {
      return translation + " food";
    }
  }

  // Default: use original name + "food" for better results
  return q + " food";
}

async function searchPexels(query: string): Promise<PexelsPhoto | null> {
  const url = `${PEXELS_BASE}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!res.ok) {
    console.error(`  Pexels API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const data: PexelsResponse = await res.json();
  return data.photos[0] || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const overwrite = args.includes("--overwrite");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  console.log(`Pexels Image Fetcher for mise.at recipes`);
  console.log(`Mode: ${dryRun ? "DRY RUN (preview only)" : "LIVE (updating DB)"}`);
  console.log(`Overwrite existing: ${overwrite}`);
  if (limit < Infinity) console.log(`Limit: ${limit} recipes`);
  console.log("---");

  // Fetch recipes — either all or only those without images
  const allRecipes = overwrite
    ? await db.select({ id: recipes.id, name: recipes.name, category: recipes.category, image: recipes.image }).from(recipes).orderBy(recipes.name)
    : await db
        .select({ id: recipes.id, name: recipes.name, category: recipes.category, image: recipes.image })
        .from(recipes)
        .where(
          or(
            isNull(recipes.image),
            eq(recipes.image, ""),
          )
        )
        .orderBy(recipes.name);

  const toProcess = allRecipes.slice(0, limit);
  console.log(`Found ${allRecipes.length} recipes${!overwrite ? " without custom image" : " total"}, processing ${toProcess.length}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const recipe of toProcess) {
    const query = buildSearchQuery(recipe.name);
    process.stdout.write(`[${updated + skipped + failed + 1}/${toProcess.length}] "${recipe.name}" → "${query}" ... `);

    const photo = await searchPexels(query);

    if (!photo) {
      console.log("NO RESULT");
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    // Use "large" size (940px wide) — good for cards and detail view
    const imageUrl = photo.src.large;

    if (dryRun) {
      console.log(`WOULD SET → ${imageUrl}`);
      skipped++;
    } else {
      await db
        .update(recipes)
        .set({ image: imageUrl })
        .where(eq(recipes.id, recipe.id));
      console.log(`SET → ${photo.photographer}`);
      updated++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n---");
  console.log(`Done! Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

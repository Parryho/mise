/**
 * Populate recipes.image for all recipes that don't have one.
 * Uses the same keyword-matching logic from recipe-images.ts (client-side).
 * Does NOT overwrite existing images (from scraper or manual upload).
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npx tsx script/seed-recipe-images.ts
 *   DATABASE_URL=postgresql://... npx tsx script/seed-recipe-images.ts
 */

import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

// ═══════════════════════════════════════════════════════════
// Mirror of client/src/lib/recipe-images.ts logic (server-side copy)
// ═══════════════════════════════════════════════════════════
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
  [/schweinsbraten|kümmelbraten|spanferkel/i, "AhLw1xvSsJY"],
  [/tafelspitz|tellerfleisch/i, "ssLprRPsqeE"],
  [/zwiebelrostbraten/i, "sBKLiRcdRTM"],
  [/rindsbraten|sauerbraten|rindfleisch/i, "sBKLiRcdRTM"],
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
  [/bauernschmaus|geselchtes|selchfleisch/i, "AhLw1xvSsJY"],
  [/beuschel/i, "hrlvr2ZlUNk"],
  [/krainer|würstel/i, "cX0Yg4a40Vs"],
  [/lachs/i, "JlO3-oY5ZlQ"],
  [/forelle|müllerin/i, "G2HA50x1gUo"],
  [/zander|dorsch|seelachs|pangasius|scholle/i, "G2HA50x1gUo"],
  [/fischstäbchen|fischknusperle|gebacken.*karpfen|kabeljau/i, "JlO3-oY5ZlQ"],
  [/garnele|shrimp/i, "0uAQMclz45I"],
  [/käsespätzle|mac.*cheese/i, "2pCBG2mDNBQ"],
  [/lasagne/i, "z_PfaGGOOBc"],
  [/pasta|penne|rigatoni|spaghetti|tortellini|nudel.*auflauf/i, "kcA-c3f_3FE"],
  [/flammkuchen/i, "MQUqbmszGGM"],
  [/strudel/i, "fczBpWaFIHE"],
  [/quiche|tarte|zwiebelkuchen/i, "MQUqbmszGGM"],
  [/kaiserschmarrn/i, "Y6OgisiGBjM"],
  [/palatschinken/i, "8Tpkec1Ximo"],
  [/marillenknödel|zwetschgenknödel/i, "OMhDIph8KBI"],
  [/germknödel/i, "OMhDIph8KBI"],
  [/spinatknödel|kaspressknödel|topfenknödel/i, "OMhDIph8KBI"],
  [/auflauf|gratin|moussaka|überbacken|parmigiana/i, "z_PfaGGOOBc"],
  [/laibchen|bratlinge?|puffer|falafel/i, "uvdtfFeRdB8"],
  [/ratatouille/i, "12eHC6FxPyg"],
  [/curry|dal|linsen.*dal/i, "6JBgMRVvGiU"],
  [/kartoffelpüree|erdäpfelpüree|püree/i, "2e3hm6vKQ3g"],
  [/bratkartoffel|röstkartoffel|rösterdäpfel/i, "tOYiQxFsPGE"],
  [/pommes|frites|wedges|kartoffelspalten/i, "vi0kZuoe0-8"],
  [/semmelknödel|serviettenknödel|speckknödel/i, "OMhDIph8KBI"],
  [/spätzle|eierspätzle|butternockerl/i, "2pCBG2mDNBQ"],
  [/reis|basmatireis|safranreis/i, "jcLcWL8DIoI"],
  [/risotto/i, "12eHC6FxPyg"],
  [/brokkoli|broccoli/i, "kXQ3J7_2fpc"],
  [/salat|vogerlsalat|blattsalat/i, "IGfIGP5ONV0"],
  [/sauerkraut|speckkraut|rahmkraut/i, "qnKhZJPKFD8"],
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

function buildSourceUrl(id: string): string {
  if (/^\d{13}-/.test(id)) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`;
  }
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;
}

function getDefaultRecipeImage(category: string | null, recipeName: string): string {
  for (const [pattern, photoId] of DISH_IMAGES) {
    if (pattern.test(recipeName)) {
      return buildSourceUrl(photoId);
    }
  }
  const catId = (category && CATEGORY_IMAGES[category]) || DEFAULT_IMAGE;
  return buildSourceUrl(catId);
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════
async function main() {
  const pool = new Pool({ connectionString: DB_URL });

  try {
    // Get all recipes without an image
    const { rows } = await pool.query(
      `SELECT id, name, category FROM recipes WHERE image IS NULL OR image = ''`
    );

    console.log(`Found ${rows.length} recipes without images.`);
    let updated = 0;

    for (const recipe of rows) {
      const imageUrl = getDefaultRecipeImage(recipe.category, recipe.name);
      await pool.query(
        `UPDATE recipes SET image = $1 WHERE id = $2`,
        [imageUrl, recipe.id]
      );
      updated++;
      if (updated % 50 === 0) console.log(`  ...${updated}/${rows.length}`);
    }

    console.log(`Done! Updated ${updated} recipes with default images.`);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

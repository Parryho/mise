import { db } from "./db";
import { recipes } from "@shared/schema";
import { eq, isNull, or } from "drizzle-orm";

// ============================================================
// Keyword Maps (DE + EN)
// ============================================================

type LangKeywords = { de: string[]; en: string[] };

const CUISINE_KEYWORDS: Record<string, LangKeywords> = {
  austrian: {
    de: [
      "schnitzel", "knödel", "nockerl", "spätzle", "kaiserschmarrn",
      "tafelspitz", "gulasch", "beuschel", "kraut", "grammel",
      "erdäpfel", "schweins", "hendl", "backhendl", "stelze",
      "marillen", "zwetschgen", "topfen", "mohn", "strudel",
      "serviettenknödel", "semmelknödel", "leberknödel", "kaspressknödel",
      "gröstl", "kasnocken", "germknödel", "palatschinken", "blunzen",
      "geselchtes", "selch", "fritatten", "rindssuppe", "grießnockerl",
    ],
    en: [
      "schnitzel", "dumpling", "tafelspitz", "goulash",
      "apricot", "plum", "quark", "poppy",
    ],
  },
  italian: {
    de: [
      "pasta", "spaghetti", "penne", "lasagne", "risotto", "polenta",
      "arrabiata", "pomodoro", "carbonara", "bolognese", "pesto",
      "tiramisù", "mozzarella", "parmesan", "al forno", "saltimbocca",
      "gnocchi", "tortellini", "ravioli", "ciabatta", "bruschetta",
    ],
    en: [
      "pasta", "spaghetti", "penne", "lasagne", "risotto", "polenta",
      "arrabiata", "pomodoro", "carbonara", "bolognese", "pesto",
    ],
  },
  asian: {
    de: [
      "curry", "wok", "soja", "teriyaki", "thai", "ingwer",
      "kokos", "sesam", "basmati", "jasmin", "sushi", "ramen",
      "pad thai", "tempura", "miso", "edamame", "kimchi",
      "süß-sauer", "glasnudeln", "asia",
    ],
    en: [
      "curry", "wok", "soy", "teriyaki", "thai", "ginger",
      "coconut", "sesame", "basmati", "sushi", "ramen", "tempura",
      "sweet sour", "glass noodle",
    ],
  },
  mediterranean: {
    de: [
      "oliven", "feta", "tzatziki", "moussaka", "couscous", "bulgur",
      "hummus", "falafel", "taboulé", "baba ganoush", "dolma",
      "souvlaki", "gyros", "paprika gefüllt",
    ],
    en: [
      "olive", "feta", "tzatziki", "moussaka", "couscous", "bulgur",
      "hummus", "falafel", "tabbouleh", "souvlaki", "gyros",
    ],
  },
};

const FLAVOR_KEYWORDS: Record<string, LangKeywords> = {
  hearty: {
    de: [
      "braten", "schmalz", "speck", "schweins", "gansl", "ente",
      "gulasch", "grammel", "blunzen", "stelze", "geselchtes",
      "selch", "wurzel", "kraut", "kümmel", "jäger", "zwiebel",
    ],
    en: [
      "roast", "lard", "bacon", "pork", "goose", "duck", "goulash",
    ],
  },
  light: {
    de: [
      "gedünstet", "dampf", "salat", "gemüse", "fisch", "forelle",
      "zander", "scholle", "tofu", "joghurt", "quark", "obst",
    ],
    en: [
      "steamed", "salad", "vegetable", "fish", "trout", "tofu", "yogurt",
    ],
  },
  spicy: {
    de: [
      "chili", "paprika scharf", "curry scharf", "peperoni", "jalapeño",
      "cayenne", "tabasco", "sriracha",
    ],
    en: [
      "chili", "hot pepper", "spicy", "jalapeño", "cayenne",
    ],
  },
  creamy: {
    de: [
      "rahm", "sahne", "obers", "käse", "überbacken", "gratin",
      "béchamel", "hollandaise", "carbonara", "alfredo",
    ],
    en: [
      "cream", "cheese", "gratin", "béchamel", "hollandaise", "alfredo",
    ],
  },
  fresh: {
    de: [
      "kräuter", "zitrone", "limette", "minze", "basilikum",
      "gurke", "radieschen",
    ],
    en: [
      "herbs", "lemon", "lime", "mint", "basil", "cucumber", "radish",
    ],
  },
};

const SELF_CONTAINED_KEYWORDS = [
  "spätzle", "fleckerl", "lasagne", "pasta", "spaghetti", "penne",
  "auflauf", "gratin", "überbacken", "moussaka",
  "strudel", "quiche", "flammkuchen", "zwiebelkuchen",
  "spinatknödel", "kaspressknödel", "kasnocken", "grammelknödel",
  "curry", "eintopf", "chili sin", "dal",
  "gröstl", "risotto", "polenta", "tortellini", "ravioli",
  "gnocchi", "pad thai", "ramen",
];

const DESSERT_MAIN_KEYWORDS = [
  "marillenknödel", "zwetschgenknödel", "topfenknödel", "mohnnudel",
  "germknödel", "kaiserschmarrn", "palatschinken", "dampfnudel",
];

// ============================================================
// Detection
// ============================================================

function matchKeywords(name: string, keywordsMap: Record<string, LangKeywords>): string | null {
  const lower = name.toLowerCase();
  for (const [key, langs] of Object.entries(keywordsMap)) {
    for (const kw of [...langs.de, ...langs.en]) {
      if (lower.includes(kw.toLowerCase())) return key;
    }
  }
  return null;
}

function detectCuisine(name: string, category: string | null): string | null {
  const detected = matchKeywords(name, CUISINE_KEYWORDS);
  if (detected) return detected;
  // Fallback: traditional Austrian categories
  if (category && ["ClearSoups", "CreamSoups", "HotSauces", "ColdSauces"].includes(category)) {
    return "austrian";
  }
  return null;
}

function detectFlavor(name: string): string | null {
  return matchKeywords(name, FLAVOR_KEYWORDS);
}

function detectDishType(name: string, category: string | null): string | null {
  const lower = name.toLowerCase();

  for (const kw of DESSERT_MAIN_KEYWORDS) {
    if (lower.includes(kw)) return "dessertMain";
  }
  for (const kw of SELF_CONTAINED_KEYWORDS) {
    if (lower.includes(kw)) return "selfContained";
  }
  // Mains without keyword match default to needsSides
  if (category && ["MainMeat", "MainFish", "MainVegan"].includes(category)) {
    return "needsSides";
  }
  return null;
}

// ============================================================
// Main
// ============================================================

interface TagStats {
  total: number;
  tagged: { cuisine: number; flavor: number; dishType: number };
  untagged: { cuisine: number; flavor: number; dishType: number };
}

export async function autoTagAllRecipes(dryRun = false): Promise<TagStats> {
  const allRecipes = await db.select().from(recipes);

  const stats: TagStats = {
    total: allRecipes.length,
    tagged: { cuisine: 0, flavor: 0, dishType: 0 },
    untagged: { cuisine: 0, flavor: 0, dishType: 0 },
  };

  for (const recipe of allRecipes) {
    const updates: Record<string, string> = {};

    if (!recipe.cuisineType) {
      const v = detectCuisine(recipe.name, recipe.category);
      if (v) { updates.cuisineType = v; stats.tagged.cuisine++; }
      else stats.untagged.cuisine++;
    }

    if (!recipe.flavorProfile) {
      const v = detectFlavor(recipe.name);
      if (v) { updates.flavorProfile = v; stats.tagged.flavor++; }
      else stats.untagged.flavor++;
    }

    if (!recipe.dishType) {
      const v = detectDishType(recipe.name, recipe.category);
      if (v) { updates.dishType = v; stats.tagged.dishType++; }
      else stats.untagged.dishType++;
    }

    if (Object.keys(updates).length > 0 && !dryRun) {
      await db.update(recipes).set(updates).where(eq(recipes.id, recipe.id));
    }
  }

  return stats;
}

// CLI entry
const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("auto-tag-recipes.ts");
if (isMain) {
  (async () => {
    const dryRun = process.argv.includes("--dry-run");
    console.log(dryRun ? "DRY RUN (keine Aenderungen):\n" : "Auto-Tagging laeuft...\n");
    const stats = await autoTagAllRecipes(dryRun);
    console.log(JSON.stringify(stats, null, 2));
    if (!dryRun) console.log("\nFertig!");
    process.exit(0);
  })();
}

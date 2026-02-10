/**
 * Allergen Auto-Detection
 *
 * Detects EU-14 allergens from German ingredient names.
 *
 * Two matching strategies to prevent false positives:
 * - exactTokens: short/ambiguous keywords matched as whole words only
 *   (prevents "ei" matching "Weizenmehl", "nuss" matching "Kalbsnuss")
 * - substrings: long/specific keywords matched via .includes()
 *   (safe because they're unique enough: "eigelb", "haselnuss", etc.)
 */

import { ALLERGENS, ALLERGEN_CODES } from "@shared/allergens";

interface AllergenRule {
  /** Keywords matched as exact tokens (split on non-letter chars) */
  exactTokens?: string[];
  /** Keywords matched via substring (.includes) — use only for specific terms */
  substrings?: string[];
  /** If normalized text contains any of these, skip this allergen entirely */
  excludeSubstrings?: string[];
}

const ALLERGEN_RULES: Record<string, AllergenRule> = {
  // A - Gluten (all keywords are specific enough for substring matching)
  A: {
    substrings: [
      "mehl", "weizen", "roggen", "gerste", "hafer", "dinkel", "grieß",
      "paniermehl", "semmelbrösel", "nudeln", "pasta", "brot", "couscous",
      "bulgur", "teig", "semmelwürfel", "panko", "panierbrösel", "teigwaren",
      "spätzle", "knödel", "gnocchi", "keks", "zwieback",
    ],
  },

  // B - Krebstiere
  B: {
    substrings: [
      "krabbe", "garnele", "hummer", "shrimp", "scampi", "languste",
      "krebs", "crevette", "krebsfleisch",
    ],
  },

  // C - Eier
  // "ei"/"eier" are exact-token only (prevents: Weizenmehl, Schweinefleisch, Reis, Petersilie)
  // Longer compounds are safe as substrings
  C: {
    exactTokens: ["ei", "eier", "dotter"],
    substrings: [
      "eigelb", "eiweiß", "eiweiss", "eierklar", "eiklar",
      "eidotter", "vollei", "flüssigei",
    ],
  },

  // D - Fisch
  D: {
    substrings: [
      "fisch", "lachs", "forelle", "kabeljau", "thunfisch", "sardine",
      "hering", "pangasius", "zander", "scholle", "seelachs", "dorade",
      "makrele", "barsch", "saibling", "rotbarsch", "heilbutt",
    ],
  },

  // E - Erdnuss
  E: {
    substrings: ["erdnuss", "erdnüsse", "erdnussbutter", "peanut"],
  },

  // F - Soja
  F: {
    substrings: [
      "soja", "tofu", "edamame", "miso", "tempeh", "sojasoße",
      "sojasauce", "sojasprossen", "sojabohne",
    ],
  },

  // G - Milch/Laktose
  G: {
    substrings: [
      "milch", "sahne", "rahm", "butter", "käse", "joghurt", "topfen",
      "quark", "mascarpone", "mozzarella", "parmesan", "obers", "schlagobers",
      "crème fraîche", "schmand", "molke", "buttermilch", "creme",
      "frischkäse", "ricotta", "gouda", "emmentaler", "bergkäse",
      "schafskäse", "feta", "gorgonzola", "camembert", "brie",
    ],
  },

  // H - Schalenfrüchte (tree nuts only)
  // Generic "nuss"/"nüsse" are exact-token only (prevents: Kalbsnuss, Erdnussbutter)
  // Specific nut names are safe as substrings
  // Explicit exclusions for non-tree-nut "nuss" compounds
  H: {
    exactTokens: ["nuss", "nüsse"],
    substrings: [
      "haselnuss", "haselnüsse", "walnuss", "walnüsse",
      "mandel", "mandeln", "cashew", "cashews",
      "pistazie", "pistazien",
      "pekannuss", "pekannüsse", "pekanuss",
      "macadamia", "paranuss", "paranüsse",
    ],
    excludeSubstrings: ["muskat", "kalbsnuss", "kokosnuss"],
  },

  // L - Sellerie
  L: {
    substrings: ["sellerie", "knollensellerie", "stangensellerie", "selleriesalz"],
  },

  // M - Senf
  M: {
    substrings: ["senf", "senfkörner", "senfpulver", "mostrich"],
  },

  // N - Sesam
  N: {
    substrings: ["sesam", "sesamöl", "tahini", "tahin"],
  },

  // O - Sulfite/Schwefeldioxid
  // "wein" is exact-token only (prevents: Schweinefleisch, Schweinebraten)
  // Specific wine/vinegar terms are safe as substrings
  O: {
    exactTokens: ["wein"],
    substrings: [
      "essig", "trockenfrüchte", "weißwein", "rotwein",
      "balsamico", "weinessig", "rosinen", "sultaninen",
    ],
  },

  // P - Lupine
  P: {
    substrings: ["lupine", "lupinenmehl", "lupinenschrot"],
  },

  // R - Weichtiere
  R: {
    substrings: [
      "muschel", "schnecke", "tintenfisch", "calamari", "oktopus",
      "austern", "miesmuschel", "venusmuschel", "jakobsmuschel",
      "sepia", "kalmar",
    ],
  },
};

/**
 * Detect allergens from a single ingredient name.
 *
 * Uses exact-token matching for short ambiguous keywords (ei, nuss, wein)
 * and substring matching for long specific keywords (eigelb, haselnuss, etc.).
 */
export function detectAllergens(ingredientName: string): string[] {
  if (!ingredientName) return [];

  const normalized = ingredientName.toLowerCase().trim();

  // Sanitize: skip entries < 2 chars or without alphabetic characters
  if (normalized.length < 2 || !/[a-zäöüß]/.test(normalized)) return [];

  // Split into word tokens for exact matching (split on non-German-letter chars)
  const tokens = new Set(normalized.split(/[^a-zäöüß]+/).filter(Boolean));

  const detected = new Set<string>();

  for (const [code, rule] of Object.entries(ALLERGEN_RULES)) {
    // Check exclusions first — if text contains an exclusion term, skip entirely
    if (rule.excludeSubstrings?.some(ex => normalized.includes(ex))) continue;

    // Check exact token matches (for short/ambiguous keywords)
    if (rule.exactTokens) {
      const tokensArr = Array.from(tokens);
      let found = false;
      for (const t of tokensArr) {
        if (rule.exactTokens.includes(t)) {
          detected.add(code);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Check substring matches (for long/specific keywords)
    if (rule.substrings) {
      for (const kw of rule.substrings) {
        if (normalized.includes(kw)) {
          detected.add(code);
          break;
        }
      }
    }
  }

  return Array.from(detected).sort();
}

/**
 * Suggest allergens for a recipe based on all its ingredients.
 */
export function suggestAllergensForRecipe(
  ingredients: Array<{ name: string }>
): Array<{ ingredientName: string; suggestedAllergens: string[] }> {
  return ingredients.map(ing => ({
    ingredientName: ing.name,
    suggestedAllergens: detectAllergens(ing.name),
  }));
}

/**
 * Get unique allergen codes from all ingredients.
 */
export function getAllergensFromIngredients(
  ingredients: Array<{ name: string }>
): string[] {
  const allAllergens = new Set<string>();

  for (const ing of ingredients) {
    const detected = detectAllergens(ing.name);
    for (const code of detected) {
      allAllergens.add(code);
    }
  }

  return Array.from(allAllergens).sort();
}

/**
 * Route handler: POST /api/allergens/detect
 * Body: { ingredientNames: string[] }
 * Returns: { ingredientName, suggestedAllergens }[]
 */
export function detectAllergensHandler(req: any, res: any) {
  try {
    const { ingredientNames } = req.body;

    if (!Array.isArray(ingredientNames)) {
      return res.status(400).json({
        error: "ingredientNames muss ein Array sein",
      });
    }

    const results = ingredientNames.map(name => ({
      ingredientName: name,
      suggestedAllergens: detectAllergens(name),
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Route handler: POST /api/allergens/suggest-for-recipe
 * Body: { recipeId: number }
 * Returns: { suggestions: Array, uniqueAllergens: string[] }
 */
export async function suggestAllergensForRecipeHandler(req: any, res: any) {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: "recipeId erforderlich" });
    }

    const { storage } = await import("../../storage");
    const ingredients = await storage.getIngredients(recipeId);

    const suggestions = suggestAllergensForRecipe(ingredients);
    const uniqueAllergens = getAllergensFromIngredients(ingredients);

    res.json({
      suggestions,
      uniqueAllergens,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

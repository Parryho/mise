/**
 * Allergen Auto-Detection (3.7)
 * Automatically suggest allergens based on German ingredient names.
 */

import { ALLERGENS, ALLERGEN_CODES } from "@shared/allergens";

// Keyword mapping: German ingredient keywords → allergen codes
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  // A - Gluten
  A: [
    "mehl", "weizen", "roggen", "gerste", "hafer", "dinkel", "grieß",
    "paniermehl", "semmelbrösel", "nudeln", "pasta", "brot", "couscous",
    "bulgur", "teig", "semmelwürfel", "panko", "panierbrösel", "teigwaren",
    "spätzle", "knödel", "gnocchi", "keks", "zwieback"
  ],

  // B - Krebstiere
  B: [
    "krabbe", "garnele", "hummer", "shrimp", "scampi", "languste",
    "krebs", "crevette", "krebsfleisch"
  ],

  // C - Ei
  C: [
    "ei", "eier", "eigelb", "eiweiß", "eierklar", "vollei",
    "eiklar", "eidotter", "flüssigei"
  ],

  // D - Fisch
  D: [
    "fisch", "lachs", "forelle", "kabeljau", "thunfisch", "sardine",
    "hering", "pangasius", "zander", "scholle", "seelachs", "dorade",
    "makrele", "barsch", "saibling", "rotbarsch", "heilbutt"
  ],

  // E - Erdnuss
  E: [
    "erdnuss", "erdnüsse", "erdnussbutter", "peanut"
  ],

  // F - Soja
  F: [
    "soja", "tofu", "edamame", "miso", "tempeh", "sojasoße",
    "sojasauce", "sojasprossen", "sojabohne"
  ],

  // G - Milch
  G: [
    "milch", "sahne", "rahm", "butter", "käse", "joghurt", "topfen",
    "quark", "mascarpone", "mozzarella", "parmesan", "obers", "schlagobers",
    "crème fraîche", "schmand", "molke", "buttermilch", "creme",
    "frischkäse", "ricotta", "gouda", "emmentaler", "bergkäse",
    "schafskäse", "feta", "gorgonzola", "camembert", "brie"
  ],

  // H - Schalenfrüchte (true tree nuts only — NOT nutmeg/Muskatnuss)
  H: [
    "mandel", "haselnuss", "walnuss", "cashew", "pistazie",
    "macadamia", "pekanuss", "paranuss", "pekannuss", "nuss"
  ],

  // L - Sellerie
  L: [
    "sellerie", "knollensellerie", "stangensellerie", "selleriesalz"
  ],

  // M - Senf
  M: [
    "senf", "senfkörner", "senfpulver", "mostrich"
  ],

  // N - Sesam
  N: [
    "sesam", "sesamöl", "tahini", "tahin"
  ],

  // O - Sulfite
  O: [
    "wein", "essig", "trockenfrüchte", "weißwein", "rotwein",
    "balsamico", "weinessig", "rosinen", "sultaninen"
  ],

  // P - Lupine
  P: [
    "lupine", "lupinenmehl", "lupinenschrot"
  ],

  // R - Weichtiere
  R: [
    "muschel", "schnecke", "tintenfisch", "calamari", "oktopus",
    "austern", "miesmuschel", "venusmuschel", "jakobsmuschel",
    "sepia", "kalmar"
  ],
};

// Ingredients that contain "nuss" but are NOT tree nuts (allergen H)
const H_EXCLUSIONS = ["muskat", "muskatnuss", "kokosnuss"];

/**
 * Detect allergens from a single ingredient name.
 * Case-insensitive, partial match.
 */
export function detectAllergens(ingredientName: string): string[] {
  if (!ingredientName) return [];

  const normalized = ingredientName.toLowerCase().trim();

  // Sanitize: skip entries < 2 chars or without alphabetic characters
  if (normalized.length < 2 || !/[a-zäöüß]/.test(normalized)) return [];

  const detected = new Set<string>();

  for (const [allergenCode, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        // H exclusion: "nuss" matches muskatnuss/kokosnuss → skip
        if (allergenCode === "H" && H_EXCLUSIONS.some(ex => normalized.includes(ex))) {
          break;
        }
        detected.add(allergenCode);
        break; // Found match for this allergen, move to next
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

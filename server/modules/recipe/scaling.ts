/**
 * Intelligent Scaling (3.5)
 * Non-linear portion scaling for commercial kitchens.
 * When scaling from 4 to 400 servings, salt/spices/baking powder don't scale linearly.
 */

import type { Unit } from "@shared/units";

interface IngredientInput {
  name: string;
  quantity: number;
  unit: Unit | string;
  category?: string;
}

interface ScaledIngredient {
  name: string;
  originalQuantity: number;
  scaledQuantity: number;
  unit: Unit | string;
  scalingFactor: number;
  scalingNote: string;
  ingredientType: string;
}

type IngredientType =
  | "Gewürze/Kräuter"
  | "Triebmittel"
  | "Fett (Braten)"
  | "Flüssigkeit"
  | "Standard";

/**
 * Detect ingredient type from German name.
 */
function detectIngredientType(name: string): IngredientType {
  const normalized = name.toLowerCase().trim();

  // Gewürze & Kräuter (sehr sublinear)
  const spices = [
    "salz", "pfeffer", "paprika", "oregano", "basilikum", "thymian",
    "rosmarin", "majoran", "kümmel", "koriander", "zimt", "muskat",
    "nelke", "curry", "chili", "ingwer", "knoblauch", "zwiebel",
    "kurkuma", "kardamom", "safran", "vanille", "gewürz", "kraut",
    "petersilie", "schnittlauch", "dill", "estragon", "lorbeer"
  ];

  // Triebmittel (sublinear)
  const leavening = [
    "backpulver", "hefe", "gelatine", "natron", "trockenhefe",
    "pektin", "agar"
  ];

  // Fette zum Braten (sehr sublinear, basiert auf Oberfläche)
  const cookingFats = [
    "öl (zum braten)", "öl zum braten", "butter (zum braten)",
    "butter zum braten", "schmalz", "butterschmalz", "bratfett",
    "bratöl"
  ];

  // Flüssigkeiten in Saucen/Suppen (leicht sublinear)
  const liquids = [
    "brühe", "fond", "sahne", "rahm", "suppe", "sauce", "soße",
    "wein", "stock", "bouillon", "obers", "schlagobers"
  ];

  // Check cooking fats first (most specific)
  for (const fat of cookingFats) {
    if (normalized.includes(fat)) {
      return "Fett (Braten)";
    }
  }

  // Check spices
  for (const spice of spices) {
    if (normalized.includes(spice)) {
      return "Gewürze/Kräuter";
    }
  }

  // Check leavening
  for (const leave of leavening) {
    if (normalized.includes(leave)) {
      return "Triebmittel";
    }
  }

  // Check liquids
  for (const liquid of liquids) {
    if (normalized.includes(liquid)) {
      return "Flüssigkeit";
    }
  }

  return "Standard";
}

/**
 * Calculate scaling factor based on ingredient type.
 */
function calculateScalingFactor(
  ingredientType: IngredientType,
  ratio: number
): { factor: number; note: string } {
  switch (ingredientType) {
    case "Gewürze/Kräuter":
      // sqrt(ratio) * 0.7 + ratio * 0.3 - very sublinear
      const spiceFactor = Math.sqrt(ratio) * 0.7 + ratio * 0.3;
      return {
        factor: spiceFactor,
        note: "Gewürze skalieren sublinear (Geschmack verstärkt sich in großen Mengen)",
      };

    case "Triebmittel":
      // ratio^0.8 - slightly sublinear
      const leaveningFactor = Math.pow(ratio, 0.8);
      return {
        factor: leaveningFactor,
        note: "Triebmittel skalieren leicht reduziert (chemische Reaktion)",
      };

    case "Fett (Braten)":
      // ratio^0.6 - very sublinear (surface area based)
      const fatFactor = Math.pow(ratio, 0.6);
      return {
        factor: fatFactor,
        note: "Bratfett basiert auf Oberfläche, nicht Volumen",
      };

    case "Flüssigkeit":
      // ratio^0.9 - slight reduction due to less evaporation in bulk
      const liquidFactor = Math.pow(ratio, 0.9);
      return {
        factor: liquidFactor,
        note: "Weniger Verdampfung bei größeren Mengen",
      };

    case "Standard":
    default:
      // Linear scaling for everything else
      return {
        factor: ratio,
        note: "Linear skaliert",
      };
  }
}

/**
 * Scale a single ingredient intelligently.
 */
export function scaleIngredient(
  ingredient: IngredientInput,
  fromServings: number,
  toServings: number
): ScaledIngredient {
  if (fromServings <= 0 || toServings <= 0) {
    throw new Error("Portionen müssen größer als 0 sein");
  }

  const ratio = toServings / fromServings;
  const ingredientType = detectIngredientType(ingredient.name);
  const { factor, note } = calculateScalingFactor(ingredientType, ratio);

  const scaledQuantity = ingredient.quantity * factor;

  // Round to reasonable precision
  const roundedQuantity = Math.round(scaledQuantity * 100) / 100;

  return {
    name: ingredient.name,
    originalQuantity: ingredient.quantity,
    scaledQuantity: roundedQuantity,
    unit: ingredient.unit,
    scalingFactor: Math.round(factor * 100) / 100,
    scalingNote: note,
    ingredientType,
  };
}

/**
 * Scale all ingredients of a recipe.
 */
export async function scaleRecipe(
  recipeId: number,
  targetServings: number
): Promise<{
  recipe: any;
  originalServings: number;
  targetServings: number;
  scaledIngredients: ScaledIngredient[];
}> {
  const { storage } = await import("../../storage");

  const recipe = await storage.getRecipe(recipeId);
  if (!recipe) {
    throw new Error("Rezept nicht gefunden");
  }

  const ingredients = await storage.getIngredients(recipeId);
  const originalServings = recipe.portions || 1;

  const scaledIngredients = ingredients.map((ing) =>
    scaleIngredient(
      {
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit as Unit,
      },
      originalServings,
      targetServings
    )
  );

  return {
    recipe: {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
    },
    originalServings,
    targetServings,
    scaledIngredients,
  };
}

/**
 * Route handler: POST /api/recipes/scale
 * Body: { recipeId: number, targetServings: number }
 */
export async function scaleRecipeHandler(req: any, res: any) {
  try {
    const { recipeId, targetServings } = req.body;

    if (!recipeId || !targetServings) {
      return res.status(400).json({
        error: "recipeId und targetServings erforderlich",
      });
    }

    if (targetServings <= 0) {
      return res.status(400).json({
        error: "targetServings muss größer als 0 sein",
      });
    }

    const result = await scaleRecipe(recipeId, targetServings);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Utility: Calculate scaling preview (without DB access).
 * Useful for client-side previews.
 */
export function scaleIngredientPreview(
  ingredientName: string,
  quantity: number,
  unit: string,
  fromServings: number,
  toServings: number
): ScaledIngredient {
  return scaleIngredient(
    { name: ingredientName, quantity, unit },
    fromServings,
    toServings
  );
}

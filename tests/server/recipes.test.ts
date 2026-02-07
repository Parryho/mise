/**
 * Recipes tests: CRUD mock, ingredient scaling, allergen detection, sub-recipe cycles, auto-categorization.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectAllergens, suggestAllergensForRecipe, getAllergensFromIngredients } from "../../server/allergen-detection";
import { scaleIngredient, scaleIngredientPreview } from "../../server/intelligent-scaling";
import { autoCategorize } from "../../shared/categorizer";

// -------------------------------------------------------
// Mock storage for sub-recipes (wouldCreateCycle)
// -------------------------------------------------------
vi.mock("../../server/storage", () => {
  const links: Record<number, Array<{ childRecipeId: number; portionMultiplier: number }>> = {};
  return {
    storage: {
      getSubRecipeLinks: vi.fn(async (recipeId: number) => links[recipeId] || []),
      getRecipe: vi.fn(async (id: number) => ({ id, name: `Recipe ${id}`, portions: 4, prepTime: 30, allergens: [], tags: [], steps: [], category: "MainMeat", season: "all" })),
      getIngredients: vi.fn(async (recipeId: number) => []),
      _setLinks: (parentId: number, children: Array<{ childRecipeId: number; portionMultiplier: number }>) => {
        links[parentId] = children;
      },
      _clearLinks: () => {
        for (const key of Object.keys(links)) delete links[Number(key)];
      },
    },
  };
});

// -------------------------------------------------------
// Allergen Detection Tests
// -------------------------------------------------------
describe("Allergen Detection", () => {
  it("detects gluten (A) from Mehl", () => {
    const result = detectAllergens("Weizenmehl");
    expect(result).toContain("A");
  });

  it("detects milk (G) from Sahne", () => {
    const result = detectAllergens("Sahne");
    expect(result).toContain("G");
  });

  it("detects eggs (C) from Eier", () => {
    const result = detectAllergens("Eier");
    expect(result).toContain("C");
  });

  it("detects fish (D) from Lachs", () => {
    const result = detectAllergens("Lachs");
    expect(result).toContain("D");
  });

  it("detects celery (L) from Sellerie", () => {
    const result = detectAllergens("Knollensellerie");
    expect(result).toContain("L");
  });

  it("detects mustard (M) from Senf", () => {
    const result = detectAllergens("Senf");
    expect(result).toContain("M");
  });

  it("detects sesame (N) from Sesamoel", () => {
    const result = detectAllergens("Sesamöl");
    expect(result).toContain("N");
  });

  it("detects sulphites (O) from Wein", () => {
    const result = detectAllergens("Weißwein");
    expect(result).toContain("O");
  });

  it("detects peanuts (E) from Erdnüsse", () => {
    const result = detectAllergens("Erdnüsse");
    expect(result).toContain("E");
  });

  it("detects soy (F) from Tofu", () => {
    const result = detectAllergens("Tofu");
    expect(result).toContain("F");
  });

  it("detects nuts (H) from Mandel", () => {
    const result = detectAllergens("Mandel");
    expect(result).toContain("H");
  });

  it("detects crustaceans (B) from Garnele", () => {
    const result = detectAllergens("Garnele");
    expect(result).toContain("B");
  });

  it("detects lupins (P) from Lupine", () => {
    const result = detectAllergens("Lupinenmehl");
    expect(result).toContain("P");
  });

  it("detects molluscs (R) from Muschel", () => {
    const result = detectAllergens("Miesmuschel");
    expect(result).toContain("R");
  });

  it("detects multiple allergens from a compound ingredient", () => {
    // "Eiernudeln" contains Ei (C) and Nudeln (A for Gluten)
    const result = detectAllergens("Eiernudeln");
    expect(result).toContain("A");
    expect(result).toContain("C");
  });

  it("returns empty array for allergen-free ingredient", () => {
    const result = detectAllergens("Wasser");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const result = detectAllergens("");
    expect(result).toEqual([]);
  });

  it("is case-insensitive", () => {
    const result = detectAllergens("WEIZENMEHL");
    expect(result).toContain("A");
  });

  it("results are sorted alphabetically", () => {
    const result = detectAllergens("Eiernudeln mit Sahne");
    // Should contain A, C, G in sorted order
    for (let i = 1; i < result.length; i++) {
      expect(result[i] >= result[i - 1]).toBe(true);
    }
  });
});

describe("suggestAllergensForRecipe", () => {
  it("returns suggestions for each ingredient", () => {
    const ingredients = [
      { name: "Weizenmehl" },
      { name: "Butter" },
      { name: "Wasser" },
    ];
    const result = suggestAllergensForRecipe(ingredients);
    expect(result).toHaveLength(3);
    expect(result[0].ingredientName).toBe("Weizenmehl");
    expect(result[0].suggestedAllergens).toContain("A");
    expect(result[1].ingredientName).toBe("Butter");
    expect(result[1].suggestedAllergens).toContain("G");
    expect(result[2].suggestedAllergens).toEqual([]);
  });

  it("returns empty array for empty ingredients list", () => {
    const result = suggestAllergensForRecipe([]);
    expect(result).toEqual([]);
  });
});

describe("getAllergensFromIngredients", () => {
  it("returns unique allergen codes from all ingredients", () => {
    const ingredients = [
      { name: "Weizenmehl" },
      { name: "Butter" },
      { name: "Eier" },
    ];
    const result = getAllergensFromIngredients(ingredients);
    expect(result).toContain("A");
    expect(result).toContain("G");
    expect(result).toContain("C");
    // No duplicates
    expect(new Set(result).size).toBe(result.length);
  });

  it("returns sorted codes", () => {
    const ingredients = [
      { name: "Sahne" },
      { name: "Eier" },
      { name: "Mehl" },
    ];
    const result = getAllergensFromIngredients(ingredients);
    for (let i = 1; i < result.length; i++) {
      expect(result[i] >= result[i - 1]).toBe(true);
    }
  });
});

// -------------------------------------------------------
// Sub-Recipe Cycle Detection Tests
// -------------------------------------------------------
describe("Sub-Recipe Cycle Detection", () => {
  let mockStorage: any;

  beforeEach(async () => {
    const mod = await import("../../server/storage");
    mockStorage = mod.storage;
    mockStorage._clearLinks();
  });

  it("detects self-reference cycle (A -> A)", async () => {
    const { wouldCreateCycle } = await import("../../server/sub-recipes");
    // parentId === childId
    const result = await wouldCreateCycle(1, 1);
    expect(result).toBe(true);
  });

  it("detects direct cycle (A -> B -> A)", async () => {
    // B already links to A
    mockStorage._setLinks(2, [{ childRecipeId: 1, portionMultiplier: 1 }]);
    const { wouldCreateCycle } = await import("../../server/sub-recipes");
    // Adding A -> B would create cycle
    const result = await wouldCreateCycle(1, 2);
    expect(result).toBe(true);
  });

  it("detects transitive cycle (A -> B -> C -> A)", async () => {
    mockStorage._setLinks(2, [{ childRecipeId: 3, portionMultiplier: 1 }]);
    mockStorage._setLinks(3, [{ childRecipeId: 1, portionMultiplier: 1 }]);
    const { wouldCreateCycle } = await import("../../server/sub-recipes");
    const result = await wouldCreateCycle(1, 2);
    expect(result).toBe(true);
  });

  it("allows valid sub-recipe link (no cycle)", async () => {
    mockStorage._setLinks(2, [{ childRecipeId: 3, portionMultiplier: 1 }]);
    const { wouldCreateCycle } = await import("../../server/sub-recipes");
    // Adding A -> B is fine since B -> C -> (no link back to A)
    const result = await wouldCreateCycle(1, 2);
    expect(result).toBe(false);
  });

  it("allows link when child has no sub-recipes", async () => {
    const { wouldCreateCycle } = await import("../../server/sub-recipes");
    const result = await wouldCreateCycle(1, 5);
    expect(result).toBe(false);
  });
});

// -------------------------------------------------------
// Category Auto-Assignment Tests
// -------------------------------------------------------
describe("Recipe Category Auto-Assignment", () => {
  it("categorizes soup by name", () => {
    expect(autoCategorize("Klare Rindssuppe")).toBe("ClearSoups");
  });

  it("categorizes cream soup by name", () => {
    expect(autoCategorize("Cremesuppe von Brokkoli")).toBe("CreamSoups");
  });

  it("categorizes meat main by name", () => {
    expect(autoCategorize("Wiener Schnitzel")).toBe("MainMeat");
  });

  it("categorizes vegetarian main by name", () => {
    expect(autoCategorize("Käsespätzle")).toBe("MainVegan");
  });

  it("categorizes side dish by name", () => {
    expect(autoCategorize("Kartoffelpüree")).toBe("Sides");
  });

  it("categorizes salad by name", () => {
    expect(autoCategorize("Grüner Salat")).toBe("Salads");
  });

  it("categorizes hot dessert by name", () => {
    expect(autoCategorize("Kaiserschmarrn")).toBe("HotDesserts");
  });

  it("categorizes cold dessert by name", () => {
    expect(autoCategorize("Panna Cotta")).toBe("ColdDesserts");
  });

  it("uses ingredient keywords as tiebreaker", () => {
    const result = autoCategorize("Eintopf", ["rindfleisch", "kartoffel"], []);
    // rindfleisch matches MainMeat, kartoffel matches Sides; name gives no strong signal
    expect(["MainMeat", "Sides"]).toContain(result);
  });

  it("defaults to MainMeat when no keywords match", () => {
    expect(autoCategorize("Unbekanntes Gericht", [], [])).toBe("MainMeat");
  });
});

// -------------------------------------------------------
// Ingredient Scaling (from intelligent-scaling.ts) — basic coverage
// -------------------------------------------------------
describe("Ingredient Scaling (scaleIngredient)", () => {
  it("scales standard ingredients linearly", () => {
    const result = scaleIngredient(
      { name: "Kartoffeln", quantity: 100, unit: "g" },
      4, 40
    );
    expect(result.scaledQuantity).toBe(1000); // 10x linear
    expect(result.ingredientType).toBe("Standard");
  });

  it("scales spices sub-linearly", () => {
    const result = scaleIngredient(
      { name: "Salz", quantity: 5, unit: "g" },
      4, 400
    );
    // ratio = 100, linear would be 500g
    expect(result.scaledQuantity).toBeLessThan(500);
    expect(result.ingredientType).toBe("Gewürze/Kräuter");
  });

  it("scales leavening agents sub-linearly", () => {
    const result = scaleIngredient(
      { name: "Backpulver", quantity: 10, unit: "g" },
      4, 40
    );
    // ratio = 10, linear would be 100g
    expect(result.scaledQuantity).toBeLessThan(100);
    expect(result.ingredientType).toBe("Triebmittel");
  });

  it("scales cooking fats very sub-linearly", () => {
    const result = scaleIngredient(
      { name: "Öl zum Braten", quantity: 30, unit: "ml" },
      4, 40
    );
    // ratio = 10, linear would be 300ml
    expect(result.scaledQuantity).toBeLessThan(300);
    expect(result.ingredientType).toBe("Fett (Braten)");
  });

  it("scales liquids slightly sub-linearly", () => {
    const result = scaleIngredient(
      { name: "Rinderbrühe", quantity: 200, unit: "ml" },
      4, 40
    );
    // ratio = 10, linear would be 2000ml
    expect(result.scaledQuantity).toBeLessThan(2000);
    expect(result.scaledQuantity).toBeGreaterThan(1500); // not drastically reduced
    expect(result.ingredientType).toBe("Flüssigkeit");
  });

  it("throws error for zero servings", () => {
    expect(() =>
      scaleIngredient({ name: "Mehl", quantity: 100, unit: "g" }, 0, 10)
    ).toThrow("Portionen müssen größer als 0 sein");
  });

  it("throws error for negative servings", () => {
    expect(() =>
      scaleIngredient({ name: "Mehl", quantity: 100, unit: "g" }, 4, -1)
    ).toThrow("Portionen müssen größer als 0 sein");
  });

  it("returns 1:1 scaling when from and to are equal", () => {
    const result = scaleIngredient(
      { name: "Kartoffeln", quantity: 200, unit: "g" },
      10, 10
    );
    expect(result.scaledQuantity).toBe(200);
    expect(result.scalingFactor).toBe(1);
  });

  it("scaleIngredientPreview matches scaleIngredient output", () => {
    const fromScale = scaleIngredient(
      { name: "Salz", quantity: 5, unit: "g" },
      4, 40
    );
    const fromPreview = scaleIngredientPreview("Salz", 5, "g", 4, 40);
    expect(fromScale.scaledQuantity).toBe(fromPreview.scaledQuantity);
    expect(fromScale.ingredientType).toBe(fromPreview.ingredientType);
  });
});

// -------------------------------------------------------
// Recipe CRUD Mocked Tests
// -------------------------------------------------------
describe("Recipe CRUD (mocked storage)", () => {
  let mockStorage: any;

  beforeEach(async () => {
    const mod = await import("../../server/storage");
    mockStorage = mod.storage;
  });

  it("getRecipe returns a recipe object with expected fields", async () => {
    const recipe = await mockStorage.getRecipe(1);
    expect(recipe).toHaveProperty("id", 1);
    expect(recipe).toHaveProperty("name");
    expect(recipe).toHaveProperty("category");
    expect(recipe).toHaveProperty("portions");
  });

  it("getIngredients returns an array", async () => {
    const ingredients = await mockStorage.getIngredients(1);
    expect(Array.isArray(ingredients)).toBe(true);
  });
});

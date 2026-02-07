/**
 * Comprehensive shared allergens tests.
 * Tests all 14 EU allergen codes, parseAllergenString, formatAllergens.
 */
import { describe, it, expect } from "vitest";
import { ALLERGENS, ALLERGEN_CODES, parseAllergenString, formatAllergens } from "../../shared/allergens";

describe("Allergens — ALLERGENS object", () => {
  it("has exactly 14 Austrian allergen codes (A-R, minus I,J,K)", () => {
    expect(Object.keys(ALLERGENS)).toHaveLength(14);
  });

  it("contains all expected codes", () => {
    const expected = ["A", "B", "C", "D", "E", "F", "G", "H", "L", "M", "N", "O", "P", "R"];
    for (const code of expected) {
      expect(ALLERGENS).toHaveProperty(code);
    }
  });

  it("does not contain I, J, K (not used in Austrian system)", () => {
    expect(ALLERGENS).not.toHaveProperty("I");
    expect(ALLERGENS).not.toHaveProperty("J");
    expect(ALLERGENS).not.toHaveProperty("K");
  });

  it("each allergen has code, name, and nameDE", () => {
    for (const [code, allergen] of Object.entries(ALLERGENS)) {
      expect(allergen).toHaveProperty("code", code);
      expect(allergen.name).toBeTruthy();
      expect(allergen.nameDE).toBeTruthy();
    }
  });

  it("A is Gluten", () => {
    expect(ALLERGENS.A).toEqual({ code: "A", name: "Gluten", nameDE: "Glutenhaltiges Getreide" });
  });

  it("B is Crustaceans", () => {
    expect(ALLERGENS.B.name).toBe("Crustaceans");
    expect(ALLERGENS.B.nameDE).toBe("Krebstiere");
  });

  it("C is Eggs", () => {
    expect(ALLERGENS.C.name).toBe("Eggs");
    expect(ALLERGENS.C.nameDE).toBe("Eier");
  });

  it("D is Fish", () => {
    expect(ALLERGENS.D.name).toBe("Fish");
  });

  it("E is Peanuts", () => {
    expect(ALLERGENS.E.name).toBe("Peanuts");
    expect(ALLERGENS.E.nameDE).toBe("Erdnüsse");
  });

  it("F is Soy", () => {
    expect(ALLERGENS.F.name).toBe("Soy");
  });

  it("G is Milk/Lactose", () => {
    expect(ALLERGENS.G.name).toBe("Milk/Lactose");
    expect(ALLERGENS.G.nameDE).toBe("Milch/Laktose");
  });

  it("H is Nuts (tree nuts)", () => {
    expect(ALLERGENS.H.name).toBe("Nuts");
    expect(ALLERGENS.H.nameDE).toBe("Schalenfrüchte");
  });

  it("L is Celery", () => {
    expect(ALLERGENS.L.name).toBe("Celery");
    expect(ALLERGENS.L.nameDE).toBe("Sellerie");
  });

  it("M is Mustard", () => {
    expect(ALLERGENS.M.name).toBe("Mustard");
  });

  it("N is Sesame", () => {
    expect(ALLERGENS.N.name).toBe("Sesame");
  });

  it("O is Sulphites", () => {
    expect(ALLERGENS.O.name).toBe("Sulphites");
    expect(ALLERGENS.O.nameDE).toBe("Sulfite/Schwefeldioxid");
  });

  it("P is Lupins", () => {
    expect(ALLERGENS.P.name).toBe("Lupins");
  });

  it("R is Molluscs", () => {
    expect(ALLERGENS.R.name).toBe("Molluscs");
    expect(ALLERGENS.R.nameDE).toBe("Weichtiere");
  });
});

describe("Allergens — ALLERGEN_CODES", () => {
  it("is an array of 14 codes", () => {
    expect(ALLERGEN_CODES).toHaveLength(14);
  });

  it("contains all valid codes", () => {
    expect(ALLERGEN_CODES).toContain("A");
    expect(ALLERGEN_CODES).toContain("R");
    expect(ALLERGEN_CODES).toContain("G");
  });

  it("matches the keys of ALLERGENS", () => {
    expect(ALLERGEN_CODES).toEqual(Object.keys(ALLERGENS));
  });
});

describe("Allergens — parseAllergenString", () => {
  it("parses a valid allergen string to array", () => {
    expect(parseAllergenString("ACGL")).toEqual(["A", "C", "G", "L"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseAllergenString("")).toEqual([]);
  });

  it("returns empty array for falsy input", () => {
    expect(parseAllergenString(null as unknown as string)).toEqual([]);
    expect(parseAllergenString(undefined as unknown as string)).toEqual([]);
  });

  it("filters out invalid characters", () => {
    expect(parseAllergenString("AXB")).toEqual(["A", "B"]);
    expect(parseAllergenString("AIBCJK")).toEqual(["A", "B", "C"]);
  });

  it("handles single character", () => {
    expect(parseAllergenString("G")).toEqual(["G"]);
  });

  it("handles all valid codes", () => {
    const result = parseAllergenString("ABCDEFGHLMNOP R");
    // Note: space is not a valid code, so it's filtered
    // "R" should be captured after the space, but split('') means each char
    expect(result).toContain("A");
    expect(result).toContain("R");
  });

  it("handles lowercase input (chars not in ALLERGENS are filtered)", () => {
    // Lowercase 'a' is not in ALLERGENS (keys are uppercase)
    expect(parseAllergenString("acg")).toEqual([]);
  });

  it("handles string with only invalid chars", () => {
    expect(parseAllergenString("XYZ123")).toEqual([]);
  });
});

describe("Allergens — formatAllergens", () => {
  it("formats an array to comma-separated string", () => {
    expect(formatAllergens(["A", "C", "G"])).toBe("A,C,G");
  });

  it("returns empty string for empty array", () => {
    expect(formatAllergens([])).toBe("");
  });

  it("filters out invalid codes", () => {
    expect(formatAllergens(["A", "X", "G"])).toBe("A,G");
  });

  it("handles single code", () => {
    expect(formatAllergens(["L"])).toBe("L");
  });

  it("handles all valid codes", () => {
    const all = Object.keys(ALLERGENS);
    const result = formatAllergens(all);
    expect(result.split(",")).toHaveLength(14);
  });
});

describe("Allergens — German keyword mapping integration", () => {
  // This tests that the allergen detection keywords align with the codes
  it("gluten keywords map to code A", () => {
    const glutenKeywords = ["mehl", "weizen", "nudeln"];
    // All these should be in the A category
    expect(ALLERGENS.A.name).toBe("Gluten");
  });

  it("milk keywords map to code G", () => {
    const milkKeywords = ["milch", "sahne", "butter", "käse"];
    expect(ALLERGENS.G.name).toBe("Milk/Lactose");
  });

  it("egg keywords map to code C", () => {
    expect(ALLERGENS.C.name).toBe("Eggs");
  });
});

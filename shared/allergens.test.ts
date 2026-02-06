import { describe, it, expect } from "vitest";
import { ALLERGENS, parseAllergenString, formatAllergens } from "./allergens";

describe("allergens", () => {
  it("has 16 Austrian allergen codes (A-R, minus I,J,K)", () => {
    const codes = Object.keys(ALLERGENS);
    expect(codes).toContain("A");
    expect(codes).toContain("R");
    expect(codes).not.toContain("I");
    expect(codes).not.toContain("J");
    expect(codes).not.toContain("K");
    expect(codes.length).toBe(14);
  });

  it("parseAllergenString splits string to array", () => {
    expect(parseAllergenString("ACGL")).toEqual(["A", "C", "G", "L"]);
    expect(parseAllergenString("")).toEqual([]);
    expect(parseAllergenString("AXB")).toEqual(["A", "B"]);
  });

  it("formatAllergens joins array to string", () => {
    expect(formatAllergens(["A", "C", "G"])).toBe("A,C,G");
    expect(formatAllergens([])).toBe("");
  });

  it("ALLERGENS has correct structure", () => {
    expect(ALLERGENS.A).toEqual({ code: "A", name: "Gluten", nameDE: "Glutenhaltiges Getreide" });
    expect(ALLERGENS.G).toEqual({ code: "G", name: "Milk/Lactose", nameDE: "Milch/Laktose" });
  });
});

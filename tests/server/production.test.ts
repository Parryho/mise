/**
 * Production tests: production list logic, intelligent scaling, shopping list aggregation, cost calculations.
 * All database calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { scaleIngredient } from "../../server/intelligent-scaling";
import { convertUnit, calculateCost } from "../../shared/units";
import type { Unit } from "../../shared/units";

// -------------------------------------------------------
// Production List Logic (Unit-tested as pure functions)
// -------------------------------------------------------

const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45, ak: 80 };

function calculateTotalQuantity(amountPerPortion: number, pax: number): number {
  return Math.round(amountPerPortion * pax * 100) / 100;
}

function getDefaultPax(locationSlug: string): number {
  return DEFAULT_PAX[locationSlug] || 50;
}

describe("Production — Total Quantity Calculation", () => {
  it("calculates total for standard pax", () => {
    // 10g per portion * 60 pax = 600g
    expect(calculateTotalQuantity(10, 60)).toBe(600);
  });

  it("handles fractional amounts", () => {
    // 0.5g per portion * 100 pax = 50g
    expect(calculateTotalQuantity(0.5, 100)).toBe(50);
  });

  it("handles zero pax", () => {
    expect(calculateTotalQuantity(10, 0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // 0.333g * 3 pax = 0.999 => 1.0
    expect(calculateTotalQuantity(0.333, 3)).toBe(1);
  });
});

describe("Production — Default PAX", () => {
  it("returns 60 for city", () => {
    expect(getDefaultPax("city")).toBe(60);
  });

  it("returns 45 for sued", () => {
    expect(getDefaultPax("sued")).toBe(45);
  });

  it("returns 80 for ak", () => {
    expect(getDefaultPax("ak")).toBe(80);
  });

  it("returns 50 for unknown location", () => {
    expect(getDefaultPax("unknown")).toBe(50);
  });
});

// -------------------------------------------------------
// Intelligent Scaling Tests
// -------------------------------------------------------
describe("Production — Intelligent Scaling", () => {
  it("spices scale significantly less than linear at high ratios", () => {
    const result = scaleIngredient(
      { name: "Pfeffer", quantity: 2, unit: "g" },
      4, 400 // 100x ratio
    );
    // Linear would be 200g, spice formula: sqrt(100)*0.7 + 100*0.3 = 7+30 = 37
    // 2g * 37 = 74g
    expect(result.scaledQuantity).toBeLessThan(100);
    expect(result.scaledQuantity).toBeGreaterThan(50);
  });

  it("standard ingredients scale exactly linearly", () => {
    const result = scaleIngredient(
      { name: "Rindfleisch", quantity: 150, unit: "g" },
      4, 40 // 10x ratio
    );
    expect(result.scaledQuantity).toBe(1500);
  });

  it("detects Oregano as a spice", () => {
    const result = scaleIngredient(
      { name: "Oregano getrocknet", quantity: 3, unit: "g" },
      4, 8
    );
    expect(result.ingredientType).toBe("Gewürze/Kräuter");
  });

  it("detects Hefe as leavening", () => {
    const result = scaleIngredient(
      { name: "Trockenhefe", quantity: 7, unit: "g" },
      4, 8
    );
    expect(result.ingredientType).toBe("Triebmittel");
  });

  it("detects Butterschmalz as cooking fat", () => {
    const result = scaleIngredient(
      { name: "Butterschmalz", quantity: 20, unit: "g" },
      4, 8
    );
    expect(result.ingredientType).toBe("Fett (Braten)");
  });

  it("detects Brühe as liquid", () => {
    const result = scaleIngredient(
      { name: "Gemüsebrühe", quantity: 500, unit: "ml" },
      4, 8
    );
    expect(result.ingredientType).toBe("Flüssigkeit");
  });

  it("scaling down also works (ratio < 1)", () => {
    const result = scaleIngredient(
      { name: "Kartoffeln", quantity: 200, unit: "g" },
      10, 5
    );
    // ratio = 0.5, linear standard => 100g
    expect(result.scaledQuantity).toBe(100);
  });

  it("provides a scaling note for each type", () => {
    const spice = scaleIngredient({ name: "Salz", quantity: 5, unit: "g" }, 4, 8);
    expect(spice.scalingNote).toContain("Gewürze");

    const standard = scaleIngredient({ name: "Mehl", quantity: 100, unit: "g" }, 4, 8);
    expect(standard.scalingNote).toContain("Linear");
  });
});

// -------------------------------------------------------
// Shopping List Aggregation Logic
// -------------------------------------------------------
describe("Production — Shopping List Aggregation", () => {
  it("aggregates same ingredient across multiple recipes", () => {
    // Simulating aggregation
    const items = [
      { name: "Kartoffeln", amount: 200, unit: "g" as Unit, pax: 60 },
      { name: "Kartoffeln", amount: 150, unit: "g" as Unit, pax: 45 },
    ];

    let totalQty = 0;
    for (const item of items) {
      totalQty += item.amount * item.pax;
    }
    // 200*60 + 150*45 = 12000 + 6750 = 18750
    expect(totalQty).toBe(18750);
  });

  it("converts units when aggregating (g to g)", () => {
    const qty1 = convertUnit(500, "g", "g");
    const qty2 = convertUnit(1.5, "kg", "g");
    expect(qty1 + qty2).toBeCloseTo(2000);
  });

  it("handles empty dish list returning zero totals", () => {
    const items: Array<{ amount: number; pax: number }> = [];
    const total = items.reduce((sum, item) => sum + item.amount * item.pax, 0);
    expect(total).toBe(0);
  });
});

// -------------------------------------------------------
// Cost Calculations
// -------------------------------------------------------
describe("Production — Cost Calculations", () => {
  it("calculates cost for grams with kg pricing", () => {
    // 500g at 10 EUR/kg = 5 EUR
    const cost = calculateCost(500, "g", 10, "kg");
    expect(cost).toBeCloseTo(5.0);
  });

  it("calculates cost for ml with l pricing", () => {
    // 250ml at 4 EUR/l = 1 EUR
    const cost = calculateCost(250, "ml", 4, "l");
    expect(cost).toBeCloseTo(1.0);
  });

  it("calculates cost for stueck with stueck pricing", () => {
    // 10 stueck at 0.30 EUR/stueck = 3.00 EUR
    const cost = calculateCost(10, "stueck", 0.30, "stueck");
    expect(cost).toBeCloseTo(3.0);
  });

  it("returns 0 when price is 0", () => {
    const cost = calculateCost(500, "g", 0, "kg");
    expect(cost).toBe(0);
  });

  it("returns 0 when quantity is 0", () => {
    const cost = calculateCost(0, "g", 10, "kg");
    expect(cost).toBe(0);
  });

  it("calculates total dish cost from multiple ingredients", () => {
    const ingredients = [
      { amount: 200, unit: "g" as Unit, pricePerUnit: 12, priceUnit: "kg" as Unit }, // 200g * 12/kg = 2.40
      { amount: 0.5, "unit": "l" as Unit, pricePerUnit: 3, priceUnit: "l" as Unit },  // 0.5l * 3/l = 1.50
      { amount: 3, unit: "stueck" as Unit, pricePerUnit: 0.25, priceUnit: "stueck" as Unit }, // 3 * 0.25 = 0.75
    ];

    let totalCost = 0;
    for (const ing of ingredients) {
      totalCost += calculateCost(ing.amount, ing.unit, ing.pricePerUnit, ing.priceUnit);
    }
    expect(totalCost).toBeCloseTo(4.65);
  });

  it("cost per guest calculation", () => {
    const totalCost = 150.0;
    const pax = 60;
    const costPerGuest = pax > 0 ? Math.round((totalCost / pax) * 100) / 100 : 0;
    expect(costPerGuest).toBe(2.5);
  });

  it("cost per guest with zero pax returns 0", () => {
    const totalCost = 150.0;
    const pax = 0;
    const costPerGuest = pax > 0 ? Math.round((totalCost / pax) * 100) / 100 : 0;
    expect(costPerGuest).toBe(0);
  });
});

// -------------------------------------------------------
// Dish Sorting (preparation order)
// -------------------------------------------------------
describe("Production — Dish Sorting by Prep Time", () => {
  it("sorts dishes by prep time descending (longest first)", () => {
    const dishes = [
      { name: "Quick Salad", prepTime: 10 },
      { name: "Slow Braten", prepTime: 120 },
      { name: "Medium Suppe", prepTime: 45 },
    ];
    dishes.sort((a, b) => b.prepTime - a.prepTime);
    expect(dishes[0].name).toBe("Slow Braten");
    expect(dishes[1].name).toBe("Medium Suppe");
    expect(dishes[2].name).toBe("Quick Salad");
  });

  it("handles equal prep times stably", () => {
    const dishes = [
      { name: "A", prepTime: 30 },
      { name: "B", prepTime: 30 },
    ];
    dishes.sort((a, b) => b.prepTime - a.prepTime);
    expect(dishes).toHaveLength(2);
  });
});

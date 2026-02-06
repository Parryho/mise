import { describe, it, expect } from "vitest";
import { convertUnit, calculateCost, formatQuantity, formatEuro } from "./units";

describe("units", () => {
  describe("convertUnit", () => {
    it("converts g to kg", () => {
      expect(convertUnit(1500, "g", "kg")).toBeCloseTo(1.5);
    });

    it("converts kg to g", () => {
      expect(convertUnit(2.5, "kg", "g")).toBeCloseTo(2500);
    });

    it("converts ml to l", () => {
      expect(convertUnit(750, "ml", "l")).toBeCloseTo(0.75);
    });

    it("returns same value for same unit", () => {
      expect(convertUnit(100, "g", "g")).toBe(100);
    });

    it("returns same value for incompatible units", () => {
      expect(convertUnit(100, "g", "stueck")).toBe(100);
    });
  });

  describe("calculateCost", () => {
    it("calculates cost for same units", () => {
      // 500g at 10 EUR/kg = 5 EUR
      expect(calculateCost(500, "g", 10, "kg")).toBeCloseTo(5);
    });

    it("handles stueck pricing", () => {
      // 3 stueck at 0.50 EUR/stueck = 1.50 EUR
      expect(calculateCost(3, "stueck", 0.5, "stueck")).toBeCloseTo(1.5);
    });

    it("returns 0 for zero quantity", () => {
      expect(calculateCost(0, "g", 10, "kg")).toBe(0);
    });
  });

  describe("formatQuantity", () => {
    it("formats grams", () => {
      expect(formatQuantity(500, "g")).toBe("500 g");
    });

    it("auto-converts large gram values to kg", () => {
      expect(formatQuantity(1500, "g")).toBe("1.50 kg");
    });

    it("auto-converts large ml values to l", () => {
      expect(formatQuantity(2000, "ml")).toBe("2.00 l");
    });
  });

  describe("formatEuro", () => {
    it("formats euro value", () => {
      const formatted = formatEuro(12.5);
      expect(formatted).toContain("12");
      expect(formatted).toContain("50");
    });
  });
});

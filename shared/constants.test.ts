import { describe, it, expect } from "vitest";
import { getISOWeek, getWeekDateRange, DAY_NAMES, MEAL_SLOTS, INGREDIENT_CATEGORIES } from "./constants";

describe("constants", () => {
  it("DAY_NAMES has 7 entries", () => {
    expect(DAY_NAMES).toHaveLength(7);
    expect(DAY_NAMES[0]).toBe("Sonntag");
    expect(DAY_NAMES[1]).toBe("Montag");
  });

  it("MEAL_SLOTS has course slots", () => {
    expect(MEAL_SLOTS).toContain("soup");
    expect(MEAL_SLOTS).toContain("main1");
    expect(MEAL_SLOTS).toContain("dessert");
    expect(MEAL_SLOTS).toHaveLength(8);
  });

  it("INGREDIENT_CATEGORIES has expected keys", () => {
    expect(INGREDIENT_CATEGORIES).toHaveProperty("fleisch");
    expect(INGREDIENT_CATEGORIES).toHaveProperty("fisch");
    expect(INGREDIENT_CATEGORIES).toHaveProperty("sonstiges");
  });

  describe("getISOWeek", () => {
    it("returns correct week for known date", () => {
      // 2026-01-05 is a Monday in week 2
      expect(getISOWeek(new Date(2026, 0, 5))).toBe(2);
    });

    it("returns week 1 for start of year", () => {
      // 2026-01-01 is Thursday, still week 1
      expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
    });
  });

  describe("getWeekDateRange", () => {
    it("returns a 7-day range (from to to)", () => {
      const { from, to } = getWeekDateRange(2026, 1);
      // Should return two valid date strings
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Range should be exactly 6 days apart (Mon-Sun)
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(6);
    });
  });
});

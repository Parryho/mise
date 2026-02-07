/**
 * Comprehensive shared constants tests.
 * Tests getISOWeek, getWeekDateRange, DAY_NAMES, MEAL_SLOTS, getSlotCategory, and more.
 */
import { describe, it, expect } from "vitest";
import {
  getISOWeek,
  getWeekDateRange,
  getSlotCategory,
  DAY_NAMES,
  DAY_NAMES_SHORT,
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  INGREDIENT_CATEGORIES,
  UNITS,
  EVENT_TYPES,
  EVENT_STATUSES,
} from "../../shared/constants";

describe("Constants — DAY_NAMES", () => {
  it("has 7 entries", () => {
    expect(DAY_NAMES).toHaveLength(7);
  });

  it("starts with Sonntag (German convention)", () => {
    expect(DAY_NAMES[0]).toBe("Sonntag");
  });

  it("has Montag as index 1", () => {
    expect(DAY_NAMES[1]).toBe("Montag");
  });

  it("ends with Samstag", () => {
    expect(DAY_NAMES[6]).toBe("Samstag");
  });

  it("all days are in German", () => {
    const germanDays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    expect(DAY_NAMES).toEqual(germanDays);
  });
});

describe("Constants — DAY_NAMES_SHORT", () => {
  it("has 7 entries", () => {
    expect(DAY_NAMES_SHORT).toHaveLength(7);
  });

  it("uses 2-letter abbreviations", () => {
    expect(DAY_NAMES_SHORT[0]).toBe("So");
    expect(DAY_NAMES_SHORT[1]).toBe("Mo");
    expect(DAY_NAMES_SHORT[5]).toBe("Fr");
  });
});

describe("Constants — MEAL_SLOTS", () => {
  it("has exactly 8 course slots", () => {
    expect(MEAL_SLOTS).toHaveLength(8);
  });

  it("contains all expected slots", () => {
    const expected = ["soup", "main1", "side1a", "side1b", "main2", "side2a", "side2b", "dessert"];
    expect([...MEAL_SLOTS]).toEqual(expected);
  });
});

describe("Constants — MEAL_SLOT_LABELS", () => {
  it("has a label for every slot", () => {
    for (const slot of MEAL_SLOTS) {
      expect(MEAL_SLOT_LABELS[slot]).toBeTruthy();
    }
  });

  it("soup label is 'Suppe'", () => {
    expect(MEAL_SLOT_LABELS.soup).toBe("Suppe");
  });

  it("main1 label is 'Fleisch/Fisch'", () => {
    expect(MEAL_SLOT_LABELS.main1).toBe("Fleisch/Fisch");
  });

  it("main2 label is 'Vegetarisch'", () => {
    expect(MEAL_SLOT_LABELS.main2).toBe("Vegetarisch");
  });

  it("dessert label is 'Dessert'", () => {
    expect(MEAL_SLOT_LABELS.dessert).toBe("Dessert");
  });
});

describe("Constants — INGREDIENT_CATEGORIES", () => {
  it("has expected category keys", () => {
    const keys = Object.keys(INGREDIENT_CATEGORIES);
    expect(keys).toContain("fleisch");
    expect(keys).toContain("fisch");
    expect(keys).toContain("gemuese");
    expect(keys).toContain("milchprodukte");
    expect(keys).toContain("trockenwaren");
    expect(keys).toContain("gewuerze");
    expect(keys).toContain("eier_fette");
    expect(keys).toContain("obst");
    expect(keys).toContain("tiefkuehl");
    expect(keys).toContain("sonstiges");
  });

  it("has German labels as values", () => {
    expect(INGREDIENT_CATEGORIES.fleisch).toBe("Fleisch & Wurst");
    expect(INGREDIENT_CATEGORIES.sonstiges).toBe("Sonstiges");
  });
});

describe("Constants — UNITS", () => {
  it("has expected unit keys", () => {
    expect(UNITS).toHaveProperty("g");
    expect(UNITS).toHaveProperty("kg");
    expect(UNITS).toHaveProperty("ml");
    expect(UNITS).toHaveProperty("l");
    expect(UNITS).toHaveProperty("stueck");
  });

  it("has German labels", () => {
    expect(UNITS.g).toBe("Gramm");
    expect(UNITS.kg).toBe("Kilogramm");
    expect(UNITS.stueck).toBe("Stück");
  });
});

describe("Constants — EVENT_TYPES", () => {
  it("has expected event types", () => {
    const ids = EVENT_TYPES.map(e => e.id);
    expect(ids).toContain("brunch");
    expect(ids).toContain("buffet");
    expect(ids).toContain("sonstiges");
  });

  it("each type has id and label", () => {
    for (const eventType of EVENT_TYPES) {
      expect(eventType.id).toBeTruthy();
      expect(eventType.label).toBeTruthy();
    }
  });
});

describe("Constants — EVENT_STATUSES", () => {
  it("has expected statuses", () => {
    const ids = EVENT_STATUSES.map(s => s.id);
    expect(ids).toContain("geplant");
    expect(ids).toContain("bestaetigt");
    expect(ids).toContain("abgesagt");
    expect(ids).toContain("abgeschlossen");
  });

  it("each status has id, label, and color", () => {
    for (const status of EVENT_STATUSES) {
      expect(status.id).toBeTruthy();
      expect(status.label).toBeTruthy();
      expect(status.color).toBeTruthy();
    }
  });
});

describe("Constants — getISOWeek", () => {
  it("returns week 1 for Jan 1, 2026 (Thursday)", () => {
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
  });

  it("returns week 2 for Jan 5, 2026 (Monday)", () => {
    expect(getISOWeek(new Date(2026, 0, 5))).toBe(2);
  });

  it("returns week 1 for Dec 29, 2025 (Monday, first ISO week of 2026)", () => {
    // ISO week 1 of 2026 starts on Dec 29, 2025
    const week = getISOWeek(new Date(2025, 11, 29));
    expect(week).toBe(1);
  });

  it("handles mid-year date correctly", () => {
    // July 1, 2026 is Wednesday
    const week = getISOWeek(new Date(2026, 6, 1));
    expect(week).toBe(27);
  });

  it("handles last day of year", () => {
    const week = getISOWeek(new Date(2026, 11, 31));
    expect(week).toBeGreaterThan(0);
    expect(week).toBeLessThanOrEqual(53);
  });

  it("returns consistent results for same day of different years", () => {
    // January 10 is always in the first few weeks
    const w2025 = getISOWeek(new Date(2025, 0, 10));
    const w2026 = getISOWeek(new Date(2026, 0, 10));
    expect(w2025).toBeGreaterThan(0);
    expect(w2026).toBeGreaterThan(0);
    expect(Math.abs(w2025 - w2026)).toBeLessThanOrEqual(1);
  });
});

describe("Constants — getWeekDateRange", () => {
  it("returns a 7-day range (Mon-Sun)", () => {
    const { from, to } = getWeekDateRange(2026, 1);
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });

  it("from date is a Monday", () => {
    const { from } = getWeekDateRange(2026, 5);
    const fromDate = new Date(from);
    expect(fromDate.getDay()).toBe(1); // Monday
  });

  it("to date is a Sunday", () => {
    const { to } = getWeekDateRange(2026, 5);
    const toDate = new Date(to);
    expect(toDate.getDay()).toBe(0); // Sunday
  });

  it("week 1 of 2026 starts on Dec 29 2025", () => {
    const { from } = getWeekDateRange(2026, 1);
    expect(from).toBe("2025-12-29");
  });

  it("consecutive weeks are exactly 7 days apart", () => {
    const range1 = getWeekDateRange(2026, 10);
    const range2 = getWeekDateRange(2026, 11);
    const from1 = new Date(range1.from);
    const from2 = new Date(range2.from);
    const diffDays = (from2.getTime() - from1.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });

  it("handles week 52", () => {
    const { from, to } = getWeekDateRange(2026, 52);
    expect(from).toBeTruthy();
    expect(to).toBeTruthy();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    expect(toDate.getTime() - fromDate.getTime()).toBe(6 * 24 * 60 * 60 * 1000);
  });
});

describe("Constants — getSlotCategory", () => {
  it("soup returns 'soup'", () => {
    expect(getSlotCategory("soup")).toBe("soup");
  });

  it("main1 returns 'main'", () => {
    expect(getSlotCategory("main1")).toBe("main");
  });

  it("main2 returns 'main'", () => {
    expect(getSlotCategory("main2")).toBe("main");
  });

  it("side1a returns 'side'", () => {
    expect(getSlotCategory("side1a")).toBe("side");
  });

  it("side1b returns 'side'", () => {
    expect(getSlotCategory("side1b")).toBe("side");
  });

  it("side2a returns 'side'", () => {
    expect(getSlotCategory("side2a")).toBe("side");
  });

  it("side2b returns 'side'", () => {
    expect(getSlotCategory("side2b")).toBe("side");
  });

  it("dessert returns 'dessert'", () => {
    expect(getSlotCategory("dessert")).toBe("dessert");
  });

  it("unknown slot returns the slot key itself", () => {
    expect(getSlotCategory("unknown")).toBe("unknown");
  });
});

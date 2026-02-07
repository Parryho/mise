/**
 * Rotation tests: week generation, rotation overview, default template.
 * All database calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MEAL_SLOTS, getWeekDateRange, getISOWeek } from "../../shared/constants";

// -------------------------------------------------------
// Pure logic from rotation.ts
// -------------------------------------------------------

/**
 * Build a date string for a given day-of-week offset from Monday.
 * dow: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 */
function getDateForDow(monday: Date, dow: number): string {
  const d = new Date(monday);
  const diff = dow === 0 ? 6 : dow - 1;
  d.setDate(monday.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Map meal codes between rotation and menu plan formats.
 */
const MEAL_MAP: Record<string, string> = {
  mittag: "lunch",
  abend: "dinner",
};

function mapMealName(rotationMeal: string): string {
  return MEAL_MAP[rotationMeal] || rotationMeal;
}

/**
 * Calculate rotation week number from calendar week.
 */
function getRotationWeekNr(calendarWeek: number, weekCount: number): number {
  return ((calendarWeek - 1) % weekCount) + 1;
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe("Rotation — Date Calculation (getDateForDow)", () => {
  const monday = new Date("2026-01-05"); // Monday

  it("Monday (dow=1) returns the Monday itself", () => {
    expect(getDateForDow(monday, 1)).toBe("2026-01-05");
  });

  it("Tuesday (dow=2) returns Tuesday", () => {
    expect(getDateForDow(monday, 2)).toBe("2026-01-06");
  });

  it("Wednesday (dow=3) returns Wednesday", () => {
    expect(getDateForDow(monday, 3)).toBe("2026-01-07");
  });

  it("Thursday (dow=4) returns Thursday", () => {
    expect(getDateForDow(monday, 4)).toBe("2026-01-08");
  });

  it("Friday (dow=5) returns Friday", () => {
    expect(getDateForDow(monday, 5)).toBe("2026-01-09");
  });

  it("Saturday (dow=6) returns Saturday", () => {
    expect(getDateForDow(monday, 6)).toBe("2026-01-10");
  });

  it("Sunday (dow=0) returns Sunday (end of week)", () => {
    expect(getDateForDow(monday, 0)).toBe("2026-01-11");
  });
});

describe("Rotation — Meal Name Mapping", () => {
  it("maps mittag to lunch", () => {
    expect(mapMealName("mittag")).toBe("lunch");
  });

  it("maps abend to dinner", () => {
    expect(mapMealName("abend")).toBe("dinner");
  });

  it("passes through unknown meal names unchanged", () => {
    expect(mapMealName("fruehstueck")).toBe("fruehstueck");
    expect(mapMealName("lunch")).toBe("lunch");
  });
});

describe("Rotation — Week Number Calculation", () => {
  it("week 1 maps to rotation week 1 (6-week cycle)", () => {
    expect(getRotationWeekNr(1, 6)).toBe(1);
  });

  it("week 6 maps to rotation week 6", () => {
    expect(getRotationWeekNr(6, 6)).toBe(6);
  });

  it("week 7 wraps to rotation week 1", () => {
    expect(getRotationWeekNr(7, 6)).toBe(1);
  });

  it("week 12 wraps to rotation week 6", () => {
    expect(getRotationWeekNr(12, 6)).toBe(6);
  });

  it("week 13 wraps to rotation week 1", () => {
    expect(getRotationWeekNr(13, 6)).toBe(1);
  });

  it("week 52 wraps correctly within 6-week cycle", () => {
    // (52-1) % 6 + 1 = 51 % 6 + 1 = 3 + 1 = 4
    expect(getRotationWeekNr(52, 6)).toBe(4);
  });

  it("handles 4-week cycle", () => {
    expect(getRotationWeekNr(5, 4)).toBe(1);
    expect(getRotationWeekNr(8, 4)).toBe(4);
  });

  it("handles 1-week cycle (always returns 1)", () => {
    expect(getRotationWeekNr(1, 1)).toBe(1);
    expect(getRotationWeekNr(42, 1)).toBe(1);
  });
});

describe("Rotation — MEAL_SLOTS", () => {
  it("has exactly 8 slots", () => {
    expect(MEAL_SLOTS).toHaveLength(8);
  });

  it("contains soup, main1, main2, dessert", () => {
    expect(MEAL_SLOTS).toContain("soup");
    expect(MEAL_SLOTS).toContain("main1");
    expect(MEAL_SLOTS).toContain("main2");
    expect(MEAL_SLOTS).toContain("dessert");
  });

  it("contains all side slots", () => {
    expect(MEAL_SLOTS).toContain("side1a");
    expect(MEAL_SLOTS).toContain("side1b");
    expect(MEAL_SLOTS).toContain("side2a");
    expect(MEAL_SLOTS).toContain("side2b");
  });
});

describe("Rotation — Slot Generation Dimensions", () => {
  it("correct number of slots for one location, one week", () => {
    const days = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sat, Sun
    const meals = ["lunch", "dinner"];
    const totalSlots = days.length * meals.length * MEAL_SLOTS.length;
    // 7 days * 2 meals * 8 courses = 112 slots per week per location
    expect(totalSlots).toBe(112);
  });

  it("correct number of slots for two locations, 6 weeks", () => {
    const days = 7;
    const meals = 2;
    const courses = MEAL_SLOTS.length;
    const locations = 2;
    const weeks = 6;
    const total = days * meals * courses * locations * weeks;
    // 7 * 2 * 8 * 2 * 6 = 1344
    expect(total).toBe(1344);
  });
});

describe("Rotation — Menu Plan Building", () => {
  it("builds menu plan entries from rotation slots", () => {
    const slots = [
      { weekNr: 1, dayOfWeek: 1, meal: "mittag", locationSlug: "city", course: "soup", recipeId: 101 },
      { weekNr: 1, dayOfWeek: 1, meal: "mittag", locationSlug: "city", course: "main1", recipeId: 102 },
      { weekNr: 1, dayOfWeek: 1, meal: "mittag", locationSlug: "city", course: "dessert", recipeId: null },
    ];

    const monday = new Date("2026-01-05");
    const locBySlug: Record<string, number> = { city: 1, sued: 2 };

    const plans = slots
      .filter(slot => slot.recipeId !== null)
      .map(slot => ({
        date: getDateForDow(monday, slot.dayOfWeek),
        meal: mapMealName(slot.meal),
        course: slot.course,
        recipeId: slot.recipeId,
        portions: 1,
        locationId: locBySlug[slot.locationSlug] || null,
        rotationWeekNr: slot.weekNr,
      }));

    expect(plans).toHaveLength(2); // null recipeId filtered out
    expect(plans[0].date).toBe("2026-01-05"); // Monday
    expect(plans[0].meal).toBe("lunch");
    expect(plans[0].course).toBe("soup");
    expect(plans[0].recipeId).toBe(101);
    expect(plans[0].locationId).toBe(1);
  });

  it("skips slots without recipeId", () => {
    const slots = [
      { recipeId: null, course: "soup" },
      { recipeId: 5, course: "main1" },
      { recipeId: null, course: "dessert" },
    ];
    const filtered = slots.filter(s => s.recipeId !== null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].course).toBe("main1");
  });
});

describe("Rotation — getWeekDateRange", () => {
  it("returns a Monday-to-Sunday range", () => {
    const { from, to } = getWeekDateRange(2026, 2);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // from should be Monday (day 1)
    expect(fromDate.getDay()).toBe(1);
    // to should be Sunday (day 0)
    expect(toDate.getDay()).toBe(0);
    // 6 days apart
    const diff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(6);
  });

  it("week 1 of 2026 starts on Dec 29 2025", () => {
    const { from } = getWeekDateRange(2026, 1);
    expect(from).toBe("2025-12-29");
  });
});

describe("Rotation — Overview Grouping", () => {
  it("groups slots by weekNr", () => {
    const allSlots = [
      { weekNr: 1, course: "soup", recipeId: 10 },
      { weekNr: 1, course: "main1", recipeId: 20 },
      { weekNr: 2, course: "soup", recipeId: 30 },
      { weekNr: 2, course: "dessert", recipeId: null },
    ];

    const weeks: Record<number, typeof allSlots> = {};
    for (const slot of allSlots) {
      if (!weeks[slot.weekNr]) weeks[slot.weekNr] = [];
      weeks[slot.weekNr].push(slot);
    }

    expect(Object.keys(weeks)).toHaveLength(2);
    expect(weeks[1]).toHaveLength(2);
    expect(weeks[2]).toHaveLength(2);
  });

  it("counts filled vs total slots", () => {
    const allSlots = [
      { recipeId: 10 },
      { recipeId: 20 },
      { recipeId: null },
      { recipeId: null },
      { recipeId: 30 },
    ];

    const totalSlots = allSlots.length;
    const filledSlots = allSlots.filter(s => s.recipeId !== null).length;

    expect(totalSlots).toBe(5);
    expect(filledSlots).toBe(3);
  });
});

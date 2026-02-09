/**
 * Rotation logic: Generate menu plans from rotation templates.
 * Ported from Menuplaner (Project A) and refactored for Drizzle ORM.
 */

import { storage } from "./storage";
import type { InsertMenuPlan, InsertRotationSlot } from "@shared/schema";
import { MEAL_SLOTS, getWeekDateRange, getISOWeek, formatLocalDate } from "@shared/constants";

/**
 * Generate weekly menu plans from a rotation template.
 * Takes all slots for the given week and creates menu_plan entries
 * for the specified date range.
 */
export async function generateWeekFromRotation(
  templateId: number,
  weekNr: number,
  startDate: string, // YYYY-MM-DD (Monday)
): Promise<{ created: number }> {
  const slots = await storage.getRotationSlotsByWeek(templateId, weekNr);
  if (slots.length === 0) {
    throw new Error(`Keine Rotationsslots für Template ${templateId}, Woche ${weekNr}`);
  }

  // Get location lookup
  const locs = await storage.getLocations();
  const locBySlug: Record<string, number> = {};
  for (const loc of locs) {
    locBySlug[loc.slug] = loc.id;
  }

  // Build date for each day of week
  const monday = new Date(startDate);
  const getDateForDow = (dow: number): string => {
    const d = new Date(monday);
    // dow 0=Sun...6=Sat. Monday=1
    const diff = dow === 0 ? 6 : dow - 1; // offset from Monday
    d.setDate(monday.getDate() + diff);
    return formatLocalDate(d);
  };

  // Map meal names: mittag->lunch, abend->dinner
  const mealMap: Record<string, string> = {
    mittag: 'lunch',
    abend: 'dinner',
  };

  const plans: InsertMenuPlan[] = [];

  for (const slot of slots) {
    if (!slot.recipeId) continue;
    plans.push({
      date: getDateForDow(slot.dayOfWeek),
      meal: mealMap[slot.meal] || slot.meal,
      course: slot.course,
      recipeId: slot.recipeId,
      portions: 1,
      locationId: locBySlug[slot.locationSlug] || null,
      rotationWeekNr: weekNr,
    });
  }

  // Auto-copy City lunch entries to SÜD (SÜD Mittag = City Mittag)
  if (locBySlug["sued"]) {
    const cityLunchPlans = plans.filter(
      p => p.locationId === locBySlug["city"] && p.meal === "lunch"
    );
    for (const plan of cityLunchPlans) {
      plans.push({ ...plan, locationId: locBySlug["sued"] });
    }
  }

  const created = await storage.createMenuPlans(plans);
  return { created: created.length };
}

/**
 * Get all rotation data for a template, organized by week.
 */
export async function getRotationOverview(templateId: number) {
  const template = await storage.getRotationTemplate(templateId);
  if (!template) throw new Error(`Template ${templateId} nicht gefunden`);

  const allSlots = await storage.getRotationSlots(templateId);

  // Group by weekNr
  const weeks: Record<number, typeof allSlots> = {};
  for (const slot of allSlots) {
    if (!weeks[slot.weekNr]) weeks[slot.weekNr] = [];
    weeks[slot.weekNr].push(slot);
  }

  return {
    template,
    weeks,
    totalSlots: allSlots.length,
    filledSlots: allSlots.filter(s => s.recipeId !== null).length,
  };
}

/**
 * Ensure a default rotation template exists with all empty slots.
 * If one already exists (isActive=true), return it.
 * Otherwise create "Standard-Rotation" with weekCount=6 and all slots.
 */
export async function ensureDefaultTemplate() {
  const templates = await storage.getRotationTemplates();
  const active = templates.find(t => t.isActive);
  if (active) {
    // Check if slots exist
    const existingSlots = await storage.getRotationSlots(active.id);
    if (existingSlots.length === 0) {
      // Template exists but no slots — create them for both locations
      await createAllSlots(active.id, active.weekCount);
      return active;
    }
    // Backfill: if only "city" slots exist, add "sued" slots
    const hasSued = existingSlots.some(s => s.locationSlug === "sued");
    if (!hasSued) {
      await createSlotsForLocation(active.id, active.weekCount, "sued");
    }
    return active;
  }

  // Create new default template
  const template = await storage.createRotationTemplate({
    name: "Standard-Rotation",
    weekCount: 6,
    isActive: true,
  });

  await createAllSlots(template.id, 6);
  return template;
}

async function createSlotsForLocation(templateId: number, weekCount: number, locationSlug: string) {
  const days = [1, 2, 3, 4, 5, 6, 0]; // Mo-Sa, So
  const meals = ["lunch", "dinner"];

  const slots: InsertRotationSlot[] = [];
  for (let week = 1; week <= weekCount; week++) {
    for (const dow of days) {
      for (const meal of meals) {
        for (const course of MEAL_SLOTS) {
          slots.push({
            templateId,
            weekNr: week,
            dayOfWeek: dow,
            meal,
            locationSlug,
            course,
            recipeId: null,
          });
        }
      }
    }
  }

  const BATCH = 200;
  for (let i = 0; i < slots.length; i += BATCH) {
    await storage.createRotationSlots(slots.slice(i, i + BATCH));
  }
}

async function createAllSlots(templateId: number, weekCount: number) {
  for (const loc of ["city", "sued"]) {
    await createSlotsForLocation(templateId, weekCount, loc);
  }
}

/**
 * Get menu plans for a calendar week, auto-generating from rotation if empty.
 */
export async function getOrGenerateWeekPlan(year: number, week: number) {
  const { from, to } = getWeekDateRange(year, week);
  let plans = await storage.getMenuPlans(from, to);

  if (plans.length === 0) {
    // Auto-generate from rotation
    const template = await ensureDefaultTemplate();
    const rotationWeekNr = ((week - 1) % template.weekCount) + 1;

    // Check if rotation has any filled slots for this week
    const rotSlots = await storage.getRotationSlotsByWeek(template.id, rotationWeekNr);
    const filledSlots = rotSlots.filter(s => s.recipeId !== null);

    if (filledSlots.length > 0) {
      await generateWeekFromRotation(template.id, rotationWeekNr, from);
      plans = await storage.getMenuPlans(from, to);
    }
  }

  // Compute rotation week number for display
  const template = await ensureDefaultTemplate();
  const rotationWeekNr = ((week - 1) % template.weekCount) + 1;

  return {
    year,
    week,
    from,
    to,
    rotationWeekNr,
    plans,
  };
}

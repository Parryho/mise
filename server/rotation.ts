/**
 * Rotation logic: Generate menu plans from rotation templates.
 * Ported from Menuplaner (Project A) and refactored for Drizzle ORM.
 */

import { storage } from "./storage";
import type { InsertMenuPlan } from "@shared/schema";
import { MEAL_SLOTS } from "@shared/constants";

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
    return d.toISOString().split('T')[0];
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

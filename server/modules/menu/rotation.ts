/**
 * Rotation logic: Generate menu plans from rotation templates.
 * Ported from Menuplaner (Project A) and refactored for Drizzle ORM.
 */

import { storage } from "../../storage";
import type { InsertMenuPlan, InsertRotationSlot } from "@shared/schema";
import { menuPlans, rotationSlots as rotationSlotsTable } from "@shared/schema";
import { MEAL_SLOTS, getWeekDateRange, formatLocalDate } from "@shared/constants";
import { db } from "../../db";
import { and, eq, gte, lte } from "drizzle-orm";

/**
 * Generate weekly menu plans from a rotation template.
 * Takes all slots for the given week and creates menu_plan entries
 * for the specified date range.
 */
export async function generateWeekFromRotation(
  templateId: number,
  weekNr: number,
  startDate: string, // YYYY-MM-DD (Monday)
  txOuter?: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<{ created: number }> {
  const slots = await storage.getRotationSlotsByWeek(templateId, weekNr);
  if (slots.length === 0) {
    throw new Error(`Keine Rotationsslots für Template ${templateId}, Woche ${weekNr}`);
  }

  const locs = await storage.getLocations();
  const locBySlug = Object.fromEntries(locs.map(l => [l.slug, l.id]));

  const monday = new Date(startDate);
  const getDateForDow = (dow: number): string => {
    const d = new Date(monday);
    const diff = dow === 0 ? 6 : dow - 1;
    d.setDate(monday.getDate() + diff);
    return formatLocalDate(d);
  };

  const plans: InsertMenuPlan[] = [];

  for (const slot of slots) {
    if (!slot.recipeId) continue;
    plans.push({
      date: getDateForDow(slot.dayOfWeek),
      meal: slot.meal,
      course: slot.course,
      recipeId: slot.recipeId,
      portions: 1,
      locationId: locBySlug[slot.locationSlug] || null,
      rotationWeekNr: weekNr,
    });
  }

  // Auto-copy City lunch entries to SÜD (SÜD Mittag = City Mittag)
  if (locBySlug["sued"]) {
    const hasSuedLunch = plans.some(
      p => p.locationId === locBySlug["sued"] && p.meal === "lunch"
    );
    if (!hasSuedLunch) {
      const cityLunchPlans = plans.filter(
        p => p.locationId === locBySlug["city"] && p.meal === "lunch"
      );
      for (const plan of cityLunchPlans) {
        plans.push({ ...plan, locationId: locBySlug["sued"] });
      }
    }
  }

  if (plans.length === 0) return { created: 0 };

  // Use outer transaction if provided, otherwise insert directly
  if (txOuter) {
    const created = await txOuter.insert(menuPlans).values(plans).returning();
    return { created: created.length };
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
    const existingSlots = await storage.getRotationSlots(active.id);
    if (existingSlots.length === 0) {
      await createAllSlots(active.id, active.weekCount);
      return active;
    }
    const hasSued = existingSlots.some(s => s.locationSlug === "sued");
    if (!hasSued) {
      await createSlotsForLocation(active.id, active.weekCount, "sued");
    }
    return active;
  }

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
 * Get menu plans for a calendar week.
 * If force=false (default): returns existing plans, generates only if none exist.
 * If force=true: deletes existing plans and regenerates from rotation.
 */
export async function getOrGenerateWeekPlan(year: number, week: number, force = false) {
  const { from, to } = getWeekDateRange(year, week);
  const template = await ensureDefaultTemplate();
  const rotationWeekNr = ((week - 1) % template.weekCount) + 1;

  const existing = await storage.getMenuPlans(from, to);

  // Return existing plans unless force-regenerate is requested or no plans exist
  if (existing.length > 0 && !force) {
    return { year, week, from, to, rotationWeekNr, plans: existing };
  }

  // Delete + regenerate in one transaction
  const plans = await db.transaction(async (tx) => {
    if (existing.length > 0) {
      await tx.delete(menuPlans).where(and(gte(menuPlans.date, from), lte(menuPlans.date, to)));
    }

    const rotSlots = await storage.getRotationSlotsByWeek(template.id, rotationWeekNr);
    const filledSlots = rotSlots.filter(s => s.recipeId !== null);

    if (filledSlots.length > 0) {
      await generateWeekFromRotation(template.id, rotationWeekNr, from, tx);
    }

    return storage.getMenuPlans(from, to);
  });

  return { year, week, from, to, rotationWeekNr, plans };
}

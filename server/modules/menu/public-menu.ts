/**
 * Public menu API: Serves daily menus for guest-facing displays.
 * No authentication required.
 */

import { storage } from "../../storage";
import { db } from "../../db";
import { menuPlans, recipes, locations, recipeTranslations } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { ALLERGENS } from "@shared/allergens";
import { MEAL_SLOT_LABELS, formatLocalDate, type MealSlotName } from "@shared/constants";

interface PublicDish {
  course: string;
  courseLabel: string;
  name: string;
  allergens: Array<{ code: string; name: string }>;
}

interface PublicMeal {
  meal: string;
  mealLabel: string;
  dishes: PublicDish[];
}

interface PublicMenuResponse {
  locationName: string;
  locationSlug: string;
  date: string;
  dateFormatted: string;
  meals: PublicMeal[];
}

export async function getPublicMenu(locationSlug: string, date?: string, lang: string = "de"): Promise<PublicMenuResponse | null> {
  const loc = await storage.getLocationBySlug(locationSlug);
  if (!loc) return null;

  const targetDate = date || formatLocalDate(new Date());

  const plans = await db.select().from(menuPlans)
    .where(and(eq(menuPlans.date, targetDate), eq(menuPlans.locationId, loc.id)));

  if (plans.length === 0) {
    return {
      locationName: loc.name,
      locationSlug: loc.slug,
      date: targetDate,
      dateFormatted: formatDateDE(targetDate),
      meals: [],
    };
  }

  // Load recipe details
  const recipeIds = plans.filter(p => p.recipeId).map(p => p.recipeId!);
  const recipeMap: Record<number, { name: string; allergens: string[] }> = {};

  // Build translation map if needed
  const translationMap = new Map<number, string>();
  if (lang !== "de" && recipeIds.length > 0) {
    const translations = await db.select()
      .from(recipeTranslations)
      .where(and(eq(recipeTranslations.lang, lang)));
    for (const t of translations) translationMap.set(t.recipeId, t.name);
  }

  for (const id of recipeIds) {
    const recipe = await storage.getRecipe(id);
    if (recipe) {
      const ings = await storage.getIngredients(id);
      const allAllergens = new Set<string>(recipe.allergens || []);
      for (const ing of ings) {
        for (const a of (ing.allergens || [])) allAllergens.add(a);
      }
      const name = translationMap.get(id) || recipe.name;
      recipeMap[id] = { name, allergens: Array.from(allAllergens).sort() };
    }
  }

  // Group by meal
  const mealGroups: Record<string, typeof plans> = {};
  for (const plan of plans) {
    if (!mealGroups[plan.meal]) mealGroups[plan.meal] = [];
    mealGroups[plan.meal].push(plan);
  }

  const MEAL_LABELS: Record<string, string> = {
    mittag: 'Mittagessen',
    abend: 'Abendessen',
    fruehstueck: 'Frühstück',
  };

  const COURSE_ORDER: Record<string, number> = {
    soup: 0, main1: 1, side1a: 2, side1b: 3, main2: 4, side2a: 5, side2b: 6, dessert: 7,
  };

  const meals: PublicMeal[] = Object.entries(mealGroups).map(([meal, group]) => {
    const dishes = group
      .filter(p => p.recipeId && recipeMap[p.recipeId])
      .map(p => {
        const recipe = recipeMap[p.recipeId!];
        return {
          course: p.course,
          courseLabel: MEAL_SLOT_LABELS[p.course as MealSlotName] || p.course,
          name: recipe.name,
          allergens: recipe.allergens.map(code => ({
            code,
            name: ALLERGENS[code]?.nameDE || code,
          })),
        };
      })
      .sort((a, b) => (COURSE_ORDER[a.course] ?? 99) - (COURSE_ORDER[b.course] ?? 99));

    return {
      meal,
      mealLabel: MEAL_LABELS[meal] || meal,
      dishes,
    };
  }).sort((a, b) => {
    const order = ['fruehstueck', 'mittag', 'abend'];
    return (order.indexOf(a.meal) ?? 99) - (order.indexOf(b.meal) ?? 99);
  });

  return {
    locationName: loc.name,
    locationSlug: loc.slug,
    date: targetDate,
    dateFormatted: formatDateDE(targetDate),
    meals,
  };
}

function formatDateDE(dateStr: string): string {
  const d = new Date(dateStr);
  const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

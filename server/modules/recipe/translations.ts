/**
 * Recipe & Ingredient translation overlay.
 * Fetches translations from DB and overlays them on recipe/ingredient objects.
 */

import { db } from "../../db";
import { recipeTranslations, ingredientTranslations } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { Recipe, Ingredient } from "@shared/schema";
import type { Request } from "express";

const SUPPORTED_LANGS = ["en", "tr", "uk"] as const;
type TranslatableLang = (typeof SUPPORTED_LANGS)[number];

/** Extract language from request: ?lang= query param or Accept-Language header */
export function getLangFromRequest(req: Request): string {
  const queryLang = req.query.lang;
  if (typeof queryLang === "string" && ["de", ...SUPPORTED_LANGS].includes(queryLang)) {
    return queryLang;
  }
  const acceptLang = req.headers["accept-language"]?.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (acceptLang && ["de", ...SUPPORTED_LANGS].includes(acceptLang)) {
    return acceptLang;
  }
  return "de";
}

/** Overlay translations on a list of recipes. Returns new array (does not mutate). */
export async function translateRecipes<T extends Pick<Recipe, "id" | "name" | "steps" | "prepInstructions">>(
  recipes: T[],
  lang: string,
): Promise<T[]> {
  if (lang === "de" || recipes.length === 0) return recipes;
  if (!SUPPORTED_LANGS.includes(lang as TranslatableLang)) return recipes;

  const ids = recipes.map(r => r.id);
  const translations = await db
    .select()
    .from(recipeTranslations)
    .where(and(eq(recipeTranslations.lang, lang), inArray(recipeTranslations.recipeId, ids)));

  if (translations.length === 0) return recipes;

  const map = new Map(translations.map(t => [t.recipeId, t]));
  return recipes.map(r => {
    const t = map.get(r.id);
    if (!t) return r;
    return {
      ...r,
      name: t.name,
      steps: t.steps.length > 0 ? t.steps : r.steps,
      prepInstructions: t.prepInstructions ?? r.prepInstructions,
    };
  });
}

/** Overlay translations on a list of ingredients. Returns new array (does not mutate). */
export async function translateIngredients<T extends Pick<Ingredient, "id" | "name">>(
  ingredients: T[],
  lang: string,
): Promise<T[]> {
  if (lang === "de" || ingredients.length === 0) return ingredients;
  if (!SUPPORTED_LANGS.includes(lang as TranslatableLang)) return ingredients;

  const ids = ingredients.map(i => i.id);
  const translations = await db
    .select()
    .from(ingredientTranslations)
    .where(and(eq(ingredientTranslations.lang, lang), inArray(ingredientTranslations.ingredientId, ids)));

  if (translations.length === 0) return ingredients;

  const map = new Map(translations.map(t => [t.ingredientId, t]));
  return ingredients.map(i => {
    const t = map.get(i.id);
    if (!t) return i;
    return { ...i, name: t.name };
  });
}

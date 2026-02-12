# Rezept-Übersetzung — Fortschritt

## Status
- **Gestartet**: 2026-02-12
- **Methode**: Google Translate (gratis, `@vitalets/google-translate-api`)
- **Umfang**: 420 Rezepte + 3.938 Zutaten × 3 Sprachen (EN/TR/UK)

## Schema
- [x] `recipe_translations` Tabelle (recipe_id, lang, name, steps, prep_instructions)
- [x] `ingredient_translations` Tabelle (ingredient_id, lang, name)
- [x] Unique Constraints + Indizes

## Übersetzung
- [x] EN — 420 Rezepte + 3.938 Zutaten (Google Translate)
- [x] TR — 420 Rezepte + 3.938 Zutaten (Google Translate + Haiku Korrekturen)
- [x] UK — 420 Rezepte + 3.938 Zutaten (Google Translate + Haiku Korrekturen)
- [x] Österreichische Spezialitäten per Haiku korrigiert (15 Rezepte, 43 Fixes)

## Script
```bash
# Fortschritt prüfen:
npx tsx script/translate-recipes.ts --dry-run

# Einzelne Sprache nachlaufen lassen:
npx tsx script/translate-recipes.ts --lang en
npx tsx script/translate-recipes.ts --lang tr
npx tsx script/translate-recipes.ts --lang uk
```

Script ist **resumable** — überspringt bereits übersetzte Einträge.

## Offene Tasks
- [x] API: Rezepte/Zutaten nach `Accept-Language` / User-Sprache ausliefern
- [x] Client: `apiFetch` sendet automatisch `Accept-Language` Header
- [x] Public Menu (Speisekarte + Digital Signage): `?lang=` Query-Param
- [x] Deployed auf mise.at
- [ ] MASTERPLAN.md updaten

## Dateien
- Schema: `shared/schema.ts` (recipeTranslations, ingredientTranslations)
- Script: `script/translate-recipes.ts`
- API: TODO — `server/modules/recipe/` erweitern
- Client: TODO — Hooks + Komponenten anpassen

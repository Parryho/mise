# Allergen Management System — mise.at

Comprehensive documentation for allergen handling in the mise.at kitchen workflow app.

---

## Overview

mise.at implements a complete allergen management system compliant with **EU Regulation 1169/2011** (Austrian implementation), covering:

1. **14 EU allergen codes** (A-R, Austrian standard)
2. **Ingredient-level detection** (100+ Austrian culinary patterns)
3. **Recipe-level aggregation** (automatic rollup)
4. **AI-powered detection** (Claude-based allergen recognition)
5. **Guest allergen profiles** (dietary restrictions)
6. **Daily allergen matrix** (menu-wide overview)
7. **Audit & validation** (compliance checking)

---

## Allergen Codes (A-R System)

### 14 Official Codes

| Code | Name (EN) | Name (DE) | Examples |
|------|-----------|-----------|----------|
| **A** | Gluten | Glutenhaltiges Getreide | Mehl, Brot, Nudeln, Knödel |
| **B** | Crustaceans | Krebstiere | Garnele, Hummer, Krabbe |
| **C** | Eggs | Eier | Ei, Eigelb, Eiklar |
| **D** | Fish | Fisch | Lachs, Karpfen, Sardelle |
| **E** | Peanuts | Erdnüsse | Erdnuss, Erdnussbutter |
| **F** | Soy | Soja | Tofu, Sojasoße, Tempeh |
| **G** | Milk/Lactose | Milch/Laktose | Milch, Butter, Käse, Sahne |
| **H** | Nuts | Schalenfrüchte | Mandel, Walnuss, Haselnuss |
| **L** | Celery | Sellerie | Sellerie, Knollensellerie |
| **M** | Mustard | Senf | Senf, Dijon |
| **N** | Sesame | Sesam | Sesam, Tahini |
| **O** | Sulphites | Sulfite/Schwefeldioxid | Wein, Essig, Rosinen |
| **P** | Lupins | Lupinen | Lupine |
| **R** | Molluscs | Weichtiere | Muschel, Tintenfisch |

**Note**: Codes I, J, K, Q are not used (AT-standard follows EU 14 allergen rule).

### Storage Format

**Database**: PostgreSQL text array
```sql
allergens text[] DEFAULT '{}'
-- Example: {A,C,G}
```

**TypeScript**: String array
```typescript
allergens: string[] = ['A', 'C', 'G']
```

**Display**: Comma-separated
```
A,C,G
```

---

## Architecture

### Data Flow

```
Ingredients (with allergens)
    ↓
Recipe Aggregation (allergens array)
    ↓
Menu Plan Slots (inherited from recipes)
    ↓
Allergen Matrix (daily overview)
    ↓
Guest Profile Check (conflict detection)
```

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| **Shared** | `shared/allergens.ts` | Allergen definitions, parser, formatter |
| **Server** | `server/modules/recipe/allergen-detection.ts` | AI-powered allergen detection |
| **Server** | `server/modules/recipe/allergen-matrix.ts` | Daily menu allergen matrix |
| **DB Schema** | `shared/schema.ts` | `recipes.allergens`, `ingredients.allergens`, `guest_allergen_profiles` |
| **UI** | `client/src/components/AllergenBadge.tsx` | Visual allergen display |
| **UI** | `client/src/components/AllergenAutoDetect.tsx` | AI detection UI |
| **UI** | `client/src/components/AllergenConflictBanner.tsx` | Guest conflict warnings |
| **UI** | `client/src/pages/AllergenOverview.tsx` | Daily allergen matrix page |
| **UI** | `client/src/pages/GuestProfiles.tsx` | Guest dietary restrictions |
| **Audit** | `script/audit-allergens.mjs` | Compliance audit script |

---

## Detection Methods

### 1. Manual Entry

Recipes can have allergens manually set:

```typescript
// In recipe form
<AllergenMultiSelect
  value={allergens}
  onChange={setAllergens}
/>
```

### 2. AI Detection (Claude)

Automatic allergen detection from recipe text:

```typescript
// server/modules/recipe/allergen-detection.ts
import Anthropic from '@anthropic-ai/sdk';

export async function detectAllergens(recipeText: string): Promise<string[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Analyze this recipe and identify ALL allergens according to EU Regulation 1169/2011 (Austrian codes A-R)...`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  // Parse response, return allergen codes
  return parseAllergenCodes(response.content);
}
```

**UI**: `AllergenAutoDetect.tsx` component with "AI Detect" button.

### 3. Ingredient-Based Detection (Audit System)

Pattern-based detection from ingredient names (100+ patterns):

```javascript
// script/audit-allergens.mjs
const ALLERGEN_PATTERNS = {
  A: [/\bmehl\b/i, /\bweizen\b/i, /\bsemmel/i, /\bbr[öo]sel\b/i, ...],
  C: [/\bei(?!erschwammerl)\b/i, /\beier\b/i, ...],
  D: [/\bfisch\b/i, /\blachs\b/i, /\bkarpfen/i, ...],
  G: [/\bmilch\b/i, /\bbutter\b/i, /\bk[äa]se\b/i, ...],
  // ... 14 allergens total
};
```

**False positive protection**:
- Eierschwammerl → NOT eggs (mushrooms)
- Erdäpfel → NOT peanuts (potatoes)
- Kokosmilch → NOT dairy
- Muskatnuss → NOT tree nuts

### 4. Ingredient-Level Allergens

Master ingredients can have pre-set allergens:

```typescript
// In master_ingredients table
{
  name: "Semmel (altbacken)",
  allergens: ["A"], // Gluten
}
```

When used in a recipe, allergen propagates automatically.

---

## Guest Allergen Profiles

### Database Schema

```sql
CREATE TABLE guest_allergen_profiles (
  id SERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  allergens TEXT[] NOT NULL,
  severity TEXT, -- 'mild', 'severe', 'anaphylaxis'
  notes TEXT,
  location TEXT, -- 'city', 'sued', 'ak'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Conflict Detection

When generating menu plans, the system checks for allergen conflicts:

```typescript
// Check if recipe conflicts with any guest profiles
function hasAllergenConflict(recipe: Recipe, location: string): boolean {
  const guestProfiles = getGuestProfilesForLocation(location);

  for (const profile of guestProfiles) {
    const overlap = recipe.allergens.filter(a => profile.allergens.includes(a));
    if (overlap.length > 0) {
      return true; // Conflict found
    }
  }

  return false;
}
```

**UI**: `AllergenConflictBanner.tsx` shows warnings on menu plan.

---

## Daily Allergen Matrix

### Purpose

Provides daily overview of all allergens present in the menu, grouped by meal slot.

### Example Output

```
Date: 2026-02-12, Location: City

Lunch:
  Soup: Frittatensuppe — A,C,G
  Main 1: Schnitzel — A,C,G
  Side 1a: Erdäpfel — (none)
  Side 1b: Salat — M,O
  Main 2: Gemüselasagne — A,G
  Side 2a: (empty)
  Side 2b: (empty)
  Dessert: Apfelstrudel — A,G

Allergens present: A, C, G, M, O
Guest conflicts: 2 guests (Anna: C, G; Franz: A)
```

### API

```typescript
// GET /api/allergen-matrix/:location/:date
interface AllergenMatrixResponse {
  date: string;
  location: string;
  meals: {
    [meal: string]: {
      [slot: string]: {
        recipe: string;
        allergens: string[];
      };
    };
  };
  all_allergens: string[];
  guest_conflicts: {
    guest_name: string;
    allergens: string[];
  }[];
}
```

**UI**: `client/src/pages/AllergenOverview.tsx`

---

## Audit System

### Purpose

Validate recipe allergens against actual ingredients for compliance.

### Workflow

1. **Export Data**
   ```bash
   psql mise -c "COPY (...) TO STDOUT" > tmp-recipes-export.csv
   psql mise -c "COPY (...) TO STDOUT" > tmp-ingredients-export.csv
   ```

2. **Run Audit**
   ```bash
   node script/audit-allergens.mjs
   ```

   Output: `tmp-allergen-audit.json` + console summary

3. **Review Issues**
   - CRITICAL: Missing allergens (safety risk)
   - WARNING: Extra allergens (false positive)

4. **Apply Fixes**
   ```bash
   psql mise < script/fix-allergen-issues.sql
   ```

5. **Validate**
   ```bash
   node script/validate-allergen-fixes.mjs
   ```

### Current Status (2026-02-12)

- **Total Recipes**: 447
- **Correct**: 406 (90.8%)
- **Missing Allergens**: 13 recipes
- **False Positives**: 1 recipe

**Most accurate allergens**: C, E, F, G, L, M, N, O, R (100%)
**Needs improvement**: A (95.5%), D (84.2%)

---

## UI Components

### AllergenBadge

Visual display of allergen codes with tooltips.

```tsx
import { AllergenBadge } from '@/components/AllergenBadge';

<AllergenBadge code="A" /> // Shows: A (Glutenhaltiges Getreide)
<AllergenBadge code="G" variant="subtle" /> // Muted background
```

**Props**:
- `code: string` — Allergen code (A-R)
- `variant?: 'default' | 'subtle'` — Visual style

### AllergenAutoDetect

AI-powered allergen detection button.

```tsx
import { AllergenAutoDetect } from '@/components/AllergenAutoDetect';

<AllergenAutoDetect
  recipeText={recipe.steps.join('\n')}
  onDetect={(allergens) => setRecipe({ ...recipe, allergens })}
/>
```

**Props**:
- `recipeText: string` — Full recipe text
- `onDetect: (allergens: string[]) => void` — Callback with detected codes

### AllergenConflictBanner

Warning banner for guest allergen conflicts.

```tsx
import { AllergenConflictBanner } from '@/components/AllergenConflictBanner';

<AllergenConflictBanner
  recipe={recipe}
  location="city"
/>
```

Shows: "⚠️ Allergen conflict: 2 guests (Anna: C,G; Franz: A)"

---

## API Endpoints

### Recipe Allergen Detection

```
POST /api/recipes/detect-allergens
Body: { recipeText: string }
Response: { allergens: string[] }
```

### Allergen Matrix

```
GET /api/allergen-matrix/:location/:date
Response: { date, location, meals, all_allergens, guest_conflicts }
```

### Guest Profiles

```
GET /api/guest-profiles/:location
POST /api/guest-profiles
PUT /api/guest-profiles/:id
DELETE /api/guest-profiles/:id
```

---

## Best Practices

### For Recipe Authors

1. **Always fill allergens field** — even if empty `[]`
2. **Use AI detection first** — click "AI Detect" button
3. **Review AI output** — verify accuracy
4. **Check ingredients** — ensure ingredient-level allergens set
5. **Test with audit** — run `audit-allergens.mjs` before production

### For Kitchen Staff

1. **Check allergen matrix daily** — review `AllergenOverview.tsx`
2. **Verify guest profiles** — update dietary restrictions
3. **Watch for conflicts** — banner shows warnings
4. **Print allergen labels** — for buffet cards

### For Developers

1. **Run audit quarterly** — `audit-allergens.mjs`
2. **Fix critical issues immediately** — missing allergens are safety risks
3. **Update patterns** — add new ingredients to `ALLERGEN_PATTERNS`
4. **Test edge cases** — Eierschwammerl, Erdäpfel, Kokosmilch, Muskatnuss

---

## Compliance

### Legal Requirements (Austria)

**EU Regulation 1169/2011**:
- All 14 allergens must be declared
- Allergen info must be available **before** purchase/consumption
- Cross-contamination warnings recommended

**Austrian Implementation**:
- A-R code system (14 allergens, no I/J/K/Q)
- Mandatory for restaurants, hotels, catering
- Fines for non-compliance: up to €10,000

### mise.at Compliance Status

- ✅ 14 allergen support (A-R)
- ✅ Recipe-level tracking
- ✅ Ingredient-level tracking
- ✅ Guest allergen profiles
- ✅ Daily allergen matrix
- ✅ Audit & validation system
- ✅ Public menu display (`/speisekarte/:location/:date`)
- ✅ Buffet cards with allergen codes

**Audit Result**: 90.8% compliant (406/447 recipes correct)
**Target**: 100% compliant after applying fixes

---

## Future Enhancements

### Planned

- [ ] Auto-sync ingredient allergens to recipes (DB trigger)
- [ ] Allergen conflict resolution suggestions (alternative recipes)
- [ ] Multi-language allergen names (EN/DE/IT)
- [ ] QR code allergen detail pages
- [ ] Cross-contamination tracking (shared equipment)

### Under Consideration

- [ ] Allergen severity levels (trace/present/primary ingredient)
- [ ] Guest allergen history (preferences over time)
- [ ] Allergen trend analytics (most common)
- [ ] Integration with POS systems (allergen warnings on orders)

---

## Troubleshooting

### Allergens not showing in recipe

1. Check `recipes.allergens` field in DB
2. Verify `allergen_status` is `verified` or `auto`
3. Re-run AI detection
4. Check ingredient-level allergens

### False positives (Eierschwammerl detected as eggs)

1. Add to `FALSE_POSITIVES` in `audit-allergens.mjs`
2. Update pattern regex to exclude: `/\bei(?!erschwammerl)\b/i`
3. Re-run audit

### Guest conflict not showing

1. Check guest profile location matches menu location
2. Verify allergen codes match (case-sensitive)
3. Check `AllergenConflictBanner` component is rendered

### Audit script errors

1. Ensure CSV exports are fresh (`psql ... > tmp-*.csv`)
2. Check CSV format (commas in quotes handled)
3. Verify JSON output is valid

---

## Support

**Questions?** Check:
- `shared/allergens.ts` — code definitions
- `server/modules/recipe/allergen-detection.ts` — AI detection
- `script/ALLERGEN_AUDIT_README.md` — audit system docs

**Found a bug?** Create issue with:
- Recipe ID + name
- Expected vs actual allergens
- Ingredient list

---

*Last updated: 2026-02-12*

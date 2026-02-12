-- Allergen Fixes for mise.at Database
-- Generated from allergen audit 2026-02-12
--
-- CRITICAL FIXES: 13 recipes with missing allergens
-- Run this SQL against the mise database

-- ============================================================================
-- MISSING GLUTEN (A) — 9 recipes
-- ============================================================================

-- ID 2: Leberknödelsuppe (stored: {C} → should be: {A,C})
UPDATE recipes
SET allergens = '{A,C}'
WHERE id = 2;

-- ID 34: Faschierter Braten (stored: {C,M} → should be: {A,C,M})
UPDATE recipes
SET allergens = '{A,C,M}'
WHERE id = 34;

-- ID 39: Fleischlaberl (stored: {C,M} → should be: {A,C,M})
UPDATE recipes
SET allergens = '{A,C,M}'
WHERE id = 39;

-- ID 68: Semmelknödel (stored: {C,G} → should be: {A,C,G})
UPDATE recipes
SET allergens = '{A,C,G}'
WHERE id = 68;

-- ID 101: Powidltascherl (stored: {} → should be: {A})
UPDATE recipes
SET allergens = '{A}'
WHERE id = 101;

-- ID 220: Sauerbraten (stored: {C} → should be: {A,C})
UPDATE recipes
SET allergens = '{A,C}'
WHERE id = 220;

-- ID 221: Kalbsbraten (stored: {C} → should be: {A,C})
UPDATE recipes
SET allergens = '{A,C}'
WHERE id = 221;

-- ID 228: Putenbraten (stored: {C} → should be: {A,C})
UPDATE recipes
SET allergens = '{A,C}'
WHERE id = 228;

-- ID 409: Semmelkren (stored: {G} → should be: {A,G})
UPDATE recipes
SET allergens = '{A,G}'
WHERE id = 409;

-- ============================================================================
-- MISSING FISH (D) — 3 recipes
-- ============================================================================

-- ID 215: Gebackener Karpfen (stored: {A,C,G} → should be: {A,C,D,G})
UPDATE recipes
SET allergens = '{A,C,D,G}'
WHERE id = 215;

-- ID 261: Karpfen blau (stored: {A,G,L,O} → should be: {A,D,G,L,O})
UPDATE recipes
SET allergens = '{A,D,G,L,O}'
WHERE id = 261;

-- ID 269: Penne al Forno (stored: {G} → should be: {D,G})
-- ALSO needs category fix: MainVegan → MainFish (contains Sardellen!)
UPDATE recipes
SET allergens = '{D,G}',
    category = 'MainFish'
WHERE id = 269;

-- ============================================================================
-- MISSING NUTS (H) — 1 recipe
-- ============================================================================

-- ID 230: Ganslbraten (stored: {A,G,O} → should be: {A,G,H,O})
UPDATE recipes
SET allergens = '{A,G,H,O}'
WHERE id = 230;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all fixed recipes
SELECT id, name, category, allergens
FROM recipes
WHERE id IN (2, 34, 39, 68, 101, 220, 221, 228, 409, 215, 261, 269, 230)
ORDER BY id;

-- Count recipes by allergen
SELECT
  'A' as allergen, COUNT(*) as count FROM recipes WHERE allergens @> '{A}'
UNION ALL
SELECT 'C', COUNT(*) FROM recipes WHERE allergens @> '{C}'
UNION ALL
SELECT 'D', COUNT(*) FROM recipes WHERE allergens @> '{D}'
UNION ALL
SELECT 'G', COUNT(*) FROM recipes WHERE allergens @> '{G}'
UNION ALL
SELECT 'H', COUNT(*) FROM recipes WHERE allergens @> '{H}'
ORDER BY allergen;

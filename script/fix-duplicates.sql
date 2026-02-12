-- =============================================================================
-- fix-duplicates.sql — Remove duplicate recipes from mise.at production DB
-- Generated: 2026-02-12
-- =============================================================================
--
-- ANALYSIS SUMMARY:
-- Found 8 true duplicate pairs out of ~34 near-duplicate candidates.
-- Many "near-duplicates" are actually distinct dishes (different preparations,
-- meat vs vegetarian variants, different categories, etc.) and are kept.
--
-- DECISIONS:
-- 1. Gefüllte Paprika:       KEEP 428 (4 allergens, 7 steps, 16 ingredients) | DELETE 311
-- 2. Beuschel/Beuscherl:     KEEP 30  (4 allergens, 3 steps, 14 ingredients) | DELETE 245
-- 3. Bratgemüse:              KEEP 87  (2 steps, 22 ingredients)              | DELETE 381
-- 4. Karottengemüse:          KEEP 88  (2 steps, base version)               | DELETE 371
-- 5. Kohlsprossen/Rosenkohl:  KEEP 89  (original, same data as 363)          | DELETE 363
-- 6. Eierspeis/Eierspeise:    KEEP 316 (has allergens, descriptive name)     | DELETE 128
-- 7. Ratatouille:             KEEP 306 (MainVegan, 10 ingredients)           | DELETE 399
-- 8. Kartoffelgratin:         KEEP 324 (Sides, 10 ingredients, stärke tag)   | DELETE 288
--
-- NOT DUPLICATES (kept both):
-- - Wiener Schnitzel (21) vs (Kalb 212) vs (Schwein 213) — distinct meats
-- - Putenschnitzel (44) vs paniert (214) — different preparation
-- - Krautfleckerl (265) vs mit Speck (35) — vegan vs meat
-- - Lasagne (45) vs vegetarisch (270) — meat vs vegetarian
-- - Flammkuchen (64) vs vegetarisch (284) — meat vs vegetarian
-- - Palatschinken (94, dessert) vs gefüllt (317, main) — different dish
-- - Erdäpfelsalat (81, kein-rotation) vs warm (325, stärke) — distinct
-- - Kaspressknödelsuppe (20) vs Kaspressknödel (285) — soup vs main
-- - Semmelknödel (68) vs als Scheiben gebraten (353) — different preparation
-- - Topfenknödel (53, sweet) vs pikant als Beilage (339) — sweet vs savory
-- - Serviettenknödel (74) vs mit Schwammerlsauce (286) — side vs main
-- - Wiener Melange (146) vs Mousse (115) — different desserts
-- - Erbsensuppe (15) vs Erbsencremesuppe (172) — clear vs cream
-- - Brokkolicremesuppe (167) vs Brokkoli (384) — soup vs side
-- - Erbsen (389) vs Erbsen-Karotten-Gemüse (390) — different dishes
-- - Kartoffelpüree mit Kräutern (327) vs mit Muskatnuss (328) — different flavors
-- - Penne (344) vs Penne al Forno (269) — plain side vs baked main
-- - Sauerkraut (76) vs Rahmsauerkraut (362) — different preparations
-- - Petersilienwurzel-Suppe (208) vs -Gemüse (379) — soup vs side
-- - Kohlsprossen geröstet (364) — distinct roasted preparation (kept)
-- =============================================================================

BEGIN;

-- =============================================
-- STEP 1: Update references (rotation_slots & menu_plans)
-- Remap deleted IDs → kept IDs
-- =============================================

-- 1. Gefüllte Paprika: 311 → 428
UPDATE rotation_slots SET recipe_id = 428 WHERE recipe_id = 311;
UPDATE menu_plans SET recipe_id = 428 WHERE recipe_id = 311;

-- 2. Beuscherl: 245 → 30 (Beuschel)
UPDATE rotation_slots SET recipe_id = 30 WHERE recipe_id = 245;
UPDATE menu_plans SET recipe_id = 30 WHERE recipe_id = 245;

-- 3. Bratgemüse (Mischung): 381 → 87 (Bratgemüse)
UPDATE rotation_slots SET recipe_id = 87 WHERE recipe_id = 381;
UPDATE menu_plans SET recipe_id = 87 WHERE recipe_id = 381;

-- 4. Karottengemüse glasiert: 371 → 88 (Karottengemüse)
UPDATE rotation_slots SET recipe_id = 88 WHERE recipe_id = 371;
UPDATE menu_plans SET recipe_id = 88 WHERE recipe_id = 371;

-- 5. Kohlsprossen / Rosenkohl: 363 → 89 (Kohlsprossen)
UPDATE rotation_slots SET recipe_id = 89 WHERE recipe_id = 363;
UPDATE menu_plans SET recipe_id = 89 WHERE recipe_id = 363;

-- 6. Eierspeis: 128 → 316 (Eierspeise / Bauernomelett)
UPDATE rotation_slots SET recipe_id = 316 WHERE recipe_id = 128;
UPDATE menu_plans SET recipe_id = 316 WHERE recipe_id = 128;

-- 7. Ratatouille (als Beilage): 399 → 306 (Ratatouille)
UPDATE rotation_slots SET recipe_id = 306 WHERE recipe_id = 399;
UPDATE menu_plans SET recipe_id = 306 WHERE recipe_id = 399;

-- 8. Kartoffelgratin: 288 → 324 (Kartoffelgratin als Beilage)
UPDATE rotation_slots SET recipe_id = 324 WHERE recipe_id = 288;
UPDATE menu_plans SET recipe_id = 324 WHERE recipe_id = 288;

-- =============================================
-- STEP 2: Delete ingredient_translations for ingredients of deleted recipes
-- =============================================

DELETE FROM ingredient_translations
WHERE ingredient_id IN (
  SELECT i.id FROM ingredients i WHERE i.recipe_id IN (311, 245, 381, 371, 363, 128, 399, 288)
);

-- =============================================
-- STEP 3: Delete recipe_translations for deleted recipes
-- =============================================

DELETE FROM recipe_translations
WHERE recipe_id IN (311, 245, 381, 371, 363, 128, 399, 288);

-- =============================================
-- STEP 4: Delete ingredients for deleted recipes
-- =============================================

DELETE FROM ingredients
WHERE recipe_id IN (311, 245, 381, 371, 363, 128, 399, 288);

-- =============================================
-- STEP 5: Delete recipe_media for deleted recipes (none exist, but safe)
-- =============================================

DELETE FROM recipe_media
WHERE recipe_id IN (311, 245, 381, 371, 363, 128, 399, 288);

-- =============================================
-- STEP 6: Delete sub_recipe_links for deleted recipes (none exist, but safe)
-- =============================================

DELETE FROM sub_recipe_links
WHERE parent_recipe_id IN (311, 245, 381, 371, 363, 128, 399, 288)
   OR child_recipe_id IN (311, 245, 381, 371, 363, 128, 399, 288);

-- =============================================
-- STEP 7: Delete the duplicate recipes themselves
-- =============================================

DELETE FROM recipes
WHERE id IN (311, 245, 381, 371, 363, 128, 399, 288);

-- =============================================
-- VERIFICATION: Count remaining recipes and check no orphans
-- =============================================

-- This should show 0 rows (no orphaned references)
SELECT 'orphaned_rotation_slots' as check_type, COUNT(*) as cnt
FROM rotation_slots rs
LEFT JOIN recipes r ON rs.recipe_id = r.id
WHERE r.id IS NULL AND rs.recipe_id IS NOT NULL

UNION ALL

SELECT 'orphaned_menu_plans' as check_type, COUNT(*) as cnt
FROM menu_plans mp
LEFT JOIN recipes r ON mp.recipe_id = r.id
WHERE r.id IS NULL AND mp.recipe_id IS NOT NULL;

COMMIT;

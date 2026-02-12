-- Fix miscategorized recipes
-- Generated: 2026-02-12
-- Total fixes: 11 recipes

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- Sweet desserts incorrectly in MainVegan → HotDesserts
-- These are classic Austrian sweet dishes, not vegetarian mains
-- ═══════════════════════════════════════════════════════════════

-- Topfenknödel: sweet quark dumplings (like Germknödel) = dessert
UPDATE recipes SET category = 'HotDesserts' WHERE id = 53 AND name = 'Topfenknödel';

-- Marillenknödel: apricot dumplings = dessert
UPDATE recipes SET category = 'HotDesserts' WHERE id = 54 AND name = 'Marillenknödel';

-- Zwetschgenknödel: plum dumplings = dessert
UPDATE recipes SET category = 'HotDesserts' WHERE id = 55 AND name = 'Zwetschgenknödel';

-- Mohnnudeln: sweet poppy seed noodles = dessert
UPDATE recipes SET category = 'HotDesserts' WHERE id = 56 AND name = 'Mohnnudeln';

-- ═══════════════════════════════════════════════════════════════
-- Soup in MainMeat → ClearSoups
-- ═══════════════════════════════════════════════════════════════

-- Altwiener Suppentopf: clear beef broth with vegetables and noodles
UPDATE recipes SET category = 'ClearSoups' WHERE id = 33 AND name = 'Altwiener Suppentopf';

-- ═══════════════════════════════════════════════════════════════
-- Broth-based soups incorrectly in CreamSoups → ClearSoups
-- CreamSoups = puréed/bound/thick; ClearSoups = broth-based
-- ═══════════════════════════════════════════════════════════════

-- Kalbsknochensuppe: veal bone broth = clear soup
UPDATE recipes SET category = 'ClearSoups' WHERE id = 187 AND name = 'Kalbsknochensuppe';

-- Gulaschsuppe: broth-based goulash soup with paprika, not cream
UPDATE recipes SET category = 'ClearSoups' WHERE id = 192 AND name = 'Gulaschsuppe';

-- Französische Zwiebelsuppe: clear broth with caramelized onions + Gruyère
UPDATE recipes SET category = 'ClearSoups' WHERE id = 198 AND name = 'Französische Zwiebelsuppe';

-- Rote-Rüben-Suppe (Borschtsch): clear beetroot broth, not cream
UPDATE recipes SET category = 'ClearSoups' WHERE id = 210 AND name = 'Rote-Rüben-Suppe (Borschtsch)';

-- ═══════════════════════════════════════════════════════════════
-- Pasta dish incorrectly in MainFish → MainVegan
-- ═══════════════════════════════════════════════════════════════

-- Penne al Forno: baked pasta with cheese, not a fish dish
UPDATE recipes SET category = 'MainVegan' WHERE id = 269 AND name = 'Penne al Forno';

-- ═══════════════════════════════════════════════════════════════
-- Sauce in wrong temperature category
-- ═══════════════════════════════════════════════════════════════

-- Vanillesauce: traditionally served warm (warme Vanillesauce)
UPDATE recipes SET category = 'HotSauces' WHERE id = 414 AND name = 'Vanillesauce';

COMMIT;

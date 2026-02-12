-- ============================================================
-- Translation fixes for mise.at production database
-- Generated: 2026-02-12
-- Total: 166 fixes from translation audit
-- Categories: Austrian dialect terms, copy-paste names, wrong translations
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: HIGH PRIORITY - Austrian terms left untranslated
-- ============================================================

-- Ingredient 1340: Meerrettich (Krenn) - remove German "(Krenn)" from translations
UPDATE ingredient_translations SET name = 'Horseradish' WHERE ingredient_id = 1340 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Yaban turpu' WHERE ingredient_id = 1340 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Хрін' WHERE ingredient_id = 1340 AND lang = 'uk';

-- Ingredient 733: Powidl (Zwetschgenmus) - remove German "Powidl" from translations
UPDATE ingredient_translations SET name = 'Plum jam (plum butter)' WHERE ingredient_id = 733 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Erik reçeli' WHERE ingredient_id = 733 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Сливовий джем' WHERE ingredient_id = 733 AND lang = 'uk';

-- Ingredient 1081: Powidltascherl - still German in all translations
UPDATE ingredient_translations SET name = 'Plum jam pockets' WHERE ingredient_id = 1081 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Erik reçeli böreği' WHERE ingredient_id = 1081 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Пиріжки зі сливовим джемом' WHERE ingredient_id = 1081 AND lang = 'uk';

-- Recipe 408: Apfelkren (tr) - "Kren" left untranslated
UPDATE recipe_translations SET name = 'Elma yaban turpu sosu' WHERE recipe_id = 408 AND lang = 'tr';

-- Recipe 409: Semmelkren (tr) - "Kren" left untranslated
UPDATE recipe_translations SET name = 'Ekmek yaban turpu sosu' WHERE recipe_id = 409 AND lang = 'tr';

-- Recipe 101: Powidltascherl (tr) - "Powidl" left untranslated
UPDATE recipe_translations SET name = 'Erik reçeli böreği' WHERE recipe_id = 101 AND lang = 'tr';

-- ============================================================
-- SECTION 2: MEDIUM PRIORITY - Schlagobers/Obers → correct translations
-- Turkish "Çırpılmış Krem" or "Krem şanti" → "Çırpılmış krema" (whipped cream)
-- ============================================================

-- Ingredient Schlagobers fixes (Turkish) - various incorrect translations
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 43 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 36 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 28 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Organik çırpılmış krema' WHERE ingredient_id = 892 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 20 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 60 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 256 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 1215 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 569 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 519 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 51 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 85 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 92 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 69 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 77 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema (çırpılmış)' WHERE ingredient_id = 2265 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2291 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2520 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2562 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 266 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2766 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2793 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2884 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 491 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 2992 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 3065 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 527 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 3629 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 654 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 3708 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 3795 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 769 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 765 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 786 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Çırpılmış krema' WHERE ingredient_id = 1644 AND lang = 'tr';

-- Ingredient 1457: Sahne (Obers) (tr) - wrong translation
UPDATE ingredient_translations SET name = 'Krema' WHERE ingredient_id = 1457 AND lang = 'tr';

-- Ingredient 2579: Crème fraîche (oder Schlagobers) (tr)
UPDATE ingredient_translations SET name = 'Crème fraîche (veya çırpılmış krema)' WHERE ingredient_id = 2579 AND lang = 'tr';

-- ============================================================
-- SECTION 3: Kalbsschnitzel ingredient 1183 - false positive
-- The German is "Kalbsschnitzel (Kalbsoberschale)" which is veal topside, NOT cream
-- The current translations are actually correct, but flagged because "Obers" substring matched
-- We keep the translations but clean up slightly
-- ============================================================
-- Ingredient 1183: These are actually correct (Kalbsoberschale = veal topside, not Obers/cream)
-- The audit falsely flagged them. Skipping en (correct), tr, uk.
-- No changes needed for ingredient 1183.

-- ============================================================
-- SECTION 4: Topfen → proper translations
-- ============================================================

-- Ingredient 693: Topfen 20%
UPDATE ingredient_translations SET name = 'Quark 20%' WHERE ingredient_id = 693 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Lor peyniri %20' WHERE ingredient_id = 693 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Сир кисломолочний 20%' WHERE ingredient_id = 693 AND lang = 'uk';

-- Ingredient 996: Topfenstrudel (ingredient reference)
UPDATE ingredient_translations SET name = 'Quark strudel' WHERE ingredient_id = 996 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Штрудель з кисломолочним сиром' WHERE ingredient_id = 996 AND lang = 'uk';

-- Ingredient 983: Bio Topfen
UPDATE ingredient_translations SET name = 'Organic quark' WHERE ingredient_id = 983 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Organik lor peyniri' WHERE ingredient_id = 983 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Органічний кисломолочний сир' WHERE ingredient_id = 983 AND lang = 'uk';

-- Ingredient 1554: Quark (Topfen) (uk) - improve translation
UPDATE ingredient_translations SET name = 'Кварк (кисломолочний сир)' WHERE ingredient_id = 1554 AND lang = 'uk';

-- Ingredient 1104: Bio PEISETOPFENZUBER. 20% (= Bio Speisetopfenzubereitung 20%)
UPDATE ingredient_translations SET name = 'Organic quark preparation 20%' WHERE ingredient_id = 1104 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Organik lor peyniri hazırlaması %20' WHERE ingredient_id = 1104 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Органічний кисломолочний сир 20%' WHERE ingredient_id = 1104 AND lang = 'uk';

-- Ingredient 2267: Topfen (à 250 g)
UPDATE ingredient_translations SET name = 'Quark (250 g each)' WHERE ingredient_id = 2267 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Lor peyniri (her biri 250 g)' WHERE ingredient_id = 2267 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Кисломолочний сир (по 250 г)' WHERE ingredient_id = 2267 AND lang = 'uk';

-- Ingredient 2966: Topfen (plain)
UPDATE ingredient_translations SET name = 'Quark' WHERE ingredient_id = 2966 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Lor peyniri' WHERE ingredient_id = 2966 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Кисломолочний сир' WHERE ingredient_id = 2966 AND lang = 'uk';

-- Ingredient 485: Topfen (plain)
UPDATE ingredient_translations SET name = 'Quark' WHERE ingredient_id = 485 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Lor peyniri' WHERE ingredient_id = 485 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Кисломолочний сир' WHERE ingredient_id = 485 AND lang = 'uk';

-- Ingredient 1087: Bio SPEISETOPFENZUBER. 20% (same product, different spelling)
UPDATE ingredient_translations SET name = 'Organic quark preparation 20%' WHERE ingredient_id = 1087 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Organik lor peyniri hazırlaması %20' WHERE ingredient_id = 1087 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Органічний кисломолочний сир 20%' WHERE ingredient_id = 1087 AND lang = 'uk';

-- ============================================================
-- SECTION 5: Fisolen → Green beans
-- ============================================================

-- Ingredient 934: Bio Fisolen/Brechbohnen
UPDATE ingredient_translations SET name = 'Organik taze fasulye/yeşil fasulye' WHERE ingredient_id = 934 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Органічна зелена квасоля' WHERE ingredient_id = 934 AND lang = 'uk';

-- ============================================================
-- SECTION 6: Schwammerl/Eierschwammerl → Chanterelles (specific mushroom type)
-- Note: Eierschwammerl ARE chanterelles specifically, not just generic mushrooms
-- The translations say "chanterelles" which is technically correct
-- But the audit wants more generic terms. We'll improve context.
-- ============================================================

-- Ingredient 2953: Pfifferlinge (kleine, (Eierschwammerl)) - chanterelles is correct here
UPDATE ingredient_translations SET name = 'Chanterelles (small)' WHERE ingredient_id = 2953 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Kantarel mantarı (küçük)' WHERE ingredient_id = 2953 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Лисички (маленькі)' WHERE ingredient_id = 2953 AND lang = 'uk';

-- Ingredient 3856: Eierschwammerln (Pfifferlinge) - chanterelles
UPDATE ingredient_translations SET name = 'Chanterelles (golden)' WHERE ingredient_id = 3856 AND lang = 'en';
UPDATE ingredient_translations SET name = 'Kantarel mantarı' WHERE ingredient_id = 3856 AND lang = 'tr';
UPDATE ingredient_translations SET name = 'Лисички' WHERE ingredient_id = 3856 AND lang = 'uk';

-- ============================================================
-- SECTION 7: Kren ingredient (tr)
-- ============================================================

-- Ingredient 4053: ((frisch) = Kren) - completely wrong Turkish translation
UPDATE ingredient_translations SET name = 'Taze yaban turpu' WHERE ingredient_id = 4053 AND lang = 'tr';

-- ============================================================
-- SECTION 8: Marillen (Apricot)
-- ============================================================

-- Ingredient 3925: Schnaps (Marillenbrand) - completely wrong Turkish translation
UPDATE ingredient_translations SET name = 'Kayısı likörü' WHERE ingredient_id = 3925 AND lang = 'tr';

-- ============================================================
-- SECTION 9: Recipe name translations - Austrian dishes that need proper translations
-- (entries with empty suggestion = copy-paste names that need real translations)
-- ============================================================

-- Recipe 134: Liptauer - Austrian cheese spread
UPDATE recipe_translations SET name = 'Liptauer cheese spread' WHERE recipe_id = 134 AND lang = 'en';
UPDATE recipe_translations SET name = 'Liptauer peynir ezmesi' WHERE recipe_id = 134 AND lang = 'tr';

-- Recipe 130: Verhackerts - Austrian lard spread
UPDATE recipe_translations SET name = 'Crackling spread (Verhackerts)' WHERE recipe_id = 130 AND lang = 'en';

-- Recipe 97: Buchteln - Austrian sweet yeast buns
UPDATE recipe_translations SET name = 'Sweet yeast buns (Buchteln)' WHERE recipe_id = 97 AND lang = 'en';
UPDATE recipe_translations SET name = 'Tatlı maya çöreği' WHERE recipe_id = 97 AND lang = 'tr';

-- Recipe 245: Beuscherl - Austrian offal ragout (lung & heart)
UPDATE recipe_translations SET name = 'Viennese offal ragout (Beuscherl)' WHERE recipe_id = 245 AND lang = 'en';
UPDATE recipe_translations SET name = 'Viyana sakatat yahnisi' WHERE recipe_id = 245 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Віденське рагу з субпродуктів' WHERE recipe_id = 245 AND lang = 'uk';

-- Recipe 136: Bosna - Austrian spiced bratwurst in a bun
UPDATE recipe_translations SET name = 'Bosna (spiced bratwurst in a bun)' WHERE recipe_id = 136 AND lang = 'en';
UPDATE recipe_translations SET name = 'Bosna (baharatlı sosis sandviç)' WHERE recipe_id = 136 AND lang = 'tr';

-- Recipe 164: Bündnerfleisch - Swiss air-dried beef
UPDATE recipe_translations SET name = 'Air-dried beef (Bündnerfleisch)' WHERE recipe_id = 164 AND lang = 'en';
UPDATE recipe_translations SET name = 'Kurutulmuş sığır eti' WHERE recipe_id = 164 AND lang = 'tr';

-- Recipe 241: Cevapcici - Balkan grilled minced meat
UPDATE recipe_translations SET name = 'Cevapcici (grilled minced meat rolls)' WHERE recipe_id = 241 AND lang = 'en';
UPDATE recipe_translations SET name = 'Çevapçiçi (ızgara köfte)' WHERE recipe_id = 241 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Чевапчичі (м''ясні ковбаски на грилі)' WHERE recipe_id = 241 AND lang = 'uk';

-- Recipe 138: Frankfurter - Vienna sausages
UPDATE recipe_translations SET name = 'Frankfurter sausages' WHERE recipe_id = 138 AND lang = 'en';
UPDATE recipe_translations SET name = 'Frankfurt sosisi' WHERE recipe_id = 138 AND lang = 'tr';

-- Recipe 137: Käsekrainer - Austrian cheese-filled sausage
UPDATE recipe_translations SET name = 'Cheese-filled sausage (Käsekrainer)' WHERE recipe_id = 137 AND lang = 'en';
UPDATE recipe_translations SET name = 'Peynirli sosis' WHERE recipe_id = 137 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Ковбаса з сиром' WHERE recipe_id = 137 AND lang = 'uk';

-- Recipe 238: Ragout fin - French-style creamy ragout
UPDATE recipe_translations SET name = 'Ragout fin (creamy veal ragout)' WHERE recipe_id = 238 AND lang = 'en';

-- Recipe 220: Sauerbraten - German marinated pot roast
UPDATE recipe_translations SET name = 'Sauerbraten (marinated pot roast)' WHERE recipe_id = 220 AND lang = 'en';
UPDATE recipe_translations SET name = 'Sauerbraten (marine edilmiş rosto)' WHERE recipe_id = 220 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Зауербратен (мариноване жарке)' WHERE recipe_id = 220 AND lang = 'uk';

-- Recipe 217: Surschnitzel - Austrian cured pork schnitzel
UPDATE recipe_translations SET name = 'Cured pork schnitzel (Surschnitzel)' WHERE recipe_id = 217 AND lang = 'en';

-- Recipe 50: Kasnocken - Austrian cheese spaetzle
UPDATE recipe_translations SET name = 'Cheese spaetzle (Kasnocken)' WHERE recipe_id = 50 AND lang = 'en';
UPDATE recipe_translations SET name = 'Peynirli spatzel' WHERE recipe_id = 50 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Сирні шпецле (Каснокен)' WHERE recipe_id = 50 AND lang = 'uk';

-- Recipe 265: Krautfleckerl - Austrian cabbage pasta
UPDATE recipe_translations SET name = 'Cabbage pasta (Krautfleckerl)' WHERE recipe_id = 265 AND lang = 'en';
UPDATE recipe_translations SET name = 'Lahanalı makarna' WHERE recipe_id = 265 AND lang = 'tr';

-- Recipe 141: Langosch - Hungarian fried dough
UPDATE recipe_translations SET name = 'Fried dough (Langos)' WHERE recipe_id = 141 AND lang = 'en';

-- Recipe 60: Reiberdatschi - Bavarian potato pancakes
UPDATE recipe_translations SET name = 'Potato pancakes (Reiberdatschi)' WHERE recipe_id = 60 AND lang = 'en';
UPDATE recipe_translations SET name = 'Patates mücveri' WHERE recipe_id = 60 AND lang = 'tr';

-- Recipe 342: Nockerl - Austrian small dumplings
UPDATE recipe_translations SET name = 'Small dumplings (Nockerl)' WHERE recipe_id = 342 AND lang = 'en';
UPDATE recipe_translations SET name = 'Küçük köfte' WHERE recipe_id = 342 AND lang = 'tr';

-- Recipe 379: Petersilienwurzel-Gemüse (uk) - left in German
UPDATE recipe_translations SET name = 'Овочі з петрушкового кореня' WHERE recipe_id = 379 AND lang = 'uk';

-- Recipe 76: Sauerkraut (en) - already correct, just capitalize
UPDATE recipe_translations SET name = 'Sauerkraut' WHERE recipe_id = 76 AND lang = 'en';

-- Recipe 354: Schupfnudeln - German/Austrian finger-shaped potato dumplings
UPDATE recipe_translations SET name = 'Potato finger dumplings (Schupfnudeln)' WHERE recipe_id = 354 AND lang = 'en';
UPDATE recipe_translations SET name = 'Patates köftesi' WHERE recipe_id = 354 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Картопляні ньокі (Шупфнудельн)' WHERE recipe_id = 354 AND lang = 'uk';

-- ============================================================
-- SECTION 10: Recipe name translations - Austrian terms in names
-- ============================================================

-- Recipe 425: Schlagobers (tr) - whipped cream
UPDATE recipe_translations SET name = 'Çırpılmış krema' WHERE recipe_id = 425 AND lang = 'tr';

-- Recipe 426: Topfencreme - quark cream
UPDATE recipe_translations SET name = 'Quark cream' WHERE recipe_id = 426 AND lang = 'en';
UPDATE recipe_translations SET name = 'Lor peyniri kreması' WHERE recipe_id = 426 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Крем з кисломолочного сиру' WHERE recipe_id = 426 AND lang = 'uk';

-- Recipe 142: Topfengolatsche - quark pastry
UPDATE recipe_translations SET name = 'Lor peynirli poğaça' WHERE recipe_id = 142 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Випічка з кисломолочним сиром' WHERE recipe_id = 142 AND lang = 'uk';

-- Recipe 211: Fisolen-Suppe - green bean soup
UPDATE recipe_translations SET name = 'Green bean soup' WHERE recipe_id = 211 AND lang = 'en';
UPDATE recipe_translations SET name = 'Taze fasulye çorbası' WHERE recipe_id = 211 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Суп із зеленої квасолі' WHERE recipe_id = 211 AND lang = 'uk';

-- Recipe 10: Karfiolcremesuppe (uk) - cauliflower cream soup
UPDATE recipe_translations SET name = 'Крем-суп із цвітної капусти' WHERE recipe_id = 10 AND lang = 'uk';

-- Recipe 7: Schwammerlsuppe (uk) - mushroom soup
UPDATE recipe_translations SET name = 'Грибний крем-суп' WHERE recipe_id = 7 AND lang = 'uk';

-- Recipe 94: Palatschinken (uk) - crepes
UPDATE recipe_translations SET name = 'Млинці' WHERE recipe_id = 94 AND lang = 'uk';

-- Recipe 101: Powidltascherl (uk) - plum jam pockets
UPDATE recipe_translations SET name = 'Пиріжки зі сливовим джемом' WHERE recipe_id = 101 AND lang = 'uk';

-- Recipe 95: Topfenstrudel - quark strudel
UPDATE recipe_translations SET name = 'Lor peynirli strudel' WHERE recipe_id = 95 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Штрудель з кисломолочним сиром' WHERE recipe_id = 95 AND lang = 'uk';

-- Recipe 49: Eierschwammerl mit Knödel - chanterelles with dumplings
UPDATE recipe_translations SET name = 'Chanterelles with bread dumplings' WHERE recipe_id = 49 AND lang = 'en';
UPDATE recipe_translations SET name = 'Kantarel mantarı ve ekmek köftesi' WHERE recipe_id = 49 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Лисички з хлібними кнедликами' WHERE recipe_id = 49 AND lang = 'uk';

-- Recipe 317: Palatschinken gefüllt (uk) - filled crepes
UPDATE recipe_translations SET name = 'Млинці з начинкою' WHERE recipe_id = 317 AND lang = 'uk';

-- Recipe 61: Polenta mit Schwammerl (uk) - polenta with mushrooms
UPDATE recipe_translations SET name = 'Полента з лисичками' WHERE recipe_id = 61 AND lang = 'uk';

-- Recipe 286: Serviettenknödel mit Schwammerlsauce (uk)
UPDATE recipe_translations SET name = 'Хлібний кнедлик з грибним соусом' WHERE recipe_id = 286 AND lang = 'uk';

-- Recipe 53: Topfenknödel - quark dumplings
UPDATE recipe_translations SET name = 'Quark dumplings' WHERE recipe_id = 53 AND lang = 'en';
UPDATE recipe_translations SET name = 'Lor peynirli köfte' WHERE recipe_id = 53 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Кнедлики з кисломолочним сиром' WHERE recipe_id = 53 AND lang = 'uk';

-- Recipe 124: Fisolensalat - green bean salad
UPDATE recipe_translations SET name = 'Green bean salad' WHERE recipe_id = 124 AND lang = 'en';
UPDATE recipe_translations SET name = 'Taze fasulye salatası' WHERE recipe_id = 124 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Салат із зеленої квасолі' WHERE recipe_id = 124 AND lang = 'uk';

-- Recipe 403: Eierschwammerl - chanterelles
UPDATE recipe_translations SET name = 'Chanterelles' WHERE recipe_id = 403 AND lang = 'en';
UPDATE recipe_translations SET name = 'Kantarel mantarı' WHERE recipe_id = 403 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Лисички' WHERE recipe_id = 403 AND lang = 'uk';

-- Recipe 333: Erdäpfelpuffer / Reibekuchen (uk) - potato pancakes
UPDATE recipe_translations SET name = 'Деруни / картопляні оладки' WHERE recipe_id = 333 AND lang = 'uk';

-- Recipe 386: Fisolen / Grüne Bohnen (tr) - green beans
UPDATE recipe_translations SET name = 'Taze fasulye / Yeşil fasulye' WHERE recipe_id = 386 AND lang = 'tr';

-- Recipe 387: Fisolen mit Speck - green beans with bacon
UPDATE recipe_translations SET name = 'Green beans with bacon' WHERE recipe_id = 387 AND lang = 'en';
UPDATE recipe_translations SET name = 'Pastırmalı taze fasulye' WHERE recipe_id = 387 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Зелена квасоля з беконом' WHERE recipe_id = 387 AND lang = 'uk';

-- Recipe 321: Rösterdäpfel - roasted potatoes (NOT roasted apples!)
UPDATE recipe_translations SET name = 'Roasted potatoes' WHERE recipe_id = 321 AND lang = 'en';
UPDATE recipe_translations SET name = 'Kavrulmuş patates' WHERE recipe_id = 321 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Смажена картопля' WHERE recipe_id = 321 AND lang = 'uk';

-- Recipe 339: Topfenknödel (pikant, als Beilage) - savory quark dumplings
UPDATE recipe_translations SET name = 'Baharatlı lor peynirli köfte (garnitür)' WHERE recipe_id = 339 AND lang = 'tr';
UPDATE recipe_translations SET name = 'Кнедлики з кисломолочним сиром (гострі, гарнір)' WHERE recipe_id = 339 AND lang = 'uk';

COMMIT;

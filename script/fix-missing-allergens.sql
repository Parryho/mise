-- ============================================================
-- Allergen detection for 46 recipes with missing allergens
-- Generated: 2026-02-12
-- Method: Ingredient-based detection against EU 1169/2011 codes
-- Status: allergen_status = 'auto' (machine-detected, not manually verified)
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: Recipes with DETECTED allergens
-- ============================================================

-- id:27 Stelze — Bier dunkel → A (Gluten/Gerste)
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 27;

-- id:57 Krautstrudel — Strudelteig → A (Gluten)
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 57;

-- id:72 Kroketten — Backkroketten (Fertigprodukt, enthält typ. Mehl + Milch) → A, G
UPDATE recipes SET allergens = ARRAY['A','G'], allergen_status = 'auto' WHERE id = 72;

-- id:78 Speckkraut — Bio Rinderbrühe (enthält typ. Sellerie) → L
UPDATE recipes SET allergens = ARRAY['L'], allergen_status = 'auto' WHERE id = 78;

-- id:126 Bauernfrühstück — Eier (garbled as "(er)") → C
UPDATE recipes SET allergens = ARRAY['C'], allergen_status = 'auto' WHERE id = 126;

-- id:128 Eierspeis — Eier (Eierspeis = Rührei) → C
UPDATE recipes SET allergens = ARRAY['C'], allergen_status = 'auto' WHERE id = 128;

-- id:162 Bruschetta — Brot/Weißbrot als Basis → A
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 162;

-- id:224 Spanferkel — Gemüsefond (enthält typ. Sellerie) → L
UPDATE recipes SET allergens = ARRAY['L'], allergen_status = 'auto' WHERE id = 224;

-- id:229 Entenkeule — Entenfond (enthält typ. Sellerie) → L
UPDATE recipes SET allergens = ARRAY['L'], allergen_status = 'auto' WHERE id = 229;

-- id:242 Grillhendl — Aperol (enthält Sulfite) → O
UPDATE recipes SET allergens = ARRAY['O'], allergen_status = 'auto' WHERE id = 242;

-- id:267 Pasta Arrabiata — Penne → A (Gluten)
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 267;

-- id:274 Spaghetti Aglio e Olio — Spaghetti → A (Gluten)
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 274;

-- id:278 Spinatstrudel — Strudelteig → A (Gluten)
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 278;

-- id:324 Kartoffelgratin — Gratin erfordert Sahne/Käse → G (Milch)
UPDATE recipes SET allergens = ARRAY['G'], allergen_status = 'auto' WHERE id = 324;

-- id:344 Penne — Penne → A (Gluten)
UPDATE recipes SET allergens = ARRAY['A'], allergen_status = 'auto' WHERE id = 344;

-- id:348 Risotto — Gemüsebrühe (enthält typ. Sellerie) → L
UPDATE recipes SET allergens = ARRAY['L'], allergen_status = 'auto' WHERE id = 348;

-- id:352 Ebly/Weizen — Ebly = Weizen → A; Gemüsebrühe → L
UPDATE recipes SET allergens = ARRAY['A','L'], allergen_status = 'auto' WHERE id = 352;

-- id:373 Wurzelgemüse — Wurzelmischung enthält typ. Sellerie → L
UPDATE recipes SET allergens = ARRAY['L'], allergen_status = 'auto' WHERE id = 373;

-- id:398 Ofengemüse — Wurzelmischung enthält typ. Sellerie → L
UPDATE recipes SET allergens = ARRAY['L'], allergen_status = 'auto' WHERE id = 398;

-- id:417 Marillenröster — Marillenbrand/Schnaps → O (Sulfite)
UPDATE recipes SET allergens = ARRAY['O'], allergen_status = 'auto' WHERE id = 417;

-- ============================================================
-- SECTION 2: Recipes with NO detectable allergens
-- (allergen_status = 'auto' confirms they were checked)
-- ============================================================

-- id:31 Blunzengröstl — Kartoffeln, Blutwurst, Zwiebel, Schmalz
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 31;

-- id:40 Geselchtes mit Sauerkraut — Geselchtes, Sauerkraut, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 40;

-- id:41 Kümmelbraten — Schweinebauch, Öl, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 41;

-- id:42 Lammstelze — Lamm, Tomaten, Kräuter
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 42;

-- id:66 Pommes Frites — Kartoffeln, Öl, Salz
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 66;

-- id:75 Bratkartoffeln — Kartoffeln, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 75;

-- id:76 Sauerkraut — Sauerkraut, Zwiebel, Schweineschmalz
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 76;

-- id:84 Rote Rüben Salat — Rote Bete, Meerrettich, Zucker
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 84;

-- id:130 Verhackerts — Speck, Kasseler, Schweineschmalz
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 130;

-- id:217 Surschnitzel — Schweinefleisch, Gewürze (nicht paniert)
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 217;

-- id:226 Lammkarree — Lamm, Kräutermarinade
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 226;

-- id:241 Cevapcici — Faschiertes, Zwiebel, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 241;

-- id:249 Krainer Würstel — Rind, Schwein, Speck, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 249;

-- id:306 Ratatouille — Gemüse, Olivenöl, Kräuter
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 306;

-- id:307 Chili sin Carne — Bohnen, Mais, Tomaten, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 307;

-- id:309 Gemüsepfanne — Kartoffeln, Gemüse, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 309;

-- id:321 Rösterdäpfel — Kartoffeln, Majoran
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 321;

-- id:330 Kartoffel-Kroketten selbstgemacht — Kartoffeln, Gewürze, Öl (Ofen-Variante)
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 330;

-- id:399 Ratatouille (als Beilage) — Paprika, Gemüse
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 399;

-- id:407 Preiselbeeren (Kompott) — Früchte, Zucker, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 407;

-- id:416 Kompott (gemischt) — Früchte, Zucker, Gewürze
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 416;

-- id:432 Tomatensauce — Tomaten, Zwiebel, Knoblauch, Öl
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 432;

-- id:433 Apfelkompott — Äpfel, Zucker, Zimt
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 433;

-- id:434 Birnenkompott — Birnen, Zucker, Gewürznelke
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 434;

-- id:435 Apfelmus — Äpfel, Zucker, Zimt
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 435;

-- id:436 Basilikum (frisch) — Basilikum
UPDATE recipes SET allergens = '{}', allergen_status = 'auto' WHERE id = 436;

COMMIT;

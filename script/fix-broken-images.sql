-- Fix recipes with wrong/mismatched images
-- Identified: 5 recipes where the image URL doesn't match the recipe content
-- Generated: 2026-02-12

BEGIN;

-- id=34: Faschierter Braten had Schweinsbraten image
-- Replace with actual Faschierter Braten image from gutekueche.at
UPDATE recipes SET image = 'https://www.gutekueche.at/storage/media/recipe/113083/conv/faschierter-braten-default.jpg' WHERE id = 34;

-- id=146: Wiener Melange had Kaiserschmarrn image (source_url points to Kaiserschmarrn recipe)
-- Recipe data is inconsistent (name vs source); set to NULL for category fallback
UPDATE recipes SET image = NULL WHERE id = 146;

-- id=147: Einspänner had Kaiserschmarrn image
-- Replace with Gerollte Einspänner image from chefkoch (matches source_url)
UPDATE recipes SET image = 'https://img.chefkoch-cdn.de/rezepte/1846421299068572/bilder/333609/crop-960x540/gerollte-einspaenner.jpg' WHERE id = 147;

-- id=185: Steirische Wurzelsuppe had Wurzelgemüsepfanne image (pan-fried, not soup)
-- Replace with Petersilienwurzelsuppe from chefkoch (actual root vegetable soup)
UPDATE recipes SET image = 'https://img.chefkoch-cdn.de/rezepte/3575031536825685/bilder/1576200/fit-960x720/annes-weihnachtsmenue-vorspeise-petersilienwurzelsuppe.jpg' WHERE id = 185;

-- id=419: Mohnbutter had Mohnnudeln image (different dish)
-- Replace with Schupfnudeln mit Mohnbutter from chefkoch (shows actual Mohnbutter dish, matches source_url)
UPDATE recipes SET image = 'https://img.chefkoch-cdn.de/rezepte/1337791238612403/bilder/168563/crop-960x540/schupfnudeln-mit-apfelsosse-und-mohnbutter.jpg' WHERE id = 419;

COMMIT;

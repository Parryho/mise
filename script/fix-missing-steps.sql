-- Fix missing preparation steps for 8 recipes
-- Generated: 2026-02-12
-- Recipes: 429-436 (all had empty steps '{}')

BEGIN;

-- 429: Sauerrahmdip (ColdSauces)
-- Zutaten: Sauerrahm, Schnittlauch, Salz, Pfeffer
UPDATE recipes SET steps = ARRAY[
  'Schnittlauch waschen, trocken schütteln und in feine Röllchen schneiden.',
  'Sauerrahm in eine Schüssel geben und glatt rühren.',
  'Schnittlauchröllchen unterheben.',
  'Mit Salz und Pfeffer abschmecken.',
  'Mindestens 30 Minuten im Kühlschrank durchziehen lassen, damit sich die Aromen entfalten.',
  'Vor dem Servieren nochmals abschmecken und bei Bedarf nachwürzen.'
] WHERE id = 429;

-- 430: Joghurtdip (ColdSauces)
-- Zutaten: Naturjoghurt, Knoblauch, Salz, Pfeffer, Dille, Zitronensaft
UPDATE recipes SET steps = ARRAY[
  'Knoblauch schälen und fein pressen oder reiben.',
  'Frische Dille waschen, trocken tupfen und fein hacken.',
  'Naturjoghurt in eine Schüssel geben und glatt rühren.',
  'Gepressten Knoblauch und gehackte Dille untermischen.',
  'Zitronensaft einrühren.',
  'Mit Salz und Pfeffer kräftig abschmecken.',
  'Zugedeckt mindestens 1 Stunde im Kühlschrank ziehen lassen.',
  'Vor dem Servieren nochmals umrühren und abschmecken.'
] WHERE id = 430;

-- 431: Parmesan (gerieben) (Sides)
-- Zutaten: Parmesan
UPDATE recipes SET steps = ARRAY[
  'Parmesan aus dem Kühlschrank nehmen und die Rinde großzügig entfernen.',
  'Den Parmesan auf der feinen Seite einer Kastenreibe frisch reiben.',
  'In eine kleine Schale füllen und sofort zum Gericht servieren.'
] WHERE id = 431;

-- 432: Tomatensauce (Sides)
-- Zutaten: Passierte Tomaten, Zwiebel, Knoblauch, Olivenöl, Salz, Basilikum, Oregano, Zucker
UPDATE recipes SET steps = ARRAY[
  'Zwiebel schälen und fein würfeln. Knoblauch schälen und fein hacken.',
  'Olivenöl in einem Topf bei mittlerer Hitze erwärmen.',
  'Zwiebelwürfel darin glasig anschwitzen (ca. 3-4 Minuten), dann den Knoblauch kurz mitrösten.',
  'Passierte Tomaten angießen und gut umrühren.',
  'Basilikum, Oregano und Zucker einrühren.',
  'Die Sauce bei niedriger Hitze ca. 20-25 Minuten köcheln lassen, dabei gelegentlich umrühren.',
  'Mit Salz kräftig abschmecken.',
  'Bei Bedarf mit dem Stabmixer kurz pürieren für eine besonders feine Konsistenz.'
] WHERE id = 432;

-- 433: Apfelkompott (ColdDesserts)
-- Zutaten: Äpfel, Zucker, Zitronensaft, Zimt, Wasser
UPDATE recipes SET steps = ARRAY[
  'Äpfel waschen, schälen, vierteln, entkernen und in ca. 1 cm große Stücke schneiden.',
  'Apfelstücke sofort mit Zitronensaft beträufeln, damit sie nicht braun werden.',
  'Wasser und Zucker in einem Topf aufkochen, bis sich der Zucker aufgelöst hat.',
  'Apfelstücke in das Zuckerwasser geben und bei mittlerer Hitze ca. 10-15 Minuten weich kochen.',
  'Die Stücke sollen noch etwas Biss haben und nicht zerfallen.',
  'Zimt unterrühren und vom Herd nehmen.',
  'Abkühlen lassen und gut gekühlt servieren.'
] WHERE id = 433;

-- 434: Birnenkompott (ColdDesserts)
-- Zutaten: Birnen, Zucker, Zitronensaft, Wasser, Gewürznelke
UPDATE recipes SET steps = ARRAY[
  'Birnen waschen, schälen, halbieren, entkernen und in gleichmäßige Spalten schneiden.',
  'Birnenspalten sofort mit Zitronensaft beträufeln, damit sie nicht braun werden.',
  'Wasser, Zucker und Gewürznelke in einem Topf aufkochen, bis sich der Zucker gelöst hat.',
  'Birnenspalten vorsichtig in den Zuckersirup geben.',
  'Bei niedriger Hitze ca. 10-12 Minuten sanft köcheln lassen, bis die Birnen weich, aber noch bissfest sind.',
  'Gewürznelke entfernen.',
  'Kompott in eine Schüssel umfüllen und vollständig abkühlen lassen.',
  'Gut gekühlt servieren.'
] WHERE id = 434;

-- 435: Apfelmus (ColdDesserts)
-- Zutaten: Äpfel, Zucker, Zitronensaft, Vanillezucker, Zimt
UPDATE recipes SET steps = ARRAY[
  'Äpfel waschen, schälen, vierteln und das Kerngehäuse entfernen.',
  'Äpfel in kleine Stücke schneiden und mit Zitronensaft in einen Topf geben.',
  'Zucker und Vanillezucker hinzufügen.',
  'Bei mittlerer Hitze zugedeckt ca. 15-20 Minuten weich kochen, dabei gelegentlich umrühren.',
  'Wenn die Äpfel zerfallen sind, mit einem Kartoffelstampfer oder Stabmixer zu feinem Mus verarbeiten.',
  'Zimt unterrühren und abschmecken – bei Bedarf noch etwas Zucker zugeben.',
  'Abkühlen lassen und gekühlt servieren.'
] WHERE id = 435;

-- 436: Basilikum (frisch) (Sides)
-- Zutaten: Basilikum (frisch)
UPDATE recipes SET steps = ARRAY[
  'Frische Basilikumblätter von den Stielen zupfen.',
  'Blätter kurz unter kaltem Wasser abspülen und vorsichtig trocken tupfen.',
  'Die Blätter ganz lassen oder grob mit den Händen zerreißen – nicht schneiden, da die Schnittkanten braun werden.',
  'Direkt vor dem Anrichten über das fertige Gericht streuen.'
] WHERE id = 436;

COMMIT;

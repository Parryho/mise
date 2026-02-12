-- Re-scrape fix for 63 verified garbled recipes (v2 — array steps)
-- Generated: 2026-02-12T20:22:19.140Z

-- [1/63] ID 20: Kaspressknödelsuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 20);
DELETE FROM ingredients WHERE recipe_id = 20;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Semmel(n) (gewürfelte)', 400, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Salz', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Brühe (instant)', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Butter', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Milch (kochende)', 0.25, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Ei(er)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Käse (Emmentaler)', 400, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Mehl', 4, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Gemüsebrühe', 2, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (20, 'Petersilie (gehackte)', 2, 'EL');
UPDATE recipes SET steps = '{"Die gewürfelten Semmeln mit dem Salz, Pfeffer, der Instantbrühe und der Petersilie in eine Schüssel geben. Die Zwiebel schälen, würfeln und in der Butter glasig dünsten. Anschließend auch in die Schüssel geben. Die kochende Milch darüber schütten und etwas abkühlen lassen. Den Käse in Würfel schneiden und mit den Eiern und dem Mehl darunter mischen. Jetzt kleine Leibchen aus der Masse formen. Portionsweise in etwas heißer Butter oder Öl ausbacken. Kurz in der Gemüsebrühe mitkochen. Anschließend anrichten und mit Petersilie garniert servieren."}' WHERE id = 20;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/743391176908148/bilder/436265/crop-960x540/kaspressknoedelsuppe.jpg' WHERE id = 20 AND (image_url IS NULL OR image_url = '');

-- [2/63] ID 33: Altwiener Suppentopf
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 33);
DELETE FROM ingredients WHERE recipe_id = 33;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Brühe', 1.25, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Rindfleisch', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Karotte(n)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Rübe(n) (gelbe)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Sellerie', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Nudeln (Suppennudeln)', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Schnittlauch', 1, 'Bund');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (33, 'Muskat', 1, 'Stück');
UPDATE recipes SET steps = '{"Fleisch auslösen und in ca. 2 cm große Stücke schneiden. Gemüse putzen, schälen und in ca. 1,5 cm dicke Scheiben schneiden. Die Suppe aufkochen, das Fleisch einlegen und bei milder Hitze ca. 30 Minuten köcheln. Gemüse zugeben und die Suppe ca. 30 Minuten weiter köcheln. Die Suppennudeln beigeben und 5 Minuten kochen. Den Suppentopf mit Salz, Pfeffer und Muskat würzen. Schnittlauch fein schneiden.  Die Suppe in Teller schöpfen und mit Schnittlauch bestreut servieren. Anmerkung: Bei uns in Österreich sind die gelben Rüben von der Farbe her gelb, wenn es das nicht gibt, dann einfach mehr Karotten nehmen."}' WHERE id = 33;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/842351189505430/bilder/1251522/crop-960x540/wiener-suppentopf.jpg' WHERE id = 33 AND (image_url IS NULL OR image_url = '');

-- [3/63] ID 36: Gebackene Leber
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 36);
DELETE FROM ingredients WHERE recipe_id = 36;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Scheibe/n Leber(n) (Rinderleber, große Scheiben)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Mehl', 4, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Zwiebel(n) (rot)', 2, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'm.-große Äpfel', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Zitrone(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'cm Ingwer (frischer)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Knoblauchzehe(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Portwein', 50, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Gemüsebrühe (oder Rinderbrühe)', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Sahne', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Olivenöl (zum Braten)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Salz und Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (36, 'Kräutersalz', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Zwiebeln in schmale Ringe schneiden, die Äpfel würfeln und mit dem Saft der Zitrone vermengen. Knoblauch und Ingwer hacken.  Das Öl in der Pfanne erhitzen, nach und nach Zwiebel, Äpfel, Knoblauch und Ingwer anbraten. Mit Brühe ablöschen, Portwein und Sahne hinzugeben. Das Ganze mit frisch gemahlenem Pfeffer und Kräutersalz abschmecken.  Die Leberscheiben waschen, trocken tupfen, in Mehl wenden und in einer weiteren Pfanne in heißem Öl kräftig beidseitig kurz anbraten. Danach 10 Min. ziehen lassen. Die Leber erst kurz vor dem Anrichten pfeffern und salzen.  Zum Anrichten die Leberscheiben auf der Zwiebel-Apfel-Mischung anrichten. Dazu schmecken Kartoffelpüree und Blattsalat oder Rotkohl."}' WHERE id = 36;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2308561368338783/bilder/1575520/crop-960x540/gebackene-leber-auf-zwiebel-apfel-bett.jpg' WHERE id = 36 AND (image_url IS NULL OR image_url = '');

-- [4/63] ID 42: Lammstelze
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 42);
DELETE FROM ingredients WHERE recipe_id = 42;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Lammhaxe(n) ((Lammstelzen), beim Metzger vorbestellen)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Möhre(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Paprikaschote(n) (rot, grün,gelb)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Zwiebel(n) (in Scheiben)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Zehe/n Knoblauch (in Scheiben)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Pizzatomaten', 1, 'Dose');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'Chilischote(n) (rot, in Scheiben)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (42, 'gehäuft Thymian (getrocknet)', 1, 'TL');
UPDATE recipes SET steps = '{"Den Römertopf 24 Std. wässern. Den Backofen nicht vorheizen!  Die Möhren, die Paprikaschoten und die Zwiebeln in grobe Stücke schneiden. Den Knoblauch und die Chili in feine Scheiben schneiden und zu den Dosentomaten geben. Die Lammstelzen in den Topf legen und alle Zutaten darauf verteilen. Deckel drauf und ca. 3 Std. bei 180 Grad im Ofen garen. Wenn sich das Fleisch vom Knochen löst, ist es fertig."}' WHERE id = 42;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2716441424526994/bilder/779905/crop-960x540/lammstelzen.jpg' WHERE id = 42 AND (image_url IS NULL OR image_url = '');

-- [5/63] ID 50: Kasnocken
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 50);
DELETE FROM ingredients WHERE recipe_id = 50;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Weißbrot (altbacken, klein geschnitten)', 300, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Milch, lauwarme', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Emmentaler (oder Gouda, klein gewürfelt)', 300, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Schalotte(n) (fein gehackt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Butter', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Mehl', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Ei(er)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Schnittlauchröllchen', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'n. B. Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Butter', 80, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (50, 'Parmesan (frisch gerieben)', 70, 'g');
UPDATE recipes SET steps = '{"Brot und Milch vermengen, den in kleine Würfel geschnittenen Käse unterheben.  Schalotte in Butter glasig schwitzen und mit Mehl (ich gebe auch noch 2 - 3 EL Semmelbrösel dazu), Eiern, Schnittlauchröllchen und etwas Salz zur Brotmasse geben. Wenn der Brotteig zu trocken ist, noch etwas Milch dazugeben. Gut vermengen und ca. 10 ovale Nocken (Knödel) formen.  In Salzwasser ca. 15 Minuten leicht kochen. Mit zerlassener Butter und mit Parmesan bestreut servieren. Tipp: Ich gebe die Knödel mit ganz wenig Wasser in die Mikrowelle und gare sie pro Knödel bei 750 Watt 1 Minute."}' WHERE id = 50;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/28841007223079/bilder/1091931/crop-960x540/kasnocken.jpg' WHERE id = 50 AND (image_url IS NULL OR image_url = '');

-- [6/63] ID 81: Erdäpfelsalat
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 81);
DELETE FROM ingredients WHERE recipe_id = 81;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Kartoffel(n) (Erdäpfel)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Rinderbrühe (heiß)', 0.5, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Essig (neutral)', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Pfeffer (frisch gemahlener)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Zucker (frisch gemahlener)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Zwiebel(n) (fein gehackte ,größere)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Öl (neutrales)', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (81, 'Zwiebel(n) (rote, in feine Ringe, zur Garnierung)', 0.5, 'Stück');
UPDATE recipes SET steps = '{"Die Kartoffeln werden gereinigt und im kalten Wasser aufgestellt und gekocht. Die Kartoffeln noch heiß schälen und in Scheiben schneiden. Mit der heißen Rindsuppe übergießen und vorsichtig vermischen. Wenn man keine sämige Sauce will, muss man festkochende Kartoffel nehmen. Dann würzt man mit Essig, Salz, Pfeffer, etw. Zucker und evt. feingehackter Petersilie, die feingeschnittene Zwiebel nicht zu vergessen. Dann gibt man das Öl darüber. Die roten Zwiebelringe dienen der Garnierung. Wenn alles durchgezogen ist, kann man Vogerlsalat (Feldsalat) drunter mischen, der natürlich geputzt und knackig sein soll, da er eh schnell zusammenfällt. Tipp: Wer mag, kann auch Schnittlauch als Garnierung darauf geben, ich mache es nicht so. Info: Zucker ist bei allen Wiener Salaten wichtig, ich bevorzuge ihn jedoch nur im grünen Salaten. Man sollte jedoch auch den Kartoffelsalat mit Zucker unbedingt probieren."}' WHERE id = 81;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/158711069500551/bilder/1135372/crop-960x540/original-wiener-erdaepfelsalat.jpg' WHERE id = 81 AND (image_url IS NULL OR image_url = '');

-- [7/63] ID 88: Karottengemüse
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 88);
DELETE FROM ingredients WHERE recipe_id = 88;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (88, 'Karotte(n)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (88, 'Butter (oder Margarine)', 30, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (88, 'Wasser (heißes)', 0.125, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (88, 'gehäuft Fleischbrühepulver', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (88, 'gehäuft Zucker', 1, 'TL');
UPDATE recipes SET steps = '{"Die Karotten schaben oder schälen und in etwa 2 mm dicke Scheiben schneiden oder reiben. Die Fleischbrühe mit dem Wasser zubereiten.  Das Fett in einem Topf zerlassen und heiß werden lassen. Die zerkleinerten Karotten dazugeben und glasig dünsten (etwa 4 - 5 Minuten), bis sich etwas Saft abgesetzt hat. Den Zucker darüber streuen und unter Rühren karamellisieren lassen. Dann die Fleischbrühe aufgießen. Den Topfdeckel auflegen und das Gemüse auf unterer bis mittlerer Stufe etwa 20 Minuten gar dünsten. Die Karotten sollten noch leicht \"Biss\" haben.  Wer möchte kann kurz vor dem Servieren noch gehackte Petersilie darüber streuen. Oder etwa 5 Minuten vor Ende der Garzeit noch 2 - 3 EL Erbsen aus der Dose hinzufügen. Zwischenzeitlich bin ich schon dazu übergegangen, das Fertigpulver für die Brühe - nachdem der Zucker karamellisiert ist - einfach über die Karotten zu streuen und dann einfach ganz heißes Wasser (direkt aus dem Wasserhahn) zuzugeben. Schmeckt eigentlich genauso und man braucht wirklich nur den einen Topf.  So ein Rezept haben wir damals in der Schule im Hauswirtschaftsunterricht gelernt. Und mit ein klein wenig Veränderung (also so, wie es jetzt oben steht) schmeckt es uns und der Verwandtschaft am Besten."}' WHERE id = 88;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1236451228518539/bilder/1364842/crop-960x540/karottengemuese.jpg' WHERE id = 88 AND (image_url IS NULL OR image_url = '');

-- [8/63] ID 90: Rahmkohlrabi
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 90);
DELETE FROM ingredients WHERE recipe_id = 90;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'Kohlrabi (frische)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'Butter', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'Mehl', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'Gemüsebrühe (instant)', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'süße Sahne', 150, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'Salz und Pfeffer (weißer aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (90, 'Muskat (frisch gerieben)', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Kohlrabi schälen und in Stifte schneiden. In leicht gesalzenem Wasser ca. 20 Minuten kochen. Dann abgießen und vom Kochwasser 250 ml auffangen.  Den Kohlrabi in der Butter leicht anbraten und das Mehl darüber stäuben. Hell anschwitzen und mit Kochwasser und Sahne ablöschen. Die Gemüsebrühe einrühren und die Sauce 2 Minuten köcheln lassen. Mit Salz, weißem Pfeffer und evtl. Muskat abschmecken.  Schmeckt prima zu Frikadellen und Kartoffelpüree."}' WHERE id = 90;
UPDATE recipes SET portions = 3 WHERE id = 90;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1713191280135358/bilder/1150146/crop-960x540/rahmkohlrabi.jpg' WHERE id = 90 AND (image_url IS NULL OR image_url = '');

-- [9/63] ID 98: Linzer Torte
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 98);
DELETE FROM ingredients WHERE recipe_id = 98;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Mehl', 400, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Zucker', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Butter', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Mandeln, gemahlene', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Backpulver', 1, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Nelkenpulver', 1, 'Msp');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Kakaopulver', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Zimt', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Kirschwasser', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Marmelade ((Zwetschgenmarmelade), ca. 400 g)', 1, 'Glas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (98, 'Eigelb', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Zutatenmengen sind für 2 Linzertorten. Wer nur 1 backen möchte, halbiert die Mengen einfach. Aus den Zutaten außer Zwetschgenmarmelade und Eigelb einen Mürbeteig herstellen. Zwei gleich große Portionen davon in Folie wickeln und kalt stellen.  Jeweils 2/3 einer Teigportion für den Boden verwenden, ausrollen und in die Form drücken. Marmelade darauf streichen und das letzte Drittel Teig ausrollen. Streifen für ein Gitter ausrädeln oder Formen ausstechen. Diese auf die Marmelade geben.  Mit Eigelb bestreichen und bei 175 °C Ober-/Unterhitze ca. 40 Minuten backen. Mit der zweiten Teigportion ebenso verfahren. Die Torte kann sofort nach dem Abkühlen gegessen werden."}' WHERE id = 98;
UPDATE recipes SET portions = 2 WHERE id = 98;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/874991192884516/bilder/1356464/crop-960x540/meine-linzer-torte.jpg' WHERE id = 98 AND (image_url IS NULL OR image_url = '');

-- [10/63] ID 100: Punschkrapferl
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 100);
DELETE FROM ingredients WHERE recipe_id = 100;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Ei(er)', 6, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Zucker', 120, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Salz', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Vanillezucker', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Mehl (griffiges)', 110, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Kochschokolade', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Haselnüsse (fein gehackt)', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Rum (oder Kirschwasser)', 60, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Kaffee', 60, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Aprikosenkonfitüre (oder Orangenmarmelade)', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Kuchenglasur (Punschglasur)', 2, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Marzipan', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Zuckerdekor (Augen)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Lebensmittelfarbe (rosa)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (100, 'Aprikosenkonfitüre (oder Orangenmarmelade)', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Eier trennen. Die Eiweiße zusammen mit einer Prise Salz, Kristall- und Vanillezucker zu einem festen Schnee schlagen. Die Eigelbe und das Mehl vorsichtig unterheben. Den Teig in eine rechteckige Form geben (ca. 1 cm hoch) und bei 180 °C (Ober-/Unterhitze) etwa 15 Minuten backen. Nach dem Abkühlen mit einem runden Ausstecher 10 Kreise (ca. 5 cm) ausstechen.  Für die Punschfüllung die Schokolade schmelzen. Den übrigen Teig zerbröseln und zusammen mit der geschmolzenen Schokolade und den Haselnüssen mit dem Rum und dem Kaffee gut vermischen. Am Schluss noch gut mit der Marmelade verrühren und die Masse einige Zeit ziehen lassen.  Je einen Biskuitkreis mit etwas Punschfüllung bestreichen und einen zweiten Kreis darauf setzen. Damit die Form besser erhalten bleibt, kann man eine runde Metallform dafür verwenden. Anschließend mit Marmelade rundum dünn bestreichen, damit die Punschglasur später besser haftet.  Nun auf jeden Fall die Marmelade einige Stunden an einem kühlen Ort trocknen lassen, sonst hält die Glasur nicht so gut und die Punschkrapferl werden nicht so schön. Das Marzipan mit rosa Lebensmittelfarbe färben und Rüssel und Ohren ausstechen bzw. formen. Die Punschglasur über die Krapferl gießen und sogleich das Marzipan und jeweils zwei Zuckeraugen darauf geben, damit diese auf der noch weichen Glasur gut ankleben."}' WHERE id = 100;
UPDATE recipes SET portions = 1 WHERE id = 100;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2987411451570036/bilder/860785/crop-960x540/punschkrapferl.jpg' WHERE id = 100 AND (image_url IS NULL OR image_url = '');

-- [11/63] ID 103: Scheiterhaufen
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 103);
DELETE FROM ingredients WHERE recipe_id = 103;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (103, 'Brötchen (altbacken)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (103, 'Milch', 300, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (103, 'Ei(er)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (103, 'Zucker', 30, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (103, 'Äpfel', 2, 'Stück');
UPDATE recipes SET steps = '{"Die Brötchen in kleine Stücke zupfen oder schneiden. Die Milch mit dem Zucker und den Eiern vermischen und die Brötchen in der Mischung einweichen.  Inzwischen die Äpfel klein schneiden und mit der Brötchenmischung vermengen. Die Mischung in eine Auflaufform füllen. Alles bei 180 °C Ober-/Unterhitze 30 min. im Ofen backen. Wer mag, kann nebenbei eine Vanillesauce zubereiten und zum Scheiterhaufen servieren."}' WHERE id = 103;
UPDATE recipes SET portions = 3 WHERE id = 103;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/4252521694367068/bilder/1523596/crop-960x540/scheiterhaufen.jpg' WHERE id = 103 AND (image_url IS NULL OR image_url = '');

-- [12/63] ID 106: Kardinalschnitte
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 106);
DELETE FROM ingredients WHERE recipe_id = 106;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Eigelb', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Puderzucker', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Mehl', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Eiweiß', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Zucker (feiner)', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Sahne (à 250 ml)', 2, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Kaffeepulver (Cappuccinopulver oder etwas feinen Löskaffee)', 2, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (106, 'Sahnesteif', 1, 'Pck');
UPDATE recipes SET steps = '{"Für den Biskuit: Dotter und Eier schaumig schlagen, Staubzucker dazugeben und weiterschlagen, bis eine sehr lockere Masse entsteht, dann das Mehl vorsichtig unterheben.  Für das Baiser: Eiklar steif schlagen, dann den Kristallzucker einrieseln lassen und noch kurz mitschlagen.Die Masse soll sehr steif sein. Masse in einen ausreichend großen Spritzsack füllen.  Backpapier auf ein Backblech geben. Auf das Backpapier mit dem Spritzsack einzelne Streifen mit Baiser auftragen, dabei Abstände von knapp 2 cm freihalten. Die Masse ganz aufbrauchen. Danach die Biskuitmasse in den Spritzsack füllen und die freien Zwischenräume damit ausfüllen. Im auf 160°C vorgeheizten Rohr auf der Mittelschiene ungefähr 25 Minuten backen. Das Biskuit sollte leicht gebräunt sein, ebenso die Baisermasse. Für die Fülle: Schlagobers mit Sahnesteif schlagen, dann das Cappuccinopulver unterrühren.  Die gebackene Biskuit-Baiser-Masse auskühlen lassen, dann in 3 gleiche Teile schneiden, die Hälfte der Fülle auftragen. Den zweiten Biskuit-Teil drauflegen, die restliche Fülle auftragen. Mit dem letzten Biskuit-Teil abschließen.  Für 1 Stunde in den Kühlschrank stellen. Vor dem Servieren mit Staubzucker bestreuen."}' WHERE id = 106;
UPDATE recipes SET portions = 6 WHERE id = 106;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1000721205337223/bilder/97990/crop-960x540/kardinalschnitten.jpg' WHERE id = 106 AND (image_url IS NULL OR image_url = '');

-- [13/63] ID 110: Mohntorte
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 110);
DELETE FROM ingredients WHERE recipe_id = 110;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Margarine', 60, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Zucker', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Mehl', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Backpulver', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Fett für die Form', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Milch', 750, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Vanillepuddingpulver', 2, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Mohn (gemahlenen)', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Zucker', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Margarine', 125, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Schmand', 1, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Eigelb', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Eiweiß', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Schmand', 1, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (110, 'Zucker', 80, 'g');
UPDATE recipes SET steps = '{"Für den Teig:
Aus Margarine, Zucker, 1 Ei, Mehl und Backpulver einen Teig bereiten und in eine gefettete Springform geben. Für den Belag: 
Aus Milch, Vanillepudding und  Zucker einen Pudding kochen, den Mohn, die Margarine und 1 Becher Schmand hineinrühren, alles auf den Boden geben. Im vorgeheizten E-Herd bei 175 °C Ober-/Unterhitze ca. 40 - 50 min auf der untersten Schiene backen. Für den Guss: 
1 Becher Schmand, Eigelb und Zucker verrühren. Eiweiß steif schlagen und unterheben. Die Masse auf den vorgebackenen Kuchen geben und nochmals bei ca. 160 °C Ober-/Unterhitze auf der mittleren Schiene ca. 20 - 30 min backen."}' WHERE id = 110;
UPDATE recipes SET portions = 1 WHERE id = 110;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/182391078735454/bilder/350910/crop-960x540/mohntorte.jpg' WHERE id = 110 AND (image_url IS NULL OR image_url = '');

-- [14/63] ID 114: Obstknödel
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 114);
DELETE FROM ingredients WHERE recipe_id = 114;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Quark (Topfen)', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Mehl (evtl. mit etwas Grieß mischen)', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Butter', 40, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Salz', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Obst (nach Wahl)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Puderzucker (Zuckerbrösel)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (114, 'Zimt', 1, 'Stück');
UPDATE recipes SET steps = '{"Topfen, Butter, Ei und Salz mit dem Mixer verrühren und das Mehl (evtl. mit Grieß) dazurühren.  Die feste Masse zu einer Rolle formen und in gleichgroße Stücke schneiden, flach drücken, Obst einhüllen - fest drücken und die Knödel in Salzwasser 10 - 15 min. kochen.  In gerösteten Zuckerbröseln wälzen, mit Staubzucker servieren."}' WHERE id = 114;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1722691281368418/bilder/499525/crop-960x540/obstknoedel-mit-topfenteig.jpg' WHERE id = 114 AND (image_url IS NULL OR image_url = '');

-- [15/63] ID 122: Hirtensalat
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 122);
DELETE FROM ingredients WHERE recipe_id = 122;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Paprikaschote(n) (rot, in feine Streifen geschnitten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Paprikaschote(n) (grün, in feine Streifen geschnitten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Paprikaschote(n) (gelb, in feine Streifen geschnitten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Salatgurke(n) (geschält, in Würfel geschnitten)', 1, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Fleischtomate(n) (in Würfel geschnitten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Glas Oliven (schwarz, entsteint, in feine Ringe geschnitten)', 1, 'kl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Zwiebel(n) (fein gewürfelt)', 1, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Schafskäse (griechischer, gewürfelt)', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Salz (reichlich)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Pfeffer (schwarz)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Knoblauch (granuliert, reichlich)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Olivenöl', 9, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (122, 'Weißweinessig', 6, 'EL');
UPDATE recipes SET steps = '{"Alle Gemüsesorten und den Schafskäse in eine Schüssel geben. Das Olivenöl mit dem Essig verquirlen und dazugeben. Kräftig vermischen und mit den Gewürzen herzhaft abschmecken. Tipp:  Je länger der Salat zieht, umso besser schmeckt er. Man kann noch 150-250 g fein gewürfelte Salami oder Paprikasalami hinzufügen, dies macht den Salat noch würziger."}' WHERE id = 122;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2035251329814401/bilder/908349/crop-960x540/griechischer-hirtensalat-a-la-gabi.jpg' WHERE id = 122 AND (image_url IS NULL OR image_url = '');

-- [16/63] ID 123: Caesar Salad
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 123);
DELETE FROM ingredients WHERE recipe_id = 123;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Kopf Römersalat(e)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Parmesan, frisch geriebener', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Scheibe/n Toastbrot', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Öl (zum Braten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Knoblauchzehe(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Ei(er) (roh)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Knoblauchzehe(n) (in Stücke geschnitten)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Sardellenfilet(s) (aus dem Glas)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Dijonsenf', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Zitrone(n), Saft davon', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Keimöl (o. Ä. - kein Olivenöl!)', 150, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (123, 'Pfeffer (aus der Mühle)', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Römersalat waschen, trocken schleudern und in mundgerechte Stücke schneiden. In einer Schüssel anrichten. Für die Sauce die gesamten Zutaten bis auf das Öl in einen hohen Becher geben und mit dem Pürierstab aufschlagen, dann das Öl langsam unter ständigem Weiterschlagen einlaufen lassen, bis eine cremige Sauce entstanden ist. Das Toastbrot entrinden, in kleine Würfel schneiden und in heißem Öl mit Knoblauch rundum zu krossen Croûtons braten.  Die Sauce über den Salat geben, alles gut vermischen und den Salat mit reichlich geriebenem Parmesankäse und den Croûtons bestreut servieren. Mit kross gebratenem Hähnchenfilet wird dies eine leichte Hauptspeise."}' WHERE id = 123;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/956701201250684/bilder/1616492/crop-960x540/caesar-salad.jpg' WHERE id = 123 AND (image_url IS NULL OR image_url = '');

-- [17/63] ID 126: Bauernfrühstück
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 126);
DELETE FROM ingredients WHERE recipe_id = 126;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Kartoffel(n)', 6, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Schinken (gewürfelt)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Ei(er)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Paprikapulver (edelsüß)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (126, 'Margarine', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Kartoffeln waschen, schälen und roh in nicht ganz 1 cm große Würfel schneiden. Nicht zu wenig Margarine in einer beschichteten Pfanne erhitzen. Die Kartoffeln in der Pfanne mit  Pfeffer und Paprikapulver würzen und so lange braten, bis sie fast gar sind. Nun die Zwiebel würfeln und mit dem Speck dazu geben, alles dann auf hoher Stufe braten, öfter wenden, bis die Kartoffeln knusprig und gar sind. Abschmecken und bei Bedarf salzen.  Jetzt die Eier ohne Gewürze verquirlen und die Hälfte davon in eine kleine 25 cm Pfanne mit etwas erhitztem Fett geben, kurz anbraten bis es einen kleinen Eierkuchen ergibt, der nicht mehr am Boden klebt. Nun die Hälfte der Bratkartoffeln darauf legen und weiter braten, bis das Ei gestockt ist.  Mit dem Rest Bratkartoffeln und Ei genauso die zweite Portion herstellen."}' WHERE id = 126;
UPDATE recipes SET portions = 2 WHERE id = 126;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1153001221552983/bilder/1490722/crop-960x540/bauernfruehstueck-mal-anders.jpg' WHERE id = 126 AND (image_url IS NULL OR image_url = '');

-- [18/63] ID 136: Bosna
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 136);
DELETE FROM ingredients WHERE recipe_id = 136;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Zwiebel(n)', 1, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Butter', 8, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Zucker', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Essig', 1.5, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Ketchup', 5, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Senf, mittelscharfer', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Salz', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Curry', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Aufbackbrötchen', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Bratwürste', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (136, 'Öl zum Braten (oder Butter, für die Bratwürste)', 1, 'Stück');
UPDATE recipes SET steps = '{"Für die Soße die Zwiebel in kleine Würfel schneiden, Butter in einen Topf geben und schmelzen. Anschließend die Zwiebel scharf anbraten, Herdplatte auf mittlere Temperatur schalten. Zucker zu den Zwiebeln hinzugeben und karamellisieren lassen. Mit dem Essig alles ablöschen. Ketchup, Senf, Curry und Salz hinzugeben und ca. 60 sek auf kleiner Flamme köcheln lassen. Aufbackbrötchen nach Anleitung der Verpackung aufbacken (können auch normale Brötchen sein, sollten jedoch warm und kross sein). Bratwürste in Öl oder Butter braten.  Brötchen aufschneiden, Bratwürste in die Brötchen legen und die Soße hinzufügen."}' WHERE id = 136;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3779951576306833/bilder/1260695/crop-960x540/beste-bosna-ever.jpg' WHERE id = 136 AND (image_url IS NULL OR image_url = '');

-- [19/63] ID 143: Apfeltaschen
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 143);
DELETE FROM ingredients WHERE recipe_id = 143;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'Äpfel', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'Vanillezucker', 2, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'gehäuft Mandeln, gemahlene', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'Puddingpulver', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'Wasser', 200, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'Rolle(n) Blätterteig (aus dem Kühlregal)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'Eigelb', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (143, 'n. B. Rosinen', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Äpfel klein schneiden und gemeinsam mit dem Wasser etwas weich kochen lassen. Dann das Puddingpulver mit etwas Wasser verrühren und zu den weichen Äpfeln geben. Mit den Rosinen, den gemahlenen Mandeln und dem Vanillezucker vermischen und zur Seite stellen.  Den Backofen auf 220 °C Umluft vorheizen und den Blätterteig in 6 gleichgroße Quadrate schneiden.  Die Apfelfüllung jeweils auf die Hälfte geben und zu einem Dreieck zusammenklappen, mit einer Gabel fest drücken. Die Dreiecke nun mit dem Eigelb bepinseln und für ca 22 Minuten in den Ofen geben. Wer mag, kann die Apfeltaschen nach dem Abkühlen noch mit Puderzucker bestreuen. Dazu passt sehr gut Sahne und Vanilleeis."}' WHERE id = 143;
UPDATE recipes SET portions = 6 WHERE id = 143;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3700391558906740/bilder/1474171/crop-960x540/blaetterteig-apfeltaschen.jpg' WHERE id = 143 AND (image_url IS NULL OR image_url = '');

-- [20/63] ID 157: Schinkenröllchen
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 157);
DELETE FROM ingredients WHERE recipe_id = 157;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Hackfleisch', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Scheibe/n Kochschinken', 10, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Zwiebel(n) (gewürfelt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'n. B. Semmelbrösel', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Paprikapulver', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Knoblauchsalz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Dose/n Tomate(n)', 1, 'kl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Sahne', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Schmand', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Tomatenmark', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Kräuter ((Oregano, Majoran, Basilikum), getrocknet)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (157, 'Käse (gerieben (Gratinkäse))', 200, 'g');
UPDATE recipes SET steps = '{"Das Hackfleisch mit Ei, Zwiebelwürfeln, Semmelbröseln, Salz, Pfeffer, Paprika und Knoblauchsalz verkneten, auf den Schinkenscheiben verteilen und aufrollen. Mit der Naht nach unten in eine Auflaufform legen. Die Tomaten etwas klein schneiden und in eine Schüssel geben, Sahne, Schmand, Tomatenmark, Kräuter und Gewürze dazugeben und verrühren. Alles über die Schinkenröllchen gießen. Den Käse drüberstreuen und bei 175°C Umluft (nicht vorheizen) ca. 30 - 35 Min. bis zur gewünschten Bräune überbacken. Wir essen gerne Curryreis und Gurkensalat dazu. Tipp: Man kann dieses Rezept morgens schon für abends vorbereiten."}' WHERE id = 157;
UPDATE recipes SET portions = 5 WHERE id = 157;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2514261394562196/bilder/1375937/crop-960x540/schinkenroellchen.jpg' WHERE id = 157 AND (image_url IS NULL OR image_url = '');

-- [21/63] ID 159: Vitello Tonnato
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 159);
DELETE FROM ingredients WHERE recipe_id = 159;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Kalbfleisch (Kalbsnuss)', 600, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Weißwein (trocken)', 750, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Stange/n Staudensellerie', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Möhre(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Lorbeerblatt', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Gewürznelke(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Salz', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Zitrone(n) (Saft davon)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Sud ((Kochsud) vom Kalbfleisch)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Weißweinessig', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Thunfisch im eigenen Saft (à 150 g)', 1, 'Dose/n');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Sardellenfilet(s) (eingelegte)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Eigelb', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Olivenöl', 200, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Kapern', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Salz und Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Kapern', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (159, 'Zitrone(n) (unbehandelte)', 1.5, 'Stück');
UPDATE recipes SET steps = '{"Die Kalbsnuss in einen Topf legen und den Weißwein darüber gießen. Selleriestange, Möhre und die Zwiebel grob zerteilen, zusammen mit dem Lorbeerblatt und den Gewürznelken in die Marinade geben. Das Fleisch zugedeckt 24 Stunden ziehen lassen, dabei einige Male wenden. Jetzt soviel Wasser dazugießen, dass das Fleisch gerade bedeckt ist, alles zum Kochen bringen und 1 TL Salz dazugeben. Bei geringer Hitze im offenen Topf knapp 1 Stunde garziehen lassen. Im Sud abkühlen lassen. Für die Sauce den Thunfisch abtropfen lassen,. Die Sardellenfilets abspülen und mit Küchenkrepp trocknen und klein schneiden.
Thunfisch, Sardellen, Eigelb, Kapern, Zitronensaft und Weißweinessig in einen Mixer geben und fein pürieren, einige Esslöffel des Kochsuds vom Kalbfleisch unterrühren und nach und nach das Olivenöl einfließen lassen. Zu einer sämigen Sauce rühren. Mit Salz und Pfeffer abschmecken. Das Kalbfleisch in dünne Scheiben aufschneiden und auf einer Platte anrichten. Gleichmäßig mit der Thunfischsauce bedecken, abgedeckt kalt stellen und 3 - 4 Stunden durchziehen lassen. Vor dem Servieren die Zitronen in dünne Scheiben schneiden, das Kalbfleisch damit garnieren und
1 EL Kapern darüber streuen."}' WHERE id = 159;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/132141056873749/bilder/554918/crop-960x540/vitello-tonnato-nach-piemonteser-art.jpg' WHERE id = 159 AND (image_url IS NULL OR image_url = '');

-- [22/63] ID 160: Beef Tatar
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 160);
DELETE FROM ingredients WHERE recipe_id = 160;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Rinderfilet(s)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Zwiebel(n)', 1, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Gurke(n) (Essiggurkerln)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Kapern', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Eigelb', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Olivenöl', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Tomatenketchup (hot)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Paprikapulver (edelsüß)', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Paprikapulver (scharf)', 1, 'Msp');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Petersilie (gehackt)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Senf (Dijon)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Cognac', 1, 'Schuss');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (160, 'Pfeffer (aus der Mühle)', 1, 'Stück');
UPDATE recipes SET steps = '{"Verwenden Sie bitte unbedingt frisches, nicht zu abgehangenes Rinderfilet. Rinderfilet peinlich genau von Haut und Sehnen befreien und mit einem scharfen Messer fein hacken, Wer sich diese Arbeit nicht antun will, kann das Fleisch auch mit dem feinen Scheibenaufsatz einer Küchenmaschine faschieren. Zwiebel schälen und fein hacken. Essiggurkerln und Kapern ebenfalls fein hacken. Das Fleisch in eine Schüssel geben und mit einer Gabel alle anderen Zutaten sorgfältig einarbeiten. Je nach individuellem Geschmack milder oder schärfer abschmecken. Mit Toastbrot servieren. TIPP: Ich bestreiche mein Tatar auf Toast gerne noch mit etwas Kaviar und bestreue das ganze mit gehacktem Ei."}' WHERE id = 160;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/309581111508666/bilder/683080/crop-960x540/beef-tatar.jpg' WHERE id = 160 AND (image_url IS NULL OR image_url = '');

-- [23/63] ID 161: Carpaccio
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 161);
DELETE FROM ingredients WHERE recipe_id = 161;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Rinderfilet(s) (oder Roastbeef, hauchdünn geschnitten)', 400, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Rucola', 1, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Italienischer Hartkäse (wie z.B. Parmesan oder Grana Padano) (frisch gehobelt)', 1, 'Stück(e)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Zitrone(n), Saft davon', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Pinienkerne', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Balsamico', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Olivenöl (extra vergine)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Pfeffer, schwarzer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Meersalz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (161, 'Baguette(s)', 1, 'Stück');
UPDATE recipes SET steps = '{"4 Teller mit Balsamico beträufeln und mit einem Pinsel verteilen, so dass der gesamte Teller dünn bedeckt ist.  Die Pinienkerne anrösten und den Rucola waschen. Die dünnen Rinderfilet-Scheiben, den Rucola und die Pinienkerne auf die Teller geben, und den Grana Padano hauchdünn darüber hobeln. Jetzt mit Salz, Zitronensaft und Pfeffer würzen, das Olivenöl darüber träufeln. Ich nehme auch noch etwas Balsamico dazu. Dann in sofort mit dem Baguette servieren. Tipp: Damit das Rinderfilet leichter in hauchdünne Scheiben geschnitten werden kann, friert man das Filet vorher etwas an. Zum Schneiden braucht man entweder ein sehr scharfes Messer oder eine Aufschnittmaschine. Hat man beides nicht, kann man die etwas dickeren Scheiben zwischen 2 Gefrierbeutel legt und mit einem Fleischklopfer oder einer Kasserolle vorsichtig flach klopfen, oder das Filet beim Metzger aufschneiden lassen."}' WHERE id = 161;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/873731192711392/bilder/1396822/crop-960x540/carpaccio-vom-rind.jpg' WHERE id = 161 AND (image_url IS NULL OR image_url = '');

-- [24/63] ID 170: Paprikacremesuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 170);
DELETE FROM ingredients WHERE recipe_id = 170;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Paprikaschote(n)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'm.-große Zwiebel(n)', 1.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Zehe/n Knoblauch', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Gemüsebrühe', 1, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Schlagsahne', 1, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Sambal Oelek', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Tomatenmark', 1.5, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Mehl', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Zucker', 2.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Butter', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Majoran', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (170, 'Salz und Pfeffer', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Paprikaschoten waschen und im Ganzen auf den Backofenrost legen, ein mit Backpapier ausgelegtes Backblech darunter, falls doch etwas Flüssigkeit austreten sollte. Die Paprika im vorgeheizten Ofen solange grillen, bis die Haut schwarz ist und Blasen wirft. Anschließend die Paprika in einen Frühstücksbeutel geben und auskühlen lassen. Dann die Haut der Paprika entfernen und das Fleisch in Würfel schneiden. Den Saft der Paprikaschoten unbedingt mit auffangen. Zwiebeln würfeln und in Olivenöl anbraten. Knoblauch klein schneiden und mit anbraten. Ist alles leicht angebräunt, geben wir das Tomatenmark, die Butter und das Mehl hinzu und lassen die Butter unter ständigem Rühren schmelzen. Der Brei wird mit der Gemüsebrühe abgelöscht und mit dem Schneebesen sämig gerührt. Nun kommen die Paprikaschoten und der Saft in die Suppe und wir lassen diese ca. 5 Minuten aufkochen. Sambal Oelek, Schlagsahne und Zucker dazugeben und alles mit dem Pürierstab pürieren. Mit Salz, Pfeffer und Majoran abschmecken und noch einmal kurz pürieren.  Mit der Flüssigkeit kann man ggf. noch variieren und etwas mehr Gemüsebrühe hinzufügen. Das ist seit ein paar Jahren meine Weihnachtssuppe. Dazu werden ganz klein frittierte Kartoffelcroutons in die Suppe gegeben - ein Traum!"}' WHERE id = 170;
UPDATE recipes SET portions = 5 WHERE id = 170;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3240271482088575/bilder/972480/crop-960x540/paprikacremesuppe.jpg' WHERE id = 170 AND (image_url IS NULL OR image_url = '');

-- [25/63] ID 174: Maiscremesuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 174);
DELETE FROM ingredients WHERE recipe_id = 174;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Mais', 2, 'Dose/n');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Gemüsebrühe (gekörnte)', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Scheibe/n Bacon', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'm.-große Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Zehe/n Knoblauchzehe(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Butter', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Chilischote(n) (rot)', 1, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Mehl', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Sahne', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Zucker', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'n. B. Petersilie (fein gehackt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (174, 'Salz und Pfeffer', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Mais abtropfen lassen. 1 l Wasser mit der gekörnten Brühe und ca. 1/4 des Maises ca. 10 Minuten kochen. Anschließend die Suppe pürieren und durch ein Sieb streichen. Den Speck knusprig braten, dann beiseite stellen. Zwiebel und Knoblauch in Butter glasig anbraten. Chili in Ringe schneiden und mit anbraten. Mit Mehl bestäuben, alles kurz durchrösten, dann die Maisbrühe einrühren und die Suppe aufkochen lassen. Einige Minuten köcheln lassen, dann die Sahne einrühren und mit Salz, Pfeffer und Zucker abschmecken. Den restlichen Mais und evtl. Petersilie unterrühren und noch einmal kurz aufkochen lassen. Die Suppe mit Speck bestreut anrichten."}' WHERE id = 174;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1144691220796478/bilder/1016007/crop-960x540/maiscremesuppe-mit-bacon.jpg' WHERE id = 174 AND (image_url IS NULL OR image_url = '');

-- [26/63] ID 178: Kohlrabicremesuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 178);
DELETE FROM ingredients WHERE recipe_id = 178;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Kohlrabi', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Butter', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Zucker', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Gemüsebrühe', 0.5, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Schlagsahne', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Salz und Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (178, 'Zitronensaft', 1, 'etwas');
UPDATE recipes SET steps = '{"Die Zwiebel würfeln, die Kohlrabi waschen und kleinschneiden.  Butter in einem Suppentopf erhitzen, die Zwiebeln darin anschwitzen. Die Kohlrabistücke dazugeben und kurz mitbraten. Zucker darüber streuen und schmelzen lassen. Die Brühe angießen und die Suppe etwa 15 Minuten köcheln lassen. Dann vom Herd nehmen und pürieren. Die Sahne zugießen, die Suppe aufkochen lassen und mit Salz, Pfeffer und Zitronensaft abschmecken."}' WHERE id = 178;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/963541202022292/bilder/1120239/crop-960x540/kohlrabicremesuppe.jpg' WHERE id = 178 AND (image_url IS NULL OR image_url = '');

-- [27/63] ID 189: Markklößchensuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 189);
DELETE FROM ingredients WHERE recipe_id = 189;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Rinderbrust (oder Rindersuppenfleisch)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'dicke Markknochen', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Bündel Suppengrün (Lauch, Sellerie, Möhre, Petersilienwurzel)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Wasser', 1.5, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Brötchen (alt)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Paniermehl (Weckmehl)', 40, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Salz', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Pfeffer', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Muskat', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Petersilie', 1, 'Bund');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (189, 'Schnittlauch', 1, 'Bund');
UPDATE recipes SET steps = '{"Zunächst wird mit der Brühe angefangen. Dazu das Mark aus den Markknochen herauslösen und in einem kleinen Topf aufbewahren. Dann das Suppengrün waschen und grob zerkleinern.
Das Fleisch, die Markknochen und das vorbereitete Suppengrün kalt mit 1 1/2 Litern Wasser ansetzen und ca. 2 Stunden zugedeckt bei geringer Hitze köcheln lassen.
Im Anschluss das Fleisch und die Knochen herausnehmen, die Flüssigkeit durch ein Sieb abseihen und die Brühe mit Salz, Pfeffer und Muskat abschmecken.  Das Fleisch entweder als zusätzliche Einlage gewürfelt in die Suppe geben oder für ein anderes Gericht verwenden. Das zuvor herausgelöste Knochenmark klein schneiden und in dem Töpfchen schmelzen lassen. Im Anschluss das geschmolzene Mark etwas abkühlen lassen. In der Zwischenzeit das halbe Brötchen in Wasser einweichen und sehr gut ausdrücken. Das weiche Brötchen, das Ei, das Weckmehl und einen kleinen Teil der Petersilie und des Schnittlauchs mit dem ausgelassenen Rindermark verrühren. Die Masse mit etwas Muskat würzen. Nun formt man ein Probeklößchen und gibt es in die kochende Brühe. Gelingt dieses, formt man die restlichen Klößchen und lässt diese für ca. 10 Minuten in der Brühe ziehen. Sollte das Probeklößchen verkochen, muss man noch etwas Weckmehl zum Teig geben. Zum Schluss wird die Suppe noch mit etwas Petersilie und Schnittlauch verfeinert."}' WHERE id = 189;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2695761422382381/bilder/867565/crop-960x540/traditionelle-markkloesschensuppe.jpg' WHERE id = 189 AND (image_url IS NULL OR image_url = '');

-- [28/63] ID 190: Leberreissuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 190);
DELETE FROM ingredients WHERE recipe_id = 190;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Margarine', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Zwiebel(n) (grob zerkleinert)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Knolle/n Sellerie (grob zerkleinert)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Stange/n Lauch (grob geschnitten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Möhre(n) (grob geschnitten)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Gemüsebrühe (gekörnte)', 4, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Wasser', 4, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Petersilie (fein gehackt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Kalbsleber (alternativ Schweineleber)', 350, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Brötchen (gewürfelte)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Milch', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Zwiebel(n) (grob gewürfelt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Knoblauchzehe(n) (geschält)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Margarine (sehr weiche)', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Semmelbrösel', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Majoran (gerebelter)', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (190, 'Muskat', 0.5, 'TL');
UPDATE recipes SET steps = '{"Das Suppengemüse grob zerkleinern. Die Margarine in einem großen Topf erhitzen und das Gemüse kräftig anbraten. Mit dem Wasser aufgießen und die gekörnte Brühe hinzu fügen. 1 ½  Stunden kochen lassen.  In dieser Zeit die Leberfarce herstellen. Die Brötchenwürfel mit etwas Milch übergießen, weichen lassen und ausdrücken. Die Leber in kleinere Stücke schneiden und  mit der Zwiebel, der Knoblauchzehe und den ausgedrückten Brötchenwürfeln durch den Fleischwolf drehen. Die weiche Margarine mit dem Handrührgerät schaumig schlagen, anschließend die Eier hinzufügen und weiter schlagen. Jetzt die Leberfarce hinzufügen und mit einem Kochlöffel die Zutaten vermischen. Semmelbrösel und Gewürze hinzufügen und abschmecken. Die Masse abgedeckt 30 Minuten kühl ruhen lassen. Anschließend muss die Masse schwer reißend vom Löffel fallen. Das Gemüse nun mit einem Schaumlöffel aus der Suppe heben. Eine grobe Gemüsereibe auf den Topfrand legen und die feste Masse in kleinen Portionen mit einem Holzspatel durch das Sieb in die kochende Brühe streichen (ähnlich wie Spätzle). Immer mal wieder zwischendurch den durchgestrichenen Leberreis unterrühren. Jetzt den Majoran hinzufügen und mit Pfeffer und Salz abschmecken. Nach etwa 5 Minuten schwimmt der Leberreis komplett oben. Noch einen EL Margarine dazu geben. Die Hitze ganz wegnehmen und die Suppe auf der Platte 10 Minuten ziehen lassen. Anschließend die Suppe mit etwas Petersilie servieren. Die Suppe eignet sich auch gut zum Einfrieren. Zum nochmaligen Verzehr nur noch erhitzen, nicht mehr kochen lassen."}' WHERE id = 190;
UPDATE recipes SET portions = 8 WHERE id = 190;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1363351241158319/bilder/1414074/crop-960x540/runis-leberreissuppe.jpg' WHERE id = 190 AND (image_url IS NULL OR image_url = '');

-- [29/63] ID 195: Ribollita
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 195);
DELETE FROM ingredients WHERE recipe_id = 195;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Bohnen, weiße', 1, 'Dose');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Zwiebel(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Stange/n Staudensellerie', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Wirsing', 1, 'kleiner');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Karotte(n)', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Dose/n Tomaten, geschälte', 1, 'kl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Tomatenmark', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Olivenöl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (195, 'n. B. Gemüsebrühe (oder Fleischbrühe)', 1, 'Stück');
UPDATE recipes SET steps = '{"Die weißen Bohnen auf ein Sieb schütten, kurz abbrausen und anschließend abtropfen lassen. Die Hälfte davon mit einem Mixstab pürieren.  Die Zwiebeln schälen, klein hacken und in Olivenöl anbraten. Den Wirsing in Streifen schneiden. Die Möhren schälen und in kleine Stücke schneiden. Den Staudensellerie putzen und klein schneiden. Die Tomaten etwas zerkleinern. Alles zusammen mit dem Tomatenmark zu den Zwiebeln geben, dann nach Bedarf mit Gemüsebrühe (oder Fleischbrühe - dann ist dieser Eintopf aber weder vegetarisch noch vegan) aufgießen und weich kochen. Die Bohnen (pürierte und ganze) zum Gemüse geben. Mit Salz und Pfeffer abschmecken. Etwas Olivenöl darüber träufeln und servieren.  Dazu gibt es Ciabatta."}' WHERE id = 195;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1060781211362414/bilder/970636/crop-960x540/ribollita.jpg' WHERE id = 195 AND (image_url IS NULL OR image_url = '');

-- [30/63] ID 199: Gazpacho
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 199);
DELETE FROM ingredients WHERE recipe_id = 199;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Strauchtomate(n)', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Gemüsezwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Salatgurke(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Paprikaschote(n) (nach Wahl)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Knoblauchzehe(n)', 6, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Chilischote(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Balsamico (oder Weinessig)', 15, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Olivenöl', 6, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Scheibe/n Toastbrot', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Dose/n Tomaten, geschälte (oder 1 Pck. passierte Tomaten)', 1, 'kl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (199, 'Gemüsebrühe (kalte)', 0.5, 'Liter');
UPDATE recipes SET steps = '{"Vorab folgende Bemerkung: Alle Mengen sind Circa-Angaben und können nach Geschmack variiert werden! Das Gemüse putzen und in Stücke schneiden. Die Tomaten brauchen nicht geschält zu werden!. Alle Zutaten in einem Mixer pürieren. Das muss wegen der Mengen in mehreren Partien geschehen, und zu jeder Partie auch etwas von der Brühe geben. Auch das Toastbrot zugeben und mitpürieren, es dient der Bindung. Am Schluss das Öl bei laufendem Mixer einfließen lassen.  In einer großen Schüssel alles gut verrühren und mindestens eine Stunde im Kühlschrank gut durchkühlen lassen.  Thelses Gazpacho ist mit frischem Baguette an heißen Tagen ein Hochgenuss. Tipps: Wer mag, kann in kleine Würfel geschnittene Tomate, Gurke und Zwiebel separat dazureichen.
Die Suppe eignet sich hervorragend zum Einfrieren, sodass ich immer diese große Menge zubereite, um den Arbeitsaufwand gering zu halten. Bei 6 Portionen hat eine Portion 230 Kcal."}' WHERE id = 199;
UPDATE recipes SET portions = 6 WHERE id = 199;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/692601171870544/bilder/1131186/crop-960x540/thelses-gazpacho.jpg' WHERE id = 199 AND (image_url IS NULL OR image_url = '');

-- [31/63] ID 201: Thai-Kokossuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 201);
DELETE FROM ingredients WHERE recipe_id = 201;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Frühlingszwiebel(n)', 1, 'Bund');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Stange/n Zitronengras', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Ingwer (ca. 1 cm)', 1, 'Stück(e)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Hähnchenbrustfilet(s)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Öl zum Braten', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Hühnerbrühe (instant)', 0.5, 'Glas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Champignons', 1, 'Dose');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Sojasprossen', 1, 'Glas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Bambussprosse(n)', 1, 'Glas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'Kokosmilch', 1, 'Dose');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (201, 'gehäuft Currypaste (rote)', 1, 'TL');
UPDATE recipes SET steps = '{"Frühlingszwiebeln und Zitronengras in Ringe schneiden, den Ingwer klein würfeln. Die Hähnchenbrüste in kleine Stücke schneiden und kurz in etwas Öl anbraten. Mit ca. 2 Liter Wasser aufgießen und Instantbrühe, Ingwer, Zwiebeln, Zitronengras, Champignons, Sojasprossen und Bambussprossen ebenfalls hinzugeben. Die Suppe zum Kochen bringen und 10 Minuten köcheln lassen.  Die Kokosmilch unterrühren und mit der Currypaste abschmecken."}' WHERE id = 201;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1611671268386645/bilder/1329835/crop-960x540/thai-kokos-suppe.jpg' WHERE id = 201 AND (image_url IS NULL OR image_url = '');

-- [32/63] ID 203: Pilzrahmsuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 203);
DELETE FROM ingredients WHERE recipe_id = 203;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Champignons', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Zwiebel(n) (geschälte)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Butter', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Mehl', 40, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Gemüsebrühe (Instant)', 0.75, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Schlagsahne', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Sahneschmelzkäse (- Ecken (à 62.5g))', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Zweig/e Petersilie', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (203, 'Scheibe/n Toastbrot', 2, 'Stück');
UPDATE recipes SET steps = '{"Pilze putzen, in Scheiben schneiden. Zwiebel fein würfeln.  30g Butter erhitzen. Zwiebel darin anbraten. Die Pilze zufügen, ca. 5 min. mitbraten. Salzen, pfeffern. Mit Mehl bestäuben und anschwitzen. Unter Rühren mit Brühe und Sahne ablöschen. Aufkochen. Schmelzkäse in der Suppe schmelzen lassen. Abschmecken.  Petersilienblättchen abzupfen, zur Suppe geben.  Toastbrot entrinden. Brot in Dreiecke schneiden. Rest Butter erhitzen. Brot darin rösten. Zur Suppe reichen."}' WHERE id = 203;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/767211179577825/bilder/1408641/crop-960x540/pilzrahmsuppe-mit-kaese.jpg' WHERE id = 203 AND (image_url IS NULL OR image_url = '');

-- [33/63] ID 209: Süßkartoffelsuppe
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 209);
DELETE FROM ingredients WHERE recipe_id = 209;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Karotte(n)', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Süßkartoffel(n)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Gemüsebrühe', 1.5, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Gemüsezwiebel(n)', 1, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Petersilie (krause)', 1, 'Bund');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Tomatenmark', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Olivenöl', 0.5, 'Tasse');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Crème fraîche', 2, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'gehäuft Ingwerwurzel', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'gehäuft Paprikapulver, edelsüßes', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Currypulver', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (209, 'Salz und Pfeffer, schwarzer', 1, 'etwas');
UPDATE recipes SET steps = '{"Die Karotten und die Süßkartoffeln schälen und in kleine Würfel schneiden. Die Zwiebel und die Petersilie fein hacken.  In einem großen Topf die Zwiebelwürfel in dem Olivenöl glasig andünsten, dann das Tomatenmark zugeben und kurz mitrösten. Es darf nicht anbrennen, da es sonst sehr bitter wird. Jetzt die Karotten- und Süßkartoffelwürfel in den Topf geben und ca. 4 min. mitdünsten, danach die Gemüsebrühe hinzugießen und bei mittlerer Hitze ca. 30 Minuten köcheln lassen, bis das Gemüse schön weich ist und leicht zerfällt. Alles mit einem Pürierstab pürieren, bis eine sämige Konsistenz erreicht ist. Den Ingwer mit einer feinen Küchenreibe reiben und 1 TL davon in den Topf geben. Das Curry- und Paprikapulver, die Crème fraîche und die fein gehackte Petersilie hinzugeben, gut durchrühren und mit Salz und Pfeffer abschmecken.  Dazu passt ein Klecks Schmand und ein Stück Ciabatta."}' WHERE id = 209;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1893141308256403/bilder/1050587/crop-960x540/karotten-suesskartoffelsuppe.jpg' WHERE id = 209 AND (image_url IS NULL OR image_url = '');

-- [34/63] ID 217: Surschnitzel
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 217);
DELETE FROM ingredients WHERE recipe_id = 217;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (217, 'Schweinefleisch (im ganzen)', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (217, 'Zwiebel(n) (fein gehackt)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (217, 'Wacholderbeere(n) (im Mörser zerstoßen)', 10, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (217, 'Zehe/n Knoblauch (gepresst)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (217, 'Wasser', 1, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (217, 'Salz', 2, 'EL');
UPDATE recipes SET steps = '{"Reibe das ganze Bratenstück mit Zwiebel, Knoblauch und Wacholderbeeren rundum ein.  Koche das Wasser im Topf mit Salz zusammen auf, dann erkalten lassen. Fleisch mit Zwiebeln, Knoblauch und Wacholder in eine Backofenform geben. Leere das erkaltete Salzwasser darauf. Drücke das Fleisch mit schweren Gegenstand in der Form platt. Lassen das Fleisch nun 3 Wochen in der Salzlake liegen. Drehe es während dieser Zeit ab und zu um! Danach.... Nimm das Fleischstück aus der Lake, spüle es mit kaltem Wasser gut ab.  BACKROHR: Backe es in einem gefetteten Bräter bei 200°C ca. 90 Min, bis es ein knuspriger Braten geworden. Fertig. INFO: SURFLEISCH: Gepökeltes Schweinefleisch. (Durch Einsalzen haltbar gemacht). Es hat primär jedoch den Effekt, dass das Fleisch ein rötliches Aussehen bekommt und zudem sehr mürbe und weich am Teller mundet. Variante: Schneide aus dem gesurten Fleischstück Schnitzel, plattiere, würze mit Salz & Pfeffer und paniere diese. Backe jene in Butaris heraus. Auch eine Delikatesse in Österreich."}' WHERE id = 217;
UPDATE recipes SET portions = 6 WHERE id = 217;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/images/crop-960x540/assets/v2/img/placeholders/16x9/s.png' WHERE id = 217 AND (image_url IS NULL OR image_url = '');

-- [35/63] ID 224: Spanferkel
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 224);
DELETE FROM ingredients WHERE recipe_id = 224;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (224, 'Spanferkel (Rollbraten)', 1500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (224, 'Zwiebel(n) (grob zerkleinert)', 2, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (224, 'Gemüsefond', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (224, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (224, 'Rapsöl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (224, 'Speisestärke', 1, 'Stück');
UPDATE recipes SET steps = '{"Das Fleisch abwaschen, trocken tupfen und salzen. In einem mittelgroßen Bräter das Öl erhitzen, das Fleisch von allen Seiten anbraten und herausnehmen. Nun die Zwiebeln hierin stark bräunen und mit dem Gemüsefond ablöschen. Das Fleisch ringsum pfeffern, wieder in den Bräter geben und im vorgeheizten Backofen offen bei 180 Grad in ca. 90 Min. schmoren. Das Fleisch herausnehmen, verkochten Gemüsefond evtl. ergänzen und durch ein Sieb geben. Die Speisestärke mit Wasser anrühren, die Soße damit binden und mit Salz und Pfeffer abschmecken."}' WHERE id = 224;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2283061364138460/bilder/1342412/crop-960x540/spanferkel-rollbraten-a-la-gabi.jpg' WHERE id = 224 AND (image_url IS NULL OR image_url = '');

-- [36/63] ID 227: Schweinemedaillons
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 227);
DELETE FROM ingredients WHERE recipe_id = 227;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Schweinefilet(s)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Butterschmalz', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'm.-große Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Schlagsahne', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Fleischbrühe', 150, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Gemüsebrühe', 50, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Milch', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Glas Weißwein (trocken oder Weinbrand)', 1, 'kl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Balsamico (dunkel)', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Pfeffer (grüner aus dem Glas, grob zerdrückt)', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Körner Pimentpulver', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Mehl', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Eigelb', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Salz und Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Zucker', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'Paprikapulver (edelsüß)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (227, 'evtl. Saucenbinder (oder 1 - 2 Eigelb zum Andicken)', 1, 'Stück');
UPDATE recipes SET steps = '{"Das Filet waschen, trocken tupfen und in 2,5 cm dicke Scheiben schneiden. Mit den Handballen flach drücken, salzen und pfeffern. Die Medaillons in Mehl wenden und danach das Mehl etwas abklopfen.  Eine weite Pfanne mit dem Butterschmalz gut vorheizen und die Medaillons von beiden Seiten ca. 1 Min. pro Seite scharf anbraten. Bitte nicht zu lange, da sie sonst zu trocken werden. Das Filet aus der Pfanne nehmen, in Alufolie einwickeln und warmstellen. Den Bratensatz ablösen und die fein gehackte Zwiebel mit dem Piment und den Pfefferkörnern anrösten. Danach das Ganze mit Balsamico und Weißwein ablöschen, kurz aufkochen und die Brühe dazugeben. Den Sud auf etwa die Hälfte reduzieren lassen. Danach die Sahne in die Pfanne geben und mit Salz, Pfeffer, Zucker und Paprikapulver würzen. Die Soße bei starker Hitze etwas einkochen lassen und zwischendurch umrühren. Nun nach und nach die Milch dazugeben. Die Soße vom Herd nehmen. Das Eigelb und 3 EL Soße in einer Tasse schnell vermengen, da es sonst stockt. Die Mischung in die Pfanne einrühren und das Ganze wieder auf die Kochplatte stellen. Je nach gewünschter Konsistenz weiterkochen oder noch etwas Milch dazugeben und eventuell noch einmal abschmecken. Danach die Schweinemedaillons mit dem entstandenen Bratensaft in die Pfanne geben und noch mal umrühren. Am besten passen dazu breite Bandnudeln. Besonders gut schmeckt die Soße, wenn man den Wein durch 8 cl Weinbrand ersetzt. Der grüne Pfeffer kann je nach Hersteller weicher oder härter sowie schärfer oder milder sein.  Man kann alternativ aber auch roten Pfeffer im Glas oder rote Beeren verwenden. Das macht erstens optisch was her und ist zweitens etwas milder für die, die es nicht so scharf mögen.  Anstelle der Sahne kann man auch Creme fraîche, oder für eine fettarme Variante Cremefine nehmen. Auch damit schmeckt die Soße sehr gut."}' WHERE id = 227;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1804981291897425/bilder/868833/crop-960x540/schweinemedaillons-in-pfefferrahmsauce.jpg' WHERE id = 227 AND (image_url IS NULL OR image_url = '');

-- [37/63] ID 229: Entenkeule
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 229);
DELETE FROM ingredients WHERE recipe_id = 229;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Entenkeule(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Entenfond', 400, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Apfel', 1, 'kleiner');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Wacholderbeere(n)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Pimentkörner', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Lorbeerblatt', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (229, 'n. B. Speisestärke', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Ofen auf 170 °C Umluft vorheizen. Die Entenkeulen waschen, trockentupfen, überschüssiges Fett parieren und von beiden Seiten salzen und pfeffern. Das Fett in einer kleinen Pfanne auslassen und die Schenkel nacheinander von beiden Seiten kurz anbraten. Den Apfel schälen und in kleine Stücke schneiden.  Die Entenkeulen, den kleingeschnittenen Apfel, Wachholderbeeren und Piment in eine flache Auflaufform geben, den Fond angießen und für ca. 90 min im Ofen garen. Für die Soße die Keulen aus dem Fond nehmen und auf einem Teller zurück in den Ofen stellen.  Den Fond in eine Pfanne oder Topf geben. Wachholder, Piment und Lorbeerblatt entfernen und auf voller Stufe für ca. 10 min reduzieren. Anschließend mit dem Pürierstab den Apfel in der Soße pürieren, das Ganze mit etwas Speisestärke binden und nochmal aufkochen. Mit Salz und Pfeffer abschmecken und zu den Keulen servieren."}' WHERE id = 229;
UPDATE recipes SET portions = 2 WHERE id = 229;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3599211541199502/bilder/1591732/crop-960x540/entenkeulen-aus-dem-ofen.jpg' WHERE id = 229 AND (image_url IS NULL OR image_url = '');

-- [38/63] ID 231: Rehragout
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 231);
DELETE FROM ingredients WHERE recipe_id = 231;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Butter', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Puderzucker', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Rehfleisch (klein geschnitten)', 800, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Schalotte(n)', 8, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Wurzelwerk (gewürfelt)', 5, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Tomatenmark', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Rotwein', 125, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Brühe', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Wacholderbeere(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Lorbeerblätter', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Gewürznelke(n)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Speck', 30, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Zartbitterschokolade', 20, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Champignons (oder andere Pilze)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Butter zum Braten', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Waldbeeren (Heidelbeeren)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'Preiselbeeren (Glas)', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'n. B. Mehlbutter', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (231, 'n. B. Salz', 1, 'Stück');
UPDATE recipes SET steps = '{"Butter in einem Topf schmelzen lassen, etwas Puderzucker dazu geben. Das Fleisch von allen Seiten kräftig anbraten, herausnehmen und zur Seite stellen.  Die Schalotten und das Wurzelgemüse kurz im Topf wenden, das Tomatenmark dazugeben und anrösten. Langsam mit Rotwein löschen: Immer nur ganz wenig Rotwein in den Topf geben und rühren, bis der Rotwein verdampft ist, dann wieder mit Rotwein löschen, bis eine gute Farbe entsteht. Das Fleisch wieder dazu geben und mitbräunen, dann noch einmal mit etwas Rotwein aufgießen. So viel Brühe dazu geben, dass das Fleisch knapp bedeckt ist. Kräuter, Speck, die Gewürze und die Schokolade dazu geben. 40 Minuten köcheln lassen (bei sehr feinem Rehfleisch reicht aber auch eine halbe Stunde). Die Champignons in Butter in einer Pfanne kurz rösten. Die Beeren (am besten eine Mischung aus Blaubeeren und Preiselbeeren) in das Ragout geben. Mit Mehlbutter binden. Die Champignons kurz vor dem Servieren dazu geben, erst dann mit Salz abschmecken. Dazu passen Spätzle oder gekochte Kartoffelknödel."}' WHERE id = 231;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/34551011608219/bilder/1553692/crop-960x540/feines-rehragout-mit-beeren.jpg' WHERE id = 231 AND (image_url IS NULL OR image_url = '');

-- [39/63] ID 235: Putengeschnetzeltes
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 235);
DELETE FROM ingredients WHERE recipe_id = 235;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Putenschnitzel', 300, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Tomatenmark', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Senf', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'm.-große Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Sahne', 200, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Cherrytomate(n) (oder Mini-Rispentomaten)', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'gehäuft Knoblauch (gewürfelt)', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Schmelzkäse (Paprika- oder Sahneschmelzkäse)', 25, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Sonnenblumenöl', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Olivenöl', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Paprikapulver', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (235, 'Oregano', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Putenschnitzel in Streifen schneiden, kräftig salzen und pfeffern. Das Sonnenblumenöl in einer großen beschichteten Pfanne erhitzen und die Putenstreifen darin gut anbraten. Währenddessen die Zwiebel in grobe Würfel und die Tomaten in Viertel oder Achtel schneiden (je nach Größe).  Das Tomatenmark zu den Putenstreifen geben und ca. 3 Minuten mitbraten, dabei gelegentlich umrühren. Zwiebeln und Knoblauch dazugeben und ebenfalls braten, bis die Zwiebeln leicht angeröstet sind. Senf, Olivenöl, Tomaten, Sahne und Schmelzkäse dazugeben und ca. 5 - 10 Minuten bei mittlerer Hitze unter gelegentlichem Rühren köcheln lassen, bis der Käse geschmolzen ist. Mit Paprikapulver, Oregano und Pfeffer abschmecken.  Dazu passen Nudeln."}' WHERE id = 235;
UPDATE recipes SET portions = 3 WHERE id = 235;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2185151350881557/bilder/1533252/crop-960x540/sahniges-putengeschnetzeltes.jpg' WHERE id = 235 AND (image_url IS NULL OR image_url = '');

-- [40/63] ID 236: Hühnergeschnetzeltes
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 236);
DELETE FROM ingredients WHERE recipe_id = 236;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Kräuterfrischkäse', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Cremefine (zum Kochen oder Schlagsahne)', 200, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Paprikaschote(n), rote', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Hähnchengeschnetzeltes (oder Innenfilet)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'n. B. Tomatenmark', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Paprikapulver, rosenscharfes', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Petersilie', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Basilikum', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (236, 'Rinderbrühe (oder Gemüsebrühe)', 200, 'ml');
UPDATE recipes SET steps = '{"Die Zwiebeln in kleine Würfel und die Paprika in sehr kleine Streifen schneiden. Dann die Zwiebeln mit etwas Öl nach Wahl glasig braten und die Paprika hinzufügen und braten, bis sie etwas weich geworden ist. Nun das Geschnetzelte gut mit Paprika rosenscharf, Pfeffer und Salz bzw. Hähnchenwürzsalz gut würzen. Dann die Pfanne leeren oder eine zweite verwenden und das Geschnetzelte anbraten. Danach das Geschnetzelte und das Gemüse zusammen in die große (tiefere) Pfanne oder einen geeigneten Topf geben und mit Brühe ablöschen. Frischkäse, Cremefinde und Tomatenmark zugeben und verrühren, bis eine homogene Soße entsteht. Alles noch mit den Kräutern und Gewürzen abschmecken und 5 Min. köcheln lassen. Dazu schmecken Nudeln jeglicher Art, sehr gerne auch Spätzle oder Reis."}' WHERE id = 236;
UPDATE recipes SET portions = 2 WHERE id = 236;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3649621549381103/bilder/1607018/crop-960x540/schnelles-huehnergeschnetzeltes.jpg' WHERE id = 236 AND (image_url IS NULL OR image_url = '');

-- [41/63] ID 246: Kalbsleber Berliner Art
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 246);
DELETE FROM ingredients WHERE recipe_id = 246;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Kartoffeln, mehligkochende', 800, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Milch', 150, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Butter', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'n. B. Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'n. B. Muskat', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Scheibe/n Kalbsleber (à ca. 150 g; küchenfertig, ohne Haut)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'n. B. Mehl (zum Wenden)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Butterschmalz (zum Braten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'n. B. Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Äpfel (z. B.: Royal Gala oder Braeburn)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Butter zum Braten', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Zucker (zum Bestreuen)', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'm.-große Zwiebel(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'n. B. Mehl (zum Bestäuben)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (246, 'Öl zum Braten', 1, 'Stück');
UPDATE recipes SET steps = '{"Für das Püree die Kartoffeln schälen, waschen, vierteln und in Salzwasser in etwa 25 Min. weich kochen. Wasser abgießen, Kartoffeln auf dem Herd etwas ausdämpfen lassen, dann mit einem Stampfer grob zerdrücken oder durch die Kartoffelpresse drücken. Backofen auf 80 °C Ober-/Unterhitze vorheizen.  Milch aufkochen und zusammen mit der Butter in Stückchen unter die Kartoffeln rühren, mit Salz, Pfeffer und Muskat würzen. Püree in einer Metallschüssel im Backofen warm halten. Die Äpfel waschen, nach Belieben schälen, Kerngehäuse ausstechen, Äpfel in ca. 1 cm dicke Ringe schneiden. Zwiebeln abziehen, in dünne Ringe schneiden, mit etwas Mehl bestäuben. Zwiebeln in etwas heißem Öl goldbraun braten, salzen und pfeffern. Äpfel in etwas Butter goldbraun anbraten, mit Zucker bestreuen und karamellisieren lassen. Die Kalbsleberscheiben halbieren, in Mehl wenden, überschüssiges Mehl abklopfen. Leber bei mittlerer Hitze in heißem Butterschmalz auf jeder Seite etwa 2 Min. braten und mit Salz und Pfeffer würzen.  Leber mit Zwiebelringen, Apfelscheiben sowie Kartoffelpüree anrichten und mit Pfeffer bestreuen."}' WHERE id = 246;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1980531321367353/bilder/1078137/crop-960x540/kalbsleber-berliner-art-von-sarah.jpg' WHERE id = 246 AND (image_url IS NULL OR image_url = '');

-- [42/63] ID 248: Bauernschmaus
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 248);
DELETE FROM ingredients WHERE recipe_id = 248;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Kartoffel(n)', 750, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Speck (durchwachsener)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Ei(er)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Milch', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Schinken (gewürfelt)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Tomate(n) (gewürfelt)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (248, 'Petersilie (fein gehackt)', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Kartoffeln waschen und in der Schale 30 Minuten kochen. Dann mit kaltem Wasser abschrecken und pellen. Abkühlen lassen, dann in Scheiben schneiden.  Den Speck würfeln, in einer Pfanne anbraten, die Kartoffelscheiben hinzufügen, salzen und hellbraun rösten. Die Eier mit der Milch und etwas Salz verquirlen. Die Schinkenwürfel hinzugeben. Die Tomaten in die Eiermilch geben und über die Kartoffeln gießen. Wenn die Eiermasse gestockt ist, ist der Bauernschmaus gar.  Mit Petersilie bestreut anrichten."}' WHERE id = 248;
UPDATE recipes SET portions = 3 WHERE id = 248;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/874021192779519/bilder/912275/crop-960x540/bauernschmaus.jpg' WHERE id = 248 AND (image_url IS NULL OR image_url = '');

-- [43/63] ID 257: Dorschfilet
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 257);
DELETE FROM ingredients WHERE recipe_id = 257;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Fischfilet(s) ((Dorschfilet), in 4 Port. zerteilt)', 800, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Essig (zum Säuern)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Salz und Pfeffer (schwarzer aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Mehl (zum Wenden)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Paniermehl', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Käse (nach Wahl, gerieben)', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (257, 'Margarine (zum Braten)', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Fischfilets mit Essig beträufeln und 30 Min. marinieren. Drei Teller wie folgt vorbereiten: einen Teller mit Mehl, einen Teller mit verschlagenen Eiern und einen Teller mit Paniermehl und Käse, sorgfältig gemischt. Den Fisch abtrocknen, mit Salz und Pfeffer würzen, nacheinander in Mehl, Eiern und dem Paniermehl-Käse-Gemisch wenden.  Die Margarine in einer Pfanne erhitzen und den Fisch darin bei mittlerer Hitze von jeder Seite ca. 5 Min. goldbraun braten. Hierzu Spinat und Kräuterkartoffeln reichen."}' WHERE id = 257;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2609261409901546/bilder/796449/crop-960x540/dorschfilet-im-kaesemantel-a-la-gabi.jpg' WHERE id = 257 AND (image_url IS NULL OR image_url = '');

-- [44/63] ID 262: Matjesfilet
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 262);
DELETE FROM ingredients WHERE recipe_id = 262;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Matjesfilet(s)', 8, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Mineralwasser (oder Milch, evtl)', 0.25, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Äpfel', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Zwiebel(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Gewürzgurke(n)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Sahne', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'saure Sahne', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Mayonnaise', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Gurkenflüssigkeit', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Zucker', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (262, 'Dill', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Matjesfilets unter fließendem Wasser kurz abspülen. Ein Stück vom Fisch probieren, wenn er noch zu salzig ist, die Filets ca. 30 min. in eine Schüssel mit Mineralwasser oder Milch legen.  Aus Sahne, saurer Sahne, Mayonnaise und dem Gurkenwasser eine Sauce rühren und mit Zucker und frisch gemahlenem Pfeffer abschmecken. Salz ist in aller Regel nicht notwendig, da der Fisch noch genügend Salz in die Sauce abgibt. Die Äpfel waschen, schälen und entkernen und ebenso wie die Gewürzgurken in dünne Scheiben schneiden. Die Zwiebel abziehen, in feine Ringe schneiden und mit den Apfel- und Gurkenscheiben in die Sauce geben.  Anschließend die Matjesfilets unterheben und alles im Kühlschrank noch ca. 2 Std. durchziehen lassen. Vor dem Servieren mit Dill garnieren. Pellkartoffeln oder ein kräftiges Vollkornbrot dazu reichen."}' WHERE id = 262;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/901111195473292/bilder/525336/crop-960x540/matjesfilet-nach-hausfrauenart.jpg' WHERE id = 262 AND (image_url IS NULL OR image_url = '');

-- [45/63] ID 266: Spinatspätzle mit Käsesauce
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 266);
DELETE FROM ingredients WHERE recipe_id = 266;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Mehl', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Salz', 0.25, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Muskat', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Blattspinat (TK, aufgetaut)', 225, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Wasser', 2, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Salz', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Margarine', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Zwiebel(n) (gewürfelt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Brühe', 0.125, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Milch', 0.25, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Schmelzkäse', 75, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Kümmelpulver', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Champignons', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Weißwein', 4, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Speisestärke', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Sahne', 0.5, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (266, 'Käse (gerieben)', 50, 'g');
UPDATE recipes SET steps = '{"Spinatspätzle: Mehl, Salz, Muskat, Eier und Spinat in eine Rührschüssel geben und mit dem Rührbesen des Handrührgerätes zu einem zähflüssigen Teig verrühren. Salzwasser zum Kochen bringen. Die Hälfte des Teigs mithilfe des Spätzlehobels ins kochende Wasser hobeln. Spätzle sind gar, wenn sie oben schwimmen. Mit dem Seihlöffel herausnehmen, in einen Seiher geben, kalt überbrausen. Zweite Hälfte ebenso verarbeiten. Soße: Zwiebelwürfel in Margarine andünsten, mit Brühe und Milch aufgießen. Schmelzkäse zugeben und unter Rühren auflösen. Soße mit Salz, Pfeffer und Kümmelpulver würzen. Champignons blättrig schneiden und zur Soße geben. Stärke mit Wein zu einem klumpenfreien Stärketeiglein anrühren, Soße damit binden. Sahne zugeben.  Spinatspätzle mit Soße mischen, in Auflaufform geben. Nach Belieben mit geriebenem Käse bestreuen. Im vorgeheizten Ofen bei 200° (Heißluft 175°) 20 min überbacken."}' WHERE id = 266;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1622311269424124/bilder/534318/crop-960x540/spinatspaetzle-in-kaesesahnesosse-mit-champignons.jpg' WHERE id = 266 AND (image_url IS NULL OR image_url = '');

-- [46/63] ID 273: Tortellini in Sahnesauce
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 273);
DELETE FROM ingredients WHERE recipe_id = 273;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (273, 'Pkt. Tortellini', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (273, 'Schinken', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (273, 'Pilze', 1, 'Glas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (273, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (273, 'Sahne', 1, 'Becher');
UPDATE recipes SET steps = '{"Tortellini nach Packungsanweisung abkochen.  In einer Pfanne die gehackte Zwiebel anbraten, Schinken (gewürfelt) und Pilze (in Scheiben) dazugeben und ebenfalls leicht anbraten. Tortellini untermischen, mit Sahne übergießen und alles in der Pfanne ein paar Minuten vor sich hinbrutzeln lassen.  Dazu passt Salat."}' WHERE id = 273;
UPDATE recipes SET portions = 2 WHERE id = 273;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/344983786223/bilder/1518625/crop-960x540/tortellini-in-sahnesauce.jpg' WHERE id = 273 AND (image_url IS NULL OR image_url = '');

-- [47/63] ID 286: Serviettenknödel mit Schwammerlsauce
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 286);
DELETE FROM ingredients WHERE recipe_id = 286;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Semmel(n) (gewürfelt)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Ei(er)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Milch (heiße)', 150, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'm.-große Zwiebel(n) (oder 3 - 4 Schalotten)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Butter', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Petersilie (Schnittlauch, Muskat)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Mehl (griffiges)', 80, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Kartoffelmehl (oder Maisstärkemehl (Maizena)', 3, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Pfifferlinge (kleine, (Eierschwammerl))', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'saure Sahne', 0.25, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Rinderbrühe (oder Kalbsbrühe)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (286, 'Salz und Pfeffer', 1, 'Stück');
UPDATE recipes SET steps = '{"Eine Zwiebel oder die Hälfte der Schalotten hacken und in 4/5 der Butter goldig schwitzen. Semmelwürfel kurz mitschwenken und in eine größere Schüssel abfüllen.  Eine Masse aus den Eiern, der heißen Milch, Mehl, Salz und Muskat mit der klein gehackten Petersilie fertigen und über die Semmelwürfel gießen. Jetzt die kalt angerührte Stärke dazugeben, alles gut verrühren und ca. 20 Minuten ruhen lassen.  Bei Bedarf mit noch etwas Mehl binden. In der Zwischenzeit zwei Drittel der (gut, aber nicht unter Wasser gesäuberten) Pfifferlinge im Ganzen mit wenig Fett und der restlichen gehackten Zwiebel (Schalotten) in der restlichen Butter bissfest anrösten.   Anschließend den Teig auf ein sauberes, nasses (Geschirr-) Tuch aufbringen. Die Menge sollte so verteilt werden, dass daraus eine Rolle geformt werden kann, die in einem entsprechenden Gefäß gut untergetaucht werden kann.  Pfifferlinge jetzt abtropfen lassen, sie sollen möglichst flüssigkeitsfrei sein, mit reichlich klein gehacktem Schnittlauch vermengen, salzen (nicht zu viel!), pfeffern nach Geschmack und auf den Teig entlang der längeren Seite nicht ganz in der Mitte aufbringen.  Nun den belegten Teig mitsamt dem Tuch zu einer Rolle formen und links und rechts fest abbinden. Diese Rolle in kochendes Salzwasser hängen, dabei hilft ein Kochlöffel, der beim Abbinden der Rolle mitgebunden wird. Der Überstand links und rechts kann dann als Aufhängung in dem Kochgefäß dienen.  Nun ca. 20 Minuten ziehen lassen.  Nach dem Herausnehmen nicht sofort öffnen. Ich empfehle ca. 5 - 10 Minuten Rastzeit. Der Serviettenknödel sollte sehr fest geworden sein.  Jetzt das übrige Drittel der Pfifferlinge klein hacken, salzen, pfeffern und in Butter und feingehacktem Zwiebel anschwitzen und damit aus der Rinderbrühe und dem Rahm eine feste Soße einkochen. Würzung nach Geschmack. Den Serviettenknödel nun vorsichtig in reichlich kleingehacktem Schnittlauch rollen und dann in ca. 2 - 3 cm dicke Scheiben schneiden und auf heißen Tellern anrichten.  Die dicke Soße wird nur angegossen, nicht über die Knödelscheiben ziehen!  Dazu passt sehr gut grüner Salat und vorzüglich ein leichter Rotwein! "}' WHERE id = 286;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/images/crop-960x540/assets/v2/img/placeholders/16x9/s.png' WHERE id = 286 AND (image_url IS NULL OR image_url = '');

-- [48/63] ID 294: Erdäpfellaibchen
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 294);
DELETE FROM ingredients WHERE recipe_id = 294;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Kartoffel(n) (Erdäpfel)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Mehl (griffig)', 120, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Butter', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Wurst (z.B. Dürre)', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Muskat', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Mehl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (294, 'Öl (zum Ausbacken)', 1, 'Stück');
UPDATE recipes SET steps = '{"Erdäpfel kochen, schälen und noch heiß durch die Erdäpfelpresse drücken. Mit Mehl, Ei sowie streichfähiger Butter vermengen und mit Salz und Muskat kräftig würzen. Wurst kleinwürfelig schneiden und untermengen.  Teig auf einer bemehlten Arbeitsfläche zu einer etwa 15 cm langen Rolle formen. Diese in 12 Stücke teilen, zu Laibchen formen und in heißem Fett beidseitig knusprig ausbacken. Gut abtropfen lassen und mit Blattsalaten servieren.  Besonders gut passt auch Krautsalat. Schmeckt auch ohne Wurst."}' WHERE id = 294;
UPDATE recipes SET portions = 6 WHERE id = 294;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1646621272287506/bilder/1034808/crop-960x540/erdaepfellaibchen.jpg' WHERE id = 294 AND (image_url IS NULL OR image_url = '');

-- [49/63] ID 313: Überbackene Auberginen
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 313);
DELETE FROM ingredients WHERE recipe_id = 313;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Aubergine(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Mozzarella', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Parmesan (frisch gerieben)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Tomate(n) (gehackte)', 1, 'Dose');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Knoblauchzehe(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'n. B. Olivenöl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'n. B. Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Zucker', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Brühe (gekörnte)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'Basilikum (gehackt)', 1, 'viel');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (313, 'n. B. Semmelbrösel', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Auberginen in 1 cm dicke Scheiben schneiden. Im vorgeheizten Backofen auf einem mit Backpapier ausgelegten Blech 10 Min. bei 200°C backen. Aus den Tomaten (gehackt, nicht püriert), Zwiebel und Knoblauch eine Tomatensauce kochen (ohne Mehlzugabe) und mit den Gewürzen nach Bedarf abschmecken.  Die Auberginen beidseitig mit Olivenöl bestreichen. Den Boden einer mit Olivenöl gefetteten Form damit auslegen, salzen und pfeffern. Mit Mozzarellascheiben belegen und mit Parmesan bestreuen. Die Hälfte der Tomatensauce darauf verteilen. Eine zweite Schicht in derselben Reihenfolge auslegen. Zum Schluss mit Parmesan und Semmelbröseln bestreuen und mit Olivenöl beträufeln. Im heißen Backofen bei 200°C ca. 35-40 Min. backen Dazu passt Reis oder kann aber auch solo ohne Beilage verzehrt werden."}' WHERE id = 313;
UPDATE recipes SET portions = 2 WHERE id = 313;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1856961300956489/bilder/865086/crop-960x540/ueberbackene-auberginen.jpg' WHERE id = 313 AND (image_url IS NULL OR image_url = '');

-- [50/63] ID 320: Röstkartoffeln
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 320);
DELETE FROM ingredients WHERE recipe_id = 320;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (320, 'Kartoffel(n) (kleine)', 1.5, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (320, 'Paniermehl', 6, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (320, 'Zucker', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (320, 'Salz', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (320, 'Butter', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Kartoffeln kochen, dann pellen und in einer großen Schüssel mit dem Paniermehl, dem Zucker und dem Salz schütteln, bis sie gut überzogen sind. In eine große Pfanne zur erhitzten Butter geben und langsam schön kross braten.  Sie schmecken besonders zu Grünkohl mit Kochwurst und zu Schweinebacke oder Kasseler."}' WHERE id = 320;
UPDATE recipes SET portions = 6 WHERE id = 320;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1301471235210126/bilder/941510/crop-960x540/roestkartoffeln.jpg' WHERE id = 320 AND (image_url IS NULL OR image_url = '');

-- [51/63] ID 321: Rösterdäpfel
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 321);
DELETE FROM ingredients WHERE recipe_id = 321;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (321, 'Kartoffeln, festkochende', 400, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (321, 'Salz und Pfeffer', 2, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (321, 'gehäuft Majoranblättchen', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (321, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (321, 'Öl zum Braten', 1, 'Stück');
UPDATE recipes SET steps = '{"Am Vortag die Erdäpfel mit Schale halb gar kochen. Die Erdäpfel schälen und grob reiben. Die Zwiebel fein würfeln. In einer Schüssel Erdäpfel, Salz, Pfeffer, Majoran und Zwiebel vorsichtig mischen. Das Öl in einer gusseisernen oder beschichteten Pfanne (mit Deckel oder Omelettepfanne) erhitzen, die Erdäpfel darin flach verteilen. in ca. 10 Minuten auf niedriger Flamme knusprig braten. Mithilfe des Deckels vorsichtig umdrehen und von der anderen Seite langsam fertig rösten. Ideal als Beilage zu Tafelspitz."}' WHERE id = 321;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/images/crop-960x540/assets/v2/img/placeholders/16x9/r.png' WHERE id = 321 AND (image_url IS NULL OR image_url = '');

-- [52/63] ID 326: Schwenkkartoffeln
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 326);
DELETE FROM ingredients WHERE recipe_id = 326;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (326, 'Kartoffel(n)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (326, 'Kräuterbutter', 20, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (326, 'Butter (Knoblauchbutter)', 20, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (326, 'Butter', 20, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (326, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (326, 'n. B. Kräuter', 1, 'Stück');
UPDATE recipes SET steps = '{"Hier möchte ich euch mein Rezept nahelegen, für das mein Mann alles stehen lässt. Kartoffeln schälen und wie gewohnt kochen. In einer Pfanne Kräuterbutter, Knoblauchbutter und Butter schmelzen. Die gekochten Kartoffeln zugeben und schön darin braten. Wir mögen es, wenn sie eine leichte Kruste vom Braten haben. Zuletzt mit etwas Salz und Kräutern je nach Geschmack würzen. Heiß servieren. Schmeckt gut zu Kurzgebratenem und zu Braten. Ideal auch zur Resteverwertung von Kartoffeln."}' WHERE id = 326;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/890301194538960/bilder/1546122/crop-960x540/schwenkkartoffeln.jpg' WHERE id = 326 AND (image_url IS NULL OR image_url = '');

-- [53/63] ID 328: Kartoffelpüree mit Muskatnuss
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 328);
DELETE FROM ingredients WHERE recipe_id = 328;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (328, 'Kartoffeln, mehligkochende', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (328, 'Butter', 120, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (328, 'Milch', 120, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (328, 'Muskatnuss, frisch geriebene', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (328, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (328, 'Zweig/e Rosmarin', 1, 'Stück');
UPDATE recipes SET steps = '{"Zunächst die Kartoffeln schälen, halbieren und in einem Kochtopf in 20 - 25 Min gar dämpfen (kochen).  Milch und Butter in einem Topf erhitzen und die Gewürze dazugeben. Den Rosmarinzweig eine Weile mitkochen und dann wieder herausnehmen.  Die Kartoffeln stampfen, die Butter-Milch-Mischung hinzugeben und alles zu einem fluffigen Püree aufschlagen. Vor dem Servieren abschmecken."}' WHERE id = 328;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3405341507187439/bilder/1615905/crop-960x540/kartoffelpueree.jpg' WHERE id = 328 AND (image_url IS NULL OR image_url = '');

-- [54/63] ID 331: Hasselback-Kartoffeln
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 331);
DELETE FROM ingredients WHERE recipe_id = 331;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Kartoffeln, festkochende (ca. 1 kg)', 4, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Zweig/e Rosmarin', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Zweig/e Thymian', 6, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Zehe/n Knoblauchzehe(n)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Semmelbrösel', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Parmesan', 40, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Butter', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Olivenöl', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Salz und Pfeffer, schwarzer', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (331, 'Fett für das Blech', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Backofen auf 200 °C Ober-/Unterhitze vorheizen und ein Backblech einfetten. Die Kartoffeln schälen und längs halbieren. Jeweils eine Hälfte davon auf ein Brett legen und schräg einschneiden, aber nicht ganz durchschneiden. Unten muss noch eine zusammenhängende Kartoffelschicht sein. Ein flaches Messer unter die Hälfte schieben und auf das Blech legen. Die Scheiben etwas auseinanderdrücken.  Die Kräuter fein hacken. Den Knoblauch abziehen und ebenfalls fein hacken. Beides mit den Semmelbröseln mischen und über die Kartoffeln streuen. Den Parmesan fein reiben und ebenfalls über die Kartoffeln streuen.  Nun die Butter in einem kleinen Topf erhitzen und aufschäumen lassen. Das Olivenöl zugeben und mit Salz und Pfeffer mischen. Mit einem Löffel gleichmäßig über die Kartoffeln träufeln.  Das Blech in den heißen Backofen schieben und die Kartoffeln etwa 30 - 35 Min. bei nun 180 °C Umluft schön knusprig backen. Heiß servieren. Dazu passt hervorragend ein Knoblauchdip oder Tzatziki."}' WHERE id = 331;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1161321222245140/bilder/1129422/crop-960x540/hasselback-kartoffeln.jpg' WHERE id = 331 AND (image_url IS NULL OR image_url = '');

-- [55/63] ID 332: Kartoffelrösti
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 332);
DELETE FROM ingredients WHERE recipe_id = 332;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (332, 'Kartoffeln, vorwiegend festkochende', 3, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (332, 'gestr. Salz', 0.75, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (332, 'gestr. Thymian', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (332, 'Pflanzenöl (oder Butterschmalz)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (332, 'Zwiebel(n)', 0.5, 'kleine');
UPDATE recipes SET steps = '{"Die Kartoffeln schälen, waschen und raspeln. In einem feinen Sieb ausdrücken. Die Zwiebel in winzige Würfel schneiden und alles mit Salz und Thymian vermischen. Eine große beschichtete Pfanne stark erhitzen, Öl oder Butterschmalz hinzugeben und die Kartoffelmasse in 4 - 6 kleinen Fladen in die Pfanne geben und flach drücken. Nach 1 - 2 Minuten wenden. Auf niedrige Hitze zurückschalten. Nach weiteren 1 - 2 Minuten den Deckel auflegen und die Rösti in 5 - 10 Minuten fertig backen, evtl. noch 1 - 2 Mal wenden. Am Ende evtl. wieder ohne Deckel braten, damit sie schön knusprig werden."}' WHERE id = 332;
UPDATE recipes SET portions = 2 WHERE id = 332;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2649911416323243/bilder/1257276/crop-960x540/kartoffelroesti-ohne-ei-und-mehl.jpg' WHERE id = 332 AND (image_url IS NULL OR image_url = '');

-- [56/63] ID 338: Grießknödel
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 338);
DELETE FROM ingredients WHERE recipe_id = 338;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Butter', 40, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Grieß', 70, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Salz', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Pfeffer', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Muskat', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (338, 'Gemüsebrühe', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Zutaten verrühren und ca. 30 Minuten quellen/ziehen lassen. Danach mit einem Teelöffel kleine Grießknödel formen.  Die Grießknödel kurz in Gemüsebrühe aufkochen, dann kaltes Wasser dazugeben und mit Deckel etwa 25 Minuten ziehen lassen."}' WHERE id = 338;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2669351419009464/bilder/1444892/crop-960x540/griessknoedel.jpg' WHERE id = 338 AND (image_url IS NULL OR image_url = '');

-- [57/63] ID 341: Eierspätzle
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 341);
DELETE FROM ingredients WHERE recipe_id = 341;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Weizenmehl', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Salz', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Ei(er)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Wasser (lauwarmes)', 220, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Salz und Pfeffer (weißer)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Butter', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (341, 'Wasser (zum Kochen)', 1, 'Stück');
UPDATE recipes SET steps = '{"Alle Zutaten bis auf das Kochwasser in der Rührschüssel so lange schlagen (Kochlöffel mit Loch in der Mitte oder auch Mixer möglich), bis Luftblasen entstehen. Dann ca. 10 Minuten ruhen lassen.Der Teig sollte sich ziehen lassen, ohne zu reißen! Die Spätzlereibe auf einen Topf mit ca. 4 Litern kochendem Wasser legen. Den Teig mit dem Teigspatel portionieren und langsam durch die Löcher streichen. Die Spätzle einmal aufkochen lassen, die oben schwimmenden Spätzle mit einem Schaumlöffel in eine Schüssel mit Siebeinsatz geben und warmhalten. Den Vorgang wiederholen, bis der Teig verbraucht ist. Mit Butter und nach Bedarf mit Salz und weißem Pfeffer nachwürzen."}' WHERE id = 341;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1777901287718397/bilder/1284425/crop-960x540/eierspaetzle.jpg' WHERE id = 341 AND (image_url IS NULL OR image_url = '');

-- [58/63] ID 347: Safranreis
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 347);
DELETE FROM ingredients WHERE recipe_id = 347;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Basmati', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Safranfäden (oder 1/4 TL Safranpulver)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Ghee (oder Butterschmalz)', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Zwiebel(n) (fein gewürfelt)', 1, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Gewürznelke(n)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Zimt (ganz)', 1, 'Stück(e)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (347, 'Salz', 1, 'TL');
UPDATE recipes SET steps = '{"Safranfäden für 15 Minuten in 3 EL heißem Wasser einweichen. Ghee oder Butterschmalz erhitzen und darin die Zwiebelwürfel andünsten. Nelken, Zimtstange, Safranfäden samt Einweichwasser und Salz dazugeben, umrühren. Reis zugeben und gut umrühren, so dass der Reis gleichmäßig mit dem Fett überzogen ist. Mit 900 - 1000 ml kochendem Wasser auffüllen. Aufkochen lassen. Mit geschlossenem Deckel rund 20 Minuten ziehen lassen.  Zimtstange entnehmen und anrichten."}' WHERE id = 347;
UPDATE recipes SET portions = 8 WHERE id = 347;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1179171224056097/bilder/1352735/crop-960x540/safranreis.jpg' WHERE id = 347 AND (image_url IS NULL OR image_url = '');

-- [59/63] ID 362: Rahmsauerkraut
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 362);
DELETE FROM ingredients WHERE recipe_id = 362;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Butter', 25, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Weißwein (trocken)', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Gemüsefond (oder Gemüsebrühe)', 300, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Sauerkraut (frisches aus der Kühltheke)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Lorbeerblatt', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Wacholderbeere(n)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'n. B. Kümmel', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Sahne', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (362, 'Salz und Pfeffer', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Butter in einem Topf zerlassen. Zwiebel fein würfeln und in der Butter bei milder Hitze glasig dünsten. Mit dem Weißwein ablöschen, dann die Gemüsebrühe, Sauerkraut, Lorbeerblatt, Wacholderbeeren und evtl. Kümmel zufügen. Im geschlossenen Topf bei kleiner Hitze ca. 20 Minuten köcheln lassen. Die Sahne angießen und weitere 5 Minuten köcheln. Mit Salz und Pfeffer abschmecken."}' WHERE id = 362;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2437901384355508/bilder/633648/crop-960x540/rahmsauerkraut.jpg' WHERE id = 362 AND (image_url IS NULL OR image_url = '');

-- [60/63] ID 367: Rahmwirsing
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 367);
DELETE FROM ingredients WHERE recipe_id = 367;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Wirsing (geputzt, feingehackt)', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Zwiebel(n) (gehackt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Speck (fetter, ca. 100 g)', 1, 'Stück(e)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Fleischbrühe', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Milch', 75, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Mehl', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Butter', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Sahne', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Muskat', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (367, 'Natron', 1, 'Stück');
UPDATE recipes SET steps = '{"Zwiebel, fein geschnittenen Speck und Butter in einem Topf bei mittlerer Hitze  leicht bräunen.
Den gehackten Wirsing zufügen, mit der heißen Fleischbrühe auffüllen und alles bei mäßiger Hitze weich dämpfen lassen.
Zur besseren Bekömmlichkeit füge ich dem Kohl noch eine Prise Natron hinzu. Das Mehl mit der Milch glatt rühren und zu dem gegarten Kohl geben. Kurz aufkochen lassen. Mit Pfeffer, Salz und Muskat schmackhaft würzen. Unter das fertige, nicht mehr kochende Gemüse  abschließend die Sahne ziehen. Dazu Salzkartoffeln und grobe Bratwurst oder anderes kurzgebratenes Fleisch servieren."}' WHERE id = 367;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/527741149248335/bilder/923114/crop-960x540/omas-rahmwirsing.jpg' WHERE id = 367 AND (image_url IS NULL OR image_url = '');

-- [61/63] ID 415: Zwetschgenröster
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 415);
DELETE FROM ingredients WHERE recipe_id = 415;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Zwetschge(n)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Zucker', 50, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Rotwein (kräftig, fruchtig, kein Barrique)', 50, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Portwein (rot)', 50, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Zimtstange(n)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Sternanis', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Vanilleschote(n) (das Mark davon)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Zitrone(n) (Saft und Schalenabrieb)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Speisestärke', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (415, 'Wasser (kaltes)', 1, 'etwas');
UPDATE recipes SET steps = '{"Die Zwetschgen waschen, halbieren und entsteinen. Die Hälften nochmals der Länge nach halbieren. Danach mit dem Zucker dem Zitronensaft, dem Schalenabrieb, der ausgekratzten Vanilleschote und der Schale der Vanilleschote, dem Zimt sowie dem Sternanis mischen. In eine feuerfeste Form geben. Den Rotwein und den Portwein dazugeben. Im Ofen auf mittlerer Schiene bei 180 °C in ca. 20 Minuten nicht zu weich garen. Dabei mehrmals umrühren.  Den Zwetschgenröster aus dem Ofen nehmen. Die Zimtrinde, die Vanilleschote und den Sternanis entfernen. Durch ein Sieb gießen. Den Sud auffangen und in einem kleinen Topf zum Kochen bringen. Die Speisestärke in kaltem Wasser auflösen und in den kochenden Sud gießen. Unter Rühren ca. 3 Minuten leicht köcheln lassen, damit die Speisestärke den Sud binden kann. Den Sud über die Zwetschgen gießen. Mindestens 4 Stunden ziehen lassen.  Der Zwetschgenröster schmeckt sehr gut zu allen Mehlspeisen, Topfenknödeln, Pfannkuchen, Grießknödeln oder auch süßen Dampfnudeln."}' WHERE id = 415;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/2461781387466193/bilder/1338018/crop-960x540/zwetschgenroester.jpg' WHERE id = 415 AND (image_url IS NULL OR image_url = '');

-- [62/63] ID 417: Marillenröster
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 417);
DELETE FROM ingredients WHERE recipe_id = 417;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (417, 'Aprikose(n) (Marillen)', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (417, 'Zucker', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (417, 'Vanilleschote(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (417, 'Schnaps (Marillenbrand)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (417, 'Stange/n Zimt (ein kleines Stück davon)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (417, 'Zitronensaft', 2, 'EL');
UPDATE recipes SET steps = '{"Das ist ein Marillenröster und kein Kompott! Die Zubereitung ist sehr simpel. Die Marillen waschen, entkernen und vierteln. Die Viertel mit den restlichen Zutaten vermischen und ca. 30 Minuten ziehen lassen. In der Zwischenzeit den Backofen auf 180°C vorheizen.  Nun nur noch die Marillenmischung in eine feuerfeste Form (besser ein kleines Backblech) geben, in die Mitte des Ofens schieben und 15 Minuten weich garen. In dieser Zeit öfter umrühren. Röster passen lauwarm oder kalt zu fast allen Mehl-/Süßspeisen. Schmeckt auch pur."}' WHERE id = 417;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/1495701254829181/bilder/381288/crop-960x540/marillenroester-bzw-aprikosenroester.jpg' WHERE id = 417 AND (image_url IS NULL OR image_url = '');

-- [63/63] ID 424: Vanilleeis
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 424);
DELETE FROM ingredients WHERE recipe_id = 424;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'Kuvertüre, weiße', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'Sahne (32 %)', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'Eigelb (Größe M)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'Ei(er), Größe M', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'gehäuft Zucker', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'Vanillezucker', 1, 'Beutel');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'Vanilleschote(n)', 0.5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (424, 'gehäuft Vanille (gemahlen)', 1, 'TL');
UPDATE recipes SET steps = '{"Kuvertüre im Wasserbad schmelzen und abkühlen lassen. Schlagsahne steif schlagen Eigelbe und Ei mit Zucker und Vanillezucker schaumig rühren, das Mark der halben Vanilleschote und die gemahlene Vanille unterrühren, dann die lauwarme geschmolzene Schokolade unterrühren. Zum Schluss die Sahne unterheben.  Die Masse in den Eisbehälter der Eismaschine für ca. 45 Minuten geben. Das Eis hält ca. 2 Wochen in der Tiefkühltruhe"}' WHERE id = 424;
UPDATE recipes SET image_url = 'https://img.chefkoch-cdn.de/rezepte/3735681566924054/bilder/1241465/crop-960x540/cremiges-vanilleeis.jpg' WHERE id = 424 AND (image_url IS NULL OR image_url = '');

-- Summary: 63 recipes, 651 total ingredients
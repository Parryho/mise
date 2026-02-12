-- Re-scrape round 2: 25 verified recipes from new URLs
-- Generated: 2026-02-12T21:03:22.937Z

-- ID 12: Bärlauchcremesuppe → "Bärlauchcremesuppe" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 12);
DELETE FROM ingredients WHERE recipe_id = 12;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Bärlauch (frischer)', 5, 'Handvoll');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Brühe', 0.75, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Butter', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Crème fraîche', 1, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (12, 'Muskat', 1, 'Stück');
UPDATE recipes SET steps = '{"Zwiebel schälen, klein würfelig schneiden, Bärlauch waschen, trockentupfen, klein schneiden. Butter in einem Topf erhitzen und die Zwiebel anbraten, dann den Bärlauch kurz mitbraten, mit Brühe ablöschen, ca.10 min. leicht köcheln lassen. Mit dem Stabmixer pürieren, anschließend Creme fraiche und Gewürze hinzufügen.  Noch einmal aufwallen lassen und abschmecken. "}' WHERE id = 12;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/649341166266149/Baerlauchcremesuppe.html' WHERE id = 12;

-- ID 31: Blunzengröstl → "Blunzengröstl" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 31);
DELETE FROM ingredients WHERE recipe_id = 31;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Blutwürste', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Kartoffel(n)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Schweineschmalz', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Kümmel', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (31, 'Majoran', 1, 'Stück');
UPDATE recipes SET steps = '{"Kartoffeln kochen, klein geschnittene Zwiebel in Fett anrösten, in Scheiben geschnittene Kartoffeln dazu, würzen, dann die Fülle der Blutwürste hineindrücken und gut durchrösten. Dazu passt sehr gut gekochtes Sauerkraut."}' WHERE id = 31;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/466651140087200/Blunzengroestl.html' WHERE id = 31;

-- ID 75: Bratkartoffeln → "Knusprige Bratkartoffeln" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 75);
DELETE FROM ingredients WHERE recipe_id = 75;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Pellkartoffel(n) (vom Vortag, festkochend (s. Anmerkung))', 600, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Butterschmalz', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Schnittlauch (frisch, fein gehackt)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Petersilie (frisch, fein gehackt)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Speckwürfel', 120, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (75, 'Zwiebel(n) (gewürfelt)', 1, 'Stück');
UPDATE recipes SET steps = '{"Als erstes werden die Kartoffeln gepellt und in nicht allzu dünne Scheiben geschnitten. Dadurch, dass die Kartoffeln in der Schale gekocht werden, bleibt die Stärke in der Kartoffel und bindet beim Abkühlen ab. Dadurch zerfällt sie beim Schneiden und Braten nicht so leicht. Außerdem bleiben so alle Mineralstoffe und Vitamine in der Kartoffel und werden nicht so stark ans Kochwasser abgegeben. Die Kartoffelscheiben sollten anschließend erstmal zur Seite gestellt werden. Im nächsten Schritt wird der Speck in etwas Butterschmalz gebraten, bis er kross wird. Dazu kommen dann die Zwiebelstückchen und werden mitgebraten, bis sie glasig geworden sind. Wenn es soweit ist, wird diese Masse auf einen Teller gegeben und die Pfanne zurück auf den Herd gestellt. In die heiße Pfanne wird dann das restliche Butterschmalz gegeben und zerlassen. Bei mittlerer Hitze werden im Anschluss die Kartoffelscheiben knusprig gebraten. Ganz zum Schluss kommen die Speck-Zwiebelmasse, Pfeffer, Salz und die Kräuter dazu.  Die Bratkartoffeln sollten direkt serviert werden. Anmerkung: Eine festkochende Kartoffelsorte mit Schale bereits am Vortag kochen und auskühlen lassen."}' WHERE id = 75;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/3270991486029806/Knusprige-Bratkartoffeln.html' WHERE id = 75;
UPDATE recipes SET portions = 3 WHERE id = 75;

-- ID 111: Nusstorte → "Nusstorte mit Schokosahne" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 111);
DELETE FROM ingredients WHERE recipe_id = 111;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Schlagsahne', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Schokolade (Vollmilch)', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Rippe/n Schokolade (zartbitter)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Sahnesteif', 1, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Vanillezucker', 1, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Ei(er)', 6, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Salz', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Zucker', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Haselnüsse (gemahlen)', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (111, 'Schokoladenraspel (zum Verzieren)', 1, 'Stück');
UPDATE recipes SET steps = '{"Am Vortag oder einige Stunden (ca. 5 Std.) vor dem Backen Sahne erhitzen und die Schokolade darin auflösen. Abkühlen lassen und in den Kühlschrank stellen.  Für den Teig Eier trennen. Eigelb mit dem Zucker schaumig rühren. Eiweiß mit Salz steif schlagen. Zuerst Nüsse, dann Eiweiß auf die Eigelbmischung geben und unterheben. Teig in eine am Boden mit Backpapier ausgelegte Springform füllen. Im vorgeheizten Ofen bei 180°C ca. 35 Minuten backen. Teigboden abkühlen lassen und 1x quer durchschneiden.  Sahnesteif und Vanillezucker vermischen. Schoko-Sahne damit steif schlagen. Unteren Boden mit einem Teil der Füllung bestreichen, oberen Boden darauf setzen und restliche Sahne um den Kuchen herum verteilen. Mit Schokoraspeln verzieren."}' WHERE id = 111;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1568811264351296/Nusstorte-mit-Schokosahne.html' WHERE id = 111;
UPDATE recipes SET portions = 1 WHERE id = 111;

-- ID 137: Käsekrainer → "Käsekrainer mit Sauerkraut im Brotlaib" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 137);
DELETE FROM ingredients WHERE recipe_id = 137;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Mischbrot (ca. 1 kg)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Scheibe/n Kochschinken', 8, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Würstchen (Käsekrainer, je nach Brotgröße)', 6, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Dose/n Sauerkraut (850 g Abtropfgewicht)', 1, 'gr');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'm.-große Zwiebel(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Gemüsebrühe', 300, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Speisestärke', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Butter', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Kümmelpulver', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (137, 'Salz und Pfeffer', 1, 'etwas');
UPDATE recipes SET steps = '{"Das obere Drittel des Mischbrots als Deckel abschneiden. Den unteren Teil des Brotes vorsichtig mit einem Löffel aushöhlen, und dabei ringsum einen Rand von mindestens 1,5 cm stehen lassen.  Die übrig gebliebene Füllung auf einem mit Backpapier ausgelegtem Backblech im vorgeheizten Backofen bei 140 °C Ober-/Unterhitze ca. 45 Minuten trocknen. Die Brösel anderweitig, zum Beispiel als Paniermehl, verwenden.  Das Sauerkraut in ein Sieb schütten, kurz kalt abbrausen und in dem Sieb abtropfen lassen.  Die Zwiebeln schälen und klein würfeln. In einem Topf die Butter erhitzen, und darin die Zwiebelwürfel glasig anschwitzen. Das Sauerkraut hinzufügen, mit der Gemüsebrühe auffüllen und bei mittlerer Hitze langsam weich köcheln. Die Stärke mit etwas kaltem Wasser anrühren und damit das Kraut abbinden. Mit Salz, Pfeffer und Kümmel abschmecken und abkühlen lassen.  Das Brot innen vollständig mit Kochschinken auslegen. Die Hälfte des Sauerkrauts hineinfüllen, die Käsekrainer nebeneinander hineinlegen und mit dem Sauerkraut bedecken, bis das Brot vollständig gefüllt ist. Den restlichen Kochschinken drauflegen und alles mit dem Deckel des Brotes verschließen.  Das Brot auf ein mit Backpapier ausgelegtes Blech setzen und im unteren Drittel zunächst bei 140 °C Ober-/Unterhitze 45 Minuten backen. Anschließend weitere 15 Minuten bei nun 180 °C backen.  Anschließend herausnehmen und vorsichtig aufschneiden. Am besten funktioniert dies mit einem Elektromesser."}' WHERE id = 137;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/4017031617474983/Kaesekrainer-mit-Sauerkraut-im-Brotlaib.html' WHERE id = 137;

-- ID 156: Gebackene Champignons → "Gebackene Champignons mit Sauce tartare" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 156);
DELETE FROM ingredients WHERE recipe_id = 156;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'm.-große Champignons', 45, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Ei(er)', 7, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Kaffeesahne (einige Tropfen)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Mehl (zum Panieren)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Paniermehl', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Salz und Pfeffer (weißer)', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Öl (Erdnussöl oder Frittieröl)', 1, 'Liter');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Öl (Sonnenblumenöl)', 2.5, 'dl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Sahne (steif geschlagen)', 0.5, 'dl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Zitronensaft', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Senf', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Worcestersauce', 1, 'etwas');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Zwiebel(n) (ganz fein geschnittene)', 70, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Gurke(n) ((Essiggurken), ganz fein geschnittene)', 80, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Kapern (ganz fein gehackte)', 20, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Sardellenfilet(s) (ganz fein gehackte)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Petersilie (ganz fein gehackte)', 10, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (156, 'Schnittlauch (ganz fein geschnittener)', 10, 'g');
UPDATE recipes SET steps = '{"Champignons waschen, putzen und trocknen.  Drei Eier mit etwas Kaffeesahne, Salz und Pfeffer verquirlen.  Champignons panieren: erst im Mehl wenden, dann im Ei und im Paniermehl.  Damit es schneller geht nehmen Sie eine Schüssel mehr und alle mit Deckel und ein Sieb dazu.  Das heißt: 4-5 Champignons in Mehl wenden, dann ins Ei, dann ins Paniermehl legen (bei jedem Schritt immer kräftig schütteln, darum der Deckel).  Champignons dann bei ca. 180 Grad frittieren.  Zwei Eier hart kochen, kalt abschrecken und schälen, fein hacken für die Tartarsauce.  2 Eier trennen, Eigelb in eine Schüssel geben, mit etwas Zitronensaft, Senf, Worcestersauce, Salz und Pfeffer gut vermischen. Nun langsam unter ständigem Rühren das Sonnenblumenöl unterziehen bis die Mayonnaise fest wird.  Die steif geschlagene Sahne vorsichtig darunter ziehen. (Die Mayonnaise gelingt besser wenn die Eier Zimmertemperatur haben. Wenn die Mayonnaise mal etwas gerinnt: ein wenig warmes Wasser am Rand der Schüssel hinein geben und neu aufrühren.)  Die fein gehackten Eier, Zwiebeln, Essiggurken, Kapern, Sardellen und Kräuter in die Mayonnaise mischen. Eventuell noch mal etwas nachwürzen.  Die noch heißen Champignons portionsweise auf Tellern anrichten und mit etwas Tartarsauce sofort servieren."}' WHERE id = 156;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1515901256812007/Gebackene-Champignons-mit-Sauce-tartare.html' WHERE id = 156;
UPDATE recipes SET portions = 6 WHERE id = 156;

-- ID 162: Bruschetta → "Bruschetta italiana" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 162);
DELETE FROM ingredients WHERE recipe_id = 162;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Strauchtomate(n)', 1, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Zwiebel(n)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Zehe/n Knoblauch', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Meersalz und Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Olivenöl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Ciabatta', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'Basilikum', 1, 'Bund');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (162, 'n. B. Parmesan (oder Mozzarella)', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Tomaten in kleine Würfel schneiden (so klein, wie man sie mag). Die Zwiebeln (es können auch weniger sein), in feine Würfel schneiden und zu den Tomaten in eine Schüssel geben. 3 Zehen Knoblauch schälen, durch eine feine Presse drücken und in die Schüssel geben. Mit Meersalz und Pfeffer würzen, kurz ziehen lassen und dann mit Olivenöl auffüllen. Den Backofen auf 200 °C Ober-/Unterhitze vorheizen. Das Brot in Scheiben schneiden, diese mit ein Paar Tropfen Olivenöl beträufeln und mit der letzten Zehe Knoblauch einreiben. Auf ein Backblech legen und in ca. 8 Minuten schön kross backen - und raus damit! Dann das Basilikum klein hacken, in die Schüssel mit Tomaten, Knoblauch und Zwiebeln geben, mischen und kurz abschmecken.  Alles zusammen auf den Tisch bringen und jeder kann sein Brot selbst belegen - nach Belieben noch Käse dazu reichen, egal ob Mozzarella oder Parmesan."}' WHERE id = 162;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/166951072615119/Bruschetta-italiana.html' WHERE id = 162;
UPDATE recipes SET portions = 6 WHERE id = 162;

-- ID 173: Fenchelcremesuppe → "Fenchelcremesuppe" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 173);
DELETE FROM ingredients WHERE recipe_id = 173;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Kartoffeln, festkochende', 1, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Knolle/n Fenchel', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Gemüsebrühe', 300, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (173, 'Muskat', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Kartoffel schälen, die Zwiebel und die Fenchelknolle säubern, alles in 1 cm große Stücke schneiden. Mit der Brühe in einen Topf geben und 25 Minuten kochen.  Das rohe Ei in einen Mixer geben und kurz verquirlen. Die Hälfte des gegarten Gemüses aus der Brühe holen, dazugeben und alles pürieren. Die cremige Masse zurück zur Suppe in den Topf geben, verrühren und erhitzen, aber nicht mehr kochen lassen. Bei Bedarf noch etwas Brühe hinzu gießen. Mit Salz, Pfeffer und Muskat abschmecken.  Schmeckt kalt und warm."}' WHERE id = 173;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1237061228641136/Fenchelcremesuppe.html' WHERE id = 173;
UPDATE recipes SET portions = 1 WHERE id = 173;

-- ID 210: Rote-Rüben-Suppe (Borschtsch) → "Rote Rübensuppe" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 210);
DELETE FROM ingredients WHERE recipe_id = 210;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Rote Bete (schälen)', 2, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Kartoffel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Rahm', 1, 'Becher');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Knoblauch', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Meerrettich ((frisch) = Kren)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Stärkemehl', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Zucker', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Kümmel', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (210, 'Essig', 1, 'Stück');
UPDATE recipes SET steps = '{"Rote Rüben schälen und in Salzwasser mit geschälter Kartoffel, 1 TL Kümmel, Spritzer Essig und 1 TL Zucker, 2 Knoblauchzehen weich kochen. Rüben mit Kartoffel und Knoblauchzehen aufmixen und soviel Sud dazugeben, dass die Suppe dickflüssig ist.  Stärke mit Rahm abrühren und in die Suppe geben. Nochmals aufkochen und zum Schluss frisch geriebenen Kren, nach Geschmack, unterrühren.  Mit Rahmhäubchen + Kren servieren."}' WHERE id = 210;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/518161147983583/Rote-Ruebensuppe.html' WHERE id = 210;

-- ID 214: Putenschnitzel paniert → "Panierte Putenschnitzel mit Zwiebelsoße" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 214);
DELETE FROM ingredients WHERE recipe_id = 214;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Putenschnitzel', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Paniermehl', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Ei(er)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Salz und Pfeffer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Butterschmalz', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Zwiebel(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Butterschmalz', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Mehl (ca. 10 g)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Gemüsebrühe', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Sojasauce', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Weißwein', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Zitronensaft', 1, 'Spritzer');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (214, 'Salz und Pfeffer (aus der Mühle)', 1, 'Stück');
UPDATE recipes SET steps = '{"Für die Soße die Zwiebeln schälen, halbieren und in Würfel oder Streifen schneiden. Butterschmalz in einem Bräter erhitzen, die Zwiebeln darin unter ständigem Rühren goldgelb anbraten. Topf zur Seite ziehen, das Mehl über die Zwiebeln streuen und mit einem Rührlöffel verrühren. Topf zurück auf die Kochfläche stellen und die Mehlschwitze unter ständigem Rühren hellbraun anbräunen. Topf wiederum zur Seite ziehen, die Mehlschwitze mit der Brühe ablöschen, einmal gründlich aufkochen lassen. Sojasoße und Weißwein zur Soße geben. Die Zwiebelsoße leicht zugedeckt ca. 10 Minuten langsam köcheln lassen. Mit Salz, Pfeffer und Zitronensaft abschmecken. Sollte die Zwiebelsoße zu dick geworden sein, mit etwas Wasser verdünnen.  Die Putenschnitzel etwas klopfen und mit Salz und Pfeffer würzen. Das Ei in einen tiefen Teller geben und mit etwas Milch verschlagen. Auf einen flachen Teller Paniermehl geben. Die gewürzten Putenschnitzel erst in Ei, danach in Paniermehl wenden und etwas andrücken. Fett erhitzen, die Schnitzel darin von jeder Seite 4 Minuten braten. Die heiße Soße mit den Schnitzeln servieren.  Dazu passen Kartoffeln, Reis oder Nudeln."}' WHERE id = 214;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/3351201498060068/Panierte-Putenschnitzel-mit-Zwiebelsosse.html' WHERE id = 214;
UPDATE recipes SET portions = 2 WHERE id = 214;

-- ID 221: Kalbsbraten → "Kalbsbraten - butterweich und zart" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 221);
DELETE FROM ingredients WHERE recipe_id = 221;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Kalbsbraten (Schulter)', 2.3, 'kg');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Suppengrün', 1, 'Bund');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Karotte(n)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Weißwein', 1, 'Schuss');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Kalbsfond', 200, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Sahne', 1, 'Schuss');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Butterschmalz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (221, 'Brühe', 0.5, 'Liter');
UPDATE recipes SET steps = '{"Kalbfleisch salzen und in heißem Butterschmalz im Bräter von allen Seiten anbraten, aus dem Bräter nehmen.  Klein geschnittenes Suppengrün, Karotten und Zwiebel im Bräter anrösten, Fleisch drauflegen, mit Brühe aufgießen und ins ca. 130° heiße Rohr geben. Deckel drauf und Fleisch immer wieder übergießen.  Nach ca. einer 1/2 Stunde den Weißwein dazugeben, nach ca. 2 Stunden den Kalbsfond dazugeben. Immer wieder übergießen.  Insgesamt ca. 4 - 5 Stunden bei 130 - 150° langsam schmoren lassen.  Dann Fleisch in Alufolie ca. 1/2 Stunde im 50-80° warmen Backrohr nachziehen lassen.  Den entstandenen Saft pürieren, abschmecken. Fleisch in Scheiben schneiden und mit der Sauce, Gemüse und z.B. Reis servieren."}' WHERE id = 221;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1835591297697725/Kalbsbraten-butterweich-und-zart.html' WHERE id = 221;
UPDATE recipes SET portions = 6 WHERE id = 221;

-- ID 225: Lammkeule → "Geschmorte Lammkeule" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 225);
DELETE FROM ingredients WHERE recipe_id = 225;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Keule(n) (vom Lamm (ohne Knochen ca. 1,2 Kg))', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Möhre(n)', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Knollensellerie', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Zwiebel(n)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Lammfond', 400, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Wein (rot)', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Saucenbinder (für dunkle Soßen)', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Senf', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Knoblauchzehe(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Kräuter (der Provence)', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Salz', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (225, 'Pfeffer', 1, 'Stück');
UPDATE recipes SET steps = '{"Zunächst die Lammkeule marinieren. Dazu wird sie mit Senf, Knoblauch, Kräuter der Provence, Salz und Pfeffer eingerieben. Dann wird die Keule in einen Bräter gelegt.  Danach Gemüse putzen, waschen und würfeln und über die Keule geben. Hinzu kommen 200 ml Lammfond und der Rotwein. Das Ganze wird dann bei 200 Grad (Gas Stufe 3) etwa drei Stunden in den Backofen geschoben, wobei die Temperatur nach einer Stunde auf 180 Grad (Gas Stufe 2) verringert wird.  Bitte beachten: Ständiges Übergießen mit dem eigenen Fond hält die Lammkeule schön saftig.  Anschließend das Fleisch aus dem Bräter nehmen und den Bratensaft mit dem Gemüse unter Hinzugabe der restlichen 200 ml Lammfond aufkochen, pürieren und durch den Sieb streichen. Die Soße dann erneut aufkochen, mit Soßenbinder binden und würzen.  Die aufgeschnittene Lammkeule kann dann mit der Soße übergossen und serviert werden."}' WHERE id = 225;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/546021152102528/Geschmorte-Lammkeule.html' WHERE id = 225;

-- ID 233: Fiakergulasch → "Fiakergulasch" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 233);
DELETE FROM ingredients WHERE recipe_id = 233;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Rindfleisch (Wadschinken)', 600, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Zwiebel(n) (in Ringe geschnitten)', 600, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Zehe/n Knoblauch (zerdrückt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Paprikapulver', 3, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Essig', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Thymian', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Majoran', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Kümmel', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Salz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Suppe (Rindsuppe), zum Aufgießen(Suppenwürfel)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Öl (zum Braten)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Würste (Frankfurter)', 4, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Gewürzgurke(n)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (233, 'Ei(er) (kernweich gekochte)', 4, 'Stück');
UPDATE recipes SET steps = '{"Zwiebel in heißem Öl anrösten, Fleisch in 4 cm große Würfel schneiden, zur Zwiebel geben, Paprika einrühren, mit einem Schuss Essig ablöschen. durchrösten, mit Salz, Majoran, Thymian und gestoßenem Kümmel und zerdrücktem Knoblauch würzen, mit wenig Wasser aufgießen, langsam weich dünsten. Suppe oder Wasser nachgießen. Öfter umrühren. Eier kernig weich kochen. Frankfurter beidseitig je 1/3 der Länge nach einschneiden, in heißer Öl anbraten, Gurken fächerartig schneiden, Eier halbieren. Das Gulasch damit garnieren. Mit Semmelknödel, Nockerln, Röstkartoffel oder Nudeln servieren. Tipp: Obenauf noch einen Klecks Rahm."}' WHERE id = 233;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/128231054995070/Fiakergulasch.html' WHERE id = 233;

-- ID 239: Kalbsgulasch → "Einfaches Kalbsgulasch" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 239);
DELETE FROM ingredients WHERE recipe_id = 239;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Rapsöl (oder Sonnenblumenöl)', 4, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Kalbsgulasch', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Zwiebel(n)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Salz', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Pfeffer (grob gemahlen)', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'gehäuft Paprikapulver, edelsüßes', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'gehäuft Paprikapulver, rosenscharfes', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'gehäuft Mehl', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Tomatenmark', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Rotwein, trockener', 150, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Fleischbrühe', 500, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (239, 'Lorbeerblatt', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Zwiebel schälen, längs halbieren und in. ca. 5 mm breite Scheiben schneiden und beiseitelegen. Das Öl in einem großen Topf erhitzen, die Temperatur passt, wenn sich an einem in das Öl eingetauchten Holzlöffel Bläschen bilden. Das Kalbsgulasch hinzufügen und von allen Seiten gut anbraten, dabei salzen und Pfeffern. Wenn das Fleisch etwas Farbe angenommen hat, die Zwiebeln hinzugeben und ebenfalls ca. 3 - 4 Minuten braten. Dann weitere ca. 3 - 4 Minuten bei geschlossenem Deckel schmoren. Eventuell gebildete Schmorflüssigkeit reduzieren.  Nun das Paprikapulver hinzufügen und mitrösten, ebenso das Mehl und das Tomatenmark hinzugeben und mitrösten. Mit dem Rotwein auf 2 Mal ablöschen. Mit der Fleischbrühe auffüllen und das Lorbeerblatt hinzufügen. Das Gulasch bei kleiner Hitze unter gelegentlichem Umrühren ca. 1 Stunde köcheln lassen, dabei den Topf mit einem Deckel abdecken.  Optional kann man auch eine Dose Erbsen dazugeben und mitkochen. Dazu passen Salzkartoffeln, Spätzle, Reis oder einfach ein Weißbrot."}' WHERE id = 239;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/3521841525266671/Einfaches-Kalbsgulasch.html' WHERE id = 239;
UPDATE recipes SET portions = 3 WHERE id = 239;

-- ID 243: Putenmedaillons → "Putenmedaillons" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 243);
DELETE FROM ingredients WHERE recipe_id = 243;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Putenschnitzel (in kleinen Scheiben)', 400, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Knoblauchzehe(n) (klein gehackt)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Tomatenketchup', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Pfeffer, weißer', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Gemüsebouillon (granulierte)', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Champignons (frische, in Scheiben)', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Sahne', 400, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'Emmentaler (geriebene)', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (243, 'n. B. Salz', 1, 'Stück');
UPDATE recipes SET steps = '{"Putenschnitzel in heißem Butterschmalz drei Minuten in einer Pfanne braten. Schnitzel dann in eine Auflaufform geben und die Pilze darüber verteilen.  Knoblauch in der Schnitzelpfanne kurz anbraten. Sahne, Gemüsebouillon, Ketchup und Pfeffer dazugeben und aufkochen. Nach Geschmack salzen und über die Pilz-Schnitzel-Mischung geben. Den Käse darüber streuen. Im heißen Backofen bei 200 Grad Celsius 35 Minuten backen.  Als Beilage schmecken Spätzle und ein Möhrensalat sehr gut.  Tipp: Statt Pute kann auch Schweinefilet verwendet werden."}' WHERE id = 243;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/3376861502356860/Putenmedaillons.html' WHERE id = 243;
UPDATE recipes SET portions = 6 WHERE id = 243;

-- ID 255: Kabeljau gebacken → "Kabeljau aus dem Ofen" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 255);
DELETE FROM ingredients WHERE recipe_id = 255;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Kabeljaufilet(s) (Rückenfilet)', 600, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Cocktailtomaten', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Karotte(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Zucchini', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Bio-Zitrone(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Meersalz', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Pfeffer, schwarzer (aus der Mühle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Olivenöl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Petersilie, glatte', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (255, 'Fett für die Form', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Backofen auf 200 °C Ober-/Unterhitze vorheizen. Eine Ofenform mit Deckel fetten. Die Kabeljaufilets salzen und pfeffern und in die Form legen.  Die Cocktailtomaten halbieren, die Zucchini in Würfel und die Karotte in Juliennestreifen schneiden. Das Gemüse um die Filets drapieren, salzen und pfeffern und alles mit Olivenöl beträufeln. Die Petersilie auf das Gemüse und Zitronenscheiben auf den Fisch legen. Eine Flüssigkeitszugabe ist nicht erforderlich, da das Gemüse diese abgibt.  Den Deckel auflegen und ca. 35 Minuten auf der mittleren Schiene in den Ofen geben. Dazu passen z. B. kleine Kartöffelchen."}' WHERE id = 255;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/2705881423501640/Kabeljau-aus-dem-Ofen.html' WHERE id = 255;
UPDATE recipes SET portions = 2 WHERE id = 255;

-- ID 282: Lauchquiche → "Lauchquiche" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 282);
DELETE FROM ingredients WHERE recipe_id = 282;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Mehl', 200, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Butter', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Wasser (kaltes)', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Salz', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Stange/n Lauch (gewaschen, in Ringe geschnitten)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Speck (gewürfelt)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Kochschinken (gewürfelt)', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Käse ((z.B. Gouda), gerieben)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'evtl. Ei(er)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'saure Sahne', 250, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'süße Sahne', 100, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Paprikapulver', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Muskat', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (282, 'Fett (für die Form)', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Ofen auf 200°C (Ober-/Unterhitze) vorheizen. Aus Mehl, Butter, kaltem Wasser und Salz einen salzigen Mürbeteig zubereiten und im Kühlschrank bis zur Weiterverarbeitung lagern. Etwas Öl in einer Pfanne erhitzen. Speck und Schinken darin anbraten. Den Lauch dazugeben und etwa acht Minuten mitdünsten. Mit Muskatnuss und Pfeffer würzen. Den Teig ausrollen und eine gefettete runde Kuchenform damit auslegen. Die Lauchmischung darauf verteilen, darüber die Sahne-Käse-Mischung geben. Im Ofen etwa 35 Minuten backen. Dazu schmecken grüne Salate."}' WHERE id = 282;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1866491302892742/Lauchquiche.html' WHERE id = 282;
UPDATE recipes SET portions = 1 WHERE id = 282;

-- ID 283: Tomaten-Ziegenkäse-Tarte → "Tomaten-Ziegenkäse Tarte" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 283);
DELETE FROM ingredients WHERE recipe_id = 283;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'Blätterteig (frisch oder TK)', 1, 'Pck');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'm.-große Tomate(n)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'Käse (Ziegenkäserolle)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'Zweig/e Rosmarin', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'Oregano (getrocknet)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (283, 'Zucker', 1, 'Prise(n)');
UPDATE recipes SET steps = '{"Den Ofen auf 200°C Ober-/Unterhitze vorheizen. Den Blätterteig ggf. auftauen und ausrollen. Dann mithilfe einer Müslischale oder eines kleinen Tellers 3-4 Kreise aus dem Blätterteig ausschneiden. Wenn der Blätterteig nicht reicht, kann man ihn noch mit einem Nudelholz etwas dünner ausrollen, damit man mehr Fläche bekommt. Die Tomaten und die Ziegenkäserolle in Scheiben schneiden. Die Blätterteigkreise auf ein Backblech mit Backpapier legen. Nun die Tomaten- und Käsescheiben abwechselnd in einem Kreis dachziegelartig auf den Blätterteig legen, dabei außen ca. 1 cm Rand lassen. Mit Pfeffer, Salz, etwas Zucker und Oregano würzen. Je einen Rosmarinzweig auf die Tartes legen. 15 Minuten im Ofen backen. Heiß servieren! Schmeckt sehr lecker als Vorspeise oder Snack. Den Rosmarinzweig sollte man aber lieber nicht mitessen, man kann aber die kleinen Blättchen/Zweigchen vom Stängel abzupfen und mitessen."}' WHERE id = 283;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/2079171336031453/Tomaten-Ziegenkaese-Tarte.html' WHERE id = 283;

-- ID 289: Moussaka vegetarisch → "Vegetarische Moussaka" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 289);
DELETE FROM ingredients WHERE recipe_id = 289;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Aubergine(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Kartoffel(n) (gekocht)', 5, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Paket Schafskäse', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Knoblauchzehe(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Dose/n Tomaten, stückige (sie können auch weggelassen werden)', 1, 'kl');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Butter', 30, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'gehäuft Dinkelvollkornmehl (oder Dinkelmehl)', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Vollmilch (3,5 % Fett)', 500, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'n. B. Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'Zimt', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (289, 'n. B. Muskatnuss, frisch geriebene', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Knoblauch in kleine Würfel schneiden und braten. Die Auberginen waschen, der Länge nach in Scheiben schneiden und in Olivenöl braten. Die Kartoffeln schälen, halbieren und kochen. Die Kartoffeln abkühlen lassen und in Scheiben schneiden. Den Schafkäse in feine \"Platten\" schneiden. Ich halbiere ihn und schneide ihn dann in dünne Platten. Für die Béchamel die Butter schmelzen lassen. Wenn sie zu schäumen beginnt, das Mehl unterrühren, bis es sich mit der Butter verbindet. Das Mehl-Butter-Gemisch mit der Milch ablöschen. Wenn die Soße aufkocht, beginnt sie zu binden. Ist sie zu dünn, etwas Mehl zufügen, ist sie zu dick, etwas Milch zufügen. Ständig rühren, die Soße setzt sehr leicht an. Die Béchamel mit Salz, Pfeffer, einem halben Eierlöffel voll Zimt und der Muskatnuss würzen. Wenn man die Moussaka mit den Tomaten machen möchte, den Boden der Auflaufform mit der Hälfte der Tomaten bedecken, ansonsten mit den Kartoffeln beginnen. Die Form dann fetten. Einige Auberginenscheiben auf den Kartoffeln verteilen. Den Knoblauch auf den Auberginenscheiben verteilen. Die Hälfte der Béchamel auf den Auberginenscheiben verteilen. Die Schafkäseplatten auf die Bechamel geben. Die zweite Hälfte der Tomaten auf dem Schafkäse verteilen, ansonsten mit Kartoffeln weitermachen. Wie gehabt die Auberginenscheiben auf den Kartoffeln verteilen und abschließend mit dem Rest Béchamel bedecken. Den Ofen auf 190 - 200 Grad vorheizen und die Moussaka 30 - 40 Min backen. Wenn die Kruste zu dunkel wird, den Auflauf mit Alufolie abdecken."}' WHERE id = 289;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/3144691468244281/Vegetarische-Moussaka.html' WHERE id = 289;

-- ID 312: Gefüllte Zucchini → "Gefüllte Zucchini mit Hackfleisch und Käse" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 312);
DELETE FROM ingredients WHERE recipe_id = 312;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Zucchini', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Hackfleisch, gemischtes', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Öl zum Braten', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Zwiebel(n)', 1, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Tomatenmark', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Käse (z.B. Edamer)', 150, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Frischkäse', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Gemüsebrühepulver (gekörnte)', 1, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Muskatpulver', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Korianderpulver', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Paprikapulver', 0.5, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Zwiebel(n)', 1, 'kleine');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Tomaten, passierte', 600, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Gemüsebrühepulver (gekörnte)', 2, 'TL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Oregano (getrockneter)', 0.5, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Rotwein', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Zucker', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (312, 'Öl zum Braten', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Zucchini halbieren, die Enden abschneiden und bis auf 1 cm mit einem Teelöffel das Innere herausschaben. Die große Zwiebel, den Käse und das Zucchinifleisch fein würfeln.  In einem Topf Öl heiß werden lassen. Das Hackfleisch anbraten, dann die Zwiebeln dazugeben und mitbraten. Das Zucchinifleisch und das Tomatenmark dazugeben. Dann die Gemüsebrühe, Muskat, Koriander und Paprika dazugeben und mit Zucker, Salz und Pfeffer abschmecken. Die Hälfte des Käses und den Frischkäse unterrühren und die Zucchini mit der Masse füllen (es darf Füllung übrig bleiben!). Die gefüllten Zucchini in eine Auflaufform geben und den restlichen Käse darüber streuen. Im Ofen bei 180 Grad ca. 25 Minuten backen. In der Zwischenzeit die Tomatensauce zubereiten: die kleine Zwiebel würfeln und auf großer Flamme kurz in etwas Öl anbraten, falls vorhanden, die restliche Füllung dazugeben. Mit den passierten Tomaten ablöschen und die Sauce aufkochen lassen. Oregano, ½ EL Zucker und die Gemüsebrühe dazugeben, den Rotwein dazugeben und die Sauce mit Salz und Pfeffer abschmecken. Die Zucchini mit der Tomatensauce servieren. Dazu passt Reis."}' WHERE id = 312;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1647731272435749/Gefuellte-Zucchini-mit-Hackfleisch-und-Kaese.html' WHERE id = 312;

-- ID 314: Stuffed Mushrooms / Gefüllte Champignons → "Champignons mit Krebsfleisch - Frischkäsefüllung" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 314);
DELETE FROM ingredients WHERE recipe_id = 314;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Champignons (braune)', 4, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Krebse (- Fleisch, gutes)', 1, 'Dose/n');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Frischkäse (oder Quark mit Schnittlauch)', 250, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Scheibe/n Bacon (knusprig gebraten)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Frühlingszwiebel(n) (klein gehackt)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Parmesan (geriebener)', 125, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Olivenöl', 2, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (314, 'Zehe/n Knoblauch (gehackt oder zerdrückt)', 2, 'Stück');
UPDATE recipes SET steps = '{"Champignons abspülen, mit Küchenkrepp trockentupfen. Die Lamellen mit einem Teelöffel rauskratzen und den Stiel gerade abschneiden. Das rausgekratzte und den Stiel hacken. Olivenöl erhitzen und die Champignonkappen etwa 3 Minuten drinnen braten (nur die Unterseite) Die anderen Zutaten (außer dem Parmesan inklusive Stiele und Lamellen) mischen und die Pilze damit füllen. Etwas schwarzen Pfeffer drübermahlen, Parmesan draufgeben und unter den Grill geben bis der Parmesan anfängt braun zu werden."}' WHERE id = 314;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/211231088591489/Champignons-mit-Krebsfleisch-Frischkaesefuellung.html' WHERE id = 314;

-- ID 316: Eierspeise / Bauernomelett → "Meine Ennstaler Eierspeise" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 316);
DELETE FROM ingredients WHERE recipe_id = 316;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Debrecziner Würstchen', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Zwiebel(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Paprikaschote(n)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Frühlingszwiebel(n)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Cocktailtomaten', 1, 'Handvoll');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Ei(er)', 4, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Käse, geriebener', 1, 'Handvoll');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (316, 'Schnittlauchröllchen', 1, 'Handvoll');
UPDATE recipes SET steps = '{"Debreziner, Zwiebel, Paprika und Frühlingszwiebeln klein schneiden.  In einer Pfanne Butter erhitzen und Debreziner mit der Zwiebel anbraten, ohne dass die Zwiebel braun wird. Danach Paprika, die Tomaten im Ganzen und die Frühlingszwiebeln hinzugeben und alles schön anschwitzen. Das Gemüse sollte nicht zulange gebraten werden, damit es etwas knackig bleibt und seinen Geschmack behält. Danach die Eier dazugeben, aber nichts mehr verrühren, die Dotter sollen ganz bleiben. Anschließend den geriebenen Käse gleichmäßig darüber streuen. Zum Abschluss mit Salz und Pfeffer würzen, mit Schnittlauch garnieren. Mit Schwarzbrot servieren."}' WHERE id = 316;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/2653311416751481/Meine-Ennstaler-Eierspeise.html' WHERE id = 316;
UPDATE recipes SET portions = 2 WHERE id = 316;

-- ID 333: Erdäpfelpuffer / Reibekuchen → "Großmutters Reibekuchen" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 333);
DELETE FROM ingredients WHERE recipe_id = 333;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (333, 'Kartoffel(n)', 12, 'große');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (333, 'Zwiebel(n)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (333, 'Mehl', 8, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (333, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (333, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (333, 'Öl zum Braten', 1, 'Stück');
UPDATE recipes SET steps = '{"Die geschälten Kartoffeln auf der großen Reibe reiben, mit viel Salz und wenig Pfeffer würzen. Eier und gewürfelte Zwiebeln dazugeben. Mit so viel Mehl bestäuben, dass die Kartoffelmasse bedeckt ist (kann mehr oder weniger als 8 EL sein). Alles ordentlich miteinander verrühren.  Portionsweise Reibekuchen ausbacken, sie müssen in Öl schwimmen. Danach auf Küchenkrepp abtropfen lassen."}' WHERE id = 333;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/230461094561030/Grossmutters-Reibekuchen.html' WHERE id = 333;

-- ID 339: Topfenknödel (pikant, als Beilage) → "Siebenbürgische Topfenknödel" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 339);
DELETE FROM ingredients WHERE recipe_id = 339;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Quark (Magerquark)', 500, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Ei(er)', 2, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Grieß', 200, 'ml');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Salz', 1, 'Prise(n)');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Mehl', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Zucker', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Semmelbrösel', 100, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'Butter', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (339, 'n. B. Marmelade', 1, 'Stück');
UPDATE recipes SET steps = '{"Den Quark mit dem Grieß, den Eiern und einer Prise Salz gut durchmischen, kneten und mindesten 30 Minuten ziehen lassen. Aus dem Teig Knödel formen, evtl. die Hand dabei mit etwas Mehl einstauben, damit es nicht so klebt. Alternativ die Knödel mit einem großen Löffel formen. Die geformten Knödel gleich in einen großen Topf mit kochendem Wasser gleiten lassen. Sobald die Knödel schwimmen, sind sie auch schon fertig. In einer Pfanne Butter zum Schmelzen bringen und den Zucker und die Semmelbrösel darin leicht bräunen. Vorsicht, nicht verbrennen lassen. Die fertigen Knödel in der Pfanne mit den Bröseln rollen, sodass sie eine Bröselkruste bekommen. Sofort warm mit Marmelade servieren. Am besten passt Hagebuttenmarmelade (Hetschenpetsch), gut geht auch Aprikosenmarmelade."}' WHERE id = 339;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/436201135216976/Siebenbuergische-Topfenknoedel.html' WHERE id = 339;

-- ID 393: Zucchini-Gemüse → "Zucchini-Tomaten-Gemüse" (chefkoch.de)
DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = 393);
DELETE FROM ingredients WHERE recipe_id = 393;
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Knoblauchzehe(n)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Olivenöl', 3, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Zucchini', 600, 'g');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Salz und Pfeffer', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Oregano (gerebelter)', 1, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Tomate(n)', 3, 'Stück');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'Tomatenmark (bei Bedarf)', 1, 'EL');
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (393, 'einige Basilikumblätter', 1, 'Stück');
UPDATE recipes SET steps = '{"Die Zucchini waschen und ca. 1 cm groß würfeln, anschließend in heißem Olivenöl leicht anbraten. Die Tomaten kreuzweise einritzen und mit sehr heißem Wasser übergießen. Kurz stehen lassen, dann häuten und würfeln. Die Knoblauchzehe abziehen und zu den Zucchini pressen. Die Tomatenwürfel dazugeben. Mit Salz, Pfeffer, Oregano würzen und 5-10 Min. dünsten. Evtl. noch etwas Tomatenmark hinzufügen und mit Basilikumblättchen nach Bedarf bestreut servieren. Tipp: Man kann auch die doppelte Menge machen. Was davon übrig bleibt, kalt stellen. Am nächsten Tag Rotweinessig oder Balsamico, Olivenöl und evtl. ein paar Blättchen Basilikum  hinzufügen - dann hat man eine leckere Vorspeise oder einen sehr schmackhaften Salat."}' WHERE id = 393;
UPDATE recipes SET source_url = 'https://www.chefkoch.de/rezepte/1200311225887568/Zucchini-Tomaten-Gemuese.html' WHERE id = 393;

-- Summary: 25 recipes, 257 ingredients
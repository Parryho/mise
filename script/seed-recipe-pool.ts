/**
 * Seed comprehensive recipe pool for hotel buffet rotation.
 * 335 Rezepte: 65 Suppen, 70 Fleisch/Fisch, 70 Vegetarisch/Vegan,
 *              55 Stärkebeilagen, 60 Gemüsebeilagen, 15 Mehlspeise-Garnituren
 *
 * Idempotent: skips recipes that already exist (by name).
 *
 * Usage:
 *   npx tsx script/seed-recipe-pool.ts
 *   DATABASE_URL=postgresql://... npx tsx script/seed-recipe-pool.ts
 */

import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

interface SeedRecipe {
  name: string;
  category: string;
  tags: string[];
  season?: string;
}

// ════════════════════════════════════════════════════════════
// SUPPEN (65)
// ════════════════════════════════════════════════════════════
const SOUPS: SeedRecipe[] = [
  // Cremesuppen (20) → CreamSoups
  { name: "Spargelcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Selleriecremesuppe", category: "CreamSoups", tags: [] },
  { name: "Kürbiscremesuppe", category: "CreamSoups", tags: [] },
  { name: "Knoblauchcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Bärlauchcremesuppe", category: "CreamSoups", tags: [], season: "spring" },
  { name: "Karottencremesuppe", category: "CreamSoups", tags: [] },
  { name: "Brokkolicremesuppe", category: "CreamSoups", tags: [] },
  { name: "Blumenkohlcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Tomatencremesuppe", category: "CreamSoups", tags: [] },
  { name: "Zucchinicremesuppe", category: "CreamSoups", tags: [] },
  { name: "Paprikacremesuppe", category: "CreamSoups", tags: [] },
  { name: "Champignoncremesuppe", category: "CreamSoups", tags: [] },
  { name: "Erbsencremesuppe", category: "CreamSoups", tags: [] },
  { name: "Fenchelcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Maiscremesuppe", category: "CreamSoups", tags: [] },
  { name: "Kartoffelcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Lauchcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Spinatcremesuppe", category: "CreamSoups", tags: [] },
  { name: "Kohlrabicremesuppe", category: "CreamSoups", tags: [] },
  { name: "Rote-Rüben-Cremesuppe", category: "CreamSoups", tags: [] },
  // Klassisch-österreichische Suppen → mixed
  { name: "Leberknödelsuppe", category: "ClearSoups", tags: [] },
  { name: "Grießnockerlsuppe", category: "ClearSoups", tags: [] },
  { name: "Fritatensuppe", category: "ClearSoups", tags: [] },
  { name: "Nudelsuppe", category: "ClearSoups", tags: [] },
  { name: "Schwammerlsuppe", category: "CreamSoups", tags: [] },
  { name: "Zwiebelsuppe", category: "CreamSoups", tags: [] },
  { name: "Erdäpfelsuppe", category: "CreamSoups", tags: [] },
  { name: "Einmachsuppe", category: "CreamSoups", tags: [] },
  { name: "Rindssuppe klar", category: "ClearSoups", tags: [] },
  { name: "Backerbsensuppe", category: "ClearSoups", tags: [] },
  { name: "Kaspressknödelsuppe", category: "ClearSoups", tags: [] },
  { name: "Tiroler Knödelsuppe", category: "ClearSoups", tags: [] },
  { name: "Brotsuppe", category: "CreamSoups", tags: [] },
  { name: "Steirische Wurzelsuppe", category: "ClearSoups", tags: [] },
  { name: "Saure Suppe (Steirisch)", category: "ClearSoups", tags: [] },
  { name: "Altwiener Suppentopf", category: "CreamSoups", tags: [] },
  { name: "Kalbsknochensuppe", category: "ClearSoups", tags: [] },
  { name: "Flädlesuppe", category: "ClearSoups", tags: [] },
  { name: "Markklößchensuppe", category: "ClearSoups", tags: [] },
  { name: "Leberreissuppe", category: "ClearSoups", tags: [] },
  // Hülsenfrucht- & Eintopfsuppen → CreamSoups (thick)
  { name: "Linsensuppe", category: "CreamSoups", tags: [] },
  { name: "Bohnensuppe", category: "CreamSoups", tags: [] },
  { name: "Erbsensuppe", category: "CreamSoups", tags: [] },
  { name: "Minestrone", category: "CreamSoups", tags: [] },
  { name: "Gulaschsuppe", category: "CreamSoups", tags: [] },
  { name: "Serbische Bohnensuppe", category: "CreamSoups", tags: [] },
  { name: "Kichererbsensuppe", category: "CreamSoups", tags: [] },
  { name: "Ribollita", category: "CreamSoups", tags: [] },
  { name: "Kartoffelgulaschsuppe", category: "CreamSoups", tags: [] },
  { name: "Rote-Linsen-Suppe", category: "CreamSoups", tags: [] },
  // Internationale & Saisonale → mixed
  { name: "Französische Zwiebelsuppe", category: "CreamSoups", tags: [] },
  { name: "Gazpacho", category: "CreamSoups", tags: [], season: "summer" },
  { name: "Kalte Gurkensuppe", category: "CreamSoups", tags: [], season: "summer" },
  { name: "Thai-Kokossuppe", category: "CreamSoups", tags: [] },
  { name: "Hühnersuppe mit Einlage", category: "ClearSoups", tags: [] },
  { name: "Pilzrahmsuppe", category: "CreamSoups", tags: [] },
  { name: "Waldviertler Mohnsuppe", category: "CreamSoups", tags: [] },
  { name: "Weinsuppe", category: "CreamSoups", tags: [] },
  { name: "Käsesuppe", category: "CreamSoups", tags: [] },
  { name: "Topinambur-Suppe", category: "CreamSoups", tags: [] },
  { name: "Pastinaken-Suppe", category: "CreamSoups", tags: [] },
  { name: "Petersilienwurzel-Suppe", category: "CreamSoups", tags: [] },
  { name: "Süßkartoffelsuppe", category: "CreamSoups", tags: [] },
  { name: "Rote-Rüben-Suppe (Borschtsch)", category: "ClearSoups", tags: [] },
  { name: "Fisolen-Suppe", category: "CreamSoups", tags: [] },
];

// ════════════════════════════════════════════════════════════
// HAUPTGERICHTE 1 — FLEISCH & FISCH (70)
// ════════════════════════════════════════════════════════════
const MAINS_MEAT_FISH: SeedRecipe[] = [
  // Paniertes (10)
  { name: "Wiener Schnitzel (Kalb)", category: "MainMeat", tags: [] },
  { name: "Wiener Schnitzel (Schwein)", category: "MainMeat", tags: [] },
  { name: "Backhendl", category: "MainMeat", tags: [] },
  { name: "Cordon Bleu", category: "MainMeat", tags: [] },
  { name: "Putenschnitzel paniert", category: "MainMeat", tags: [] },
  { name: "Gebackene Leber", category: "MainMeat", tags: [] },
  { name: "Gebackener Karpfen", category: "MainFish", tags: [] },
  { name: "Pariser Schnitzel", category: "MainMeat", tags: [] },
  { name: "Surschnitzel", category: "MainMeat", tags: [] },
  { name: "Hühnerschnitzel Natur paniert", category: "MainMeat", tags: [] },
  // Braten & Schmorgerichte (20)
  { name: "Schweinsbraten", category: "MainMeat", tags: [] },
  { name: "Kümmelbraten", category: "MainMeat", tags: [] },
  { name: "Stelze", category: "MainMeat", tags: [] },
  { name: "Tafelspitz", category: "MainMeat", tags: [] },
  { name: "Zwiebelrostbraten", category: "MainMeat", tags: [] },
  { name: "Rindsbraten", category: "MainMeat", tags: [] },
  { name: "Sauerbraten", category: "MainMeat", tags: [] },
  { name: "Kalbsbraten", category: "MainMeat", tags: [] },
  { name: "Faschierter Braten", category: "MainMeat", tags: [] },
  { name: "Tellerfleisch", category: "MainMeat", tags: [] },
  { name: "Geselchtes mit Sauerkraut", category: "MainMeat", tags: [] },
  { name: "Selchfleisch", category: "MainMeat", tags: [] },
  { name: "Spanferkel", category: "MainMeat", tags: [] },
  { name: "Lammkeule", category: "MainMeat", tags: [] },
  { name: "Lammkarree", category: "MainMeat", tags: [] },
  { name: "Schweinemedaillons", category: "MainMeat", tags: [] },
  { name: "Putenbraten", category: "MainMeat", tags: [] },
  { name: "Entenkeule", category: "MainMeat", tags: [] },
  { name: "Ganslbraten", category: "MainMeat", tags: [], season: "winter" },
  { name: "Rehragout", category: "MainMeat", tags: [], season: "winter" },
  // Gulasch & Ragouts (10)
  { name: "Rindsgulasch", category: "MainMeat", tags: [] },
  { name: "Saftgulasch", category: "MainMeat", tags: [] },
  { name: "Fiakergulasch", category: "MainMeat", tags: [] },
  { name: "Kalbsrahmgeschnetzeltes", category: "MainMeat", tags: [] },
  { name: "Zürcher Geschnetzeltes", category: "MainMeat", tags: [] },
  { name: "Putengeschnetzeltes", category: "MainMeat", tags: [] },
  { name: "Hühnergeschnetzeltes", category: "MainMeat", tags: [] },
  { name: "Boeuf Stroganoff", category: "MainMeat", tags: [] },
  { name: "Ragout fin", category: "MainMeat", tags: [] },
  { name: "Kalbsgulasch", category: "MainMeat", tags: [] },
  // Gebraten & Gegrillt (15)
  { name: "Fleischlaberl", category: "MainMeat", tags: [] },
  { name: "Leberkäse", category: "MainMeat", tags: [] },
  { name: "Hühnerkeule überbacken", category: "MainMeat", tags: [] },
  { name: "Hühnerkeule gegrillt", category: "MainMeat", tags: [] },
  { name: "Cevapcici", category: "MainMeat", tags: [] },
  { name: "Grillhendl", category: "MainMeat", tags: [] },
  { name: "Putenmedaillons", category: "MainMeat", tags: [] },
  { name: "Saltimbocca", category: "MainMeat", tags: [] },
  { name: "Beuschel", category: "MainMeat", tags: [] },
  { name: "Beuscherl", category: "MainMeat", tags: [] },
  { name: "Kalbsleber Berliner Art", category: "MainMeat", tags: [] },
  { name: "Blunzengröstl", category: "MainMeat", tags: [] },
  { name: "Tiroler Gröstl", category: "MainMeat", tags: [] },
  { name: "Bauernschmaus", category: "MainMeat", tags: [] },
  { name: "Krainer Würstel", category: "MainMeat", tags: [] },
  // Fisch (15)
  { name: "Gebratenes Forellenfilet", category: "MainFish", tags: [] },
  { name: "Zanderfilet", category: "MainFish", tags: [] },
  { name: "Lachsfilet", category: "MainFish", tags: [] },
  { name: "Fischstäbchen", category: "MainFish", tags: [] },
  { name: "Schollenfilet", category: "MainFish", tags: [] },
  { name: "Kabeljau gebacken", category: "MainFish", tags: [] },
  { name: "Seelachsfilet", category: "MainFish", tags: [] },
  { name: "Dorschfilet", category: "MainFish", tags: [] },
  { name: "Fischknusperle", category: "MainFish", tags: [] },
  { name: "Pangasiusfilet", category: "MainFish", tags: [] },
  { name: "Forelle Müllerin", category: "MainFish", tags: [] },
  { name: "Karpfen blau", category: "MainFish", tags: [] },
  { name: "Matjesfilet", category: "MainFish", tags: [] },
  { name: "Thunfischsteak", category: "MainFish", tags: [] },
  { name: "Garnelenpfanne", category: "MainFish", tags: [] },
];

// ════════════════════════════════════════════════════════════
// HAUPTGERICHTE 2 — VEGETARISCH & VEGAN (70)
// ════════════════════════════════════════════════════════════
const MAINS_VEGAN: SeedRecipe[] = [
  // Teigwaren (15)
  { name: "Käsespätzle", category: "MainVegan", tags: [] },
  { name: "Krautfleckerl", category: "MainVegan", tags: [] },
  { name: "Schinkenfleckerl", category: "MainVegan", tags: [] },
  { name: "Spinatspätzle mit Käsesauce", category: "MainVegan", tags: [] },
  { name: "Pasta Arrabiata", category: "MainVegan", tags: [] },
  { name: "Pasta Pomodoro", category: "MainVegan", tags: [] },
  { name: "Penne al Forno", category: "MainVegan", tags: [] },
  { name: "Lasagne vegetarisch", category: "MainVegan", tags: [] },
  { name: "Nudeln mit Pesto", category: "MainVegan", tags: [] },
  { name: "Rigatoni mit Gemüseragout", category: "MainVegan", tags: [] },
  { name: "Tortellini in Sahnesauce", category: "MainVegan", tags: [] },
  { name: "Spaghetti Aglio e Olio", category: "MainVegan", tags: [] },
  { name: "Mac and Cheese", category: "MainVegan", tags: [] },
  { name: "Nudelauflauf mit Gemüse", category: "MainVegan", tags: [] },
  { name: "Pasta mit Kürbissauce", category: "MainVegan", tags: [] },
  // Strudel & Quiche (10)
  { name: "Gemüsestrudel", category: "MainVegan", tags: [] },
  { name: "Krautstrudel", category: "MainVegan", tags: [] },
  { name: "Spinatstrudel", category: "MainVegan", tags: [] },
  { name: "Kürbis-Feta-Strudel", category: "MainVegan", tags: [] },
  { name: "Quiche Lorraine", category: "MainVegan", tags: [] },
  { name: "Gemüsequiche", category: "MainVegan", tags: [] },
  { name: "Zwiebelkuchen", category: "MainVegan", tags: [] },
  { name: "Lauchquiche", category: "MainVegan", tags: [] },
  { name: "Tomaten-Ziegenkäse-Tarte", category: "MainVegan", tags: [] },
  { name: "Flammkuchen vegetarisch", category: "MainVegan", tags: [] },
  // Knödel & Nockerl (8)
  { name: "Spinatknödel", category: "MainVegan", tags: [] },
  { name: "Kaspressknödel", category: "MainVegan", tags: [] },
  { name: "Topfenknödel", category: "MainVegan", tags: [] },
  { name: "Marillenknödel", category: "MainVegan", tags: [] },
  { name: "Zwetschgenknödel", category: "MainVegan", tags: [] },
  { name: "Mohnnudeln", category: "MainVegan", tags: [] },
  { name: "Germknödel", category: "MainVegan", tags: [] },
  { name: "Serviettenknödel mit Schwammerlsauce", category: "MainVegan", tags: [] },
  // Aufläufe & Gratins (8)
  { name: "Gemüseauflauf", category: "MainVegan", tags: [] },
  { name: "Kartoffelgratin", category: "MainVegan", tags: [] },
  { name: "Moussaka vegetarisch", category: "MainVegan", tags: [] },
  { name: "Zucchini-Auflauf", category: "MainVegan", tags: [] },
  { name: "Broccoli-Gratin", category: "MainVegan", tags: [] },
  { name: "Polenta mit Schwammerl", category: "MainVegan", tags: [] },
  { name: "Polenta-Gemüse-Auflauf", category: "MainVegan", tags: [] },
  { name: "Kürbis-Kartoffel-Gratin", category: "MainVegan", tags: [] },
  // Laibchen, Bratlinge & Co (10)
  { name: "Gemüselaibchen", category: "MainVegan", tags: [] },
  { name: "Erdäpfellaibchen", category: "MainVegan", tags: [] },
  { name: "Linsenlaibchen", category: "MainVegan", tags: [] },
  { name: "Kichererbsen-Bratlinge / Falafel", category: "MainVegan", tags: [] },
  { name: "Rote-Rüben-Laibchen", category: "MainVegan", tags: [] },
  { name: "Hirslaibchen", category: "MainVegan", tags: [] },
  { name: "Zucchini-Puffer", category: "MainVegan", tags: [] },
  { name: "Karotten-Ingwer-Bratlinge", category: "MainVegan", tags: [] },
  { name: "Kürbislaibchen", category: "MainVegan", tags: [] },
  { name: "Kartoffelpuffer", category: "MainVegan", tags: [] },
  // Currys, Eintöpfe & Pfannen (10)
  { name: "Gemüsecurry mit Kokosmilch", category: "MainVegan", tags: [] },
  { name: "Kichererbsen-Curry", category: "MainVegan", tags: [] },
  { name: "Linsen-Dal", category: "MainVegan", tags: [] },
  { name: "Ratatouille", category: "MainVegan", tags: [] },
  { name: "Chili sin Carne", category: "MainVegan", tags: [] },
  { name: "Pilzragout", category: "MainVegan", tags: [] },
  { name: "Eierschwammerl mit Knödel", category: "MainVegan", tags: [] },
  { name: "Erdäpfelgulasch", category: "MainVegan", tags: [] },
  { name: "Gemüsepfanne", category: "MainVegan", tags: [] },
  { name: "Wok-Gemüse mit Sojasauce", category: "MainVegan", tags: [] },
  // Gefüllt & Überbacken (5)
  { name: "Gefüllte Paprika", category: "MainVegan", tags: [] },
  { name: "Gefüllte Zucchini", category: "MainVegan", tags: [] },
  { name: "Überbackene Auberginen", category: "MainVegan", tags: [] },
  { name: "Stuffed Mushrooms / Gefüllte Champignons", category: "MainVegan", tags: [] },
  { name: "Melanzani-Parmigiana", category: "MainVegan", tags: [] },
  // Sonstiges (4)
  { name: "Eierspeise / Bauernomelett", category: "MainVegan", tags: [] },
  { name: "Kaiserschmarrn", category: "MainVegan", tags: [] },
  { name: "Palatschinken gefüllt", category: "MainVegan", tags: [] },
  { name: "Knödel mit Ei", category: "MainVegan", tags: [] },
];

// ════════════════════════════════════════════════════════════
// STÄRKEBEILAGEN (55)
// ════════════════════════════════════════════════════════════
const SIDES_STARCH: SeedRecipe[] = [
  // Kartoffel-Beilagen (20)
  { name: "Petersilkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Salzkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Erdäpfelpüree", category: "Sides", tags: ["stärke"] },
  { name: "Bratkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Röstkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Rösterdäpfel", category: "Sides", tags: ["stärke"] },
  { name: "Kroketten", category: "Sides", tags: ["stärke"] },
  { name: "Pommes Frites", category: "Sides", tags: ["stärke"] },
  { name: "Wedges / Kartoffelspalten", category: "Sides", tags: ["stärke"] },
  { name: "Ofenkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Kartoffelgratin (als Beilage)", category: "Sides", tags: ["stärke"] },
  { name: "Erdäpfelsalat (warm)", category: "Sides", tags: ["stärke"] },
  { name: "Schwenkkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Kartoffelpüree mit Kräutern", category: "Sides", tags: ["stärke"] },
  { name: "Kartoffelpüree mit Muskatnuss", category: "Sides", tags: ["stärke"] },
  { name: "Herzoginkartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Kartoffel-Kroketten selbstgemacht", category: "Sides", tags: ["stärke"] },
  { name: "Hasselback-Kartoffeln", category: "Sides", tags: ["stärke"] },
  { name: "Kartoffelrösti", category: "Sides", tags: ["stärke"] },
  { name: "Erdäpfelpuffer / Reibekuchen", category: "Sides", tags: ["stärke"] },
  // Knödel (10)
  { name: "Semmelknödel", category: "Sides", tags: ["stärke"] },
  { name: "Serviettenknödel", category: "Sides", tags: ["stärke"] },
  { name: "Speckknödel", category: "Sides", tags: ["stärke"] },
  { name: "Waldviertler Knödel", category: "Sides", tags: ["stärke"] },
  { name: "Kartoffelknödel", category: "Sides", tags: ["stärke"] },
  { name: "Grammelknödel", category: "Sides", tags: ["stärke"] },
  { name: "Leberknödel (als Beilage)", category: "Sides", tags: ["stärke"] },
  { name: "Grießknödel", category: "Sides", tags: ["stärke"] },
  { name: "Topfenknödel (pikant, als Beilage)", category: "Sides", tags: ["stärke"] },
  { name: "Böhmische Knödel", category: "Sides", tags: ["stärke"] },
  // Teigwaren & Getreide (15)
  { name: "Spätzle", category: "Sides", tags: ["stärke"] },
  { name: "Eierspätzle", category: "Sides", tags: ["stärke"] },
  { name: "Butternockerl", category: "Sides", tags: ["stärke"] },
  { name: "Nockerl", category: "Sides", tags: ["stärke"] },
  { name: "Spiralnudeln / Fusilli", category: "Sides", tags: ["stärke"] },
  { name: "Penne", category: "Sides", tags: ["stärke"] },
  { name: "Bandnudeln", category: "Sides", tags: ["stärke"] },
  { name: "Reis", category: "Sides", tags: ["stärke"] },
  { name: "Basmatireis", category: "Sides", tags: ["stärke"] },
  { name: "Safranreis", category: "Sides", tags: ["stärke"] },
  { name: "Risotto (als Beilage)", category: "Sides", tags: ["stärke"] },
  { name: "Couscous", category: "Sides", tags: ["stärke"] },
  { name: "Bulgur", category: "Sides", tags: ["stärke"] },
  { name: "Polenta (als Beilage)", category: "Sides", tags: ["stärke"] },
  { name: "Ebly / Weizen", category: "Sides", tags: ["stärke"] },
  // Brot & Sonstiges (10)
  { name: "Semmelknödel (als Scheiben gebraten)", category: "Sides", tags: ["stärke"] },
  { name: "Knödel mit Ei", category: "Sides", tags: ["stärke"] },
  { name: "Schupfnudeln", category: "Sides", tags: ["stärke"] },
  { name: "Gnocchi", category: "Sides", tags: ["stärke"] },
  { name: "Dampfnudeln (pikant)", category: "Sides", tags: ["stärke"] },
  { name: "Maisgrieß", category: "Sides", tags: ["stärke"] },
  { name: "Quinoa", category: "Sides", tags: ["stärke"] },
  { name: "Hirse", category: "Sides", tags: ["stärke"] },
  { name: "Buchweizen", category: "Sides", tags: ["stärke"] },
  { name: "Griesschnitten", category: "Sides", tags: ["stärke"] },
];

// ════════════════════════════════════════════════════════════
// GEMÜSEBEILAGEN (60)
// ════════════════════════════════════════════════════════════
const SIDES_VEG: SeedRecipe[] = [
  // Kraut & Kohl (12)
  { name: "Sauerkraut", category: "Sides", tags: ["gemüse"] },
  { name: "Rotkraut", category: "Sides", tags: ["gemüse"] },
  { name: "Speckkraut", category: "Sides", tags: ["gemüse"] },
  { name: "Rahmsauerkraut", category: "Sides", tags: ["gemüse"] },
  { name: "Kohlsprossen / Rosenkohl", category: "Sides", tags: ["gemüse"] },
  { name: "Kohlsprossen geröstet", category: "Sides", tags: ["gemüse"] },
  { name: "Weißkrautsalat (warm)", category: "Sides", tags: ["gemüse"] },
  { name: "Wirsing / Kohl", category: "Sides", tags: ["gemüse"] },
  { name: "Rahmwirsing", category: "Sides", tags: ["gemüse"] },
  { name: "Chinakohl gedünstet", category: "Sides", tags: ["gemüse"] },
  { name: "Spitzkohl", category: "Sides", tags: ["gemüse"] },
  { name: "Grünkohl", category: "Sides", tags: ["gemüse"] },
  // Wurzel- & Knollengemüse (12)
  { name: "Karottengemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Karottengemüse glasiert", category: "Sides", tags: ["gemüse"] },
  { name: "Rahmkohlrabi", category: "Sides", tags: ["gemüse"] },
  { name: "Kohlrabi-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Wurzelgemüse (Mischung)", category: "Sides", tags: ["gemüse"] },
  { name: "Sellerie-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Pastinaken-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Rübengemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Rote Rüben (warm)", category: "Sides", tags: ["gemüse"] },
  { name: "Topinambur-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Petersilienwurzel-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Steckrüben-Gemüse", category: "Sides", tags: ["gemüse"] },
  // Grünes Gemüse (12)
  { name: "Bratgemüse (Mischung)", category: "Sides", tags: ["gemüse"] },
  { name: "Blattspinat", category: "Sides", tags: ["gemüse"] },
  { name: "Rahmspinat", category: "Sides", tags: ["gemüse"] },
  { name: "Brokkoli", category: "Sides", tags: ["gemüse"] },
  { name: "Broccoli mit Butter", category: "Sides", tags: ["gemüse"] },
  { name: "Fisolen / Grüne Bohnen", category: "Sides", tags: ["gemüse"] },
  { name: "Fisolen mit Speck", category: "Sides", tags: ["gemüse"] },
  { name: "Zuckerschoten", category: "Sides", tags: ["gemüse"] },
  { name: "Erbsen", category: "Sides", tags: ["gemüse"] },
  { name: "Erbsen-Karotten-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Mangold", category: "Sides", tags: ["gemüse"] },
  { name: "Grüner Spargel", category: "Sides", tags: ["gemüse"], season: "spring" },
  // Fruchtgemüse (8)
  { name: "Zucchini-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Zucchini gegrillt", category: "Sides", tags: ["gemüse"] },
  { name: "Tomaten-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Melanzani / Aubergine", category: "Sides", tags: ["gemüse"] },
  { name: "Paprika-Gemüse", category: "Sides", tags: ["gemüse"] },
  { name: "Ofengemüse (Mischung)", category: "Sides", tags: ["gemüse"] },
  { name: "Ratatouille (als Beilage)", category: "Sides", tags: ["gemüse"] },
  { name: "Kürbis-Gemüse", category: "Sides", tags: ["gemüse"] },
  // Pilze (5)
  { name: "Schwammerl / Champignons", category: "Sides", tags: ["gemüse"] },
  { name: "Champignons in Rahm", category: "Sides", tags: ["gemüse"] },
  { name: "Eierschwammerl", category: "Sides", tags: ["gemüse"] },
  { name: "Steinpilze", category: "Sides", tags: ["gemüse"], season: "autumn" },
  { name: "Pilzmischung", category: "Sides", tags: ["gemüse"] },
  // Salate (warm/als Beilage) (6)
  { name: "Vogerlsalat", category: "Sides", tags: ["gemüse"] },
  { name: "Blattsalat", category: "Sides", tags: ["gemüse"] },
  { name: "Gurkensalat", category: "Sides", tags: ["gemüse"] },
  { name: "Tomatensalat", category: "Sides", tags: ["gemüse"] },
  { name: "Gemischter Salat", category: "Sides", tags: ["gemüse"] },
  { name: "Krautsalat", category: "Sides", tags: ["gemüse"] },
  // Klassisch-österreichische Gemüse (5)
  { name: "Preiselbeeren (Kompott)", category: "Sides", tags: ["gemüse"] },
  { name: "Apfelkren", category: "Sides", tags: ["gemüse"] },
  { name: "Semmelkren", category: "Sides", tags: ["gemüse"] },
  { name: "Schnittlauchsauce", category: "Sides", tags: ["gemüse"] },
  { name: "Kräuterdip / Kräuterrahm", category: "Sides", tags: ["gemüse"] },
];

// ════════════════════════════════════════════════════════════
// MEHLSPEISE-GARNITUREN (15)
// Für dessert_main wie Marillenknödel, Mohnnudeln etc.
// ════════════════════════════════════════════════════════════
const GARNISHES: SeedRecipe[] = [
  { name: "Butterbrösel", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Staubzucker", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Vanillesauce", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Zwetschgenröster", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Kompott (gemischt)", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Marillenröster", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Zimtzucker", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Mohnbutter", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Nussbrösel", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Preiselbeerkompott", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Warme Schokoladensauce", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Fruchtcoulis", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Vanilleeis", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Schlagobers", category: "Sides", tags: ["mehlspeise-garnitur"] },
  { name: "Topfencreme", category: "Sides", tags: ["mehlspeise-garnitur"] },
];

// ════════════════════════════════════════════════════════════
// ALL RECIPES
// ════════════════════════════════════════════════════════════
const ALL_RECIPES: SeedRecipe[] = [
  ...SOUPS,
  ...MAINS_MEAT_FISH,
  ...MAINS_VEGAN,
  ...SIDES_STARCH,
  ...SIDES_VEG,
  ...GARNISHES,
];

function log(msg: string) {
  console.log(`[seed-recipe-pool] ${msg}`);
}

async function main() {
  log(`Database: ${DB_URL.replace(/:[^@]+@/, ":***@")}`);
  log(`Recipes to seed: ${ALL_RECIPES.length}`);

  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let added = 0;
    let skipped = 0;

    for (const r of ALL_RECIPES) {
      const result = await client.query(
        `INSERT INTO recipes (name, category, portions, prep_time, steps, allergens, tags, season, updated_at)
         SELECT $1, $2, 1, 30, $3, $4, $5, $6, NOW()
         WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = $1)`,
        [r.name, r.category, [], [], r.tags, r.season || "all"]
      );

      if (result.rowCount && result.rowCount > 0) {
        added++;
      } else {
        skipped++;
      }
    }

    await client.query("COMMIT");

    log("── Summary ──");
    log(`Added:   ${added}`);
    log(`Skipped: ${skipped} (already exist)`);
    log(`Total:   ${ALL_RECIPES.length}`);

    // Category breakdown
    const cats = new Map<string, number>();
    for (const r of ALL_RECIPES) {
      const key = r.tags.includes("stärke") ? "Sides (stärke)" :
                  r.tags.includes("gemüse") ? "Sides (gemüse)" :
                  r.tags.includes("mehlspeise-garnitur") ? "Sides (garnitur)" :
                  r.category;
      cats.set(key, (cats.get(key) || 0) + 1);
    }
    log("── Categories ──");
    for (const [cat, count] of Array.from(cats.entries()).sort()) {
      log(`  ${cat}: ${count}`);
    }

    log("=== Done ===");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

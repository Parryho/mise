/**
 * Seed realistic ingredients for existing recipes in the mise database.
 * Covers 80+ Austrian/hotel-buffet recipes with proper allergen codes (EU 1169/2011).
 *
 * Idempotent: skips recipes that already have ingredients.
 *
 * Usage:
 *   npx tsx script/seed-ingredients.ts
 *   DATABASE_URL=postgresql://... npx tsx script/seed-ingredients.ts
 */

import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  allergens: string[];
}

type IngredientMap = Record<string, Ingredient[]>;

// ════════════════════════════════════════════════════════════
// INGREDIENT DATABASE — keyed by exact recipe name
// Allergen Codes: A=Gluten B=Krebstiere C=Eier D=Fisch E=Erdnüsse
// F=Soja G=Milch H=Schalenfrüchte L=Sellerie M=Senf
// N=Sesam O=Sulfite P=Lupinen R=Weichtiere
// ════════════════════════════════════════════════════════════

const SUPPEN: IngredientMap = {
  "Spargelcremesuppe": [
    { name: "Spargel weiß", amount: 500, unit: "g", allergens: [] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Mehl", amount: 30, unit: "g", allergens: ["A"] },
    { name: "Schlagobers", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Selleriecremesuppe": [
    { name: "Knollensellerie", amount: 400, unit: "g", allergens: ["L"] },
    { name: "Kartoffeln", amount: 200, unit: "g", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Kürbiscremesuppe": [
    { name: "Hokkaido-Kürbis", amount: 600, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 150, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Ingwer", amount: 10, unit: "g", allergens: [] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Kürbiskernöl", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Knoblauchcremesuppe": [
    { name: "Knoblauch", amount: 80, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 200, unit: "g", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Weißbrot", amount: 50, unit: "g", allergens: ["A"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Karottencremesuppe": [
    { name: "Karotten", amount: 500, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 150, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Ingwer", amount: 5, unit: "g", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Tomatencremesuppe": [
    { name: "Tomaten", amount: 600, unit: "g", allergens: [] },
    { name: "Tomatenmark", amount: 30, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 600, unit: "ml", allergens: ["L"] },
    { name: "Basilikum", amount: 1, unit: "Bund", allergens: [] },
    { name: "Zucker", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Champignoncremesuppe": [
    { name: "Champignons", amount: 400, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Mehl", amount: 30, unit: "g", allergens: ["A"] },
    { name: "Schlagobers", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 600, unit: "ml", allergens: ["L"] },
    { name: "Petersilie", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Erbsencremesuppe": [
    { name: "Erbsen tiefgekühlt", amount: 500, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 150, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Minze", amount: 4, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Brokkolicremesuppe": [
    { name: "Brokkoli", amount: 500, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 150, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Blumenkohlcremesuppe": [
    { name: "Blumenkohl", amount: 500, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 150, unit: "g", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Leberknödelsuppe": [
    { name: "Rindsleber", amount: 200, unit: "g", allergens: [] },
    { name: "Semmeln (altbacken)", amount: 3, unit: "Stk", allergens: ["A"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Petersilie", amount: 1, unit: "Bund", allergens: [] },
    { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    { name: "Rindssuppe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Grießnockerlsuppe": [
    { name: "Grieß", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Rindssuppe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Fritatensuppe": [
    { name: "Mehl", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Milch", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Rindssuppe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gulaschsuppe": [
    { name: "Rindfleisch", amount: 300, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 300, unit: "g", allergens: [] },
    { name: "Paprikapulver edelsüß", amount: 2, unit: "EL", allergens: [] },
    { name: "Tomatenmark", amount: 30, unit: "g", allergens: [] },
    { name: "Kartoffeln", amount: 200, unit: "g", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Rindssuppe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Essig", amount: 1, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Erbsensuppe": [
    { name: "Gelbe Erbsen (getrocknet)", amount: 250, unit: "g", allergens: [] },
    { name: "Karotten", amount: 100, unit: "g", allergens: [] },
    { name: "Sellerie", amount: 60, unit: "g", allergens: ["L"] },
    { name: "Speck", amount: 80, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Gemüsebrühe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Linsensuppe": [
    { name: "Linsen braun", amount: 250, unit: "g", allergens: [] },
    { name: "Karotten", amount: 150, unit: "g", allergens: [] },
    { name: "Sellerie", amount: 80, unit: "g", allergens: ["L"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Speck", amount: 50, unit: "g", allergens: [] },
    { name: "Essig", amount: 2, unit: "EL", allergens: [] },
    { name: "Gemüsebrühe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Lorbeerblatt", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Rindssuppe klar": [
    { name: "Rindfleisch (Suppenfleisch)", amount: 500, unit: "g", allergens: [] },
    { name: "Karotten", amount: 200, unit: "g", allergens: [] },
    { name: "Sellerie", amount: 100, unit: "g", allergens: ["L"] },
    { name: "Lauch", amount: 100, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Pfefferkörner", amount: 5, unit: "Stk", allergens: [] },
    { name: "Lorbeerblatt", amount: 2, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Nudelsuppe": [
    { name: "Suppennudeln", amount: 100, unit: "g", allergens: ["A", "C"] },
    { name: "Rindssuppe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Minestrone": [
    { name: "Zucchini", amount: 150, unit: "g", allergens: [] },
    { name: "Karotten", amount: 100, unit: "g", allergens: [] },
    { name: "Sellerie", amount: 80, unit: "g", allergens: ["L"] },
    { name: "Kartoffeln", amount: 150, unit: "g", allergens: [] },
    { name: "Bohnen (Dose)", amount: 200, unit: "g", allergens: [] },
    { name: "Nudeln klein", amount: 80, unit: "g", allergens: ["A"] },
    { name: "Tomaten (Dose)", amount: 400, unit: "g", allergens: [] },
    { name: "Parmesan", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Olivenöl", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Französische Zwiebelsuppe": [
    { name: "Zwiebeln", amount: 600, unit: "g", allergens: [] },
    { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
    { name: "Rindssuppe", amount: 1000, unit: "ml", allergens: ["L"] },
    { name: "Weißwein", amount: 100, unit: "ml", allergens: ["O"] },
    { name: "Gruyère", amount: 100, unit: "g", allergens: ["G"] },
    { name: "Baguette", amount: 4, unit: "Stk", allergens: ["A"] },
    { name: "Thymian", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
};

const FLEISCH: IngredientMap = {
  "Wiener Schnitzel (Kalb)": [
    { name: "Kalbsschnitzel", amount: 720, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 60, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Butterschmalz", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Zitrone", amount: 2, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Wiener Schnitzel (Schwein)": [
    { name: "Schweineschnitzel", amount: 720, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 60, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Butterschmalz", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Zitrone", amount: 2, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Backhendl": [
    { name: "Hühnerteile", amount: 800, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 80, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Butterschmalz", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Zitrone", amount: 1, unit: "Stk", allergens: [] },
    { name: "Paprikapulver", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Cordon Bleu": [
    { name: "Schweineschnitzel", amount: 800, unit: "g", allergens: [] },
    { name: "Schinken gekocht", amount: 160, unit: "g", allergens: [] },
    { name: "Emmentaler", amount: 160, unit: "g", allergens: ["G"] },
    { name: "Mehl glatt", amount: 60, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Butterschmalz", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Rindsgulasch": [
    { name: "Rindfleisch (Wadschinken)", amount: 800, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 500, unit: "g", allergens: [] },
    { name: "Paprikapulver edelsüß", amount: 3, unit: "EL", allergens: [] },
    { name: "Tomatenmark", amount: 2, unit: "EL", allergens: [] },
    { name: "Schweineschmalz", amount: 3, unit: "EL", allergens: [] },
    { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    { name: "Essig", amount: 2, unit: "EL", allergens: [] },
    { name: "Rindsbrühe", amount: 300, unit: "ml", allergens: ["L"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Zwiebelrostbraten": [
    { name: "Beiried (Rostbraten)", amount: 800, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 4, unit: "Stk", allergens: [] },
    { name: "Mehl glatt", amount: 40, unit: "g", allergens: ["A"] },
    { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
    { name: "Rindsbrühe", amount: 200, unit: "ml", allergens: ["L"] },
    { name: "Butterschmalz", amount: 3, unit: "EL", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    { name: "Pfeffer", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Schweinsbraten": [
    { name: "Schweineschulter", amount: 1200, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 2, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 3, unit: "Stk", allergens: [] },
    { name: "Kümmel", amount: 2, unit: "TL", allergens: [] },
    { name: "Senf", amount: 2, unit: "EL", allergens: ["M"] },
    { name: "Bier dunkel", amount: 250, unit: "ml", allergens: ["A"] },
    { name: "Salz", amount: 1, unit: "EL", allergens: [] },
  ],
  "Tafelspitz": [
    { name: "Tafelspitz", amount: 1000, unit: "g", allergens: [] },
    { name: "Suppengrün (Karotte, Sellerie, Lauch)", amount: 250, unit: "g", allergens: ["L"] },
    { name: "Zwiebel (halbiert)", amount: 1, unit: "Stk", allergens: [] },
    { name: "Pfefferkörner", amount: 1, unit: "TL", allergens: [] },
    { name: "Lorbeerblatt", amount: 2, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "EL", allergens: [] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
  ],
  "Faschierter Braten": [
    { name: "Faschiertes gemischt", amount: 600, unit: "g", allergens: [] },
    { name: "Semmeln (altbacken)", amount: 2, unit: "Stk", allergens: ["A"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Senf", amount: 1, unit: "EL", allergens: ["M"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Paprikapulver", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Fleischlaberl": [
    { name: "Faschiertes Rind/Schwein", amount: 500, unit: "g", allergens: [] },
    { name: "Semmel (altbacken)", amount: 1, unit: "Stk", allergens: ["A"] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    { name: "Öl zum Braten", amount: 3, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Kalbsrahmgeschnetzeltes": [
    { name: "Kalbfleisch (Schulter)", amount: 600, unit: "g", allergens: [] },
    { name: "Champignons", amount: 200, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Schlagobers", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Weißwein", amount: 80, unit: "ml", allergens: ["O"] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Mehl", amount: 1, unit: "EL", allergens: ["A"] },
    { name: "Zitronensaft", amount: 1, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Putengeschnetzeltes": [
    { name: "Putenbrustfilet", amount: 600, unit: "g", allergens: [] },
    { name: "Champignons", amount: 150, unit: "g", allergens: [] },
    { name: "Paprika bunt", amount: 1, unit: "Stk", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Öl", amount: 2, unit: "EL", allergens: [] },
    { name: "Paprikapulver", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Geselchtes mit Sauerkraut": [
    { name: "Geselchtes (Teilsames)", amount: 600, unit: "g", allergens: [] },
    { name: "Sauerkraut", amount: 500, unit: "g", allergens: ["O"] },
    { name: "Wacholderbeeren", amount: 5, unit: "Stk", allergens: [] },
    { name: "Lorbeerblatt", amount: 1, unit: "Stk", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Schweineschmalz", amount: 2, unit: "EL", allergens: [] },
  ],
  "Cevapcici": [
    { name: "Faschiertes Rind/Lamm", amount: 500, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 3, unit: "Stk", allergens: [] },
    { name: "Paprikapulver", amount: 2, unit: "TL", allergens: [] },
    { name: "Kreuzkümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Ajvar", amount: 3, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Leberkäse": [
    { name: "Leberkäse (Brät)", amount: 600, unit: "g", allergens: [] },
    { name: "Senf", amount: 4, unit: "EL", allergens: ["M"] },
    { name: "Kren frisch", amount: 50, unit: "g", allergens: [] },
  ],
  "Saltimbocca": [
    { name: "Kalbsschnitzel dünn", amount: 600, unit: "g", allergens: [] },
    { name: "Parmaschinken", amount: 8, unit: "Scheibe", allergens: [] },
    { name: "Salbei", amount: 12, unit: "Blatt", allergens: [] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Weißwein", amount: 100, unit: "ml", allergens: ["O"] },
    { name: "Mehl", amount: 2, unit: "EL", allergens: ["A"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Tiroler Gröstl": [
    { name: "Kartoffeln gekocht", amount: 500, unit: "g", allergens: [] },
    { name: "Rindfleisch gekocht", amount: 300, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 2, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Spiegeleier", amount: 4, unit: "Stk", allergens: ["C"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Rindsbraten": [
    { name: "Rindfleisch (Schulterscherzel)", amount: 1000, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 2, unit: "Stk", allergens: [] },
    { name: "Karotten", amount: 2, unit: "Stk", allergens: [] },
    { name: "Sellerie", amount: 80, unit: "g", allergens: ["L"] },
    { name: "Tomatenmark", amount: 2, unit: "EL", allergens: [] },
    { name: "Rotwein", amount: 200, unit: "ml", allergens: ["O"] },
    { name: "Rindsbrühe", amount: 300, unit: "ml", allergens: ["L"] },
    { name: "Lorbeerblatt", amount: 2, unit: "Stk", allergens: [] },
    { name: "Öl", amount: 3, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Boeuf Stroganoff": [
    { name: "Rindsfiletspitzen", amount: 600, unit: "g", allergens: [] },
    { name: "Champignons", amount: 200, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Essiggurken", amount: 3, unit: "Stk", allergens: [] },
    { name: "Sauerrahm", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
    { name: "Tomatenmark", amount: 1, unit: "EL", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Stelze": [
    { name: "Schweinsstelze", amount: 1500, unit: "g", allergens: [] },
    { name: "Kümmel", amount: 2, unit: "TL", allergens: [] },
    { name: "Knoblauch", amount: 4, unit: "Stk", allergens: [] },
    { name: "Bier dunkel", amount: 500, unit: "ml", allergens: ["A"] },
    { name: "Salz", amount: 2, unit: "EL", allergens: [] },
  ],
  "Saftgulasch": [
    { name: "Rindfleisch", amount: 800, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 600, unit: "g", allergens: [] },
    { name: "Paprikapulver edelsüß", amount: 3, unit: "EL", allergens: [] },
    { name: "Tomatenmark", amount: 2, unit: "EL", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    { name: "Essig", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
};

const FISCH: IngredientMap = {
  "Gebratenes Forellenfilet": [
    { name: "Forellenfilet", amount: 600, unit: "g", allergens: ["D"] },
    { name: "Mehl glatt", amount: 40, unit: "g", allergens: ["A"] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Zitrone", amount: 1, unit: "Stk", allergens: [] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Lachsfilet": [
    { name: "Lachsfilet", amount: 600, unit: "g", allergens: ["D"] },
    { name: "Olivenöl", amount: 2, unit: "EL", allergens: [] },
    { name: "Zitrone", amount: 1, unit: "Stk", allergens: [] },
    { name: "Dill", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    { name: "Pfeffer", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Fischstäbchen": [
    { name: "Fischstäbchen TK", amount: 16, unit: "Stk", allergens: ["A", "D"] },
    { name: "Zitrone", amount: 1, unit: "Stk", allergens: [] },
  ],
  "Zanderfilet": [
    { name: "Zanderfilet", amount: 600, unit: "g", allergens: ["D"] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Weißwein", amount: 80, unit: "ml", allergens: ["O"] },
    { name: "Zitronensaft", amount: 2, unit: "EL", allergens: [] },
    { name: "Kapern", amount: 1, unit: "EL", allergens: [] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Forelle Müllerin": [
    { name: "Forelle ganz", amount: 4, unit: "Stk", allergens: ["D"] },
    { name: "Mehl glatt", amount: 60, unit: "g", allergens: ["A"] },
    { name: "Butter", amount: 80, unit: "g", allergens: ["G"] },
    { name: "Zitrone", amount: 2, unit: "Stk", allergens: [] },
    { name: "Petersilie", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gebackener Karpfen": [
    { name: "Karpfenfilet", amount: 600, unit: "g", allergens: ["D"] },
    { name: "Mehl glatt", amount: 60, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Semmelbrösel", amount: 80, unit: "g", allergens: ["A"] },
    { name: "Butterschmalz", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Zitrone", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Garnelenpfanne": [
    { name: "Garnelen geschält", amount: 400, unit: "g", allergens: ["B"] },
    { name: "Knoblauch", amount: 3, unit: "Stk", allergens: [] },
    { name: "Chili", amount: 1, unit: "Stk", allergens: [] },
    { name: "Olivenöl", amount: 3, unit: "EL", allergens: [] },
    { name: "Cherry-Tomaten", amount: 200, unit: "g", allergens: [] },
    { name: "Weißwein", amount: 80, unit: "ml", allergens: ["O"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Zitrone", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
};

const VEGETARISCH: IngredientMap = {
  "Spinatknödel": [
    { name: "Blattspinat", amount: 300, unit: "g", allergens: [] },
    { name: "Knödelbrot", amount: 200, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Milch", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Parmesan", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Kaiserschmarrn": [
    { name: "Mehl glatt", amount: 150, unit: "g", allergens: ["A"] },
    { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Eier", amount: 4, unit: "Stk", allergens: ["C"] },
    { name: "Zucker", amount: 30, unit: "g", allergens: [] },
    { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
    { name: "Rosinen", amount: 40, unit: "g", allergens: ["O"] },
    { name: "Vanillezucker", amount: 1, unit: "TL", allergens: [] },
    { name: "Staubzucker", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gemüsestrudel": [
    { name: "Strudelteig", amount: 4, unit: "Blatt", allergens: ["A"] },
    { name: "Zucchini", amount: 1, unit: "Stk", allergens: [] },
    { name: "Paprika", amount: 1, unit: "Stk", allergens: [] },
    { name: "Karotten", amount: 2, unit: "Stk", allergens: [] },
    { name: "Champignons", amount: 150, unit: "g", allergens: [] },
    { name: "Feta", amount: 100, unit: "g", allergens: ["G"] },
    { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
    { name: "Semmelbrösel", amount: 3, unit: "EL", allergens: ["A"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Kaspressknödel": [
    { name: "Knödelbrot", amount: 200, unit: "g", allergens: ["A"] },
    { name: "Bergkäse", amount: 150, unit: "g", allergens: ["G"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Milch", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Käsespätzle": [
    { name: "Mehl griffig", amount: 300, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 4, unit: "Stk", allergens: ["C"] },
    { name: "Wasser", amount: 150, unit: "ml", allergens: [] },
    { name: "Bergkäse gerieben", amount: 200, unit: "g", allergens: ["G"] },
    { name: "Zwiebeln (Röstzwiebel)", amount: 2, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Krautfleckerl": [
    { name: "Fleckerl (Pasta)", amount: 300, unit: "g", allergens: ["A", "C"] },
    { name: "Weißkraut", amount: 500, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Schweineschmalz", amount: 40, unit: "g", allergens: [] },
    { name: "Zucker", amount: 1, unit: "EL", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Pasta Arrabiata": [
    { name: "Penne", amount: 400, unit: "g", allergens: ["A"] },
    { name: "Tomaten geschält (Dose)", amount: 400, unit: "g", allergens: [] },
    { name: "Knoblauch", amount: 3, unit: "Stk", allergens: [] },
    { name: "Chili getrocknet", amount: 2, unit: "Stk", allergens: [] },
    { name: "Olivenöl", amount: 4, unit: "EL", allergens: [] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Lasagne vegetarisch": [
    { name: "Lasagneplatten", amount: 250, unit: "g", allergens: ["A", "C"] },
    { name: "Zucchini", amount: 2, unit: "Stk", allergens: [] },
    { name: "Champignons", amount: 200, unit: "g", allergens: [] },
    { name: "Spinat", amount: 200, unit: "g", allergens: [] },
    { name: "Tomaten passiert", amount: 500, unit: "ml", allergens: [] },
    { name: "Bechamelsauce", amount: 400, unit: "ml", allergens: ["A", "G"] },
    { name: "Mozzarella", amount: 200, unit: "g", allergens: ["G"] },
    { name: "Parmesan", amount: 50, unit: "g", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Erdäpfelgulasch": [
    { name: "Kartoffeln mehlig", amount: 800, unit: "g", allergens: [] },
    { name: "Zwiebeln", amount: 3, unit: "Stk", allergens: [] },
    { name: "Frankfurter Würstel", amount: 4, unit: "Stk", allergens: [] },
    { name: "Paprikapulver edelsüß", amount: 2, unit: "EL", allergens: [] },
    { name: "Tomatenmark", amount: 2, unit: "EL", allergens: [] },
    { name: "Essig", amount: 1, unit: "EL", allergens: [] },
    { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Gemüsebrühe", amount: 500, unit: "ml", allergens: ["L"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gemüselaibchen": [
    { name: "Karotten", amount: 2, unit: "Stk", allergens: [] },
    { name: "Zucchini", amount: 1, unit: "Stk", allergens: [] },
    { name: "Kartoffeln gekocht", amount: 2, unit: "Stk", allergens: [] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Semmelbrösel", amount: 50, unit: "g", allergens: ["A"] },
    { name: "Kräuter gemischt", amount: 2, unit: "EL", allergens: [] },
    { name: "Öl zum Braten", amount: 3, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gemüsecurry mit Kokosmilch": [
    { name: "Kokosmilch", amount: 400, unit: "ml", allergens: [] },
    { name: "Kichererbsen (Dose)", amount: 250, unit: "g", allergens: [] },
    { name: "Paprika bunt", amount: 2, unit: "Stk", allergens: [] },
    { name: "Süßkartoffel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Currypaste rot", amount: 2, unit: "EL", allergens: [] },
    { name: "Ingwer frisch", amount: 1, unit: "EL", allergens: [] },
    { name: "Sojasauce", amount: 2, unit: "EL", allergens: ["A", "F"] },
    { name: "Limette", amount: 1, unit: "Stk", allergens: [] },
    { name: "Koriander", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Ratatouille": [
    { name: "Zucchini", amount: 2, unit: "Stk", allergens: [] },
    { name: "Aubergine", amount: 1, unit: "Stk", allergens: [] },
    { name: "Paprika bunt", amount: 2, unit: "Stk", allergens: [] },
    { name: "Tomaten reif", amount: 4, unit: "Stk", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 3, unit: "Stk", allergens: [] },
    { name: "Olivenöl", amount: 4, unit: "EL", allergens: [] },
    { name: "Thymian", amount: 1, unit: "TL", allergens: [] },
    { name: "Basilikum", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Palatschinken gefüllt": [
    { name: "Mehl glatt", amount: 150, unit: "g", allergens: ["A"] },
    { name: "Milch", amount: 250, unit: "ml", allergens: ["G"] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Topfen", amount: 250, unit: "g", allergens: ["G"] },
    { name: "Zucker", amount: 40, unit: "g", allergens: [] },
    { name: "Vanillezucker", amount: 1, unit: "TL", allergens: [] },
    { name: "Rosinen", amount: 30, unit: "g", allergens: ["O"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Kartoffelgratin": [
    { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
    { name: "Schlagobers", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Milch", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
    { name: "Emmentaler gerieben", amount: 100, unit: "g", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Chili sin Carne": [
    { name: "Kidneybohnen (Dose)", amount: 250, unit: "g", allergens: [] },
    { name: "Mais (Dose)", amount: 150, unit: "g", allergens: [] },
    { name: "Tomaten geschält (Dose)", amount: 400, unit: "g", allergens: [] },
    { name: "Paprika rot", amount: 1, unit: "Stk", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
    { name: "Chilipulver", amount: 2, unit: "TL", allergens: [] },
    { name: "Kreuzkümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Olivenöl", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gefüllte Paprika": [
    { name: "Paprika groß", amount: 4, unit: "Stk", allergens: [] },
    { name: "Reis", amount: 200, unit: "g", allergens: [] },
    { name: "Faschiertes Rind", amount: 300, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Tomaten passiert", amount: 500, unit: "ml", allergens: [] },
    { name: "Sauerrahm", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Schinkenfleckerl": [
    { name: "Fleckerl (Pasta)", amount: 300, unit: "g", allergens: ["A", "C"] },
    { name: "Schinken gekocht", amount: 200, unit: "g", allergens: [] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Pilzragout": [
    { name: "Gemischte Pilze", amount: 500, unit: "g", allergens: [] },
    { name: "Schalotten", amount: 3, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Weißwein", amount: 80, unit: "ml", allergens: ["O"] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Thymian", amount: 1, unit: "TL", allergens: [] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Spaghetti Aglio e Olio": [
    { name: "Spaghetti", amount: 400, unit: "g", allergens: ["A"] },
    { name: "Knoblauch", amount: 6, unit: "Stk", allergens: [] },
    { name: "Olivenöl extra vergine", amount: 80, unit: "ml", allergens: [] },
    { name: "Chili getrocknet", amount: 2, unit: "Stk", allergens: [] },
    { name: "Petersilie", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Mac and Cheese": [
    { name: "Macaroni", amount: 350, unit: "g", allergens: ["A"] },
    { name: "Cheddar", amount: 200, unit: "g", allergens: ["G"] },
    { name: "Milch", amount: 300, unit: "ml", allergens: ["G"] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Mehl", amount: 30, unit: "g", allergens: ["A"] },
    { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Kichererbsen-Bratlinge / Falafel": [
    { name: "Kichererbsen eingeweicht", amount: 300, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 3, unit: "Stk", allergens: [] },
    { name: "Koriander frisch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Petersilie", amount: 1, unit: "Bund", allergens: [] },
    { name: "Kreuzkümmel", amount: 2, unit: "TL", allergens: [] },
    { name: "Sesam", amount: 2, unit: "EL", allergens: ["N"] },
    { name: "Öl zum Frittieren", amount: 500, unit: "ml", allergens: [] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Linsen-Dal": [
    { name: "Rote Linsen", amount: 250, unit: "g", allergens: [] },
    { name: "Kokosmilch", amount: 200, unit: "ml", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
    { name: "Ingwer frisch", amount: 1, unit: "EL", allergens: [] },
    { name: "Kurkuma", amount: 1, unit: "TL", allergens: [] },
    { name: "Kreuzkümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Tomaten gehackt", amount: 200, unit: "g", allergens: [] },
    { name: "Koriander frisch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Eierschwammerl mit Knödel": [
    { name: "Eierschwammerl (Pfifferlinge)", amount: 400, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Flammkuchen vegetarisch": [
    { name: "Flammkuchenteig", amount: 300, unit: "g", allergens: ["A"] },
    { name: "Crème fraîche", amount: 200, unit: "g", allergens: ["G"] },
    { name: "Zwiebeln", amount: 2, unit: "Stk", allergens: [] },
    { name: "Champignons", amount: 100, unit: "g", allergens: [] },
    { name: "Paprika", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
};

const BEILAGEN: IngredientMap = {
  "Petersilkartoffeln": [
    { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Petersilie frisch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Semmelknödel": [
    { name: "Semmeln (altbacken)", amount: 6, unit: "Stk", allergens: ["A"] },
    { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Spätzle": [
    { name: "Mehl griffig", amount: 300, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Wasser", amount: 100, unit: "ml", allergens: [] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Erdäpfelpüree": [
    { name: "Kartoffeln mehlig", amount: 800, unit: "g", allergens: [] },
    { name: "Milch", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Reis": [
    { name: "Langkornreis", amount: 300, unit: "g", allergens: [] },
    { name: "Wasser", amount: 600, unit: "ml", allergens: [] },
    { name: "Butter", amount: 10, unit: "g", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Pommes Frites": [
    { name: "Kartoffeln festkochend", amount: 1000, unit: "g", allergens: [] },
    { name: "Sonnenblumenöl", amount: 1000, unit: "ml", allergens: [] },
    { name: "Salz", amount: 1, unit: "EL", allergens: [] },
  ],
  "Kartoffelknödel": [
    { name: "Kartoffeln mehlig gekocht", amount: 1000, unit: "g", allergens: [] },
    { name: "Kartoffelstärke", amount: 80, unit: "g", allergens: [] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Grieß", amount: 50, unit: "g", allergens: ["A"] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Schupfnudeln": [
    { name: "Kartoffeln mehlig gekocht", amount: 800, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Serviettenknödel": [
    { name: "Weißbrot / Semmelwürfel", amount: 250, unit: "g", allergens: ["A"] },
    { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Couscous": [
    { name: "Couscous", amount: 250, unit: "g", allergens: ["A"] },
    { name: "Gemüsebrühe", amount: 300, unit: "ml", allergens: [] },
    { name: "Olivenöl", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Polenta (als Beilage)": [
    { name: "Maisgrieß (Polenta)", amount: 200, unit: "g", allergens: [] },
    { name: "Wasser", amount: 800, unit: "ml", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Parmesan", amount: 40, unit: "g", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "TL", allergens: [] },
  ],
  "Sauerkraut": [
    { name: "Sauerkraut", amount: 500, unit: "g", allergens: ["O"] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Schweineschmalz", amount: 2, unit: "EL", allergens: [] },
    { name: "Wacholderbeeren", amount: 5, unit: "Stk", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Zucker", amount: 1, unit: "TL", allergens: [] },
  ],
  "Rotkraut": [
    { name: "Rotkraut", amount: 500, unit: "g", allergens: ["O"] },
    { name: "Apfel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Schweineschmalz", amount: 2, unit: "EL", allergens: [] },
    { name: "Zucker", amount: 2, unit: "EL", allergens: [] },
    { name: "Essig", amount: 2, unit: "EL", allergens: [] },
    { name: "Nelken", amount: 2, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Rahmspinat": [
    { name: "Blattspinat", amount: 500, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Knoblauch", amount: 1, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 80, unit: "ml", allergens: ["G"] },
    { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gurkensalat": [
    { name: "Salatgurke", amount: 1, unit: "Stk", allergens: [] },
    { name: "Sauerrahm", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Essig", amount: 2, unit: "EL", allergens: [] },
    { name: "Dill", amount: 1, unit: "Bund", allergens: [] },
    { name: "Knoblauch", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Gemischter Salat": [
    { name: "Häuptelsalat", amount: 1, unit: "Stk", allergens: [] },
    { name: "Tomaten", amount: 2, unit: "Stk", allergens: [] },
    { name: "Gurke", amount: 0.5, unit: "Stk", allergens: [] },
    { name: "Karotten geraspelt", amount: 1, unit: "Stk", allergens: [] },
    { name: "Essig", amount: 2, unit: "EL", allergens: [] },
    { name: "Kürbiskernöl", amount: 3, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Erdäpfelsalat (warm)": [
    { name: "Kartoffeln speckig", amount: 800, unit: "g", allergens: [] },
    { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    { name: "Rindsbrühe warm", amount: 150, unit: "ml", allergens: ["L"] },
    { name: "Essig", amount: 3, unit: "EL", allergens: [] },
    { name: "Sonnenblumenöl", amount: 4, unit: "EL", allergens: [] },
    { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Karottengemüse glasiert": [
    { name: "Karotten", amount: 500, unit: "g", allergens: [] },
    { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    { name: "Zucker", amount: 1, unit: "EL", allergens: [] },
    { name: "Petersilie", amount: 1, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Brokkoli": [
    { name: "Brokkoli", amount: 600, unit: "g", allergens: [] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Knoblauch", amount: 1, unit: "Stk", allergens: [] },
    { name: "Zitronensaft", amount: 1, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Erbsen-Karotten-Gemüse": [
    { name: "Erbsen TK", amount: 250, unit: "g", allergens: [] },
    { name: "Karotten", amount: 3, unit: "Stk", allergens: [] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Petersilie", amount: 1, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
};

const DESSERTS_SAUCEN: IngredientMap = {
  "Topfenknödel": [
    { name: "Topfen 20%", amount: 500, unit: "g", allergens: ["G"] },
    { name: "Butter", amount: 60, unit: "g", allergens: ["G"] },
    { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Grieß", amount: 80, unit: "g", allergens: ["A"] },
    { name: "Semmelbrösel", amount: 50, unit: "g", allergens: ["A"] },
    { name: "Zucker", amount: 40, unit: "g", allergens: [] },
    { name: "Vanillezucker", amount: 1, unit: "TL", allergens: [] },
    { name: "Butterbrösel zum Wälzen", amount: 80, unit: "g", allergens: ["A", "G"] },
    { name: "Staubzucker", amount: 2, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Marillenknödel": [
    { name: "Kartoffeln mehlig gekocht", amount: 500, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Marillen (Aprikosen)", amount: 8, unit: "Stk", allergens: [] },
    { name: "Würfelzucker", amount: 8, unit: "Stk", allergens: [] },
    { name: "Butterbrösel", amount: 100, unit: "g", allergens: ["A", "G"] },
    { name: "Staubzucker", amount: 2, unit: "EL", allergens: [] },
    { name: "Zimt", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Apfelstrudel": [
    { name: "Strudelteig", amount: 200, unit: "g", allergens: ["A"] },
    { name: "Äpfel säuerlich", amount: 1000, unit: "g", allergens: [] },
    { name: "Zucker", amount: 80, unit: "g", allergens: [] },
    { name: "Rosinen", amount: 50, unit: "g", allergens: ["O"] },
    { name: "Semmelbrösel", amount: 60, unit: "g", allergens: ["A"] },
    { name: "Butter flüssig", amount: 80, unit: "g", allergens: ["G"] },
    { name: "Zimt", amount: 2, unit: "TL", allergens: [] },
    { name: "Walnüsse gehackt", amount: 30, unit: "g", allergens: ["H"] },
    { name: "Staubzucker", amount: 2, unit: "EL", allergens: [] },
  ],
  "Sachertorte": [
    { name: "Butter", amount: 150, unit: "g", allergens: ["G"] },
    { name: "Zucker", amount: 150, unit: "g", allergens: [] },
    { name: "Zartbitterschokolade", amount: 150, unit: "g", allergens: ["G"] },
    { name: "Eier", amount: 6, unit: "Stk", allergens: ["C"] },
    { name: "Mehl glatt", amount: 150, unit: "g", allergens: ["A"] },
    { name: "Marillenmarmelade", amount: 200, unit: "g", allergens: [] },
    { name: "Kuvertüre Zartbitter", amount: 200, unit: "g", allergens: ["G"] },
  ],
  "Germknödel": [
    { name: "Mehl glatt", amount: 500, unit: "g", allergens: ["A"] },
    { name: "Milch lauwarm", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Germ (Hefe)", amount: 20, unit: "g", allergens: [] },
    { name: "Butter", amount: 60, unit: "g", allergens: ["G"] },
    { name: "Zucker", amount: 50, unit: "g", allergens: [] },
    { name: "Eigelb", amount: 2, unit: "Stk", allergens: ["C"] },
    { name: "Powidl (Zwetschgenmus)", amount: 150, unit: "g", allergens: [] },
    { name: "Mohnbutter", amount: 100, unit: "g", allergens: ["G"] },
    { name: "Vanillesauce", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Mohnnudeln": [
    { name: "Kartoffeln mehlig gekocht", amount: 500, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Mohn gemahlen", amount: 100, unit: "g", allergens: [] },
    { name: "Butter", amount: 60, unit: "g", allergens: ["G"] },
    { name: "Staubzucker", amount: 50, unit: "g", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Zwetschgenknödel": [
    { name: "Kartoffeln mehlig gekocht", amount: 500, unit: "g", allergens: [] },
    { name: "Mehl glatt", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
    { name: "Zwetschgen entsteint", amount: 12, unit: "Stk", allergens: [] },
    { name: "Würfelzucker", amount: 12, unit: "Stk", allergens: [] },
    { name: "Butterbrösel", amount: 100, unit: "g", allergens: ["A", "G"] },
    { name: "Staubzucker", amount: 2, unit: "EL", allergens: [] },
    { name: "Zimt", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Vanillesauce": [
    { name: "Milch", amount: 500, unit: "ml", allergens: ["G"] },
    { name: "Eigelb", amount: 3, unit: "Stk", allergens: ["C"] },
    { name: "Zucker", amount: 60, unit: "g", allergens: [] },
    { name: "Vanilleschote", amount: 1, unit: "Stk", allergens: [] },
    { name: "Speisestärke", amount: 1, unit: "EL", allergens: [] },
  ],
  "Schnittlauchsauce": [
    { name: "Sauerrahm", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Schnittlauch", amount: 2, unit: "Bund", allergens: [] },
    { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
    { name: "Zitronensaft", amount: 1, unit: "EL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Semmelkren": [
    { name: "Semmel altbacken", amount: 2, unit: "Stk", allergens: ["A"] },
    { name: "Rindssuppe", amount: 200, unit: "ml", allergens: ["L"] },
    { name: "Kren frisch gerieben", amount: 50, unit: "g", allergens: [] },
    { name: "Schlagobers", amount: 50, unit: "ml", allergens: ["G"] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Apfelkren": [
    { name: "Äpfel säuerlich", amount: 2, unit: "Stk", allergens: [] },
    { name: "Kren frisch gerieben", amount: 50, unit: "g", allergens: [] },
    { name: "Schlagobers", amount: 50, unit: "ml", allergens: ["G"] },
    { name: "Zitronensaft", amount: 1, unit: "EL", allergens: [] },
    { name: "Zucker", amount: 1, unit: "TL", allergens: [] },
  ],
  "Butterbrösel": [
    { name: "Butter", amount: 80, unit: "g", allergens: ["G"] },
    { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
    { name: "Zucker", amount: 2, unit: "EL", allergens: [] },
  ],
  "Preiselbeerkompott": [
    { name: "Preiselbeeren", amount: 300, unit: "g", allergens: [] },
    { name: "Zucker", amount: 100, unit: "g", allergens: [] },
    { name: "Wasser", amount: 50, unit: "ml", allergens: [] },
    { name: "Zitronensaft", amount: 1, unit: "EL", allergens: [] },
  ],
  "Kräuterdip / Kräuterrahm": [
    { name: "Sauerrahm", amount: 200, unit: "ml", allergens: ["G"] },
    { name: "Joghurt natur", amount: 100, unit: "ml", allergens: ["G"] },
    { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
    { name: "Petersilie", amount: 2, unit: "EL", allergens: [] },
    { name: "Knoblauch", amount: 1, unit: "Stk", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
  "Warme Schokoladensauce": [
    { name: "Zartbitterschokolade", amount: 150, unit: "g", allergens: ["G"] },
    { name: "Schlagobers", amount: 150, unit: "ml", allergens: ["G"] },
    { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    { name: "Zucker", amount: 1, unit: "EL", allergens: [] },
  ],
  "Krautsalat": [
    { name: "Weißkraut", amount: 400, unit: "g", allergens: [] },
    { name: "Karotte", amount: 1, unit: "Stk", allergens: [] },
    { name: "Essig", amount: 3, unit: "EL", allergens: [] },
    { name: "Sonnenblumenöl", amount: 3, unit: "EL", allergens: [] },
    { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
    { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
  ],
};

// ════════════════════════════════════════════════════════════
// MERGE ALL
// ════════════════════════════════════════════════════════════

const RECIPE_INGREDIENTS: IngredientMap = {
  ...SUPPEN,
  ...FLEISCH,
  ...FISCH,
  ...VEGETARISCH,
  ...BEILAGEN,
  ...DESSERTS_SAUCEN,
};

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════

function log(msg: string) {
  console.log(`[seed-ingredients] ${msg}`);
}

async function main() {
  const recipeNames = Object.keys(RECIPE_INGREDIENTS);
  log(`Database: ${DB_URL.replace(/:[^@]+@/, ":***@")}`);
  log(`Recipes with ingredient data: ${recipeNames.length}`);

  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let recipesUpdated = 0;
    let recipesSkipped = 0;
    let recipesNotFound = 0;
    let totalIngredients = 0;

    for (const [recipeName, ingredients] of Object.entries(RECIPE_INGREDIENTS)) {
      // Find recipe by name
      const recipeResult = await client.query(
        `SELECT id FROM recipes WHERE name = $1`,
        [recipeName]
      );

      if (recipeResult.rows.length === 0) {
        log(`  NOT FOUND: "${recipeName}"`);
        recipesNotFound++;
        continue;
      }

      const recipeId = recipeResult.rows[0].id;

      // Check if recipe already has ingredients (idempotent)
      const existingResult = await client.query(
        `SELECT COUNT(*) as count FROM ingredients WHERE recipe_id = $1`,
        [recipeId]
      );

      if (parseInt(existingResult.rows[0].count) > 0) {
        recipesSkipped++;
        continue;
      }

      // Insert all ingredients for this recipe
      for (const ing of ingredients) {
        await client.query(
          `INSERT INTO ingredients (recipe_id, name, amount, unit, allergens)
           VALUES ($1, $2, $3, $4, $5)`,
          [recipeId, ing.name, ing.amount, ing.unit, ing.allergens]
        );
        totalIngredients++;
      }

      // Update recipe allergens if empty
      const allAllergens = new Set<string>();
      for (const ing of ingredients) {
        for (const a of ing.allergens) {
          allAllergens.add(a);
        }
      }

      if (allAllergens.size > 0) {
        const sorted = Array.from(allAllergens).sort();
        await client.query(
          `UPDATE recipes SET allergens = $1
           WHERE id = $2
             AND (allergens IS NULL OR array_length(allergens, 1) IS NULL OR array_length(allergens, 1) = 0)`,
          [sorted, recipeId]
        );
      }

      recipesUpdated++;
    }

    await client.query("COMMIT");

    log("── Summary ──");
    log(`Recipes updated:    ${recipesUpdated}`);
    log(`Recipes skipped:    ${recipesSkipped} (already have ingredients)`);
    log(`Recipes not found:  ${recipesNotFound}`);
    log(`Total ingredients:  ${totalIngredients}`);
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

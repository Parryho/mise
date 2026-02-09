/**
 * Starch side dishes — 55 recipes (Sides with tag "stärke")
 */
import type { RecipeCompletionMap } from "../complete-recipes";

export const SIDES_STARCH_DATA: RecipeCompletionMap = {
  // ══ KARTOFFEL-BEILAGEN (20) ══
  "Petersilkartoffeln": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Petersilie", amount: 1, unit: "Bund", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffeln schälen und in Salzwasser bissfest kochen", "Abgießen und in zerlassener Butter schwenken", "Gehackte Petersilie unterheben, servieren"],
    allergens: ["G"],
  },
  "Salzkartoffeln": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
      { name: "Salz", amount: 1, unit: "EL", allergens: [] },
    ],
    steps: ["Kartoffeln schälen und vierteln", "In Salzwasser 20 Minuten bissfest kochen", "Abgießen und zugedeckt 2 Minuten ausdampfen lassen"],
    allergens: [],
  },
  "Erdäpfelpüree": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 800, unit: "g", allergens: [] },
      { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Milch warm", amount: 200, unit: "ml", allergens: ["G"] },
      { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffeln schälen, kochen und durch die Presse drücken", "Heiße Milch und Butter einrühren", "Mit Muskatnuss und Salz abschmecken"],
    allergens: ["G"],
  },
  "Bratkartoffeln": {
    ingredients: [
      { name: "Kartoffeln gekocht (vom Vortag)", amount: 800, unit: "g", allergens: [] },
      { name: "Butter / Schmalz", amount: 40, unit: "g", allergens: ["G"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln in Scheiben schneiden", "In heißem Fett portionsweise goldbraun braten (nicht wenden!)", "Zwiebeln separat rösten und unterheben", "Salzen und servieren"],
    allergens: ["G"],
  },
  "Röstkartoffeln": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
      { name: "Olivenöl", amount: 4, unit: "EL", allergens: [] },
      { name: "Rosmarin", amount: 2, unit: "Stk", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffeln vorkochen (10 Min), vierteln", "Mit Öl und Rosmarin mischen", "Bei 200°C 30 Minuten im Ofen knusprig rösten"],
    allergens: [],
  },
  "Rösterdäpfel": {
    ingredients: [
      { name: "Kartoffeln gekocht", amount: 800, unit: "g", allergens: [] },
      { name: "Schmalz", amount: 40, unit: "g", allergens: [] },
      { name: "Kümmel", amount: 1, unit: "TL", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln in Scheiben schneiden", "In heißem Schmalz knusprig braten", "Mit Kümmel und Salz würzen"],
    allergens: [],
  },
  "Kroketten": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 600, unit: "g", allergens: [] },
      { name: "Eigelb", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Mehl", amount: 30, unit: "g", allergens: ["A"] },
      { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
      { name: "Öl zum Frittieren", amount: 500, unit: "ml", allergens: [] },
      { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln kochen, stampfen, mit Eigelb und Muskatnuss mischen", "Zu Zylindern formen, in Mehl, Ei und Bröseln panieren", "Bei 170°C goldbraun frittieren"],
    allergens: ["A", "C"],
  },
  "Pommes Frites": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 1000, unit: "g", allergens: [] },
      { name: "Öl zum Frittieren", amount: 2000, unit: "ml", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffeln in Stifte schneiden, in kaltem Wasser wässern", "Trockentupfen, bei 140°C vorfrittieren (5 Min), abtropfen", "Bei 180°C knusprig fertigfrittieren (3 Min)", "Salzen und sofort servieren"],
    allergens: [],
  },
  "Wedges / Kartoffelspalten": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
      { name: "Olivenöl", amount: 4, unit: "EL", allergens: [] },
      { name: "Paprikapulver", amount: 1, unit: "TL", allergens: [] },
      { name: "Knoblauchpulver", amount: 1, unit: "TL", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffeln in Spalten schneiden", "Mit Öl und Gewürzen mischen", "Auf Backblech bei 200°C 30-35 Minuten knusprig backen"],
    allergens: [],
  },
  "Ofenkartoffeln": {
    ingredients: [
      { name: "Kartoffeln groß", amount: 4, unit: "Stk", allergens: [] },
      { name: "Olivenöl", amount: 2, unit: "EL", allergens: [] },
      { name: "Grobes Salz", amount: 1, unit: "EL", allergens: [] },
    ],
    steps: ["Kartoffeln waschen, mehrfach einstechen", "Mit Öl einreiben und mit Salz bestreuen", "Bei 200°C 60 Minuten im Ofen backen", "Kreuzweise einschneiden, mit Butter oder Sauerrahm servieren"],
    allergens: [],
  },
  "Kartoffelgratin (als Beilage)": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 600, unit: "g", allergens: [] },
      { name: "Schlagobers", amount: 250, unit: "ml", allergens: ["G"] },
      { name: "Knoblauch", amount: 1, unit: "Stk", allergens: [] },
      { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln dünn schneiden, in gebutterte Form schichten", "Schlagobers mit Knoblauch und Muskatnuss würzen, darüber gießen", "Bei 180°C 45 Minuten goldbraun backen"],
    allergens: ["G"],
  },
  "Erdäpfelsalat (warm)": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 800, unit: "g", allergens: [] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
      { name: "Rindssuppe warm", amount: 150, unit: "ml", allergens: ["L"] },
      { name: "Essig", amount: 3, unit: "EL", allergens: [] },
      { name: "Sonnenblumenöl", amount: 4, unit: "EL", allergens: [] },
      { name: "Senf", amount: 1, unit: "TL", allergens: ["M"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln mit Schale kochen, noch warm schälen und in Scheiben schneiden", "Warme Rindssuppe darüber gießen, 10 Min ziehen lassen", "Zwiebel fein hacken, Essig, Öl und Senf zu einem Dressing mischen", "Vorsichtig unterheben, mindestens 30 Min durchziehen lassen"],
    allergens: ["L", "M"],
  },
  "Schwenkkartoffeln": {
    ingredients: [
      { name: "Kartoffeln klein", amount: 800, unit: "g", allergens: [] },
      { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
      { name: "Petersilie", amount: 1, unit: "EL", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln in Salzwasser garen", "In Butter schwenken bis leicht gebräunt", "Mit Petersilie bestreuen"],
    allergens: ["G"],
  },
  "Kartoffelpüree mit Kräutern": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 800, unit: "g", allergens: [] },
      { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
      { name: "Schnittlauch", amount: 1, unit: "Bund", allergens: [] },
      { name: "Petersilie", amount: 1, unit: "EL", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln kochen und durch die Presse drücken", "Heiße Milch und Butter einrühren", "Gehackte Kräuter unterheben, abschmecken"],
    allergens: ["G"],
  },
  "Kartoffelpüree mit Muskatnuss": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 800, unit: "g", allergens: [] },
      { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
      { name: "Muskatnuss frisch gerieben", amount: 0.5, unit: "TL", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln kochen und stampfen", "Heiße Milch und Butter einrühren", "Großzügig mit frischer Muskatnuss würzen"],
    allergens: ["G"],
  },
  "Herzoginkartoffeln": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 600, unit: "g", allergens: [] },
      { name: "Eigelb", amount: 3, unit: "Stk", allergens: ["C"] },
      { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
      { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln kochen und passieren, Butter und Eigelb einrühren", "In einen Spritzbeutel mit Sterntülle füllen", "Rosetten auf Backblech spritzen", "Bei 200°C 15 Minuten goldbraun backen"],
    allergens: ["C", "G"],
  },
  "Kartoffel-Kroketten selbstgemacht": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 600, unit: "g", allergens: [] },
      { name: "Eigelb", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Mehl", amount: 40, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Semmelbrösel", amount: 100, unit: "g", allergens: ["A"] },
      { name: "Öl zum Frittieren", amount: 500, unit: "ml", allergens: [] },
      { name: "Muskatnuss", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln kochen, stampfen, mit Eigelb würzen", "Zylinderförmig rollen", "Panieren und bei 170°C goldbraun frittieren"],
    allergens: ["A", "C"],
  },
  "Hasselback-Kartoffeln": {
    ingredients: [
      { name: "Kartoffeln groß", amount: 4, unit: "Stk", allergens: [] },
      { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Knoblauch", amount: 2, unit: "Stk", allergens: [] },
      { name: "Thymian", amount: 2, unit: "Stk", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln fächerartig einschneiden (nicht ganz durch!)", "In eine Form setzen, mit Knoblauchbutter bestreichen", "Bei 200°C 50 Minuten backen, regelmäßig bestreichen"],
    allergens: ["G"],
  },
  "Kartoffelrösti": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 600, unit: "g", allergens: [] },
      { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln vorkochen (10 Min), abkühlen, grob reiben", "In heißer Butter flach drücken und goldbraun braten", "Wenden und andere Seite bräunen", "In Stücke teilen und servieren"],
    allergens: ["G"],
  },
  "Erdäpfelpuffer / Reibekuchen": {
    ingredients: [
      { name: "Kartoffeln festkochend", amount: 600, unit: "g", allergens: [] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Mehl", amount: 30, unit: "g", allergens: ["A"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
      { name: "Öl", amount: 100, unit: "ml", allergens: [] },
    ],
    steps: ["Kartoffeln und Zwiebel fein reiben, ausdrücken", "Ei und Mehl untermischen, salzen", "In heißem Öl goldbraun braten"],
    allergens: ["A", "C"],
  },

  // ══ KNÖDEL (10) ══
  "Semmelknödel": {
    ingredients: [
      { name: "Semmeln altbacken", amount: 6, unit: "Stk", allergens: ["A"] },
      { name: "Milch lauwarm", amount: 200, unit: "ml", allergens: ["G"] },
      { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Petersilie", amount: 1, unit: "EL", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Semmeln würfeln, mit Milch übergießen und 15 Min einweichen", "Zwiebel in Butter anschwitzen", "Alle Zutaten verkneten, 15 Min rasten lassen", "Knödel formen und in Salzwasser 15 Min ziehen lassen (nicht kochen!)"],
    allergens: ["A", "C", "G"],
  },
  "Serviettenknödel": {
    ingredients: [
      { name: "Semmeln altbacken", amount: 5, unit: "Stk", allergens: ["A"] },
      { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
      { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Petersilie", amount: 1, unit: "EL", allergens: [] },
    ],
    steps: ["Semmeln würfeln und in Milch einweichen", "Eier, Butter und Petersilie untermischen", "In Frischhaltefolie zur Rolle formen", "In Salzwasser 25 Minuten sieden", "In Scheiben geschnitten servieren"],
    allergens: ["A", "C", "G"],
  },
  "Speckknödel": {
    ingredients: [
      { name: "Semmeln altbacken", amount: 6, unit: "Stk", allergens: ["A"] },
      { name: "Speck geräuchert", amount: 150, unit: "g", allergens: [] },
      { name: "Milch", amount: 200, unit: "ml", allergens: ["G"] },
      { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
      { name: "Schnittlauch", amount: 1, unit: "EL", allergens: [] },
    ],
    steps: ["Semmeln würfeln und in Milch einweichen", "Speck und Zwiebel anbraten", "Alles vermengen, Knödel formen", "In Salzwasser 15 Minuten ziehen lassen"],
    allergens: ["A", "C", "G"],
  },
  "Waldviertler Knödel": {
    ingredients: [
      { name: "Kartoffeln mehlig (roh)", amount: 400, unit: "g", allergens: [] },
      { name: "Kartoffeln mehlig (gekocht)", amount: 200, unit: "g", allergens: [] },
      { name: "Kartoffelstärke", amount: 50, unit: "g", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Rohe Kartoffeln fein reiben und ausdrücken", "Gekochte Kartoffeln passieren und dazugeben", "Stärke und Salz untermischen, Knödel formen", "In Salzwasser 20 Minuten kochen"],
    allergens: [],
  },
  "Kartoffelknödel": {
    ingredients: [
      { name: "Kartoffeln mehlig gekocht", amount: 600, unit: "g", allergens: [] },
      { name: "Kartoffelstärke", amount: 80, unit: "g", allergens: [] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffeln passieren und mit Stärke, Ei und Salz verkneten", "Knödel formen", "In leicht siedendem Wasser 15-20 Minuten garen"],
    allergens: ["C"],
  },
  "Grammelknödel": {
    ingredients: [
      { name: "Kartoffeln mehlig gekocht", amount: 600, unit: "g", allergens: [] },
      { name: "Mehl", amount: 80, unit: "g", allergens: ["A"] },
      { name: "Grammeln (Grieben)", amount: 150, unit: "g", allergens: [] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Kartoffelteig herstellen", "Grammeln als Füllung in die Mitte geben", "Gut verschließen und in Salzwasser 15 Min kochen"],
    allergens: ["A", "C"],
  },
  "Leberknödel (als Beilage)": {
    ingredients: [
      { name: "Rindsleber", amount: 200, unit: "g", allergens: [] },
      { name: "Semmeln altbacken", amount: 3, unit: "Stk", allergens: ["A"] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
      { name: "Majoran", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Leber fein faschieren, Semmeln einweichen", "Zwiebel anschwitzen, mit Leber, Semmel und Ei verkneten", "Knödel formen, 15 Min in Salzwasser ziehen lassen"],
    allergens: ["A", "C"],
  },
  "Grießknödel": {
    ingredients: [
      { name: "Grieß", amount: 150, unit: "g", allergens: ["A"] },
      { name: "Butter", amount: 60, unit: "g", allergens: ["G"] },
      { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Butter schaumig rühren, Eier einrühren", "Grieß unterheben, 30 Min rasten lassen", "Knödel formen, in Salzwasser 15 Min kochen"],
    allergens: ["A", "C", "G"],
  },
  "Topfenknödel (pikant, als Beilage)": {
    ingredients: [
      { name: "Topfen", amount: 250, unit: "g", allergens: ["G"] },
      { name: "Grieß", amount: 50, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Semmelbrösel", amount: 30, unit: "g", allergens: ["A"] },
      { name: "Schnittlauch", amount: 1, unit: "EL", allergens: [] },
    ],
    steps: ["Topfen mit Grieß, Ei und Bröseln vermengen", "Schnittlauch untermischen, 20 Min rasten", "Knödel formen, in Salzwasser 10 Min ziehen lassen"],
    allergens: ["A", "C", "G"],
  },
  "Böhmische Knödel": {
    ingredients: [
      { name: "Mehl glatt", amount: 300, unit: "g", allergens: ["A"] },
      { name: "Milch", amount: 150, unit: "ml", allergens: ["G"] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Germ (Hefe)", amount: 10, unit: "g", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Hefeteig ansetzen und gehen lassen", "Zu zwei länglichen Rollen formen", "In Dampf oder Salzwasser 20 Minuten garen", "In Scheiben schneiden und servieren"],
    allergens: ["A", "C", "G"],
  },

  // ══ TEIGWAREN & GETREIDE (15) ══
  "Spätzle": {
    ingredients: [
      { name: "Mehl griffig", amount: 300, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 3, unit: "Stk", allergens: ["C"] },
      { name: "Wasser", amount: 100, unit: "ml", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Mehl, Eier, Wasser und Salz zu zähem Teig rühren", "15 Minuten rasten lassen", "Durch Spätzlepresse in kochendes Salzwasser drücken", "Aufsteigen lassen, abschöpfen"],
    allergens: ["A", "C"],
  },
  "Eierspätzle": {
    ingredients: [
      { name: "Mehl griffig", amount: 300, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 4, unit: "Stk", allergens: ["C"] },
      { name: "Wasser", amount: 80, unit: "ml", allergens: [] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    ],
    steps: ["Teig mit besonders vielen Eiern anrühren", "Durch Spätzlepresse ins Wasser drücken", "Abschöpfen und in Butter schwenken"],
    allergens: ["A", "C", "G"],
  },
  "Butternockerl": {
    ingredients: [
      { name: "Butter", amount: 80, unit: "g", allergens: ["G"] },
      { name: "Mehl", amount: 100, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Butter schaumig rühren, Ei einrühren", "Mehl unterheben, Teig 15 Min rasten lassen", "Mit Löffeln Nockerln abstechen", "In Salzwasser 5 Minuten kochen"],
    allergens: ["A", "C", "G"],
  },
  "Nockerl": {
    ingredients: [
      { name: "Mehl", amount: 200, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Wasser", amount: 100, unit: "ml", allergens: [] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Teig aus Mehl, Eiern und Wasser rühren", "Mit Löffel Nockerln ins kochende Wasser stechen", "Aufsteigen lassen und abschöpfen"],
    allergens: ["A", "C"],
  },
  "Spiralnudeln / Fusilli": {
    ingredients: [{ name: "Fusilli", amount: 400, unit: "g", allergens: ["A"] }, { name: "Salz", amount: 1, unit: "EL", allergens: [] }],
    steps: ["In reichlich Salzwasser al dente kochen", "Abgießen und als Beilage servieren"],
    allergens: ["A"],
  },
  "Penne": {
    ingredients: [{ name: "Penne", amount: 400, unit: "g", allergens: ["A"] }, { name: "Salz", amount: 1, unit: "EL", allergens: [] }],
    steps: ["In Salzwasser al dente kochen", "Abgießen und servieren"],
    allergens: ["A"],
  },
  "Bandnudeln": {
    ingredients: [{ name: "Bandnudeln / Tagliatelle", amount: 400, unit: "g", allergens: ["A", "C"] }, { name: "Salz", amount: 1, unit: "EL", allergens: [] }],
    steps: ["In Salzwasser al dente kochen", "Abgießen und servieren"],
    allergens: ["A", "C"],
  },
  "Reis": {
    ingredients: [
      { name: "Langkornreis", amount: 300, unit: "g", allergens: [] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Reis waschen", "In der doppelten Menge Salzwasser aufkochen", "Zugedeckt bei kleinster Hitze 12-15 Min quellen lassen", "Butter einrühren und auflockern"],
    allergens: ["G"],
  },
  "Basmatireis": {
    ingredients: [
      { name: "Basmatireis", amount: 300, unit: "g", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Reis mehrmals waschen bis Wasser klar ist", "In 1.5-facher Menge Salzwasser aufkochen", "Zugedeckt bei kleinster Hitze 12 Minuten garen", "5 Minuten ruhen lassen, auflockern"],
    allergens: [],
  },
  "Safranreis": {
    ingredients: [
      { name: "Basmatireis", amount: 300, unit: "g", allergens: [] },
      { name: "Safranfäden", amount: 1, unit: "Prise", allergens: [] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    ],
    steps: ["Safran in 2 EL warmem Wasser auflösen", "Zwiebel in Butter anschwitzen, Reis zugeben", "Safranwasser und Kochflüssigkeit zugeben", "12 Minuten zugedeckt garen"],
    allergens: ["G"],
  },
  "Risotto (als Beilage)": {
    ingredients: [
      { name: "Risottoreis (Arborio)", amount: 250, unit: "g", allergens: [] },
      { name: "Gemüsebrühe", amount: 800, unit: "ml", allergens: ["L"] },
      { name: "Weißwein", amount: 100, unit: "ml", allergens: ["O"] },
      { name: "Parmesan", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Zwiebel", amount: 1, unit: "Stk", allergens: [] },
    ],
    steps: ["Zwiebel in Butter anschwitzen, Reis glasig rühren", "Mit Weißwein ablöschen", "Schrittweise heiße Brühe zugeben und ständig rühren", "Parmesan und Butter einrühren (Mantecatura)", "Cremig servieren"],
    allergens: ["G", "L", "O"],
  },
  "Couscous": {
    ingredients: [
      { name: "Couscous", amount: 250, unit: "g", allergens: ["A"] },
      { name: "Gemüsebrühe", amount: 300, unit: "ml", allergens: ["L"] },
      { name: "Olivenöl", amount: 1, unit: "EL", allergens: [] },
    ],
    steps: ["Brühe aufkochen, über Couscous gießen", "5 Minuten zugedeckt quellen lassen", "Mit Gabel auflockern, Olivenöl einrühren"],
    allergens: ["A", "L"],
  },
  "Bulgur": {
    ingredients: [
      { name: "Bulgur", amount: 250, unit: "g", allergens: ["A"] },
      { name: "Wasser", amount: 400, unit: "ml", allergens: [] },
      { name: "Olivenöl", amount: 1, unit: "EL", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Bulgur in kochendes Salzwasser geben", "15 Minuten quellen lassen", "Auflockern und mit Olivenöl servieren"],
    allergens: ["A"],
  },
  "Polenta (als Beilage)": {
    ingredients: [
      { name: "Maisgrieß (Polenta)", amount: 200, unit: "g", allergens: [] },
      { name: "Wasser", amount: 800, unit: "ml", allergens: [] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Parmesan", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Wasser salzen und aufkochen", "Maisgrieß unter Rühren einrieseln", "20 Minuten rühren bis cremig", "Butter und Parmesan einrühren"],
    allergens: ["G"],
  },
  "Ebly / Weizen": {
    ingredients: [
      { name: "Ebly (Zartweizen)", amount: 250, unit: "g", allergens: ["A"] },
      { name: "Gemüsebrühe", amount: 500, unit: "ml", allergens: ["L"] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    ],
    steps: ["Ebly in Brühe aufkochen", "10 Minuten köcheln, zugedeckt quellen lassen", "Mit Butter verfeinern"],
    allergens: ["A", "G", "L"],
  },

  // ══ BROT & SONSTIGES (10) ══
  "Semmelknödel (als Scheiben gebraten)": {
    ingredients: [
      { name: "Semmelknödel vom Vortag", amount: 4, unit: "Stk", allergens: ["A", "C", "G"] },
      { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
    ],
    steps: ["Knödel in 1 cm dicke Scheiben schneiden", "In Butter beidseitig goldbraun braten"],
    allergens: ["A", "C", "G"],
  },
  "Knödel mit Ei": {
    ingredients: [
      { name: "Semmelknödel vom Vortag", amount: 4, unit: "Stk", allergens: ["A", "C", "G"] },
      { name: "Eier", amount: 4, unit: "Stk", allergens: ["C"] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
    ],
    steps: ["Knödel in Scheiben schneiden und in Butter braten", "Eier verquirlen und darüber gießen, stocken lassen"],
    allergens: ["A", "C", "G"],
  },
  "Schupfnudeln": {
    ingredients: [
      { name: "Kartoffeln mehlig gekocht", amount: 600, unit: "g", allergens: [] },
      { name: "Mehl", amount: 100, unit: "g", allergens: ["A"] },
      { name: "Eigelb", amount: 2, unit: "Stk", allergens: ["C"] },
      { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln passieren, mit Mehl, Eigelb und Salz verkneten", "Fingerdicke Rollen formen und schräg abschneiden", "Zu spindelförmigen Nudeln rollen", "In Salzwasser kochen, dann in Butter anbraten"],
    allergens: ["A", "C", "G"],
  },
  "Gnocchi": {
    ingredients: [
      { name: "Kartoffeln mehlig", amount: 600, unit: "g", allergens: [] },
      { name: "Mehl", amount: 150, unit: "g", allergens: ["A"] },
      { name: "Eier", amount: 1, unit: "Stk", allergens: ["C"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Kartoffeln kochen und durch die Presse drücken", "Mehl und Ei einarbeiten (Teig soll weich sein)", "Rollen formen, in Stücke schneiden", "Mit Gabel eindrücken, in Salzwasser kochen bis sie aufschwimmen"],
    allergens: ["A", "C"],
  },
  "Dampfnudeln (pikant)": {
    ingredients: [
      { name: "Mehl", amount: 300, unit: "g", allergens: ["A"] },
      { name: "Milch", amount: 150, unit: "ml", allergens: ["G"] },
      { name: "Germ (Hefe)", amount: 10, unit: "g", allergens: [] },
      { name: "Butter", amount: 30, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Hefeteig herstellen und gehen lassen", "Kugeln formen, nochmals gehen lassen", "In geschlossenem Topf mit Butter und wenig Wasser dampfgaren", "Knusprigen Boden und weiche Oberfläche servieren"],
    allergens: ["A", "G"],
  },
  "Maisgrieß": {
    ingredients: [
      { name: "Maisgrieß fein", amount: 200, unit: "g", allergens: [] },
      { name: "Wasser", amount: 600, unit: "ml", allergens: [] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Wasser salzen und aufkochen", "Grieß unter Rühren einstreuen", "15 Minuten rühren, Butter einrühren"],
    allergens: ["G"],
  },
  "Quinoa": {
    ingredients: [
      { name: "Quinoa", amount: 250, unit: "g", allergens: [] },
      { name: "Wasser", amount: 500, unit: "ml", allergens: [] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Quinoa waschen", "In Salzwasser aufkochen, 15 Min köcheln", "5 Min rasten und auflockern"],
    allergens: [],
  },
  "Hirse": {
    ingredients: [
      { name: "Hirse", amount: 250, unit: "g", allergens: [] },
      { name: "Gemüsebrühe", amount: 500, unit: "ml", allergens: ["L"] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
    ],
    steps: ["Hirse waschen, in Brühe aufkochen", "15 Minuten zugedeckt quellen lassen", "Mit Butter auflockern"],
    allergens: ["G", "L"],
  },
  "Buchweizen": {
    ingredients: [
      { name: "Buchweizen", amount: 250, unit: "g", allergens: [] },
      { name: "Wasser", amount: 500, unit: "ml", allergens: [] },
      { name: "Butter", amount: 20, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "TL", allergens: [] },
    ],
    steps: ["Buchweizen in trockener Pfanne kurz anrösten", "Mit Salzwasser aufkochen, 15 Min köcheln", "Butter einrühren, auflockern"],
    allergens: ["G"],
  },
  "Griesschnitten": {
    ingredients: [
      { name: "Grieß", amount: 200, unit: "g", allergens: ["A"] },
      { name: "Milch", amount: 500, unit: "ml", allergens: ["G"] },
      { name: "Butter", amount: 40, unit: "g", allergens: ["G"] },
      { name: "Salz", amount: 1, unit: "Prise", allergens: [] },
    ],
    steps: ["Milch aufkochen, Grieß einrühren", "10 Minuten kochen, auf Blech streichen (1 cm dick)", "Auskühlen lassen, in Rauten schneiden", "In Butter goldbraun braten"],
    allergens: ["A", "G"],
  },
};

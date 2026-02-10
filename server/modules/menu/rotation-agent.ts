/**
 * Küchenchef-Agent v3: Kulinarische Regeln + Adaptive Learning für Rotation-Slots.
 *
 * v3 Verbesserungen gegenüber v2:
 * - Score-basierte Beilagen-Auswahl via `pickWeighted()` (Exploit/Explore)
 * - Pairing-Scores aus Quiz-Feedback fließen in `pickStarchFor()` / `pickVeggieFor()` ein
 * - Adaptive Epsilon: Bei wenigen Bewertungen mehr Exploration, mit der Zeit mehr Exploitation
 * - DISH_META Regeln bleiben als Hard Constraints (preferred/forbidden)
 * - Scoring ist additiv: erst filtern (DISH_META), dann gewichten (Scores)
 *
 * v2 Features (beibehalten):
 * - DISH_META: Rezept-spezifische Metadaten (selfContained, dessertMain, preferred/forbidden)
 * - Intelligente Stärke-Auswahl: preferred/forbidden statt blindes Round-Robin
 * - Self-contained Gerichte (Käsespätzle, Lasagne) bekommen KEINE Stärkebeilage
 * - Dessert-Mains (Marillenknödel, Mohnnudeln) bekommen WEDER Stärke NOCH Gemüse
 * - Random-Auswahl statt modulo-Cycling → keine Monotonie-Muster
 * - Per-MEAL Stärkegruppen-Reset (Knödel mittags UND abends OK)
 * - Per-DAY usedIds (kein Rezept doppelt am selben Tag)
 * - Keyword-basierter Fallback in getDishMeta() für neue Rezepte
 *
 * Beibehaltene Regeln:
 * - Tag "kein-rotation" = ignoriert (Salate, Jause, Aufstriche, Frühstück)
 * - Tag "stärke" / "gemüse" für Beilagen-Zuordnung
 * - Per-Location unabhängige Pools
 * - Dessert immer null (nicht auto-filled)
 * - STARCH_GROUPS für Kollisionsvermeidung innerhalb einer Mahlzeit
 */

import { storage } from "../../storage";
import type { Recipe, RotationSlot } from "@shared/schema";
import type { MealSlotName } from "@shared/constants";
import { loadAllScores } from "../recipe/pairing-engine";
import { pool } from "../../db";

// ============================================================
// Starch Groups — Kollisionsvermeidung innerhalb einer Mahlzeit
// Keine 2× gleiche Stärke-Art (z.B. nicht Pommes + Kroketten)
// ============================================================
const STARCH_GROUPS: Record<string, string> = {
  // Reis
  "Reis": "reis",
  "Basmatireis": "reis",
  "Safranreis": "reis",
  // Teig/Nockerl
  "Spätzle": "teig",
  "Eierspätzle": "teig",
  "Butternockerl": "teig",
  "Nockerl": "teig",
  // Knödel
  "Semmelknödel": "knödel",
  "Serviettenknödel": "knödel",
  "Speckknödel": "knödel",
  "Waldviertler Knödel": "knödel",
  "Kartoffelknödel": "knödel",
  "Grammelknödel": "knödel",
  "Leberknödel (als Beilage)": "knödel",
  "Grießknödel": "knödel",
  "Topfenknödel (pikant, als Beilage)": "knödel",
  "Böhmische Knödel": "knödel",
  "Semmelknödel (als Scheiben gebraten)": "knödel",
  "Knödel mit Ei": "knödel",
  // Kartoffel
  "Petersilkartoffeln": "kartoffel",
  "Salzkartoffeln": "kartoffel",
  "Bratkartoffeln": "kartoffel",
  "Röstkartoffeln": "kartoffel",
  "Rösterdäpfel": "kartoffel",
  "Erdäpfelpüree": "kartoffel",
  "Pommes Frites": "kartoffel",
  "Kroketten": "kartoffel",
  "Wedges / Kartoffelspalten": "kartoffel",
  "Ofenkartoffeln": "kartoffel",
  "Kartoffelgratin (als Beilage)": "kartoffel",
  "Erdäpfelsalat (warm)": "kartoffel",
  "Schwenkkartoffeln": "kartoffel",
  "Kartoffelpüree mit Kräutern": "kartoffel",
  "Kartoffelpüree mit Muskatnuss": "kartoffel",
  "Herzoginkartoffeln": "kartoffel",
  "Kartoffel-Kroketten selbstgemacht": "kartoffel",
  "Hasselback-Kartoffeln": "kartoffel",
  "Kartoffelrösti": "kartoffel",
  "Erdäpfelpuffer / Reibekuchen": "kartoffel",
  "Schupfnudeln": "kartoffel",
  "Gnocchi": "kartoffel",
  // Nudeln
  "Spiralnudeln / Fusilli": "nudel",
  "Penne": "nudel",
  "Bandnudeln": "nudel",
  // Getreide
  "Couscous": "getreide",
  "Bulgur": "getreide",
  "Ebly / Weizen": "getreide",
  "Quinoa": "getreide",
  "Hirse": "getreide",
  "Buchweizen": "getreide",
  "Maisgrieß": "getreide",
  "Griesschnitten": "getreide",
  // Polenta / Risotto
  "Polenta (als Beilage)": "polenta",
  "Risotto (als Beilage)": "risotto",
  // Sonstiges
  "Dampfnudeln (pikant)": "dampfnudel",
};

function getStarchGroup(recipe: Recipe): string {
  return STARCH_GROUPS[recipe.name] || recipe.name.toLowerCase();
}

// ============================================================
// Dish Metadata — Kulinarische Regeln pro Gericht
// ============================================================
interface DishMeta {
  /** Braucht KEINE Stärkebeilage (Stärke ist Teil des Gerichts) */
  selfContained?: boolean;
  /** Braucht WEDER Stärke NOCH Gemüse (süßes Hauptgericht) */
  dessertMain?: boolean;
  /** Bevorzugte Stärkebeilagen (Name muss mit Rezept-Name matchen) */
  preferredStarches?: string[];
  /** Verbotene Stärkebeilagen */
  forbiddenStarches?: string[];
  /** Bevorzugte Gemüsebeilagen */
  preferredVeggies?: string[];
}

// ── Forbidden/Preferred lists für Wiederverwendung ──
const ALL_KNÖDEL = [
  "Semmelknödel", "Serviettenknödel", "Speckknödel",
  "Waldviertler Knödel", "Kartoffelknödel", "Böhmische Knödel", "Grammelknödel",
];
const POMMES_KROKETTEN = ["Pommes Frites", "Kroketten", "Wedges / Kartoffelspalten"];

// ── Shared rule templates ──
const PANIERT: DishMeta = {
  forbiddenStarches: ALL_KNÖDEL,
  preferredStarches: ["Pommes Frites", "Erdäpfelpüree", "Reis", "Petersilkartoffeln"],
};
const BRATEN: DishMeta = {
  preferredStarches: ["Semmelknödel", "Serviettenknödel"],
  forbiddenStarches: POMMES_KROKETTEN,
};
const BRATEN_SAUERKRAUT: DishMeta = {
  ...BRATEN,
  preferredVeggies: ["Sauerkraut", "Rahmsauerkraut"],
};
const BRATEN_ROTKRAUT: DishMeta = {
  ...BRATEN,
  preferredVeggies: ["Rotkraut"],
};
const GULASCH: DishMeta = {
  preferredStarches: ["Semmelknödel", "Spätzle", "Serviettenknödel"],
};
const GESCHNETZELTES: DishMeta = {
  preferredStarches: ["Spätzle", "Eierspätzle", "Reis", "Butternockerl"],
};
const FISCH: DishMeta = {
  preferredStarches: ["Reis", "Petersilkartoffeln", "Erdäpfelpüree", "Salzkartoffeln"],
  forbiddenStarches: ALL_KNÖDEL,
};
const SC: DishMeta = { selfContained: true };
const DM: DishMeta = { dessertMain: true };

/**
 * Kulinarische Metadaten für Rotation-Gerichte.
 * Lookup: exact name → substring match → keyword fallback → {}
 */
const DISH_META: Record<string, DishMeta> = {
  // ══════════════════════════════════════════════════════════
  // PANIERTES: KEIN Knödel, bevorzugt Pommes/Püree/Reis
  // ══════════════════════════════════════════════════════════
  "Wiener Schnitzel": PANIERT,
  "Backhendl": PANIERT,
  "Cordon Bleu": PANIERT,
  "Putenschnitzel paniert": PANIERT,
  "Gebackene Leber": PANIERT,
  "Gebackener Karpfen": PANIERT,
  "Pariser Schnitzel": PANIERT,
  "Surschnitzel": PANIERT,
  "Hühnerschnitzel Natur paniert": PANIERT,
  "Gebackener Blumenkohl": PANIERT,
  // Panierte Fisch
  "Fischstäbchen": PANIERT,
  "Fischknusperle": PANIERT,
  "Kabeljau gebacken": PANIERT,

  // ══════════════════════════════════════════════════════════
  // BRATEN: Knödel bevorzugt, KEINE Pommes/Kroketten
  // ══════════════════════════════════════════════════════════
  "Schweinsbraten": BRATEN_SAUERKRAUT,
  "Kümmelbraten": BRATEN_SAUERKRAUT,
  "Stelze": BRATEN_SAUERKRAUT,
  "Lammstelze": BRATEN,
  "Rindsbraten": BRATEN,
  "Kalbsbraten": BRATEN,
  "Sauerbraten": { ...BRATEN, preferredVeggies: ["Rotkraut"] },
  "Geselchtes mit Sauerkraut": BRATEN_SAUERKRAUT,
  "Selchfleisch": BRATEN_SAUERKRAUT,
  "Spanferkel": BRATEN_SAUERKRAUT,
  "Entenkeule": BRATEN_ROTKRAUT,
  "Ganslbraten": BRATEN_ROTKRAUT,
  "Lammkeule": {
    preferredStarches: ["Petersilkartoffeln", "Erdäpfelpüree", "Röstkartoffeln"],
    forbiddenStarches: POMMES_KROKETTEN,
  },
  "Lammkarree": {
    preferredStarches: ["Erdäpfelpüree", "Röstkartoffeln", "Petersilkartoffeln"],
    forbiddenStarches: POMMES_KROKETTEN,
  },
  "Rehragout": BRATEN_ROTKRAUT,

  // ── Spezial-Braten ──
  "Tafelspitz": {
    preferredStarches: ["Rösterdäpfel", "Petersilkartoffeln", "Erdäpfelpüree", "Salzkartoffeln"],
    forbiddenStarches: [...ALL_KNÖDEL, "Pommes Frites", "Kroketten"],
    preferredVeggies: ["Wurzelgemüse (Mischung)", "Apfelkren", "Semmelkren", "Schnittlauchsauce"],
  },
  "Tellerfleisch": {
    preferredStarches: ["Rösterdäpfel", "Petersilkartoffeln", "Erdäpfelpüree"],
    forbiddenStarches: [...ALL_KNÖDEL, "Pommes Frites", "Kroketten"],
    preferredVeggies: ["Wurzelgemüse (Mischung)", "Apfelkren", "Schnittlauchsauce"],
  },
  "Zwiebelrostbraten": {
    preferredStarches: ["Bratkartoffeln", "Röstkartoffeln", "Rösterdäpfel"],
    forbiddenStarches: ALL_KNÖDEL,
  },
  "Faschierter Braten": {
    preferredStarches: ["Erdäpfelpüree", "Petersilkartoffeln", "Salzkartoffeln"],
  },
  "Putenbraten": BRATEN,
  "Schweinemedaillons": GESCHNETZELTES,

  // ══════════════════════════════════════════════════════════
  // GULASCH & RAGOUTS: Knödel/Spätzle bevorzugt
  // ══════════════════════════════════════════════════════════
  "Rindsgulasch": GULASCH,
  "Saftgulasch": GULASCH,
  "Fiakergulasch": GULASCH,
  "Kalbsgulasch": GULASCH,
  "Beuschel": { preferredStarches: ["Semmelknödel", "Spätzle"] },
  "Beuscherl": { preferredStarches: ["Semmelknödel", "Spätzle"] },
  "Boeuf Stroganoff": { preferredStarches: ["Reis", "Spätzle", "Bandnudeln"] },
  "Ragout fin": { preferredStarches: ["Reis", "Bandnudeln"] },

  // ══════════════════════════════════════════════════════════
  // GESCHNETZELTES: Spätzle/Reis bevorzugt
  // ══════════════════════════════════════════════════════════
  "Zürcher Geschnetzeltes": GESCHNETZELTES,
  "Rahmgeschnetzeltes": GESCHNETZELTES,
  "Putengeschnetzeltes": GESCHNETZELTES,
  "Kalbsrahmgeschnetzeltes": GESCHNETZELTES,
  "Hühnergeschnetzeltes": GESCHNETZELTES,
  "Putenmedaillons": GESCHNETZELTES,
  "Saltimbocca": { preferredStarches: ["Reis", "Bandnudeln", "Spätzle"] },

  // ══════════════════════════════════════════════════════════
  // HENDL & GEGRILLTES: Pommes/Kartoffeln
  // ══════════════════════════════════════════════════════════
  "Grillhendl": { preferredStarches: ["Pommes Frites", "Bratkartoffeln", "Erdäpfelpüree"] },
  "Hühnerkeule überbacken": { preferredStarches: ["Reis", "Pommes Frites", "Bratkartoffeln"] },
  "Hühnerkeule gegrillt": { preferredStarches: ["Pommes Frites", "Bratkartoffeln", "Reis"] },
  "Cevapcici": { preferredStarches: ["Reis", "Pommes Frites"] },
  "Fleischlaberl": { preferredStarches: ["Erdäpfelpüree", "Petersilkartoffeln"] },
  "Kalbsleber Berliner Art": { preferredStarches: ["Erdäpfelpüree", "Bratkartoffeln"] },

  // ══════════════════════════════════════════════════════════
  // FISCH: Reis/Kartoffeln, KEINE Knödel
  // ══════════════════════════════════════════════════════════
  "Gebratenes Forellenfilet": FISCH,
  "Zanderfilet": FISCH,
  "Lachsfilet": FISCH,
  "Schollenfilet": FISCH,
  "Seelachsfilet": FISCH,
  "Dorschfilet": FISCH,
  "Pangasiusfilet": FISCH,
  "Forelle Müllerin": FISCH,
  "Karpfen blau": FISCH,
  "Matjesfilet": FISCH,
  "Thunfischsteak": FISCH,
  "Garnelenpfanne": { preferredStarches: ["Reis", "Basmatireis"] },

  // ══════════════════════════════════════════════════════════
  // VEGETARISCH MIT BEILAGE: Gefülltes braucht oft Reis
  // ══════════════════════════════════════════════════════════
  "Gefüllte Paprika": { preferredStarches: ["Reis", "Basmatireis"] },
  "Gefüllte Zucchini": { preferredStarches: ["Reis", "Couscous"] },
  "Überbackene Auberginen": { preferredStarches: ["Reis", "Couscous"] },
  "Stuffed Mushrooms / Gefüllte Champignons": { preferredStarches: ["Reis"] },
  "Gemüselaibchen": { preferredStarches: ["Reis", "Erdäpfelpüree"] },
  "Erdäpfellaibchen": { preferredStarches: ["Reis"], forbiddenStarches: ["Erdäpfelpüree", "Petersilkartoffeln", "Bratkartoffeln", "Salzkartoffeln", "Pommes Frites", "Kroketten"] },
  "Linsenlaibchen": { preferredStarches: ["Reis", "Couscous"] },
  "Kichererbsen-Bratlinge / Falafel": { preferredStarches: ["Reis", "Couscous", "Bulgur"] },
  "Rote-Rüben-Laibchen": { preferredStarches: ["Reis", "Couscous"] },
  "Hirslaibchen": { preferredStarches: ["Reis"] },
  "Zucchini-Puffer": { preferredStarches: ["Reis", "Erdäpfelpüree"] },
  "Karotten-Ingwer-Bratlinge": { preferredStarches: ["Reis", "Basmatireis", "Couscous"] },
  "Kürbislaibchen": { preferredStarches: ["Reis", "Couscous"] },
  "Kartoffelpuffer": { preferredStarches: ["Reis"], forbiddenStarches: ["Erdäpfelpüree", "Petersilkartoffeln", "Bratkartoffeln", "Pommes Frites"] },
  "Eierspeise / Bauernomelett": { preferredStarches: ["Bratkartoffeln", "Röstkartoffeln"] },

  // ══════════════════════════════════════════════════════════
  // SELF-CONTAINED: Stärke ist Teil des Gerichts
  // → KEINE Stärkebeilage zuweisen
  // ══════════════════════════════════════════════════════════
  // Teigwaren
  "Käsespätzle": SC,
  "Krautfleckerl": SC,
  "Schinkenfleckerl": SC,
  "Spinatspätzle mit Käsesauce": SC,
  "Pasta Arrabiata": SC,
  "Pasta Pomodoro": SC,
  "Penne al Forno": SC,
  "Lasagne": SC,
  "Lasagne vegetarisch": SC,
  "Nudeln mit Pesto": SC,
  "Rigatoni mit Gemüseragout": SC,
  "Tortellini in Sahnesauce": SC,
  "Spaghetti Aglio e Olio": SC,
  "Mac and Cheese": SC,
  "Nudelauflauf mit Gemüse": SC,
  "Pasta mit Kürbissauce": SC,
  // Strudel & Quiche
  "Gemüsestrudel": SC,
  "Krautstrudel": SC,
  "Spinatstrudel": SC,
  "Kürbis-Feta-Strudel": SC,
  "Quiche Lorraine": SC,
  "Gemüsequiche": SC,
  "Zwiebelkuchen": SC,
  "Lauchquiche": SC,
  "Tomaten-Ziegenkäse-Tarte": SC,
  "Flammkuchen": SC,
  "Flammkuchen vegetarisch": SC,
  // Knödel-Hauptgerichte
  "Spinatknödel": SC,
  "Kaspressknödel": SC,
  "Serviettenknödel mit Schwammerlsauce": SC,
  "Kasnocken": SC,
  "Eiernockerl": SC,
  "Grammelknödel": SC,
  "Eierschwammerl mit Knödel": SC,
  "Knödel mit Ei": SC,
  // Aufläufe & Gratins
  "Gemüseauflauf": SC,
  "Kartoffelgratin": SC,
  "Moussaka vegetarisch": SC,
  "Zucchini-Auflauf": SC,
  "Broccoli-Gratin": SC,
  "Polenta mit Schwammerl": SC,
  "Polenta-Gemüse-Auflauf": SC,
  "Kürbis-Kartoffel-Gratin": SC,
  "Melanzani-Parmigiana": SC,
  // Curry, Eintopf, Pfannen
  "Gemüsecurry mit Kokosmilch": SC,
  "Kichererbsen-Curry": SC,
  "Linsen-Dal": SC,
  "Ratatouille": SC,
  "Chili sin Carne": SC,
  "Pilzragout": SC,
  "Gemüsepfanne": SC,
  "Wok-Gemüse mit Sojasauce": SC,
  // Risotto, Polenta, Gröstl
  "Risotto": SC,
  "Polenta": SC,
  "Reiberdatschi": SC,
  "Blunzengröstl": SC,
  "Tiroler Gröstl": SC,
  "Bauernschmaus": SC,
  "Erdäpfelgulasch": SC,
  "Altwiener Suppentopf": SC,

  // ══════════════════════════════════════════════════════════
  // DESSERT-MAINS: Süße Hauptgerichte
  // → WEDER Stärke NOCH Gemüse
  // ══════════════════════════════════════════════════════════
  "Marillenknödel": DM,
  "Mohnnudeln": DM,
  "Topfenknödel": DM,
  "Zwetschgenknödel": DM,
  "Germknödel": DM,
  "Kaiserschmarrn": DM,
  "Palatschinken gefüllt": DM,
};

/**
 * Get dish metadata: exact name → substring match → keyword fallback → {}
 */
function getDishMeta(name: string): DishMeta {
  // 1. Exact match
  if (DISH_META[name]) return DISH_META[name];

  // 2. Substring match (e.g. "Wiener Schnitzel vom Schwein" → "Wiener Schnitzel")
  for (const [key, meta] of Object.entries(DISH_META)) {
    if (name.includes(key) || key.includes(name)) return meta;
  }

  // 3. Keyword-based fallback for future/uncategorized dishes
  const lower = name.toLowerCase();

  // Dessert-mains (check FIRST — "knödel" would match selfContained otherwise)
  if (/marillenknödel|zwetschgenknödel|topfenknödel|mohnnudeln|germknödel|kaiserschmarrn|palatschinken/i.test(name)) {
    return DM;
  }

  // Self-contained: Pasta/Teigwaren
  if (/spätzle|fleckerl|lasagne|mac and cheese|aglio|pomodoro|arrabiata|pesto|carbonara|bolognese/i.test(name)) {
    return SC;
  }
  if (/\b(pasta|spaghetti|penne|rigatoni|tortellini|fusilli|tagliatelle|gnocchi|schupfnudeln)\b/i.test(name)) {
    return SC;
  }
  // Self-contained: Strudel/Quiche/Tarte
  if (/\b(strudel|quiche|tarte|flammkuchen|zwiebelkuchen)\b/i.test(name)) {
    return SC;
  }
  // Self-contained: Auflauf/Gratin
  if (/\b(auflauf|gratin|moussaka|parmigiana|überbacken)\b/i.test(name)) {
    return SC;
  }
  // Self-contained: Curry/Eintopf
  if (/\b(curry|chili sin|eintopf|linsen-dal)\b/i.test(name)) {
    return SC;
  }
  // Self-contained: Gröstl/Risotto/Polenta
  if (/gröstl|erdäpfelgulasch/i.test(name)) {
    return SC;
  }
  if (/\b(risotto|polenta)\b/i.test(name) && !/beilage/i.test(name)) {
    return SC;
  }

  // Paniertes pattern (but not "Suppe" or "Auflauf")
  if (/\b(paniert|gebackene[rs]?)\b/i.test(name) && !/suppe|auflauf|gratin/i.test(name)) {
    return PANIERT;
  }

  return {};
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * v3: Pick with score-weighted probability (Explore/Exploit).
 * - With probability epsilon → random pick (explore)
 * - Otherwise → score^2 weighted random (exploit)
 * - Unrated pairings default to 3.0
 */
function pickWeighted(
  candidates: Recipe[],
  scoreMap: Map<number, number> | undefined,
  epsilon: number,
): Recipe | null {
  if (candidates.length === 0) return null;
  if (!scoreMap || scoreMap.size === 0 || Math.random() < epsilon) {
    return pickRandom(candidates);
  }

  // Score^2 weighting: 1→1, 3→9, 5→25
  const weights = candidates.map(c => {
    const score = scoreMap.get(c.id) ?? 3.0;
    return score * score;
  });
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return pickRandom(candidates);

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/**
 * v3: Adaptive epsilon — more exploration with few ratings, converges to base.
 */
function getAdaptiveEpsilon(totalRatings: number, base = 0.2): number {
  if (totalRatings < 50) return 0.5;
  return base + (0.5 - base) * Math.exp(-0.01 * (totalRatings - 50));
}

/**
 * Pick a starch side dish respecting culinary rules:
 * forbidden starches, used IDs/groups, then preferred, then any remaining.
 */
function pickStarchFor(
  mainName: string,
  starchPool: Recipe[],
  usedIds: Set<number>,
  usedStarchGroups: Set<string>,
  scoreMap?: Map<number, number>,
  epsilon = 0.2,
): Recipe | null {
  if (starchPool.length === 0) return null;

  const meta = getDishMeta(mainName);

  const forbiddenNames = new Set(meta.forbiddenStarches || []);
  const candidates = starchPool.filter(r => !forbiddenNames.has(r.name));

  const withoutUsed = candidates.filter(r => {
    if (usedIds.has(r.id)) return false;
    return !usedStarchGroups.has(getStarchGroup(r));
  });

  // Preferred starches first (DISH_META hard constraint)
  if (meta.preferredStarches?.length) {
    const preferredNames = new Set(meta.preferredStarches);
    const preferred = withoutUsed.filter(r => preferredNames.has(r.name));
    if (preferred.length > 0) return pickWeighted(preferred, scoreMap, epsilon);
  }

  if (withoutUsed.length > 0) return pickWeighted(withoutUsed, scoreMap, epsilon);

  // Fallback: relax starch-group constraint (still respect forbidden + usedIds)
  const relaxed = candidates.filter(r => !usedIds.has(r.id));
  if (relaxed.length > 0) return pickWeighted(relaxed, scoreMap, epsilon);

  return pickRandom(candidates.length > 0 ? candidates : starchPool);
}

/**
 * Pick a veggie side dish respecting culinary rules:
 * used IDs, then preferred, then any remaining.
 */
function pickVeggieFor(
  mainName: string,
  veggiePool: Recipe[],
  usedIds: Set<number>,
  scoreMap?: Map<number, number>,
  epsilon = 0.2,
): Recipe | null {
  if (veggiePool.length === 0) return null;

  const meta = getDishMeta(mainName);

  const available = veggiePool.filter(r => !usedIds.has(r.id));

  // Preferred veggies first (DISH_META hard constraint)
  if (meta.preferredVeggies?.length) {
    const preferredNames = new Set(meta.preferredVeggies);
    const preferred = available.filter(r => preferredNames.has(r.name));
    if (preferred.length > 0) return pickWeighted(preferred, scoreMap, epsilon);
  }

  if (available.length > 0) return pickWeighted(available, scoreMap, epsilon);

  return pickRandom(veggiePool);
}

/**
 * Round-robin pick from a shuffled pool, skipping already-used IDs.
 * Returns the picked recipe and advances the index counter.
 */
function pickFromPool(
  pool: Recipe[],
  counter: { value: number },
  usedIds: Set<number>,
): Recipe | null {
  if (pool.length === 0) return null;
  for (let attempt = 0; attempt < pool.length; attempt++) {
    const candidate = pool[counter.value % pool.length];
    counter.value++;
    if (!usedIds.has(candidate.id)) return candidate;
  }
  const fallback = pool[counter.value % pool.length];
  counter.value++;
  return fallback;
}

interface AutoFillOptions {
  overwrite?: boolean;
  useScores?: boolean;
}

export async function autoFillRotation(
  templateId: number,
  options: AutoFillOptions = {}
): Promise<{ filled: number; skipped: number }> {
  const { overwrite = false, useScores = true } = options;

  const recipes = await storage.getRecipes();
  const allSlots = await storage.getRotationSlots(templateId);

  let starchScores = new Map<number, Map<number, number>>();
  let veggieScores = new Map<number, Map<number, number>>();
  let epsilon = 0.2;

  if (useScores) {
    try {
      const scores = await loadAllScores();
      starchScores = scores.starch;
      veggieScores = scores.veggie;

      // Get total rating count for adaptive epsilon
      const { rows: [countRow] } = await pool.query(`SELECT COUNT(*) AS total FROM quiz_feedback`);
      const totalRatings = parseInt(countRow.total);

      // Check for configured epsilon override
      const { rows: epsilonRows } = await pool.query(`SELECT value FROM app_settings WHERE key = 'quiz_epsilon'`);
      const baseEpsilon = epsilonRows.length > 0 ? parseFloat(epsilonRows[0].value) : 0.2;
      epsilon = getAdaptiveEpsilon(totalRatings, baseEpsilon);

      console.log(`[rotation-agent v3] Scores loaded: ${starchScores.size} starch mains, ${veggieScores.size} veggie mains, epsilon=${epsilon.toFixed(3)}`);
    } catch (err) {
      console.warn("[rotation-agent v3] Could not load scores, falling back to random:", err);
    }
  }

  const soups: Recipe[] = [];
  const mainsMeat: Recipe[] = [];
  const mainsVegan: Recipe[] = [];
  const sidesStarch: Recipe[] = [];
  const sidesVeg: Recipe[] = [];

  for (const r of recipes) {
    if (r.tags?.includes("kein-rotation")) continue;

    switch (r.category) {
      case "ClearSoups":
      case "CreamSoups":
        soups.push(r);
        break;
      case "MainMeat":
      case "MainFish":
        mainsMeat.push(r);
        break;
      case "MainVegan":
        mainsVegan.push(r);
        break;
      case "Sides":
        if (r.tags?.includes("stärke")) sidesStarch.push(r);
        else if (r.tags?.includes("gemüse")) sidesVeg.push(r);
        break;
    }
  }

  console.log(
    `[rotation-agent v3] Pools: ${soups.length} Suppen, ${mainsMeat.length} Fleisch, ` +
    `${mainsVegan.length} Vegan, ${sidesStarch.length} Stärke, ${sidesVeg.length} Gemüse`
  );

  shuffle(soups);
  shuffle(mainsMeat);
  shuffle(mainsVegan);
  shuffle(sidesStarch);
  shuffle(sidesVeg);

  const locationSlugs = Array.from(new Set(allSlots.map(s => s.locationSlug)));

  type LocationPools = {
    soup: Recipe[];
    main1: Recipe[];
    main2: Recipe[];
    starch: Recipe[];
    veg: Recipe[];
  };

  const poolsByLocation = new Map<string, LocationPools>();
  for (const loc of locationSlugs) {
    poolsByLocation.set(loc, {
      soup: shuffle([...soups]),
      main1: shuffle([...mainsMeat]),
      main2: shuffle([...mainsVegan]),
      starch: [...sidesStarch],
      veg: [...sidesVeg],
    });
  }

  const slotGroups = new Map<string, RotationSlot[]>();
  for (const slot of allSlots) {
    const key = `${slot.weekNr}-${slot.dayOfWeek}-${slot.locationSlug}-${slot.meal}`;
    const group = slotGroups.get(key) || [];
    group.push(slot);
    slotGroups.set(key, group);
  }

  let filled = 0;
  let skipped = 0;

  const poolIdx = new Map<string, { soup: { value: number }; main1: { value: number }; main2: { value: number } }>();
  for (const loc of locationSlugs) {
    poolIdx.set(loc, { soup: { value: 0 }, main1: { value: 0 }, main2: { value: 0 } });
  }

  const weekNrs = Array.from(new Set(allSlots.map(s => s.weekNr))).sort();
  const daysOfWeek = Array.from(new Set(allSlots.map(s => s.dayOfWeek))).sort();

  for (const weekNr of weekNrs) {
    for (const dow of daysOfWeek) {
      // Per-DAY: no recipe used twice (shared across locations)
      const dayUsedIds = new Set<number>();

      for (const locSlug of locationSlugs) {

        const pools = poolsByLocation.get(locSlug)!;
        const idx = poolIdx.get(locSlug)!;

        for (const meal of ["lunch", "dinner"]) {
          // SÜD Mittag = City Mittag (auto-copied during menu plan generation)
          if (locSlug === "sued" && meal === "lunch") continue;

          // Per-MEAL: starch group collision avoidance resets
          const mealUsedStarchGroups = new Set<string>();

          const key = `${weekNr}-${dow}-${locSlug}-${meal}`;
          const groupSlots = slotGroups.get(key) || [];

          // Sort slots: soup → main1 → side1a → side1b → main2 → side2a → side2b → dessert
          const slotOrder: MealSlotName[] = ["soup", "main1", "side1a", "side1b", "main2", "side2a", "side2b", "dessert"];
          const sorted = [...groupSlots].sort((a, b) => {
            const ai = slotOrder.indexOf(a.course as MealSlotName);
            const bi = slotOrder.indexOf(b.course as MealSlotName);
            return ai - bi;
          });

          // Track the main dishes picked for this meal (to inform side selection)
          let main1Recipe: Recipe | null = null;
          let main2Recipe: Recipe | null = null;

          for (const slot of sorted) {
            // Dessert = always null (not auto-filled)
            if (slot.course === "dessert") {
              if (overwrite && slot.recipeId !== null) {
                await storage.updateRotationSlot(slot.id, { recipeId: null });
              }
              skipped++;
              continue;
            }

            // Skip already filled slots (unless overwrite)
            if (slot.recipeId !== null && !overwrite) {
              dayUsedIds.add(slot.recipeId);
              // Track existing main dishes for side selection
              if (slot.course === "main1") {
                main1Recipe = recipes.find(r => r.id === slot.recipeId) || null;
              } else if (slot.course === "main2") {
                main2Recipe = recipes.find(r => r.id === slot.recipeId) || null;
              }
              // Track starch groups from existing sides
              if (slot.course === "side1a" || slot.course === "side2a") {
                const existing = recipes.find(r => r.id === slot.recipeId);
                if (existing) mealUsedStarchGroups.add(getStarchGroup(existing));
              }
              skipped++;
              continue;
            }

            // ── Pick recipe based on slot type ──
            let picked: Recipe | null = null;

            switch (slot.course) {
              case "soup": {
                picked = pickFromPool(pools.soup, idx.soup, dayUsedIds);
                break;
              }

              case "main1": {
                picked = pickFromPool(pools.main1, idx.main1, dayUsedIds);
                main1Recipe = picked;
                break;
              }

              case "main2": {
                picked = pickFromPool(pools.main2, idx.main2, dayUsedIds);
                main2Recipe = picked;
                break;
              }

              case "side1a": {
                if (main1Recipe) {
                  const meta = getDishMeta(main1Recipe.name);
                  if (meta.selfContained || meta.dessertMain) {
                    if (overwrite && slot.recipeId !== null) {
                      await storage.updateRotationSlot(slot.id, { recipeId: null });
                    }
                    skipped++;
                    continue;
                  }
                  const mainScores = starchScores.get(main1Recipe.id);
                  picked = pickStarchFor(main1Recipe.name, pools.starch, dayUsedIds, mealUsedStarchGroups, mainScores, epsilon);
                  if (picked) mealUsedStarchGroups.add(getStarchGroup(picked));
                }
                break;
              }

              case "side1b": {
                if (main1Recipe) {
                  const meta = getDishMeta(main1Recipe.name);
                  if (meta.dessertMain) {
                    if (overwrite && slot.recipeId !== null) {
                      await storage.updateRotationSlot(slot.id, { recipeId: null });
                    }
                    skipped++;
                    continue;
                  }
                  const mainScores = veggieScores.get(main1Recipe.id);
                  picked = pickVeggieFor(main1Recipe.name, pools.veg, dayUsedIds, mainScores, epsilon);
                }
                break;
              }

              case "side2a": {
                if (main2Recipe) {
                  const meta = getDishMeta(main2Recipe.name);
                  if (meta.selfContained || meta.dessertMain) {
                    if (overwrite && slot.recipeId !== null) {
                      await storage.updateRotationSlot(slot.id, { recipeId: null });
                    }
                    skipped++;
                    continue;
                  }
                  const mainScores = starchScores.get(main2Recipe.id);
                  picked = pickStarchFor(main2Recipe.name, pools.starch, dayUsedIds, mealUsedStarchGroups, mainScores, epsilon);
                  if (picked) mealUsedStarchGroups.add(getStarchGroup(picked));
                }
                break;
              }

              case "side2b": {
                if (main2Recipe) {
                  const meta = getDishMeta(main2Recipe.name);
                  if (meta.dessertMain) {
                    if (overwrite && slot.recipeId !== null) {
                      await storage.updateRotationSlot(slot.id, { recipeId: null });
                    }
                    skipped++;
                    continue;
                  }
                  const mainScores = veggieScores.get(main2Recipe.id);
                  picked = pickVeggieFor(main2Recipe.name, pools.veg, dayUsedIds, mainScores, epsilon);
                }
                break;
              }
            }

            if (picked === null) {
              skipped++;
              continue;
            }

            await storage.updateRotationSlot(slot.id, { recipeId: picked.id });
            dayUsedIds.add(picked.id);
            filled++;
          }
        }
      }
    }
  }

  return { filled, skipped };
}

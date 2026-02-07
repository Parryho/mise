import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// MISE.AT — MENÜ-LERNMODUL "Küchenchef-Quiz"
// Ein Hauptgericht + Stärke + Gemüse pro Karte
// ═══════════════════════════════════════════════════════════════

const SUPPEN = [
  "Selleriecremesuppe", "Schwammerlsuppe", "Spargelcremesuppe", "Nudelsuppe",
  "Zwiebelsuppe", "Bärlauchcremesuppe", "Leberknödelsuppe", "Erdäpfelsuppe",
  "Grießnockerlsuppe", "Linsensuppe", "Knoblauchcremesuppe", "Einmachsuppe",
  "Kürbiscremesuppe", "Erbsensuppe", "Fritatensuppe", "Bohnensuppe"
];

const HAUPTGERICHTE = [
  { name: "Wiener Schnitzel", type: "paniert", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Backhendl", type: "paniert", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Cordon Bleu", type: "paniert", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Putenschnitzel", type: "paniert", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Schweinsbraten", type: "braten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Kümmelbraten", type: "braten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Stelze", type: "braten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Tafelspitz", type: "braten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Zwiebelrostbraten", type: "braten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Rindsgulasch", type: "gulasch", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Kalbsrahmgeschnetzeltes", type: "ragout", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Geselchtes", type: "braten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Fleischlaberl", type: "gebraten", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Faschierter Braten", type: "braten", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Beuschel", type: "ragout", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Hühnerkeule überbacken", type: "überbacken", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Leberkäse", type: "gebraten", weight: "schwer", self_contained: false, cuisine: "klassiker" },
  { name: "Gebackene Leber", type: "paniert", weight: "mittel", self_contained: false, cuisine: "klassiker" },
  { name: "Blunzengröstl", type: "gröstl", weight: "schwer", self_contained: true, cuisine: "klassiker" },
  { name: "Käsespätzle", type: "teigware", weight: "mittel", self_contained: true, cuisine: "klassiker" },
  { name: "Krautfleckerl mit Speck", type: "teigware", weight: "mittel", self_contained: true, cuisine: "klassiker" },
  { name: "Schinkenfleckerl", type: "teigware", weight: "mittel", self_contained: true, cuisine: "klassiker" },
  { name: "Lasagne", type: "teigware", weight: "schwer", self_contained: true, cuisine: "international" },
  { name: "Flammkuchen", type: "teigware", weight: "leicht", self_contained: true, cuisine: "international" },
  { name: "Quiche Lorraine", type: "teigware", weight: "mittel", self_contained: true, cuisine: "international" },
  { name: "Gemüselaibchen", type: "gebraten", weight: "leicht", self_contained: false, cuisine: "vegetarisch" },
  { name: "Gemüsestrudel", type: "strudel", weight: "leicht", self_contained: true, cuisine: "vegetarisch" },
  { name: "Krautstrudel", type: "strudel", weight: "leicht", self_contained: true, cuisine: "vegetarisch" },
  { name: "Spinatknödel", type: "knödel", weight: "mittel", self_contained: true, cuisine: "vegetarisch" },
  { name: "Polenta mit Schwammerl", type: "polenta", weight: "mittel", self_contained: true, cuisine: "vegetarisch" },
  { name: "Eierschwammerl mit Knödel", type: "knödel", weight: "mittel", self_contained: true, cuisine: "klassiker" },
  { name: "Erdäpfelgulasch", type: "gulasch", weight: "mittel", self_contained: true, cuisine: "klassiker" },
  { name: "Marillenknödel", type: "dessert_main", weight: "mittel", self_contained: true, cuisine: "mehlspeise" },
  { name: "Mohnnudeln", type: "dessert_main", weight: "mittel", self_contained: true, cuisine: "mehlspeise" },
  { name: "Topfenknödel", type: "dessert_main", weight: "mittel", self_contained: true, cuisine: "mehlspeise" },
  { name: "Zwetschgenknödel", type: "dessert_main", weight: "mittel", self_contained: true, cuisine: "mehlspeise" },
];

const STAERKE = [
  "Petersilkartoffeln", "Erdäpfelpüree", "Bratkartoffeln", "Kroketten", "Pommes",
  "Reis", "Spätzle", "Butternockerl", "Semmelknödel", "Serviettenknödel",
  "Rösterdäpfel", "Erdäpfelsalat"
];

const GEMUESE = [
  "Sauerkraut", "Rotkraut", "Speckkraut", "Kohlsprossen", "Bratgemüse",
  "Karottengemüse", "Rahmkohlrabi", "Blattsalat", "Vogerlsalat",
  "Wurzelgemüse", "Röstzwiebeln", "Preiselbeeren"
];

const MEHLSPEISE_SIDES = [
  "Butterbrösel", "Staubzucker", "Vanillesauce", "Zwetschgenröster", "Kompott"
];

interface Hauptgericht {
  name: string;
  type: string;
  weight: string;
  self_contained: boolean;
  cuisine: string;
}

interface Quiz {
  id: number;
  suppe: string;
  hauptgericht: Hauptgericht;
  starch: string | null;
  veggie: string | null;
  dessert_sides: string[] | null;
}

interface HistoryEntry {
  timestamp: string;
  combo: string;
  suppe: string;
  hauptgericht: string;
  type: string;
  starch: string | null;
  veggie: string | null;
  rating: string;
  swap: string | null;
}

// ═══════════════════════════════════════════════════════════════
// LOKALE KULINARISCHE REGELN (aus Rotation-Agent DISH_META)
// ═══════════════════════════════════════════════════════════════

const KNÖDEL = ["Semmelknödel", "Serviettenknödel"];
const POMMES_ETC = ["Pommes", "Kroketten"];

interface KombiRegel {
  preferred?: string[];
  forbidden?: string[];
  preferredVeggies?: string[];
  tips?: string[];
}

const KOMBI_REGELN: Record<string, KombiRegel> = {
  paniert: {
    preferred: ["Pommes", "Erdäpfelpüree", "Reis", "Petersilkartoffeln"],
    forbidden: KNÖDEL,
    tips: ["Paniertes nie mit Knödel — die Panade wird matschig.", "Klassisch: Erdäpfelsalat, Petersilkartoffeln oder Reis."],
  },
  braten: {
    preferred: ["Semmelknödel", "Serviettenknödel"],
    forbidden: POMMES_ETC,
    preferredVeggies: ["Sauerkraut", "Rotkraut"],
    tips: ["Braten braucht Knödel — der Saft muss aufgesaugt werden!", "Schweinsbraten + Sauerkraut + Semmelknödel = Österreich pur."],
  },
  gulasch: {
    preferred: ["Semmelknödel", "Spätzle", "Serviettenknödel"],
    tips: ["Gulaschsaft braucht einen Saucenfänger: Knödel oder Spätzle."],
  },
  ragout: {
    preferred: ["Spätzle", "Reis", "Butternockerl"],
    tips: ["Geschnetzeltes/Ragout: Spätzle oder Reis sind ideal."],
  },
  gebraten: {
    preferred: ["Erdäpfelpüree", "Petersilkartoffeln", "Bratkartoffeln"],
    tips: ["Gebratenes (Laberl, Leberkäse) passt zu Erdäpfelpüree."],
  },
  überbacken: {
    preferred: ["Reis", "Petersilkartoffeln", "Bratkartoffeln"],
    tips: ["Überbackenes braucht eine leichte Beilage."],
  },
};

interface Evaluation {
  score: number;
  verdict: string;
  problem: string | null;
  suggestion: string | null;
  classic: string | null;
}

function evaluateCombo(quiz: Quiz): Evaluation {
  const h = quiz.hauptgericht;

  // Dessert-Mains → always good with their garnishes
  if (h.type === "dessert_main") {
    return { score: 4, verdict: "Mehlspeisen-Hauptgang mit Garnitur — passt immer!", problem: null, suggestion: null, classic: `${h.name} mit ${quiz.dessert_sides?.join(" & ")}` };
  }

  // Self-contained → just check veggie
  if (h.self_contained) {
    return { score: 4, verdict: `${h.name} ist ein eigenständiges Gericht — braucht keine Stärkebeilage.`, problem: null, suggestion: null, classic: null };
  }

  const regeln = KOMBI_REGELN[h.type];
  if (!regeln) {
    return { score: 3, verdict: "Unbekannter Typ — keine speziellen Regeln.", problem: null, suggestion: null, classic: null };
  }

  const starch = quiz.starch || "";

  // Check forbidden
  if (regeln.forbidden?.some(f => starch.toLowerCase().includes(f.toLowerCase()))) {
    const better = regeln.preferred?.slice(0, 2).join(" oder ");
    return {
      score: 1,
      verdict: `${h.name} + ${starch} — das passt nicht!`,
      problem: regeln.tips?.[0] || `${starch} passt nicht zu ${h.type}.`,
      suggestion: better ? `Besser: ${better}` : null,
      classic: null,
    };
  }

  // Check preferred
  if (regeln.preferred?.some(p => starch.toLowerCase().includes(p.toLowerCase()))) {
    const tip = regeln.tips?.[regeln.tips.length - 1] || null;
    const veggieTip = regeln.preferredVeggies
      ? (regeln.preferredVeggies.some(v => quiz.veggie?.toLowerCase().includes(v.toLowerCase()))
        ? null
        : `Tipp: ${regeln.preferredVeggies.join(" oder ")} wäre ideal dazu.`)
      : null;
    return {
      score: 5,
      verdict: `Perfekte Kombination! ${h.name} + ${starch} ist ein Klassiker.`,
      problem: null,
      suggestion: veggieTip,
      classic: tip,
    };
  }

  // Neutral — not forbidden, not preferred
  return {
    score: 3,
    verdict: `${h.name} + ${starch} — geht, aber es gibt bessere Optionen.`,
    problem: null,
    suggestion: regeln.preferred ? `Klassisch wäre: ${regeln.preferred.slice(0, 2).join(" oder ")}` : null,
    classic: regeln.tips?.[0] || null,
  };
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function generateQuiz(): Quiz {
  const suppe = pick(SUPPEN);
  const h = pick(HAUPTGERICHTE);

  if (h.type === "dessert_main") {
    const s1 = pick(MEHLSPEISE_SIDES);
    const s2 = pick(MEHLSPEISE_SIDES.filter(x => x !== s1));
    return { id: Date.now() + Math.random(), suppe, hauptgericht: h, starch: null, veggie: null, dessert_sides: [s1, s2] };
  }
  if (h.self_contained) {
    return { id: Date.now() + Math.random(), suppe, hauptgericht: h, starch: null, veggie: pick(GEMUESE), dessert_sides: null };
  }
  return { id: Date.now() + Math.random(), suppe, hauptgericht: h, starch: pick(STAERKE), veggie: pick(GEMUESE), dessert_sides: null };
}

function formatCombo(q: Quiz): string {
  const h = q.hauptgericht;
  if (h.type === "dessert_main") return `${h.name} + ${q.dessert_sides?.join(" + ")}`;
  if (h.self_contained) return `${h.name}${q.veggie ? ` + ${q.veggie}` : ""}`;
  return `${h.name} + ${q.starch} + ${q.veggie}`;
}

const RATINGS = [
  { key: "perfekt", emoji: "\u2705", label: "Perfekt", color: "#1b7a3d", bg: "#e6f4ea" },
  { key: "ok", emoji: "\uD83D\uDC4D", label: "OK", color: "#1565c0", bg: "#e3f2fd" },
  { key: "getauscht", emoji: "\uD83D\uDD04", label: "Tausch", color: "#e65100", bg: "#fff3e0" },
  { key: "schlecht", emoji: "\u274C", label: "Nein", color: "#b71c1c", bg: "#ffebee" },
] as const;

const TYPE_LABELS: Record<string, { l: string; c: string; bg: string }> = {
  paniert: { l: "Paniert", c: "#e65100", bg: "#fff3e0" },
  braten: { l: "Braten", c: "#4e342e", bg: "#efebe9" },
  gulasch: { l: "Gulasch", c: "#bf360c", bg: "#fbe9e7" },
  ragout: { l: "Ragout", c: "#6d4c41", bg: "#efebe9" },
  teigware: { l: "Teigware", c: "#1565c0", bg: "#e3f2fd" },
  strudel: { l: "Strudel", c: "#2e7d32", bg: "#e8f5e9" },
  knödel: { l: "Knödel", c: "#6a1b9a", bg: "#f3e5f5" },
  gebraten: { l: "Gebraten", c: "#e65100", bg: "#fff3e0" },
  dessert_main: { l: "Mehlspeise", c: "#ad1457", bg: "#fce4ec" },
  polenta: { l: "Polenta", c: "#827717", bg: "#f9fbe7" },
  überbacken: { l: "Überbacken", c: "#ff8f00", bg: "#fff8e1" },
  gröstl: { l: "Gröstl", c: "#4e342e", bg: "#efebe9" },
};

// ── Regel-Check (lokal + optional KI) ──
function RegelCheck({ quiz, visible }: { quiz: Quiz; visible: boolean }) {
  const [aiData, setAiData] = useState<Evaluation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  if (!visible) return null;

  // Sofortige lokale Auswertung
  const local = evaluateCombo(quiz);
  const stars = "⭐".repeat(local.score) + "☆".repeat(5 - local.score);

  const fetchAI = () => {
    setAiLoading(true);
    setAiErr(null);
    const combo = formatCombo(quiz);
    fetch("/api/quiz/ai-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suppe: quiz.suppe, combo }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setAiErr(d.error); return; }
        setAiData(d);
      })
      .catch(() => setAiErr("KI nicht verfügbar"))
      .finally(() => setAiLoading(false));
  };

  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-4 mt-3 animate-in fade-in space-y-2">
      {/* Lokale Regeln — sofort */}
      <div className="flex items-center gap-2 text-[15px]">
        <span>📋</span>
        <span className="font-bold">Regel-Check</span>
        <span className="ml-auto">{stars}</span>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{local.verdict}</p>
      {local.problem && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed">
          <span className="font-bold">⚠️ Problem:</span> {local.problem}
        </div>
      )}
      {local.suggestion && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed">
          <span className="font-bold">💡 Tipp:</span> {local.suggestion}
        </div>
      )}
      {local.classic && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed">
          <span className="font-bold">📖 Klassisch:</span> {local.classic}
        </div>
      )}

      {/* Optional: KI-Tiefenanalyse */}
      {!aiData && !aiLoading && !aiErr && (
        <button
          onClick={fetchAI}
          className="w-full mt-1 py-2 px-4 border border-dashed border-border rounded-xl bg-transparent text-[12px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          🤖 KI-Analyse (optional)
        </button>
      )}
      {aiLoading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">KI analysiert...</span>
        </div>
      )}
      {aiErr && (
        <p className="text-[11px] text-muted-foreground/50 text-center">{aiErr}</p>
      )}
      {aiData && (
        <div className="border-t border-border/50 pt-2 mt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-[13px]">
            <span>🤖</span>
            <span className="font-bold">KI-Küchenchef</span>
            <span className="ml-auto">{"⭐".repeat(aiData.score)}{"☆".repeat(5 - aiData.score)}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-foreground">{aiData.verdict}</p>
          {aiData.problem && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2 text-[12px]">
              <span className="font-bold">⚠️</span> {aiData.problem}
            </div>
          )}
          {aiData.suggestion && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[12px]">
              <span className="font-bold">💡</span> {aiData.suggestion}
            </div>
          )}
          {aiData.classic && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-[12px]">
              <span className="font-bold">📖</span> {aiData.classic}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stats ──
function Stats({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null;
  const c: Record<string, number> = { perfekt: 0, ok: 0, getauscht: 0, schlecht: 0 };
  history.forEach(h => c[h.rating]++);
  const pct = (key: string) => history.length > 0 ? Math.round((c[key] / history.length) * 100) : 0;

  const worst = history.filter(h => h.rating === "schlecht").slice(-5);
  const best = history.filter(h => h.rating === "perfekt").slice(-5);
  const swaps = history.filter(h => h.rating === "getauscht" && h.swap).slice(-3);

  return (
    <div className="bg-card rounded-2xl p-5 mb-4 shadow-sm animate-in fade-in">
      <h3 className="font-heading text-lg font-bold mb-3">📊 Lern-Fortschritt</h3>

      <div className="mb-4">
        <div className="flex h-8 rounded-xl overflow-hidden border border-border">
          {RATINGS.map(r => c[r.key] > 0 && (
            <div key={r.key} style={{
              width: `${pct(r.key)}%`, background: r.bg, minWidth: 28,
            }} className="flex items-center justify-center text-xs font-bold" >
              <span style={{ color: r.color }}>{pct(r.key) > 8 ? c[r.key] : ""}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
          {RATINGS.map(r => <span key={r.key}>{r.emoji} {c[r.key]}</span>)}
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground text-center mb-3">{history.length} bewertet</p>

      {best.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold text-green-700 mb-1.5">{"\u2705"} Perfekte Kombis</p>
          {best.map((b, i) => <p key={i} className="text-xs py-1 text-muted-foreground border-b border-border/50">{b.combo}</p>)}
        </div>
      )}
      {worst.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold text-red-700 mb-1.5">{"\u274C"} No-Gos</p>
          {worst.map((w, i) => <p key={i} className="text-xs py-1 text-muted-foreground border-b border-border/50">{w.combo}</p>)}
        </div>
      )}
      {swaps.length > 0 && (
        <div>
          <p className="text-xs font-bold text-orange-700 mb-1.5">🔄 Deine Korrekturen</p>
          {swaps.map((sw, i) => (
            <p key={i} className="text-xs py-1 text-muted-foreground border-b border-border/50 leading-relaxed">
              <span className="line-through opacity-50">{sw.combo}</span>
              <br />→ {sw.swap}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function MenuQuiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showSwap, setShowSwap] = useState(false);
  const [swapText, setSwapText] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [anim, setAnim] = useState("in");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quiz-history-v2");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const save = useCallback((h: HistoryEntry[]) => {
    try { localStorage.setItem("quiz-history-v2", JSON.stringify(h)); } catch {}
  }, []);

  const next = useCallback(() => {
    setAnim("in");
    setShowSwap(false);
    setSwapText("");
    setShowAI(false);
    setQuiz(generateQuiz());
  }, []);

  useEffect(() => { if (!quiz) next(); }, [quiz, next]);

  const rate = useCallback((rating: string) => {
    if (!quiz) return;
    if (rating === "getauscht") { setShowSwap(true); return; }
    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      combo: formatCombo(quiz),
      suppe: quiz.suppe,
      hauptgericht: quiz.hauptgericht.name,
      type: quiz.hauptgericht.type,
      starch: quiz.starch,
      veggie: quiz.veggie,
      rating,
      swap: null,
    };
    const nh = [...history, entry];
    setHistory(nh);
    save(nh);
    // Also send to server for pairing engine
    sendFeedbackToServer(quiz, rating);
    setAnim("out");
    setTimeout(next, 350);
  }, [quiz, history, next, save]);

  const submitSwap = useCallback(() => {
    if (!quiz) return;
    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      combo: formatCombo(quiz),
      suppe: quiz.suppe,
      hauptgericht: quiz.hauptgericht.name,
      type: quiz.hauptgericht.type,
      starch: quiz.starch,
      veggie: quiz.veggie,
      rating: "getauscht",
      swap: swapText,
    };
    const nh = [...history, entry];
    setHistory(nh);
    save(nh);
    sendFeedbackToServer(quiz, "getauscht");
    setAnim("out");
    setTimeout(next, 350);
  }, [quiz, history, swapText, next, save]);

  const reset = useCallback(() => {
    if (!confirm("Alle Lern-Daten löschen?")) return;
    setHistory([]);
    try { localStorage.removeItem("quiz-history-v2"); } catch {}
  }, []);

  if (!quiz) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const h = quiz.hauptgericht;
  const tl = TYPE_LABELS[h.type] || { l: h.type, c: "#555", bg: "#eee" };
  const isDessert = h.type === "dessert_main";
  const isSelf = h.self_contained && !isDessert;

  return (
    <div className="flex flex-col pb-24">
      <style>{`
        @keyframes quizSlideIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes quizSlideOut { from { opacity:1; transform:translateY(0) } to { opacity:0; transform:translateY(-24px) } }
      `}</style>

      {/* Orange Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide">Küchenchef-Quiz</h1>
            <p className="text-[11px] text-primary-foreground/70 mt-0.5">Bewerte Menü-Kombis — das System lernt mit</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`border rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${showStats ? "bg-primary-foreground text-primary" : "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"}`}
            >
              📊 {history.length}
            </button>
            {history.length > 0 && (
              <button onClick={reset} className="border border-primary-foreground/30 rounded-lg px-2 py-1.5 text-primary-foreground/50 hover:text-primary-foreground text-[13px]">
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 space-y-3">
        {showStats && <Stats history={history} />}

        {/* Card */}
        <div
          className="bg-card rounded-2xl p-5 shadow-sm border border-border/50"
          style={{ animation: anim === "out" ? "quizSlideOut .35s ease forwards" : "quizSlideIn .4s ease forwards" }}
        >
          {/* Suppe */}
          <div className="flex items-center gap-3.5">
            <span className="text-[28px]">🥣</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Suppe</p>
              <p className="font-heading text-xl text-foreground">{quiz.suppe}</p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />

          {/* Hauptgericht */}
          <div className="mb-1.5">
            <div className="flex gap-2 items-center mb-2.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hauptgericht</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ color: tl.c, background: tl.bg }}>{tl.l}</span>
              {h.self_contained && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 uppercase">Eigenständig</span>}
            </div>
            <p className="font-heading text-[28px] text-foreground leading-tight mb-4">{h.name}</p>
          </div>

          {/* Beilagen */}
          <div className="flex gap-2.5">
            {isDessert ? (
              <div className="flex-1 flex gap-2.5 items-center bg-muted/30 rounded-xl p-3 border border-border/50">
                <span className="text-[22px]">🍰</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Garnitur</p>
                  <p className="text-[15px] font-semibold text-foreground mt-0.5">{quiz.dessert_sides?.join(" + ")}</p>
                </div>
              </div>
            ) : isSelf ? (
              <div className="flex-1 flex gap-2.5 items-center bg-muted/30 rounded-xl p-3 border border-border/50">
                <span className="text-[22px]">🥬</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Beilage</p>
                  <p className="text-[15px] font-semibold text-foreground mt-0.5">{quiz.veggie}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 flex gap-2.5 items-center bg-muted/30 rounded-xl p-3 border border-border/50">
                  <span className="text-[22px]">🥔</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stärke</p>
                    <p className="text-[15px] font-semibold text-foreground mt-0.5">{quiz.starch}</p>
                  </div>
                </div>
                <div className="flex-1 flex gap-2.5 items-center bg-muted/30 rounded-xl p-3 border border-border/50">
                  <span className="text-[22px]">🥬</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Gemüse</p>
                    <p className="text-[15px] font-semibold text-foreground mt-0.5">{quiz.veggie}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Weight + Cuisine */}
          <div className="flex justify-center gap-4 mt-3.5 text-xs text-muted-foreground">
            <span>{h.weight === "schwer" ? "🔴 Schwer" : h.weight === "mittel" ? "🟡 Mittel" : "🟢 Leicht"}</span>
            <span>{h.cuisine === "klassiker" ? "🇦🇹 Klassiker" : h.cuisine === "mehlspeise" ? "🍰 Mehlspeise" : h.cuisine === "vegetarisch" ? "🌱 Vegetarisch" : "🌍 International"}</span>
          </div>

          {/* Regel-Check */}
          {!showAI && (
            <button
              onClick={() => setShowAI(true)}
              className="w-full mt-3.5 py-2.5 px-5 border-2 border-dashed border-border rounded-xl bg-transparent text-[13px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              📋 Regel-Check
            </button>
          )}
          <RegelCheck quiz={quiz} visible={showAI} />

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />

          {/* Rating */}
          {!showSwap ? (
            <div>
              <p className="text-center text-sm font-semibold text-muted-foreground mb-3.5">
                Passt diese Kombination?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {RATINGS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => rate(r.key)}
                    className="flex flex-col items-center gap-1.5 py-4 px-1.5 border-2 border-border rounded-xl bg-card hover:scale-[1.03] active:scale-95 transition-all"
                    style={{ ["--hover-bg" as any]: r.bg }}
                    onPointerEnter={e => { (e.currentTarget.style.background = r.bg); (e.currentTarget.style.borderColor = r.color); }}
                    onPointerLeave={e => { (e.currentTarget.style.background = ""); (e.currentTarget.style.borderColor = ""); }}
                  >
                    <span className="text-[30px]">{r.emoji}</span>
                    <span className="text-[11px] font-bold" style={{ color: r.color }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in">
              <p className="text-sm font-semibold text-muted-foreground mb-2.5">🔄 Was würdest du stattdessen nehmen?</p>
              <textarea
                value={swapText}
                onChange={e => setSwapText(e.target.value)}
                placeholder="z.B. Petersilkartoffeln statt Serviettenknödel..."
                className="w-full min-h-[70px] p-3 border-2 border-border rounded-xl text-sm bg-muted/30 resize-y outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <div className="flex gap-2.5 justify-end mt-2.5">
                <button onClick={() => setShowSwap(false)} className="px-4 py-2 border border-border rounded-lg bg-card text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">
                  Abbrechen
                </button>
                <button onClick={submitSwap} className="px-5 py-2 border-none rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity">
                  Speichern →
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={next} className="block mx-auto py-2 px-5 bg-transparent border-none text-[13px] font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Überspringen →
        </button>
        <p className="text-center text-[11px] text-muted-foreground/30">#{history.length + 1}</p>
      </div>
    </div>
  );
}

// ── Send feedback to server for pairing engine ──
function sendFeedbackToServer(quiz: Quiz, rating: string) {
  // Map quiz rating to 1-5 score
  const scoreMap: Record<string, number> = { perfekt: 5, ok: 4, getauscht: 2, schlecht: 1 };
  const score = scoreMap[rating] || 3;

  // Send starch pairing if present
  if (quiz.starch) {
    fetch("/api/quiz/game-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hauptgericht: quiz.hauptgericht.name,
        side: quiz.starch,
        pairingType: "main_starch",
        rating: score,
      }),
    }).catch(() => {});
  }
  // Send veggie pairing if present
  if (quiz.veggie) {
    fetch("/api/quiz/game-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hauptgericht: quiz.hauptgericht.name,
        side: quiz.veggie,
        pairingType: "main_veggie",
        rating: score,
      }),
    }).catch(() => {});
  }
}

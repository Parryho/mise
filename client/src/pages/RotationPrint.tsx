import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { MEAL_SLOTS, getISOWeek, getWeekDateRange, formatLocalDate } from "@shared/constants";
import { apiFetch, apiPost } from "@/lib/api";
import { ALLERGENS } from "@shared/allergens";
import { cn } from "@/lib/utils";

interface RotationSlot {
  id: number;
  templateId: number;
  weekNr: number;
  dayOfWeek: number;
  meal: string;
  locationSlug: string;
  course: string;
  recipeId: number | null;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  allergens?: string[];
}

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function uiIndexToDbDow(uiIdx: number): number {
  return uiIdx === 6 ? 0 : uiIdx + 1;
}

const SLOT_LABELS: Record<string, string> = {
  soup: "Suppe",
  main1: "Haupt 1",
  side1a: "Beilage",
  side1b: "Beilage",
  main2: "Haupt 2",
  side2a: "Beilage",
  side2b: "Beilage",
  dessert: "Dessert",
};

interface BlockDef {
  key: string;
  locSlug: string;
  meal: string;
  label: string;
}

const ALL_BLOCKS: BlockDef[] = [
  { key: "city-lunch", locSlug: "city", meal: "lunch", label: "City Mittag" },
  { key: "city-dinner", locSlug: "city", meal: "dinner", label: "City Abend" },
  { key: "sued-lunch", locSlug: "sued", meal: "lunch", label: "SÜD Mittag" },
  { key: "sued-dinner", locSlug: "sued", meal: "dinner", label: "SÜD Abend" },
];

export default function RotationPrint() {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState(6);
  const [weekNr, setWeekNr] = useState(1);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBlocks, setShowBlocks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("mise-blocks-print");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { "city-lunch": true, "city-dinner": true, "sued-lunch": false, "sued-dinner": false };
  });
  useEffect(() => {
    localStorage.setItem("mise-blocks-print", JSON.stringify(showBlocks));
  }, [showBlocks]);

  const currentKW = getISOWeek(new Date());
  const currentYear = new Date().getFullYear();
  const currentRotWeek = ((currentKW - 1) % 6) + 1;

  const kwForWeek = (w: number): number => {
    let kw = currentKW - (currentRotWeek - 1) + (w - 1);
    if (kw < 1) kw += 52;
    if (kw > 52) kw -= 52;
    return kw;
  };

  const weekDates = useMemo(() => {
    const kw = kwForWeek(weekNr);
    const year = kw >= currentKW ? currentYear : currentYear + 1;
    const { from } = getWeekDateRange(year, kw);
    const dates: string[] = [];
    const start = new Date(from + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(formatLocalDate(d));
    }
    return dates;
  }, [weekNr, currentKW, currentYear, currentRotWeek]);

  useEffect(() => {
    Promise.all([
      apiPost("/api/rotation-templates/ensure-default", {}),
      apiFetch("/api/recipes"),
    ]).then(([tmpl, recs]: [any, any]) => {
      setTemplateId(tmpl.id);
      setWeekCount(tmpl.weekCount || 6);
      setRecipes(recs);
      setWeekNr(currentRotWeek);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!templateId) return;
    apiFetch(`/api/rotation-slots/${templateId}?weekNr=${weekNr}`)
      .then(data => setSlots(data))
      .catch(() => {});
  }, [templateId, weekNr]);

  const recipeMap = useMemo(() => {
    const m = new Map<number, Recipe>();
    for (const r of recipes) m.set(r.id, r);
    return m;
  }, [recipes]);

  const getSlot = (dayUiIdx: number, meal: string, locSlug: string, course: string): RotationSlot | undefined => {
    const dbDow = uiIndexToDbDow(dayUiIdx);
    return slots.find(
      s => s.dayOfWeek === dbDow && s.meal === meal && s.locationSlug === locSlug && s.course === course
    );
  };

  const visibleBlocks = ALL_BLOCKS.filter(b => showBlocks[b.key]);
  const numBlocks = visibleBlocks.length;

  const colWidthPercent = numBlocks > 0 ? Math.floor(99 / numBlocks) : 25;
  const dayCol = Math.floor(colWidthPercent * 0.14);
  const typeCol = Math.floor(colWidthPercent * 0.19);
  const nameCol = Math.floor(colWidthPercent * 0.46);
  const allergenCol = Math.floor(colWidthPercent * 0.12);
  const tempCol = Math.floor(colWidthPercent * 0.12);
  const spacerWidth = 0.5;

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}.${d.getMonth() + 1}.`;
  };

  const weekButtons = Array.from({ length: weekCount }, (_, i) => i + 1);
  const selectedKW = kwForWeek(weekNr);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 print:pb-0 print:m-0 print:p-0">
      {/* Controls — hidden when printing */}
      <div className="print:hidden bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link href="/rotation">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-xl font-bold uppercase tracking-wide">Druckansicht</h1>
              <p className="text-[10px] text-primary-foreground/60">
                W{weekNr} = KW {selectedKW}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs font-semibold"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" /> Drucken
          </Button>
        </div>

        {/* W1-W6 Buttons */}
        <div className="flex gap-1.5 mb-2">
          {weekButtons.map(w => {
            const kw = kwForWeek(w);
            const isSelected = weekNr === w;
            return (
              <button
                key={w}
                onClick={() => setWeekNr(w)}
                className={cn(
                  "relative flex-1 flex flex-col items-center py-1.5 rounded-xl text-xs font-bold transition-all press",
                  isSelected
                    ? "bg-white text-primary shadow-sm"
                    : "bg-white/15 text-primary-foreground/70 hover:bg-white/25"
                )}
              >
                <span>W{w}</span>
                <span className={cn("text-[9px] font-normal", isSelected ? "text-primary/60" : "text-primary-foreground/40")}>
                  KW {kw}
                </span>
                {w === currentRotWeek && (
                  <span className="absolute -top-0.5 right-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-status-info border-2 border-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Block toggles */}
        <div className="flex gap-1.5">
          {ALL_BLOCKS.map(block => (
            <button
              key={block.key}
              onClick={() => setShowBlocks(prev => ({ ...prev, [block.key]: !prev[block.key] }))}
              className={cn(
                "flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all",
                showBlocks[block.key]
                  ? "bg-white text-primary"
                  : "bg-white/15 text-primary-foreground/50"
              )}
            >
              {block.label}
            </button>
          ))}
        </div>
      </div>

      {numBlocks === 0 ? (
        <div className="text-center py-8 text-muted-foreground print:hidden">
          Bitte mindestens einen Block auswählen.
        </div>
      ) : (
        <div className="rotation-print-page p-4 print:p-0" style={{ fontSize: "7pt" }}>
          {/* Print-only header */}
          <div className="hidden print:flex print:items-center print:justify-between print:mb-1">
            <span className="font-heading text-[10pt] font-bold uppercase tracking-wide">
              Wochenplan KW {selectedKW} / {currentYear}
            </span>
            <span className="text-[8pt] text-muted-foreground">Rotationswoche W{weekNr}</span>
          </div>

          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {visibleBlocks.map((_, idx) => (
                <>
                  {idx > 0 && <col key={`sp-${idx}`} style={{ width: `${spacerWidth}%` }} />}
                  <col key={`d-${idx}`} style={{ width: `${dayCol}%` }} />
                  <col key={`t-${idx}`} style={{ width: `${typeCol}%` }} />
                  <col key={`n-${idx}`} style={{ width: `${nameCol}%` }} />
                  <col key={`a-${idx}`} style={{ width: `${allergenCol}%` }} />
                  <col key={`tc-${idx}`} style={{ width: `${tempCol}%` }} />
                </>
              ))}
            </colgroup>

            <thead>
              <tr>
                {visibleBlocks.map((block, idx) => (
                  <th
                    key={block.key}
                    colSpan={5 + (idx > 0 ? 1 : 0)}
                    className={cn(
                      "text-white px-2 py-1.5 text-center font-bold border border-slate-900",
                      block.locSlug === "city"
                        ? "bg-gradient-to-b from-primary to-primary/90"
                        : "bg-gradient-to-b from-primary/80 to-primary/70"
                    )}
                  >
                    KW {selectedKW} {block.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-muted">
                {visibleBlocks.map((_, idx) => (
                  <>
                    {idx > 0 && <td key={`sp-h-${idx}`} className="border-0" />}
                    <th key={`h-day-${idx}`} className="px-1 py-0.5 border border-border text-left font-bold text-foreground/70" />
                    <th key={`h-type-${idx}`} className="px-1 py-0.5 border border-border text-left font-bold text-foreground/70" />
                    <th key={`h-name-${idx}`} className="px-1 py-0.5 border border-border text-left font-bold text-foreground/70" />
                    <th key={`h-all-${idx}`} className="px-1 py-0.5 border border-border text-center font-bold text-foreground/70">All.</th>
                    <th key={`h-temp-${idx}`} className="px-1 py-0.5 border border-border text-center font-bold text-foreground/70">°C</th>
                  </>
                ))}
              </tr>
            </thead>

            <tbody>
              {DAY_LABELS.map((dayLabel, dayIdx) => {
                const dateStr = weekDates[dayIdx] || "";
                return MEAL_SLOTS.map((course, slotIdx) => {
                  const isMainCourse = course === "main1" || course === "main2";

                  return (
                    <tr
                      key={`${dayIdx}-${course}`}
                      className={cn(
                        slotIdx === 0 && "border-t-2 border-foreground/30",
                        isMainCourse ? "bg-amber-50" : slotIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      )}
                    >
                      {visibleBlocks.map((block, blockIdx) => {
                        const effectiveLocSlug = block.locSlug === "sued" && block.meal === "lunch" ? "city" : block.locSlug;
                        const slot = getSlot(dayIdx, block.meal, effectiveLocSlug, course);
                        const recipe = slot?.recipeId ? recipeMap.get(slot.recipeId) : null;
                        const isDessert = course === "dessert";
                        const allergenText = isDessert && !recipe
                          ? "A,C,G"
                          : recipe?.allergens?.length
                            ? recipe.allergens.join(",")
                            : "";

                        return (
                          <>
                            {blockIdx > 0 && <td key={`sp-${blockIdx}-${slotIdx}`} className="border-0" />}
                            <td
                              key={`d-${block.key}-${course}`}
                              className="px-1 py-0.5 border border-border/50"
                              style={{ lineHeight: "1.2" }}
                            >
                              {slotIdx === 0 && (
                                <span className="font-bold text-foreground">
                                  {dayLabel} <span className="font-normal text-muted-foreground">{dateStr ? formatDateShort(dateStr) : ""}</span>
                                </span>
                              )}
                            </td>
                            <td
                              key={`t-${block.key}-${course}`}
                              className={cn(
                                "px-1 py-0.5 border border-border/50",
                                isMainCourse ? "font-bold text-foreground" : "font-semibold text-muted-foreground"
                              )}
                              style={{ lineHeight: "1.2" }}
                            >
                              {SLOT_LABELS[course]}
                            </td>
                            <td
                              key={`n-${block.key}-${course}`}
                              className={cn(
                                "px-1 py-0.5 border border-border/50 overflow-hidden whitespace-nowrap text-ellipsis",
                                isMainCourse ? "font-semibold text-foreground" : "text-foreground/80"
                              )}
                              style={{ lineHeight: "1.2", maxWidth: 0 }}
                            >
                              {isDessert && !recipe ? (
                                <span className="italic text-muted-foreground">Dessertvariation</span>
                              ) : recipe ? (
                                <span title={recipe.name}>{recipe.name}</span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                            <td
                              key={`a-${block.key}-${course}`}
                              className="px-1 py-0.5 border border-border/50 text-center text-orange-600 font-medium"
                              style={{ lineHeight: "1.2", fontSize: "6pt" }}
                            >
                              {allergenText}
                            </td>
                            <td
                              key={`tc-${block.key}-${course}`}
                              className="px-1 py-0.5 border border-border/50 text-center text-muted-foreground/40"
                              style={{ lineHeight: "1.2" }}
                            >
                              __
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          {/* Allergen legend */}
          <div className="mt-3 pt-2 border-t-2 border-border text-[9px] text-muted-foreground print:text-[7pt] print:mt-2">
            <p className="font-semibold text-foreground/70">
              Allergenkennzeichnung (EU-VO 1169/2011):{" "}
              {Object.entries(ALLERGENS).map(([code, info]) => (
                <span key={code} className="mr-1.5">
                  <span className="font-bold text-orange-600">{code}</span>={info.nameDE}
                </span>
              ))}
            </p>
            <p className="text-muted-foreground/60 mt-1">
              Gedruckt: {new Date().toLocaleDateString("de-AT")} | KW {selectedKW}/{currentYear} | Rotationswoche W{weekNr}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

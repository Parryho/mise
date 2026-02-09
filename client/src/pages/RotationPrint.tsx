import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { MEAL_SLOTS, MEAL_SLOT_LABELS, getISOWeek, getWeekDateRange, formatLocalDate, type MealSlotName } from "@shared/constants";
import { ALLERGENS } from "@shared/allergens";
import { cn } from "@/lib/utils";
import RecipeDetailDialog from "@/components/RecipeDetailDialog";
import type { Recipe } from "@/lib/store";

interface MenuPlanEntry {
  id: number;
  date: string;
  meal: string;
  course: string;
  recipeId: number | null;
  portions: number;
  notes: string | null;
  locationId: number | null;
  rotationWeekNr: number | null;
}

interface Location {
  id: number;
  slug: string;
  name: string;
}

const DAY_LABELS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

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
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<MenuPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rotationWeekNr, setRotationWeekNr] = useState(0);
  const [wpFrom, setWpFrom] = useState("");

  // Block visibility — persisted in localStorage
  const [showBlocks, setShowBlocks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("mise-blocks-print");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { "city-lunch": true, "city-dinner": true, "sued-lunch": true, "sued-dinner": true };
  });
  useEffect(() => {
    localStorage.setItem("mise-blocks-print", JSON.stringify(showBlocks));
  }, [showBlocks]);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Initial load: locations + recipes
  useEffect(() => {
    Promise.all([
      fetch("/api/recipes").then(r => r.json()),
      fetch("/api/locations").then(r => r.json()),
    ]).then(([recs, locs]) => {
      setRecipes(recs);
      setLocations(locs);
    });
  }, []);

  // Fetch week plan whenever year/week changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu-plans/week?year=${year}&week=${week}`)
      .then(r => r.json())
      .then(data => {
        setPlans(data.plans || []);
        setRotationWeekNr(data.rotationWeekNr || 0);
        setWpFrom(data.from || "");
      })
      .catch(err => console.error("Failed to load week plan:", err))
      .finally(() => setLoading(false));
  }, [year, week]);

  // Lookup maps
  const recipeMap = useMemo(() => {
    const m = new Map<number, Recipe>();
    for (const r of recipes) m.set(r.id, r);
    return m;
  }, [recipes]);

  const locIdToSlug = useMemo(() => {
    const m = new Map<number, string>();
    for (const loc of locations) m.set(loc.id, loc.slug);
    return m;
  }, [locations]);

  // Get dates for this week (Mon-Sun)
  const weekDates = useMemo(() => {
    if (!wpFrom) return [];
    const dates: string[] = [];
    const start = new Date(wpFrom + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(formatLocalDate(d));
    }
    return dates;
  }, [wpFrom]);

  // Find a plan entry for given date + meal + locSlug + course
  const getPlan = (date: string, meal: string, locSlug: string, course: string): MenuPlanEntry | undefined => {
    return plans.find(p => {
      const pLocSlug = p.locationId ? locIdToSlug.get(p.locationId) : null;
      return p.date === date && p.meal === meal && pLocSlug === locSlug && p.course === course;
    });
  };

  const handleRecipeClick = (recipeId: number) => {
    const recipe = recipeMap.get(recipeId);
    if (recipe) {
      setSelectedRecipe(recipe);
      setDialogOpen(true);
    }
  };

  // Navigation helpers
  const goToCurrentWeek = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setWeek(getISOWeek(d));
  };

  const prevWeek = () => {
    if (week <= 1) { setYear(y => y - 1); setWeek(52); }
    else setWeek(w => w - 1);
  };

  const nextWeek = () => {
    if (week >= 52) { setYear(y => y + 1); setWeek(1); }
    else setWeek(w => w + 1);
  };

  // Visible blocks
  const visibleBlocks = ALL_BLOCKS.filter(b => showBlocks[b.key]);
  const numBlocks = visibleBlocks.length;

  // Dynamic column widths (percentages)
  const colWidthPercent = numBlocks > 0 ? Math.floor(99 / numBlocks) : 25;
  const dayCol = Math.floor(colWidthPercent * 0.14);
  const typeCol = Math.floor(colWidthPercent * 0.19);
  const nameCol = Math.floor(colWidthPercent * 0.46);
  const allergenCol = Math.floor(colWidthPercent * 0.12);
  const tempCol = Math.floor(colWidthPercent * 0.12);
  const spacerWidth = 0.5;

  // Format date short: "10.02."
  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}.${d.getMonth() + 1}.`;
  };

  return (
    <div className="pb-24 print:pb-0 print:m-0 print:p-0">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href="/rotation">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide">Wochenplan Druck</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={goToCurrentWeek}
            >
              Heute
            </Button>

            <div className="flex items-center bg-primary-foreground/10 rounded-lg">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs opacity-70">Jahr</span>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value) || year)}
                  className="w-16 bg-primary-foreground/20 text-primary-foreground rounded px-2 py-1 text-sm text-center font-bold border-0 outline-none"
                />
                <span className="text-xs opacity-70">KW</span>
                <input
                  type="number"
                  value={week}
                  min={1}
                  max={53}
                  onChange={e => setWeek(parseInt(e.target.value) || week)}
                  className="w-12 bg-primary-foreground/20 text-primary-foreground rounded px-2 py-1 text-sm text-center font-bold border-0 outline-none"
                />
              </div>
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 gap-1"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Drucken
            </Button>
          </div>
        </div>

        {/* Block visibility toggles */}
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

      {loading ? (
        <div className="flex items-center justify-center h-64 print:hidden">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : numBlocks === 0 ? (
        <div className="text-center py-8 text-muted-foreground print:hidden">
          Bitte mindestens einen Block auswählen.
        </div>
      ) : (
        <div className="rotation-print-page p-4 print:p-0" style={{ fontSize: "7pt" }}>
          {/* Print-only header */}
          <div className="hidden print:flex print:items-center print:justify-between print:mb-1">
            <span className="font-heading text-[10pt] font-bold uppercase tracking-wide">
              Wochenplan KW {week} / {year}
            </span>
            {rotationWeekNr > 0 && (
              <span className="text-[8pt] text-muted-foreground">Rotationswoche W{rotationWeekNr}</span>
            )}
          </div>

          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {visibleBlocks.map((_, idx) => (
                <colgroup key={idx}>
                  {idx > 0 && <col style={{ width: `${spacerWidth}%` }} />}
                  <col style={{ width: `${dayCol}%` }} />
                  <col style={{ width: `${typeCol}%` }} />
                  <col style={{ width: `${nameCol}%` }} />
                  <col style={{ width: `${allergenCol}%` }} />
                  <col style={{ width: `${tempCol}%` }} />
                </colgroup>
              ))}
            </colgroup>

            {/* Block headers */}
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
                    KW {week} {block.label}
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
              {weekDates.map((date, dayIdx) => {
                return MEAL_SLOTS.map((course, slotIdx) => {
                  const isMainCourse = course === "main1" || course === "main2";

                  return (
                    <tr
                      key={`${date}-${course}`}
                      className={cn(
                        slotIdx === 0 && "border-t-2 border-foreground/30",
                        isMainCourse ? "bg-amber-50" : slotIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      )}
                    >
                      {visibleBlocks.map((block, blockIdx) => {
                        const plan = getPlan(date, block.meal, block.locSlug, course);
                        const recipe = plan?.recipeId ? recipeMap.get(plan.recipeId) : null;
                        const isDessert = course === "dessert";

                        return (
                          <>
                            {blockIdx > 0 && <td key={`sp-${blockIdx}-${slotIdx}`} className="border-0" />}
                            {/* Day column */}
                            <td
                              key={`d-${block.key}-${course}`}
                              className="px-1 py-0.5 border border-border/50"
                              style={{ lineHeight: "1.2" }}
                            >
                              {slotIdx === 0 && (
                                <span className="font-bold text-foreground">
                                  {DAY_LABELS_SHORT[dayIdx]} <span className="font-normal text-muted-foreground">{formatDateShort(date)}</span>
                                </span>
                              )}
                            </td>
                            {/* Type column */}
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
                            {/* Name column */}
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
                                <button
                                  onClick={() => handleRecipeClick(recipe.id)}
                                  className="text-left hover:text-primary hover:underline truncate cursor-pointer print:no-underline"
                                  title={recipe.name}
                                >
                                  {recipe.name}
                                </button>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                            {/* Allergen column */}
                            <td
                              key={`a-${block.key}-${course}`}
                              className="px-1 py-0.5 border border-border/50 text-center text-orange-600 font-medium"
                              style={{ lineHeight: "1.2", fontSize: "6pt" }}
                            >
                              {isDessert && !recipe
                                ? "A,C,G"
                                : recipe?.allergens && recipe.allergens.length > 0
                                  ? recipe.allergens.join(",")
                                  : ""}
                            </td>
                            {/* Temperature column */}
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
              Gedruckt: {new Date().toLocaleDateString("de-AT")} | KW {week}/{year}
              {rotationWeekNr > 0 && ` | Rotationswoche W${rotationWeekNr}`}
            </p>
          </div>
        </div>
      )}

      {/* Recipe Detail Dialog */}
      {selectedRecipe && (
        <RecipeDetailDialog
          recipe={selectedRecipe}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedRecipe(null);
          }}
          readOnly
        />
      )}
    </div>
  );
}

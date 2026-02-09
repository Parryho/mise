import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { MEAL_SLOTS, MEAL_SLOT_LABELS, type MealSlotName } from "@shared/constants";
import { ALLERGENS } from "@shared/allergens";
import { cn } from "@/lib/utils";
import RecipeDetailDialog from "@/components/RecipeDetailDialog";
import type { Recipe } from "@/lib/store";

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

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
// dayOfWeek in DB: 0=Sun, 1=Mon ... 6=Sat
// UI index: 0=Mon ... 6=Sun
function uiIndexToDbDow(uiIdx: number): number {
  return uiIdx === 6 ? 0 : uiIdx + 1;
}

const COURSE_SHORT: Record<string, string> = {
  soup: "S",
  main1: "H1",
  side1a: "1a",
  side1b: "1b",
  main2: "H2",
  side2a: "2a",
  side2b: "2b",
  dessert: "D",
};

// Column definitions
interface ColDef {
  locationSlug: string;
  meal: string;
  label: string;
}

const COLUMNS: ColDef[] = [
  { locationSlug: "city", meal: "lunch", label: "Mittag (City + SÜD)" },
  { locationSlug: "city", meal: "dinner", label: "Abend" },
];

export default function RotationPrint() {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekCount, setWeekCount] = useState(6);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null); // null = all
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1. Ensure template
        const tmplRes = await fetch("/api/rotation-templates/ensure-default", { method: "POST" });
        const tmpl = await tmplRes.json();
        setWeekCount(tmpl.weekCount || 6);

        // 2. Load all slots + recipes in parallel
        const [slotsRes, recipesRes] = await Promise.all([
          fetch(`/api/rotation-slots/${tmpl.id}`),
          fetch("/api/recipes"),
        ]);
        const allSlots = await slotsRes.json();
        const allRecipes = await recipesRes.json();
        setSlots(allSlots);
        setRecipes(allRecipes);
      } catch (err) {
        console.error("Failed to load rotation data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Recipe lookup map
  const recipeMap = useMemo(() => {
    const m = new Map<number, Recipe>();
    for (const r of recipes) m.set(r.id, r);
    return m;
  }, [recipes]);

  // Get slot for a specific position
  const getSlot = (weekNr: number, dayUiIdx: number, meal: string, locationSlug: string, course: string): RotationSlot | undefined => {
    const dbDow = uiIndexToDbDow(dayUiIdx);
    return slots.find(
      s => s.weekNr === weekNr && s.dayOfWeek === dbDow && s.meal === meal && s.locationSlug === locationSlug && s.course === course
    );
  };

  const handleRecipeClick = (recipeId: number) => {
    const recipe = recipeMap.get(recipeId);
    if (recipe) {
      setSelectedRecipe(recipe);
      setDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weeksToShow = selectedWeek ? [selectedWeek] : Array.from({ length: weekCount }, (_, i) => i + 1);

  return (
    <div className="pb-24 print:pb-0">
      {/* Print-only title */}
      <div className="hidden print:block text-center font-heading text-sm font-bold uppercase tracking-wide mb-1">
        Rotationsplan — 6-Wochen-Übersicht
      </div>

      {/* Header (hidden when printing) */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/rotation">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide">Rotations-Übersicht</h1>
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

      {/* Week tabs (hidden when printing) */}
      <div className="flex gap-1.5 px-4 py-3 print:hidden overflow-x-auto border-b border-border/50">
        <button
          onClick={() => setSelectedWeek(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap press",
            selectedWeek === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Alle
        </button>
        {Array.from({ length: weekCount }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap press",
              selectedWeek === w
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            W{w}
          </button>
        ))}
      </div>

      {/* Tables — one per week */}
      {weeksToShow.map(weekNr => (
        <div key={weekNr} className="rotation-print-page px-2 mb-8 print:px-0 print:mb-0">
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide px-2 pb-2 pt-2 text-foreground">
            Woche {weekNr}
          </h2>

          <div className="overflow-x-auto rounded-lg border border-border/60 print:overflow-visible print:rounded-none">
            <table className="w-full border-collapse text-[11px] leading-tight print:text-[9px] print:leading-[1.15]">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border-r border-white/20 px-2 py-1.5 text-left w-10 font-bold text-[10px] uppercase tracking-wider">Tag</th>
                  {COLUMNS.map(col => (
                    <th key={`${col.locationSlug}-${col.meal}`} className="border-r border-white/20 last:border-r-0 px-2 py-1.5 text-left font-bold text-[10px] uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_LABELS.map((dayLabel, dayIdx) => (
                  <tr key={dayLabel} className={cn("border-b border-border/40 last:border-b-0", dayIdx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                    <td className="border-r border-border/40 px-2 py-1 font-bold align-top bg-muted/40 text-xs">
                      {dayLabel}
                    </td>
                    {COLUMNS.map(col => (
                      <td key={`${col.locationSlug}-${col.meal}`} className="border-r border-border/40 last:border-r-0 px-1.5 py-1 align-top">
                        <div className="space-y-0.5">
                          {MEAL_SLOTS.map(course => {
                            const slot = getSlot(weekNr, dayIdx, col.meal, col.locationSlug, course);
                            const recipe = slot?.recipeId ? recipeMap.get(slot.recipeId) : null;
                            const isDessert = course === "dessert";
                            return (
                              <div key={course} className="flex items-baseline gap-1 min-h-[14px]">
                                <span className="text-[9px] text-muted-foreground font-medium w-6 shrink-0">
                                  {COURSE_SHORT[course]}:
                                </span>
                                {isDessert && !recipe ? (
                                  <span>
                                    <span className="italic">Dessertvariation</span>
                                    <span className="ml-1 text-[9px] text-orange-600 font-medium">A,C,G</span>
                                  </span>
                                ) : recipe ? (
                                  <button
                                    onClick={() => handleRecipeClick(recipe.id)}
                                    className="text-left hover:text-primary hover:underline truncate cursor-pointer print:no-underline"
                                    title={recipe.name}
                                  >
                                    <span className="truncate">{recipe.name}</span>
                                    {recipe.allergens.length > 0 && (
                                      <span className="ml-1 text-[9px] text-orange-600 font-medium">
                                        {recipe.allergens.join(",")}
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Allergen legend */}
          <div className="mt-2 mx-2 px-3 py-2 bg-muted/30 rounded-lg text-[9px] text-muted-foreground print:text-[8px] print:bg-transparent print:px-0">
            <span className="font-semibold text-foreground/70 mr-1">Allergene:</span>
            {Object.entries(ALLERGENS).map(([code, info]) => (
              <span key={code} className="mr-2">
                <span className="font-bold text-orange-600">{code}</span>={info.nameDE}
              </span>
            ))}
          </div>
        </div>
      ))}

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

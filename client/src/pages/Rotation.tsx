import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChefHat, Printer } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getISOWeek, MEAL_SLOT_LABELS, MEAL_SLOTS } from "@shared/constants";

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
// dayOfWeek in DB: 0=Sun, 1=Mon ... 6=Sat
// UI index: 0=Mon ... 6=Sun
function uiIndexToDbDow(uiIdx: number): number {
  return uiIdx === 6 ? 0 : uiIdx + 1;
}

const COURSE_SHORT: Record<string, string> = {
  soup: "Suppe",
  main1: "H1",
  side1a: "B1a",
  side1b: "B1b",
  main2: "H2",
  side2a: "B2a",
  side2b: "B2b",
  dessert: "Dessert",
};

interface ColDef {
  locationSlug: string;
  meal: string;
  label: string;
}

const COLUMNS: ColDef[] = [
  { locationSlug: "city", meal: "lunch", label: "City Mittag" },
  { locationSlug: "city", meal: "dinner", label: "City Abend" },
  { locationSlug: "sued", meal: "lunch", label: "SÜD Mittag" },
];

export default function Rotation() {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState(6);
  const [weekNr, setWeekNr] = useState(1);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [editSlot, setEditSlot] = useState<RotationSlot | null>(null);
  const [editRecipeId, setEditRecipeId] = useState("none");
  const { toast } = useToast();

  const currentRotationWeek = ((getISOWeek(new Date()) - 1) % 6) + 1;

  useEffect(() => {
    Promise.all([
      fetch("/api/rotation-templates/ensure-default", { method: "POST" }).then(r => r.json()),
      fetch("/api/recipes").then(r => r.json()),
    ]).then(([tmpl, recs]) => {
      setTemplateId(tmpl.id);
      setWeekCount(tmpl.weekCount || 6);
      setRecipes(recs);
      setWeekNr(currentRotationWeek);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!templateId) return;
    fetch(`/api/rotation-slots/${templateId}?weekNr=${weekNr}`)
      .then(r => r.json())
      .then(data => setSlots(data))
      .catch(() => {});
  }, [templateId, weekNr]);

  const recipeMap = useMemo(() => {
    const m = new Map<number, Recipe>();
    for (const r of recipes) m.set(r.id, r);
    return m;
  }, [recipes]);

  const getSlot = (dayUiIdx: number, meal: string, locationSlug: string, course: string): RotationSlot | undefined => {
    const dbDow = uiIndexToDbDow(dayUiIdx);
    return slots.find(
      s => s.dayOfWeek === dbDow && s.meal === meal && s.locationSlug === locationSlug && s.course === course
    );
  };

  const handleAutoFill = async (overwrite: boolean) => {
    if (!templateId) return;
    setAutoFilling(true);
    try {
      const res = await fetch("/api/rotation/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, overwrite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: "Küchenchef-Agent fertig",
        description: `${data.filled} Gerichte zugewiesen, ${data.skipped} übersprungen.`,
      });
      const slotsRes = await fetch(`/api/rotation-slots/${templateId}?weekNr=${weekNr}`);
      setSlots(await slotsRes.json());
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setAutoFilling(false);
      setAutoFillOpen(false);
    }
  };

  const handleSlotChange = async (slotId: number, recipeId: number | null) => {
    try {
      await fetch(`/api/rotation-slots/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, recipeId } : s));
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  };

  const openEditDialog = (slot: RotationSlot) => {
    setEditSlot(slot);
    setEditRecipeId(slot.recipeId ? String(slot.recipeId) : "none");
  };

  const handleEditSave = () => {
    if (!editSlot) return;
    handleSlotChange(editSlot.id, editRecipeId === "none" ? null : parseInt(editRecipeId));
    setEditSlot(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weekButtons = Array.from({ length: weekCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col pb-24">
      {/* Orange Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold uppercase tracking-wide">6-Wochen-Rotation</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary-foreground/70">
              KW {getISOWeek(new Date())} = W{currentRotationWeek}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
              onClick={() => setAutoFillOpen(true)}
              disabled={autoFilling}
            >
              {autoFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}
            </Button>
            <Link href="/rotation/print">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                <Printer className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Week Selector Buttons */}
      <div className="flex gap-2 px-4 pt-3 pb-2">
        {weekButtons.map(w => (
          <Button
            key={w}
            variant={weekNr === w ? "default" : "outline"}
            size="sm"
            className="relative flex-1"
            onClick={() => setWeekNr(w)}
          >
            W{w}
            {w === currentRotationWeek && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-status-info border-2 border-background" />
            )}
          </Button>
        ))}
      </div>

      {/* Week Table */}
      <div className="px-2 pt-1">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border border-border/30 px-1.5 py-1 text-left w-8 font-bold">Tag</th>
                {COLUMNS.map(col => (
                  <th key={`${col.locationSlug}-${col.meal}`} className="border border-border/30 px-1.5 py-1 text-left font-bold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_LABELS.map((dayLabel, dayIdx) => (
                <tr key={dayLabel} className={dayIdx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="border border-border/50 px-1.5 py-0.5 font-bold align-top bg-muted/50">
                    {dayLabel}
                  </td>
                  {COLUMNS.map(col => (
                    <td key={`${col.locationSlug}-${col.meal}`} className="border border-border/50 px-1 py-0.5 align-top">
                      <div className="space-y-px">
                        {MEAL_SLOTS.map(course => {
                          const slot = getSlot(dayIdx, col.meal, col.locationSlug, course);
                          const recipe = slot?.recipeId ? recipeMap.get(slot.recipeId) : null;
                          const isDessert = course === "dessert";

                          return (
                            <div key={course} className="flex items-baseline gap-1 min-h-[14px]">
                              <span className="text-[9px] text-muted-foreground font-medium w-10 shrink-0">
                                {COURSE_SHORT[course]}:
                              </span>
                              {isDessert && !recipe ? (
                                <button
                                  onClick={() => slot && openEditDialog(slot)}
                                  className="text-left truncate cursor-pointer hover:text-primary"
                                  title="Dessertvariation (klicken zum Ändern)"
                                >
                                  <span className="italic">Dessertvariation</span>
                                  <span className="ml-1 text-[9px] text-orange-600 font-medium">A,C,G</span>
                                </button>
                              ) : recipe ? (
                                <button
                                  onClick={() => slot && openEditDialog(slot)}
                                  className="text-left hover:text-primary truncate cursor-pointer"
                                  title={`${recipe.name} (klicken zum Ändern)`}
                                >
                                  <span className="truncate">{recipe.name}</span>
                                  {recipe.allergens && recipe.allergens.length > 0 && (
                                    <span className="ml-1 text-[9px] text-orange-600 font-medium">
                                      {recipe.allergens.join(",")}
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => slot && openEditDialog(slot)}
                                  className="text-muted-foreground/40 cursor-pointer hover:text-primary"
                                >
                                  —
                                </button>
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
      </div>

      {/* Slot Edit Dialog */}
      <Dialog open={!!editSlot} onOpenChange={(open) => { if (!open) setEditSlot(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editSlot ? MEAL_SLOT_LABELS[editSlot.course as keyof typeof MEAL_SLOT_LABELS] || editSlot.course : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rezept</Label>
              <Select value={editRecipeId} onValueChange={setEditRecipeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Gericht wählen..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">— leer —</SelectItem>
                  {recipes.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditSave} className="w-full">
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-Fill Confirmation Dialog */}
      <Dialog open={autoFillOpen} onOpenChange={setAutoFillOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" /> Küchenchef-Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Leere Slots automatisch mit passenden Rezepten befüllen?
              Dessert wird immer als "Dessertvariation" angezeigt.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleAutoFill(false)} disabled={autoFilling} className="w-full">
                {autoFilling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Leere Slots befüllen
              </Button>
              <Button variant="outline" onClick={() => handleAutoFill(true)} disabled={autoFilling} className="w-full">
                {autoFilling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Alles neu befüllen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

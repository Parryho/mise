import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ChefHat, Printer, AlertTriangle, Star, Plus, Settings2 } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

interface RotationTemplate {
  id: number;
  name: string;
  weekCount: number;
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
  { locationSlug: "city", meal: "lunch", label: "Mittag (City + SÜD)" },
  { locationSlug: "city", meal: "dinner", label: "Abend" },
];

export default function Rotation() {
  const [templates, setTemplates] = useState<RotationTemplate[]>([]);
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
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateWeeks, setNewTemplateWeeks] = useState("6");
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const { toast } = useToast();

  const currentRotationWeek = ((getISOWeek(new Date()) - 1) % 6) + 1;

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/rotation-templates");
      const data = await res.json();
      setTemplates(data);
      return data as RotationTemplate[];
    } catch {
      return [] as RotationTemplate[];
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/rotation-templates/ensure-default", { method: "POST" }).then(r => r.json()),
      fetch("/api/recipes").then(r => r.json()),
    ]).then(async ([tmpl, recs]) => {
      setTemplateId(tmpl.id);
      setWeekCount(tmpl.weekCount || 6);
      setRecipes(recs);
      setWeekNr(currentRotationWeek);
      await loadTemplates();
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setCreatingTemplate(true);
    try {
      const res = await fetch("/api/rotation-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTemplateName.trim(), weekCount: parseInt(newTemplateWeeks) }),
      });
      if (!res.ok) throw new Error("Fehler beim Erstellen");
      const created = await res.json();
      await loadTemplates();
      setTemplateId(created.id);
      setWeekCount(created.weekCount);
      setWeekNr(1);
      setNewTemplateOpen(false);
      setNewTemplateName("");
      setNewTemplateWeeks("6");
      toast({ title: "Template erstellt", description: `"${created.name}" mit ${created.weekCount} Wochen` });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleSwitchTemplate = (id: string) => {
    const tmpl = templates.find(t => t.id === parseInt(id));
    if (tmpl) {
      setTemplateId(tmpl.id);
      setWeekCount(tmpl.weekCount);
      setWeekNr(1);
    }
  };

  // allSlots tracks all weeks for per-week completeness badges
  const [allSlots, setAllSlots] = useState<RotationSlot[]>([]);

  useEffect(() => {
    if (!templateId) return;
    // Load current week slots for display
    fetch(`/api/rotation-slots/${templateId}?weekNr=${weekNr}`)
      .then(r => r.json())
      .then(data => setSlots(data))
      .catch(() => {});
  }, [templateId, weekNr]);

  // Load ALL slots for completeness stats per week (once)
  useEffect(() => {
    if (!templateId) return;
    fetch(`/api/rotation-slots/${templateId}`)
      .then(r => r.json())
      .then(data => setAllSlots(data))
      .catch(() => {});
  }, [templateId]);

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

  // Keep allSlots in sync when current week's slots change
  useEffect(() => {
    if (slots.length > 0) {
      setAllSlots(prev => {
        const otherWeeks = prev.filter(s => s.weekNr !== weekNr);
        return [...otherWeeks, ...slots];
      });
    }
  }, [slots, weekNr]);

  // Completeness stats for current week
  const weekStats = useMemo(() => {
    const total = slots.length;
    const filled = slots.filter(s => s.recipeId !== null || s.course === "dessert").length;
    return { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [slots]);

  // Per-week completeness from allSlots
  const perWeekStats = useMemo(() => {
    const stats = new Map<number, { total: number; filled: number }>();
    for (let w = 1; w <= weekCount; w++) {
      const wSlots = allSlots.filter(s => s.weekNr === w);
      const total = wSlots.length;
      const filled = wSlots.filter(s => s.recipeId !== null || s.course === "dessert").length;
      stats.set(w, { total, filled });
    }
    return stats;
  }, [allSlots, weekCount]);

  // Duplicate detection: same recipe on same day across different meals/locations (excluding dessert)
  const duplicates = useMemo(() => {
    const dupes = new Set<number>(); // slot IDs with duplicates
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dbDow = uiIndexToDbDow(dayIdx);
      const daySlots = slots.filter(s => s.dayOfWeek === dbDow && s.recipeId !== null && s.course !== "dessert");
      const seen = new Map<number, number[]>(); // recipeId -> [slotId, ...]
      for (const s of daySlots) {
        const existing = seen.get(s.recipeId!) || [];
        existing.push(s.id);
        seen.set(s.recipeId!, existing);
      }
      for (const [, ids] of Array.from(seen.entries())) {
        if (ids.length > 1) ids.forEach((id: number) => dupes.add(id));
      }
    }
    return dupes;
  }, [slots]);

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
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-xl font-bold uppercase tracking-wide">{weekCount}-Wochen-Rotation</h1>
          <div className="flex items-center gap-1">
            <Link href={`/rotation/quiz?template=${templateId}&week=${weekNr}`}>
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/20 h-8 w-8" title="Bewerten">
                <Star className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/20 h-8 w-8"
              onClick={() => setAutoFillOpen(true)}
              disabled={autoFilling}
              title="Auto-Fill"
            >
              {autoFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}
            </Button>
            <Link href="/rotation/print">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/20 h-8 w-8" title="Drucken">
                <Printer className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Template Selector */}
        {templates.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="h-3.5 w-3.5 text-primary-foreground/70" />
            <select
              value={templateId ?? ""}
              onChange={(e) => handleSwitchTemplate(e.target.value)}
              className="bg-white/15 text-primary-foreground text-xs rounded px-2 py-1 border border-white/20 flex-1"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id} className="text-foreground bg-background">
                  {t.name} ({t.weekCount}W)
                </option>
              ))}
            </select>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/20 h-7 w-7"
              onClick={() => setNewTemplateOpen(true)}
              title="Neues Template"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {templates.length <= 1 && (
          <div className="flex items-center gap-2 mb-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/20 text-xs h-7 px-2"
              onClick={() => setNewTemplateOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Neues Template
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3 bg-white/15 rounded-lg px-3 py-1.5">
          <span className="text-xs text-primary-foreground/80">
            KW {getISOWeek(new Date())} = W{currentRotationWeek}
          </span>
          <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30 text-[10px] py-0 h-5">
            {weekStats.filled}/{weekStats.total} ({weekStats.pct}%)
          </Badge>
        </div>
      </div>

      {/* Week Selector Buttons */}
      <div className="flex gap-1.5 px-4 py-3 border-b border-border/50">
        {weekButtons.map(w => {
          const ws = perWeekStats.get(w);
          const isFull = ws && ws.total > 0 && ws.filled === ws.total;
          const isEmpty = !ws || ws.total === 0 || ws.filled === 0;
          const isSelected = weekNr === w;
          const pct = ws && ws.total > 0 ? Math.round((ws.filled / ws.total) * 100) : 0;
          return (
            <button
              key={w}
              onClick={() => setWeekNr(w)}
              className={cn(
                "relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-bold transition-all press",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>W{w}</span>
              <span className={cn("text-[10px] font-normal", isSelected ? "text-primary-foreground/80" : "text-muted-foreground/60")}>
                {pct}%
              </span>
              {w === currentRotationWeek && (
                <span className="absolute -top-0.5 right-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-status-info border-2 border-background" />
              )}
              {ws && ws.total > 0 && (
                <span className={cn(
                  "absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                  isFull ? "bg-green-500" : isEmpty ? "bg-red-400" : "bg-amber-400"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Week Table */}
      <div className="px-2 pt-2">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border-r border-white/20 px-2 py-1.5 text-left w-8 font-bold text-[10px] uppercase tracking-wider">Tag</th>
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
                          const slot = getSlot(dayIdx, col.meal, col.locationSlug, course);
                          const recipe = slot?.recipeId ? recipeMap.get(slot.recipeId) : null;
                          const isDessert = course === "dessert";
                          const isDuplicate = slot && duplicates.has(slot.id);
                          const isEmpty = !recipe && !isDessert;

                          return (
                            <div key={course} className={cn(
                              "flex items-baseline gap-1 min-h-[16px] rounded-sm px-0.5",
                              isEmpty && "bg-status-warning-subtle/50"
                            )}>
                              <span className="text-[9px] text-muted-foreground/70 font-medium w-10 shrink-0">
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
                                  className={`text-left hover:text-primary truncate cursor-pointer ${isDuplicate ? "text-red-600" : ""}`}
                                  title={isDuplicate ? `⚠ Doppelt: ${recipe.name}` : `${recipe.name} (klicken zum Ändern)`}
                                >
                                  {isDuplicate && <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5 text-red-500" />}
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
                                  className="text-amber-400 cursor-pointer hover:text-primary"
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

      {/* SÜD=City hint */}
      <div className="mx-4 mt-3 px-3 py-2 bg-status-info-subtle border border-status-info/20 rounded-lg text-xs text-status-info">
        SÜD Mittag übernimmt automatisch das City Mittag-Menü.
      </div>

      {/* Duplicate warning */}
      {duplicates.size > 0 && (
        <div className="mx-4 mt-3 px-3 py-2.5 bg-status-danger-subtle border border-status-danger/20 rounded-lg flex items-center gap-2 text-xs text-status-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{duplicates.size / 2} doppelte Gerichte am selben Tag gefunden</span>
        </div>
      )}

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

      {/* New Template Dialog */}
      <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Neues Rotations-Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="z.B. Winterrotation 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Anzahl Wochen</Label>
              <Select value={newTemplateWeeks} onValueChange={setNewTemplateWeeks}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Wochen</SelectItem>
                  <SelectItem value="5">5 Wochen</SelectItem>
                  <SelectItem value="6">6 Wochen</SelectItem>
                  <SelectItem value="8">8 Wochen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTemplate} disabled={creatingTemplate || !newTemplateName.trim()} className="w-full">
              {creatingTemplate ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Template erstellen
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

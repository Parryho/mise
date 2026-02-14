import { useState, useEffect, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ChefHat, Printer, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getISOWeek, getWeekDateRange, formatLocalDate, MEAL_SLOTS, MEAL_SLOT_LABELS, type MealSlotName } from "@shared/constants";
import { ALLERGENS } from "@shared/allergens";
import { apiFetch, apiPost, apiPut } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

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

const DAY_KEYS = ["mo", "di", "mi", "do", "fr", "sa", "so"] as const;

function uiIndexToDbDow(uiIdx: number): number {
  return uiIdx === 6 ? 0 : uiIdx + 1;
}

const COURSE_CATEGORIES: Record<string, string[]> = {
  soup: ["ClearSoups", "CreamSoups"],
  main1: ["MainMeat", "MainFish"],
  side1a: ["Sides", "Salads"],
  side1b: ["Sides", "Salads"],
  main2: ["MainVegan"],
  side2a: ["Sides", "Salads"],
  side2b: ["Sides", "Salads"],
  dessert: ["HotDesserts", "ColdDesserts"],
};

const BLOCK_DEFS = [
  { key: "city-lunch", locSlug: "city", meal: "lunch", i18nKey: "cityLunch" },
  { key: "city-dinner", locSlug: "city", meal: "dinner", i18nKey: "cityDinner" },
  { key: "sued-lunch", locSlug: "sued", meal: "lunch", i18nKey: "suedLunch" },
  { key: "sued-dinner", locSlug: "sued", meal: "dinner", i18nKey: "suedDinner" },
] as const;

export default function Planung() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [templateId, setTemplateId] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState(6);
  const [weekNr, setWeekNr] = useState(1);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [allSlots, setAllSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<RotationSlot | null>(null);
  const [editRecipeId, setEditRecipeId] = useState("none");
  const [recipeSearch, setRecipeSearch] = useState("");

  // Block toggles (persisted)
  const allBlocks = BLOCK_DEFS.map(b => ({ ...b, label: t(`rotation.${b.i18nKey}`) }));
  const [showBlocks, setShowBlocks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("mise-blocks-planung");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { "city-lunch": true, "city-dinner": true, "sued-lunch": false, "sued-dinner": false };
  });
  useEffect(() => {
    localStorage.setItem("mise-blocks-planung", JSON.stringify(showBlocks));
  }, [showBlocks]);

  const currentKW = getISOWeek(new Date());
  const currentYear = new Date().getFullYear();
  const currentRotWeek = ((currentKW - 1) % weekCount) + 1;

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
  }, [weekNr, currentKW, currentYear, currentRotWeek, weekCount]);

  // Load initial data
  useEffect(() => {
    Promise.all([
      apiPost<RotationTemplate>("/api/rotation-templates/ensure-default", {}),
      apiFetch<Recipe[]>("/api/recipes"),
    ]).then(([tmpl, recs]) => {
      setTemplateId(tmpl.id);
      setWeekCount(tmpl.weekCount || 6);
      setRecipes(recs);
      setWeekNr(((currentKW - 1) % (tmpl.weekCount || 6)) + 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Load slots for current week
  useEffect(() => {
    if (!templateId) return;
    apiFetch<RotationSlot[]>(`/api/rotation-slots/${templateId}?weekNr=${weekNr}`)
      .then(data => setSlots(data))
      .catch(() => {});
  }, [templateId, weekNr]);

  // Load all slots for stats
  useEffect(() => {
    if (!templateId) return;
    apiFetch<RotationSlot[]>(`/api/rotation-slots/${templateId}`)
      .then(data => setAllSlots(data))
      .catch(() => {});
  }, [templateId]);

  // Sync current week into allSlots
  useEffect(() => {
    if (slots.length > 0) {
      setAllSlots(prev => {
        const otherWeeks = prev.filter(s => s.weekNr !== weekNr);
        return [...otherWeeks, ...slots];
      });
    }
  }, [slots, weekNr]);

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

  const duplicates = useMemo(() => {
    const dupes = new Set<number>();
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dbDow = uiIndexToDbDow(dayIdx);
      const daySlots = slots.filter(s => s.dayOfWeek === dbDow && s.recipeId !== null && s.course !== "dessert");
      const seen = new Map<number, number[]>();
      for (const s of daySlots) {
        const existing = seen.get(s.recipeId!) || [];
        existing.push(s.id);
        seen.set(s.recipeId!, existing);
      }
      for (const ids of Array.from(seen.values())) {
        if (ids.length > 1) ids.forEach(id => dupes.add(id));
      }
    }
    return dupes;
  }, [slots]);

  // Auto-fill
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
        title: t("rotation.chefAgentDone"),
        description: t("rotation.chefAgentDesc", { filled: data.filled, skipped: data.skipped }),
      });
      setSlots(await apiFetch(`/api/rotation-slots/${templateId}?weekNr=${weekNr}`));
      setAllSlots(await apiFetch(`/api/rotation-slots/${templateId}`));
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setAutoFilling(false);
      setAutoFillOpen(false);
    }
  };

  // Slot edit
  const handleSlotChange = async (slotId: number, recipeId: number | null) => {
    try {
      await apiPut(`/api/rotation-slots/${slotId}`, { recipeId });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, recipeId } : s));
    } catch {
      toast({ title: t("rotation.errorSaving"), variant: "destructive" });
    }
  };

  const openEditDialog = (slot: RotationSlot) => {
    setEditSlot(slot);
    setEditRecipeId(slot.recipeId ? String(slot.recipeId) : "none");
    setRecipeSearch("");
  };

  const filteredRecipes = useMemo(() => {
    let pool = recipes;
    if (editSlot) {
      const cats = COURSE_CATEGORIES[editSlot.course];
      if (cats) pool = pool.filter(r => cats.includes(r.category));
    }
    if (!recipeSearch.trim()) return pool;
    const q = recipeSearch.trim().toLowerCase();
    return pool.filter(r => r.name.toLowerCase().includes(q));
  }, [recipes, recipeSearch, editSlot]);

  const handleEditSave = () => {
    if (!editSlot) return;
    handleSlotChange(editSlot.id, editRecipeId === "none" ? null : parseInt(editRecipeId));
    setEditSlot(null);
  };

  const visibleBlocks = allBlocks.filter(b => showBlocks[b.key]);
  const selectedKW = kwForWeek(weekNr);
  const numBlocks = visibleBlocks.length;

  // Column widths
  const colWidthPercent = numBlocks > 0 ? Math.floor(99 / numBlocks) : 25;
  const dayCol = Math.floor(colWidthPercent * 0.14);
  const typeCol = Math.floor(colWidthPercent * 0.18);
  const nameCol = Math.floor(colWidthPercent * 0.47);
  const allergenCol = Math.floor(colWidthPercent * 0.11);
  const tempCol = Math.floor(colWidthPercent * 0.10);
  const spacerWidth = 0.5;

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}.${d.getMonth() + 1}.`;
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
    <div className="theme-petrol flex flex-col pb-24 print:pb-0 print:m-0 print:p-0">
      {/* ════════════════════════════════════════════ */}
      {/* HEADER — petrol themed, hidden on print     */}
      {/* ════════════════════════════════════════════ */}
      <div className="print:hidden bg-primary text-primary-foreground px-4 pt-4 pb-3">
        {/* Title + actions */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide">
              {t("rotation.planning")}
            </h1>
            <p className="text-[10px] text-primary-foreground/60 mt-0.5">
              {t("rotation.currentRotationWeek", { kw: currentKW, rotWeek: currentRotWeek })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs font-semibold h-8"
              onClick={() => setAutoFillOpen(true)}
              disabled={autoFilling}
            >
              {autoFilling
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ChefHat className="h-3.5 w-3.5" />}
              {t("rotation.generateMenu")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs font-semibold h-8"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" /> {t("common.print")}
            </Button>
          </div>
        </div>

        {/* KW navigation with W1-W6 */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 shrink-0"
            onClick={() => setWeekNr(w => w <= 1 ? weekCount : w - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-1.5 flex-1">
            {weekButtons.map(w => {
              const kw = kwForWeek(w);
              const ws = perWeekStats.get(w);
              const isFull = ws && ws.total > 0 && ws.filled === ws.total;
              const isEmpty = !ws || ws.total === 0 || ws.filled === 0;
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
                  <span className={cn(
                    "text-[9px] font-normal",
                    isSelected ? "text-primary/60" : "text-primary-foreground/40"
                  )}>
                    KW {kw}
                  </span>
                  {w === currentRotWeek && (
                    <span className="absolute -top-0.5 right-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-accent border-2 border-primary" />
                  )}
                  {ws && ws.total > 0 && (
                    <span className={cn(
                      "absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                      isFull ? "bg-accent" : isEmpty ? "bg-red-400" : "bg-amber-400"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 shrink-0"
            onClick={() => setWeekNr(w => w >= weekCount ? 1 : w + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Block toggles */}
        <div className="flex gap-1.5">
          {allBlocks.map(block => (
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

      {/* ════════════════════════════════════════════ */}
      {/* DATE RANGE BAR (screen only)                */}
      {/* ════════════════════════════════════════════ */}
      <div className="print:hidden flex items-center justify-between px-4 py-1.5 bg-muted/30 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            KW {selectedKW}
          </span>
          <span className="text-[11px] text-muted-foreground/60">
            {weekDates[0] ? formatDateShort(weekDates[0]) : ""} – {weekDates[6] ? formatDateShort(weekDates[6]) : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {duplicates.size > 0 && (
            <Badge variant="outline" className="text-[10px] py-0 h-5 text-destructive border-destructive/30 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t("rotation.duplicateWarning", { count: Math.floor(duplicates.size / 2) })}
            </Badge>
          )}
          {!showBlocks["sued-lunch"] && (
            <span className="text-[10px] text-status-info">
              {t("rotation.suedAutoInfo")}
            </span>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* PRINT HEADER                                */}
      {/* ════════════════════════════════════════════ */}
      <div className="hidden print:flex print:items-center print:justify-between print:mb-1 print:px-1">
        <span className="font-heading text-[10pt] font-bold uppercase tracking-wide">
          {t("print.weekPlanKw", { kw: selectedKW, year: currentYear })}
        </span>
        <span className="text-[8pt] text-muted-foreground">
          {t("print.rotationWeekLabel", { nr: weekNr })}
        </span>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* TABLE                                       */}
      {/* ════════════════════════════════════════════ */}
      {numBlocks === 0 ? (
        <div className="text-center py-12 text-muted-foreground print:hidden">
          {t("print.selectBlock")}
        </div>
      ) : (
        <div className="rotation-print-page px-2 pt-2 print:p-0" style={{ fontSize: "7pt" }}>
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {visibleBlocks.map((_, idx) => (
                <Fragment key={`cg-${idx}`}>
                  {idx > 0 && <col style={{ width: `${spacerWidth}%` }} />}
                  <col style={{ width: `${dayCol}%` }} />
                  <col style={{ width: `${typeCol}%` }} />
                  <col style={{ width: `${nameCol}%` }} />
                  <col style={{ width: `${allergenCol}%` }} />
                  <col style={{ width: `${tempCol}%` }} />
                </Fragment>
              ))}
            </colgroup>

            <thead>
              {/* Block header row */}
              <tr>
                {visibleBlocks.map((block, idx) => (
                  <th
                    key={block.key}
                    colSpan={5 + (idx > 0 ? 1 : 0)}
                    className="text-white px-2 py-1.5 text-center font-bold border border-border/30 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.85)]"
                  >
                    <span className="print:hidden">KW {selectedKW} — </span>
                    {block.label}
                    {block.locSlug === "sued" && block.meal === "lunch" && (
                      <span className="block font-normal normal-case tracking-normal text-[8px] text-white/60">
                        = City Mittag
                      </span>
                    )}
                  </th>
                ))}
              </tr>
              {/* Sub-header row */}
              <tr className="bg-muted">
                {visibleBlocks.map((_, idx) => (
                  <Fragment key={`sh-${idx}`}>
                    {idx > 0 && <td className="border-0" />}
                    <th className="px-1 py-0.5 border border-border text-left font-bold text-foreground/70" style={{ fontSize: "inherit" }} />
                    <th className="px-1 py-0.5 border border-border text-left font-bold text-foreground/70" style={{ fontSize: "inherit" }}>
                      Gang
                    </th>
                    <th className="px-1 py-0.5 border border-border text-left font-bold text-foreground/70" style={{ fontSize: "inherit" }}>
                      Gericht
                    </th>
                    <th className="px-1 py-0.5 border border-border text-center font-bold text-foreground/70" style={{ fontSize: "inherit" }}>
                      All.
                    </th>
                    <th className="px-1 py-0.5 border border-border text-center font-bold text-foreground/70" style={{ fontSize: "inherit" }}>
                      °C
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {DAY_KEYS.map((dayKey, dayIdx) => {
                const dateStr = weekDates[dayIdx] || "";
                return MEAL_SLOTS.map((course, slotIdx) => {
                  const isMainCourse = course === "main1" || course === "main2";
                  return (
                    <tr
                      key={`${dayIdx}-${course}`}
                      className={cn(
                        slotIdx === 0 && "border-t-2 border-foreground/30",
                        isMainCourse
                          ? "bg-amber-50/70 dark:bg-amber-950/30"
                          : slotIdx % 2 === 0
                            ? "bg-background"
                            : "bg-muted/20"
                      )}
                    >
                      {visibleBlocks.map((block, blockIdx) => {
                        const isMirror = block.locSlug === "sued" && block.meal === "lunch";
                        const effectiveLocSlug = isMirror ? "city" : block.locSlug;
                        const slot = getSlot(dayIdx, block.meal, effectiveLocSlug, course);
                        const recipe = slot?.recipeId ? recipeMap.get(slot.recipeId) : null;
                        const isDessert = course === "dessert";
                        const isDuplicate = !isMirror && slot && duplicates.has(slot.id);
                        const allergenText = isDessert && !recipe
                          ? "A,C,G"
                          : recipe?.allergens?.length
                            ? recipe.allergens.join(",")
                            : "";

                        return (
                          <Fragment key={`${block.key}-${dayIdx}-${course}`}>
                            {blockIdx > 0 && <td className="border-0" />}
                            {/* Day */}
                            <td
                              className="px-1 py-0.5 border border-border/50"
                              style={{ lineHeight: "1.2" }}
                            >
                              {slotIdx === 0 && (
                                <span className="font-bold text-foreground">
                                  {t(`weekdays.${dayKey}`)}{" "}
                                  <span className="font-normal text-muted-foreground">
                                    {dateStr ? formatDateShort(dateStr) : ""}
                                  </span>
                                </span>
                              )}
                            </td>
                            {/* Course type */}
                            <td
                              className={cn(
                                "px-1 py-0.5 border border-border/50",
                                isMainCourse
                                  ? "font-bold text-foreground"
                                  : "font-semibold text-muted-foreground"
                              )}
                              style={{ lineHeight: "1.2" }}
                            >
                              {t(`courses.${course}`)}
                            </td>
                            {/* Recipe name — clickable for editing */}
                            <td
                              className={cn(
                                "px-1 py-0.5 border border-border/50 overflow-hidden whitespace-nowrap text-ellipsis",
                                isMainCourse
                                  ? "font-semibold text-foreground"
                                  : "text-foreground/80"
                              )}
                              style={{ lineHeight: "1.2", maxWidth: 0 }}
                            >
                              {isDessert && !recipe ? (
                                <button
                                  onClick={() => !isMirror && slot && openEditDialog(slot)}
                                  className={cn(
                                    "text-left w-full truncate block",
                                    isMirror
                                      ? "cursor-default"
                                      : "cursor-pointer hover:text-primary print:cursor-default"
                                  )}
                                >
                                  <span className="italic text-muted-foreground">
                                    {t("rotation.dessertVariation")}
                                  </span>
                                </button>
                              ) : recipe ? (
                                <button
                                  onClick={() => !isMirror && slot && openEditDialog(slot)}
                                  className={cn(
                                    "text-left w-full truncate block",
                                    isMirror
                                      ? "cursor-default"
                                      : "cursor-pointer hover:text-primary print:cursor-default",
                                    isDuplicate && "text-red-600"
                                  )}
                                  title={recipe.name}
                                >
                                  {isDuplicate && (
                                    <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5 text-red-500" />
                                  )}
                                  {recipe.name}
                                </button>
                              ) : (
                                <button
                                  onClick={() => !isMirror && slot && openEditDialog(slot)}
                                  className={cn(
                                    "w-full text-left block",
                                    isMirror
                                      ? "text-muted-foreground/30 cursor-default"
                                      : "text-muted-foreground/40 cursor-pointer hover:text-primary print:cursor-default"
                                  )}
                                >
                                  —
                                </button>
                              )}
                            </td>
                            {/* Allergens */}
                            <td
                              className="px-1 py-0.5 border border-border/50 text-center text-orange-600 dark:text-orange-400 font-medium"
                              style={{ lineHeight: "1.2", fontSize: "6pt" }}
                            >
                              {allergenText}
                            </td>
                            {/* Temperature */}
                            <td
                              className="px-1 py-0.5 border border-border/50 text-center text-muted-foreground/30"
                              style={{ lineHeight: "1.2" }}
                            >
                              __
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          {/* Allergen legend */}
          <div className="mt-3 pt-2 border-t-2 border-border text-[9px] text-muted-foreground print:text-[6pt] print:mt-1 print:pt-1 print:border-t">
            <p className="font-semibold text-foreground/70">
              {t("print.allergenDisclaimer")}{" "}
              {Object.entries(ALLERGENS).map(([code, info]) => (
                <span key={code} className="mr-1.5">
                  <span className="font-bold text-orange-600 dark:text-orange-400">{code}</span>
                  ={info.nameDE}
                </span>
              ))}
            </p>
            <p className="text-muted-foreground/60 mt-1">
              {t("print.printedAt", {
                date: new Date().toLocaleDateString("de-AT"),
                kw: selectedKW,
                year: currentYear,
                nr: weekNr,
              })}
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* EDIT DIALOG                                 */}
      {/* ════════════════════════════════════════════ */}
      <Dialog open={!!editSlot} onOpenChange={open => { if (!open) setEditSlot(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editSlot
                ? `${MEAL_SLOT_LABELS[editSlot.course as MealSlotName] || editSlot.course} — ${t(`weekdays.${DAY_KEYS[editSlot.dayOfWeek === 0 ? 6 : editSlot.dayOfWeek - 1]}`)}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder={t("rotation.searchRecipePlaceholder")}
              value={recipeSearch}
              onChange={e => setRecipeSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto rounded-md border border-border">
              <button
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm border-b border-border/50 transition-colors",
                  editRecipeId === "none"
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
                onClick={() => setEditRecipeId("none")}
              >
                {t("rotation.empty")}
              </button>
              {filteredRecipes.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm border-b border-border/30 last:border-b-0 transition-colors",
                    editRecipeId === String(r.id)
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    setEditRecipeId(String(r.id));
                    setRecipeSearch("");
                  }}
                >
                  {r.name}
                  {r.allergens && r.allergens.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-orange-600">
                      {r.allergens.join(",")}
                    </span>
                  )}
                </button>
              ))}
              {filteredRecipes.length === 0 && recipeSearch && (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  {t("rotation.noRecipeFound")}
                </p>
              )}
            </div>
            <Button onClick={handleEditSave} className="w-full">
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════ */}
      {/* AUTO-FILL DIALOG                            */}
      {/* ════════════════════════════════════════════ */}
      <Dialog open={autoFillOpen} onOpenChange={setAutoFillOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" /> {t("rotation.chefAgent")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t("rotation.autoFillQuestion")}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleAutoFill(false)}
                disabled={autoFilling}
                className="w-full"
              >
                {autoFilling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("rotation.autoFillEmpty")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAutoFill(true)}
                disabled={autoFilling}
                className="w-full"
              >
                {autoFilling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("rotation.autoFillAll")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

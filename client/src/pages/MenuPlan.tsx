import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, Trash2, ShoppingCart, CalendarDays, Users, GripVertical, BookOpen, X, Search, Check, ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getISOWeek, MEAL_SLOT_LABELS, formatLocalDate, type MealSlotName } from "@shared/constants";
import { RECIPE_CATEGORIES } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import AllergenConflictBanner from "@/components/AllergenConflictBanner";
import { useLocationFilter } from "@/lib/location-context";
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

interface MenuPlanEntry {
  id: number;
  date: string;
  meal: string;
  course: string;
  recipeId: number | null;
  portions: number;
  notes: string | null;
}

interface GuestCount {
  id: number;
  date: string;
  meal: string;
  adults: number;
  children: number;
  notes: string | null;
  locationId: number | null;
}

const MEAL_KEYS = ["lunch", "dinner"] as const;

const COURSE_KEYS: MealSlotName[] = Object.keys(MEAL_SLOT_LABELS) as MealSlotName[];

function getWeekDatesFromRange(from: string): Date[] {
  const monday = new Date(from + "T00:00:00");
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAY_LABEL_KEYS = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"] as const;

function getTodayDayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Mon
}

export default function MenuPlan() {
  const { recipes } = useApp();
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [plans, setPlans] = useState<MenuPlanEntry[]>([]);
  const [rotationWeekNr, setRotationWeekNr] = useState(0);
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getTodayDayIndex());
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([]);
  const { selectedLocationId } = useLocationFilter();
  const { toast } = useToast();

  const weekDates = weekFrom ? getWeekDatesFromRange(weekFrom) : [];
  const isCurrentWeek = year === now.getFullYear() && week === getISOWeek(now);

  const fetchGuestCounts = async (from: string, to: string) => {
    try {
      const locParam = selectedLocationId ? `&locationId=${selectedLocationId}` : "";
      const data = await apiFetch(`/api/guests?start=${from}&end=${to}${locParam}`);
      setGuestCounts(data);
    } catch (error) {
      console.error('Failed to fetch guest counts:', error);
    }
  };

  const fetchWeekPlan = async (y: number, w: number) => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/api/menu-plans/week?year=${y}&week=${w}`);
      setPlans(data.plans || []);
      setRotationWeekNr(data.rotationWeekNr || 0);
      setWeekFrom(data.from || "");
      setWeekTo(data.to || "");
      // Fetch guest counts for this week
      if (data.from && data.to) {
        fetchGuestCounts(data.from, data.to);
      }
    } catch (error) {
      console.error('Failed to fetch week plan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekPlan(year, week);
  }, [year, week, selectedLocationId]);

  const getPax = (date: string, meal: string): { adults: number; children: number; total: number } | null => {
    const count = guestCounts.find(c => c.date === date && c.meal === meal);
    if (!count) return null;
    return { adults: count.adults, children: count.children, total: count.adults + count.children };
  };

  const getWeekPaxSummary = () => {
    let lunchTotal = 0, dinnerTotal = 0;
    for (const c of guestCounts) {
      if (c.meal === "lunch") lunchTotal += c.adults + c.children;
      if (c.meal === "dinner") dinnerTotal += c.adults + c.children;
    }
    return { lunch: lunchTotal, dinner: dinnerTotal, total: lunchTotal + dinnerTotal };
  };

  const getPlan = (date: string, meal: string, course: string) => {
    return plans.find(p => p.date === date && p.meal === meal && p.course === course);
  };

  const getRecipeName = (id: number | null) => {
    if (!id) return null;
    return recipes.find(r => r.id === id)?.name || null;
  };

  const prevWeek = () => {
    if (week <= 1) {
      setYear(y => y - 1);
      setWeek(52);
    } else {
      setWeek(w => w - 1);
    }
  };

  const nextWeek = () => {
    if (week >= 52) {
      setYear(y => y + 1);
      setWeek(1);
    } else {
      setWeek(w => w + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setWeek(getISOWeek(today));
    setSelectedDay(getTodayDayIndex());
  };

  const [recipePanelOpen, setRecipePanelOpen] = useState(false);
  const [draggedRecipe, setDraggedRecipe] = useState<{ id: number; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const recipeId = active.data.current?.recipeId;
    const recipeName = active.data.current?.recipeName;
    if (recipeId) setDraggedRecipe({ id: recipeId, name: recipeName });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event;
    setDraggedRecipe(null);

    if (!over || !draggedRecipe) return;

    const dropData = over.data.current;
    if (!dropData) return;

    const { date: dropDate, meal: dropMeal, course: dropCourse } = dropData as { date: string; meal: string; course: string };
    const existingPlan = getPlan(dropDate, dropMeal, dropCourse);

    try {
      if (existingPlan) {
        await apiPut(`/api/menu-plans/${existingPlan.id}`, { recipeId: draggedRecipe.id, portions: existingPlan.portions, locationId: selectedLocationId });
      } else {
        await apiPost('/api/menu-plans', { date: dropDate, meal: dropMeal, course: dropCourse, recipeId: draggedRecipe.id, portions: 1, locationId: selectedLocationId });
      }
      toast({ title: `${draggedRecipe.name} ${t("menu.assigned")}` });
      fetchWeekPlan(year, week);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const selectedDate = weekDates[selectedDay];
  const selectedDateStr = selectedDate ? formatLocalDate(selectedDate) : "";

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="flex flex-col pb-24">
      {/* Orange Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-xl font-bold uppercase tracking-wide">{t("menu.weekPlan")}</h1>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={prevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-heading font-bold text-lg min-w-[60px] text-center">{t("menu.calendarWeekShort")} {week}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={nextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* PAX summary banner */}
        {guestCounts.length > 0 && (() => {
          const paxSummary = getWeekPaxSummary();
          return (
            <div className="flex items-center gap-3 bg-white/15 rounded-lg px-3 py-1.5 mb-2">
              <Users className="h-3.5 w-3.5 text-primary-foreground/80 shrink-0" />
              <div className="flex items-center gap-3 text-xs text-primary-foreground/90">
                <span>{t("menu.lunchShort")}: <strong className="text-primary-foreground">{paxSummary.lunch}</strong></span>
                <span>{t("menu.dinnerShort")}: <strong className="text-primary-foreground">{paxSummary.dinner}</strong></span>
                <span className="text-primary-foreground/60">{t("menu.weekShort")}: {paxSummary.total}</span>
              </div>
            </div>
          );
        })()}

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {rotationWeekNr > 0 && (
              <Badge className="bg-white/20 text-primary-foreground border-0 text-xs">
                {t("menu.rotationWeek", { nr: rotationWeekNr })}
              </Badge>
            )}
            {weekDates.length >= 7 && (
              <span className="text-xs text-primary-foreground/70">
                {weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} – {weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 text-xs text-primary-foreground hover:bg-white/20 gap-1 px-2", recipePanelOpen && "bg-white/20")}
              onClick={() => setRecipePanelOpen(!recipePanelOpen)}
            >
              <BookOpen className="h-3.5 w-3.5" /> {t("nav.recipes")}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary-foreground hover:bg-white/20 gap-1 px-2" onClick={() => setShowShoppingList(true)}>
              <ShoppingCart className="h-3.5 w-3.5" /> {t("menu.shopping")}
            </Button>
          </div>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-1.5 px-4 py-3 bg-background border-b border-border/50">
        {DAY_LABEL_KEYS.map((dayKey, idx) => {
          const isSelected = selectedDay === idx;
          const isToday = isCurrentWeek && idx === getTodayDayIndex();
          const dateObj = weekDates[idx];
          const dayNum = dateObj ? dateObj.getDate() : "";
          return (
            <button
              key={dayKey}
              onClick={() => setSelectedDay(idx)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-bold transition-all relative press min-h-[48px]",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="text-[10px] font-medium">{t(`menu.days.${dayKey}`)}</span>
              <span className={cn("text-sm", isSelected ? "text-primary-foreground" : "text-foreground")}>{dayNum}</span>
              {isToday && !isSelected && (
                <span className="absolute -top-0.5 right-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Heute button */}
      {!isCurrentWeek && (
        <div className="px-4 pb-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={goToToday}>
            <CalendarDays className="h-3.5 w-3.5" /> {t("menu.today")}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="px-4 space-y-6 pt-2">
          {selectedDateStr && (
            <AllergenConflictBanner date={selectedDateStr} locationId={selectedLocationId ?? undefined} />
          )}
          {MEAL_KEYS.map(mealKey => {
            const pax = getPax(selectedDateStr, mealKey);
            return (
            <div key={mealKey} className="space-y-2.5">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t(`meals.${mealKey}`)}
                </h2>
                {pax && (
                  <Badge variant="outline" className="gap-1 text-xs font-normal">
                    <Users className="h-3 w-3" />
                    {pax.total} PAX
                  </Badge>
                )}
              </div>

              {/* Course cards */}
              <div className="space-y-1.5">
                {COURSE_KEYS.map(courseKey => {
                  const plan = getPlan(selectedDateStr, mealKey, courseKey);
                  const recipeName = plan ? getRecipeName(plan.recipeId) : null;

                  return (
                    <CourseCard
                      key={courseKey}
                      date={selectedDateStr}
                      dayName={t(`menu.days.${DAY_LABEL_KEYS[selectedDay]}`)}
                      dayNum={selectedDate?.getDate() || 0}
                      meal={mealKey}
                      course={courseKey}
                      courseLabel={t(`courses.${courseKey}`)}
                      plan={plan}
                      recipeName={recipeName}
                      recipes={recipes}
                      hasRotation={rotationWeekNr > 0}
                      pax={pax?.total ?? null}
                      locationId={selectedLocationId}
                      onSave={() => fetchWeekPlan(year, week)}
                    />
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}

      <ShoppingListDialog
        open={showShoppingList}
        onOpenChange={setShowShoppingList}
        plans={plans}
        recipes={recipes}
      />

      {/* Recipe Panel (DnD source) */}
      {recipePanelOpen && (
        <RecipePanel recipes={recipes} onClose={() => setRecipePanelOpen(false)} />
      )}

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedRecipe && (
          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium max-w-[200px] truncate opacity-90">
            {draggedRecipe.name}
          </div>
        )}
      </DragOverlay>
    </div>
    </DndContext>
  );
}

function CourseCard({ date, dayName, dayNum, meal, course, courseLabel, plan, recipeName, recipes, hasRotation, pax, locationId, onSave }: {
  date: string;
  dayName: string;
  dayNum: number;
  meal: string;
  course: string;
  courseLabel: string;
  plan: MenuPlanEntry | undefined;
  recipeName: string | null;
  recipes: any[];
  hasRotation: boolean;
  pax: number | null;
  locationId: number | null;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [recipeId, setRecipeId] = useState(plan?.recipeId ? String(plan.recipeId) : "");
  const [portions, setPortions] = useState(String(plan?.portions || 1));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setRecipeId(plan?.recipeId ? String(plan.recipeId) : "");
    setPortions(String(plan?.portions || 1));
  }, [plan]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const recipeVal = recipeId && recipeId !== 'none' ? parseInt(recipeId) : null;
      const portionVal = parseInt(portions) || 1;
      if (plan) {
        await apiPut(`/api/menu-plans/${plan.id}`, { recipeId: recipeVal, portions: portionVal, locationId });
      } else {
        await apiPost('/api/menu-plans', { date, meal, course, recipeId: recipeVal, portions: portionVal, locationId });
      }
      toast({ title: t("common.saved") });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await apiDelete(`/api/menu-plans/${plan.id}`);
      toast({ title: t("common.deleted") });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Status badge logic
  let statusBadge = null;
  if (recipeName && hasRotation) {
    statusBadge = (
      <Badge className="bg-status-success-subtle text-status-success border-0 text-[10px] shrink-0">
        {t("menu.confirmed")}
      </Badge>
    );
  } else if (recipeName) {
    statusBadge = (
      <Badge className="bg-status-info-subtle text-status-info border-0 text-[10px] shrink-0">
        {t("menu.planned")}
      </Badge>
    );
  }

  const isMainCourse = course === "main1" || course === "main2";
  const [comboOpen, setComboOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${date}-${meal}-${course}`,
    data: { date, meal, course },
  });

  const selectedRecipeName = recipeId && recipeId !== "none"
    ? recipes.find((r: any) => String(r.id) === recipeId)?.name
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card
          ref={setNodeRef}
          className={cn(
            "cursor-pointer hover:bg-muted/50 transition-all press border-border/60",
            isOver && "ring-2 ring-primary bg-primary/5",
            isMainCourse && recipeName && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
            !recipeName && "border-dashed border-muted-foreground/20"
          )}
        >
          <CardContent className="flex items-center justify-between px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                {courseLabel}
              </div>
              <div className={cn("text-sm font-medium truncate", !recipeName && "text-muted-foreground/50 italic")}>
                {recipeName || t("menu.tapToAssign")}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {plan && plan.recipeId && pax && pax > 0 && plan.portions !== pax && (
                <Badge variant="outline" className="text-[10px] py-0 h-5 border-amber-300 text-amber-600">
                  {plan.portions}/{pax}
                </Badge>
              )}
              {statusBadge}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{dayName}, {dayNum}. — {courseLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("menu.recipe")}</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  <span className="truncate">{selectedRecipeName || t("menu.selectRecipe")}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command>
                  <CommandInput placeholder={t("menu.searchRecipePlaceholder")} />
                  <CommandList className="max-h-60">
                    <CommandEmpty>{t("recipes.noRecipesFound")}</CommandEmpty>
                    <CommandItem value="__none__" onSelect={() => { setRecipeId("none"); setComboOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", (!recipeId || recipeId === "none") ? "opacity-100" : "opacity-0")} />
                      {t("menu.noRecipe")}
                    </CommandItem>
                    {RECIPE_CATEGORIES.map(cat => {
                      const catRecipes = recipes.filter((r: any) => r.category === cat.id);
                      if (catRecipes.length === 0) return null;
                      return (
                        <CommandGroup key={cat.id} heading={`${cat.symbol} ${cat.label}`}>
                          {catRecipes.map((r: any) => (
                            <CommandItem key={r.id} value={r.name} onSelect={() => { setRecipeId(String(r.id)); setComboOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", recipeId === String(r.id) ? "opacity-100" : "opacity-0")} />
                              {r.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      );
                    })}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>{t("menu.portions")}</Label>
            <div className="flex gap-2">
              <Input type="number" value={portions} onChange={(e) => setPortions(e.target.value)} min="1" className="flex-1" />
              {pax && pax > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs gap-1"
                  onClick={() => setPortions(String(pax))}
                >
                  <Users className="h-3 w-3" />
                  {pax} PAX
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("common.save")}
            </Button>
            {plan && (
              <Button variant="destructive" size="icon" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShoppingListDialog({ open, onOpenChange, plans, recipes }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: MenuPlanEntry[];
  recipes: any[];
}) {
  const [ingredients, setIngredients] = useState<Map<string, { amount: number; unit: string }>>(new Map());
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const generateList = async () => {
    setLoading(true);
    const ingredientMap = new Map<string, { amount: number; unit: string }>();

    try {
      const recipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!)));
      if (recipeIds.length === 0) { setIngredients(ingredientMap); return; }

      const allIngs = await apiFetch<{ recipeId: number; name: string; amount: number; unit: string }[]>(`/api/ingredients/bulk?recipeIds=${recipeIds.join(",")}`);

      for (const plan of plans) {
        if (!plan.recipeId) continue;
        const recipe = recipes.find((r: any) => r.id === plan.recipeId);
        if (!recipe) continue;

        const planIngs = allIngs.filter(i => i.recipeId === plan.recipeId);
        const scaleFactor = plan.portions / recipe.portions;

        for (const ing of planIngs) {
          const key = `${ing.name.toLowerCase()}_${ing.unit}`;
          const scaledAmount = ing.amount * scaleFactor;

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.amount += scaledAmount;
          } else {
            ingredientMap.set(key, { amount: scaledAmount, unit: ing.unit });
          }
        }
      }

      setIngredients(ingredientMap);
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && plans.length > 0) {
      generateList();
    }
  }, [open, plans]);

  const ingredientList = Array.from(ingredients.entries()).map(([key, val]) => {
    const name = key.split('_')[0];
    return { name: name.charAt(0).toUpperCase() + name.slice(1), ...val };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("menu.shoppingList")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ingredientList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("menu.noIngredientsInPlan")}
            </div>
          ) : (
            <ul className="space-y-0">
              {ingredientList.map((ing, idx) => (
                <li key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{ing.name}</span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {Number.isInteger(ing.amount) ? ing.amount : ing.amount.toFixed(1)} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* === Recipe Panel (DnD Source) === */

function RecipePanel({ recipes, onClose }: { recipes: any[]; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const { t } = useTranslation();

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || r.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-background border-t elevation-2 z-50 max-h-[45vh] flex flex-col rounded-t-xl">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{t("menu.dragRecipes")}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search + filter */}
      <div className="px-3 py-2 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="h-8 text-sm pl-8"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={catFilter === "all" ? "default" : "outline"}
            size="sm"
            className="h-6 text-[10px] shrink-0"
            onClick={() => setCatFilter("all")}
          >
            {t("common.all")}
          </Button>
          {RECIPE_CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={catFilter === cat.id ? "default" : "outline"}
              size="sm"
              className="h-6 text-[10px] shrink-0"
              onClick={() => setCatFilter(cat.id)}
            >
              {cat.symbol} {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe list */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {filtered.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">{t("recipes.noRecipesFound")}</div>
        ) : (
          <div className="space-y-1">
            {filtered.map(recipe => (
              <DraggableRecipe key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableRecipe({ recipe }: { recipe: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, recipeName: recipe.name },
  });

  const cat = RECIPE_CATEGORIES.find(c => c.id === recipe.category);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md border bg-background cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs shrink-0">{cat?.symbol || "🍽"}</span>
      <span className="text-sm truncate flex-1">{recipe.name}</span>
    </div>
  );
}

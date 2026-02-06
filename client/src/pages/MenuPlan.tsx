import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, Trash2, ShoppingCart, Download, FileSpreadsheet, FileText, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getISOWeek, MEAL_SLOT_LABELS, type MealSlotName } from "@shared/constants";
import { cn } from "@/lib/utils";

interface MenuPlanEntry {
  id: number;
  date: string;
  meal: string;
  course: string;
  recipeId: number | null;
  portions: number;
  notes: string | null;
}

const MEALS = [
  { key: "lunch", de: "Mittagessen" },
  { key: "dinner", de: "Abendessen" },
];

const COURSES: { key: string; de: string }[] = (Object.keys(MEAL_SLOT_LABELS) as MealSlotName[]).map(k => ({
  key: k,
  de: MEAL_SLOT_LABELS[k],
}));

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

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

const DAY_LABELS = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
const DAY_NAMES_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function getTodayDayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Mon
}

export default function MenuPlan() {
  const { recipes } = useApp();
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
  const { toast } = useToast();

  const weekDates = weekFrom ? getWeekDatesFromRange(weekFrom) : [];
  const isCurrentWeek = year === now.getFullYear() && week === getISOWeek(now);

  const fetchWeekPlan = async (y: number, w: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-plans/week?year=${y}&week=${w}`);
      const data = await res.json();
      setPlans(data.plans || []);
      setRotationWeekNr(data.rotationWeekNr || 0);
      setWeekFrom(data.from || "");
      setWeekTo(data.to || "");
    } catch (error) {
      console.error('Failed to fetch week plan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekPlan(year, week);
  }, [year, week]);

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

  const selectedDate = weekDates[selectedDay];
  const selectedDateStr = selectedDate ? formatDate(selectedDate) : "";

  return (
    <div className="flex flex-col pb-24">
      {/* Orange Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading text-xl font-bold uppercase tracking-wide">Wochenplan</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={prevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-heading font-bold text-lg min-w-[60px] text-center">KW {week}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={nextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {rotationWeekNr > 0 && (
              <Badge className="bg-white/20 text-primary-foreground border-0 text-xs">
                Rotation W{rotationWeekNr}
              </Badge>
            )}
            {weekDates.length >= 7 && (
              <span className="text-xs text-primary-foreground/70">
                {weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} – {weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary-foreground hover:bg-white/20 gap-1" onClick={() => setShowShoppingList(true)}>
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary-foreground hover:bg-white/20 gap-1">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => window.open(`/api/menu-plans/export?start=${weekFrom}&end=${weekTo}&format=pdf`, '_blank')}>
                  <Download className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/api/menu-plans/export?start=${weekFrom}&end=${weekTo}&format=xlsx`, '_blank')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/api/menu-plans/export?start=${weekFrom}&end=${weekTo}&format=docx`, '_blank')}>
                  <FileText className="h-4 w-4 mr-2" /> Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-1.5 px-4 py-3 bg-background">
        {DAY_LABELS.map((label, idx) => {
          const isSelected = selectedDay === idx;
          const isToday = isCurrentWeek && idx === getTodayDayIndex();
          return (
            <button
              key={label}
              onClick={() => setSelectedDay(idx)}
              className={cn(
                "flex-1 py-2 rounded-full text-xs font-bold transition-colors relative",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {label}
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
            <CalendarDays className="h-3.5 w-3.5" /> Heute
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="px-4 space-y-5 pt-1">
          {MEALS.map(meal => (
            <div key={meal.key} className="space-y-2">
              {/* Section header */}
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {DAY_NAMES_LONG[selectedDay]} — {meal.de}
              </h2>

              {/* Course cards */}
              <div className="space-y-2">
                {COURSES.map(course => {
                  const plan = getPlan(selectedDateStr, meal.key, course.key);
                  const recipeName = plan ? getRecipeName(plan.recipeId) : null;

                  return (
                    <CourseCard
                      key={course.key}
                      date={selectedDateStr}
                      dayName={DAY_LABELS[selectedDay]}
                      dayNum={selectedDate?.getDate() || 0}
                      meal={meal.key}
                      course={course.key}
                      courseLabel={course.de}
                      plan={plan}
                      recipeName={recipeName}
                      recipes={recipes}
                      hasRotation={rotationWeekNr > 0}
                      onSave={() => fetchWeekPlan(year, week)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ShoppingListDialog
        open={showShoppingList}
        onOpenChange={setShowShoppingList}
        plans={plans}
        recipes={recipes}
      />
    </div>
  );
}

function CourseCard({ date, dayName, dayNum, meal, course, courseLabel, plan, recipeName, recipes, hasRotation, onSave }: {
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
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [recipeId, setRecipeId] = useState(plan?.recipeId ? String(plan.recipeId) : "");
  const [portions, setPortions] = useState(String(plan?.portions || 1));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setRecipeId(plan?.recipeId ? String(plan.recipeId) : "");
    setPortions(String(plan?.portions || 1));
  }, [plan]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (plan) {
        await fetch(`/api/menu-plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeId: recipeId && recipeId !== 'none' ? parseInt(recipeId) : null,
            portions: parseInt(portions) || 1
          })
        });
      } else {
        await fetch('/api/menu-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            meal,
            course,
            recipeId: recipeId && recipeId !== 'none' ? parseInt(recipeId) : null,
            portions: parseInt(portions) || 1
          })
        });
      }
      toast({ title: "Gespeichert" });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await fetch(`/api/menu-plans/${plan.id}`, { method: 'DELETE' });
      toast({ title: "Gelöscht" });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Status badge logic
  let statusBadge = null;
  if (recipeName && hasRotation) {
    statusBadge = (
      <Badge className="bg-status-success-subtle text-status-success border-0 text-[10px] shrink-0">
        Bestätigt
      </Badge>
    );
  } else if (recipeName) {
    statusBadge = (
      <Badge className="bg-status-info-subtle text-status-info border-0 text-[10px] shrink-0">
        Geplant
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]">
          <CardContent className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {courseLabel}
              </div>
              <div className="text-base font-medium truncate">
                {recipeName || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            {statusBadge}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{dayName}, {dayNum}. — {courseLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rezept</Label>
            <Select value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Rezept wählen..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">Kein Rezept</SelectItem>
                {recipes.map((r: any) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Portionen</Label>
            <Input type="number" value={portions} onChange={(e) => setPortions(e.target.value)} min="1" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern
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

  const generateList = async () => {
    setLoading(true);
    const ingredientMap = new Map<string, { amount: number; unit: string }>();

    try {
      for (const plan of plans) {
        if (!plan.recipeId) continue;

        const recipe = recipes.find((r: any) => r.id === plan.recipeId);
        if (!recipe) continue;

        const res = await fetch(`/api/recipes/${plan.recipeId}/ingredients`);
        const ings = await res.json();

        const scaleFactor = plan.portions / recipe.portions;

        for (const ing of ings) {
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
          <DialogTitle>Einkaufsliste</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ingredientList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Zutaten im Menüplan
            </div>
          ) : (
            <ul className="space-y-2">
              {ingredientList.map((ing, idx) => (
                <li key={idx} className="flex justify-between items-center py-1 border-b">
                  <span>{ing.name}</span>
                  <span className="font-mono text-sm">
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

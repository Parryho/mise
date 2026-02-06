import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, ShoppingCart, Download, FileSpreadsheet, FileText, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getISOWeek, getWeekDateRange, MEAL_SLOT_LABELS, type MealSlotName } from "@shared/constants";

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

// Use the same MEAL_SLOTS from constants for course keys
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

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

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
  const { toast } = useToast();

  const weekDates = weekFrom ? getWeekDatesFromRange(weekFrom) : [];

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
  };

  const isCurrentWeek = year === now.getFullYear() && week === getISOWeek(now);

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Wochenplan</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowShoppingList(true)}>
            <ShoppingCart className="h-4 w-4" /> Liste
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" /> Export
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

      {/* KW Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" className="shrink-0" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-center">
          <span className="font-heading font-bold text-lg">KW {week}</span>
          <span className="text-sm text-muted-foreground">/ {year}</span>
          {rotationWeekNr > 0 && (
            <Badge variant="secondary" className="text-xs">Rotation W{rotationWeekNr}</Badge>
          )}
        </div>
        <Button variant="outline" size="icon" className="shrink-0" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Heute button + date range */}
      <div className="flex items-center justify-between">
        {weekDates.length >= 7 && (
          <span className="text-xs text-muted-foreground">
            {weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} - {weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )}
        {!isCurrentWeek && (
          <Button variant="outline" size="sm" className="gap-1 ml-auto" onClick={goToToday}>
            <CalendarDays className="h-3.5 w-3.5" /> Heute
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {MEALS.map(meal => (
            <MealSection
              key={meal.key}
              meal={meal}
              weekDates={weekDates}
              plans={plans}
              recipes={recipes}
              courses={COURSES}
              getPlan={getPlan}
              getRecipeName={getRecipeName}
              onSave={() => fetchWeekPlan(year, week)}
            />
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

function MealSection({ meal, weekDates, plans, recipes, courses, getPlan, getRecipeName, onSave }: {
  meal: { key: string; de: string };
  weekDates: Date[];
  plans: MenuPlanEntry[];
  recipes: any[];
  courses: { key: string; de: string }[];
  getPlan: (date: string, meal: string, course: string) => MenuPlanEntry | undefined;
  getRecipeName: (id: number | null) => string | null;
  onSave: () => void;
}) {
  const [isOpen, setIsOpen] = useState(meal.key === 'lunch');

  const getMealPlansCount = () => {
    return plans.filter(p => p.meal === meal.key && p.recipeId).length;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">
                  {meal.key === "lunch" ? "Mittag" : "Abend"}
                </CardTitle>
                {getMealPlansCount() > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {getMealPlansCount()} Gerichte
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-1 border-t-0 rounded-t-none">
          <CardContent className="p-2 space-y-3">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground pb-1 border-b">
              {weekDates.map((date, idx) => {
                const isToday = formatDate(new Date()) === formatDate(date);
                return (
                  <div key={idx} className={isToday ? 'text-primary font-bold' : ''}>
                    <div>{WEEKDAYS[idx]}</div>
                    <div className="text-[10px]">{date.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {courses.map(course => (
              <div key={course.key}>
                <div className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                  <span className="bg-muted px-1.5 py-0.5 rounded">{course.de}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weekDates.map((date, idx) => {
                    const dateStr = formatDate(date);
                    const plan = getPlan(dateStr, meal.key, course.key);
                    const recipeName = plan ? getRecipeName(plan.recipeId) : null;
                    const isToday = formatDate(new Date()) === dateStr;

                    return (
                      <MenuCell
                        key={`${dateStr}-${course.key}`}
                        date={dateStr}
                        dayName={WEEKDAYS[idx]}
                        dayNum={date.getDate()}
                        meal={meal.key}
                        course={course.key}
                        plan={plan}
                        recipeName={recipeName}
                        recipes={recipes}
                        isToday={isToday}
                        onSave={onSave}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MenuCell({ date, dayName, dayNum, meal, course, plan, recipeName, recipes, isToday, onSave }: {
  date: string;
  dayName: string;
  dayNum: number;
  meal: string;
  course: string;
  plan: MenuPlanEntry | undefined;
  recipeName: string | null;
  recipes: any[];
  isToday: boolean;
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

  const courseName = MEAL_SLOT_LABELS[course as MealSlotName] || course;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`p-1 rounded border text-left ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 transition-colors min-h-[40px]`}>
          {recipeName ? (
            <div className="text-[9px] font-medium leading-tight line-clamp-2">{recipeName}</div>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center">-</div>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{dayName}, {dayNum}. - {courseName}</DialogTitle>
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

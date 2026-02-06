import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Table2 } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getISOWeek, MEAL_SLOT_LABELS, MEAL_SLOTS } from "@shared/constants";
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
}

const DAY_LABELS = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
const DAY_NAMES_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
// dayOfWeek in DB: 0=Sun, 1=Mon ... 6=Sat
// Our UI index: 0=Mon ... 6=Sun
function uiIndexToDbDow(uiIdx: number): number {
  return uiIdx === 6 ? 0 : uiIdx + 1;
}

export default function Rotation() {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState(6);
  const [weekNr, setWeekNr] = useState(1);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0); // 0=Mon
  const [selectedLocation, setSelectedLocation] = useState<"city" | "sued">("city");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weekButtons = Array.from({ length: weekCount }, (_, i) => i + 1);

  // Get slots for the selected day + location
  const dbDow = uiIndexToDbDow(selectedDay);
  const daySlots = slots.filter(s => s.dayOfWeek === dbDow && s.locationSlug === selectedLocation);

  // Group by meal
  const mealGroups: Record<string, RotationSlot[]> = {};
  for (const slot of daySlots) {
    if (!mealGroups[slot.meal]) mealGroups[slot.meal] = [];
    mealGroups[slot.meal].push(slot);
  }

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
            <Link href="/rotation/print">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                <Table2 className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Week Selector Buttons */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
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

      {/* Location Toggle */}
      <div className="flex gap-2 px-4 pt-2 pb-0">
        {(["city", "sued"] as const).map(loc => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={cn(
              "flex-1 py-1.5 rounded-full text-xs font-bold transition-colors",
              selectedLocation === loc
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {loc === "city" ? "City" : "SÜD"}
          </button>
        ))}
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-1.5 px-4 py-3">
        {DAY_LABELS.map((label, idx) => {
          const isSelected = selectedDay === idx;
          return (
            <button
              key={label}
              onClick={() => setSelectedDay(idx)}
              className={cn(
                "flex-1 py-2 rounded-full text-xs font-bold transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Single-Day Course Cards */}
      <div className="px-4 space-y-5 pt-1">
        {["lunch", "dinner"].map(meal => {
          const mealSlots = mealGroups[meal] || [];
          if (mealSlots.length === 0) return null;

          return (
            <div key={meal} className="space-y-2">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {DAY_NAMES_LONG[selectedDay]} — {meal === "lunch" ? "Mittagessen" : "Abendessen"}
              </h2>

              <div className="space-y-2">
                {MEAL_SLOTS.map(course => {
                  const slot = mealSlots.find(s => s.course === course);
                  if (!slot) return null;

                  const recipeName = slot.recipeId
                    ? recipes.find(r => r.id === slot.recipeId)?.name || null
                    : null;

                  return (
                    <RotationCourseCard
                      key={course}
                      slot={slot}
                      courseLabel={MEAL_SLOT_LABELS[course]}
                      recipeName={recipeName}
                      recipes={recipes}
                      onSlotChange={handleSlotChange}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RotationCourseCard({ slot, courseLabel, recipeName, recipes, onSlotChange }: {
  slot: RotationSlot;
  courseLabel: string;
  recipeName: string | null;
  recipes: Recipe[];
  onSlotChange: (slotId: number, recipeId: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [recipeId, setRecipeId] = useState(slot.recipeId ? String(slot.recipeId) : "none");

  useEffect(() => {
    setRecipeId(slot.recipeId ? String(slot.recipeId) : "none");
  }, [slot.recipeId]);

  const handleSave = () => {
    onSlotChange(slot.id, recipeId === "none" ? null : parseInt(recipeId));
    setOpen(false);
  };

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
                {recipeName || <span className="text-muted-foreground">— leer —</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{courseLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rezept</Label>
            <Select value={recipeId} onValueChange={setRecipeId}>
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

          <Button onClick={handleSave} className="w-full">
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

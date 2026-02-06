import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
}

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mo-Sa, So

export default function Rotation() {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState(6);
  const [weekNr, setWeekNr] = useState(1);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Current rotation week based on ISO week
  const currentRotationWeek = ((getISOWeek(new Date()) - 1) % 6) + 1;

  // On mount: ensure default template + fetch recipes
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

  // Fetch slots when template or week changes
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

  // Group slots by day → meal
  const grouped: Record<number, Record<string, RotationSlot[]>> = {};
  for (const slot of slots) {
    if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = {};
    if (!grouped[slot.dayOfWeek][slot.meal]) grouped[slot.dayOfWeek][slot.meal] = [];
    grouped[slot.dayOfWeek][slot.meal].push(slot);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weekButtons = Array.from({ length: weekCount }, (_, i) => i + 1);

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">6-Wochen-Rotation</h1>
        <span className="text-xs text-muted-foreground">
          KW {getISOWeek(new Date())} = Woche {currentRotationWeek}
        </span>
      </div>

      {/* Week selector buttons */}
      <div className="flex gap-2">
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

      {/* Week grid: days × meals × courses */}
      <div className="space-y-3">
        {WEEK_DAYS.map(dow => {
          const daySlots = grouped[dow];
          if (!daySlots) return null;

          return (
            <Card key={dow}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium">{DAY_NAMES[dow]}</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {["lunch", "dinner"].map(meal => {
                  const mealSlots = daySlots[meal] || [];
                  if (mealSlots.length === 0) return null;

                  return (
                    <div key={meal}>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        {meal === "lunch" ? "Mittag" : "Abend"}
                      </div>
                      <div className="space-y-1">
                        {MEAL_SLOTS.map(course => {
                          const slot = mealSlots.find(s => s.course === course);
                          if (!slot) return null;

                          return (
                            <div key={course} className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                                {MEAL_SLOT_LABELS[course]}
                              </span>
                              <Select
                                value={slot.recipeId ? String(slot.recipeId) : "none"}
                                onValueChange={v => handleSlotChange(slot.id, v === "none" ? null : parseInt(v))}
                              >
                                <SelectTrigger className="h-7 text-xs flex-1">
                                  <SelectValue placeholder="Gericht wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">- leer -</SelectItem>
                                  {recipes.map(r => (
                                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

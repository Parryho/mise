import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
const COURSES = ["soup", "main1", "side1a", "side1b", "main2", "side2a", "side2b", "dessert"];
const COURSE_LABELS: Record<string, string> = {
  soup: "Suppe",
  main1: "Hauptgericht 1",
  side1a: "Beilage 1a",
  side1b: "Beilage 1b",
  main2: "Vegetarisch",
  side2a: "Beilage 2a",
  side2b: "Beilage 2b",
  dessert: "Dessert",
};

export default function Rotation() {
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; weekCount: number }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [weekNr, setWeekNr] = useState(1);
  const [slots, setSlots] = useState<RotationSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/rotation-templates").then(r => r.json()),
      fetch("/api/recipes").then(r => r.json()),
    ]).then(([tmpl, recs]) => {
      setTemplates(tmpl);
      setRecipes(recs);
      if (tmpl.length > 0) setSelectedTemplate(tmpl[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTemplate) return;
    fetch(`/api/rotation-slots/${selectedTemplate}?weekNr=${weekNr}`)
      .then(r => r.json())
      .then(data => setSlots(data))
      .catch(() => {});
  }, [selectedTemplate, weekNr]);

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

  const template = templates.find(t => t.id === selectedTemplate);
  const maxWeek = template?.weekCount || 6;

  // Group slots by day+meal
  const grouped: Record<string, Record<string, RotationSlot[]>> = {};
  for (const slot of slots) {
    const dayKey = `${slot.dayOfWeek}-${slot.meal}`;
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

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Rotation</h1>
        <GenerateDialog templateId={selectedTemplate} weekNr={weekNr} />
      </div>

      <div className="flex items-center gap-2">
        <Select value={String(selectedTemplate || "")} onValueChange={v => setSelectedTemplate(parseInt(v))}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekNr(Math.max(1, weekNr - 1))} disabled={weekNr <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-20 text-center">Woche {weekNr}/{maxWeek}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekNr(Math.min(maxWeek, weekNr + 1))} disabled={weekNr >= maxWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 0].map(dow => {
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
                      <div className="text-xs text-muted-foreground mb-1">{meal === "lunch" ? "Mittag" : "Abend"}</div>
                      <div className="space-y-1">
                        {COURSES.map(course => {
                          const slot = mealSlots.find(s => s.course === course);
                          if (!slot) return null;

                          return (
                            <div key={course} className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 shrink-0">{COURSE_LABELS[course]}</span>
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

function GenerateDialog({ templateId, weekNr }: { templateId: number | null; weekNr: number }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!templateId || !startDate) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/menu-plans/generate-from-rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, weekNr, startDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `${data.created} Menüpläne erstellt` });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Wand2 className="h-4 w-4" /> Generieren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Menüplan generieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Erstellt Menüpläne aus Woche {weekNr} der Rotation.
          </p>
          <div className="space-y-2">
            <Label>Montag (Startwoche)</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !startDate} className="w-full">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

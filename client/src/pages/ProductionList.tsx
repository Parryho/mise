import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, ChevronDown, ChevronUp, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatEuro(val: number): string {
  return val.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProductionIngredient {
  name: string;
  quantityPerPortion: number;
  totalQuantity: number;
  unit: string;
  preparationNote: string;
  cost: number;
  fromSubRecipe?: string;
}

interface ProductionDish {
  slot: string;
  dishName: string;
  dishId: number;
  prepTime?: number;
  ingredients: ProductionIngredient[];
  totalCost?: number;
}

interface ProductionEntry {
  date: string;
  meal: string;
  locationSlug: string;
  pax: number;
  dishes: ProductionDish[];
  mealTotalCost?: number;
}

const MEAL_LABELS: Record<string, string> = { lunch: "Mittag", dinner: "Abend", breakfast: "Frühstück" };
const LOC_LABELS: Record<string, string> = { city: "City", sued: "SÜD", ak: "AK" };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatQuantity(qty: number, unit: string): string {
  if (unit === "g" && qty >= 1000) return `${(qty / 1000).toFixed(1)} kg`;
  if (unit === "ml" && qty >= 1000) return `${(qty / 1000).toFixed(1)} l`;
  return `${Math.round(qty * 10) / 10} ${unit}`;
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export default function ProductionList() {
  const weekRange = getWeekRange();
  const [startDate, setStartDate] = useState(weekRange.start);
  const [endDate, setEndDate] = useState(weekRange.end);
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production-list?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch production list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const toggleDish = (key: string) => {
    setExpandedDishes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Produktionsliste</h1>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Drucken
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Von</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Bis</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Menüpläne für diesen Zeitraum
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <Card key={idx}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{formatDate(entry.date)} - {MEAL_LABELS[entry.meal] || entry.meal}</span>
                  <span className="text-xs font-normal text-muted-foreground flex items-center gap-2">
                    {LOC_LABELS[entry.locationSlug] || entry.locationSlug} | {entry.pax} PAX
                    {entry.mealTotalCost != null && entry.mealTotalCost > 0 && (
                      <Badge variant="outline" className="text-[10px] py-0">{formatEuro(entry.mealTotalCost)}</Badge>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {entry.dishes.map((dish, dIdx) => {
                  const dishKey = `${idx}-${dIdx}`;
                  const isExpanded = expandedDishes.has(dishKey);

                  return (
                    <Collapsible key={dIdx} open={isExpanded} onOpenChange={() => toggleDish(dishKey)}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{dish.dishName}</span>
                          {dish.prepTime != null && dish.prepTime > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />{dish.prepTime}min
                            </span>
                          )}
                          {dish.totalCost != null && dish.totalCost > 0 && (
                            <span className="text-[10px] text-muted-foreground">{formatEuro(dish.totalCost)}</span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="border rounded p-2 space-y-1 bg-secondary/20">
                          <div className="grid grid-cols-4 text-[10px] text-muted-foreground font-medium border-b pb-1">
                            <span>Zutat</span>
                            <span className="text-right">pro Portion</span>
                            <span className="text-right">Gesamt ({entry.pax}x)</span>
                            <span className="text-right">Kosten</span>
                          </div>
                          {dish.ingredients.map((ing, iIdx) => (
                            <div key={iIdx} className="grid grid-cols-4 text-xs">
                              <span>
                                {ing.name}
                                {ing.fromSubRecipe && (
                                  <span className="text-[9px] text-muted-foreground ml-1">({ing.fromSubRecipe})</span>
                                )}
                              </span>
                              <span className="text-right text-muted-foreground">{formatQuantity(ing.quantityPerPortion, ing.unit)}</span>
                              <span className="text-right font-medium">{formatQuantity(ing.totalQuantity, ing.unit)}</span>
                              <span className="text-right text-muted-foreground">{ing.cost > 0 ? formatEuro(ing.cost) : '-'}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

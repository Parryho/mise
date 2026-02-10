import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, ChevronDown, ChevronUp, Clock, DollarSign, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLocalDate } from "@shared/constants";
import { useTranslation } from "@/hooks/useTranslation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function formatEuro(val: number): string {
  return val.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}

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
    start: formatLocalDate(monday),
    end: formatLocalDate(sunday),
  };
}

export default function ProductionList() {
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-heading font-bold">{t("production.title")}</h1>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> {t("common.print")}
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">{t("common.from")}</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">{t("common.to")}</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs" />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs shrink-0"
          onClick={() => { const r = getWeekRange(); setStartDate(r.start); setEndDate(r.end); }}
        >
          {t("production.thisWeek")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">{t("production.noPlans")}</p>
          <p className="text-xs mt-1">{t("production.noPlansHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <Card key={idx}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{formatDate(entry.date)} - {t(`production.mealLabels.${entry.meal}`) || entry.meal}</span>
                  <span className="text-xs font-normal text-muted-foreground flex items-center gap-2">
                    {t(`production.locLabels.${entry.locationSlug}`) || entry.locationSlug} | {t("production.totalPax", { pax: entry.pax })}
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
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/50 active:bg-secondary/70 transition-colors min-h-[44px]">
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
                        <div className="border rounded-lg overflow-hidden bg-secondary/10">
                          <div className="grid grid-cols-4 text-[10px] text-muted-foreground font-medium bg-secondary/30 px-2 py-1.5">
                            <span>{t("production.ingredient")}</span>
                            <span className="text-right">{t("production.perPortion")}</span>
                            <span className="text-right">{t("production.costs")} ({entry.pax}x)</span>
                            <span className="text-right">{t("production.costs")}</span>
                          </div>
                          <div className="divide-y divide-border/30">
                            {dish.ingredients.map((ing, iIdx) => (
                              <div key={iIdx} className="grid grid-cols-4 text-xs px-2 py-1.5 hover:bg-secondary/20 transition-colors">
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

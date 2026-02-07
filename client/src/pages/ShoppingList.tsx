import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Printer, Download, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupplierGroup {
  supplierId: number | null;
  supplierName: string;
  items: ShoppingItem[];
  subtotal: number;
}

interface ShoppingItem {
  ingredientName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  estimatedCost: number;
  supplier: string;
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
  subtotal: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  fleisch: "Fleisch & Wurst",
  fisch: "Fisch & Meeresfrüchte",
  gemuese: "Gemüse & Salat",
  milchprodukte: "Milchprodukte",
  trockenwaren: "Trockenwaren & Getreide",
  gewuerze: "Gewürze & Kräuter",
  eier_fette: "Eier & Fette",
  obst: "Obst & Früchte",
  tiefkuehl: "Tiefkühlware",
  sonstiges: "Sonstiges",
};

function formatQuantity(qty: number, unit: string): string {
  if (unit === "g" && qty >= 1000) return `${(qty / 1000).toFixed(1)} kg`;
  if (unit === "ml" && qty >= 1000) return `${(qty / 1000).toFixed(1)} l`;
  return `${Math.round(qty * 10) / 10} ${unit}`;
}

function formatEuro(val: number): string {
  return val.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
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

export default function ShoppingList() {
  const weekRange = getWeekRange();
  const [startDate, setStartDate] = useState(weekRange.start);
  const [endDate, setEndDate] = useState(weekRange.end);
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'supplier'>('category');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shopping-list?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setCategories(data.categories || []);
      setSupplierGroups(data.supplierGroups || []);
      setGrandTotal(data.grandTotal || 0);
    } catch (err) {
      console.error("Failed to fetch shopping list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" /> Einkaufsliste
        </h1>
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

      {/* View toggle */}
      <div className="flex gap-1">
        <Button variant={viewMode === 'category' ? 'default' : 'outline'} size="sm" className="text-xs flex-1" onClick={() => setViewMode('category')}>
          <ShoppingCart className="h-3 w-3 mr-1" /> Kategorie
        </Button>
        <Button variant={viewMode === 'supplier' ? 'default' : 'outline'} size="sm" className="text-xs flex-1" onClick={() => setViewMode('supplier')}>
          <Truck className="h-3 w-3 mr-1" /> Lieferant
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-secondary/30">
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground">{totalItems} Zutaten</div>
              <div className="text-xs text-muted-foreground">{categories.length} Kategorien</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Geschätzte Kosten</div>
              <div className="text-xl font-bold">{formatEuro(grandTotal)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Menüpläne für diesen Zeitraum
        </div>
      ) : viewMode === 'category' ? (
        <div className="space-y-3">
          {categories.map(cat => (
            <Card key={cat.category}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium flex justify-between">
                  <span>{CATEGORY_LABELS[cat.category] || cat.category}</span>
                  <span className="text-xs font-normal text-muted-foreground">{formatEuro(cat.subtotal)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {cat.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">{item.ingredientName}</span>
                        {item.supplier && (
                          <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0">{item.supplier}</Badge>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-medium">{formatQuantity(item.totalQuantity, item.unit)}</div>
                        {item.estimatedCost > 0 && (
                          <div className="text-[10px] text-muted-foreground">{formatEuro(item.estimatedCost)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {supplierGroups.map(group => (
            <Card key={group.supplierName}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium flex justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {group.supplierName}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{formatEuro(group.subtotal)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {group.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">{item.ingredientName}</span>
                        <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </Badge>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-medium">{formatQuantity(item.totalQuantity, item.unit)}</div>
                        {item.estimatedCost > 0 && (
                          <div className="text-[10px] text-muted-foreground">{formatEuro(item.estimatedCost)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

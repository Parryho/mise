import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Printer, Download, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLocalDate } from "@shared/constants";
import { useTranslation } from "@/hooks/useTranslation";

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
    start: formatLocalDate(monday),
    end: formatLocalDate(sunday),
  };
}

export default function ShoppingList() {
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-heading font-bold">{t("shopping.title")}</h1>
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
          {t("shopping.thisWeek")}
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <Button variant={viewMode === 'category' ? 'default' : 'outline'} size="sm" className="text-xs flex-1 h-9 gap-1.5" onClick={() => setViewMode('category')}>
          <ShoppingCart className="h-3.5 w-3.5" /> {t("shopping.byCategory")}
        </Button>
        <Button variant={viewMode === 'supplier' ? 'default' : 'outline'} size="sm" className="text-xs flex-1 h-9 gap-1.5" onClick={() => setViewMode('supplier')}>
          <Truck className="h-3.5 w-3.5" /> {t("shopping.bySupplier")}
        </Button>
      </div>

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background rounded-lg p-2 border">
              <div className="text-lg font-bold">{totalItems}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{t("shopping.ingredients")}</div>
            </div>
            <div className="bg-background rounded-lg p-2 border">
              <div className="text-lg font-bold">{viewMode === 'category' ? categories.length : supplierGroups.length}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{viewMode === 'category' ? t("shopping.categories") : t("shopping.suppliers")}</div>
            </div>
            <div className="bg-background rounded-lg p-2 border">
              <div className="text-lg font-bold text-primary">{formatEuro(grandTotal)}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{t("shopping.estimated")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">{t("shopping.emptyState")}</p>
          <p className="text-xs mt-1">{t("shopping.emptyStateHint")}</p>
        </div>
      ) : viewMode === 'category' ? (
        <div className="space-y-3">
          {categories.map(cat => (
            <Card key={cat.category}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium flex justify-between">
                  <span>{t(`shopping.categoryLabels.${cat.category}`) || cat.category}</span>
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
                          {t(`shopping.categoryLabels.${item.category}`) || item.category}
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

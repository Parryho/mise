import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, AlertTriangle, Leaf, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { getWeekDateRange, getISOWeek } from "@shared/constants";

interface SuggestedRecipe {
  recipeId: number;
  recipeName: string;
  category: string;
}

interface AtRiskIngredient {
  ingredientName: string;
  category: string;
  categoryLabel: string;
  plannedDate: string;
  expiryEstimate: string;
  daysUntilExpiry: number;
  riskLevel: "red" | "yellow" | "green";
  usedInRecipes: string[];
  suggestedRecipes: SuggestedRecipe[];
}

interface WastePredictionData {
  atRisk: AtRiskIngredient[];
  summary: {
    totalAtRisk: number;
    redCount: number;
    yellowCount: number;
    greenCount: number;
    topCategories: Array<{ category: string; label: string; count: number }>;
  };
}

interface Location {
  id: number;
  slug: string;
  name: string;
}

const RISK_STYLES: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
  red: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    label: "Kritisch",
    icon: "text-red-500",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    label: "Warnung",
    icon: "text-yellow-500",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
    label: "OK",
    icon: "text-green-500",
  },
};

export default function WastePrediction() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const [locationId, setLocationId] = useState<string>("all");
  const { from, to } = getWeekDateRange(year, week);

  // Fetch locations
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch waste predictions
  const locParam = locationId !== "all" ? `&locationId=${locationId}` : "";
  const { data, isLoading } = useQuery<WastePredictionData>({
    queryKey: ["/api/analytics/waste-prediction", from, to, locationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/waste-prediction?startDate=${from}&endDate=${to}${locParam}`
      );
      if (!res.ok) throw new Error("Fehler beim Laden der Waste-Prediction");
      return res.json();
    },
  });

  const handlePrevWeek = () => {
    if (week === 1) {
      setYear(year - 1);
      setWeek(52);
    } else {
      setWeek(week - 1);
    }
  };

  const handleNextWeek = () => {
    if (week === 52) {
      setYear(year + 1);
      setWeek(1);
    } else {
      setWeek(week + 1);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1.5 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            Reports
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">Waste-Prediction</h1>
          <p className="text-sm text-muted-foreground">
            Ablaufrisiko basierend auf Menüplan und Haltbarkeit
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Week navigation */}
            <div className="flex items-center gap-2 flex-1">
              <Button variant="outline" size="sm" onClick={handlePrevWeek} className="min-h-[44px]">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Vorige
              </Button>
              <div className="text-center min-w-[140px]">
                <p className="text-sm text-muted-foreground">Kalenderwoche</p>
                <p className="text-lg font-semibold">KW {week} / {year}</p>
                <p className="text-xs text-muted-foreground">{from} bis {to}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextWeek} className="min-h-[44px]">
                Nächste
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {/* Location filter */}
            <div className="w-full md:w-[200px]">
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Standort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Standorte</SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt gefährdet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.summary.totalAtRisk}</p>
                <p className="text-xs text-muted-foreground">Zutaten</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Kritisch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{data.summary.redCount}</p>
                <p className="text-xs text-muted-foreground">Läuft morgen ab</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Warnung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{data.summary.yellowCount}</p>
                <p className="text-xs text-muted-foreground">2-3 Tage</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">In Ordnung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{data.summary.greenCount}</p>
                <p className="text-xs text-muted-foreground">Noch haltbar</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          {data.summary.topCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Häufigste Kategorien mit Risiko</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.summary.topCategories.map((cat) => (
                    <Badge key={cat.category} variant="outline" className="text-sm py-1 px-3">
                      {cat.label}: {cat.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* At-Risk Ingredients */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Gefährdete Zutaten</h2>

            {data.atRisk.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Keine Zutaten gefährdet</p>
                  <p className="text-sm">Alle geplanten Zutaten sind innerhalb der Haltbarkeit gut eingeteilt.</p>
                </CardContent>
              </Card>
            )}

            {data.atRisk.map((item, index) => {
              const style = RISK_STYLES[item.riskLevel];
              return (
                <Card key={index} className={`border ${style.border} ${style.bg}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={`h-4 w-4 ${style.icon}`} />
                          <h3 className="font-semibold">{item.ingredientName}</h3>
                          <Badge
                            className={`text-xs ${
                              item.riskLevel === "red"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : item.riskLevel === "yellow"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                : "bg-green-100 text-green-700 border-green-300"
                            }`}
                            variant="outline"
                          >
                            {style.label}
                          </Badge>
                        </div>

                        <div className="grid gap-1 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Kategorie:</span>
                            <span>{item.categoryLabel}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Geplant: {new Date(item.plannedDate).toLocaleDateString("de-AT")}
                            </span>
                            <ChevronRight className="h-3 w-3" />
                            <span>
                              Ablauf ca.: {new Date(item.expiryEstimate).toLocaleDateString("de-AT")}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Verwendet in: </span>
                            {item.usedInRecipes.join(", ")}
                          </div>
                        </div>

                        {/* Suggested recipes */}
                        {item.suggestedRecipes.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-dashed">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Vorgeschlagene Rezepte zur Verwertung:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.suggestedRecipes.map((recipe) => (
                                <Badge
                                  key={recipe.recipeId}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-secondary/80"
                                >
                                  {recipe.recipeName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-2xl font-bold ${style.text}`}>
                          {item.daysUntilExpiry}
                        </p>
                        <p className="text-xs text-muted-foreground">Tage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

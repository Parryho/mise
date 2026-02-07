import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { getWeekDateRange, getISOWeek } from "@shared/constants";
import { useLocationFilter } from "@/lib/location-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from "recharts";

// ==========================================
// Types
// ==========================================

interface ForecastEntry {
  date: string;
  dayOfWeek: number;
  dayName: string;
  meal: string;
  predicted: number;
  lower: number;
  upper: number;
  lastYear: number | null;
  avg4Week: number;
}

interface AccuracyMetrics {
  mape: number;
  dataPoints: number;
}

interface ForecastData {
  forecasts: ForecastEntry[];
  accuracy: AccuracyMetrics;
}

interface ChartDataPoint {
  dayName: string;
  date: string;
  mittagPredicted: number;
  mittagLower: number;
  mittagUpper: number;
  mittagRange: [number, number];
  mittagLastYear: number | null;
  abendPredicted: number;
  abendLower: number;
  abendUpper: number;
  abendRange: [number, number];
  abendLastYear: number | null;
}

// ==========================================
// Helpers
// ==========================================

function getNextWeekMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  return nextMonday;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMondayOfISOWeek(year: number, week: number): string {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return formatDateISO(monday);
}

function getMapeColor(mape: number): string {
  if (mape <= 10) return "bg-green-100 text-green-800";
  if (mape <= 20) return "bg-yellow-100 text-yellow-800";
  if (mape <= 30) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getMapeLabel(mape: number): string {
  if (mape <= 10) return "Sehr genau";
  if (mape <= 20) return "Gut";
  if (mape <= 30) return "Akzeptabel";
  return "Ungenau";
}

// ==========================================
// Component
// ==========================================

export default function PaxForecast() {
  const nextMonday = getNextWeekMonday();
  const [year, setYear] = useState(nextMonday.getFullYear());
  const [week, setWeek] = useState(getISOWeek(nextMonday));
  const { locations, selectedLocationId } = useLocationFilter();
  const [locationId, setLocationId] = useState<string>(
    selectedLocationId ? String(selectedLocationId) : "all"
  );
  const [selectedMeal, setSelectedMeal] = useState<string>("both");

  const weekStart = getMondayOfISOWeek(year, week);
  const { from, to } = getWeekDateRange(year, week);

  const { data, isLoading, error } = useQuery<ForecastData>({
    queryKey: ["/api/analytics/pax-forecast", weekStart, locationId],
    queryFn: async () => {
      const params = new URLSearchParams({ weekStart });
      if (locationId !== "all") params.append("locationId", locationId);
      const res = await fetch(`/api/analytics/pax-forecast?${params}`);
      if (!res.ok) throw new Error("Prognose konnte nicht geladen werden");
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

  // Transform forecast data for chart
  const chartData: ChartDataPoint[] = [];
  if (data?.forecasts) {
    const byDate: Record<string, Partial<ChartDataPoint>> = {};
    for (const f of data.forecasts) {
      if (!byDate[f.date]) {
        byDate[f.date] = {
          dayName: f.dayName,
          date: f.date,
          mittagPredicted: 0,
          mittagLower: 0,
          mittagUpper: 0,
          mittagRange: [0, 0],
          mittagLastYear: null,
          abendPredicted: 0,
          abendLower: 0,
          abendUpper: 0,
          abendRange: [0, 0],
          abendLastYear: null,
        };
      }
      const entry = byDate[f.date]!;
      if (f.meal === "mittag") {
        entry.mittagPredicted = f.predicted;
        entry.mittagLower = f.lower;
        entry.mittagUpper = f.upper;
        entry.mittagRange = [f.lower, f.upper];
        entry.mittagLastYear = f.lastYear;
      } else {
        entry.abendPredicted = f.predicted;
        entry.abendLower = f.lower;
        entry.abendUpper = f.upper;
        entry.abendRange = [f.lower, f.upper];
        entry.abendLastYear = f.lastYear;
      }
    }
    // Sort by date (Mo first)
    const sorted = Object.values(byDate).sort((a, b) =>
      (a.date || "").localeCompare(b.date || "")
    );
    chartData.push(...(sorted as ChartDataPoint[]));
  }

  // Calculate summary totals
  const totalPredicted = data?.forecasts.reduce((s, f) => s + f.predicted, 0) ?? 0;
  const totalMittag = data?.forecasts
    .filter((f) => f.meal === "mittag")
    .reduce((s, f) => s + f.predicted, 0) ?? 0;
  const totalAbend = data?.forecasts
    .filter((f) => f.meal === "abend")
    .reduce((s, f) => s + f.predicted, 0) ?? 0;

  // Filter forecasts for table
  const filteredForecasts = data?.forecasts.filter((f) => {
    if (selectedMeal === "both") return true;
    return f.meal === selectedMeal;
  }) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">PAX-Prognose</h1>
          <p className="text-sm text-muted-foreground">
            Vorhersage der Gästezahlen basierend auf historischen Daten
          </p>
        </div>
        {data?.accuracy && data.accuracy.dataPoints > 0 && (
          <div className="flex items-center gap-2">
            <Badge className={getMapeColor(data.accuracy.mape)}>
              <TrendingUp className="h-3 w-3 mr-1" />
              MAPE {data.accuracy.mape}% - {getMapeLabel(data.accuracy.mape)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({data.accuracy.dataPoints} Datenpunkte)
            </span>
          </div>
        )}
      </div>

      {/* Filters: Week Navigation + Location + Meal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[140px]">
                <p className="text-sm text-muted-foreground">Kalenderwoche</p>
                <p className="text-lg font-semibold">KW {week} / {year}</p>
                <p className="text-xs text-muted-foreground">{from} bis {to}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Location & Meal Filter */}
            <div className="flex gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Standort</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Standorte</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mahlzeit</Label>
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Beide</SelectItem>
                    <SelectItem value="mittag">Mittag</SelectItem>
                    <SelectItem value="abend">Abend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>Fehler beim Laden der Prognose: {(error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prognose Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPredicted}</p>
            <p className="text-xs text-muted-foreground">PAX diese Woche</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mittag</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMittag}</p>
            <p className="text-xs text-muted-foreground">prognostiziert</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAbend}</p>
            <p className="text-xs text-muted-foreground">prognostiziert</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Predicted PAX with Confidence Range */}
      <Card>
        <CardHeader>
          <CardTitle>Prognose vs. Vorjahr</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    mittagPredicted: "Mittag Prognose",
                    abendPredicted: "Abend Prognose",
                    mittagLastYear: "Mittag Vorjahr",
                    abendLastYear: "Abend Vorjahr",
                    mittagRange: "Mittag Bereich",
                    abendRange: "Abend Bereich",
                  };
                  return [value, labels[name] || name];
                }}
                labelFormatter={(label) => label}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    mittagPredicted: "Mittag Prognose",
                    abendPredicted: "Abend Prognose",
                    mittagLastYear: "Mittag Vorjahr",
                    abendLastYear: "Abend Vorjahr",
                  };
                  return labels[value] || value;
                }}
              />

              {/* Confidence range as area (mittag) */}
              {(selectedMeal === "both" || selectedMeal === "mittag") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="mittagRange"
                    fill="#F37021"
                    fillOpacity={0.1}
                    stroke="none"
                    legendType="none"
                  />
                  <Bar dataKey="mittagPredicted" fill="#F37021" name="mittagPredicted" />
                  <Bar
                    dataKey="mittagLastYear"
                    fill="#F37021"
                    fillOpacity={0.3}
                    stroke="#F37021"
                    strokeDasharray="3 3"
                    name="mittagLastYear"
                  />
                </>
              )}

              {/* Confidence range as area (abend) */}
              {(selectedMeal === "both" || selectedMeal === "abend") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="abendRange"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    stroke="none"
                    legendType="none"
                  />
                  <Bar dataKey="abendPredicted" fill="#3b82f6" name="abendPredicted" />
                  <Bar
                    dataKey="abendLastYear"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    stroke="#3b82f6"
                    strokeDasharray="3 3"
                    name="abendLastYear"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tagesdetails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Tag</th>
                  <th className="text-left p-2 font-medium">Mahlzeit</th>
                  <th className="text-right p-2 font-medium">Prognose</th>
                  <th className="text-right p-2 font-medium">Bereich</th>
                  <th className="text-right p-2 font-medium">4-Wochen-Schnitt</th>
                  <th className="text-right p-2 font-medium">Vorjahr</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecasts.map((f) => (
                  <tr key={`${f.date}-${f.meal}`} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="font-medium">{f.dayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(f.date).toLocaleDateString("de-AT")}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={f.meal === "mittag" ? "default" : "secondary"}>
                        {f.meal === "mittag" ? "Mittag" : "Abend"}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <span className="text-lg font-bold">{f.predicted}</span>
                    </td>
                    <td className="text-right p-2 text-muted-foreground">
                      {f.lower} - {f.upper}
                    </td>
                    <td className="text-right p-2">
                      {f.avg4Week > 0 ? f.avg4Week : "-"}
                    </td>
                    <td className="text-right p-2">
                      {f.lastYear !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          <span>{f.lastYear}</span>
                          {f.predicted > 0 && f.lastYear > 0 && (
                            <span
                              className={
                                f.predicted > f.lastYear
                                  ? "text-green-600 text-xs"
                                  : f.predicted < f.lastYear
                                  ? "text-red-600 text-xs"
                                  : "text-muted-foreground text-xs"
                              }
                            >
                              {f.predicted > f.lastYear
                                ? `+${Math.round(((f.predicted - f.lastYear) / f.lastYear) * 100)}%`
                                : f.predicted < f.lastYear
                                ? `${Math.round(((f.predicted - f.lastYear) / f.lastYear) * 100)}%`
                                : "0%"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Summary row */}
                {filteredForecasts.length > 0 && (
                  <tr className="bg-muted/50 font-bold">
                    <td className="p-2" colSpan={2}>SUMME</td>
                    <td className="text-right p-2">
                      {filteredForecasts.reduce((s, f) => s + f.predicted, 0)}
                    </td>
                    <td className="text-right p-2 text-muted-foreground">
                      {filteredForecasts.reduce((s, f) => s + f.lower, 0)} -{" "}
                      {filteredForecasts.reduce((s, f) => s + f.upper, 0)}
                    </td>
                    <td className="text-right p-2">
                      {filteredForecasts.reduce((s, f) => s + f.avg4Week, 0) > 0
                        ? filteredForecasts.reduce((s, f) => s + f.avg4Week, 0)
                        : "-"}
                    </td>
                    <td className="text-right p-2">
                      {filteredForecasts.some((f) => f.lastYear !== null)
                        ? filteredForecasts.reduce((s, f) => s + (f.lastYear ?? 0), 0)
                        : "-"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Info */}
      {data?.accuracy && (
        <Card>
          <CardHeader>
            <CardTitle>Prognosegenauigkeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">MAPE (Mean Absolute Percentage Error):</div>
                <Badge className={getMapeColor(data.accuracy.mape)}>
                  {data.accuracy.mape}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {data.accuracy.dataPoints > 0 ? (
                  <>
                    Basierend auf {data.accuracy.dataPoints} historischen Datenpunkten.
                    {data.accuracy.mape <= 15
                      ? " Die Prognose ist zuverlaessig und kann fuer die Planung verwendet werden."
                      : data.accuracy.mape <= 25
                      ? " Die Prognose bietet eine gute Orientierung, sollte aber mit Erfahrungswerten abgeglichen werden."
                      : " Die Datenlage ist noch duenn. Die Prognose verbessert sich mit mehr historischen Daten."}
                  </>
                ) : (
                  "Noch keine historischen Daten vorhanden. Die Prognose wird genauer, sobald mehr Gästezahlen erfasst sind."
                )}
              </div>
              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                Methodik: 50% 4-Wochen-Durchschnitt, 30% Wochentags-Muster, 20% Vorjahresvergleich (gleiche KW).
                Konfidenzintervall: +/- 1,5 Standardabweichungen.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

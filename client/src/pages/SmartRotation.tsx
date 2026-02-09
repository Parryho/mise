import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Brain,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────────

interface RotationAnalysis {
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  fillPercentage: number;
  varietyScore: number;
  allergenCoverage: Record<string, number>;
  categoryDistribution: Record<string, number>;
  duplicatesPerWeek: Record<string, number>;
  recipesUsedMultipleTimes: { recipeId: number; recipeName: string; count: number }[];
  weeklyBalance: { weekNr: number; filled: number; total: number }[];
  seasonalFit: number;
}

interface SuggestedSwap {
  weekNr: number;
  dayOfWeek: number;
  meal: string;
  course: string;
  currentRecipeId: number | null;
  currentRecipeName: string | null;
  suggestedRecipeId: number;
  suggestedRecipeName: string;
  reason: string;
}

interface OptimizeResult {
  swaps: SuggestedSwap[];
  summary: string;
}

// ── Constants ───────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: "So",
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
};

const MEAL_LABELS: Record<string, string> = {
  lunch: "Mittag",
  dinner: "Abend",
};

const COURSE_LABELS: Record<string, string> = {
  soup: "Suppe",
  main1: "Fleisch/Fisch",
  side1a: "Beilage 1a",
  side1b: "Beilage 1b",
  main2: "Vegetarisch",
  side2a: "Beilage 2a",
  side2b: "Beilage 2b",
  dessert: "Dessert",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Klare Suppen": "#eab308",
  "Cremesuppen": "#f59e0b",
  "Haupt-Fleisch": "#ef4444",
  "Haupt-Fisch": "#3b82f6",
  "Haupt-Vegan/Vegi": "#22c55e",
  "Beilagen": "#a855f7",
  "Kalte Saucen": "#06b6d4",
  "Warme Saucen": "#f97316",
  "Salate": "#84cc16",
  "Warme Dessert": "#ec4899",
  "Kalte Dessert": "#d946ef",
};

const PIE_COLORS = [
  "#F37021", "#3b82f6", "#22c55e", "#eab308", "#a855f7",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#ef4444", "#d946ef",
];

// ── Component ───────────────────────────────────────────────────────────

export default function SmartRotation() {
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [focusVariety, setFocusVariety] = useState(true);
  const [focusSeason, setFocusSeason] = useState(false);
  const [focusCost, setFocusCost] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [appliedSwaps, setAppliedSwaps] = useState<Set<number>>(new Set());

  // Ensure default template exists and get its ID
  useEffect(() => {
    fetch("/api/rotation-templates/ensure-default", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((tmpl) => setTemplateId(tmpl.id))
      .catch(() => {});
  }, []);

  // Fetch analysis
  const {
    data: analysis,
    isLoading: analysisLoading,
    refetch: refetchAnalysis,
  } = useQuery<RotationAnalysis>({
    queryKey: ["/api/rotation", templateId, "analysis"],
    queryFn: async () => {
      const res = await fetch(`/api/rotation/${templateId}/analysis`, { credentials: "include" });
      if (!res.ok) throw new Error("Analyse konnte nicht geladen werden");
      return res.json();
    },
    enabled: !!templateId,
  });

  // Optimize mutation
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rotation/optimize", {
        templateId,
        options: { focusVariety, focusSeason, focusCost },
      });
      return res.json() as Promise<OptimizeResult>;
    },
    onSuccess: (data) => {
      setOptimizeResult(data);
      setAppliedSwaps(new Set());
      toast({
        title: "KI-Analyse abgeschlossen",
        description: `${data.swaps.length} Verbesserungsvorschlag${data.swaps.length !== 1 ? "e" : ""} gefunden.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler bei KI-Optimierung",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Apply a single swap
  const applySwapMutation = useMutation({
    mutationFn: async (swap: SuggestedSwap) => {
      // Find the actual slot to update — we need to search by week/day/meal/course/location
      // The slot ID isn't in the swap data so we load the slots and find it
      const slotsRes = await fetch(
        `/api/rotation-slots/${templateId}?weekNr=${swap.weekNr}`,
        { credentials: "include" }
      );
      const slots = await slotsRes.json();
      const targetSlot = slots.find(
        (s: any) =>
          s.dayOfWeek === swap.dayOfWeek &&
          s.meal === swap.meal &&
          s.course === swap.course &&
          s.recipeId === swap.currentRecipeId
      );
      if (!targetSlot) {
        throw new Error("Slot nicht gefunden — wurde die Rotation zwischenzeitlich geändert?");
      }
      await apiRequest("PUT", `/api/rotation-slots/${targetSlot.id}`, {
        recipeId: swap.suggestedRecipeId,
      });
      return swap;
    },
    onSuccess: (swap) => {
      const idx = optimizeResult?.swaps.indexOf(swap);
      if (idx !== undefined && idx >= 0) {
        setAppliedSwaps((prev) => new Set(Array.from(prev).concat([idx])));
      }
      toast({
        title: "Tausch übernommen",
        description: `${swap.suggestedRecipeName} eingesetzt.`,
      });
      refetchAnalysis();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ── Derived data ──────────────────────────────────────────────────────

  const categoryChartData = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.categoryDistribution).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#9ca3af",
    }));
  }, [analysis]);

  const weeklyChartData = useMemo(() => {
    if (!analysis) return [];
    return analysis.weeklyBalance.map((w) => ({
      name: `W${w.weekNr}`,
      belegt: w.filled,
      leer: w.total - w.filled,
      pct: w.total > 0 ? Math.round((w.filled / w.total) * 100) : 0,
    }));
  }, [analysis]);

  const allergenChartData = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.allergenCoverage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        allergen: name,
        anzahl: count,
      }));
  }, [analysis]);

  const scoreRadarData = useMemo(() => {
    if (!analysis) return [];
    const totalDupes = Object.values(analysis.duplicatesPerWeek).reduce(
      (a, b) => a + b,
      0
    );
    const dupeScore = Math.max(0, 100 - totalDupes * 10);
    return [
      { metric: "Abwechslung", value: analysis.varietyScore },
      { metric: "Befüllung", value: analysis.fillPercentage },
      { metric: "Saison", value: analysis.seasonalFit },
      { metric: "Keine Duplikate", value: dupeScore },
    ];
  }, [analysis]);

  // ── Render ────────────────────────────────────────────────────────────

  if (!templateId || analysisLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Orange Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/rotation">
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/20 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Rotation
            </h1>
            <p className="text-xs text-primary-foreground/70 mt-0.5">
              KI-gestützte Analyse und Optimierung
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

      {/* ── Score Overview ─────────────────────────────────────────── */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/60">
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="text-3xl font-bold text-primary leading-tight">
                {analysis.varietyScore}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">Abwechslung</div>
              <Progress value={analysis.varietyScore} className="mt-2.5 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="text-3xl font-bold text-primary leading-tight">
                {analysis.fillPercentage}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">Befüllt</div>
              <Progress value={analysis.fillPercentage} className="mt-2.5 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="text-3xl font-bold text-primary leading-tight">
                {analysis.seasonalFit}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">Saison-Fit</div>
              <Progress value={analysis.seasonalFit} className="mt-2.5 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="text-3xl font-bold text-primary leading-tight">
                {analysis.recipesUsedMultipleTimes.length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">Wiederholungen</div>
              <Progress
                value={Math.max(
                  0,
                  100 - analysis.recipesUsedMultipleTimes.length * 5
                )}
                className="mt-2.5 h-1.5"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Radar Chart (Overall Score) ────────────────────────────── */}
      {analysis && scoreRadarData.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              Gesamtbewertung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" fontSize={12} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#F37021"
                  fill="#F37021"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Weekly Balance ──────────────────────────────────────────── */}
      {analysis && weeklyChartData.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Befüllung pro Woche</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    name === "belegt" ? "Belegt" : "Leer",
                  ]}
                />
                <Bar dataKey="belegt" stackId="a" fill="#F37021" name="belegt" />
                <Bar dataKey="leer" stackId="a" fill="#e5e7eb" name="leer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Category Distribution ──────────────────────────────────── */}
      {analysis && categoryChartData.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Kategorieverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Allergen Coverage ──────────────────────────────────────── */}
      {analysis && allergenChartData.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Allergen-Verteilung (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={allergenChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="allergen" type="category" width={40} fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [value, "Vorkommen"]}
                />
                <Bar dataKey="anzahl" fill="#f59e0b" name="Vorkommen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Repeated Recipes Table ─────────────────────────────────── */}
      {analysis && analysis.recipesUsedMultipleTimes.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-status-warning" />
              Mehrfach verwendete Gerichte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Gericht</th>
                    <th className="text-right p-2 font-medium">Verwendungen</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.recipesUsedMultipleTimes.slice(0, 15).map((item) => (
                    <tr key={item.recipeId} className="border-b hover:bg-muted/50">
                      <td className="p-2">{item.recipeName}</td>
                      <td className="text-right p-2">
                        <Badge
                          variant={item.count > 3 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {item.count}x
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* ── AI Optimization Section ────────────────────────────────── */}
      <Card className="border-primary/30 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Optimierung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Claude analysiert die aktuelle Rotation und schlägt konkrete Verbesserungen vor.
            Schwerpunkte wählen:
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="focus-variety"
                checked={focusVariety}
                onCheckedChange={(checked) => setFocusVariety(!!checked)}
              />
              <Label htmlFor="focus-variety" className="text-sm font-normal">
                Abwechslung (keine Wiederholungen innerhalb 2 Wochen)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="focus-season"
                checked={focusSeason}
                onCheckedChange={(checked) => setFocusSeason(!!checked)}
              />
              <Label htmlFor="focus-season" className="text-sm font-normal">
                Saisonalität (Rezepte passend zur aktuellen Saison)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="focus-cost"
                checked={focusCost}
                onCheckedChange={(checked) => setFocusCost(!!checked)}
              />
              <Label htmlFor="focus-cost" className="text-sm font-normal">
                Kostenoptimierung (kürzere Zubereitungszeit, einfachere Zutaten)
              </Label>
            </div>
          </div>

          <Button
            onClick={() => optimizeMutation.mutate()}
            disabled={optimizeMutation.isPending}
            className="w-full"
            size="lg"
          >
            {optimizeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                KI analysiert...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                KI-Optimierung starten
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Optimization Results ───────────────────────────────────── */}
      {optimizeResult && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Vorgeschlagene Änderungen ({optimizeResult.swaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground border border-border/40">
              {optimizeResult.summary}
            </div>

            {optimizeResult.swaps.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Die Rotation ist bereits gut optimiert!</p>
                <p className="text-xs mt-1">Keine Änderungen vorgeschlagen.</p>
              </div>
            )}

            {/* Swap List */}
            <div className="space-y-3">
              {optimizeResult.swaps.map((swap, idx) => {
                const isApplied = appliedSwaps.has(idx);
                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 space-y-2 transition-colors ${
                      isApplied
                        ? "border-status-success/40 bg-status-success-subtle/50"
                        : "border-border/60"
                    }`}
                  >
                    {/* Location info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] py-0 h-5">
                          W{swap.weekNr}
                        </Badge>
                        <span>{DAY_LABELS[swap.dayOfWeek]}</span>
                        <span>{MEAL_LABELS[swap.meal] || swap.meal}</span>
                        <span>{COURSE_LABELS[swap.course] || swap.course}</span>
                      </div>
                      {isApplied && (
                        <Badge className="bg-status-success text-status-success-foreground text-[10px] py-0 h-5">
                          Übernommen
                        </Badge>
                      )}
                    </div>

                    {/* Swap details */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground line-through flex-1 truncate">
                        {swap.currentRecipeName || "(leer)"}
                      </span>
                      <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium flex-1 truncate">
                        {swap.suggestedRecipeName}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-muted-foreground italic">
                      {swap.reason}
                    </p>

                    {/* Apply button */}
                    {!isApplied && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-1"
                        onClick={() => applySwapMutation.mutate(swap)}
                        disabled={applySwapMutation.isPending}
                      >
                        {applySwapMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        Übernehmen
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Refresh analysis after applying swaps */}
            {appliedSwaps.size > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  refetchAnalysis();
                  toast({
                    title: "Analyse aktualisiert",
                    description: "Die Statistiken wurden neu berechnet.",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Analyse aktualisieren
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

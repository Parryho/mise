import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, AlertTriangle, AlertCircle, Info, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Scatter } from "recharts";
import { cn } from "@/lib/utils";
import { formatLocalDate } from "@shared/constants";
import { useTranslation } from "@/hooks/useTranslation";

interface Anomaly {
  fridgeId: number;
  fridgeName: string;
  type: "out_of_range" | "trend" | "spike" | "gap" | "stuck_sensor";
  severity: "CRITICAL" | "WARNING" | "INFO";
  timestamp: string;
  value?: number;
  expected?: string;
  message: string;
}

interface AnomalySummary {
  critical: number;
  warning: number;
  info: number;
}

interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  summary: AnomalySummary;
}

interface FridgeHealthScore {
  fridgeId: number;
  fridgeName: string;
  score: number;
  totalChecks: number;
  anomalyCount: number;
  recommendation: string;
}

interface FridgeTempData {
  timestamp: string;
  temperature: number;
  isAnomaly: boolean;
  anomalyType?: string;
}

export default function HaccpAnomalies() {
  const { t } = useTranslation();
  const [selectedSeverity, setSelectedSeverity] = useState<"ALL" | "CRITICAL" | "WARNING" | "INFO">("ALL");
  const [selectedFridge, setSelectedFridge] = useState<number | null>(null);
  const [days, setDays] = useState(30);

  // Calculate date range
  const endDate = useMemo(() => formatLocalDate(new Date()), []);
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatLocalDate(date);
  }, [days]);

  // Fetch anomalies
  const { data: anomalyData, isLoading: isLoadingAnomalies } = useQuery<AnomalyDetectionResult>({
    queryKey: ["/api/haccp/anomalies", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/haccp/anomalies?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch anomalies");
      return res.json();
    },
  });

  // Get unique fridges from anomalies
  const uniqueFridges = useMemo(() => {
    if (!anomalyData) return [];
    const fridgeMap = new Map<number, string>();
    anomalyData.anomalies.forEach(a => {
      if (!fridgeMap.has(a.fridgeId)) {
        fridgeMap.set(a.fridgeId, a.fridgeName);
      }
    });
    return Array.from(fridgeMap.entries()).map(([id, name]) => ({ id, name }));
  }, [anomalyData]);

  // Fetch health scores for all fridges
  const healthScoreQueries = uniqueFridges.map(fridge =>
    useQuery<FridgeHealthScore>({
      queryKey: ["/api/haccp/fridge-health", fridge.id, days],
      queryFn: async () => {
        const res = await fetch(`/api/haccp/fridge-health?fridgeId=${fridge.id}&days=${days}`);
        if (!res.ok) throw new Error("Failed to fetch health score");
        return res.json();
      },
      enabled: uniqueFridges.length > 0,
    })
  );

  // Filter anomalies by severity
  const filteredAnomalies = useMemo(() => {
    if (!anomalyData) return [];
    let filtered = anomalyData.anomalies;
    if (selectedSeverity !== "ALL") {
      filtered = filtered.filter(a => a.severity === selectedSeverity);
    }
    if (selectedFridge !== null) {
      filtered = filtered.filter(a => a.fridgeId === selectedFridge);
    }
    return filtered;
  }, [anomalyData, selectedSeverity, selectedFridge]);

  if (isLoadingAnomalies) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4" />;
      case "INFO":
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSeverityBadgeProps = (severity: string): { variant: "default" | "secondary" | "destructive" | "outline"; className?: string } => {
    switch (severity) {
      case "CRITICAL":
        return { variant: "destructive" };
      case "WARNING":
        return { variant: "default", className: "bg-amber-600 hover:bg-amber-700 text-white" };
      case "INFO":
        return { variant: "secondary" };
      default:
        return { variant: "default" };
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 75) return "bg-blue-50 border-blue-200";
    if (score >= 50) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-4 w-4" />;
      case "spike":
        return <Activity className="h-4 w-4" />;
      case "gap":
        return <Info className="h-4 w-4" />;
      case "stuck_sensor":
        return <AlertTriangle className="h-4 w-4" />;
      case "out_of_range":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1.5 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            {t("common.reports")}
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t("anomalies.title")}</h1>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("anomalies.period")}</p>
              <div className="flex gap-1.5">
                {[
                  { value: 7, label: t("anomalies.days7") },
                  { value: 30, label: t("anomalies.days30") },
                  { value: 90, label: t("anomalies.days90") },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={days === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDays(opt.value)}
                    className="min-h-[44px]"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("anomalies.severity")}</p>
              <div className="flex gap-1.5">
                <Button
                  variant={selectedSeverity === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSeverity("ALL")}
                  className="min-h-[44px]"
                >
                  {t("anomalies.all")}
                </Button>
                <Button
                  variant={selectedSeverity === "CRITICAL" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSeverity("CRITICAL")}
                  className="min-h-[44px]"
                >
                  {t("anomalies.critical")} ({anomalyData?.summary.critical || 0})
                </Button>
                <Button
                  variant={selectedSeverity === "WARNING" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSeverity("WARNING")}
                  className={`min-h-[44px] ${selectedSeverity === "WARNING" ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                >
                  {t("anomalies.warning")} ({anomalyData?.summary.warning || 0})
                </Button>
              </div>
            </div>

            {uniqueFridges.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("anomalies.fridge")}</p>
                <select
                  className="px-3 py-2 border rounded-md text-sm min-h-[44px]"
                  value={selectedFridge || ""}
                  onChange={(e) => setSelectedFridge(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">{t("anomalies.allFridges")}</option>
                  {uniqueFridges.map(fridge => (
                    <option key={fridge.id} value={fridge.id}>
                      {fridge.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {startDate} bis {endDate}
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("anomalies.critical")}</p>
                <p className="text-3xl font-bold text-red-600">
                  {anomalyData?.summary.critical || 0}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("anomalies.warning")}</p>
                <p className="text-3xl font-bold text-amber-600">
                  {anomalyData?.summary.warning || 0}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("anomalies.info")}</p>
                <p className="text-3xl font-bold text-blue-600">
                  {anomalyData?.summary.info || 0}
                </p>
              </div>
              <Info className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fridge Health Score Cards */}
      {healthScoreQueries.length > 0 && (
        <>
          <h2 className="text-xl font-heading font-bold">{t("anomalies.fridgeHealth")}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {healthScoreQueries.map((query, index) => {
              if (query.isLoading) {
                return (
                  <Card key={uniqueFridges[index].id} className="border-2">
                    <CardContent className="pt-6 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              }

              if (!query.data) return null;

              const health = query.data;
              return (
                <Card key={health.fridgeId} className={cn("border-2", getHealthBgColor(health.score))}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{health.fridgeName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">{t("anomalies.healthScore")}</p>
                      <p className={cn("text-5xl font-bold", getHealthColor(health.score))}>
                        {health.score}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            health.score >= 90 ? "bg-green-600" :
                            health.score >= 75 ? "bg-blue-600" :
                            health.score >= 50 ? "bg-amber-600" : "bg-red-600"
                          )}
                          style={{ width: `${health.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("anomalies.measurements")}:</span>
                        <span className="font-semibold">{health.totalChecks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("anomalies.anomalies")}:</span>
                        <span className="font-semibold">{health.anomalyCount}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {health.recommendation}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Anomaly List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("anomalies.detected")} ({filteredAnomalies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t("anomalies.noAnomalies")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    anomaly.severity === "CRITICAL" ? "bg-red-50 border-red-200" :
                    anomaly.severity === "WARNING" ? "bg-amber-50 border-amber-200" :
                    "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge {...getSeverityBadgeProps(anomaly.severity)} className={cn("gap-1", getSeverityBadgeProps(anomaly.severity).className)}>
                          {getSeverityIcon(anomaly.severity)}
                          {anomaly.severity === "CRITICAL" ? t("anomalies.critical") :
                           anomaly.severity === "WARNING" ? t("anomalies.warning") : t("anomalies.info")}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(anomaly.type)}
                          {t(`anomalies.types.${anomaly.type}`)}
                        </Badge>
                        <span className="text-sm font-semibold">{anomaly.fridgeName}</span>
                      </div>

                      <p className="text-sm">{anomaly.message}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(anomaly.timestamp).toLocaleString('de-AT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {anomaly.value !== undefined && (
                          <span className="font-semibold">{t("anomalies.value")}: {anomaly.value.toFixed(1)}°C</span>
                        )}
                        {anomaly.expected && (
                          <span>{t("anomalies.expected")}: {anomaly.expected}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box - compact legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{t("anomalies.legend")}:</span>{" "}
            {t("anomalies.legendText")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

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
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">Anomalie-Erkennung</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <Button
            variant={days === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(7)}
          >
            7 Tage
          </Button>
          <Button
            variant={days === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(30)}
          >
            30 Tage
          </Button>
          <Button
            variant={days === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(90)}
          >
            90 Tage
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedSeverity === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("ALL")}
          >
            Alle
          </Button>
          <Button
            variant={selectedSeverity === "CRITICAL" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("CRITICAL")}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Kritisch
          </Button>
          <Button
            variant={selectedSeverity === "WARNING" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("WARNING")}
            className={selectedSeverity === "WARNING" ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Warnung
          </Button>
          <Button
            variant={selectedSeverity === "INFO" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("INFO")}
          >
            <Info className="h-4 w-4 mr-1" />
            Information
          </Button>
        </div>

        {uniqueFridges.length > 0 && (
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={selectedFridge || ""}
            onChange={(e) => setSelectedFridge(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Alle Kühlschränke</option>
            {uniqueFridges.map(fridge => (
              <option key={fridge.id} value={fridge.id}>
                {fridge.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Zeitraum: {startDate} bis {endDate} ({days} Tage)
      </p>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kritisch</p>
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
                <p className="text-sm text-muted-foreground mb-1">Warnung</p>
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
                <p className="text-sm text-muted-foreground mb-1">Information</p>
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
          <h2 className="text-xl font-heading font-bold">Kühlschrank-Gesundheit</h2>
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
                      <p className="text-sm text-muted-foreground mb-1">Gesundheitswert</p>
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
                        <span className="text-muted-foreground">Messungen:</span>
                        <span className="font-semibold">{health.totalChecks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Anomalien:</span>
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
          <CardTitle>Erkannte Anomalien ({filteredAnomalies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Anomalien im ausgewählten Zeitraum gefunden.</p>
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
                          {anomaly.severity === "CRITICAL" ? "Kritisch" :
                           anomaly.severity === "WARNING" ? "Warnung" : "Information"}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(anomaly.type)}
                          {anomaly.type === "out_of_range" ? "Außerhalb Bereich" :
                           anomaly.type === "trend" ? "Trend" :
                           anomaly.type === "spike" ? "Temperaturspitze" :
                           anomaly.type === "gap" ? "Messlücke" :
                           "Sensor-Fehler"}
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
                          <span className="font-semibold">Wert: {anomaly.value.toFixed(1)}°C</span>
                        )}
                        {anomaly.expected && (
                          <span>Erwartet: {anomaly.expected}</span>
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

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-blue-900">Anomalie-Typen:</p>
              <ul className="space-y-1 text-blue-800">
                <li><strong>Kritisch:</strong> Temperatur außerhalb des Sollbereichs</li>
                <li><strong>Trend:</strong> 3+ aufeinanderfolgende Messungen mit steigender/fallender Tendenz</li>
                <li><strong>Temperaturspitze:</strong> Einzelne Messung weicht stark vom 7-Tage-Durchschnitt ab</li>
                <li><strong>Messlücke:</strong> Keine Messung für &gt;8 Stunden während der Betriebszeit (6-22 Uhr)</li>
                <li><strong>Sensor-Fehler:</strong> Gleiche Temperatur 5+ Mal hintereinander gemessen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

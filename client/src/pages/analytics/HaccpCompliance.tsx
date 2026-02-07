import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { getWeekDateRange, getISOWeek } from "@shared/constants";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface FridgeCompliance {
  fridgeId: number;
  fridgeName: string;
  checksTotal: number;
  checksOk: number;
  checksWarning: number;
  checksCritical: number;
  compliancePercent: number;
  temperatureData: Array<{
    timestamp: string;
    temperature: number;
    status: string;
  }>;
}

interface ComplianceGap {
  date: string;
  fridgeName: string;
  missedChecks: number;
}

interface HaccpComplianceData {
  overallCompliance: number;
  fridges: FridgeCompliance[];
  gaps: ComplianceGap[];
}

export default function HaccpCompliance() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const { from, to } = getWeekDateRange(year, week);

  const { data, isLoading } = useQuery<HaccpComplianceData>({
    queryKey: ["/api/analytics/haccp-compliance", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/haccp-compliance?startDate=${from}&endDate=${to}`);
      if (!res.ok) throw new Error("Failed to fetch HACCP compliance");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getComplianceColor = (percent: number) => {
    if (percent >= 95) return "text-green-600";
    if (percent >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getComplianceBgColor = (percent: number) => {
    if (percent >= 95) return "bg-green-50 border-green-200";
    if (percent >= 80) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">HACCP-Compliance</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        KW {week} / {year} ({from} bis {to})
      </p>

      {/* Overall Compliance Badge */}
      <Card className={cn("border-2", getComplianceBgColor(data?.overallCompliance || 0))}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Gesamt-Compliance</p>
            <p className={cn("text-6xl font-bold", getComplianceColor(data?.overallCompliance || 0))}>
              {Math.round(data?.overallCompliance || 0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {(data?.overallCompliance || 0) >= 95 ? "Ausgezeichnet" :
               (data?.overallCompliance || 0) >= 80 ? "Verbesserungsbedarf" :
               "Kritisch"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Per-Fridge Compliance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.fridges.map((fridge) => (
          <Card key={fridge.fridgeId} className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{fridge.fridgeName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Compliance</span>
                <span className={cn("text-2xl font-bold", getComplianceColor(fridge.compliancePercent))}>
                  {Math.round(fridge.compliancePercent)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{fridge.checksOk}</span>
                  <span className="text-xs text-muted-foreground">OK</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold">{fridge.checksWarning}</span>
                  <span className="text-xs text-muted-foreground">Warnung</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">{fridge.checksCritical}</span>
                  <span className="text-xs text-muted-foreground">Kritisch</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Temperature Trend Charts */}
      {data?.fridges.map((fridge) => (
        <Card key={`chart-${fridge.fridgeId}`}>
          <CardHeader>
            <CardTitle className="text-lg">{fridge.fridgeName} - Temperaturverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fridge.temperatureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })}
                  fontSize={12}
                />
                <YAxis
                  domain={[-10, 10]}
                  tickFormatter={(value) => `${value}°C`}
                  fontSize={12}
                />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString('de-AT')}
                  formatter={(value: number) => [`${value}°C`, 'Temperatur']}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}

      {/* Gap Analysis */}
      {data?.gaps && data.gaps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Fehlende Kontrollen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200">
                    <th className="text-left p-2 font-medium">Datum</th>
                    <th className="text-left p-2 font-medium">Kühlgerät</th>
                    <th className="text-right p-2 font-medium">Fehlende Checks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gaps.map((gap, idx) => (
                    <tr key={idx} className="border-b border-amber-200">
                      <td className="p-2">{new Date(gap.date).toLocaleDateString('de-AT')}</td>
                      <td className="p-2">{gap.fridgeName}</td>
                      <td className="text-right p-2 font-semibold text-amber-700">{gap.missedChecks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(!data?.gaps || data.gaps.length === 0) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center text-green-700">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
              <p className="font-semibold">Keine Lücken gefunden</p>
              <p className="text-sm">Alle erforderlichen Kontrollen wurden durchgeführt.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

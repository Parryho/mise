import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Euro } from "lucide-react";
import { Link } from "wouter";
import { getWeekDateRange, getISOWeek } from "@shared/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DailyCost {
  date: string;
  dayName: string;
  mealCount: number;
  totalCost: number;
  paxCount: number;
  costPerGuest: number;
}

interface FoodCostData {
  daily: DailyCost[];
  weekSummary: {
    totalCost: number;
    avgCostPerDay: number;
    avgCostPerGuest: number;
    totalPax: number;
    totalMeals: number;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

export default function FoodCost() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const { from, to } = getWeekDateRange(year, week);

  const { data, isLoading } = useQuery<FoodCostData>({
    queryKey: ["/api/analytics/food-cost", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/food-cost?startDate=${from}&endDate=${to}`);
      if (!res.ok) throw new Error("Failed to fetch food cost data");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">Food-Cost-Analyse</h1>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Vorherige Woche
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Kalenderwoche</p>
              <p className="text-lg font-semibold">KW {week} / {year}</p>
              <p className="text-xs text-muted-foreground">{from} bis {to}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Nächste Woche
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Woche gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(data?.weekSummary.totalCost || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ø pro Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(data?.weekSummary.avgCostPerDay || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ø pro Gast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(data?.weekSummary.avgCostPerGuest || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt PAX</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.weekSummary.totalPax || 0}</p>
            <p className="text-xs text-muted-foreground">{data?.weekSummary.totalMeals || 0} Mahlzeiten</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Cost Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tägliche Food-Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" />
              <YAxis tickFormatter={(value) => `€${value}`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return `${payload[0].payload.dayName} - ${new Date(payload[0].payload.date).toLocaleDateString('de-AT')}`;
                  }
                  return label;
                }}
              />
              <Bar dataKey="totalCost" name="Kosten" fill="#F37021" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Daily Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tägliche Aufschlüsselung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Datum</th>
                  <th className="text-right p-2 font-medium">Mahlzeiten</th>
                  <th className="text-right p-2 font-medium">PAX</th>
                  <th className="text-right p-2 font-medium">Gesamt</th>
                  <th className="text-right p-2 font-medium">€/Gast</th>
                </tr>
              </thead>
              <tbody>
                {data?.daily.map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="font-medium">{day.dayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('de-AT')}
                      </div>
                    </td>
                    <td className="text-right p-2">{day.mealCount}</td>
                    <td className="text-right p-2">{day.paxCount}</td>
                    <td className="text-right p-2 font-semibold">{formatCurrency(day.totalCost)}</td>
                    <td className="text-right p-2 text-muted-foreground">
                      {formatCurrency(day.costPerGuest)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-muted/50 font-bold">
                  <td className="p-2">SUMME</td>
                  <td className="text-right p-2">{data?.weekSummary.totalMeals || 0}</td>
                  <td className="text-right p-2">{data?.weekSummary.totalPax || 0}</td>
                  <td className="text-right p-2">{formatCurrency(data?.weekSummary.totalCost || 0)}</td>
                  <td className="text-right p-2 text-muted-foreground">
                    {formatCurrency(data?.weekSummary.avgCostPerGuest || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

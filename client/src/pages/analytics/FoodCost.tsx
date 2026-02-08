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
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">Food-Cost-Analyse</h1>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">KW {week} / {year}</p>
          <p className="text-xs text-muted-foreground">{from} bis {to}</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Woche gesamt</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(data?.weekSummary.totalCost || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Ø pro Tag</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(data?.weekSummary.avgCostPerDay || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Ø pro Gast</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(data?.weekSummary.avgCostPerGuest || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Gesamt PAX</p>
            <p className="text-xl font-bold mt-1">{data?.weekSummary.totalPax || 0}</p>
            <p className="text-[10px] text-muted-foreground">{data?.weekSummary.totalMeals || 0} Mahlzeiten</p>
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
              <Bar dataKey="totalCost" name="Kosten" fill="#F37021" radius={[4, 4, 0, 0]} />
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
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left p-2.5 font-medium text-xs">Datum</th>
                  <th className="text-right p-2.5 font-medium text-xs">Mahlzeiten</th>
                  <th className="text-right p-2.5 font-medium text-xs">PAX</th>
                  <th className="text-right p-2.5 font-medium text-xs">Gesamt</th>
                  <th className="text-right p-2.5 font-medium text-xs">€/Gast</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.daily.map((day) => (
                  <tr key={day.date} className="hover:bg-muted/50 transition-colors">
                    <td className="p-2.5">
                      <div className="font-medium">{day.dayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('de-AT')}
                      </div>
                    </td>
                    <td className="text-right p-2.5">{day.mealCount}</td>
                    <td className="text-right p-2.5">{day.paxCount}</td>
                    <td className="text-right p-2.5 font-semibold">{formatCurrency(day.totalCost)}</td>
                    <td className="text-right p-2.5 text-muted-foreground">
                      {formatCurrency(day.costPerGuest)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                  <td className="p-2.5">SUMME</td>
                  <td className="text-right p-2.5">{data?.weekSummary.totalMeals || 0}</td>
                  <td className="text-right p-2.5">{data?.weekSummary.totalPax || 0}</td>
                  <td className="text-right p-2.5">{formatCurrency(data?.weekSummary.totalCost || 0)}</td>
                  <td className="text-right p-2.5 text-muted-foreground">
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

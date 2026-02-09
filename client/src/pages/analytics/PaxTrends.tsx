import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { getWeekDateRange, getISOWeek, DAY_NAMES } from "@shared/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DailyPaxData {
  date: string;
  dayName: string;
  adults: number;
  children: number;
  total: number;
}

interface WeekdayAverage {
  dayName: string;
  avgAdults: number;
  avgChildren: number;
  avgTotal: number;
}

interface PaxTrendsData {
  daily: DailyPaxData[];
  weekdayAverages: WeekdayAverage[];
  totalWeek: {
    adults: number;
    children: number;
    total: number;
  };
}

export default function PaxTrends() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const { from, to } = getWeekDateRange(year, week);

  const { data, isLoading } = useQuery<PaxTrendsData>({
    queryKey: ["/api/analytics/pax-trends", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/pax-trends?startDate=${from}&endDate=${to}`);
      if (!res.ok) throw new Error("Failed to fetch PAX trends");
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
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1.5 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            Reports
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">PAX-Trends</h1>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevWeek} className="gap-1 min-h-[44px] min-w-[44px]">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Vor</span>
        </Button>
        <div className="text-center">
          <p className="text-lg font-bold">KW {week} / {year}</p>
          <p className="text-xs text-muted-foreground">{from} bis {to}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNextWeek} className="gap-1 min-h-[44px] min-w-[44px]">
          <span className="sr-only sm:not-sr-only">Vor</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Erwachsene</p>
            <p className="text-2xl font-bold mt-1">{data?.totalWeek.adults || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Kinder</p>
            <p className="text-2xl font-bold mt-1">{data?.totalWeek.children || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Gesamt</p>
            <p className="text-2xl font-bold mt-1">{data?.totalWeek.total || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tägliche Gästezahlen</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="adults" name="Erwachsene" fill="#F37021" stackId="a" />
              <Bar dataKey="children" name="Kinder" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekday Averages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wochentags-Durchschnitt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left p-2.5 font-medium text-xs">Wochentag</th>
                  <th className="text-right p-2.5 font-medium text-xs">Ø Erwachsene</th>
                  <th className="text-right p-2.5 font-medium text-xs">Ø Kinder</th>
                  <th className="text-right p-2.5 font-medium text-xs">Ø Gesamt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.weekdayAverages.map((day) => (
                  <tr key={day.dayName} className="hover:bg-muted/50 transition-colors">
                    <td className="p-2.5 font-medium">{day.dayName}</td>
                    <td className="text-right p-2.5">{Math.round(day.avgAdults)}</td>
                    <td className="text-right p-2.5">{Math.round(day.avgChildren)}</td>
                    <td className="text-right p-2.5 font-semibold">{Math.round(day.avgTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

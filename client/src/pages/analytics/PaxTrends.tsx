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
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">PAX-Trends</h1>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Erwachsene</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.totalWeek.adults || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kinder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.totalWeek.children || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.totalWeek.total || 0}</p>
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
              <Bar dataKey="children" name="Kinder" fill="#3b82f6" stackId="a" />
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Wochentag</th>
                  <th className="text-right p-2 font-medium">Ø Erwachsene</th>
                  <th className="text-right p-2 font-medium">Ø Kinder</th>
                  <th className="text-right p-2 font-medium">Ø Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {data?.weekdayAverages.map((day) => (
                  <tr key={day.dayName} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{day.dayName}</td>
                    <td className="text-right p-2">{Math.round(day.avgAdults)}</td>
                    <td className="text-right p-2">{Math.round(day.avgChildren)}</td>
                    <td className="text-right p-2 font-semibold">{Math.round(day.avgTotal)}</td>
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

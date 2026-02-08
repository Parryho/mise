import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface DishRanking {
  rank: number;
  dishId: number;
  dishName: string;
  category: string;
  countMenuplan: number;
  countRotation: number;
  totalCount: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface PopularDishesData {
  rankings: DishRanking[];
  byCategory: CategoryCount[];
}

const CATEGORY_COLORS: Record<string, string> = {
  fleisch: "#F37021",
  fisch: "#3b82f6",
  vegetarisch: "#22c55e",
  suppe: "#eab308",
  beilage: "#a855f7",
  dessert: "#ec4899",
};

const CATEGORY_LABELS: Record<string, string> = {
  fleisch: "Fleisch",
  fisch: "Fisch",
  vegetarisch: "Vegetarisch",
  suppe: "Suppe",
  beilage: "Beilage",
  dessert: "Dessert",
};

export default function PopularDishes() {
  const { data, isLoading } = useQuery<PopularDishesData>({
    queryKey: ["/api/analytics/popular-dishes"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/popular-dishes?limit=20");
      if (!res.ok) throw new Error("Failed to fetch popular dishes");
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

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank.toString();
  };

  const chartData = data?.rankings.slice(0, 10).map((dish) => ({
    name: dish.dishName.length > 25 ? dish.dishName.substring(0, 25) + "..." : dish.dishName,
    fullName: dish.dishName,
    total: dish.totalCount,
  })) || [];

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">Beliebteste Gerichte</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Top 20 am häufigsten eingesetzte Gerichte über alle Menüpläne und Rotationen
      </p>

      {/* Top 10 Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Gerichte</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
                labelFormatter={() => ""}
              />
              <Bar dataKey="total" fill="#F37021" name="Einsätze" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaillierte Rangliste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-center p-2.5 font-medium text-xs w-12">#</th>
                  <th className="text-left p-2.5 font-medium text-xs">Gericht</th>
                  <th className="text-left p-2.5 font-medium text-xs">Kategorie</th>
                  <th className="text-right p-2.5 font-medium text-xs">Menüplan</th>
                  <th className="text-right p-2.5 font-medium text-xs">Rotation</th>
                  <th className="text-right p-2.5 font-medium text-xs">Gesamt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.rankings.map((dish) => (
                  <tr key={dish.dishId} className={`hover:bg-muted/50 transition-colors ${dish.rank <= 3 ? 'bg-primary/5' : ''}`}>
                    <td className="text-center p-2.5 font-medium text-lg">
                      {getMedalEmoji(dish.rank)}
                    </td>
                    <td className="p-2.5 font-medium">{dish.dishName}</td>
                    <td className="p-2.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: CATEGORY_COLORS[dish.category] + "20",
                          color: CATEGORY_COLORS[dish.category]
                        }}
                      >
                        {CATEGORY_LABELS[dish.category] || dish.category}
                      </span>
                    </td>
                    <td className="text-right p-2.5 text-muted-foreground">{dish.countMenuplan}</td>
                    <td className="text-right p-2.5 text-muted-foreground">{dish.countRotation}</td>
                    <td className="text-right p-2.5 font-bold">{dish.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Verteilung nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.byCategory.map((cat) => ({
                  name: CATEGORY_LABELS[cat.category] || cat.category,
                  value: cat.count,
                  color: CATEGORY_COLORS[cat.category] || "#9ca3af",
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data?.byCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || "#9ca3af"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

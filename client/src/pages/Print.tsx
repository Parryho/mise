import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Printer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import AllergenBadge from "@/components/AllergenBadge";
import { formatLocalDate } from "@shared/constants";

interface MenuPlanEntry {
  id: number;
  date: string;
  meal: string;
  course: string;
  recipeId: number | null;
  portions: number;
  locationId: number | null;
  rotationWeekNr: number | null;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  allergens: string[];
}

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const COURSE_ORDER = ["soup", "main1", "side1a", "side1b", "main2", "side2a", "side2b", "dessert"];
const COURSE_LABELS: Record<string, string> = {
  soup: "Suppe",
  main1: "Haupt 1",
  side1a: "Beil. 1a",
  side1b: "Beil. 1b",
  main2: "Haupt 2",
  side2a: "Beil. 2a",
  side2b: "Beil. 2b",
  dessert: "Dessert",
  main: "Hauptgang",
};

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatLocalDate(monday),
    end: formatLocalDate(sunday),
  };
}

export default function Print() {
  const weekRange = getWeekRange();
  const [startDate, setStartDate] = useState(weekRange.start);
  const [endDate, setEndDate] = useState(weekRange.end);
  const [plans, setPlans] = useState<MenuPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Record<number, Recipe>>({});
  const [locations, setLocations] = useState<Array<{ id: number; slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/locations").then(setLocations).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planData, recipeData] = await Promise.all([
        apiFetch<MenuPlanEntry[]>(`/api/menu-plans?start=${startDate}&end=${endDate}`),
        apiFetch<Recipe[]>("/api/recipes"),
      ]);

      const recipeMap: Record<number, Recipe> = {};
      for (const r of recipeData) recipeMap[r.id] = r;

      setPlans(planData);
      setRecipes(recipeMap);
    } catch {
      console.error("Failed to load print data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const dates = Array.from(new Set(plans.map(p => p.date))).sort();

  // Get location columns
  const locationIds = Array.from(new Set(plans.map(p => p.locationId).filter(Boolean))) as number[];
  const locMap: Record<number, string> = {};
  for (const loc of locations) locMap[loc.id] = loc.name;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Controls (hidden when printing) */}
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-heading font-bold">Druckansicht</h1>
        <Button size="sm" className="gap-1" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Drucken
        </Button>
      </div>

      <div className="flex items-end gap-2 print:hidden">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Von</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Bis</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="print:text-[9pt] print:leading-tight">
          {/* Print header */}
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-lg font-bold">Menüplan {startDate} - {endDate}</h2>
          </div>

          {dates.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Keine Menüpläne vorhanden</p>
              <p className="text-sm mt-1">Für den gewählten Zeitraum sind keine Einträge vorhanden.</p>
            </div>
          )}

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="p-1 text-left w-16">Tag</th>
                {locationIds.length > 0 ? (
                  locationIds.flatMap(locId => ["lunch", "dinner"].map(meal => (
                    <th key={`${locId}-${meal}`} className="p-1 text-center border-l">
                      {locMap[locId] || "?"} {meal === "lunch" ? "Mi" : "Ab"}
                    </th>
                  )))
                ) : (
                  ["lunch", "dinner"].map(meal => (
                    <th key={meal} className="p-1 text-center border-l">
                      {meal === "lunch" ? "Mittag" : "Abend"}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {dates.map(date => {
                const d = new Date(date);
                const dayName = DAY_NAMES[d.getDay()];
                const dayNum = `${d.getDate()}.${d.getMonth() + 1}.`;

                return (
                  <tr key={date} className="border-b">
                    <td className="p-1 align-top font-medium">
                      <div className="text-[10px]">{dayName}</div>
                      <div>{dayNum}</div>
                    </td>
                    {locationIds.length > 0 ? (
                      locationIds.flatMap(locId => ["lunch", "dinner"].map(meal => {
                        const cellPlans = plans
                          .filter(p => p.date === date && p.meal === meal && p.locationId === locId)
                          .sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course));

                        return (
                          <td key={`${locId}-${meal}`} className="p-1 align-top border-l text-[10px]">
                            {cellPlans.map(p => {
                              const recipe = p.recipeId ? recipes[p.recipeId] : null;
                              if (!recipe) return null;
                              return (
                                <div key={p.id} className="mb-0.5">
                                  <span>{recipe.name}</span>
                                  {recipe.allergens.length > 0 && (
                                    <> <AllergenBadge codes={recipe.allergens} /></>
                                  )}
                                </div>
                              );
                            })}
                          </td>
                        );
                      }))
                    ) : (
                      ["lunch", "dinner"].map(meal => {
                        const cellPlans = plans
                          .filter(p => p.date === date && p.meal === meal)
                          .sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course));

                        return (
                          <td key={meal} className="p-1 align-top border-l text-[10px]">
                            {cellPlans.map(p => {
                              const recipe = p.recipeId ? recipes[p.recipeId] : null;
                              if (!recipe) return null;
                              return (
                                <div key={p.id} className="mb-0.5">
                                  <span>{recipe.name}</span>
                                  {recipe.allergens.length > 0 && (
                                    <> <AllergenBadge codes={recipe.allergens} /></>
                                  )}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Allergen legend (print only) */}
          <div className="hidden print:block mt-4 text-[8pt] text-muted-foreground">
            A=Gluten B=Krebstiere C=Eier D=Fisch E=Erdnüsse F=Soja G=Milch H=Schalenfrüchte L=Sellerie M=Senf N=Sesam O=Sulfite P=Lupinen R=Weichtiere
          </div>
        </div>
      )}
    </div>
  );
}

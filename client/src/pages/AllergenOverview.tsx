import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { ALLERGENS, ALLERGEN_CODES } from "@shared/allergens";
import { format } from "date-fns";

interface DailyAllergenData {
  dishes: Array<{
    id: number;
    name: string;
    allergens: string[];
    meal: string;
  }>;
  guestWarnings: Array<{
    groupName: string;
    personCount: number;
    allergens: string[];
    conflictingDishes: string[];
  }>;
}

interface Location {
  id: number;
  name: string;
  slug: string;
}

export default function AllergenOverview() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: allergenData, isLoading: dataLoading } = useQuery<DailyAllergenData>({
    queryKey: ["/api/allergens/daily", selectedDate, selectedLocationId],
    queryFn: async () => {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedLocationId) params.append("locationId", selectedLocationId.toString());
      const response = await fetch(`/api/allergens/daily?${params}`);
      if (!response.ok) throw new Error("Failed to fetch allergen data");
      return response.json();
    },
    enabled: !!selectedDate,
  });

  const handlePrint = () => {
    window.print();
  };

  if (locationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">Allergen-Übersicht</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Standort</label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedLocationId === null ? "default" : "outline"}
              onClick={() => setSelectedLocationId(null)}
              size="sm"
            >
              Alle
            </Button>
            {locations?.map((loc) => (
              <Button
                key={loc.id}
                variant={selectedLocationId === loc.id ? "default" : "outline"}
                onClick={() => setSelectedLocationId(loc.id)}
                size="sm"
              >
                {loc.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <Button onClick={handlePrint} variant="secondary">
            Drucken
          </Button>
        </div>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Allergen-Matrix</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedDate), "dd.MM.yyyy")}
                {selectedLocationId && locations
                  ? ` - ${locations.find((l) => l.id === selectedLocationId)?.name}`
                  : " - Alle Standorte"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Gericht</th>
                      <th className="text-left p-2 font-semibold text-xs">Mahlzeit</th>
                      {ALLERGEN_CODES.map((code) => (
                        <th
                          key={code}
                          className="p-2 text-center font-semibold text-orange-600"
                          title={ALLERGENS[code].nameDE}
                        >
                          {code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allergenData?.dishes.map((dish) => (
                      <tr key={dish.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{dish.name}</td>
                        <td className="p-2 text-xs text-muted-foreground">{dish.meal}</td>
                        {ALLERGEN_CODES.map((code) => (
                          <td key={code} className="p-2 text-center">
                            {dish.allergens.includes(code) && (
                              <Check className="h-4 w-4 text-orange-600 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {(!allergenData?.dishes || allergenData.dishes.length === 0) && (
                      <tr>
                        <td colSpan={ALLERGEN_CODES.length + 2} className="p-8 text-center text-muted-foreground">
                          Keine Gerichte für dieses Datum vorhanden
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {allergenData?.guestWarnings && allergenData.guestWarnings.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Gäste-Warnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allergenData.guestWarnings.map((warning, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-md border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-red-900">
                          {warning.groupName} ({warning.personCount} Personen)
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          Allergene: {warning.allergens.map((c) => `${c} (${ALLERGENS[c]?.nameDE})`).join(", ")}
                        </div>
                        <div className="text-sm text-red-600 mt-2">
                          <span className="font-medium">Betroffene Gerichte:</span>{" "}
                          {warning.conflictingDishes.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

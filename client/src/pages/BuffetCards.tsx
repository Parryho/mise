import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { Link } from "wouter";
import { ALLERGENS } from "@shared/allergens";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface BuffetCardData {
  id: number;
  name: string;
  allergens: string[];
}

interface Location {
  id: number;
  name: string;
  slug: string;
}

export default function BuffetCards() {
  const { t } = useTranslation();
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<BuffetCardData[]>({
    queryKey: ["/api/buffet-cards", selectedDate, selectedLocationId],
    queryFn: async () => {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedLocationId) params.append("locationId", selectedLocationId.toString());
      const response = await fetch(`/api/buffet-cards?${params}`);
      if (!response.ok) throw new Error("Failed to fetch buffet cards");
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
    <>
      <style>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 10mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .buffet-card {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 10mm;
          }
        }
      `}</style>

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3 print:hidden">
          <Link href="/reports">
            <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]">
              <ArrowLeft className="h-4 w-4" />
              {t("common.reports")}
            </Button>
          </Link>
          <h1 className="text-xl font-heading font-bold flex-1">{t("buffetCards.title")}</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <div>
            <label className="block text-sm font-medium mb-1">{t("buffetCards.date")}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">{t("buffetCards.location")}</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedLocationId === null ? "default" : "outline"}
                onClick={() => setSelectedLocationId(null)}
                size="sm"
              >
                {t("buffetCards.all")}
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
              <Printer className="mr-2 h-4 w-4" />
              {t("print.print")}
            </Button>
          </div>
        </div>

        {cardsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards?.map((card) => (
              <Card
                key={card.id}
                className="buffet-card print:break-inside-avoid border-2"
              >
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-center leading-tight">
                    {card.name}
                  </h2>

                  {card.allergens.length > 0 ? (
                    <>
                      <div className="flex flex-wrap justify-center gap-3 py-4">
                        {card.allergens.map((code) => (
                          <div
                            key={code}
                            className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-bold shadow-md"
                            title={ALLERGENS[code]?.nameDE}
                          >
                            {code}
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold text-center mb-2">
                          {t("buffetCards.contains")}
                        </p>
                        <ul className="text-sm space-y-1 text-center">
                          {card.allergens.map((code) => (
                            <li key={code} className="text-muted-foreground">
                              {code} = {ALLERGENS[code]?.nameDE}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {t("buffetCards.noAllergens")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {(!cards || cards.length === 0) && (
              <div className="col-span-full text-center py-12 space-y-2">
                <Printer className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">{t("buffetCards.noDishes")}</p>
                <p className="text-sm text-muted-foreground">{t("buffetCards.noDishesHint")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import StarRating from "@/components/StarRating";

interface PairingCombo {
  dayOfWeek: number;
  meal: string;
  locationSlug: string;
  mainRecipeId: number;
  mainRecipeName: string;
  sideRecipeId: number;
  sideRecipeName: string;
  pairingType: "main_starch" | "main_veggie";
}

interface Rating {
  key: string;
  dayOfWeek: number;
  meal: string;
  locationSlug: string;
  mainRecipeId: number;
  sideRecipeId: number;
  pairingType: "main_starch" | "main_veggie";
  rating: number;
}

const DAY_TABS = [
  { label: "Mo", dow: 1 },
  { label: "Di", dow: 2 },
  { label: "Mi", dow: 3 },
  { label: "Do", dow: 4 },
  { label: "Fr", dow: 5 },
  { label: "Sa", dow: 6 },
  { label: "So", dow: 0 },
];

const MEAL_LABELS: Record<string, string> = { lunch: "Mittag", dinner: "Abend" };
const LOC_LABELS: Record<string, string> = { city: "City", sued: "SÜD", ak: "AK" };
const TYPE_LABELS: Record<string, string> = { main_starch: "Stärke", main_veggie: "Gemüse" };

export default function QuizFeedback() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const templateId = Number(params.get("template")) || 1;
  const weekNr = Number(params.get("week")) || 1;

  const [combos, setCombos] = useState<PairingCombo[]>([]);
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [existingRatings, setExistingRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1); // Monday default
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/quiz/week-combos/${templateId}/${weekNr}`).then(r => r.json()),
      fetch(`/api/quiz/my-ratings/${templateId}/${weekNr}`).then(r => r.json()),
    ])
      .then(([combosData, myRatings]) => {
        setCombos(combosData);
        setExistingRatings(myRatings);

        // Pre-fill existing ratings
        const map = new Map<string, Rating>();
        for (const r of myRatings) {
          const key = `${r.dayOfWeek}-${r.meal}-${r.locationSlug}-${r.mainRecipeId}-${r.sideRecipeId}-${r.pairingType}`;
          map.set(key, { key, ...r });
        }
        setRatings(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [templateId, weekNr]);

  const dayCombos = useMemo(
    () => combos.filter(c => c.dayOfWeek === selectedDay),
    [combos, selectedDay]
  );

  // Group by meal + location
  const grouped = useMemo(() => {
    const groups = new Map<string, PairingCombo[]>();
    for (const c of dayCombos) {
      const key = `${c.meal}-${c.locationSlug}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return groups;
  }, [dayCombos]);

  const handleRate = (combo: PairingCombo, value: number) => {
    const key = `${combo.dayOfWeek}-${combo.meal}-${combo.locationSlug}-${combo.mainRecipeId}-${combo.sideRecipeId}-${combo.pairingType}`;
    setRatings(prev => {
      const next = new Map(prev);
      next.set(key, {
        key,
        dayOfWeek: combo.dayOfWeek,
        meal: combo.meal,
        locationSlug: combo.locationSlug,
        mainRecipeId: combo.mainRecipeId,
        sideRecipeId: combo.sideRecipeId,
        pairingType: combo.pairingType,
        rating: value,
      });
      return next;
    });
  };

  const getRating = (combo: PairingCombo): number => {
    const key = `${combo.dayOfWeek}-${combo.meal}-${combo.locationSlug}-${combo.mainRecipeId}-${combo.sideRecipeId}-${combo.pairingType}`;
    return ratings.get(key)?.rating || 0;
  };

  const handleSubmit = async () => {
    const ratingsList = Array.from(ratings.values()).filter(r => r.rating > 0);
    if (ratingsList.length === 0) {
      toast({ title: t("quiz.noRatings"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          weekNr,
          ratings: ratingsList.map(r => ({
            dayOfWeek: r.dayOfWeek,
            meal: r.meal,
            locationSlug: r.locationSlug,
            mainRecipeId: r.mainRecipeId,
            sideRecipeId: r.sideRecipeId,
            pairingType: r.pairingType,
            rating: r.rating,
          })),
        }),
      });

      if (!res.ok) throw new Error("Submit failed");
      const data = await res.json();
      toast({ title: t("quiz.submitted"), description: t("quiz.submittedDesc", { count: data.inserted }) });
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalRated = Array.from(ratings.values()).filter(r => r.rating > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/rotation">
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide">
              {t("quiz.title")} W{weekNr}
            </h1>
          </div>
          <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30 text-[10px] py-0 h-5">
            {totalRated}/{combos.length}
          </Badge>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2 overflow-x-auto">
        {DAY_TABS.map(d => {
          const count = combos.filter(c => c.dayOfWeek === d.dow).length;
          const rated = Array.from(ratings.values()).filter(r => r.dayOfWeek === d.dow && r.rating > 0).length;
          return (
            <Button
              key={d.dow}
              variant={selectedDay === d.dow ? "default" : "outline"}
              size="sm"
              className="relative flex-1 min-w-[40px]"
              onClick={() => setSelectedDay(d.dow)}
            >
              {d.label}
              {count > 0 && (
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${rated === count ? "bg-green-500" : rated > 0 ? "bg-amber-400" : "bg-red-400"}`} />
              )}
            </Button>
          );
        })}
      </div>

      {/* Pairing Cards */}
      <div className="px-3 space-y-3 pt-1">
        {dayCombos.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">{t("quiz.noCombos")}</p>
        ) : (
          Array.from(grouped.entries()).map(([groupKey, groupCombos]) => {
            const [meal, loc] = groupKey.split("-");
            return (
              <div key={groupKey}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {MEAL_LABELS[meal] || meal} — {LOC_LABELS[loc] || loc}
                </h3>
                <div className="space-y-2">
                  {groupCombos.map(combo => (
                    <Card key={`${combo.mainRecipeId}-${combo.sideRecipeId}-${combo.pairingType}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{combo.mainRecipeName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Badge variant="outline" className="text-[9px] py-0 h-4">
                                {TYPE_LABELS[combo.pairingType]}
                              </Badge>
                              {combo.sideRecipeName}
                            </p>
                          </div>
                          <StarRating
                            value={getRating(combo)}
                            onChange={val => handleRate(combo, val)}
                            size="sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Submit */}
      {totalRated > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2 bg-background border-t z-10">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {t("quiz.submit")} ({totalRated} {t("quiz.ratings")})
          </Button>
        </div>
      )}
    </div>
  );
}

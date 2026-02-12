import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useParams } from "wouter";
import { formatLocalDate } from "@shared/constants";
import { useTranslation } from "@/hooks/useTranslation";

interface PublicDish {
  course: string;
  courseLabel: string;
  name: string;
  allergens: Array<{ code: string; name: string }>;
}

interface PublicMeal {
  meal: string;
  mealLabel: string;
  dishes: PublicDish[];
}

interface PublicMenuResponse {
  locationName: string;
  locationSlug: string;
  date: string;
  dateFormatted: string;
  meals: PublicMeal[];
}

export default function DigitalSignage() {
  const params = useParams<{ locationSlug: string }>();
  const locationSlug = params.locationSlug;
  const today = formatLocalDate(new Date());
  const { i18n } = useTranslation();
  const lang = i18n.language || "de";

  const [currentMealIdx, setCurrentMealIdx] = useState(0);
  const [clock, setClock] = useState(new Date());

  const { data: menu, isLoading } = useQuery<PublicMenuResponse>({
    queryKey: ["/api/public/menu", locationSlug, today, lang],
    queryFn: async () => {
      const res = await fetch(`/api/public/menu/${locationSlug}/${today}?lang=${lang}`);
      if (!res.ok) throw new Error("Menu nicht gefunden");
      return res.json();
    },
    enabled: !!locationSlug,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Auto-rotate meals every 15 seconds
  useEffect(() => {
    if (!menu || menu.meals.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMealIdx(prev => (prev + 1) % menu.meals.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [menu]);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-16 w-16 animate-spin text-[#F37021]" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <UtensilsCrossed className="h-20 w-20 text-gray-600 mx-auto" />
          <p className="text-2xl text-gray-400">Kein Menü verfügbar</p>
        </div>
      </div>
    );
  }

  const currentMeal = menu.meals[currentMealIdx];
  const timeStr = clock.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#F37021]" />
          <span className="text-xl font-bold tracking-wide">{menu.locationName}</span>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold">{timeStr}</div>
          <div className="text-sm text-gray-400">{menu.dateFormatted}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-8">
        {currentMeal ? (
          <div className="text-center space-y-8 animate-in fade-in duration-500 w-full max-w-4xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#F37021] tracking-wide">
              {currentMeal.mealLabel}
            </h2>

            <div className="space-y-6">
              {currentMeal.dishes.map((dish, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-sm uppercase tracking-widest text-gray-500">
                    {dish.courseLabel}
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold leading-tight">
                    {dish.name}
                  </div>
                  {dish.allergens.length > 0 && (
                    <div className="text-sm text-orange-400">
                      Allergene: {dish.allergens.map(a => a.code).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-2xl">
            Heute kein Menü geplant.
          </div>
        )}
      </div>

      {/* Bottom indicator dots */}
      {menu.meals.length > 1 && (
        <div className="flex justify-center gap-3 pb-6">
          {menu.meals.map((m, i) => (
            <div
              key={m.meal}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                i === currentMealIdx ? 'bg-[#F37021]' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

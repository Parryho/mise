import { useQuery } from "@tanstack/react-query";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useParams } from "wouter";
import { ALLERGENS } from "@shared/allergens";
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

export default function GuestMenu() {
  const params = useParams<{ locationSlug: string; date?: string }>();
  const locationSlug = params.locationSlug;
  const date = params.date || formatLocalDate(new Date());
  const { i18n } = useTranslation();
  const lang = i18n.language || "de";

  const { data: menu, isLoading, error } = useQuery<PublicMenuResponse>({
    queryKey: ["/api/public/menu", locationSlug, date, lang],
    queryFn: async () => {
      const res = await fetch(`/api/public/menu/${locationSlug}/${date}?lang=${lang}`);
      if (!res.ok) throw new Error("Menu nicht gefunden");
      return res.json();
    },
    enabled: !!locationSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <Loader2 className="h-12 w-12 animate-spin text-[#F37021]" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="text-center space-y-3">
          <UtensilsCrossed className="h-16 w-16 text-gray-400 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-700">Speisekarte nicht gefunden</h1>
          <p className="text-gray-600">Für diesen Standort ist aktuell keine Speisekarte verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-[#F37021] rounded-full mb-4">
            <UtensilsCrossed className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            {menu.locationName}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">{menu.dateFormatted}</p>
        </div>

        {/* Meal sections */}
        {menu.meals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Heute kein Menü geplant.</p>
          </div>
        )}

        {menu.meals.map((meal) => (
          <div key={meal.meal} className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F37021] mb-4 sm:mb-6 text-center">
              {meal.mealLabel}
            </h2>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
              {meal.dishes.map((dish, i) => (
                <div key={i} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-[#F37021] bg-orange-50 rounded mb-1">
                        {dish.courseLabel}
                      </span>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                        {dish.name}
                      </h3>
                    </div>
                    {dish.allergens.length > 0 && (
                      <div className="text-xs sm:text-sm text-orange-600 font-semibold shrink-0">
                        {dish.allergens.map(a => a.code).join(",")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Allergen Legend */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Allergen-Kennzeichnung</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            {Object.entries(ALLERGENS).map(([code, info]) => (
              <div key={code} className="flex gap-2">
                <span className="font-semibold text-[#F37021] w-5">{code}</span>
                <span>{info.nameDE}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pb-8">
          <p className="text-2xl sm:text-3xl font-bold text-[#F37021]">
            Guten Appetit!
          </p>
          <p className="text-sm text-gray-500">
            Bei Fragen zu Allergenen wenden Sie sich bitte an unser Küchenpersonal.
          </p>
        </div>
      </div>
    </div>
  );
}

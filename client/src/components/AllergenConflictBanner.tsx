import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { ALLERGENS } from "@shared/allergens";

interface GuestWarning {
  profileId: number;
  groupName: string;
  personCount: number;
  conflictingAllergens: string[];
  conflictingDishes: string[];
}

interface AllergenConflictBannerProps {
  date: string;
  locationId?: number;
}

export default function AllergenConflictBanner({ date, locationId }: AllergenConflictBannerProps) {
  const url = `/api/allergens/daily?date=${date}${locationId ? `&locationId=${locationId}` : ''}`;

  const { data } = useQuery<{ guestWarnings: GuestWarning[] }>({
    queryKey: [url],
    enabled: !!date,
  });

  const warnings = data?.guestWarnings || [];
  if (warnings.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-orange-800 font-medium text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Allergen-Konflikte erkannt
      </div>
      {warnings.map((w) => (
        <div key={w.profileId} className="text-xs text-orange-700 pl-6">
          <span className="font-medium">{w.groupName}</span> ({w.personCount} Pers.) —{" "}
          {w.conflictingAllergens.map(code => ALLERGENS[code]?.nameDE || code).join(", ")}
          {w.conflictingDishes.length > 0 && (
            <span className="text-orange-600"> in: {w.conflictingDishes.join(", ")}</span>
          )}
        </div>
      ))}
    </div>
  );
}

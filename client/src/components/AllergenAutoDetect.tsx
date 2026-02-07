/**
 * Allergen Auto-Detection Component (3.7)
 * Shows auto-detected allergens as colored badges with "accept" button.
 * Can be integrated into recipe edit forms.
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check } from "lucide-react";
import { ALLERGENS } from "@shared/allergens";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Ingredient {
  name: string;
  allergens?: string[];
}

interface AllergenSuggestion {
  ingredientName: string;
  suggestedAllergens: string[];
}

interface AllergenAutoDetectProps {
  /** List of ingredients to analyze */
  ingredients: Ingredient[];
  /** Current allergens selected for the recipe */
  currentAllergens: string[];
  /** Callback when user accepts suggested allergens */
  onAcceptSuggestions: (allergens: string[]) => void;
  /** Optional: Show inline in compact mode */
  compact?: boolean;
}

export default function AllergenAutoDetect({
  ingredients,
  currentAllergens,
  onAcceptSuggestions,
  compact = false,
}: AllergenAutoDetectProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AllergenSuggestion[]>([]);
  const [uniqueAllergens, setUniqueAllergens] = useState<string[]>([]);

  useEffect(() => {
    if (ingredients.length > 0) {
      detectAllergens();
    } else {
      setSuggestions([]);
      setUniqueAllergens([]);
    }
  }, [ingredients]);

  const detectAllergens = async () => {
    setLoading(true);
    try {
      const ingredientNames = ingredients.map(ing => ing.name);
      const res = await fetch("/api/allergens/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientNames }),
      });

      if (!res.ok) {
        throw new Error("Allergen-Erkennung fehlgeschlagen");
      }

      const data: AllergenSuggestion[] = await res.json();
      setSuggestions(data);

      // Collect unique allergens across all ingredients
      const allAllergens = new Set<string>();
      data.forEach(s => s.suggestedAllergens.forEach(a => allAllergens.add(a)));
      setUniqueAllergens(Array.from(allAllergens).sort());
    } catch (error) {
      console.error("Failed to detect allergens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    // Merge current allergens with suggested (avoid duplicates)
    const merged = new Set([...currentAllergens, ...uniqueAllergens]);
    onAcceptSuggestions(Array.from(merged).sort());
  };

  // No suggestions or already all accepted
  const newAllergens = uniqueAllergens.filter(a => !currentAllergens.includes(a));
  const hasNewSuggestions = newAllergens.length > 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Analysiere Zutaten...</span>
      </div>
    );
  }

  if (!hasNewSuggestions) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAccept}
                className="text-xs gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                {newAllergens.length} Allergene erkannt
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="text-xs space-y-1">
                <div className="font-semibold">Erkannte Allergene:</div>
                {newAllergens.map(code => (
                  <div key={code}>
                    {code} = {ALLERGENS[code]?.nameDE || code}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-600" />
        <h4 className="font-semibold text-sm text-orange-900">
          Allergene automatisch erkannt
        </h4>
      </div>

      <div className="flex flex-wrap gap-2">
        {newAllergens.map(code => (
          <TooltipProvider key={code}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  {code}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <div className="font-semibold">
                    {ALLERGENS[code]?.nameDE || code}
                  </div>
                  <div className="text-gray-500">
                    Gefunden in:{" "}
                    {suggestions
                      .filter(s => s.suggestedAllergens.includes(code))
                      .map(s => s.ingredientName)
                      .slice(0, 3)
                      .join(", ")}
                    {suggestions.filter(s => s.suggestedAllergens.includes(code)).length > 3 && "..."}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <Button
        size="sm"
        onClick={handleAccept}
        className="w-full gap-2"
        variant="default"
      >
        <Check className="h-4 w-4" />
        Vorgeschlagene Allergene übernehmen
      </Button>

      <div className="text-xs text-gray-600">
        Die automatische Erkennung basiert auf Zutatennamen.
        Bitte prüfen Sie die Vorschläge.
      </div>
    </div>
  );
}

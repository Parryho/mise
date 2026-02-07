/**
 * Intelligent Scaling Component (3.5)
 * Shows recipe scaling with non-linear adjustments for spices, baking powder, etc.
 * Can be used inside recipe detail view or as a dialog.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Scale, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatQuantity } from "@shared/units";

interface ScaledIngredient {
  name: string;
  originalQuantity: number;
  scaledQuantity: number;
  unit: string;
  scalingFactor: number;
  scalingNote: string;
  ingredientType: string;
}

interface ScalingResult {
  recipe: {
    id: number;
    name: string;
    category: string;
  };
  originalServings: number;
  targetServings: number;
  scaledIngredients: ScaledIngredient[];
}

interface IntelligentScalingProps {
  /** Recipe ID to scale */
  recipeId: number;
  /** Original recipe name */
  recipeName: string;
  /** Original servings */
  originalServings: number;
  /** Callback when scaling is complete (optional) */
  onScalingComplete?: (result: ScalingResult) => void;
}

export default function IntelligentScaling({
  recipeId,
  recipeName,
  originalServings,
  onScalingComplete,
}: IntelligentScalingProps) {
  const [targetServings, setTargetServings] = useState(originalServings * 10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScalingResult | null>(null);
  const [error, setError] = useState<string>("");

  const handleScale = async () => {
    if (targetServings <= 0) {
      setError("Portionen müssen größer als 0 sein");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recipes/scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, targetServings }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Skalierung fehlgeschlagen");
      }

      const data: ScalingResult = await res.json();
      setResult(data);
      onScalingComplete?.(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScalingIcon = (factor: number) => {
    const linearFactor = targetServings / originalServings;
    if (Math.abs(factor - linearFactor) < 0.05) {
      return <Minus className="h-3 w-3 text-gray-500" />;
    } else if (factor < linearFactor) {
      return <TrendingDown className="h-3 w-3 text-blue-500" />;
    } else {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Gewürze/Kräuter":
        return "bg-purple-100 text-purple-800";
      case "Triebmittel":
        return "bg-blue-100 text-blue-800";
      case "Fett (Braten)":
        return "bg-orange-100 text-orange-800";
      case "Flüssigkeit":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">
              Intelligente Portionsskalierung
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">Intelligente Skalierung</p>
                    <p>
                      Gewürze, Triebmittel und Bratfette werden nicht linear skaliert.
                      Bei großen Mengen benötigt man z.B. weniger Salz pro Portion.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-700">Original</Label>
              <div className="text-2xl font-bold text-gray-900">
                {originalServings} Portionen
              </div>
            </div>

            <div>
              <Label htmlFor="targetServings" className="text-sm text-gray-700">
                Ziel-Portionen
              </Label>
              <Input
                id="targetServings"
                type="number"
                min="1"
                value={targetServings}
                onChange={(e) => setTargetServings(parseInt(e.target.value) || 0)}
                className="text-lg font-semibold"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <Button
            onClick={handleScale}
            disabled={loading || targetServings <= 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Berechne...
              </>
            ) : (
              <>
                <Scale className="h-4 w-4 mr-2" />
                Skalieren
              </>
            )}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">
              Skalierte Zutaten ({originalServings} → {result.targetServings} Portionen)
            </h4>
            <Badge variant="secondary" className="text-xs">
              Faktor: {(result.targetServings / originalServings).toFixed(1)}x
            </Badge>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {result.scaledIngredients.map((ing, idx) => (
              <Card key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ing.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTypeColor(ing.ingredientType)}`}
                        >
                          {ing.ingredientType}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gray-500 text-sm line-through">
                        {formatQuantity(ing.originalQuantity, ing.unit as any)}
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-base">
                        {getScalingIcon(ing.scalingFactor)}
                        {formatQuantity(ing.scaledQuantity, ing.unit as any)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(ing.scalingFactor * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {ing.ingredientType !== "Standard" && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                      {ing.scalingNote}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Hinweis:</span> Die intelligente Skalierung
                berücksichtigt, dass Gewürze und Triebmittel nicht linear skalieren.
                Bei großen Mengen ist die Intensität pro Portion höher.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

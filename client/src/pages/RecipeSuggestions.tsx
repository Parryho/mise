import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Sparkles, Plus, Lightbulb, Star } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatLocalDate } from "@shared/constants";

interface SuggestionItem {
  recipeId: number;
  recipeName: string;
  category: string;
  categoryLabel: string;
  score: number;
  reasons: string[];
  seasonTag?: string;
  tags: string[];
}

interface SuggestionsResponse {
  suggestions: SuggestionItem[];
  aiCommentary?: string;
  meta: {
    date: string;
    meal: string;
    locationId?: number;
    count: number;
  };
}

interface Location {
  id: number;
  slug: string;
  name: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export default function RecipeSuggestions() {
  const today = formatLocalDate(new Date());
  const [date, setDate] = useState(today);
  const [meal, setMeal] = useState("mittag");
  const [locationId, setLocationId] = useState<string>("all");
  const [useAI, setUseAI] = useState(false);

  // Fetch locations
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch suggestions
  const locParam = locationId !== "all" ? `&locationId=${locationId}` : "";
  const aiParam = useAI ? "&ai=true" : "";
  const { data, isLoading, refetch } = useQuery<SuggestionsResponse>({
    queryKey: ["/api/recipes/suggestions", date, meal, locationId, useAI],
    queryFn: async () => {
      const res = await fetch(
        `/api/recipes/suggestions?date=${date}&meal=${meal}${locParam}${aiParam}`
      );
      if (!res.ok) throw new Error("Fehler beim Laden der Vorschläge");
      return res.json();
    },
    enabled: !!date && !!meal,
  });

  // Add to menu plan mutation
  const addToMenuPlan = useMutation({
    mutationFn: async (recipeId: number) => {
      const body: any = {
        date,
        meal,
        recipeId,
        course: "main",
        portions: 1,
      };
      if (locationId !== "all") {
        body.locationId = parseInt(locationId);
      }
      await apiRequest("POST", "/api/menu-plans", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-plans"] });
    },
  });

  return (
    <div className="p-4 space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/rotation">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Rezeptvorschläge
          </h1>
          <p className="text-sm text-muted-foreground">
            Intelligente Empfehlungen basierend auf Abwechslung, Saison und Kategoriebalance
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Mahlzeit</label>
              <Select value={meal} onValueChange={setMeal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mittag">Mittagessen</SelectItem>
                  <SelectItem value="abend">Abendessen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Standort</label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Standorte</SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant={useAI ? "default" : "outline"}
                onClick={() => setUseAI(!useAI)}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {useAI ? "KI aktiv" : "KI-Empfehlung"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Commentary */}
      {data?.aiCommentary && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">KI-Empfehlung</p>
                <p className="text-sm text-muted-foreground">{data.aiCommentary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Suggestions List */}
      {data && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.suggestions.length} Vorschläge für{" "}
              {meal === "mittag" ? "Mittagessen" : "Abendessen"} am{" "}
              {new Date(date).toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Aktualisieren
            </Button>
          </div>

          {data.suggestions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Keine Vorschläge verfügbar. Erstellen Sie zuerst einige Rezepte.</p>
              </CardContent>
            </Card>
          )}

          {data.suggestions.map((suggestion, index) => (
            <Card
              key={suggestion.recipeId}
              className={`border ${getScoreBg(suggestion.score)} transition-all duration-200 hover:shadow-md`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <h3 className="font-heading font-semibold text-base truncate">
                        {suggestion.recipeName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2 ml-8">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.categoryLabel}
                      </Badge>
                      {suggestion.seasonTag && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                          {suggestion.seasonTag}
                        </Badge>
                      )}
                      {suggestion.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs opacity-70">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-0.5 ml-8">
                      {suggestion.reasons.map((reason, i) => (
                        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/80">
                      <Star className={`h-4 w-4 ${getScoreColor(suggestion.score)}`} />
                      <span className={`text-lg font-bold tabular-nums ${getScoreColor(suggestion.score)}`}>
                        {suggestion.score}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToMenuPlan.mutate(suggestion.recipeId)}
                      disabled={addToMenuPlan.isPending}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Hinzufuegen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

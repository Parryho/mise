import { useState, useRef, useCallback } from "react";
import { useApp, type Ingredient } from "@/lib/store";
import { ALLERGENS, type AllergenCode } from "@/lib/i18n";
import { RECIPE_CATEGORIES } from "@shared/schema";
import { UNITS } from "@shared/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Upload, Loader2, Save, Trash2, Plus, AlertTriangle,
  ChefHat, Clock, Users, ArrowLeft, ImageIcon, FileText, CheckCircle2, X,
} from "lucide-react";
import { Link } from "wouter";

// =============================================
// Types
// =============================================

interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  allergens: string[];
  category: string;
  preparationNote: string | null;
}

interface ParsedRecipe {
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  steps: string[];
  category: string;
  allergens: string[];
  ingredients: ParsedIngredient[];
  confidence: number;
}

// =============================================
// Component
// =============================================

export default function RecipeAIImport() {
  const { addRecipe } = useApp();
  const { toast } = useToast();

  // Input state
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Result state
  const [result, setResult] = useState<ParsedRecipe | null>(null);

  // =============================================
  // Image handling
  // =============================================

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Fehler", description: "Bitte nur Bilddateien hochladen.", variant: "destructive" });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Fehler", description: "Bild ist zu groß (max. 20 MB).", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // =============================================
  // AI Analysis
  // =============================================

  const startAnalysis = useCallback(async () => {
    if (!inputText.trim() && !imageBase64) {
      toast({ title: "Fehler", description: "Bitte Rezepttext eingeben oder ein Bild hochladen.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/recipes/ai-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          imageBase64: imageBase64 || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Fehler ${response.status}`);
      }

      const data: ParsedRecipe = await response.json();
      setResult(data);
      toast({ title: "Analyse abgeschlossen", description: `"${data.name}" wurde erkannt.` });
    } catch (error: any) {
      toast({
        title: "KI-Analyse fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, imageBase64, toast]);

  // =============================================
  // Save recipe
  // =============================================

  const saveRecipe = useCallback(async () => {
    if (!result) return;
    setIsSaving(true);

    try {
      const ingredientsList: Ingredient[] = result.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        allergens: ing.allergens as AllergenCode[],
      }));

      await addRecipe({
        name: result.name,
        category: result.category,
        portions: result.servings,
        prepTime: result.prepTime + result.cookTime,
        image: null,
        sourceUrl: null,
        steps: result.steps,
        allergens: result.allergens as AllergenCode[],
        ingredientsList,
      });

      toast({ title: "Rezept gespeichert", description: `"${result.name}" wurde erfolgreich angelegt.` });

      // Reset form
      setResult(null);
      setInputText("");
      removeImage();
    } catch (error: any) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [result, addRecipe, toast, removeImage]);

  // =============================================
  // Result editing helpers
  // =============================================

  const updateField = <K extends keyof ParsedRecipe>(field: K, value: ParsedRecipe[K]) => {
    if (!result) return;
    setResult({ ...result, [field]: value });
  };

  const updateIngredient = (index: number, field: keyof ParsedIngredient, value: any) => {
    if (!result) return;
    const updated = [...result.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setResult({ ...result, ingredients: updated });
  };

  const removeIngredient = (index: number) => {
    if (!result) return;
    const updated = result.ingredients.filter((_, i) => i !== index);
    setResult({ ...result, ingredients: updated });
  };

  const addIngredient = () => {
    if (!result) return;
    const newIngredient: ParsedIngredient = {
      name: "",
      amount: 0,
      unit: "g",
      allergens: [],
      category: "sonstiges",
      preparationNote: null,
    };
    setResult({ ...result, ingredients: [...result.ingredients, newIngredient] });
  };

  const removeStep = (index: number) => {
    if (!result) return;
    const updated = result.steps.filter((_, i) => i !== index);
    setResult({ ...result, steps: updated });
  };

  const updateStep = (index: number, value: string) => {
    if (!result) return;
    const updated = [...result.steps];
    updated[index] = value;
    setResult({ ...result, steps: updated });
  };

  const addStep = () => {
    if (!result) return;
    setResult({ ...result, steps: [...result.steps, ""] });
  };

  const toggleAllergen = (code: string) => {
    if (!result) return;
    const allergens = result.allergens.includes(code)
      ? result.allergens.filter(a => a !== code)
      : [...result.allergens, code];
    setResult({ ...result, allergens });
  };

  const toggleIngredientAllergen = (index: number, code: string) => {
    if (!result) return;
    const ing = result.ingredients[index];
    const allergens = ing.allergens.includes(code)
      ? ing.allergens.filter(a => a !== code)
      : [...ing.allergens, code];
    updateIngredient(index, "allergens", allergens);
  };

  // =============================================
  // Confidence indicator
  // =============================================

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return { label: "Sehr sicher", color: "bg-green-100 text-green-800" };
    if (confidence >= 0.7) return { label: "Sicher", color: "bg-blue-100 text-blue-800" };
    if (confidence >= 0.5) return { label: "Unsicher", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Sehr unsicher", color: "bg-red-100 text-red-800" };
  };

  // =============================================
  // Render: Input view
  // =============================================

  if (!result) {
    return (
      <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/recipes">
            <Button variant="ghost" size="sm" className="shrink-0 gap-1 min-h-[44px]">
              <ArrowLeft className="h-4 w-4" />
              Rezepte
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-heading font-bold">
              KI-Rezeptimport
            </h1>
            <p className="text-xs text-muted-foreground">
              Text einfuegen oder Foto hochladen
            </p>
          </div>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Bild
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-text">Rezepttext</Label>
              <Textarea
                id="recipe-text"
                placeholder={"Wiener Schnitzel\n\nZutaten:\n4 Kalbsschnitzel (je ca. 150 g)\n200 g Mehl\n3 Eier\n300 g Semmelbrösel\nSalz, Pfeffer\nButterschmalz zum Ausbacken\n\nZubereitung:\n1. Schnitzel klopfen und salzen...\n2. In Mehl, Ei und Bröseln panieren...\n3. In heißem Butterschmalz goldbraun ausbacken..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Aus Website, Kochbuch oder Notizen hier einfuegen.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rezeptbild hochladen</Label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Rezeptbild"
                      className="max-h-64 mx-auto rounded-lg object-contain shadow-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Bild entfernen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Tippen um Bild auszuwaehlen
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP (max. 20 MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Analysis button */}
        <Button
          onClick={startAnalysis}
          disabled={isAnalyzing || (!inputText.trim() && !imageBase64)}
          className="w-full gap-2 h-12 text-base"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              KI analysiert...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              KI-Analyse starten
            </>
          )}
        </Button>

        {isAnalyzing && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">Rezept wird analysiert...</p>
                  <p className="text-xs text-muted-foreground">
                    Zutaten, Mengen, Allergene und Kategorie werden automatisch erkannt.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // =============================================
  // Render: Result / Edit view
  // =============================================

  const conf = getConfidenceLabel(result.confidence);
  const categoryObj = RECIPE_CATEGORIES.find(c => c.id === result.category);

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1 min-h-[44px]"
          onClick={() => setResult(null)}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">
            Ergebnis pruefen
          </h1>
          <p className="text-xs text-muted-foreground">
            Pruefen und bei Bedarf korrigieren
          </p>
        </div>
        <Badge className={conf.color}>{conf.label} ({Math.round(result.confidence * 100)}%)</Badge>
      </div>

      {result.confidence < 0.7 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Niedrige Erkennungssicherheit</p>
                <p className="text-xs text-yellow-700">
                  Bitte pruefen Sie alle Felder sorgfaeltig. Einige Werte wurden geschaetzt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Grunddaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Rezeptname</Label>
            <Input
              id="name"
              value={result.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={result.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="servings" className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Portionen
              </Label>
              <Input
                id="servings"
                type="number"
                min={1}
                value={result.servings}
                onChange={(e) => updateField("servings", parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prepTime" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Vorbereitung
              </Label>
              <Input
                id="prepTime"
                type="number"
                min={0}
                value={result.prepTime}
                onChange={(e) => updateField("prepTime", parseInt(e.target.value) || 0)}
                placeholder="Min."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cookTime" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Kochzeit
              </Label>
              <Input
                id="cookTime"
                type="number"
                min={0}
                value={result.cookTime}
                onChange={(e) => updateField("cookTime", parseInt(e.target.value) || 0)}
                placeholder="Min."
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Kategorie</Label>
            <Select
              value={result.category}
              onValueChange={(val) => updateField("category", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECIPE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.symbol} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Allergens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Allergene</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ALLERGENS).map(([code, info]) => {
              const isActive = result.allergens.includes(code);
              return (
                <Badge
                  key={code}
                  variant={isActive ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    isActive ? "bg-red-600 hover:bg-red-700" : "hover:bg-muted"
                  }`}
                  onClick={() => toggleAllergen(code)}
                >
                  {code} - {info.de}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Zutaten ({result.ingredients.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addIngredient} className="gap-1">
              <Plus className="h-4 w-4" />
              Zutat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.ingredients.map((ing, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder="Zutatname"
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(index, "amount", parseFloat(e.target.value) || 0)}
                      placeholder="Menge"
                      className="text-sm h-9 tabular-nums"
                      step="any"
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={ing.unit}
                      onValueChange={(val) => updateIngredient(index, "unit", val)}
                    >
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(UNITS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Ingredient allergens */}
              {ing.allergens.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ing.allergens.map(code => {
                    const allergen = ALLERGENS[code];
                    return allergen ? (
                      <Badge
                        key={code}
                        variant="secondary"
                        className="text-xs cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
                        onClick={() => toggleIngredientAllergen(index, code)}
                      >
                        {code} {allergen.de}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Preparation note */}
              {ing.preparationNote && (
                <p className="text-xs text-muted-foreground italic">
                  {ing.preparationNote}
                </p>
              )}
            </div>
          ))}

          {result.ingredients.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Zutaten erkannt. Fuegen Sie manuell welche hinzu.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Zubereitungsschritte ({result.steps.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addStep} className="gap-1">
              <Plus className="h-4 w-4" />
              Schritt
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-1">
                {index + 1}
              </span>
              <Textarea
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                className="min-h-[40px] text-sm flex-1"
                rows={2}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                onClick={() => removeStep(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {result.steps.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Schritte erkannt. Fuegen Sie manuell welche hinzu.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="sticky bottom-16 bg-background border-t pt-3 -mx-4 px-4 pb-3">
        <Button
          className="w-full gap-2 h-12 text-base"
          size="lg"
          onClick={saveRecipe}
          disabled={isSaving || !result.name.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Rezept speichern
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

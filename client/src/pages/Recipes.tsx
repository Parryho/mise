import { useState, useMemo, useEffect } from "react";
import { useApp, Recipe } from "@/lib/store";
import { ALLERGENS, AllergenCode, useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Users, PlusCircle, Link2, Loader2, ArrowLeft, Camera, FileUp, X, Package } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RECIPE_CATEGORIES } from "@shared/schema";
import RecipeDetailDialog from "@/components/RecipeDetailDialog";
import { getDefaultRecipeImage } from "@/lib/recipe-images";
import { Link } from "wouter";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Use shared categories
const CATEGORIES = RECIPE_CATEGORIES;

export default function Recipes() {
  const { recipes, loading } = useApp();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const debouncedGlobalSearch = useDebounce(globalSearch, 300);

  // Global search results (min 2 characters, searches across all categories)
  const globalSearchResults = useMemo(() => {
    if (debouncedGlobalSearch.length < 2) return [];
    const term = debouncedGlobalSearch.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(term));
  }, [recipes, debouncedGlobalSearch]);

  const isGlobalSearchActive = debouncedGlobalSearch.length >= 2;

  const filteredRecipes = recipes.filter(r => {
    const matchesCategory = selectedCategory ? r.category === selectedCategory : false;
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recipeCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = recipes.filter(r => r.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show global search results
  if (isGlobalSearchActive) {
    return (
      <div className="p-4 space-y-4 pb-24">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-2 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setGlobalSearch("")}
              data-testid="button-clear-search"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-heading font-bold">Suchergebnisse</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchRecipes")}
              className="pl-9 bg-secondary/50 border-0"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              autoFocus
              data-testid="input-global-search"
            />
            {globalSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setGlobalSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {globalSearchResults.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Keine Rezepte gefunden</p>
            <p className="text-sm mt-1">Versuchen Sie einen anderen Suchbegriff</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {globalSearchResults.length} Rezept{globalSearchResults.length !== 1 ? 'e' : ''} gefunden
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {globalSearchResults.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (selectedCategory) {
    const categoryInfo = CATEGORIES.find(c => c.id === selectedCategory);
    return (
      <div className="p-4 space-y-4 pb-24">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-2 space-y-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-back-categories"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-heading font-bold">{categoryInfo?.label}</h1>
            <div className="ml-auto">
              <AddRecipeDialog defaultCategory={selectedCategory} />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("searchRecipes")}
              className="pl-9 bg-secondary/50 border-0" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-recipes"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Keine Rezepte gefunden</p>
              {search ? (
                <p className="text-sm mt-1">Versuchen Sie einen anderen Suchbegriff oder wechseln Sie die Kategorie</p>
              ) : (
                <p className="text-sm mt-1">In dieser Kategorie sind noch keine Rezepte vorhanden</p>
              )}
            </div>
          ) : (
            filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">{t("recipes")}</h1>
        <div className="flex gap-2">
          <Link href="/recipes/ingredients">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Package className="h-3.5 w-3.5" /> Stammdaten
            </Button>
          </Link>
          <AddRecipeDialog />
        </div>
      </div>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Alle Rezepte durchsuchen..."
          className="pl-9 bg-secondary/50 border-0"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          data-testid="input-global-search-main"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 elevation-0 press transition-all duration-200"
            data-testid={`category-${category.id.toLowerCase()}`}
          >
            <span className="text-4xl mb-1">{category.symbol}</span>
            <h3 className="font-heading font-bold text-sm text-center leading-tight">
              {category.label}
            </h3>
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {recipeCounts[category.id] || 0} Rezepte
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddRecipeDialog({ defaultCategory }: { defaultCategory?: string }) {
  const { t, tCat } = useTranslation();
  const { addRecipe, importRecipe } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory || "MainMeat");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // OCR state
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [ocrParsed, setOcrParsed] = useState<any>(null);
  const [ocrCategory, setOcrCategory] = useState<string>("MainMeat");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRecipe({
        name,
        category,
        portions: 1,
        prepTime: 0,
        image: getDefaultRecipeImage(category, name),
        sourceUrl: null,
        steps: [],
        allergens: [],
        ingredientsList: []
      });
      toast({ title: t("save"), description: "Rezept erstellt" });
      setOpen(false);
      setName("");
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    setImporting(true);
    try {
      const recipe = await importRecipe(importUrl);
      toast({
        title: "Import erfolgreich!",
        description: `"${recipe.name}" wurde importiert.`
      });
      setOpen(false);
      setImportUrl("");
    } catch (error: any) {
      toast({
        title: "Import fehlgeschlagen",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleOcrFile = async (file: File) => {
    setOcrProcessing(true);
    setOcrProgress(0);
    setOcrText("");
    setOcrParsed(null);

    try {
      let text: string;

      if (file.type === "application/pdf") {
        const { extractTextFromPdf } = await import("@/lib/ocr");
        text = await extractTextFromPdf(file);
      } else {
        const { extractTextFromImage } = await import("@/lib/ocr");
        text = await extractTextFromImage(file, (p) => setOcrProgress(p));
      }

      setOcrText(text);

      // Parse the text
      const { parseRecipeText } = await import("@/lib/recipeParser");
      const parsed = parseRecipeText(text);
      setOcrParsed(parsed);

      // Auto-categorize
      const { autoCategorize } = await import("@shared/categorizer");
      const detectedCat = autoCategorize(
        parsed.name,
        parsed.ingredients.map((i: any) => i.name),
        parsed.steps
      );
      setOcrCategory(detectedCat);
    } catch (error: any) {
      toast({ title: "OCR fehlgeschlagen", description: error.message, variant: "destructive" });
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleOcrSave = async () => {
    if (!ocrParsed) return;

    try {
      await addRecipe({
        name: ocrParsed.name,
        category: ocrCategory,
        portions: ocrParsed.portions || 4,
        prepTime: ocrParsed.prepTime || 0,
        image: null,
        sourceUrl: null,
        steps: ocrParsed.steps || [],
        allergens: [],
        ingredientsList: ocrParsed.ingredients || []
      });
      toast({ title: "Rezept gespeichert", description: `"${ocrParsed.name}" wurde erstellt.` });
      setOpen(false);
      setOcrText("");
      setOcrParsed(null);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full h-10 w-10 border-primary text-primary hover:bg-primary/10">
          <PlusCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("addRecipe")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import" className="gap-1 text-xs">
              <Link2 className="h-3.5 w-3.5" /> Import
            </TabsTrigger>
            <TabsTrigger value="ocr" className="gap-1 text-xs">
              <Camera className="h-3.5 w-3.5" /> Foto/PDF
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs">Manuell</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4">
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label>Rezept-URL</Label>
                <Input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.chefkoch.de/rezepte/..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unterstützt: Chefkoch.de, Gutekueche.at, Ichkoche.at, Kochrezepte.at und viele mehr
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={importing || !importUrl}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                {importing ? "Importiere..." : "Rezept importieren"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="ocr" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {!ocrParsed && !ocrProcessing && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Foto aufnehmen oder auswählen</Label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrFile(file);
                          }}
                        />
                        <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Kamera / Bild</span>
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrFile(file);
                          }}
                        />
                        <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
                          <FileUp className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">PDF</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fotografieren Sie ein Rezept oder laden Sie ein PDF hoch. Der Text wird automatisch erkannt und in ein Rezept umgewandelt.
                  </p>
                </div>
              )}

              {ocrProcessing && (
                <div className="text-center py-8 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Text wird erkannt...</p>
                  {ocrProgress > 0 && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {ocrParsed && !ocrProcessing && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Erkannter Name</Label>
                    <Input
                      value={ocrParsed.name}
                      onChange={(e) => setOcrParsed({ ...ocrParsed, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kategorie (automatisch erkannt)</Label>
                    <Select value={ocrCategory} onValueChange={setOcrCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.symbol} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Portionen</Label>
                      <Input
                        type="number"
                        value={ocrParsed.portions}
                        onChange={(e) => setOcrParsed({ ...ocrParsed, portions: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Zeit (Min)</Label>
                      <Input
                        type="number"
                        value={ocrParsed.prepTime}
                        onChange={(e) => setOcrParsed({ ...ocrParsed, prepTime: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {ocrParsed.ingredients.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">Erkannte Zutaten ({ocrParsed.ingredients.length})</Label>
                      <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs space-y-1">
                        {ocrParsed.ingredients.map((ing: any, i: number) => (
                          <div key={i} className="text-muted-foreground">
                            {ing.amount} {ing.unit} {ing.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ocrParsed.steps.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">Erkannte Schritte ({ocrParsed.steps.length})</Label>
                      <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs space-y-1">
                        {ocrParsed.steps.map((step: string, i: number) => (
                          <div key={i} className="text-muted-foreground">
                            {i + 1}. {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ocrText && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Rohtext anzeigen</summary>
                      <pre className="mt-1 p-2 bg-secondary rounded text-[10px] max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {ocrText}
                      </pre>
                    </details>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleOcrSave} className="flex-1">
                      Rezept speichern
                    </Button>
                    <Button variant="outline" onClick={() => { setOcrParsed(null); setOcrText(""); }}>
                      Zurück
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("recipeName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{t("save")}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const categoryLabel = CATEGORIES.find(c => c.id === recipe.category)?.label || recipe.category;

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 press border-border/50 group"
        data-testid={`recipe-card-${recipe.id}`}
        onClick={() => setDialogOpen(true)}
      >
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={recipe.image || getDefaultRecipeImage(recipe.category, recipe.name)}
            alt={recipe.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 text-white">
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 mb-1.5 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
              {categoryLabel}
            </Badge>
            <h3 className="font-heading font-bold text-lg leading-tight drop-shadow-md line-clamp-2">{recipe.name}</h3>
          </div>
        </div>
        <CardContent className="px-3 py-2.5 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {recipe.prepTime}m</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {recipe.portions}p</span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {recipe.allergens.length > 0 ? recipe.allergens.slice(0, 5).map(code => (
              <span key={code} className="w-5 h-5 rounded-full bg-destructive/10 text-destructive text-[10px] flex items-center justify-center font-bold border border-destructive/20 font-mono" title={ALLERGENS[code as AllergenCode]?.[lang]}>
                {code}
              </span>
            )) : <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{t("noAllergens")}</span>}
            {recipe.allergens.length > 5 && (
              <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center font-bold font-mono">
                +{recipe.allergens.length - 5}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
      <RecipeDetailDialog recipe={recipe} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

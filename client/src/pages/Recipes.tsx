import { useState, useMemo, useEffect } from "react";
import { useApp, Recipe } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { ALLERGENS, AllergenCode } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Users, PlusCircle, Link2, Loader2, ArrowLeft, Camera, FileUp, X, UtensilsCrossed } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RECIPE_CATEGORIES } from "@shared/schema";
import RecipeDetailDialog from "@/components/RecipeDetailDialog";
import { getDefaultRecipeImage, getPlaceholderImage } from "@/lib/recipe-images";


// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}


export default function Recipes() {
  const { recipes, loading } = useApp();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchIngredients, setSearchIngredients] = useState(false);
  const [ingredientResults, setIngredientResults] = useState<Recipe[]>([]);
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const debouncedGlobalSearch = useDebounce(globalSearch, 300);

  // Ingredient search: fetch from server
  useEffect(() => {
    if (!searchIngredients || debouncedGlobalSearch.length < 2) {
      setIngredientResults([]);
      return;
    }
    let cancelled = false;
    setIngredientLoading(true);
    apiFetch<Recipe[]>(`/api/recipes?q=${encodeURIComponent(debouncedGlobalSearch)}&searchIngredients=true`)
      .then(data => { if (!cancelled) setIngredientResults(data); })
      .catch(() => { if (!cancelled) setIngredientResults([]); })
      .finally(() => { if (!cancelled) setIngredientLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedGlobalSearch, searchIngredients]);

  // Global search results (min 2 characters, searches across all categories)
  const globalSearchResults = useMemo(() => {
    if (searchIngredients) return ingredientResults;
    if (debouncedGlobalSearch.length < 2) return [];
    const term = debouncedGlobalSearch.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(term));
  }, [recipes, debouncedGlobalSearch, searchIngredients, ingredientResults]);

  const isGlobalSearchActive = debouncedGlobalSearch.length >= 2;

  const filteredRecipes = recipes.filter(r => {
    const matchesCategory = selectedCategory ? r.category === selectedCategory : false;
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recipeCounts = RECIPE_CATEGORIES.reduce((acc, cat) => {
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
            <h1 className="text-2xl font-heading font-bold">{t("recipes.searchResults")}</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchIngredients ? t("recipes.searchIngredient") : t("recipes.searchRecipes")}
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
            <Button
              variant={searchIngredients ? "default" : "outline"}
              size="icon"
              className="shrink-0 h-10 w-10"
              onClick={() => setSearchIngredients(!searchIngredients)}
              title={t("recipes.ingredientSearch")}
            >
              <UtensilsCrossed className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {ingredientLoading && searchIngredients ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : globalSearchResults.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">{t("recipes.noRecipesFound")}</p>
            <p className="text-sm mt-1">{t("recipes.tryDifferentSearch")}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("recipes.recipesFound", { count: globalSearchResults.length })}
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
    const categoryInfo = RECIPE_CATEGORIES.find(c => c.id === selectedCategory);
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
              placeholder={t("recipes.searchRecipes")}
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
              <p className="font-medium">{t("recipes.noRecipesFound")}</p>
              {search ? (
                <p className="text-sm mt-1">{t("recipes.tryDifferentSearchOrCategory")}</p>
              ) : (
                <p className="text-sm mt-1">{t("recipes.noCategoryRecipes")}</p>
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
    <div className="pb-24">
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-xl font-bold uppercase tracking-wide">{t("recipes.title")}</h1>
          <AddRecipeDialog />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Global Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={searchIngredients ? t("recipes.searchIngredient") : t("recipes.searchRecipes")}
              className="pl-10 h-12 text-base bg-secondary/50 border-border"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              data-testid="input-global-search-main"
            />
          </div>
          <Button
            variant={searchIngredients ? "default" : "outline"}
            size="icon"
            className="shrink-0 h-12 w-12"
            onClick={() => setSearchIngredients(!searchIngredients)}
            title={t("recipes.ingredientSearch")}
          >
            <UtensilsCrossed className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {RECIPE_CATEGORIES.map((category) => (
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
                {t("recipes.recipeCount", { count: recipeCounts[category.id] || 0 })}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddRecipeDialog({ defaultCategory }: { defaultCategory?: string }) {
  const { t } = useTranslation();
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
        image: null,
        sourceUrl: null,
        steps: [],
        allergens: [],
        ingredientsList: []
      });
      toast({ title: t("common.save"), description: t("recipes.recipeCreated") });
      setOpen(false);
      setName("");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    setImporting(true);
    try {
      const recipe = await importRecipe(importUrl);
      toast({
        title: t("recipes.importSuccess"),
        description: t("recipes.importSuccessDesc", { name: recipe.name })
      });
      setOpen(false);
      setImportUrl("");
    } catch (error: any) {
      toast({
        title: t("recipes.importFailed"),
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
      toast({ title: t("recipes.ocrFailed"), description: error.message, variant: "destructive" });
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
      toast({ title: t("recipes.recipeSaved"), description: t("recipes.recipeSavedDesc", { name: ocrParsed.name }) });
      setOpen(false);
      setOcrText("");
      setOcrParsed(null);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 border-primary text-primary hover:bg-primary/10">
          <PlusCircle className="h-4 w-4" /> {t("common.new")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("recipes.addRecipe")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import" className="gap-1 text-xs">
              <Link2 className="h-3.5 w-3.5" /> {t("common.import")}
            </TabsTrigger>
            <TabsTrigger value="ocr" className="gap-1 text-xs">
              <Camera className="h-3.5 w-3.5" /> {t("recipes.photoOrPdf")}
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs">{t("common.manual")}</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4">
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("recipes.recipeUrl")}</Label>
                <Input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.chefkoch.de/rezepte/..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("recipes.supportedSites")}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={importing || !importUrl}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                {importing ? t("recipes.importing") : t("recipes.importRecipe")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="ocr" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {!ocrParsed && !ocrProcessing && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("recipes.takePhotoOrSelect")}</Label>
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
                          <span className="text-sm text-muted-foreground">{t("recipes.cameraOrImage")}</span>
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
                    {t("recipes.ocrDescription")}
                  </p>
                </div>
              )}

              {ocrProcessing && (
                <div className="text-center py-8 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">{t("recipes.recognizing")}</p>
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
                    <Label>{t("recipes.recognizedName")}</Label>
                    <Input
                      value={ocrParsed.name}
                      onChange={(e) => setOcrParsed({ ...ocrParsed, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("recipes.categoryAutoDetected")}</Label>
                    <Select value={ocrCategory} onValueChange={setOcrCategory}>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("recipes.portions")}</Label>
                      <Input
                        type="number"
                        value={ocrParsed.portions}
                        onChange={(e) => setOcrParsed({ ...ocrParsed, portions: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("recipes.timeMinutes")}</Label>
                      <Input
                        type="number"
                        value={ocrParsed.prepTime}
                        onChange={(e) => setOcrParsed({ ...ocrParsed, prepTime: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {ocrParsed.ingredients.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("recipes.recognizedIngredients")} ({ocrParsed.ingredients.length})</Label>
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
                      <Label className="text-xs">{t("recipes.recognizedSteps")} ({ocrParsed.steps.length})</Label>
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
                      <summary className="cursor-pointer text-muted-foreground">{t("recipes.showRawText")}</summary>
                      <pre className="mt-1 p-2 bg-secondary rounded text-[10px] max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {ocrText}
                      </pre>
                    </details>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleOcrSave} className="flex-1">
                      {t("recipes.saveRecipe")}
                    </Button>
                    <Button variant="outline" onClick={() => { setOcrParsed(null); setOcrText(""); }}>
                      {t("common.back")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("recipes.recipeName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("recipes.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{t("common.save")}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t, i18n } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const categoryLabel = RECIPE_CATEGORIES.find(c => c.id === recipe.category)?.label || recipe.category;

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
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getPlaceholderImage(recipe.category); }}
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
              <span key={code} className="w-5 h-5 rounded-full bg-destructive/10 text-destructive text-[10px] flex items-center justify-center font-bold border border-destructive/20 font-mono" title={ALLERGENS[code as AllergenCode]?.[i18n.language]}>
                {code}
              </span>
            )) : (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                recipe.allergenStatus === 'verified'
                  ? 'text-status-success bg-status-success-subtle'
                  : 'text-muted-foreground bg-muted'
              }`}>{recipe.allergenStatus === 'verified' ? t("recipes.noAllergens") : '?'}</span>
            )}
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

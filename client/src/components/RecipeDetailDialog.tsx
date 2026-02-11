import { useState, useEffect } from "react";
import { Recipe, Ingredient, useApp } from "@/lib/store";
import { ALLERGENS, AllergenCode } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ExternalLink, Loader2, Trash2, Pencil, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RECIPE_CATEGORIES } from "@shared/schema";
import RecipeMediaGallery from "@/components/RecipeMediaGallery";
import { getDefaultRecipeImage, getPlaceholderImage } from "@/lib/recipe-images";
import RecipeMediaUpload from "@/components/RecipeMediaUpload";

interface RecipeDetailDialogProps {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, hide edit/delete buttons (read-only mode for print page etc.) */
  readOnly?: boolean;
}

export default function RecipeDetailDialog({ recipe, open, onOpenChange, readOnly }: RecipeDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "de" | "en";
  const { deleteRecipe, updateRecipe } = useApp();
  const { toast } = useToast();
  const [portions, setPortions] = useState(recipe.portions);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [editName, setEditName] = useState(recipe.name);
  const [editCategory, setEditCategory] = useState(recipe.category);
  const [editPortions, setEditPortions] = useState(String(recipe.portions));
  const [editPrepTime, setEditPrepTime] = useState(String(recipe.prepTime));
  const [editSteps, setEditSteps] = useState(recipe.steps.join('\n'));
  const [editAllergens, setEditAllergens] = useState<string[]>(recipe.allergens);
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);

  const categoryLabel = t(`recipes.categories.${recipe.category}`) || RECIPE_CATEGORIES.find(c => c.id === recipe.category)?.label || recipe.category;

  useEffect(() => {
    if (open) {
      setIngredients([]);
      loadIngredients();
      setPortions(recipe.portions);
    } else {
      setEditMode(false);
    }
  }, [open, recipe.id]);

  const loadIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const data = await apiFetch<Ingredient[]>(`/api/recipes/${recipe.id}/ingredients`);
      setIngredients(data);
      setEditIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("recipes.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast({ title: t("recipes.deleted"), description: t("recipes.deletedDesc", { name: recipe.name }) });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = () => {
    setEditName(recipe.name);
    setEditCategory(recipe.category);
    setEditPortions(String(recipe.portions));
    setEditPrepTime(String(recipe.prepTime));
    setEditSteps(recipe.steps.join('\n'));
    setEditAllergens([...recipe.allergens]);
    setEditIngredients([...ingredients]);
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRecipe(recipe.id, {
        name: editName,
        category: editCategory,
        portions: parseInt(editPortions) || 1,
        prepTime: parseInt(editPrepTime) || 0,
        steps: editSteps.split('\n').filter(s => s.trim()),
        allergens: editAllergens as any,
        ingredientsList: editIngredients
      });
      toast({ title: t("common.saved") });
      setEditMode(false);
      const data = await apiFetch<Ingredient[]>(`/api/recipes/${recipe.id}/ingredients`);
      setIngredients(data);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    setEditIngredients([...editIngredients, { name: "", amount: 1, unit: "g", allergens: [] }]);
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: any) => {
    const updated = [...editIngredients];
    (updated[idx] as any)[field] = value;
    setEditIngredients(updated);
  };

  const removeIngredient = (idx: number) => {
    setEditIngredients(editIngredients.filter((_, i) => i !== idx));
  };

  const toggleAllergen = (code: string) => {
    if (editAllergens.includes(code)) {
      setEditAllergens(editAllergens.filter(a => a !== code));
    } else {
      setEditAllergens([...editAllergens, code]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="relative h-48 shrink-0">
          <img
            src={recipe.image || getDefaultRecipeImage(recipe.category, recipe.name)}
            alt={recipe.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getPlaceholderImage(recipe.category); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="mb-2 bg-primary text-primary-foreground border-none shadow-sm">{categoryLabel}</Badge>
            <h2 className="text-2xl font-heading font-bold text-foreground drop-shadow-sm">{recipe.name}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!readOnly && (
            <div className="flex gap-2 flex-wrap items-center">
              {!editMode && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                  </Button>
                  {recipe.sourceUrl && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> {t("recipes.source")}
                      </a>
                    </Button>
                  )}
                  <div className="ml-auto">
                    <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </>
              )}
              {editMode && (
                <>
                  <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} {t("common.save")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>{t("common.cancel")}</Button>
                </>
              )}
            </div>
          )}

          {editMode && !readOnly ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("common.name")}</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>{t("recipes.category")}</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{t(`recipes.categories.${cat.id}`) || cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("recipes.portions")}</Label>
                  <Input type="number" value={editPortions} onChange={(e) => setEditPortions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("recipes.prepTime")}</Label>
                  <Input type="number" value={editPrepTime} onChange={(e) => setEditPrepTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("recipes.allergens")} (A-R)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(ALLERGENS).map(alg => (
                    <Badge
                      key={alg.code}
                      variant={editAllergens.includes(alg.code) ? "destructive" : "outline"}
                      className="cursor-pointer min-h-[36px] min-w-[36px] px-2.5 text-sm flex items-center justify-center"
                      onClick={() => toggleAllergen(alg.code)}
                    >
                      {alg.code}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{t("recipes.ingredients")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addIngredient}>
                    <Plus className="h-3 w-3 mr-1" /> {t("recipes.ingredient")}
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <Input
                        className="w-20 text-sm h-10"
                        type="number"
                        step="0.1"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder={t("recipes.amount")}
                      />
                      <Input
                        className="w-16 text-sm h-10"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        placeholder={t("recipes.unit")}
                      />
                      <Input
                        className="flex-1 text-sm h-10"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        placeholder={t("recipes.ingredient")}
                      />
                      <Button type="button" size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={() => removeIngredient(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("recipes.preparation")} ({t("recipes.onePerLine")})</Label>
                <Textarea
                  value={editSteps}
                  onChange={(e) => setEditSteps(e.target.value)}
                  rows={6}
                  placeholder="Schritt 1&#10;Schritt 2&#10;Schritt 3"
                />
              </div>

              {/* Recipe Media Upload (edit mode) */}
              <RecipeMediaUpload
                recipeId={recipe.id}
                steps={editSteps.split('\n').filter(s => s.trim())}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border">
                <span className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> {t("recipes.portions")}
                </span>
                <div className="flex items-center gap-2 bg-background rounded-md border border-border p-1">
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setPortions(Math.max(1, portions - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="font-mono font-bold w-8 text-center text-lg">{portions}</span>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setPortions(portions + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-heading font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{t("recipes.allergens")}</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.length > 0 ? recipe.allergens.map(code => (
                    <Badge key={code} variant="destructive" className="flex items-center gap-1 font-mono">
                      <span className="font-bold bg-white/20 px-1 rounded mr-1">{code}</span>
                      {ALLERGENS[code as AllergenCode]?.[lang]}
                    </Badge>
                  )) : (
                    <Badge variant="outline" className={
                      recipe.allergenStatus === 'verified'
                        ? "text-status-success border-status-success/20 bg-status-success-subtle"
                        : "text-muted-foreground border-border bg-muted"
                    }>
                      {t("recipes.noAllergens")}
                    </Badge>
                  )}
                </div>
                {recipe.allergenStatus === 'auto' && (
                  <p className="text-xs text-status-warning flex items-center gap-1 mt-1.5">
                    <AlertTriangle className="h-3 w-3" /> {t("recipes.autoDetected")}
                  </p>
                )}
                {recipe.allergenStatus === 'verified' && (
                  <p className="text-xs text-status-success flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="h-3 w-3" /> {t("recipes.verified")}
                  </p>
                )}
              </div>

              {recipe.tags && recipe.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-heading font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("recipes.ingredients")}</h3>
                {loadingIngredients ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ul className="text-sm divide-y divide-border/50">
                    {ingredients.map((ing, idx) => {
                      const scaledAmount = (ing.amount / recipe.portions) * portions;
                      return (
                        <li key={idx} className="flex justify-between items-center py-2 px-2 -mx-2 rounded hover:bg-secondary/30 transition-colors">
                          <span className="text-foreground">{ing.name}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {ing.allergens?.map(code => (
                              <span key={code} className="text-[10px] text-destructive font-bold px-1 border border-destructive/30 rounded font-mono" title={ALLERGENS[code as AllergenCode]?.[lang]}>
                                {code}
                              </span>
                            ))}
                            <span className="font-mono font-medium text-foreground tabular-nums">
                              {Number.isInteger(scaledAmount) ? scaledAmount : scaledAmount.toFixed(1)} {ing.unit}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                    {ingredients.length === 0 && !loadingIngredients && (
                      <li className="text-muted-foreground text-center py-4">{t("common.noData")}</li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("recipes.preparation")}</h3>
                <ol className="space-y-3">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
                    </li>
                  ))}
                  {recipe.steps.length === 0 && (
                    <li className="text-muted-foreground text-center py-2">{t("common.noData")}</li>
                  )}
                </ol>
              </div>

              {/* Recipe Media Gallery (read mode) */}
              <RecipeMediaGallery recipeId={recipe.id} steps={recipe.steps} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

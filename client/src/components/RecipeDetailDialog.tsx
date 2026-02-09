import { useState, useEffect } from "react";
import { Recipe, Ingredient, useApp } from "@/lib/store";
import { ALLERGENS, AllergenCode, useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ExternalLink, Loader2, Trash2, Pencil, Download, FileText, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RECIPE_CATEGORIES } from "@shared/schema";
import RecipeMediaGallery from "@/components/RecipeMediaGallery";
import { getDefaultRecipeImage } from "@/lib/recipe-images";
import RecipeMediaUpload from "@/components/RecipeMediaUpload";

const CATEGORIES = RECIPE_CATEGORIES;

interface RecipeDetailDialogProps {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, hide edit/delete buttons (read-only mode for print page etc.) */
  readOnly?: boolean;
}

export default function RecipeDetailDialog({ recipe, open, onOpenChange, readOnly }: RecipeDetailDialogProps) {
  const { t, lang } = useTranslation();
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

  const categoryLabel = CATEGORIES.find(c => c.id === recipe.category)?.label || recipe.category;

  useEffect(() => {
    if (open) {
      loadIngredients();
      setPortions(recipe.portions);
    } else {
      setEditMode(false);
    }
  }, [open, recipe.id]);

  const loadIngredients = async () => {
    if (ingredients.length > 0) return;
    setLoadingIngredients(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/ingredients`);
      const data = await res.json();
      setIngredients(data);
      setEditIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Rezept wirklich löschen?")) return;
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast({ title: "Rezept gelöscht", description: `"${recipe.name}" wurde entfernt.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
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
      toast({ title: "Rezept gespeichert" });
      setEditMode(false);
      const res = await fetch(`/api/recipes/${recipe.id}/ingredients`);
      const data = await res.json();
      setIngredients(data);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
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

  const exportRecipe = (format: 'pdf' | 'docx') => {
    window.open(`/api/recipes/${recipe.id}/export/${format}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="relative h-48 shrink-0">
          <img
            src={recipe.image || getDefaultRecipeImage(recipe.category, recipe.name)}
            alt={recipe.name}
            className="w-full h-full object-cover"
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
                    <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportRecipe('pdf')}>
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportRecipe('docx')}>
                    <FileText className="h-3.5 w-3.5" /> DOCX
                  </Button>
                  {recipe.sourceUrl && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Website
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
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Speichern
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Abbrechen</Button>
                </>
              )}
            </div>
          )}

          {editMode && !readOnly ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Portionen</Label>
                  <Input type="number" value={editPortions} onChange={(e) => setEditPortions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Zeit (Min)</Label>
                  <Input type="number" value={editPrepTime} onChange={(e) => setEditPrepTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("allergens")} (A-N)</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.values(ALLERGENS).map(alg => (
                    <Badge
                      key={alg.code}
                      variant={editAllergens.includes(alg.code) ? "destructive" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleAllergen(alg.code)}
                    >
                      {alg.code}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{t("ingredients")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addIngredient}>
                    <Plus className="h-3 w-3 mr-1" /> Zutat
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-1 items-center">
                      <Input
                        className="w-16 text-xs h-8"
                        type="number"
                        step="0.1"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Menge"
                      />
                      <Input
                        className="w-14 text-xs h-8"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        placeholder="Einheit"
                      />
                      <Input
                        className="flex-1 text-xs h-8"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        placeholder="Zutat"
                      />
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeIngredient(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("preparation")} (eine pro Zeile)</Label>
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
                  <Users className="h-4 w-4" /> {t("portions")}
                </span>
                <div className="flex items-center gap-3 bg-background rounded-md border border-border p-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPortions(Math.max(1, portions - 1))}><Minus className="h-3 w-3" /></Button>
                  <span className="font-mono font-bold w-6 text-center">{portions}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPortions(portions + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-heading font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{t("allergens")}</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.length > 0 ? recipe.allergens.map(code => (
                    <Badge key={code} variant="destructive" className="flex items-center gap-1 font-mono">
                      <span className="font-bold bg-white/20 px-1 rounded mr-1">{code}</span>
                      {ALLERGENS[code as AllergenCode]?.[lang]}
                    </Badge>
                  )) : <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">{t("noAllergens")}</Badge>}
                </div>
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
                <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("ingredients")}</h3>
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
                      <li className="text-muted-foreground text-center py-4">{t("noData")}</li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("preparation")}</h3>
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
                    <li className="text-muted-foreground text-center py-2">{t("noData")}</li>
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

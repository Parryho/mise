import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp, type Recipe } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wand2, Save } from "lucide-react";
import { CUISINE_TYPES, FLAVOR_PROFILES, DISH_TYPES } from "@shared/constants";
import { RECIPE_CATEGORIES } from "@shared/schema";

const NONE = "__none__";

type TagField = "cuisineType" | "flavorProfile" | "dishType";
type ChangeMap = Map<number, Partial<Record<TagField, string | null>>>;

export default function BulkTagEditor() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { recipes, refetch } = useApp();
  const { toast } = useToast();

  const [changes, setChanges] = useState<ChangeMap>(new Map());
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(NONE);
  const [saving, setSaving] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);

  const taggedCount = useMemo(
    () => recipes.filter((r) => r.cuisineType && r.flavorProfile && r.dishType).length,
    [recipes],
  );

  const filtered = useMemo(() => {
    let list = recipes;
    if (showUntaggedOnly) {
      list = list.filter((r) => !r.cuisineType || !r.flavorProfile || !r.dishType);
    }
    if (categoryFilter !== NONE) {
      list = list.filter((r) => r.category === categoryFilter);
    }
    return list;
  }, [recipes, showUntaggedOnly, categoryFilter]);

  const getValue = useCallback(
    (recipe: Recipe, field: TagField): string => {
      const pending = changes.get(recipe.id);
      if (pending && field in pending) {
        return pending[field] ?? NONE;
      }
      return (recipe[field] as string) ?? NONE;
    },
    [changes],
  );

  const handleChange = useCallback(
    (recipeId: number, field: TagField, value: string) => {
      setChanges((prev) => {
        const next = new Map(prev);
        const existing = next.get(recipeId) || {};
        const resolved = value === NONE ? null : value;
        // Find original recipe to check if this is actually a change
        const recipe = recipes.find((r) => r.id === recipeId);
        const original = (recipe?.[field] as string) ?? null;
        if (resolved === original) {
          // Remove field from changes if it matches original
          const { [field]: _, ...rest } = existing;
          if (Object.keys(rest).length === 0) {
            next.delete(recipeId);
          } else {
            next.set(recipeId, rest);
          }
        } else {
          next.set(recipeId, { ...existing, [field]: resolved });
        }
        return next;
      });
    },
    [recipes],
  );

  const handleSave = async () => {
    if (changes.size === 0) return;
    setSaving(true);
    try {
      const updates = Array.from(changes.entries()).map(([id, fields]) => ({
        id,
        ...fields,
      }));
      const result = await apiPost<{ updated: number }>("/api/recipes/bulk-tags", { updates });
      toast({ title: t("tagEditor.saveSuccess", { count: result.updated }) });
      setChanges(new Map());
      await refetch();
    } catch (e: any) {
      toast({ title: t("tagEditor.saveError"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoTag = async () => {
    setAutoTagging(true);
    try {
      const stats = await apiPost<{ tagged: { cuisine: number; flavor: number; dishType: number } }>(
        "/api/recipes/auto-tag",
        {},
      );
      toast({
        title: t("tagEditor.autoTagSuccess", {
          cuisine: stats.tagged.cuisine,
          flavor: stats.tagged.flavor,
          dishType: stats.tagged.dishType,
        }),
      });
      setChanges(new Map());
      await refetch();
    } catch (e: any) {
      toast({ title: t("tagEditor.autoTagError"), description: e.message, variant: "destructive" });
    } finally {
      setAutoTagging(false);
    }
  };

  const catLabel = (cat: string) => RECIPE_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/recipes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{t("tagEditor.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("tagEditor.taggedOf", { tagged: taggedCount, total: recipes.length })}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant={showUntaggedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowUntaggedOnly(!showUntaggedOnly)}
        >
          {showUntaggedOnly ? t("tagEditor.showUntaggedOnly") : t("tagEditor.showAll")}
        </Button>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder={t("tagEditor.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("tagEditor.allCategories")}</SelectItem>
            {RECIPE_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.symbol} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleAutoTag} disabled={autoTagging}>
          <Wand2 className="h-4 w-4 mr-1" />
          {autoTagging ? t("tagEditor.autoTagRunning") : t("tagEditor.autoTag")}
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={changes.size === 0 || saving}
        >
          <Save className="h-4 w-4 mr-1" />
          {saving
            ? t("tagEditor.saving")
            : changes.size > 0
              ? t("tagEditor.saveCount", { count: changes.size })
              : t("tagEditor.saveAll")}
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t("tagEditor.noRecipes")}</p>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">{t("tagEditor.recipe")}</th>
                <th className="text-left p-2 font-medium w-[80px]">{t("tagEditor.category")}</th>
                <th className="text-left p-2 font-medium w-[150px]">{t("tagEditor.cuisine")}</th>
                <th className="text-left p-2 font-medium w-[150px]">{t("tagEditor.flavor")}</th>
                <th className="text-left p-2 font-medium w-[170px]">{t("tagEditor.dishType")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((recipe) => {
                const hasChange = changes.has(recipe.id);
                return (
                  <tr
                    key={recipe.id}
                    className={`border-b last:border-0 ${hasChange ? "bg-primary/5" : ""}`}
                  >
                    <td className="p-2 truncate max-w-[200px]" title={recipe.name}>
                      {recipe.name}
                    </td>
                    <td className="p-2 text-muted-foreground text-xs truncate">
                      {catLabel(recipe.category)}
                    </td>
                    <td className="p-2">
                      <TagSelect
                        value={getValue(recipe, "cuisineType")}
                        options={CUISINE_TYPES}
                        labelKey="cuisineTypes"
                        t={t}
                        onChange={(v) => handleChange(recipe.id, "cuisineType", v)}
                      />
                    </td>
                    <td className="p-2">
                      <TagSelect
                        value={getValue(recipe, "flavorProfile")}
                        options={FLAVOR_PROFILES}
                        labelKey="flavorProfiles"
                        t={t}
                        onChange={(v) => handleChange(recipe.id, "flavorProfile", v)}
                      />
                    </td>
                    <td className="p-2">
                      <TagSelect
                        value={getValue(recipe, "dishType")}
                        options={DISH_TYPES}
                        labelKey="dishTypes"
                        t={t}
                        onChange={(v) => handleChange(recipe.id, "dishType", v)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Inline select for a single tag field */
function TagSelect({
  value,
  options,
  labelKey,
  t,
  onChange,
}: {
  value: string;
  options: Record<string, { de: string; en: string }>;
  labelKey: string;
  t: (key: string) => string;
  onChange: (val: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder={t("tagEditor.noSelection")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{t("tagEditor.noSelection")}</SelectItem>
        {Object.keys(options).map((key) => (
          <SelectItem key={key} value={key}>
            {t(`tagEditor.${labelKey}.${key}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

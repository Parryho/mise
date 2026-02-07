import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Pencil, Trash2, Search, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface MasterIngredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  priceUnit: string;
  supplier: string | null;
  createdAt: string;
}

const INGREDIENT_CATEGORIES = [
  { id: "fleisch", label: "Fleisch" },
  { id: "fisch", label: "Fisch" },
  { id: "gemuese", label: "Gemüse" },
  { id: "obst", label: "Obst" },
  { id: "milchprodukte", label: "Milchprodukte" },
  { id: "getreide", label: "Getreide/Mehl" },
  { id: "gewuerze", label: "Gewürze" },
  { id: "oele", label: "Öle/Fette" },
  { id: "konserven", label: "Konserven" },
  { id: "tiefkuehl", label: "Tiefkühl" },
  { id: "sonstiges", label: "Sonstiges" },
];

const UNITS = ["g", "kg", "ml", "l", "Stk", "Bund", "Pkg", "Dose"];
const PRICE_UNITS = ["kg", "l", "Stk", "Pkg", "100g"];

export default function MasterIngredients() {
  const [items, setItems] = useState<MasterIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/master-ingredients");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch master ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || item.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, catFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm("Zutat wirklich löschen?")) return;
    try {
      await fetch(`/api/master-ingredients/${id}`, { method: "DELETE" });
      toast({ title: "Gelöscht" });
      fetchItems();
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    }
  };

  const getCategoryLabel = (catId: string) => {
    return INGREDIENT_CATEGORIES.find(c => c.id === catId)?.label || catId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/recipes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">Zutatenstammdaten</h1>
          <p className="text-xs text-muted-foreground">{items.length} Zutaten mit Preisen</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowAdd(true)}>
          <PlusCircle className="h-4 w-4" /> Neu
        </Button>
      </div>

      {/* Search + filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zutat suchen..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={catFilter === "all" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => setCatFilter("all")}
          >
            Alle ({items.length})
          </Button>
          {INGREDIENT_CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.id).length;
            if (count === 0) return null;
            return (
              <Button
                key={cat.id}
                variant={catFilter === cat.id ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => setCatFilter(cat.id)}
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {items.length === 0 ? "Keine Zutatenstammdaten vorhanden." : "Keine Ergebnisse."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Card key={item.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] py-0">{getCategoryLabel(item.category)}</Badge>
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                    {item.pricePerUnit > 0 && (
                      <span className="text-xs font-mono text-green-700">
                        {item.pricePerUnit.toFixed(2)}€/{item.priceUnit}
                      </span>
                    )}
                    {item.supplier && (
                      <span className="text-xs text-muted-foreground truncate">{item.supplier}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <EditIngredientDialog item={item} onSave={fetchItems} />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddIngredientDialog open={showAdd} onOpenChange={setShowAdd} onSave={() => { setShowAdd(false); fetchItems(); }} />
    </div>
  );
}

function AddIngredientDialog({ open, onOpenChange, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("sonstiges");
  const [unit, setUnit] = useState("g");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [priceUnit, setPriceUnit] = useState("kg");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name erforderlich", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/master-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          unit,
          pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : 0,
          priceUnit,
          supplier: supplier.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: "Zutat erstellt" });
      setName("");
      setPricePerUnit("");
      setSupplier("");
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Neue Zutat</DialogTitle>
        </DialogHeader>
        <IngredientForm
          name={name} setName={setName}
          category={category} setCategory={setCategory}
          unit={unit} setUnit={setUnit}
          pricePerUnit={pricePerUnit} setPricePerUnit={setPricePerUnit}
          priceUnit={priceUnit} setPriceUnit={setPriceUnit}
          supplier={supplier} setSupplier={setSupplier}
          saving={saving}
          onSubmit={handleSubmit}
          submitLabel="Erstellen"
        />
      </DialogContent>
    </Dialog>
  );
}

function EditIngredientDialog({ item, onSave }: { item: MasterIngredient; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [unit, setUnit] = useState(item.unit);
  const [pricePerUnit, setPricePerUnit] = useState(String(item.pricePerUnit || ""));
  const [priceUnit, setPriceUnit] = useState(item.priceUnit);
  const [supplier, setSupplier] = useState(item.supplier || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/master-ingredients/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          unit,
          pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : 0,
          priceUnit,
          supplier: supplier.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: "Gespeichert" });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Zutat bearbeiten</DialogTitle>
        </DialogHeader>
        <IngredientForm
          name={name} setName={setName}
          category={category} setCategory={setCategory}
          unit={unit} setUnit={setUnit}
          pricePerUnit={pricePerUnit} setPricePerUnit={setPricePerUnit}
          priceUnit={priceUnit} setPriceUnit={setPriceUnit}
          supplier={supplier} setSupplier={setSupplier}
          saving={saving}
          onSubmit={handleSubmit}
          submitLabel="Speichern"
        />
      </DialogContent>
    </Dialog>
  );
}

function IngredientForm({ name, setName, category, setCategory, unit, setUnit, pricePerUnit, setPricePerUnit, priceUnit, setPriceUnit, supplier, setSupplier, saving, onSubmit, submitLabel }: {
  name: string; setName: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  pricePerUnit: string; setPricePerUnit: (v: string) => void;
  priceUnit: string; setPriceUnit: (v: string) => void;
  supplier: string; setSupplier: (v: string) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Karotten" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kategorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INGREDIENT_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Einheit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Preis (€)</Label>
          <Input type="number" step="0.01" min="0" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>pro</Label>
          <Select value={priceUnit} onValueChange={setPriceUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRICE_UNITS.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Lieferant</Label>
        <Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Optional" />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {submitLabel}
      </Button>
    </form>
  );
}

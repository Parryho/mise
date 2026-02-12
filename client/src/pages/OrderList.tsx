import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Camera, Printer, CheckCheck, Trash2, Loader2,
  ShoppingCart, Package, Archive, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api";

interface OrderList {
  id: number;
  status: string;
  createdByName: string | null;
  orderedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface OrderItem {
  id: number;
  listId: number;
  name: string;
  amount: string | null;
  supplierId: number | null;
  isChecked: boolean;
  addedByName: string | null;
  sortOrder: number;
  createdAt: string;
}

interface ScannedItem {
  name: string;
  amount: string | null;
  confidence: number;
}

export default function OrderListPage() {
  const [list, setList] = useState<OrderList | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedLists, setArchivedLists] = useState<OrderList[]>([]);
  const [showScan, setShowScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [addingScan, setAddingScan] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchActive = useCallback(async () => {
    try {
      const data = await apiFetch<{ list: OrderList; items: OrderItem[] }>("/api/orders/active");
      setList(data.list);
      setItems(data.items);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const addItem = async () => {
    const text = inputValue.trim();
    if (!text || !list) return;

    // Parse "2kg Mehl" → amount: "2kg", name: "Mehl"
    // Or just "Mehl" → amount: null, name: "Mehl"
    const match = text.match(/^(\d+[\.,]?\d*\s*(?:kg|g|l|ml|stk|pkg|kiste|sack|fl|bd|bund|dosen?|glas|eimer|stück|beutel|karton|tüte)?)\s+(.+)$/i);
    let name: string;
    let amount: string | null = null;
    if (match) {
      amount = match[1].trim();
      name = match[2].trim();
    } else {
      name = text;
    }

    setAdding(true);
    try {
      const created = await apiPost<OrderItem[]>(`/api/orders/${list.id}/items`, { name, amount });
      setItems(prev => [...prev, ...created]);
      setInputValue("");
      inputRef.current?.focus();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const toggleCheck = async (item: OrderItem) => {
    const updated = await apiPut<OrderItem>(`/api/orders/items/${item.id}`, { isChecked: !item.isChecked });
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const deleteItem = async (itemId: number) => {
    await apiDelete(`/api/orders/items/${itemId}`);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const markOrdered = async () => {
    if (!list) return;
    await apiPut(`/api/orders/${list.id}`, { status: "ordered" });
    toast({ title: "Bestellt!", description: "Liste als bestellt markiert. Neue Liste wurde erstellt." });
    setLoading(true);
    await fetchActive();
  };

  // Sort: unchecked first, then checked
  const sortedItems = [...items].sort((a, b) => {
    if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
    return a.id - b.id;
  });
  const uncheckedCount = items.filter(i => !i.isChecked).length;
  const checkedCount = items.filter(i => i.isChecked).length;

  // === Foto-Scan ===
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !list) return;

    setScanning(true);
    setShowScan(true);
    setScannedItems([]);

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const result = await apiPost<{ items: ScannedItem[] }>(`/api/orders/${list.id}/scan`, { imageBase64: base64 });
      setScannedItems(result.items || []);
    } catch (error: any) {
      toast({ title: "Scan fehlgeschlagen", description: error.message, variant: "destructive" });
      setShowScan(false);
    } finally {
      setScanning(false);
      // Reset file input
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addScannedItems = async () => {
    if (!list || scannedItems.length === 0) return;
    setAddingScan(true);
    try {
      const payload = scannedItems.map(si => ({ name: si.name, amount: si.amount }));
      const created = await apiPost<OrderItem[]>(`/api/orders/${list.id}/items`, payload);
      setItems(prev => [...prev, ...created]);
      setShowScan(false);
      setScannedItems([]);
      toast({ title: `${created.length} Artikel hinzugefügt` });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setAddingScan(false);
    }
  };

  // === Archiv ===
  const loadArchive = async () => {
    if (showArchive) {
      setShowArchive(false);
      return;
    }
    const lists = await apiFetch<OrderList[]>("/api/orders?status=ordered");
    setArchivedLists(lists);
    setShowArchive(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div>
          <h1 className="text-xl">Bestellzettel</h1>
          {uncheckedCount > 0 && (
            <p className="text-sm text-muted-foreground">{uncheckedCount} offen{checkedCount > 0 ? `, ${checkedCount} erledigt` : ""}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => window.print()} title="Drucken">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} title="Zettel scannen">
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file input for camera */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoCapture}
      />

      {/* Quick-Add Bar */}
      <div className="sticky top-0 z-10 bg-background pb-3 pt-1 print:hidden">
        <form
          onSubmit={(e) => { e.preventDefault(); addItem(); }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="z.B. 2kg Mehl"
            className="flex-1 min-h-11 text-base"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="min-h-11 min-w-11"
            disabled={!inputValue.trim() || adding}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
          </Button>
        </form>
      </div>

      {/* Item List */}
      {sortedItems.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Noch keine Artikel</p>
            <p className="text-sm mt-1">Tippe oben ein was bestellt werden muss</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t rounded-lg bg-card overflow-hidden">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item)}
              className={`border-r border-b px-3 py-3 min-h-[48px] flex items-center gap-2 press cursor-pointer ${
                item.isChecked ? "bg-muted/40" : ""
              }`}
            >
              <Checkbox
                checked={item.isChecked}
                onCheckedChange={() => toggleCheck(item)}
                className="h-5 w-5 rounded shrink-0"
              />
              <span className={`text-sm truncate ${item.isChecked ? "line-through text-muted-foreground" : ""}`}>
                {item.amount && <span className="text-primary font-semibold mr-1">{item.amount}</span>}
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Actions */}
      {items.length > 0 && (
        <div className="mt-6 space-y-3 print:hidden">
          <Button
            onClick={markOrdered}
            className="w-full min-h-12 text-base"
            variant="default"
          >
            <CheckCheck className="h-5 w-5 mr-2" />
            Als bestellt markieren
          </Button>
        </div>
      )}

      {/* Archive toggle */}
      <div className="mt-6 print:hidden">
        <Button variant="ghost" className="w-full" onClick={loadArchive}>
          <Archive className="h-4 w-4 mr-2" />
          Frühere Bestellungen
          {showArchive ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </Button>
        {showArchive && (
          <div className="mt-3 space-y-2">
            {archivedLists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Noch keine abgeschlossenen Bestellungen</p>
            ) : (
              archivedLists.map((al) => (
                <Card key={al.id} className="press">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {al.orderedAt ? new Date(al.orderedAt).toLocaleDateString("de-AT") : "—"}
                      </p>
                      {al.createdByName && (
                        <p className="text-xs text-muted-foreground">{al.createdByName}</p>
                      )}
                    </div>
                    <Badge variant="secondary">bestellt</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Scan Results Dialog */}
      <Dialog open={showScan} onOpenChange={setShowScan}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Zettel gescannt</DialogTitle>
            <DialogDescription>
              {scanning ? "Wird gelesen..." : `${scannedItems.length} Artikel erkannt`}
            </DialogDescription>
          </DialogHeader>
          {scanning ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {scannedItems.map((si, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {si.amount && <span className="text-primary font-semibold mr-1.5">{si.amount}</span>}
                        {si.name}
                      </p>
                    </div>
                    <Badge
                      variant={si.confidence >= 0.8 ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {Math.round(si.confidence * 100)}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {scannedItems.length > 0 && (
                <Button onClick={addScannedItems} disabled={addingScan} className="w-full mt-2">
                  {addingScan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Alle hinzufügen
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .max-w-5xl, .max-w-5xl * { visibility: visible; }
          .max-w-5xl { position: absolute; left: 0; top: 0; width: 100%; padding: 8mm; max-width: 100% !important; }
          .print\\:hidden { display: none !important; }
          h1 { font-size: 16pt; margin-bottom: 6pt; }
          .grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; }
          .grid > div { padding: 1.5mm 2mm; font-size: 9pt; }
        }
      `}</style>
    </div>
  );
}

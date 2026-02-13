import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Camera, Mic, MicOff, Printer, CheckCheck, Trash2, Loader2,
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
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const voiceTranscriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const stoppedByUserRef = useRef(false);
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
      // Compress image to max 1600px to avoid entity-too-large
      const base64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const scale = MAX / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = URL.createObjectURL(file);
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

  // === Spracheingabe ===
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Nicht unterstützt", description: "Dein Browser unterstützt keine Spracheingabe", variant: "destructive" });
      return;
    }

    stoppedByUserRef.current = false;
    voiceTranscriptRef.current = "";
    setVoiceTranscript("");
    setIsListening(true);

    const launch = () => {
      const rec = new SR();
      rec.lang = "de-AT";
      rec.continuous = false;
      rec.interimResults = true;

      let interim = "";

      rec.onresult = (e: any) => {
        interim = "";
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            voiceTranscriptRef.current += t + ", ";
            interim = "";
          } else {
            interim = t;
          }
        }
        setVoiceTranscript((voiceTranscriptRef.current + interim).trim());
      };

      rec.onerror = (e: any) => {
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.error("Speech error:", e.error);
        }
      };

      rec.onend = () => {
        if (!stoppedByUserRef.current) {
          setTimeout(launch, 100);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    };

    launch();
  };

  const stopListening = async () => {
    stoppedByUserRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);

    // Wait briefly for final result to arrive
    await new Promise(r => setTimeout(r, 500));

    const text = voiceTranscriptRef.current.trim();
    if (!text || !list) {
      console.log("Voice: no text captured, transcript was:", JSON.stringify(voiceTranscriptRef.current));
      return;
    }
    console.log("Voice: sending text to server:", text);

    // Send to Gemini for structured parsing
    setScanning(true);
    setShowScan(true);
    setScannedItems([]);

    try {
      const result = await apiPost<{ items: ScannedItem[] }>(`/api/orders/${list.id}/voice`, { text });
      setScannedItems(result.items || []);
    } catch (error: any) {
      toast({ title: "Erkennung fehlgeschlagen", description: error.message, variant: "destructive" });
      setShowScan(false);
    } finally {
      setScanning(false);
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
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            title={isListening ? "Stopp" : "Ansagen"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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

      {/* Voice transcript live */}
      {isListening && (
        <div className="mb-3 p-3 rounded-lg border-2 border-destructive bg-destructive/5 print:hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">Aufnahme läuft...</span>
          </div>
          {voiceTranscript ? (
            <p className="text-sm text-muted-foreground italic">"{voiceTranscript}"</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sag was bestellt werden soll...</p>
          )}
          <p className="text-xs text-muted-foreground/60 mt-1">Duplikate werden automatisch bereinigt</p>
        </div>
      )}

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
        <>
        {/* Spalten-Header nur im Druck */}
        <div className="col-headers hidden">
          <span>A</span><span>B</span><span>C</span><span>D</span>
        </div>
        <div className="order-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t rounded-lg bg-card overflow-hidden">
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
              <span className={`text-sm truncate flex-1 ${item.isChecked ? "line-through text-muted-foreground" : ""}`}>
                {item.amount && <span className="text-primary font-semibold mr-1">{item.amount}</span>}
                {item.name}
              </span>
              <button
                className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity print:hidden"
                onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                aria-label="Löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        </>
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
          .max-w-5xl { position: absolute; left: 0; top: 0; width: 100%; padding: 5mm 8mm; max-width: 100% !important; }
          .print\\:hidden { display: none !important; }
          h1 { font-size: 14pt; margin-bottom: 4pt; }
          .order-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            grid-template-rows: auto;
            border: 2px solid #000 !important;
            border-radius: 0 !important;
            min-height: 250mm;
          }
          .order-grid::before { display: none; }
          .order-grid > div {
            padding: 1.5mm 2.5mm;
            font-size: 9pt;
            border-bottom: 1px solid #ccc !important;
            border-right: none !important;
          }
          /* Spaltenlinien: jede 1. und 2. und 3. Spalte rechts */
          .order-grid > div:nth-child(4n+1),
          .order-grid > div:nth-child(4n+2),
          .order-grid > div:nth-child(4n+3) {
            border-right: 2px solid #000 !important;
          }
          /* Spalten-Header A B C D */
          .col-headers { display: grid !important; grid-template-columns: repeat(4, 1fr); border: 2px solid #000; border-bottom: none; }
          .col-headers span { text-align: center; font-weight: bold; font-size: 11pt; padding: 1mm 0; border-right: 2px solid #000; }
          .col-headers span:last-child { border-right: none; }
          /* Checkboxen im Druck ausblenden */
          .order-grid input[type="checkbox"],
          .order-grid button,
          .order-grid [role="checkbox"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}

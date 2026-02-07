import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Pencil, Trash2, Search, ArrowLeft, Truck, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  deliveryDays: string[];
  orderDeadline: string | null;
  minOrder: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

const WEEKDAYS = [
  { id: "Mo", label: "Mo" },
  { id: "Di", label: "Di" },
  { id: "Mi", label: "Mi" },
  { id: "Do", label: "Do" },
  { id: "Fr", label: "Fr" },
  { id: "Sa", label: "Sa" },
];

export default function Suppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
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
      return matchSearch;
    });
  }, [items, search]);

  const handleDelete = async (id: number) => {
    if (!confirm("Lieferant wirklich löschen?")) return;
    try {
      await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      toast({ title: "Gelöscht" });
      fetchItems();
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    }
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
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">Lieferanten-Verwaltung</h1>
          <p className="text-xs text-muted-foreground">{items.length} Lieferanten</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowAdd(true)}>
          <PlusCircle className="h-4 w-4" /> Neu
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Lieferant suchen..."
          className="pl-9"
        />
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {items.length === 0 ? "Keine Lieferanten vorhanden." : "Keine Ergebnisse."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="font-medium truncate">{item.name}</div>
                      {!item.isActive && (
                        <Badge variant="secondary" className="text-[10px] py-0">Inaktiv</Badge>
                      )}
                    </div>

                    {item.contactPerson && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>Kontakt: {item.contactPerson}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {item.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{item.email}</span>
                        </div>
                      )}
                    </div>

                    {item.deliveryDays && item.deliveryDays.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.deliveryDays.map(day => (
                          <Badge key={day} variant="outline" className="text-[10px] py-0">{day}</Badge>
                        ))}
                      </div>
                    )}

                    {item.orderDeadline && (
                      <div className="text-xs text-muted-foreground">
                        Bestellfrist: {item.orderDeadline}
                      </div>
                    )}

                    {item.minOrder && (
                      <div className="text-xs text-muted-foreground">
                        Mindestbestellung: {item.minOrder}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-xs text-muted-foreground italic">
                        {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <EditSupplierDialog item={item} onSave={fetchItems} />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddSupplierDialog open={showAdd} onOpenChange={setShowAdd} onSave={() => { setShowAdd(false); fetchItems(); }} />
    </div>
  );
}

function AddSupplierDialog({ open, onOpenChange, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryDays, setDeliveryDays] = useState<string[]>([]);
  const [orderDeadline, setOrderDeadline] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
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
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactPerson: contactPerson.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          deliveryDays: deliveryDays,
          orderDeadline: orderDeadline.trim() || null,
          minOrder: minOrder.trim() || null,
          notes: notes.trim() || null,
          isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: "Lieferant erstellt" });
      setName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setDeliveryDays([]);
      setOrderDeadline("");
      setMinOrder("");
      setNotes("");
      setIsActive(true);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuer Lieferant</DialogTitle>
        </DialogHeader>
        <SupplierForm
          name={name} setName={setName}
          contactPerson={contactPerson} setContactPerson={setContactPerson}
          phone={phone} setPhone={setPhone}
          email={email} setEmail={setEmail}
          deliveryDays={deliveryDays} setDeliveryDays={setDeliveryDays}
          orderDeadline={orderDeadline} setOrderDeadline={setOrderDeadline}
          minOrder={minOrder} setMinOrder={setMinOrder}
          notes={notes} setNotes={setNotes}
          isActive={isActive} setIsActive={setIsActive}
          saving={saving}
          onSubmit={handleSubmit}
          submitLabel="Erstellen"
        />
      </DialogContent>
    </Dialog>
  );
}

function EditSupplierDialog({ item, onSave }: { item: Supplier; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [contactPerson, setContactPerson] = useState(item.contactPerson || "");
  const [phone, setPhone] = useState(item.phone || "");
  const [email, setEmail] = useState(item.email || "");
  const [deliveryDays, setDeliveryDays] = useState<string[]>(
    item.deliveryDays || []
  );
  const [orderDeadline, setOrderDeadline] = useState(item.orderDeadline || "");
  const [minOrder, setMinOrder] = useState(item.minOrder || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [isActive, setIsActive] = useState(item.isActive);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactPerson: contactPerson.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          deliveryDays: deliveryDays,
          orderDeadline: orderDeadline.trim() || null,
          minOrder: minOrder.trim() || null,
          notes: notes.trim() || null,
          isActive,
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
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lieferant bearbeiten</DialogTitle>
        </DialogHeader>
        <SupplierForm
          name={name} setName={setName}
          contactPerson={contactPerson} setContactPerson={setContactPerson}
          phone={phone} setPhone={setPhone}
          email={email} setEmail={setEmail}
          deliveryDays={deliveryDays} setDeliveryDays={setDeliveryDays}
          orderDeadline={orderDeadline} setOrderDeadline={setOrderDeadline}
          minOrder={minOrder} setMinOrder={setMinOrder}
          notes={notes} setNotes={setNotes}
          isActive={isActive} setIsActive={setIsActive}
          saving={saving}
          onSubmit={handleSubmit}
          submitLabel="Speichern"
        />
      </DialogContent>
    </Dialog>
  );
}

function SupplierForm({
  name, setName,
  contactPerson, setContactPerson,
  phone, setPhone,
  email, setEmail,
  deliveryDays, setDeliveryDays,
  orderDeadline, setOrderDeadline,
  minOrder, setMinOrder,
  notes, setNotes,
  isActive, setIsActive,
  saving,
  onSubmit,
  submitLabel
}: {
  name: string; setName: (v: string) => void;
  contactPerson: string; setContactPerson: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  deliveryDays: string[]; setDeliveryDays: (v: string[]) => void;
  orderDeadline: string; setOrderDeadline: (v: string) => void;
  minOrder: string; setMinOrder: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  isActive: boolean; setIsActive: (v: boolean) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  const toggleDay = (dayId: string) => {
    if (deliveryDays.includes(dayId)) {
      setDeliveryDays(deliveryDays.filter(d => d !== dayId));
    } else {
      setDeliveryDays([...deliveryDays, dayId]);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Metro" required />
      </div>

      <div className="space-y-1.5">
        <Label>Ansprechpartner</Label>
        <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Optional" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label>E-Mail</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Liefertage</Label>
        <div className="flex gap-2 flex-wrap">
          {WEEKDAYS.map(day => (
            <Button
              key={day.id}
              type="button"
              variant={deliveryDays.includes(day.id) ? "default" : "outline"}
              size="sm"
              className="h-8 w-12 text-xs"
              onClick={() => toggleDay(day.id)}
            >
              {day.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Bestellfrist</Label>
        <Input
          value={orderDeadline}
          onChange={e => setOrderDeadline(e.target.value)}
          placeholder="z.B. Donnerstag 12:00"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Mindestbestellung</Label>
        <Input
          value={minOrder}
          onChange={e => setMinOrder(e.target.value)}
          placeholder="z.B. €50"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional"
          className="min-h-[60px]"
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="isActive" className="cursor-pointer">Aktiv</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {submitLabel}
      </Button>
    </form>
  );
}

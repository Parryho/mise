import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Loader2, PlusCircle, Pencil, Trash2, Sun, Sparkles, LayoutGrid,
  Crown, Wine, BookOpen, Circle, RefreshCw, Users, CalendarDays,
  TrendingUp, Clock, User, DoorOpen,
} from "lucide-react";
import { useLocationFilter } from "@/lib/location-context";
import { formatLocalDate } from "@shared/constants";

interface CateringEvent {
  id: number;
  clientName: string;
  eventName: string;
  date: string;
  time: string;
  personCount: number;
  dishes: string[];
  notes: string | null;
  eventType: string;
  timeStart: string | null;
  timeEnd: string | null;
  contactPerson: string | null;
  room: string | null;
  status: string;
  airtableId: string | null;
  locationId: number | null;
}

const EVENT_TYPES = [
  { value: "brunch", label: "Brunch", icon: Sun, color: "bg-yellow-50 text-yellow-600 border-yellow-200", bar: "bg-yellow-500" },
  { value: "ball", label: "Ball", icon: Sparkles, color: "bg-purple-50 text-purple-600 border-purple-200", bar: "bg-purple-500" },
  { value: "buffet", label: "Buffet", icon: LayoutGrid, color: "bg-blue-50 text-blue-600 border-blue-200", bar: "bg-blue-500" },
  { value: "bankett", label: "Bankett", icon: Crown, color: "bg-red-50 text-red-600 border-red-200", bar: "bg-red-500" },
  { value: "empfang", label: "Empfang", icon: Wine, color: "bg-green-50 text-green-600 border-green-200", bar: "bg-green-500" },
  { value: "seminar", label: "Seminar", icon: BookOpen, color: "bg-indigo-50 text-indigo-600 border-indigo-200", bar: "bg-indigo-500" },
  { value: "sonstiges", label: "Sonstiges", icon: Circle, color: "bg-gray-50 text-gray-600 border-gray-200", bar: "bg-gray-500" },
];

const STATUS_OPTIONS = [
  { value: "geplant", label: "Geplant", color: "bg-status-info-subtle text-status-info" },
  { value: "bestaetigt", label: "Bestätigt", color: "bg-status-success-subtle text-status-success" },
  { value: "abgesagt", label: "Abgesagt", color: "bg-status-danger-subtle text-status-danger" },
  { value: "abgeschlossen", label: "Abgeschlossen", color: "bg-status-neutral-subtle text-status-neutral" },
];

function formatDate(date: Date): string {
  return formatLocalDate(date);
}

const emptyForm = {
  clientName: "",
  eventName: "",
  date: formatDate(new Date()),
  time: "12:00",
  personCount: "10",
  eventType: "buffet",
  timeStart: "",
  timeEnd: "",
  contactPerson: "",
  room: "",
  status: "geplant",
  notes: "",
  dishes: "",
};

export default function Catering({ embedded }: { embedded?: boolean }) {
  const [events, setEvents] = useState<CateringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CateringEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [airtableStatus, setAirtableStatus] = useState<{ configured: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; created: number; updated: number; errors: string[] } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationFilter();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const locParam = selectedLocationId ? `?locationId=${selectedLocationId}` : "";
      const res = await fetch(`/api/catering${locParam}`);
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch catering:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetch("/api/airtable/status")
      .then((r) => r.json())
      .then(setAirtableStatus)
      .catch(() => {});
  }, [selectedLocationId]);

  const handleDelete = async (id: number) => {
    if (!confirm(t("catering.deleteEventConfirm"))) return;
    try {
      await fetch(`/api/catering/${id}`, { method: "DELETE" });
      toast({ title: t("common.deleted") });
      fetchEvents();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const startEdit = (event: CateringEvent) => {
    setEditEvent(event);
    setForm({
      clientName: event.clientName,
      eventName: event.eventName,
      date: event.date,
      time: event.time,
      personCount: String(event.personCount),
      eventType: event.eventType || "sonstiges",
      timeStart: event.timeStart || "",
      timeEnd: event.timeEnd || "",
      contactPerson: event.contactPerson || "",
      room: event.room || "",
      status: event.status || "geplant",
      notes: event.notes || "",
      dishes: event.dishes.join(", "),
    });
    setDialogOpen(true);
  };

  const startNew = () => {
    setEditEvent(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        clientName: form.clientName,
        eventName: form.eventName,
        date: form.date,
        time: form.time,
        personCount: parseInt(form.personCount) || 0,
        eventType: form.eventType,
        timeStart: form.timeStart || null,
        timeEnd: form.timeEnd || null,
        contactPerson: form.contactPerson || null,
        room: form.room || null,
        status: form.status,
        notes: form.notes || null,
        dishes: form.dishes
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      };

      if (editEvent) {
        await fetch(`/api/catering/${editEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: t("catering.eventUpdated") });
      } else {
        await fetch("/api/catering", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: t("catering.eventCreated") });
      }
      setDialogOpen(false);
      setEditEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/airtable/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncResult({ synced: 0, created: 0, updated: 0, errors: [data.error || t("catering.airtable.syncFailed")] });
      } else {
        setSyncResult(data);
        fetchEvents();
      }
    } catch (err) {
      setSyncResult({ synced: 0, created: 0, updated: 0, errors: [err instanceof Error ? err.message : t("catering.airtable.connectionError")] });
    }
    setSyncing(false);
  };

  // Sort: future ascending, past descending
  const today = formatDate(new Date());
  const filtered = events
    .filter((e) => !filterType || e.eventType === filterType)
    .filter((e) => !filterStatus || e.status === filterStatus)
    .sort((a, b) => {
      const aFuture = a.date >= today ? 0 : 1;
      const bFuture = b.date >= today ? 0 : 1;
      if (aFuture !== bFuture) return aFuture - bFuture;
      return aFuture === 0
        ? a.date.localeCompare(b.date) || (a.timeStart || a.time || "").localeCompare(b.timeStart || b.time || "")
        : b.date.localeCompare(a.date) || (b.timeStart || b.time || "").localeCompare(a.timeStart || a.time || "");
    });

  // Stats
  const activeEvents = events.filter((e) => e.status !== "abgesagt");
  const upcoming = events.filter((e) => e.status === "geplant" || e.status === "bestaetigt").length;
  const totalPax = activeEvents.reduce((sum, e) => sum + e.personCount, 0);
  const avgPax = activeEvents.length > 0 ? Math.round(totalPax / activeEvents.length) : 0;

  return (
    <div className={embedded ? "space-y-4" : "p-4 space-y-4 pb-24"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        {!embedded && (
        <div>
          <h1 className="text-2xl font-heading font-bold">{t("catering.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("catering.subtitle")}</p>
        </div>
        )}
        <Button size="sm" className="gap-1 ml-auto" onClick={startNew}>
          <PlusCircle className="h-4 w-4" /> {t("catering.newEvent")}
        </Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("common.total")}</div>
              <div className="text-xl font-bold">{events.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("catering.upcoming")}</div>
              <div className="text-xl font-bold">{upcoming}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("guests.totalPax")}</div>
              <div className="text-xl font-bold">{totalPax}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("guests.avgPaxPerEvent")}</div>
              <div className="text-xl font-bold">{avgPax}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Airtable Sync */}
      {airtableStatus && (
        <Card className={airtableStatus.configured ? "border-status-success/30 bg-status-success-subtle/50" : "border-status-warning/30 bg-status-warning-subtle/50"}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              <div>
                <div className="text-sm font-medium">
                  {airtableStatus.configured ? t("catering.airtable.connected") : t("catering.airtable.notConfigured")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {airtableStatus.configured ? t("catering.airtable.syncEvents") : t("catering.airtable.setApiKey")}
                </div>
              </div>
            </div>
            {airtableStatus.configured && (
              <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
                {syncing ? t("catering.airtable.syncing") : t("catering.airtable.syncNow")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {syncResult && (
        <Card className={syncResult.errors.length > 0 ? "border-status-danger/30 bg-status-danger-subtle/50" : "border-status-success/30 bg-status-success-subtle/50"}>
          <CardContent className="p-3 text-sm">
            {syncResult.errors.length > 0 ? (
              <div className="text-status-danger">{syncResult.errors.join(", ")}</div>
            ) : (
              <div className="text-status-success">
                {t("catering.airtable.syncComplete", { created: syncResult.created, updated: syncResult.updated, synced: syncResult.synced })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType("")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              !filterType ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t("common.all")}
          </button>
          {EVENT_TYPES.map((et) => {
            const Icon = et.icon;
            return (
              <button
                key={et.value}
                onClick={() => setFilterType(filterType === et.value ? "" : et.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterType === et.value ? "bg-primary text-primary-foreground" : `${et.color} border`
                }`}
              >
                <Icon className="h-3 w-3" />
                {t(`catering.eventTypes.${et.value}`)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? "" : s.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s.value ? "bg-primary text-primary-foreground" : s.color
              }`}
            >
              {t(`catering.statusOptions.${s.value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">{events.length === 0 ? t("catering.noEvents") : t("catering.noEventsFilter")}</p>
          {events.length === 0 && (
            <Button variant="link" className="mt-1 text-sm h-auto p-0" onClick={startNew}>{t("catering.noEventsHint")}</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const typeInfo = EVENT_TYPES.find((et) => et.value === event.eventType) || EVENT_TYPES[6];
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === event.status) || STATUS_OPTIONS[0];
            const TypeIcon = typeInfo.icon;
            const eventDate = new Date(event.date + "T00:00:00");

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="flex items-stretch">
                  {/* Color bar */}
                  <div
                    className={`w-1.5 flex-shrink-0 ${
                      event.status === "bestaetigt"
                        ? "bg-status-success"
                        : event.status === "abgesagt"
                          ? "bg-status-danger"
                          : event.status === "abgeschlossen"
                            ? "bg-status-neutral"
                            : typeInfo.bar
                    }`}
                  />

                  <CardContent className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Date block */}
                        <div className="text-center bg-secondary rounded-lg p-2 min-w-[52px] flex-shrink-0">
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {eventDate.toLocaleDateString("de-AT", { weekday: "short" })}
                          </div>
                          <div className="text-lg font-bold">{eventDate.getDate()}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {eventDate.toLocaleDateString("de-AT", { month: "short" })}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            <Badge variant="outline" className={`${typeInfo.color} gap-1 text-[10px] px-1.5 py-0`}>
                              <TypeIcon className="h-3 w-3" />
                              {t(`catering.eventTypes.${typeInfo.value}`)}
                            </Badge>
                            <Badge variant="secondary" className={`${statusInfo.color} text-[10px] px-1.5 py-0 border-0`}>
                              {t(`catering.statusOptions.${statusInfo.value}`)}
                            </Badge>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 border-0 font-bold">
                              {event.personCount} PAX
                            </Badge>
                          </div>

                          <div className="font-medium text-sm truncate">
                            {event.eventName || event.clientName}
                          </div>
                          {event.eventName && event.clientName && (
                            <div className="text-xs text-muted-foreground truncate">{event.clientName}</div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            {(event.timeStart || event.time) && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.timeStart || event.time}
                                {event.timeEnd ? ` - ${event.timeEnd}` : ""}
                              </span>
                            )}
                            {event.contactPerson && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.contactPerson}
                              </span>
                            )}
                            {event.room && (
                              <span className="flex items-center gap-1">
                                <DoorOpen className="h-3 w-3" />
                                {event.room}
                              </span>
                            )}
                          </div>

                          {event.notes && (
                            <div className="mt-1.5 text-xs text-foreground/70 bg-secondary/50 rounded px-2 py-1 border-l-2 border-amber-400">
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => startEdit(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEvent ? t("catering.editEvent") : t("catering.newEvent")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Event Type */}
            <div className="space-y-2">
              <Label>{t("catering.eventType")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map((et) => {
                  const Icon = et.icon;
                  return (
                    <button
                      key={et.value}
                      type="button"
                      onClick={() => setForm({ ...form, eventType: et.value })}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                        form.eventType === et.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t(`catering.eventTypes.${et.value}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("catering.client")}</Label>
              <Input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder={t("catering.clientPlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("catering.eventName")}</Label>
              <Input
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                placeholder={t("catering.eventNamePlaceholder")}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>{t("common.date")}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("common.from")}</Label>
                <Input type="time" value={form.timeStart} onChange={(e) => setForm({ ...form, timeStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("common.to")}</Label>
                <Input type="time" value={form.timeEnd} onChange={(e) => setForm({ ...form, timeEnd: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>PAX</Label>
                <Input
                  type="number"
                  value={form.personCount}
                  onChange={(e) => setForm({ ...form, personCount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {t(`catering.statusOptions.${s.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("catering.contactPerson")}</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder={t("catering.contactPersonPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("catering.room")}</Label>
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder={t("catering.roomPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("catering.dishes")}</Label>
              <Input
                value={form.dishes}
                onChange={(e) => setForm({ ...form, dishes: e.target.value })}
                placeholder={t("catering.dishesPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("common.notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("catering.notesPlaceholder")}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editEvent ? t("common.update") : t("common.create")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

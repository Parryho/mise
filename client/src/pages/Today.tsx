import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLocationFilter } from "@/lib/location-context";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Thermometer,
  ClipboardList,
  Users,
  Plus,
  Bot,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  UtensilsCrossed,
  Soup,
  CakeSlice,
  Settings,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: number;
  title: string;
  note: string | null;
  priority: string;
  status: string;
  date: string;
}

interface MenuPlanItem {
  id: number;
  date: string;
  meal: string;
  course: string;
  recipeId: number | null;
  portions: number;
  notes: string | null;
  locationId: number | null;
  recipe?: {
    id: number;
    name: string;
    category: string;
  };
}

interface GuestCount {
  id: number;
  date: string;
  meal: string;
  locationId: number;
  count: number;
}

const COURSE_ICONS: Record<string, React.ReactNode> = {
  soup: <Soup className="h-4 w-4 text-amber-600" />,
  main1: <UtensilsCrossed className="h-4 w-4 text-red-600" />,
  main2: <UtensilsCrossed className="h-4 w-4 text-green-600" />,
  dessert: <CakeSlice className="h-4 w-4 text-pink-500" />,
};

const COURSE_LABELS: Record<string, string> = {
  soup: "Suppe",
  main1: "Hauptgericht 1",
  side1a: "Beilage 1a",
  side1b: "Beilage 1b",
  main2: "Hauptgericht 2",
  side2a: "Beilage 2a",
  side2b: "Beilage 2b",
  dessert: "Dessert",
};


export default function Today() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { locations } = useLocationFilter();
  const { fridges, logs: haccpLogs } = useApp();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [menuItems, setMenuItems] = useState<MenuPlanItem[]>([]);
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "Guten Abend";
    if (hour < 11) return "Guten Morgen";
    if (hour < 14) return "Mahlzeit";
    if (hour < 18) return "Guten Nachmittag";
    return "Guten Abend";
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Chef";

  // Fetch data
  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?date=${dateStr}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Tasks");
      return await res.json();
    } catch {
      return [];
    }
  };

  const fetchMenuPlan = async () => {
    try {
      const res = await fetch(`/api/menu-plans?date=${dateStr}&withRecipes=1`);
      if (!res.ok) throw new Error("Fehler beim Laden des Menüplans");
      return await res.json();
    } catch {
      return [];
    }
  };

  const fetchGuestCounts = async () => {
    try {
      const res = await fetch(`/api/guests?start=${dateStr}&end=${dateStr}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Gästezahlen");
      return await res.json();
    } catch {
      return [];
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTasks(), fetchMenuPlan(), fetchGuestCounts()])
      .then(([tasksData, menuData, guestData]) => {
        setTasks(tasksData);
        setMenuItems(menuData);
        setGuestCounts(guestData);
      })
      .finally(() => setLoading(false));
  }, [dateStr]);

  // Task handlers
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const priorityMap: Record<string, number> = { low: 0, normal: 1, high: 2 };
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          note: newNote.trim() || null,
          priority: priorityMap[newPriority] ?? 1,
          date: dateStr,
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Erstellen");
      const created = await res.json();
      setTasks([...tasks, created]);
      setNewTitle("");
      setNewNote("");
      setNewPriority("normal");
      setAddDialogOpen(false);
      toast({ title: "Task erstellt" });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "open" : "done";
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Fehler beim Aktualisieren");
      const updated = await res.json();
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task gelöscht" });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  // Computed values
  const openTasks = tasks.filter(t => t.status === "open");
  const doneTasks = tasks.filter(t => t.status === "done");

  // HACCP status for today
  const haccpStatus = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayLogs = haccpLogs.filter(l => new Date(l.timestamp).toDateString() === todayStr);
    const totalFridges = fridges.length;
    const measuredFridgeIds = new Set(todayLogs.map(l => l.fridgeId));
    const measured = measuredFridgeIds.size;
    const alerts = todayLogs.filter(l => l.status === "WARNING" || l.status === "CRITICAL").length;
    return { totalFridges, measured, alerts };
  }, [haccpLogs, fridges]);

  // City location ID
  const cityLocId = useMemo(() => {
    const city = locations.find(l => l.slug === "city");
    return city?.id ?? null;
  }, [locations]);

  // Only show City Mittag menu
  const cityLunchItems = useMemo(() => {
    return menuItems
      .filter(item => item.recipe && item.meal === "lunch" && (cityLocId === null || item.locationId === cityLocId))
      .sort((a, b) => {
        const order = ["soup", "main1", "side1a", "side1b", "main2", "side2a", "side2b", "dessert"];
        return order.indexOf(a.course) - order.indexOf(b.course);
      });
  }, [menuItems, cityLocId]);

  const hasMenu = cityLunchItems.length > 0;

  // PAX per location
  const paxByLocation = useMemo(() => {
    const result: Record<number, { lunch: number; dinner: number }> = {};
    for (const gc of guestCounts) {
      if (!result[gc.locationId]) result[gc.locationId] = { lunch: 0, dinner: 0 };
      if (gc.meal === "lunch") result[gc.locationId].lunch += gc.count;
      else if (gc.meal === "dinner") result[gc.locationId].dinner += gc.count;
    }
    return result;
  }, [guestCounts]);

  const totalPax = useMemo(() => {
    let lunch = 0, dinner = 0;
    for (const v of Object.values(paxByLocation)) {
      lunch += v.lunch;
      dinner += v.dinner;
    }
    return { lunch, dinner, total: lunch + dinner };
  }, [paxByLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {format(today, "EEEE", { locale: de })}
        </p>
        <h1 className="text-2xl font-heading font-bold">
          {format(today, "d. MMMM yyyy", { locale: de })}
        </h1>
        <p className="text-base text-muted-foreground">
          {greeting}, <span className="text-foreground font-medium">{firstName}</span>
        </p>
      </div>

      {/* PAX Summary */}
      {(totalPax.total > 0 || locations.length > 0) && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gäste heute
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {totalPax.total > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {locations.map(loc => {
                  const pax = paxByLocation[loc.id];
                  const locTotal = pax ? pax.lunch + pax.dinner : 0;
                  return (
                    <div key={loc.id} className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">{loc.name}</span>
                      </div>
                      <span className="text-2xl font-bold tabular-nums">{locTotal || "-"}</span>
                      {pax && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          M: {pax.lunch} / A: {pax.dinner}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-xs text-primary uppercase tracking-wide font-medium">Gesamt</span>
                  </div>
                  <span className="text-2xl font-bold text-primary tabular-nums">{totalPax.total}</span>
                  <div className="text-[10px] text-primary/70 mt-0.5">
                    M: {totalPax.lunch} / A: {totalPax.dinner}
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/guests" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                Keine Gästezahlen erfasst
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Menu */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Mittagsmenü City
            </CardTitle>
            <Link href="/rotation">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary">
                Plan öffnen <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {hasMenu ? (
            <div className="grid gap-1.5">
              {cityLunchItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm py-1">
                  {COURSE_ICONS[item.course] || <span className="w-4" />}
                  <span className="text-muted-foreground text-xs min-w-[60px]">
                    {COURSE_LABELS[item.course] || item.course}
                  </span>
                  <span className="font-medium truncate">{item.recipe?.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Noch kein Menü geplant</p>
              <Link href="/rotation">
                <Button variant="outline" size="sm">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Menü planen
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HACCP Status + Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* HACCP Status */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                HACCP Status
              </CardTitle>
              <Link href="/haccp">
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary">
                  Details <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {haccpStatus.totalFridges > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {haccpStatus.alerts > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : haccpStatus.measured >= haccpStatus.totalFridges ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">
                    {haccpStatus.measured}/{haccpStatus.totalFridges} gemessen
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      haccpStatus.alerts > 0
                        ? "bg-destructive"
                        : haccpStatus.measured >= haccpStatus.totalFridges
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${haccpStatus.totalFridges > 0 ? (haccpStatus.measured / haccpStatus.totalFridges) * 100 : 0}%` }}
                  />
                </div>
                {haccpStatus.alerts > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {haccpStatus.alerts} Warnung{haccpStatus.alerts > 1 ? "en" : ""}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Keine Kühlgeräte erfasst</p>
                <Link href="/haccp">
                  <Button variant="outline" size="sm" className="mt-2">
                    Einrichten
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Summary */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Aufgaben
              </CardTitle>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary">
                    <Plus className="h-3 w-3 mr-1" /> Neu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neuer Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titel *</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Was ist zu tun?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notiz</Label>
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Optionale Details..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priorität</Label>
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Niedrig</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Hoch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting || !newTitle.trim()}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Task erstellen
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {tasks.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Circle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{openTasks.length}</span>
                    <span className="text-muted-foreground">offen</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{doneTasks.length}</span>
                    <span className="text-muted-foreground">erledigt</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${tasks.length > 0 ? (doneTasks.length / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Keine Aufgaben für heute</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <QuickAction href="/rotation" icon={CalendarDays} label="Planung" color="text-blue-600" />
          <QuickAction href="/recipes" icon={ChefHat} label="Rezepte" color="text-primary" />
          <QuickAction href="/shopping" icon={ShoppingCart} label="Einkauf" color="text-green-600" />
          <QuickAction href="/production" icon={ClipboardList} label="Produktion" color="text-amber-600" />
          <QuickAction href="/agent-team" icon={Bot} label="Briefing" color="text-indigo-600" />
        </div>
      </div>

      {/* Task List */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Aufgaben Details
          </h2>

          {openTasks.length > 0 && (
            <div className="space-y-2">
              {openTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleStatus(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Erledigt ({doneTasks.length})</p>
              {doneTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleStatus(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors w-full press active:scale-[0.98]">
        <Icon className={`h-6 w-6 ${color}`} />
        <span className="text-[11px] font-medium text-foreground leading-tight">{label}</span>
      </button>
    </Link>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "done";
  const priorityColors: Record<string | number, string> = {
    0: "border-l-gray-400",
    1: "border-l-blue-500",
    2: "border-l-red-500",
    low: "border-l-gray-400",
    normal: "border-l-blue-500",
    high: "border-l-red-500",
  };

  return (
    <Card className={`border-l-4 ${priorityColors[task.priority] || priorityColors[1]}`}>
      <CardContent className="p-3 flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 touch-manipulation"
          style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDone ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          {task.note && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{task.note}</p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Task löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie "{task.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

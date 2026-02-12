import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalDate } from "@shared/constants";
import { Loader2, ChevronLeft, ChevronRight, X, Trash2, Download, FileSpreadsheet, Users, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useLocationFilter } from "@/lib/location-context";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import StaffView from "./ScheduleStaff";
import ShiftTypesView from "./ScheduleShifts";

interface Staff {
  id: number;
  name: string;
  role: string;
  color: string;
  email: string | null;
  phone: string | null;
}

interface ScheduleEntry {
  id: number;
  staffId: number;
  date: string;
  type: string;
  shiftTypeId: number | null;
  shift: string | null;
  notes: string | null;
}

interface ShiftType {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

const ENTRY_TYPES = [
  { key: "shift", color: "bg-primary" },
  { key: "vacation", color: "bg-green-500" },
  { key: "sick", color: "bg-orange-500" },
  { key: "off", color: "bg-gray-400" },
  { key: "wor", color: "bg-yellow-500" },
];

function formatDate(date: Date): string {
  return formatLocalDate(date);
}

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMonthDates(baseDate: Date): Date[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const dates: Date[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

const WEEKDAY_KEYS = ["mo", "di", "mi", "do", "fr", "sa", "so"] as const;
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function Schedule() {
  const { t } = useTranslation();
  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">{t("schedule.title")}</h1>
      </div>
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">{t("schedule.calendar")}</TabsTrigger>
          <TabsTrigger value="staff">{t("schedule.staff")}</TabsTrigger>
          <TabsTrigger value="dienste">{t("schedule.shifts")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="mt-4">
          <ScheduleView />
        </TabsContent>
        
        <TabsContent value="staff" className="mt-4">
          <StaffView />
        </TabsContent>
        
        <TabsContent value="dienste" className="mt-4">
          <ShiftTypesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleView() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [draggedItem, setDraggedItem] = useState<{ type: string; shiftTypeId?: number; label: string } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationFilter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data) {
      setDraggedItem({ type: data.entryType, shiftTypeId: data.shiftTypeId, label: data.label });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event;
    setDraggedItem(null);
    if (!over || !draggedItem) return;

    const dropData = over.data.current;
    if (!dropData) return;
    const { staffId, date } = dropData as { staffId: number; date: string };

    const existing = getEntry(staffId, date);
    const payload = {
      type: draggedItem.type,
      shiftTypeId: draggedItem.type === "shift" && draggedItem.shiftTypeId ? draggedItem.shiftTypeId : null,
    };

    try {
      if (existing) {
        await fetch(`/api/schedule/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffId, date, ...payload }),
        });
      }
      toast({ title: t("common.saved") });
      fetchData();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const getDates = () => {
    if (viewMode === "day") return [baseDate];
    if (viewMode === "month") return getMonthDates(baseDate);
    return getWeekDates(baseDate);
  };

  const dates = getDates();
  const startDate = formatDate(dates[0]);
  const endDate = formatDate(dates[dates.length - 1]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const locParam = selectedLocationId ? `&locationId=${selectedLocationId}` : "";
      const staffLocParam = selectedLocationId ? `?locationId=${selectedLocationId}` : "";
      const [staffRes, entriesRes, shiftTypesRes] = await Promise.all([
        fetch(`/api/staff${staffLocParam}`),
        fetch(`/api/schedule?start=${startDate}&end=${endDate}${locParam}`),
        fetch('/api/shift-types')
      ]);
      const staffData = await staffRes.json();
      const entriesData = await entriesRes.json();
      const shiftTypesData = await shiftTypesRes.json();
      setStaffList(staffData);
      setEntries(entriesData);
      setShiftTypes(shiftTypesData);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast({ title: t("schedule.loadingError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedLocationId]);
  
  const getShiftType = (id: number | null) => {
    return shiftTypes.find(st => st.id === id);
  };

  const getEntry = (staffId: number, date: string) => {
    return entries.find(e => e.staffId === staffId && e.date === date);
  };

  const navigate = (direction: number) => {
    const d = new Date(baseDate);
    if (viewMode === "day") d.setDate(d.getDate() + direction);
    else if (viewMode === "week") d.setDate(d.getDate() + direction * 7);
    else d.setMonth(d.getMonth() + direction);
    setBaseDate(d);
  };

  const getDateLabel = () => {
    if (viewMode === "day") {
      return baseDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (viewMode === "month") {
      return baseDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }
    return `KW ${getWeekNumber(dates[0])} • ${dates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} - ${dates[dates.length - 1].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} size="sm" data-testid="schedule-view-toggle">
          <ToggleGroupItem value="day" data-testid="toggle-view-day">{t("schedule.day")}</ToggleGroupItem>
          <ToggleGroupItem value="week" data-testid="toggle-view-week">{t("schedule.week")}</ToggleGroupItem>
          <ToggleGroupItem value="month" data-testid="toggle-view-month">{t("schedule.month")}</ToggleGroupItem>
        </ToggleGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1" data-testid="button-export">
              <Download className="h-4 w-4" /> {t("common.export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => window.open(`/api/schedule/export?start=${startDate}&end=${endDate}&format=pdf`, '_blank')} data-testid="export-pdf">
              <Download className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/api/schedule/export?start=${startDate}&end=${endDate}&format=xlsx`, '_blank')} data-testid="export-xlsx">
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(-1)} data-testid="button-nav-prev">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          className="font-medium text-sm text-center px-2 py-1 rounded hover:bg-secondary/50 transition-colors"
          onClick={() => setBaseDate(new Date())}
          data-testid="text-date-label"
          title={t("schedule.backToToday")}
        >
          {getDateLabel()}
        </button>
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(1)} data-testid="button-nav-next">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Draggable palette — visible in day/week mode when staff exist */}
      {!loading && staffList.length > 0 && viewMode !== "month" && (
        <div className="flex gap-2 flex-wrap items-center">
          {shiftTypes.map(st => (
            <DraggablePaletteItem
              key={`shift-${st.id}`}
              id={`palette-shift-${st.id}`}
              entryType="shift"
              shiftTypeId={st.id}
              label={st.name}
              color={st.color}
            />
          ))}
          {shiftTypes.length > 0 && <div className="border-l h-6 mx-0.5" />}
          {ENTRY_TYPES.filter(et => et.key !== "shift").map(et => (
            <DraggablePaletteItem
              key={`type-${et.key}`}
              id={`palette-${et.key}`}
              entryType={et.key}
              label={t(`schedule.entryTypes.${et.key}`)}
              colorClass={et.color}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">{t("schedule.noStaffTitle")}</p>
          <p className="text-xs mt-1">{t("schedule.noStaffHint")}</p>
        </div>
      ) : viewMode === "month" ? (
        <MonthScheduleView dates={dates} staffList={staffList} entries={entries} getEntry={getEntry} shiftTypes={shiftTypes} onSave={fetchData} />
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left p-2 border font-medium">{t("schedule.staffNumber")}</th>
                <th className="text-left p-2 border font-medium min-w-[120px]">{t("schedule.staffName")}</th>
                {dates.map((date, idx) => {
                  const isToday = formatDate(new Date()) === formatDate(date);
                  const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
                  const isWeekend = dayIdx >= 5;
                  return (
                    <th key={idx} className={`p-1 text-center min-w-[70px] border ${isToday ? 'bg-primary/20' : isWeekend ? 'bg-secondary/80' : 'bg-secondary'}`}>
                      <div className="text-muted-foreground text-[10px]">{t(`weekdays.${WEEKDAY_KEYS[dayIdx]}`)}</div>
                      <div className="font-bold">{date.getDate()}.{(date.getMonth()+1).toString().padStart(2,'0')}.</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff, staffIdx) => (
                <tr key={staff.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 border text-center text-muted-foreground">{staffIdx + 1}</td>
                  <td className="p-2 border">
                    <span className="font-medium">{staff.name}</span>
                  </td>
                  {dates.map((date) => {
                    const dateStr = formatDate(date);
                    const entry = getEntry(staff.id, dateStr);
                    const isToday = formatDate(new Date()) === dateStr;
                    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
                    const isWeekend = dayIdx >= 5;

                    return (
                      <DroppableScheduleCell
                        key={dateStr}
                        staffId={staff.id}
                        date={dateStr}
                        entry={entry}
                        staffColor={staff.color}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        shiftTypes={shiftTypes}
                        onSave={fetchData}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="bg-secondary/20">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2">{t("schedule.legend")}</div>
          <div className="flex gap-2 flex-wrap text-[10px]">
            {ENTRY_TYPES.map(type => (
              <Badge key={type.key} variant="outline" className="gap-1">
                <div className={`w-2 h-2 rounded-full ${type.color}`} />
                {t(`schedule.entryTypes.${type.key}`)}
              </Badge>
            ))}
            {shiftTypes.length > 0 && <div className="border-l mx-1" />}
            {shiftTypes.map(st => (
              <Badge key={st.id} variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                {st.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <DragOverlay>
      {draggedItem && (
        <Badge className="shadow-lg text-xs px-3 py-1.5 pointer-events-none">
          {draggedItem.label}
        </Badge>
      )}
    </DragOverlay>
    </DndContext>
  );
}

function MonthScheduleView({ dates, staffList, entries, getEntry, shiftTypes, onSave }: {
  dates: Date[];
  staffList: Staff[];
  entries: ScheduleEntry[];
  getEntry: (staffId: number, date: string) => ScheduleEntry | undefined;
  shiftTypes: ShiftType[];
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const firstDayOffset = dates[0].getDay() === 0 ? 6 : dates[0].getDay() - 1;

  const getStaffForDay = (dateStr: string) => {
    return entries.filter(e => e.date === dateStr);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_KEYS.map(k => <div key={k}>{t(`weekdays.${k}`)}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDayOffset).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="h-20" />
        ))}
        {dates.map(date => {
          const dateStr = formatDate(date);
          const isToday = formatDate(new Date()) === dateStr;
          const dayEntries = getStaffForDay(dateStr);
          
          return (
            <MonthDayScheduleCell 
              key={dateStr}
              date={dateStr}
              dayNum={date.getDate()}
              isToday={isToday}
              entries={dayEntries}
              staffList={staffList}
              shiftTypes={shiftTypes}
              onSave={onSave}
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthDayScheduleCell({ date, dayNum, isToday, entries, staffList, shiftTypes, onSave }: {
  date: string;
  dayNum: number;
  isToday: boolean;
  entries: ScheduleEntry[];
  staffList: Staff[];
  shiftTypes: ShiftType[];
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const getStaffColor = (staffId: number) => {
    return staffList.find(s => s.id === staffId)?.color || '#888';
  };

  const getStaffName = (staffId: number) => {
    const staff = staffList.find(s => s.id === staffId);
    return staff?.name?.split(' ')[0] || '?';
  };

  const getTypeIcon = (type: string, shiftTypeId?: number | null) => {
    if (type === 'shift') {
      const st = shiftTypes.find(s => s.id === shiftTypeId);
      return st ? `${st.startTime.substring(0,5)}` : '📅';
    }
    if (type === 'vacation') return '🌴';
    if (type === 'sick') return '🤒';
    if (type === 'wor') return 'WOR';
    return '✕';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`min-h-20 p-1 rounded border text-left overflow-hidden ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 transition-colors`}>
          <div className="text-xs text-muted-foreground font-medium">{dayNum}</div>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {entries.slice(0, 3).map((entry, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-0.5 text-[7px] leading-tight px-0.5 py-0.5 rounded"
                style={{ backgroundColor: getStaffColor(entry.staffId) + '25' }}
              >
                <span>{getTypeIcon(entry.type, entry.shiftTypeId)}</span>
                <span className="truncate font-medium" style={{ color: getStaffColor(entry.staffId) }}>
                  {getStaffName(entry.staffId)}
                </span>
              </div>
            ))}
            {entries.length > 3 && (
              <span className="text-[7px] text-muted-foreground">{t("schedule.more", { count: entries.length - 3 })}</span>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {staffList.map(staff => {
            const entry = entries.find(e => e.staffId === staff.id);
            return (
              <DayStaffRow 
                key={staff.id}
                staff={staff}
                date={date}
                entry={entry}
                shiftTypes={shiftTypes}
                onSave={() => { setOpen(false); onSave(); }}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DayStaffRow({ staff, date, entry, shiftTypes, onSave }: {
  staff: Staff;
  date: string;
  entry: ScheduleEntry | undefined;
  shiftTypes: ShiftType[];
  onSave: () => void;
}) {
  const [type, setType] = useState(entry?.type || "shift");
  const [shiftTypeId, setShiftTypeId] = useState<string>(entry?.shiftTypeId?.toString() || (shiftTypes[0]?.id?.toString() || ""));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        type,
        shiftTypeId: type === 'shift' && shiftTypeId ? parseInt(shiftTypeId) : null
      };
      if (entry) {
        await fetch(`/api/schedule/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId: staff.id, date, ...payload })
        });
      }
      toast({ title: t("common.saved") });
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded">
      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: staff.color }} />
      <span className="font-medium text-sm flex-1 truncate">{staff.name}</span>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {ENTRY_TYPES.map(et => <SelectItem key={et.key} value={et.key}>{t(`schedule.entryTypes.${et.key}`)}</SelectItem>)}
        </SelectContent>
      </Select>
      {type === 'shift' && shiftTypes.length > 0 && (
        <Select value={shiftTypeId} onValueChange={setShiftTypeId}>
          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {shiftTypes.map(st => <SelectItem key={st.id} value={st.id.toString()}>{st.startTime}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Button size="sm" className="h-7" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
      </Button>
    </div>
  );
}

function DraggablePaletteItem({ id, entryType, shiftTypeId, label, color, colorClass }: {
  id: string;
  entryType: string;
  shiftTypeId?: number;
  label: string;
  color?: string;
  colorClass?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { entryType, shiftTypeId, label },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background cursor-grab active:cursor-grabbing touch-none text-xs font-medium",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      <div
        className={cn("w-2.5 h-2.5 rounded-full shrink-0", colorClass)}
        style={color ? { backgroundColor: color } : undefined}
      />
      {label}
    </div>
  );
}

function DroppableScheduleCell(props: {
  staffId: number;
  date: string;
  entry: ScheduleEntry | undefined;
  staffColor: string;
  isToday: boolean;
  isWeekend?: boolean;
  shiftTypes: ShiftType[];
  onSave: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${props.staffId}-${props.date}`,
    data: { staffId: props.staffId, date: props.date },
  });

  return (
    <ScheduleCell {...props} dropRef={setNodeRef} isDropOver={isOver} />
  );
}

function ScheduleCell({ staffId, date, entry, staffColor, isToday, isWeekend, shiftTypes, onSave, dropRef, isDropOver }: {
  staffId: number;
  date: string;
  entry: ScheduleEntry | undefined;
  staffColor: string;
  isToday: boolean;
  isWeekend?: boolean;
  shiftTypes: ShiftType[];
  onSave: () => void;
  dropRef?: (el: HTMLElement | null) => void;
  isDropOver?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(entry?.type || "shift");
  const [shiftTypeId, setShiftTypeId] = useState<string>(entry?.shiftTypeId?.toString() || (shiftTypes[0]?.id?.toString() || ""));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setType(entry?.type || "shift");
    setShiftTypeId(entry?.shiftTypeId?.toString() || (shiftTypes[0]?.id?.toString() || ""));
    setNotes(entry?.notes || "");
  }, [entry, shiftTypes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        type,
        shiftTypeId: type === 'shift' && shiftTypeId ? parseInt(shiftTypeId) : null,
        notes: notes || null
      };
      
      if (entry) {
        await fetch(`/api/schedule/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, date, ...payload })
        });
      }
      toast({ title: t("common.saved") });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      await fetch(`/api/schedule/${entry.id}`, { method: 'DELETE' });
      toast({ title: t("common.deleted") });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getShiftTypeInfo = (id: number | null) => {
    return shiftTypes.find(st => st.id === id);
  };

  const getDisplayContent = () => {
    if (!entry) return <span className="text-muted-foreground text-[10px]">-</span>;
    
    if (entry.type === 'shift') {
      const shiftType = getShiftTypeInfo(entry.shiftTypeId);
      if (shiftType) {
        return (
          <div className="text-[9px] leading-tight text-center">
            <div className="font-medium">{shiftType.startTime}-{shiftType.endTime}</div>
          </div>
        );
      }
      return <span className="text-[10px]">{t("schedule.entryTypes.shift")}</span>;
    }
    if (entry.type === 'vacation') return <span className="text-[9px] text-green-600 font-medium">{t("schedule.entryTypes.vacation")}</span>;
    if (entry.type === 'sick') return <span className="text-[9px] text-orange-600 font-medium">{t("schedule.entryTypes.sick")}</span>;
    if (entry.type === 'wor') return <span className="text-[9px] text-yellow-600 font-medium">{t("schedule.entryTypes.wor")}</span>;
    if (entry.type === 'off') return <span className="text-[9px] text-gray-500 font-medium">{t("schedule.entryTypes.off")}</span>;
    return <X className="h-3 w-3 text-gray-400" />;
  };

  const bgColor = () => {
    if (!entry) return isWeekend ? 'bg-secondary/30' : '';
    if (entry.type === 'vacation') return 'bg-green-100';
    if (entry.type === 'sick') return 'bg-orange-100';
    if (entry.type === 'wor') return 'bg-amber-100';
    if (entry.type === 'off') return 'bg-gray-100';
    if (isWeekend) return 'bg-secondary/50';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <td
          ref={dropRef}
          className={cn(
            "p-1 text-center cursor-pointer hover:bg-secondary/50 active:bg-secondary/70 transition-colors border",
            isToday && "ring-2 ring-primary ring-inset",
            isDropOver && "ring-2 ring-primary bg-primary/10",
            bgColor()
          )}
        >
          <div className="min-h-[40px] flex items-center justify-center">
            {getDisplayContent()}
          </div>
        </td>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("schedule.type")}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map(et => (
                  <SelectItem key={et.key} value={et.key}>{t(`schedule.entryTypes.${et.key}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {type === 'shift' && shiftTypes.length > 0 && (
            <div className="space-y-2">
              <Label>{t("schedule.shift")}</Label>
              <Select value={shiftTypeId} onValueChange={setShiftTypeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {shiftTypes.map(st => (
                    <SelectItem key={st.id} value={st.id.toString()}>
                      {st.name} ({st.startTime}-{st.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("schedule.notesLabel")}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("common.optional")} />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("common.save")}
            </Button>
            {entry && (
              <Button variant="destructive" size="icon" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalDate } from "@shared/constants";
import { Loader2, Users, Baby, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocationFilter } from "@/lib/location-context";
import { useTranslation } from "@/hooks/useTranslation";

interface GuestCount {
  id: number;
  date: string;
  meal: string;
  adults: number;
  children: number;
  notes: string | null;
}

const MEAL_KEYS = ["breakfast", "lunch", "dinner"] as const;

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

export default function Guests() {
  const { t } = useTranslation();
  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">{t("guests.title")}</h1>
      </div>
      <GuestCountsView />
    </div>
  );
}

function GuestCountsView() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [counts, setCounts] = useState<GuestCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const { toast } = useToast();
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationFilter();

  const getDates = () => {
    if (viewMode === "day") return [baseDate];
    if (viewMode === "month") return getMonthDates(baseDate);
    return getWeekDates(baseDate);
  };

  const dates = getDates();
  const startDate = formatDate(dates[0]);
  const endDate = formatDate(dates[dates.length - 1]);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const locParam = selectedLocationId ? `&locationId=${selectedLocationId}` : "";
      const res = await fetch(`/api/guests?start=${startDate}&end=${endDate}${locParam}`);
      const data = await res.json();
      setCounts(data);
    } catch (error) {
      console.error('Failed to fetch guests:', error);
      toast({ title: t("guests.errorLoading"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [startDate, endDate, selectedLocationId]);

  const getCount = (date: string, meal: string) => {
    return counts.find(c => c.date === date && c.meal === meal);
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
    return `${dates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} - ${dates[dates.length - 1].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const getTotalForPeriod = () => {
    let adults = 0, children = 0;
    for (const count of counts) {
      adults += count.adults;
      children += count.children;
    }
    return { adults, children, total: adults + children };
  };

  const periodTotals = getTotalForPeriod();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} size="sm" data-testid="guests-view-toggle">
          <ToggleGroupItem value="day" data-testid="toggle-view-day">{t("guests.day")}</ToggleGroupItem>
          <ToggleGroupItem value="week" data-testid="toggle-view-week">{t("guests.week")}</ToggleGroupItem>
          <ToggleGroupItem value="month" data-testid="toggle-view-month">{t("guests.month")}</ToggleGroupItem>
        </ToggleGroup>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1" data-testid="button-export">
              <Download className="h-4 w-4" /> {t("common.export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => window.open(`/api/guest-counts/export?start=${startDate}&end=${endDate}&format=pdf`, '_blank')}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/api/guest-counts/export?start=${startDate}&end=${endDate}&format=xlsx`, '_blank')}>
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

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : viewMode === "month" ? (
        <MonthView dates={dates} counts={counts} getCount={getCount} onSave={fetchCounts} />
      ) : (
        <div className="space-y-4">
          {MEAL_KEYS.map(mealKey => (
            <Card key={mealKey}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium">{t(`meals.${mealKey}`)}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className={`grid gap-1 text-center text-xs ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
                  {dates.map((date, idx) => {
                    const dateStr = formatDate(date);
                    const count = getCount(dateStr, mealKey);
                    const isToday = formatDate(new Date()) === dateStr;
                    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;

                    return (
                      <GuestCell
                        key={dateStr}
                        date={dateStr}
                        dayName={t(`weekdays.${WEEKDAY_KEYS[dayIdx]}`)}
                        dayNum={date.getDate()}
                        meal={mealKey}
                        count={count}
                        isToday={isToday}
                        onSave={fetchCounts}
                        showDayName={viewMode === "week"}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
            {t("guests.totalSummary")} ({viewMode === "day" ? t("guests.day") : viewMode === "week" ? t("guests.week") : t("guests.month")})
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background rounded-lg p-2 border">
              <div className="text-2xl font-bold text-primary">{periodTotals.total}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{t("common.total")}</div>
            </div>
            <div className="bg-background rounded-lg p-2 border">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-semibold">{periodTotals.adults}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">{t("guests.adults")}</div>
            </div>
            <div className="bg-background rounded-lg p-2 border">
              <div className="flex items-center justify-center gap-1">
                <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-semibold">{periodTotals.children}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">{t("guests.children")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthView({ dates, counts, getCount, onSave }: {
  dates: Date[];
  counts: GuestCount[];
  getCount: (date: string, meal: string) => GuestCount | undefined;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const firstDayOffset = dates[0].getDay() === 0 ? 6 : dates[0].getDay() - 1;
  
  const getDayTotal = (dateStr: string) => {
    let total = 0;
    MEAL_KEYS.forEach(mealKey => {
      const count = getCount(dateStr, mealKey);
      total += (count?.adults || 0) + (count?.children || 0);
    });
    return total;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_KEYS.map(k => <div key={k}>{t(`weekdays.${k}`)}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDayOffset).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="h-16" />
        ))}
        {dates.map(date => {
          const dateStr = formatDate(date);
          const isToday = formatDate(new Date()) === dateStr;
          const total = getDayTotal(dateStr);
          
          return (
            <MonthDayCell 
              key={dateStr}
              date={dateStr}
              dayNum={date.getDate()}
              isToday={isToday}
              total={total}
              getCount={getCount}
              onSave={onSave}
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthDayCell({ date, dayNum, isToday, total, getCount, onSave }: {
  date: string;
  dayNum: number;
  isToday: boolean;
  total: number;
  getCount: (date: string, meal: string) => GuestCount | undefined;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`h-16 p-1.5 rounded-lg border text-center ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 active:scale-95 transition-all`}>
          <div className="text-xs text-muted-foreground">{dayNum}</div>
          <div className="text-lg font-bold">{total || '-'}</div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {MEAL_KEYS.map(mealKey => {
            const count = getCount(date, mealKey);
            return (
              <MealInputRow
                key={mealKey}
                date={date}
                meal={mealKey}
                mealName={t(`meals.${mealKey}`)}
                count={count}
                onSave={() => { setOpen(false); onSave(); }}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MealInputRow({ date, meal, mealName, count, onSave }: {
  date: string;
  meal: string;
  mealName: string;
  count: GuestCount | undefined;
  onSave: () => void;
}) {
  const [adults, setAdults] = useState(String(count?.adults || 0));
  const [children, setChildren] = useState(String(count?.children || 0));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, meal, adults: parseInt(adults) || 0, children: parseInt(children) || 0 })
      });
      toast({ title: t("common.saved") });
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{mealName}</div>
      <div className="flex gap-2 items-center">
        <Input type="number" value={adults} onChange={(e) => setAdults(e.target.value)} min="0" className="w-16 h-8 text-center" placeholder="Erw" />
        <span className="text-xs text-muted-foreground">+</span>
        <Input type="number" value={children} onChange={(e) => setChildren(e.target.value)} min="0" className="w-16 h-8 text-center" placeholder="Kind" />
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
        </Button>
      </div>
    </div>
  );
}

function GuestCell({ date, dayName, dayNum, meal, count, isToday, onSave, showDayName }: {
  date: string;
  dayName: string;
  dayNum: number;
  meal: string;
  count: GuestCount | undefined;
  isToday: boolean;
  onSave: () => void;
  showDayName: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adults, setAdults] = useState(String(count?.adults || 0));
  const [children, setChildren] = useState(String(count?.children || 0));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setAdults(String(count?.adults || 0));
    setChildren(String(count?.children || 0));
  }, [count]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          meal,
          adults: parseInt(adults) || 0,
          children: parseInt(children) || 0
        })
      });
      toast({ title: t("common.saved") });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const total = (count?.adults || 0) + (count?.children || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`p-2 rounded-lg border min-h-[48px] ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 active:scale-95 transition-all`}>
          {showDayName && <div className="text-[10px] text-muted-foreground">{dayName}</div>}
          <div className="font-bold text-lg">{total || '-'}</div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{dayName}, {dayNum}. - {t(`meals.${meal}`)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> {t("guests.adults")}</Label>
              <Input type="number" value={adults} onChange={(e) => setAdults(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Baby className="h-3 w-3" /> {t("guests.children")}</Label>
              <Input type="number" value={children} onChange={(e) => setChildren(e.target.value)} min="0" />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


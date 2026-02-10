import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface ShiftType {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function ShiftTypesView() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchShiftTypes = async () => {
    try {
      const res = await fetch('/api/shift-types');
      const data = await res.json();
      setShiftTypes(data);
    } catch (error) {
      console.error('Failed to fetch shift types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftTypes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t("scheduleShifts.deleteConfirm"))) return;
    try {
      await fetch(`/api/shift-types/${id}`, { method: 'DELETE' });
      toast({ title: t("scheduleShifts.deleted") });
      fetchShiftTypes();
    } catch (error) {
      toast({ title: t("common.error"), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t("scheduleShifts.count", { count: shiftTypes.length })}
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1 min-h-[44px]">
          <PlusCircle className="h-4 w-4" /> {t("scheduleShifts.newShift")}
        </Button>
      </div>

      {shiftTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <PlusCircle className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">{t("scheduleShifts.noShifts")}</p>
            <p className="text-sm text-muted-foreground">{t("scheduleShifts.noShiftsHint")}</p>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1 min-h-[44px]">
              <PlusCircle className="h-4 w-4" /> {t("scheduleShifts.firstShift")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {shiftTypes.map(st => (
            <Card key={st.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: st.color }}
                  />
                  <div>
                    <div className="font-medium">{st.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {st.startTime.substring(0, 5)} - {st.endTime.substring(0, 5)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ShiftTypeEditDialog shiftType={st} onSave={fetchShiftTypes} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(st.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShiftTypeAddDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSave={() => { setShowAdd(false); fetchShiftTypes(); }}
      />
    </div>
  );
}

function ShiftTypeAddDialog({ open, onOpenChange, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:30');
  const [color, setColor] = useState('#F37021');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: t("scheduleShifts.nameRequired"), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/shift-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startTime, endTime, color })
      });
      toast({ title: t("scheduleShifts.created") });
      setName('');
      setStartTime('08:00');
      setEndTime('16:30');
      onSave();
    } catch (error) {
      toast({ title: t("common.error"), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("scheduleShifts.createShift")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.name")}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t("scheduleShifts.namePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("scheduleShifts.startTime")}</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("scheduleShifts.endTime")}</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("scheduleShifts.color")}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <button
                type="button"
                className={`w-10 h-10 rounded-full border-2 ${color === '#F37021' ? 'border-foreground' : 'border-transparent'}`}
                style={{ backgroundColor: '#F37021' }}
                onClick={() => setColor('#F37021')}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("common.create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShiftTypeEditDialog({ shiftType, onSave }: { shiftType: ShiftType; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(shiftType.name);
  const [startTime, setStartTime] = useState(shiftType.startTime.substring(0, 5));
  const [endTime, setEndTime] = useState(shiftType.endTime.substring(0, 5));
  const [color, setColor] = useState(shiftType.color);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/shift-types/${shiftType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startTime, endTime, color })
      });
      toast({ title: t("common.saved") });
      setOpen(false);
      onSave();
    } catch (error) {
      toast({ title: t("common.error"), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("scheduleShifts.editShift")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.name")}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("scheduleShifts.startTime")}</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("scheduleShifts.endTime")}</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("scheduleShifts.color")}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <button
                type="button"
                className={`w-10 h-10 rounded-full border-2 ${color === '#F37021' ? 'border-foreground' : 'border-transparent'}`}
                style={{ backgroundColor: '#F37021' }}
                onClick={() => setColor('#F37021')}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("common.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

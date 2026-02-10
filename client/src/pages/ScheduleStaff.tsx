import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocationFilter } from "@/lib/location-context";

interface Staff {
  id: number;
  name: string;
  role: string;
  color: string;
  email: string | null;
  phone: string | null;
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function StaffView() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationFilter();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const locParam = selectedLocationId ? `?locationId=${selectedLocationId}` : "";
      const res = await fetch(`/api/staff${locParam}`);
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [selectedLocationId]);

  const handleDelete = async (id: number) => {
    if (!confirm(t("scheduleStaff.deleteConfirm"))) return;
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      toast({ title: t("common.deleted") });
      fetchStaff();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddStaffDialog onSave={fetchStaff} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">{t("scheduleStaff.noStaff")}</p>
          <p className="text-sm text-muted-foreground">{t("scheduleStaff.noStaffHint")}</p>
          <AddStaffDialog onSave={fetchStaff} />
        </div>
      ) : (
        <div className="space-y-2">
          {staffList.map(member => (
            <Card key={member.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: member.color }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <EditStaffDialog member={member} onSave={fetchStaff} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddStaffDialog({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Koch");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, color })
      });
      toast({ title: t("scheduleStaff.added") });
      setOpen(false);
      setName("");
      onSave();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" /> {t("scheduleStaff.newStaff")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("scheduleStaff.addStaff")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("scheduleStaff.namePlaceholder")} required />
          </div>
          <div className="space-y-2">
            <Label>{t("scheduleStaff.role")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Koch">{t("scheduleStaff.roles.Koch")}</SelectItem>
                <SelectItem value="Sous-Chef">{t("scheduleStaff.roles.Sous-Chef")}</SelectItem>
                <SelectItem value="Küchenchef">{t("scheduleStaff.roles.Küchenchef")}</SelectItem>
                <SelectItem value="Beikoch">{t("scheduleStaff.roles.Beikoch")}</SelectItem>
                <SelectItem value="Auszubildender">{t("scheduleStaff.roles.Auszubildender")}</SelectItem>
                <SelectItem value="Küchenhilfe">{t("scheduleStaff.roles.Küchenhilfe")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("scheduleStaff.color")}</Label>
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
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("common.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditStaffDialog({ member, onSave }: { member: Staff; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [color, setColor] = useState(member.color);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, color })
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("scheduleStaff.editStaff")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t("scheduleStaff.role")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Koch">{t("scheduleStaff.roles.Koch")}</SelectItem>
                <SelectItem value="Sous-Chef">{t("scheduleStaff.roles.Sous-Chef")}</SelectItem>
                <SelectItem value="Küchenchef">{t("scheduleStaff.roles.Küchenchef")}</SelectItem>
                <SelectItem value="Beikoch">{t("scheduleStaff.roles.Beikoch")}</SelectItem>
                <SelectItem value="Auszubildender">{t("scheduleStaff.roles.Auszubildender")}</SelectItem>
                <SelectItem value="Küchenhilfe">{t("scheduleStaff.roles.Küchenhilfe")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("scheduleStaff.color")}</Label>
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
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("common.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

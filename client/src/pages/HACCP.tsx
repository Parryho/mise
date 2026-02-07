import { useState, useMemo } from "react";
import { useApp, Fridge } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThermometerSnowflake, History, Loader2, PlusCircle, Pencil, Trash2, Download, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import LocationSwitcher from "@/components/LocationSwitcher";
import { useLocationFilter } from "@/lib/location-context";

export default function HACCP() {
  const { fridges: allFridges, logs, loading } = useApp();
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationFilter();

  const fridges = selectedLocationId
    ? allFridges.filter(f => f.locationId === selectedLocationId)
    : allFridges;

  const getLatestLog = (fridgeId: number) => {
    return logs.find(l => l.fridgeId === fridgeId);
  };

  // Today's alerts (warnings + critical)
  const todayAlerts = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(l => {
      const logDate = new Date(l.timestamp).toDateString();
      return logDate === today && (l.status === "WARNING" || l.status === "CRITICAL");
    });
  }, [logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">{t("haccp")}</h1>
        <div className="flex gap-2">
          <AddFridgeDialog />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => window.open('/api/haccp-logs/export', '_blank')}
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>
      <LocationSwitcher />

      {/* Alert banner for today's out-of-range readings */}
      {todayAlerts.length > 0 && (
        <div className={`px-3 py-2.5 rounded-lg border flex items-start gap-2 ${
          todayAlerts.some(a => a.status === "CRITICAL")
            ? "bg-red-50 border-red-300 text-red-800"
            : "bg-amber-50 border-amber-300 text-amber-800"
        }`}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">
              {todayAlerts.length} {todayAlerts.length === 1 ? "Abweichung" : "Abweichungen"} heute
            </span>
            <div className="text-xs mt-0.5 space-y-0.5">
              {todayAlerts.slice(0, 3).map(a => {
                const fname = allFridges.find(f => f.id === a.fridgeId)?.name || "?";
                return (
                  <div key={a.id}>
                    {fname}: <span className="font-mono font-bold">{a.temperature}°C</span>
                    {a.status === "CRITICAL" && <span className="ml-1 text-red-600 font-bold">KRITISCH</span>}
                  </div>
                );
              })}
              {todayAlerts.length > 3 && <div>+{todayAlerts.length - 3} weitere</div>}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {fridges.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("noData")}</p>
          </div>
        ) : (
          fridges.map(fridge => {
            const latest = getLatestLog(fridge.id);
            const isCritical = latest?.status === "CRITICAL";
            const isWarning = latest && (latest.status === "WARNING" || latest.status === "CRITICAL");

            return (
              <Card key={fridge.id} className={`overflow-hidden border-l-4 ${isCritical ? 'border-l-red-600' : isWarning ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-lg">{fridge.name}</h3>
                        <EditFridgeDialog fridge={fridge} />
                      </div>
                      <p className="text-xs text-muted-foreground">{t("range")}: {fridge.tempMin}°C bis {fridge.tempMax}°C</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                      isCritical ? 'bg-red-100 text-red-700' :
                      isWarning ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {latest ? (
                        <>
                          <span className="text-lg">{latest.temperature}°C</span>
                          {isCritical && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        </>
                      ) : (
                        t("noData")
                      )}
                    </div>
                  </div>

                  <LogDialog fridge={fridge} />
                  
                  {latest && (
                     <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground flex justify-between">
                       <span>{t("lastCheck")}: {new Date(latest.timestamp).toLocaleString()}</span>
                       <span>{t("by")}: {latest.user}</span>
                     </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function AddFridgeDialog() {
  const { addFridge } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addFridge({
        name,
        tempMin: parseFloat(tempMin),
        tempMax: parseFloat(tempMax)
      });
      toast({ title: "Kühlgerät hinzugefügt" });
      setOpen(false);
      setName("");
      setTempMin("");
      setTempMax("");
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kühlgerät hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Kühlschrank 1" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min. Temperatur (°C)</Label>
              <Input type="number" step="0.1" value={tempMin} onChange={(e) => setTempMin(e.target.value)} placeholder="0" required />
            </div>
            <div className="space-y-2">
              <Label>Max. Temperatur (°C)</Label>
              <Input type="number" step="0.1" value={tempMax} onChange={(e) => setTempMax(e.target.value)} placeholder="4" required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFridgeDialog({ fridge }: { fridge: Fridge }) {
  const { updateFridge, deleteFridge } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fridge.name);
  const [tempMin, setTempMin] = useState(String(fridge.tempMin));
  const [tempMax, setTempMax] = useState(String(fridge.tempMax));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFridge(fridge.id, {
        name,
        tempMin: parseFloat(tempMin),
        tempMax: parseFloat(tempMax)
      });
      toast({ title: "Kühlgerät aktualisiert" });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Kühlgerät und alle zugehörigen Logs wirklich löschen?")) return;
    setDeleting(true);
    try {
      await deleteFridge(fridge.id);
      toast({ title: "Kühlgerät gelöscht" });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kühlgerät bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min. Temperatur (°C)</Label>
              <Input type="number" step="0.1" value={tempMin} onChange={(e) => setTempMin(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Max. Temperatur (°C)</Label>
              <Input type="number" step="0.1" value={tempMax} onChange={(e) => setTempMax(e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("save")}
            </Button>
            <Button type="button" variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogDialog({ fridge }: { fridge: Fridge }) {
  const [temp, setTemp] = useState("");
  const [saving, setSaving] = useState(false);
  const { addLog } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Live status preview
  const previewStatus = (() => {
    const val = parseFloat(temp);
    if (isNaN(val) || temp === "" || temp === "-") return null;
    const deviation = Math.max(fridge.tempMin - val, val - fridge.tempMax, 0);
    if (deviation === 0) return "OK";
    if (deviation > 2) return "CRITICAL";
    return "WARNING";
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const val = parseFloat(temp);
    if (isNaN(val)) return;

    setSaving(true);
    try {
      // Status is calculated server-side, but send client guess for display
      const deviation = Math.max(fridge.tempMin - val, val - fridge.tempMax, 0);
      const status = deviation === 0 ? "OK" : deviation > 2 ? "CRITICAL" : "WARNING";

      await addLog({
        fridgeId: fridge.id,
        temperature: val,
        timestamp: new Date().toISOString(),
        user: "Chef User",
        status,
        notes: null
      });

      if (status === "CRITICAL") {
        toast({
          title: "KRITISCH: Temperatur stark abweichend!",
          description: `${val}°C für ${fridge.name} (Grenze: ${fridge.tempMin}°C – ${fridge.tempMax}°C)`,
          variant: "destructive",
        });
      } else if (status === "WARNING") {
        toast({
          title: t("warningRecorded"),
          description: `${val}°C für ${fridge.name} (Grenze: ${fridge.tempMin}°C – ${fridge.tempMax}°C)`,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("temperatureRecorded"),
          description: `${val}°C für ${fridge.name} erfasst`,
        });
      }

      setOpen(false);
      setTemp("");
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="secondary">
          <ThermometerSnowflake className="mr-2 h-4 w-4" /> {t("logTemperature")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t("logCheck")}: {fridge.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className={`flex flex-col items-center justify-center p-6 rounded-xl border border-dashed ${
            previewStatus === "CRITICAL" ? "bg-red-100 border-red-400" :
            previewStatus === "WARNING" ? "bg-amber-100 border-amber-400" :
            previewStatus === "OK" ? "bg-green-50 border-green-400" :
            "bg-secondary/20"
          }`}>
            <div className="flex items-baseline">
              <span className="text-4xl font-mono font-bold">{temp || "--"}</span>
              <span className="text-muted-foreground ml-1">°C</span>
            </div>
            {previewStatus && previewStatus !== "OK" && (
              <span className={`text-xs font-semibold mt-1 ${previewStatus === "CRITICAL" ? "text-red-600" : "text-amber-600"}`}>
                {previewStatus === "CRITICAL" ? "KRITISCH" : "Warnung"} (Grenze: {fridge.tempMin}° – {fridge.tempMax}°)
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '-'].map(n => (
               <Button 
                 key={n} 
                 type="button" 
                 variant="outline" 
                 className="h-12 text-lg" 
                 onClick={() => setTemp(prev => prev + n)}
               >
                 {n}
               </Button>
             ))}
             <Button 
               type="button" 
               variant="destructive" 
               className="col-span-3" 
               onClick={() => setTemp("")}
             >
               {t("clear")}
             </Button>
          </div>
          
          <Button type="submit" className="w-full h-12 text-lg" disabled={!temp || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("saveRecord")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

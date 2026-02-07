import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Download, Shield, Trash2, Loader2, AlertTriangle,
  User, FileText, Thermometer, ClipboardList, Bell, History, Users, ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

interface DataCounts {
  profile: number;
  haccpLogs: number;
  scheduleEntries: number;
  tasks: number;
  menuPlanTemperatures: number;
  auditLogs: number;
  pushSubscriptions: number;
  staffProfiles: number;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
}

const DATA_CATEGORIES = [
  { key: "profile", label: "Profildaten", icon: User, description: "Name, E-Mail, Position, Rolle" },
  { key: "haccpLogs", label: "HACCP-Protokolle", icon: Thermometer, description: "Temperaturmessungen" },
  { key: "scheduleEntries", label: "Dienstplan-Eintraege", icon: ClipboardList, description: "Schichtzuweisungen" },
  { key: "tasks", label: "Aufgaben", icon: FileText, description: "Zugewiesene Aufgaben" },
  { key: "menuPlanTemperatures", label: "Menuplan-Temperaturen", icon: Thermometer, description: "Ausgabetemperaturen" },
  { key: "auditLogs", label: "Aktivitaetsprotokoll", icon: History, description: "Aenderungshistorie" },
  { key: "pushSubscriptions", label: "Push-Benachrichtigungen", icon: Bell, description: "Geraeteregistrierungen" },
  { key: "staffProfiles", label: "Mitarbeiterprofile", icon: Users, description: "Verknuepfte Mitarbeiterdaten" },
] as const;

export default function GDPRExport() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [counts, setCounts] = useState<DataCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Admin: user management
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [adminCounts, setAdminCounts] = useState<DataCounts | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminExporting, setAdminExporting] = useState(false);
  const [adminDeleteStep, setAdminDeleteStep] = useState<0 | 1 | 2>(0);
  const [adminDeleteConfirmText, setAdminDeleteConfirmText] = useState("");
  const [adminDeleting, setAdminDeleting] = useState(false);

  // Fetch own data counts
  useEffect(() => {
    fetchOwnCounts();
    if (isAdmin) fetchAllUsers();
  }, [isAdmin]);

  // Fetch admin counts when user selected
  useEffect(() => {
    if (selectedUserId) {
      fetchAdminCounts(selectedUserId);
      setAdminDeleteStep(0);
      setAdminDeleteConfirmText("");
    } else {
      setAdminCounts(null);
    }
  }, [selectedUserId]);

  const fetchOwnCounts = async () => {
    try {
      const res = await fetch("/api/gdpr/counts");
      if (res.ok) {
        setCounts(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch GDPR counts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.filter((u: UserInfo) => u.id !== user?.id));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchAdminCounts = async (userId: string) => {
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/gdpr/counts/${userId}`);
      if (res.ok) {
        setAdminCounts(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch user counts:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Export own data
  const handleExportOwn = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/gdpr/export");
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dsgvo_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Datenexport heruntergeladen" });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // Export admin user data
  const handleExportAdmin = async () => {
    if (!selectedUserId) return;
    setAdminExporting(true);
    try {
      const res = await fetch(`/api/gdpr/export/${selectedUserId}`);
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dsgvo_export_${selectedUserId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Datenexport heruntergeladen" });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setAdminExporting(false);
    }
  };

  // Delete own account
  const handleDeleteOwn = async () => {
    if (deleteConfirmText !== "LÖSCHEN") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/gdpr/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "LÖSCHEN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Konto geloescht", description: data.message });
      // Redirect to login after deletion
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
      setDeleting(false);
    }
  };

  // Admin delete user
  const handleDeleteAdmin = async () => {
    if (!selectedUserId || adminDeleteConfirmText !== "LÖSCHEN") return;
    setAdminDeleting(true);
    try {
      const res = await fetch(`/api/gdpr/delete/${selectedUserId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "LÖSCHEN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Benutzer geloescht", description: data.message });
      setSelectedUserId("");
      setAdminDeleteStep(0);
      setAdminDeleteConfirmText("");
      fetchAllUsers();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setAdminDeleting(false);
    }
  };

  const totalOwnRecords = counts ? Object.values(counts).reduce((sum, v) => sum + v, 0) : 0;

  const renderDataCounts = (dataCounts: DataCounts) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {DATA_CATEGORIES.map(cat => {
        const count = dataCounts[cat.key as keyof DataCounts] ?? 0;
        const Icon = cat.icon;
        return (
          <div key={cat.key} className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{count}</div>
              <div className="text-xs text-muted-foreground truncate">{cat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Datenschutz (DSGVO)
          </h1>
          <p className="text-sm text-muted-foreground">
            Daten exportieren, einsehen und Konto loeschen
          </p>
        </div>
      </div>

      {/* ====== OWN DATA SECTION ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meine Daten</CardTitle>
          <CardDescription>
            Uebersicht aller gespeicherten Daten zu Ihrem Konto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : counts ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Insgesamt {totalOwnRecords} Datensaetze in {Object.values(counts).filter(v => v > 0).length} Kategorien
                </span>
              </div>
              {renderDataCounts(counts)}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Daten konnten nicht geladen werden.</p>
          )}

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportOwn}
              disabled={exporting}
              className="flex-1"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Meine Daten exportieren (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====== DELETE OWN ACCOUNT ====== */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Konto loeschen
          </CardTitle>
          <CardDescription>
            Loescht Ihr Konto und alle zugehoerigen Daten. HACCP-relevante Daten werden anonymisiert (gesetzliche Aufbewahrungspflicht).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deleteStep === 0 && (
            <Button
              variant="destructive"
              onClick={() => setDeleteStep(1)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Konto loeschen
            </Button>
          )}

          {deleteStep === 1 && (
            <div className="space-y-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-destructive">Sind Sie sicher?</p>
                  <p className="text-sm text-muted-foreground">
                    Diese Aktion kann nicht rueckgaengig gemacht werden. Folgendes wird passieren:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li><strong>Geloescht:</strong> Konto, Push-Benachrichtigungen, Sitzungen</li>
                    <li><strong>Anonymisiert:</strong> HACCP-Protokolle, Temperaturmessungen, Audit-Logs (gesetzliche Aufbewahrungspflicht)</li>
                    <li><strong>Entfernt:</strong> Aufgaben-Zuweisungen, Mitarbeiterprofil-Verknuepfung</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteStep(0)}>Abbrechen</Button>
                <Button variant="destructive" onClick={() => setDeleteStep(2)}>Ja, fortfahren</Button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-3 flex-1">
                  <p className="font-medium text-destructive">
                    Letzte Bestaetigung: Geben Sie LOESCHEN ein
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm" className="text-sm">
                      Bitte tippen Sie <strong>LOESCHEN</strong> zur Bestaetigung:
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="LÖSCHEN"
                      className="max-w-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteConfirmText(""); }}>
                      Abbrechen
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteConfirmText !== "LÖSCHEN" || deleting}
                      onClick={handleDeleteOwn}
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Endgueltig loeschen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== ADMIN SECTION ====== */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin: Benutzerdaten verwalten
            </CardTitle>
            <CardDescription>
              Daten anderer Benutzer exportieren oder Konten loeschen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Benutzer auswaehlen</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Benutzer waehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {u.role}
                      {!u.isApproved && " [nicht freigegeben]"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <>
                {adminLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : adminCounts ? (
                  <>
                    {renderDataCounts(adminCounts)}

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleExportAdmin}
                        disabled={adminExporting}
                        className="flex-1"
                      >
                        {adminExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                        Daten exportieren
                      </Button>
                    </div>

                    {/* Admin delete flow */}
                    <Separator />
                    <div className="space-y-3">
                      {adminDeleteStep === 0 && (
                        <Button
                          variant="destructive"
                          onClick={() => setAdminDeleteStep(1)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Benutzer loeschen
                        </Button>
                      )}

                      {adminDeleteStep === 1 && (
                        <div className="space-y-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                          <p className="text-sm text-muted-foreground">
                            Benutzer wird geloescht. HACCP-Daten werden anonymisiert.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setAdminDeleteStep(0)}>Abbrechen</Button>
                            <Button variant="destructive" onClick={() => setAdminDeleteStep(2)}>Fortfahren</Button>
                          </div>
                        </div>
                      )}

                      {adminDeleteStep === 2 && (
                        <div className="space-y-3 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                          <Label className="text-sm">
                            Bitte tippen Sie <strong>LOESCHEN</strong> zur Bestaetigung:
                          </Label>
                          <Input
                            value={adminDeleteConfirmText}
                            onChange={(e) => setAdminDeleteConfirmText(e.target.value)}
                            placeholder="LÖSCHEN"
                            className="max-w-xs"
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setAdminDeleteStep(0); setAdminDeleteConfirmText(""); }}>
                              Abbrechen
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={adminDeleteConfirmText !== "LÖSCHEN" || adminDeleting}
                              onClick={handleDeleteAdmin}
                            >
                              {adminDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                              Endgueltig loeschen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Ihre Rechte nach DSGVO</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>Auskunftsrecht (Art. 15):</strong> Sie koennen jederzeit Ihre gespeicherten Daten exportieren.</li>
                <li><strong>Recht auf Loeschung (Art. 17):</strong> Sie koennen die Loeschung Ihrer Daten beantragen.</li>
                <li><strong>Einschraenkung (Art. 18):</strong> HACCP-Daten unterliegen gesetzlicher Aufbewahrungspflicht und werden anonymisiert statt geloescht.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

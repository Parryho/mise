import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Users, Shield, Settings2, Check, Globe, Trash2, UserCheck, UserX,
  LogOut, UserPlus, Mail, ChevronRight, Database, Activity, MapPin, Info,
  Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface UserData {
  id: string;
  name: string;
  email: string;
  position: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

const ROLES = [
  { key: "admin", label: "Küchenchef (Admin)", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50" },
  { key: "souschef", label: "Sous-Chef", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50" },
  { key: "koch", label: "Koch", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
  { key: "fruehkoch", label: "Früh-Koch", color: "bg-cyan-500", textColor: "text-cyan-700", bgLight: "bg-cyan-50" },
  { key: "lehrling", label: "Lehrling", color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-50" },
  { key: "abwasch", label: "Abwasch", color: "bg-gray-500", textColor: "text-gray-700", bgLight: "bg-gray-50" },
  { key: "guest", label: "Gast", color: "bg-slate-400", textColor: "text-slate-700", bgLight: "bg-slate-50" },
];

const LOCATIONS = [
  { key: "city", label: "Küche City", pax: 60 },
  { key: "sued", label: "Küche SÜD", pax: 45 },
  { key: "ak", label: "Catering", pax: 80 },
];

export default function SettingsPage() {
  const { t, lang, setLang } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">{t("settings")}</h1>
        {user && (
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 min-h-[44px]">
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        )}
      </div>

      {/* Current User Profile */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary-foreground">
                  {user.name.split(" ").map(n => n.charAt(0)).join("").substring(0, 2)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-base truncate">{user.name}</div>
                <div className="text-sm text-muted-foreground truncate">{user.position}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              {(() => {
                const roleInfo = ROLES.find(r => r.key === user.role);
                return (
                  <Badge className={`${roleInfo?.bgLight} ${roleInfo?.textColor} border-0 shrink-0`}>
                    {roleInfo?.label || user.role}
                  </Badge>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Administration (Admin only) */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              System-Verwaltung
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/settings/email", icon: Mail, label: "E-Mail", desc: "SMTP & Alerts", bg: "bg-blue-50", color: "text-blue-600" },
              { href: "/settings/backup", icon: Database, label: "Backup", desc: "Sicherung & Restore", bg: "bg-green-50", color: "text-green-600" },
              { href: "/settings/gdpr", icon: Shield, label: "DSGVO", desc: "Export & Löschung", bg: "bg-purple-50", color: "text-purple-600" },
              { href: "/settings/server-status", icon: Activity, label: "Server", desc: "Monitoring & Status", bg: "bg-amber-50", color: "text-amber-600" },
            ].map(({ href, icon: Icon, label, desc, bg, color }) => (
              <Card
                key={href}
                className="cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.98]"
                onClick={() => setLocation(href)}
              >
                <CardContent className="p-4 flex items-center gap-3 min-h-[72px]">
                  <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* User Management (Admin only) */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Benutzer-Verwaltung
            </h2>
          </div>
          <UserManagement />
        </section>
      )}

      {/* Module Visibility (Admin only) */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Modul-Sichtbarkeit
            </h2>
          </div>
          <VisibilitySettings />
        </section>
      )}

      {/* App Settings */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            App-Einstellungen
          </h2>
        </div>
        <div className="space-y-3">
          {/* Language */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{t("language")}</div>
                  <div className="text-xs text-muted-foreground">Sprache der Benutzeroberfläche</div>
                </div>
              </div>
              <Separator className="my-3" />
              <RadioGroup value={lang} onValueChange={(v) => setLang(v as any)} className="grid grid-cols-2 gap-2">
                {[
                  { value: "de", label: "Deutsch", flag: "DE" },
                  { value: "en", label: "English", flag: "EN" },
                  { value: "tr", label: "Türkçe", flag: "TR" },
                  { value: "uk", label: "Українська", flag: "UA" },
                ].map(({ value, label, flag }) => (
                  <Label
                    key={value}
                    htmlFor={value}
                    className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                      lang === value ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                    }`}
                  >
                    <RadioGroupItem value={value} id={value} />
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{flag}</span>
                    <span className="font-medium text-sm">{label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Standorte</div>
                  <div className="text-xs text-muted-foreground">Konfigurierte Betriebsstandorte</div>
                </div>
              </div>
              <Separator className="mb-3" />
              <div className="space-y-2">
                {LOCATIONS.map(loc => (
                  <div key={loc.key} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium text-sm">{loc.label}</span>
                      <span className="text-xs font-mono text-muted-foreground">({loc.key})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {loc.pax} PAX
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Über mise.at
          </h2>
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary-foreground">m.</span>
              </div>
              <div>
                <div className="font-semibold">mise.at</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Küchenmanagement-System für Hotels und Gastronomie. Menüplanung, Rotation, HACCP, Rezeptverwaltung und mehr.
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="text-muted-foreground">Version</div>
              <div className="font-mono">1.0.0</div>
              <div className="text-muted-foreground">Stack</div>
              <div className="font-mono">React + Express</div>
              <div className="text-muted-foreground">Datenbank</div>
              <div className="font-mono">PostgreSQL 16</div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("koch");
  const [addLoading, setAddLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        toast({ title: "Benutzer erstellt" });
        setAddOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("koch");
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const handleApprove = async (userId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approve }),
      });
      if (res.ok) {
        toast({ title: approve ? "Benutzer freigeschaltet" : "Freischaltung aufgehoben" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast({ title: "Rolle geändert" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Benutzer wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Benutzer gelöscht" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const pendingUsers = users.filter(u => !u.isApproved);
  const activeUsers = users.filter(u => u.isApproved);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add User Button + Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <UserPlus className="h-4 w-4" /> Benutzer anlegen
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Max Mustermann" required />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@email.at" required />
            </div>
            <div className="space-y-2">
              <Label>Passwort</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.key} value={role.key}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={addLoading}>
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Benutzer erstellen
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-500" />
              Warten auf Freischaltung ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="space-y-2">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-9 h-9 bg-orange-200 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-orange-700">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(user.id, true)} className="h-7 gap-1" data-testid={`approve-user-${user.id}`}>
                      <Check className="h-3 w-3" /> OK
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)} className="h-7" data-testid={`delete-user-${user.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card>
        <CardHeader className="py-3 pb-1">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            Aktive Benutzer ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          {activeUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Keine aktiven Benutzer
            </div>
          ) : (
            <div className="space-y-2">
              {activeUsers.map(user => {
                const roleInfo = ROLES.find(r => r.key === user.role);
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-9 h-9 ${roleInfo?.color || 'bg-gray-400'} rounded-full flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-bold text-white">
                        {user.name.split(" ").map(n => n.charAt(0)).join("").substring(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm flex items-center gap-1.5 truncate">
                        {user.name}
                        {isCurrentUser && <Badge variant="outline" className="text-[10px] shrink-0">Sie</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user.id, v)}
                        disabled={isCurrentUser}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs" data-testid={`role-select-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role.key} value={role.key}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!isCurrentUser && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(user.id)} data-testid={`delete-active-${user.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VisibilitySettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const MODULES = [
    { key: "show_recipes", label: "Rezepte", description: "Rezeptdatenbank anzeigen" },
    { key: "show_menu_plan", label: "Menüplan", description: "Wochenmenü anzeigen" },
    { key: "show_guests", label: "Gästezahlen", description: "Gästeverwaltung anzeigen" },
    { key: "show_schedule", label: "Dienstplan", description: "Personalplanung anzeigen" },
    { key: "show_haccp", label: "HACCP", description: "Temperaturprotokoll anzeigen" },
  ];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (key: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: enabled ? "true" : "false" }),
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: enabled ? "true" : "false" }));
        toast({ title: "Einstellung gespeichert" });
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
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
    <Card>
      <CardHeader className="py-3 pb-1">
        <CardDescription className="text-xs">Steuern Sie, welche Bereiche für alle Benutzer sichtbar sind</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {MODULES.map((mod, idx) => (
          <div key={mod.key}>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {settings[mod.key] !== "false" ? (
                  <Eye className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium text-sm">{mod.label}</div>
                  <div className="text-xs text-muted-foreground">{mod.description}</div>
                </div>
              </div>
              <Switch
                checked={settings[mod.key] !== "false"}
                onCheckedChange={(checked) => handleToggle(mod.key, checked)}
                data-testid={`switch-${mod.key}`}
              />
            </div>
            {idx < MODULES.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

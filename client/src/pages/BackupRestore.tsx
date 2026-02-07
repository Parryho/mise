import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download, Trash2, Loader2, AlertTriangle, RotateCcw,
  HardDrive, Clock, Plus, Database, ArrowLeft, RefreshCw, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface BackupInfo {
  filename: string;
  size: number;
  sizeFormatted: string;
  date: string;
  isAutomatic: boolean;
}

interface StorageUsage {
  totalSize: number;
  totalSizeFormatted: string;
  fileCount: number;
}

export default function BackupRestore() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBackups = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setStorageInfo(data.storage || null);
      }
    } catch (err) {
      console.error("Failed to fetch backups:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchBackups(), 30000);
    return () => clearInterval(interval);
  }, [fetchBackups]);

  // Create manual backup
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Backup erstellt", description: `${data.backup.filename} (${data.backup.sizeFormatted})` });
      fetchBackups();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Download backup
  const handleDownload = (filename: string) => {
    const link = document.createElement("a");
    link.href = `/api/admin/backups/${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Delete backup
  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Backup geloescht", description: data.message });
      setDeleteTarget(null);
      fetchBackups();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  // Restore backup
  const handleRestore = async () => {
    if (!restoreTarget || restoreConfirm !== "RESTORE") return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/backups/${encodeURIComponent(restoreTarget)}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESTORE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Wiederherstellung abgeschlossen", description: data.message });
      setRestoreTarget(null);
      setRestoreConfirm("");
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("de-AT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Backup & Wiederherstellung
          </h1>
          <p className="text-sm text-muted-foreground">
            Datenbank-Sicherungen verwalten
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchBackups(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold">{storageInfo?.totalSizeFormatted || "..."}</div>
              <div className="text-xs text-muted-foreground">Speicherverbrauch</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold">{storageInfo?.fileCount ?? "..."}</div>
              <div className="text-xs text-muted-foreground">Backups gesamt</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs font-medium">Automatisch</div>
              <div className="text-xs text-muted-foreground">Taeglich, 14 Tage</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create backup */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Manuelles Backup</p>
              <p className="text-sm text-muted-foreground">
                Erstellt sofort eine Sicherung der aktuellen Datenbank
              </p>
            </div>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Jetzt Backup erstellen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verfuegbare Backups</CardTitle>
          <CardDescription>
            Automatische und manuelle Sicherungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Noch keine Backups vorhanden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono truncate">{backup.filename}</span>
                      <Badge variant={backup.isAutomatic ? "secondary" : "default"} className="text-xs flex-shrink-0">
                        {backup.isAutomatic ? "Auto" : "Manuell"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{formatDate(backup.date)}</span>
                      <span>{backup.sizeFormatted}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(backup.filename)}
                      title="Herunterladen"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setRestoreTarget(backup.filename);
                        setRestoreConfirm("");
                      }}
                      title="Wiederherstellen"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    {deleteTarget === backup.filename ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleDelete(backup.filename)}
                        >
                          Ja
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setDeleteTarget(null)}
                        >
                          Nein
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(backup.filename)}
                        title="Loeschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore confirmation dialog */}
      {restoreTarget && (
        <Card className="border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Wiederherstellung bestaetigen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm font-medium">
                Backup: <span className="font-mono">{restoreTarget}</span>
              </p>
              <p className="text-sm text-destructive font-medium mt-2">
                Alle aktuellen Daten werden ueberschrieben!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Erstellen Sie vorher ein manuelles Backup, um den aktuellen Stand zu sichern.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                Bitte tippen Sie <strong>RESTORE</strong> zur Bestaetigung:
              </Label>
              <Input
                value={restoreConfirm}
                onChange={(e) => setRestoreConfirm(e.target.value)}
                placeholder="RESTORE"
                className="max-w-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setRestoreTarget(null); setRestoreConfirm(""); }}
              >
                Abbrechen
              </Button>
              <Button
                variant="default"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={restoreConfirm !== "RESTORE" || restoring}
                onClick={handleRestore}
              >
                {restoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                Wiederherstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule info */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Automatisches Backup</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Taeglich wird automatisch eine Sicherung erstellt</li>
                <li>Backups werden 14 Tage aufbewahrt, dann automatisch bereinigt</li>
                <li>Gespeichert als komprimierte PostgreSQL-Dumps (.sql.gz)</li>
                <li>Der db-backup Service laeuft als eigener Docker-Container</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Server Status Page — Admin only
 *
 * Displays health status, uptime, memory usage, DB status,
 * and request metrics. Auto-refreshes every 30 seconds.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  HardDrive,
  Clock,
  RefreshCw,
  Server,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface HealthData {
  status: "ok" | "degraded" | "error";
  uptime: number;
  db: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  version: string;
  timestamp: string;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StatusIndicator({ status }: { status: "ok" | "degraded" | "error" }) {
  if (status === "ok") {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-green-600 font-semibold">OK</span>
      </div>
    );
  }
  if (status === "degraded") {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <span className="text-yellow-600 font-semibold">Eingeschraenkt</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <XCircle className="h-5 w-5 text-red-500" />
      <span className="text-red-600 font-semibold">Fehler</span>
    </div>
  );
}

export default function ServerStatus() {
  const { user } = useAuth();

  const { data: health, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery<HealthData>({
    queryKey: ["/api/health"],
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
    retry: 1,
    staleTime: 10_000,
  });

  // Admin guard
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zugriff verweigert
            </CardTitle>
            <CardDescription>
              Diese Seite ist nur fuer Administratoren verfuegbar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !health) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6" />
          Serverstatus
        </h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Server nicht erreichbar</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {(error as Error)?.message || "Verbindung zum Server fehlgeschlagen."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const heapPercent = Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100);
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("de-AT") : "-";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6" />
          Serverstatus
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Aktualisiert: {lastUpdate}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Systemstatus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator status={health.status} />
            <p className="text-xs text-muted-foreground mt-1">
              Version {health.version}
            </p>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatUptime(health.uptime)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Seit {new Date(Date.now() - health.uptime * 1000).toLocaleDateString("de-AT")}
            </p>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datenbank
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health.db.connected ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-600">Verbunden</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Latenz: {health.db.latencyMs}ms
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-600">Getrennt</span>
                </div>
                <p className="text-xs text-red-500 mt-1">
                  {health.db.error || "Verbindung fehlgeschlagen"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Speicher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Heap</span>
                <span>{heapPercent}%</span>
              </div>
              <Progress value={heapPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatBytes(health.memory.heapUsed)}</span>
                <span>{formatBytes(health.memory.heapTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed memory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Speicherdetails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">RSS</p>
              <p className="text-lg font-semibold">{formatBytes(health.memory.rss)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heap Verwendet</p>
              <p className="text-lg font-semibold">{formatBytes(health.memory.heapUsed)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heap Gesamt</p>
              <p className="text-lg font-semibold">{formatBytes(health.memory.heapTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Extern</p>
              <p className="text-lg font-semibold">{formatBytes(health.memory.external)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Server-Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="outline">{health.version}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zeitstempel</span>
              <span>{new Date(health.timestamp).toLocaleString("de-AT")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-Refresh</span>
              <Badge variant="secondary">30s</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monitoring-Hinweise</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Prometheus-Metriken: <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/metrics</code></p>
            <p>Sentry-DSN ist ueber Umgebungsvariable konfiguriert.</p>
            <p>Diese Seite aktualisiert sich automatisch alle 30 Sekunden.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

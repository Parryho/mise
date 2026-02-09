import { useApp } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ThermometerSnowflake, CheckCircle2, Loader2, CalendarDays, UtensilsCrossed, ClipboardList } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { recipes, logs, fridges, loading } = useApp();
  const { t } = useTranslation();

  const warnings = logs.filter(l => l.status === "WARNING" || l.status === "CRITICAL").length;
  const todaysLogs = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;
  const pendingChecks = Math.max(0, fridges.length * 2 - todaysLogs);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Mise Logo */}
      <header className="flex justify-between items-center mb-6">
        <img src="/mise-logo.png" alt="Mise - before Serve" className="h-12 object-contain" />
        <img src="/mise-icon.png" alt="Mise" className="h-10 w-10 rounded-lg shadow-sm" />
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/haccp">
          <div className="bg-gradient-to-br from-primary to-orange-600 rounded-xl p-4 text-white shadow-lg cursor-pointer active:scale-95 transition-transform min-h-[100px]">
            <div className="flex justify-between items-start mb-2">
              <ThermometerSnowflake className="h-6 w-6 opacity-80" />
              {warnings > 0 && <Badge variant="destructive" className="h-5 px-1.5">{warnings}</Badge>}
            </div>
            <div className="text-2xl font-heading font-bold">{pendingChecks}</div>
            <div className="text-xs opacity-90">{t("pendingChecks")}</div>
          </div>
        </Link>

        <Link href="/recipes">
          <div className="bg-white dark:bg-card border border-border rounded-xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform min-h-[100px]">
            <div className="flex justify-between items-start mb-2">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{recipes.length}</div>
            <div className="text-xs text-muted-foreground">{t("activeRecipes")}</div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">{t("quickActions")}</h2>
        <div className="grid grid-cols-1 gap-2">
           <Link href="/haccp">
            <div className="flex items-center p-3 bg-white dark:bg-card border border-border rounded-lg shadow-sm hover:bg-secondary/50 active:scale-[0.98] transition-all min-h-[56px]">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mr-3 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{t("logTemperature")}</div>
                <div className="text-xs text-muted-foreground">{t("morningCheck")}</div>
              </div>
            </div>
           </Link>
           <Link href="/menuplan">
            <div className="flex items-center p-3 bg-white dark:bg-card border border-border rounded-lg shadow-sm hover:bg-secondary/50 active:scale-[0.98] transition-all min-h-[56px]">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mr-3 shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Wochenplan</div>
                <div className="text-xs text-muted-foreground">Heutiges Menu ansehen</div>
              </div>
            </div>
           </Link>
           <Link href="/production">
            <div className="flex items-center p-3 bg-white dark:bg-card border border-border rounded-lg shadow-sm hover:bg-secondary/50 active:scale-[0.98] transition-all min-h-[56px]">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mr-3 shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Produktionsliste</div>
                <div className="text-xs text-muted-foreground">Was wird heute gekocht?</div>
              </div>
            </div>
           </Link>
        </div>
      </div>

      {/* Recent Activity / Status */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">{t("recentActivity")}</h2>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ThermometerSnowflake className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Noch keine Messungen heute</p>
              <Link href="/haccp">
                <span className="text-sm text-primary font-medium mt-1 inline-block">Jetzt Temperatur erfassen</span>
              </Link>
            </div>
          ) : (
            logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-white dark:bg-card border border-border rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${log.status === 'OK' ? 'bg-green-500' : log.status === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div>
                    <div className="font-medium">{t("fridge")}: {log.fridgeId}</div>
                    <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})} · {log.user}</div>
                  </div>
                </div>
                <div className={`font-mono font-bold ${log.status === 'OK' ? 'text-foreground' : log.status === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>
                  {log.temperature}°C
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

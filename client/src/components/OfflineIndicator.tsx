import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

/**
 * Small banner showing offline status and pending sync items.
 * Should be placed in the Layout component.
 * Shows:
 * - "Offline-Modus" when offline
 * - "X Einträge werden synchronisiert" when syncing
 * - Pending count badge when items are queued
 */
export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOnlineStatus();

  // Don't show anything if online and nothing pending
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium transition-all duration-300",
        !isOnline
          ? "bg-orange-500/90 text-white"
          : isSyncing
            ? "bg-blue-500/90 text-white"
            : "bg-amber-500/90 text-white"
      )}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Offline-Modus — Daten werden bei Verbindung synchronisiert</span>
          </>
        ) : isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>Synchronisiere {pendingCount} {pendingCount === 1 ? "Eintrag" : "Einträge"}...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span>{pendingCount} {pendingCount === 1 ? "Eintrag" : "Einträge"} ausstehend</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={syncNow}
          className="text-xs underline underline-offset-2 hover:no-underline shrink-0"
        >
          Jetzt synchronisieren
        </button>
      )}
    </div>
  );
}

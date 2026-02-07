import { useState, useEffect, useCallback } from "react";
import { syncPendingHaccpEntries, getPendingHaccpCount } from "@/lib/offline-db";

interface OnlineStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

/**
 * Hook to track online/offline status and manage HACCP background sync.
 * Uses navigator.onLine + online/offline events.
 * Automatically syncs pending HACCP entries when coming back online.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingHaccpCount();
      setPendingCount(count);
    } catch {
      // IndexedDB not available
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncPendingHaccpEntries();
      await refreshPendingCount();
    } catch {
      // Sync failed, will retry later
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial pending count check
    refreshPendingCount();

    // Periodically check pending count (every 30s)
    const interval = setInterval(refreshPendingCount, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [syncNow, refreshPendingCount]);

  return { isOnline, pendingCount, isSyncing, syncNow };
}

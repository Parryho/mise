import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "mise-offline";
const DB_VERSION = 1;

interface HaccpOfflineEntry {
  id?: number;
  fridgeId: number;
  temperature: number;
  timestamp: string;
  user: string;
  status: string;
  notes?: string;
  createdAt: string; // ISO string when entry was created offline
  synced: number; // 0 = not synced, 1 = synced (IDB needs numeric index keys)
}

interface MiseOfflineDB {
  "haccp-queue": {
    key: number;
    value: HaccpOfflineEntry;
    indexes: { "by-synced": number };
  };
}

let dbPromise: Promise<IDBPDatabase<MiseOfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MiseOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MiseOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("haccp-queue", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by-synced", "synced");
      },
    });
  }
  return dbPromise;
}

/**
 * Queue an HACCP log entry for offline storage.
 * Will be synced to /api/haccp when back online.
 */
export async function queueHaccpEntry(entry: Omit<HaccpOfflineEntry, "id" | "synced" | "createdAt">): Promise<number> {
  const db = await getDB();
  const id = await db.add("haccp-queue", {
    ...entry,
    createdAt: new Date().toISOString(),
    synced: 0,
  });
  return id as number;
}

/**
 * Get all unsynced HACCP entries from the offline queue.
 */
export async function getUnsyncedHaccpEntries(): Promise<HaccpOfflineEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex("haccp-queue", "by-synced", 0);
}

/**
 * Mark a queued entry as synced after successful upload.
 */
export async function markHaccpEntrySynced(id: number): Promise<void> {
  const db = await getDB();
  const entry = await db.get("haccp-queue", id);
  if (entry) {
    entry.synced = 1;
    await db.put("haccp-queue", entry);
  }
}

/**
 * Remove all synced entries (cleanup).
 */
export async function clearSyncedHaccpEntries(): Promise<void> {
  const db = await getDB();
  const synced = await db.getAllFromIndex("haccp-queue", "by-synced", 1);
  const tx = db.transaction("haccp-queue", "readwrite");
  for (const entry of synced) {
    if (entry.id !== undefined) {
      await tx.store.delete(entry.id);
    }
  }
  await tx.done;
}

/**
 * Get count of pending (unsynced) entries.
 */
export async function getPendingHaccpCount(): Promise<number> {
  const db = await getDB();
  const entries = await db.getAllFromIndex("haccp-queue", "by-synced", 0);
  return entries.length;
}

/**
 * Sync all pending HACCP entries to the server.
 * Returns the number of successfully synced entries.
 */
export async function syncPendingHaccpEntries(): Promise<number> {
  const entries = await getUnsyncedHaccpEntries();
  let syncedCount = 0;

  for (const entry of entries) {
    try {
      const res = await fetch("/api/haccp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fridgeId: entry.fridgeId,
          temperature: entry.temperature,
          timestamp: entry.timestamp,
          user: entry.user,
          status: entry.status,
          notes: entry.notes ? `${entry.notes} [Offline erfasst: ${entry.createdAt}]` : `[Offline erfasst: ${entry.createdAt}]`,
        }),
      });

      if (res.ok && entry.id !== undefined) {
        await markHaccpEntrySynced(entry.id);
        syncedCount++;
      }
    } catch {
      // Network still down, stop trying
      break;
    }
  }

  // Clean up synced entries
  if (syncedCount > 0) {
    await clearSyncedHaccpEntries();
  }

  return syncedCount;
}

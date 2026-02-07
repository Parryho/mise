// Custom Service Worker additions for mise.at
// Handles push notifications and offline sync
// This file is imported by the vite-plugin-pwa generated service worker

// =============================================
// Push Notification Handler
// =============================================

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "mise.at",
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/mise-icon.png",
    badge: "/icon-192.png",
    tag: data.tag || "mise-notification",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
    actions: [],
  };

  // Add specific actions based on tag
  if (data.tag === "haccp-alert") {
    options.requireInteraction = true; // Don't auto-dismiss HACCP alerts
    options.actions = [
      { action: "view", title: "Anzeigen" },
      { action: "dismiss", title: "Schließen" },
    ];
  }

  event.waitUntil(self.registration.showNotification(data.title || "mise.at", options));
});

// =============================================
// Notification Click Handler
// =============================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url);
    })
  );
});

// =============================================
// Background Sync (for HACCP offline entries)
// =============================================

self.addEventListener("sync", (event) => {
  if (event.tag === "haccp-sync") {
    event.waitUntil(syncHaccpEntries());
  }
});

async function syncHaccpEntries() {
  // Open IndexedDB to get pending entries
  try {
    const db = await openIndexedDB();
    const tx = db.transaction("haccp-queue", "readonly");
    const store = tx.objectStore("haccp-queue");
    const index = store.index("by-synced");
    const request = index.getAll(false);

    const entries = await promisifyRequest(request);

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
            notes: entry.notes
              ? `${entry.notes} [Offline: ${entry.createdAt}]`
              : `[Offline: ${entry.createdAt}]`,
          }),
        });

        if (res.ok) {
          // Mark as synced
          const txW = db.transaction("haccp-queue", "readwrite");
          const storeW = txW.objectStore("haccp-queue");
          entry.synced = true;
          storeW.put(entry);
        }
      } catch {
        // Network still down
        break;
      }
    }
  } catch {
    // IndexedDB not available in this context
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mise-offline", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

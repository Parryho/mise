import type { Request, Response } from "express";
import { createRequire } from "module";
const _require = createRequire(typeof __filename !== "undefined" ? __filename : import.meta.url);
const webpush = _require("web-push");
import { db } from "./db";
import { pushSubscriptions, appSettings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// =============================================
// VAPID Key Management
// =============================================

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let vapidKeysCache: VapidKeys | null = null;

/**
 * Get or generate VAPID keys. Stored in app_settings table.
 */
async function getOrCreateVapidKeys(): Promise<VapidKeys> {
  if (vapidKeysCache) return vapidKeysCache;

  // Try to load from DB
  const [publicKeyRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "vapid_public_key"));
  const [privateKeyRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "vapid_private_key"));

  if (publicKeyRow && privateKeyRow) {
    vapidKeysCache = {
      publicKey: publicKeyRow.value,
      privateKey: privateKeyRow.value,
    };
    return vapidKeysCache;
  }

  // Generate new keys
  const keys = webpush.generateVAPIDKeys();

  // Store in DB (upsert)
  await db
    .insert(appSettings)
    .values({ key: "vapid_public_key", value: keys.publicKey })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: keys.publicKey },
    });
  await db
    .insert(appSettings)
    .values({ key: "vapid_private_key", value: keys.privateKey })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: keys.privateKey },
    });

  vapidKeysCache = keys;
  console.log("[Push] VAPID-Schlüssel generiert und gespeichert");
  return keys;
}

/**
 * Initialize web-push with VAPID keys.
 * Call this at server startup.
 */
export async function initPushNotifications(): Promise<void> {
  try {
    const keys = await getOrCreateVapidKeys();
    webpush.setVapidDetails(
      "mailto:admin@mise.at",
      keys.publicKey,
      keys.privateKey
    );
    console.log("[Push] Push-Benachrichtigungen initialisiert");
  } catch (error) {
    console.error("[Push] Fehler bei der Initialisierung:", error);
  }
}

// =============================================
// Core Push Functions
// =============================================

/**
 * Send a push notification to a single subscription.
 * Removes the subscription if it's expired/invalid.
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; url?: string; tag?: string }
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    // 410 Gone or 404 means subscription is invalid
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      console.log(`[Push] Ungültige Subscription entfernt: ${subscription.endpoint.slice(0, 50)}...`);
    } else {
      console.error("[Push] Senden fehlgeschlagen:", error?.statusCode || error?.message);
    }
    return false;
  }
}

/**
 * Send HACCP alert to ALL subscribed users.
 * Used when a fridge temperature is out of range.
 */
export async function notifyHaccpAlert(
  fridgeName: string,
  temperature: number,
  message?: string
): Promise<number> {
  const allSubs = await db.select().from(pushSubscriptions);
  let sentCount = 0;

  const payload = {
    title: "HACCP-Alarm!",
    body: message || `${fridgeName}: ${temperature}°C - Temperatur außerhalb des Grenzwerts!`,
    icon: "/mise-icon.png",
    url: "/haccp",
    tag: "haccp-alert",
  };

  for (const sub of allSubs) {
    const success = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    );
    if (success) sentCount++;
  }

  console.log(`[Push] HACCP-Alarm an ${sentCount}/${allSubs.length} Empfänger gesendet`);
  return sentCount;
}

/**
 * Send schedule change notification to a specific user.
 */
export async function notifyScheduleChange(
  userId: string,
  message: string
): Promise<number> {
  const userSubs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let sentCount = 0;

  const payload = {
    title: "Dienstplanänderung",
    body: message,
    icon: "/mise-icon.png",
    url: "/schedule",
    tag: "schedule-change",
  };

  for (const sub of userSubs) {
    const success = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    );
    if (success) sentCount++;
  }

  return sentCount;
}

// =============================================
// API Route Handlers
// =============================================

/**
 * GET /api/push/vapid-public-key
 * Returns the public VAPID key for client-side subscription.
 */
export async function handleGetVapidPublicKey(_req: Request, res: Response): Promise<void> {
  try {
    const keys = await getOrCreateVapidKeys();
    res.json({ publicKey: keys.publicKey });
  } catch (error) {
    console.error("[Push] VAPID-Key-Fehler:", error);
    res.status(500).json({ error: "VAPID-Schlüssel konnte nicht geladen werden" });
  }
}

/**
 * POST /api/push/subscribe
 * Save a push subscription for the current user.
 * Body: { endpoint, p256dh, auth }
 */
export async function handlePushSubscribe(req: Request, res: Response): Promise<void> {
  const user = (req as any).session?.user;
  if (!user) {
    res.status(401).json({ error: "Nicht authentifiziert" });
    return;
  }

  const { endpoint, p256dh, auth } = req.body;
  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "endpoint, p256dh und auth sind erforderlich" });
    return;
  }

  try {
    // Remove existing subscription for this endpoint (re-subscribe)
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    // Insert new subscription
    const [sub] = await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint,
        p256dh,
        auth,
      })
      .returning();

    res.json({ success: true, id: sub.id });
  } catch (error) {
    console.error("[Push] Subscribe-Fehler:", error);
    res.status(500).json({ error: "Subscription konnte nicht gespeichert werden" });
  }
}

/**
 * POST /api/push/unsubscribe
 * Remove a push subscription.
 * Body: { endpoint }
 */
export async function handlePushUnsubscribe(req: Request, res: Response): Promise<void> {
  const user = (req as any).session?.user;
  if (!user) {
    res.status(401).json({ error: "Nicht authentifiziert" });
    return;
  }

  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "endpoint ist erforderlich" });
    return;
  }

  try {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, user.id)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error("[Push] Unsubscribe-Fehler:", error);
    res.status(500).json({ error: "Subscription konnte nicht entfernt werden" });
  }
}

/**
 * POST /api/push/test
 * Send a test notification to the current user.
 */
export async function handlePushTest(req: Request, res: Response): Promise<void> {
  const user = (req as any).session?.user;
  if (!user) {
    res.status(401).json({ error: "Nicht authentifiziert" });
    return;
  }

  try {
    const userSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, user.id));

    if (userSubs.length === 0) {
      res.status(404).json({ error: "Keine aktive Subscription gefunden" });
      return;
    }

    let sentCount = 0;
    for (const sub of userSubs) {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        {
          title: "mise.at - Test",
          body: `Hallo ${user.name || "Koch"}! Push-Benachrichtigungen funktionieren.`,
          icon: "/mise-icon.png",
          url: "/settings",
          tag: "test-notification",
        }
      );
      if (success) sentCount++;
    }

    res.json({ success: true, sent: sentCount, total: userSubs.length });
  } catch (error) {
    console.error("[Push] Test-Fehler:", error);
    res.status(500).json({ error: "Test-Benachrichtigung konnte nicht gesendet werden" });
  }
}

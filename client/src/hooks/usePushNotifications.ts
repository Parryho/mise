import { useState, useEffect, useCallback } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface PushNotificationState {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Current notification permission state */
  permission: PermissionState;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Loading state during subscribe/unsubscribe */
  isLoading: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Send a test notification to the current user */
  sendTestNotification: () => Promise<boolean>;
}

/**
 * Hook for managing push notification subscriptions.
 * Handles permission requests, service worker push subscription, and server sync.
 */
export function usePushNotifications(): PushNotificationState {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Check current state on mount
  useEffect(() => {
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    checkSubscription();
  }, [isSupported]);

  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  }, [isSupported]);

  const getVapidPublicKey = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/push/vapid-public-key", {
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.publicKey || null;
    } catch {
      return null;
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);

      if (perm !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Get VAPID public key from server
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        console.error("Konnte VAPID-Schlüssel nicht abrufen");
        setIsLoading(false);
        return false;
      }

      // Subscribe via service worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const keys = subscription.toJSON().keys;
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: keys?.p256dh || "",
          auth: keys?.auth || "",
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      // Server rejected, unsubscribe locally
      await subscription.unsubscribe();
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Push-Subscription fehlgeschlagen:", error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notify server
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Unsubscribe locally
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Push-Abmeldung fehlgeschlagen:", error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

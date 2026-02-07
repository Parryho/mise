/**
 * Sentry Error Tracking — Client-side
 *
 * Initializes Sentry for React with error boundary integration
 * and performance monitoring. Gracefully no-ops when DSN not set.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

/**
 * Initialize Sentry on the client.
 * Call this once in main.tsx before React renders.
 *
 * The DSN is injected at build time via Vite's env variable:
 *   VITE_SENTRY_DSN
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log("[sentry] VITE_SENTRY_DSN not set — Sentry disabled");
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || "development",
      release: import.meta.env.VITE_APP_VERSION || "unknown",

      // Performance monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

      // Session replay for debugging (sample 10% of sessions, 100% on error)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Don't send PII
      sendDefaultPii: false,

      // Ignore expected errors
      ignoreErrors: [
        // Network errors
        "Failed to fetch",
        "NetworkError",
        "Load failed",
        // Auth redirects
        "401:",
        "Nicht autorisiert",
      ],

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });

    initialized = true;
    console.log("[sentry] Sentry initialized");
  } catch (err) {
    console.error("[sentry] Failed to initialize Sentry:", err);
  }
}

/**
 * Capture an exception (for use in catch blocks or error boundaries).
 */
export function captureException(error: Error | unknown, context?: Record<string, any>): void {
  if (initialized) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}

/**
 * Capture a message.
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): void {
  if (initialized) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Set user context for Sentry events.
 */
export function setUser(user: { id: string; username?: string; role?: string } | null): void {
  if (initialized) {
    if (user) {
      Sentry.setUser({ id: user.id, username: user.username });
    } else {
      Sentry.setUser(null);
    }
  }
}

/**
 * Check if Sentry is initialized.
 */
export function isSentryEnabled(): boolean {
  return initialized;
}

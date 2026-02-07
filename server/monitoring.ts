/**
 * Sentry Error Tracking — Server-side
 *
 * Initializes Sentry for Express error tracking and performance monitoring.
 * Gracefully no-ops when SENTRY_DSN is not set.
 */
import type { Express, Request, Response, NextFunction } from "express";

let Sentry: typeof import("@sentry/node") | null = null;

/**
 * Initialize Sentry on the server.
 * Call this early in app startup, before routes are registered.
 */
export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[monitoring] SENTRY_DSN not set — Sentry disabled");
    return;
  }

  try {
    Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      release: getAppVersion(),
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      // Don't send PII
      sendDefaultPii: false,
      // Ignore expected errors
      ignoreErrors: [
        "Nicht autorisiert",
        "Unauthorized",
        "ECONNRESET",
        "EPIPE",
      ],
    });
    console.log("[monitoring] Sentry initialized");
  } catch (err) {
    console.error("[monitoring] Failed to initialize Sentry:", err);
    Sentry = null;
  }
}

/**
 * Get app version from package.json (best-effort)
 */
function getAppVersion(): string {
  try {
    // In bundled production code, this will be resolved at build time
    return process.env.npm_package_version || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Sentry request handler middleware.
 * Should be added early in the middleware chain.
 */
export function sentryRequestHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (Sentry) {
      // Set user context if session is available
      const session = (req as any).session;
      if (session?.userId) {
        Sentry.setUser({ id: session.userId });
      }
    }
    next();
  };
}

/**
 * Sentry error handler middleware.
 * Should be added after all routes but before the generic error handler.
 */
export function sentryErrorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    if (Sentry) {
      Sentry.captureException(err, {
        extra: {
          method: req.method,
          url: req.originalUrl,
          requestId: req.requestId,
        },
      });
    }
    next(err);
  };
}

/**
 * Capture an exception manually (for use in catch blocks).
 */
export function captureException(error: Error | unknown, context?: Record<string, any>): void {
  if (Sentry) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}

/**
 * Capture a message manually.
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Check if Sentry is active.
 */
export function isSentryEnabled(): boolean {
  return Sentry !== null;
}

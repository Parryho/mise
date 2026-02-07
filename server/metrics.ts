/**
 * Prometheus Metrics
 *
 * Collects default Node.js metrics + custom HTTP and business metrics.
 * Exposes GET /api/metrics endpoint for Prometheus scraping.
 */
import type { Request, Response, NextFunction } from "express";
import client from "prom-client";

// Create a custom registry to avoid polluting the global one
const register = new client.Registry();

// ── Default metrics (CPU, memory, event loop lag, GC) ──
client.collectDefaultMetrics({ register });

// ── Custom metrics ──

/** Total HTTP requests counter */
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [register],
});

/** HTTP request duration histogram */
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/** Active users gauge (can be set externally) */
export const activeUsersGauge = new client.Gauge({
  name: "active_users_total",
  help: "Number of currently active users (with active sessions)",
  registers: [register],
});

/** HACCP logs counter */
export const haccpLogsTotal = new client.Counter({
  name: "haccp_logs_total",
  help: "Total number of HACCP log entries created",
  registers: [register],
});

/** Database query duration histogram */
export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

/**
 * Normalize route path to avoid cardinality explosion.
 * Replaces numeric IDs and UUIDs with :id placeholder.
 */
function normalizeRoute(path: string): string {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, ":id")
    // Replace numeric IDs
    .replace(/\/\d+/g, "/:id");
}

/**
 * Express middleware to record HTTP metrics per request.
 * Add this early in the middleware chain.
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only track API requests
    if (!req.path.startsWith("/api")) {
      return next();
    }

    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const durationNs = Number(process.hrtime.bigint() - start);
      const durationSec = durationNs / 1e9;
      const route = normalizeRoute(req.path);

      httpRequestsTotal.inc({
        method: req.method,
        route,
        status: String(res.statusCode),
      });

      httpRequestDuration.observe(
        { method: req.method, route },
        durationSec,
      );
    });

    next();
  };
}

/**
 * Metrics scrape handler.
 * Register as: app.get("/api/metrics", metricsHandler)
 *
 * In production, protect with admin auth or IP allowlist.
 */
export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end("Error collecting metrics");
  }
}

/**
 * Helper: time a DB query and record the duration.
 * Usage:
 *   const result = await timeDbQuery("findRecipes", () => db.query(...));
 */
export async function timeDbQuery<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const end = dbQueryDuration.startTimer({ operation });
  try {
    return await fn();
  } finally {
    end();
  }
}

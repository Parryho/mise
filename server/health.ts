/**
 * Health Check Endpoint
 *
 * GET /api/health — public, no auth required
 * Returns system status, uptime, DB connectivity, and memory usage.
 */
import type { Request, Response } from "express";
import { pool } from "./db";

interface HealthResponse {
  status: "ok" | "degraded" | "error";
  uptime: number;
  db: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  version: string;
  timestamp: string;
}

/**
 * Read version from package.json.
 * In bundled production, we fall back to env var or "unknown".
 */
function getVersion(): string {
  try {
    return process.env.npm_package_version || "1.0.0";
  } catch {
    return "unknown";
  }
}

/**
 * Check database connectivity with a simple query.
 */
async function checkDb(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return { connected: true, latencyMs: Date.now() - start };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { connected: false, latencyMs: Date.now() - start, error: err.message };
  }
}

/**
 * Health check handler. Register as: app.get("/api/health", healthHandler)
 * This should be registered BEFORE auth middleware.
 */
export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const db = await checkDb();
  const mem = process.memoryUsage();

  const health: HealthResponse = {
    status: db.connected ? "ok" : "error",
    uptime: Math.floor(process.uptime()),
    db,
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    version: getVersion(),
    timestamp: new Date().toISOString(),
  };

  // Degraded if DB latency is very high
  if (db.connected && db.latencyMs && db.latencyMs > 1000) {
    health.status = "degraded";
  }

  const statusCode = health.status === "error" ? 503 : 200;
  res.status(statusCode).json(health);
}

/**
 * Structured logger for mise server.
 * - Log levels: debug, info, warn, error
 * - Module context via createLogger("module-name")
 * - JSON format in production, human-readable in dev
 * - Sensitive field redaction
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
];

const isDev = process.env.NODE_ENV !== "production";
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDev ? "debug" : "info");

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function sanitizeForLog(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item));
  }
  const source = obj as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof source[key] === "object" && source[key] !== null) {
      sanitized[key] = sanitizeForLog(source[key]);
    } else {
      sanitized[key] = source[key];
    }
  }
  return sanitized;
}

function write(level: LogLevel, module: string, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  if (!isDev) {
    // Production: JSON lines for log aggregation
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      module,
      msg: message,
    };
    if (meta) entry.meta = sanitizeForLog(meta);
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(JSON.stringify(entry));
    return;
  }

  // Dev: human-readable
  const tag = `${formatTime()} [${module}]`;
  const metaStr = meta ? ` ${JSON.stringify(sanitizeForLog(meta))}` : "";

  switch (level) {
    case "error":
      console.error(`${tag} ERROR ${message}${metaStr}`);
      break;
    case "warn":
      console.warn(`${tag} WARN ${message}${metaStr}`);
      break;
    case "debug":
      console.log(`${tag} DEBUG ${message}${metaStr}`);
      break;
    default:
      console.log(`${tag} ${message}${metaStr}`);
  }
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export function createLogger(module: string): Logger {
  return {
    debug: (msg, meta) => write("debug", module, msg, meta),
    info: (msg, meta) => write("info", module, msg, meta),
    warn: (msg, meta) => write("warn", module, msg, meta),
    error: (msg, meta) => write("error", module, msg, meta),
  };
}

/** Backwards-compatible log function (used by request logging middleware in index.ts) */
export function log(message: string, source = "express") {
  write("info", source, message);
}

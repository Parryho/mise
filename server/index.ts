import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import crypto from "crypto";
import { log, sanitizeForLog, createLogger } from "./logging";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

// Trust first proxy (nginx) for correct X-Forwarded-Proto, X-Real-IP
app.set("trust proxy", 1);

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://img.chefkoch-cdn.de", "https://www.gutekueche.at", "https://images.lecker.de", "https://images.pexels.com", "https://images.unsplash.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading external images
}));

// CORS: dev = all origins, prod = CORS_ORIGINS env (comma-separated) or disabled
const corsOrigins = process.env.CORS_ORIGINS?.split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: isDev ? true : (corsOrigins && corsOrigins.length > 0 ? corsOrigins : false),
  credentials: true,
}));
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Extend Express Request type for requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// Gzip/Brotli compression for all responses
app.use(compression());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Generate unique request ID
app.use((req, _res, next) => {
  req.requestId = crypto.randomBytes(8).toString("hex");
  next();
});

// log, sanitizeForLog, createLogger imported from ./logging

// R2-T1: Structured logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Get user from session if available
      const session = (req as any).session;
      const userId = session?.userId || "-";

      // Structured log format: [requestId] user=X METHOD /path STATUS DURATIONms
      let logLine = `[${req.requestId}] user=${userId} ${req.method} ${path} ${res.statusCode} ${duration}ms`;

      // Add sanitized response for non-successful requests or in dev mode
      if (capturedJsonResponse && (res.statusCode >= 400 || isDev)) {
        const sanitized = sanitizeForLog(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitized)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    const serverLog = createLogger("express");
    serverLog.error("Internal Server Error", { error: err.message, stack: err.stack, status });

    if (res.headersSent) {
      return next(err);
    }

    // Don't leak internal error details in production
    const message = status < 500
      ? (err.message || "Anfragefehler")
      : (isDev ? err.message : "Interner Serverfehler");

    return res.status(status).json({ error: message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Port aus .env (z.B. PORT=3000), sonst 5000
  const port = parseInt(process.env.PORT || "5000", 10);

  // LAN-Zugriff: 0.0.0.0 erlaubt Verbindungen von anderen Geräten im Netzwerk
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} (LAN accessible)`);
  });
})();

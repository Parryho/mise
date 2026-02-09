import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { pool, ensureSessionTable } from "../db";
import { storage } from "../storage";

export { storage };

// Extend express-session to include user
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Kitchen positions
export const KITCHEN_POSITIONS = [
  "Küchenchef", "Sous-Chef", "Koch", "Früh-Koch", "Lehrling", "Abwasch", "Küchenhilfe", "Patissier", "Commis"
];

// Helper to safely get route parameter as string (Express 5 types params as string | string[])
export const getParam = (param: string | string[]): string => Array.isArray(param) ? param[0] : param;

// Roles with permission levels
export const ROLE_PERMISSIONS: Record<string, number> = {
  admin: 100,
  souschef: 80,
  koch: 60,
  fruehkoch: 50,
  lehrling: 30,
  abwasch: 20,
  guest: 10,
};

// Rate limiters
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Zu viele Registrierungen. Bitte warten Sie eine Stunde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  const user = await storage.getUser(userId);
  if (!user || !user.isApproved) {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }
  (req as any).user = user;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  const user = await storage.getUser(userId);
  if (!user || !user.isApproved) {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Admin-Berechtigung erforderlich" });
  }
  (req as any).user = user;
  next();
};

export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.isApproved) {
      return res.status(401).json({ error: "Nicht autorisiert" });
    }
    const userLevel = ROLE_PERMISSIONS[user.role] || 0;
    const requiredLevel = Math.min(...roles.map(r => ROLE_PERMISSIONS[r] || 0));
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Unzureichende Berechtigung" });
    }
    (req as any).user = user;
    next();
  };
};

// Audit log helper
export const audit = (req: Request, action: string, tableName: string, recordId?: string | number, before?: unknown, after?: unknown) => {
  const user = (req as any).user;
  storage.createAuditLog({
    userId: user?.id ?? null,
    userName: user?.name ?? null,
    action,
    tableName,
    recordId: recordId != null ? String(recordId) : null,
    before,
    after,
  }).catch(err => console.error("Audit log failed:", err));
};

// Session + CSRF + default admin setup
export async function setupMiddleware(app: Express): Promise<void> {
  await ensureSessionTable();

  // Migrate old recipe categories
  try {
    const categoryMigrations: Record<string, string> = {
      "Soups": "ClearSoups",
      "Starters": "Salads",
      "Mains": "MainMeat",
      "MainsVeg": "MainVegan",
      "Desserts": "ColdDesserts",
      "Breakfast": "Sides",
      "Snacks": "Sides",
      "Drinks": "ColdSauces",
    };
    for (const [oldCat, newCat] of Object.entries(categoryMigrations)) {
      await pool.query(`UPDATE recipes SET category = $1 WHERE category = $2`, [newCat, oldCat]);
    }
    console.log("Category migration completed.");
  } catch (err) {
    console.error("Category migration failed:", err);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const PgSession = connectPgSimple(session);

  const sessionSecret = process.env.SESSION_SECRET;
  if (isProduction && !sessionSecret) {
    throw new Error("FATAL: SESSION_SECRET environment variable is required in production mode.");
  }
  if (!sessionSecret) {
    console.warn("WARNING: SESSION_SECRET not set. Using insecure default for development only.");
  }

  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "chefmate-dev-secret-DO-NOT-USE-IN-PRODUCTION",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.FORCE_HTTPS === "true",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));

  // CSRF protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      if (!isProduction) return next();
      return res.status(403).json({ error: "CSRF: Origin header required" });
    }
    try {
      const url = new URL(origin);
      const host = req.headers.host;
      if (host && url.host === host) {
        return next();
      }
    } catch {}
    return res.status(403).json({ error: "CSRF: Origin mismatch" });
  });

  // Create default admin account if none exists
  const existingAdmin = await storage.getUserByEmail("admin@mise.app");
  if (!existingAdmin) {
    const defaultPw = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(defaultPw, 10);
    await storage.createUser({
      username: "admin@mise.app",
      name: "Administrator",
      email: "admin@mise.app",
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      position: "Admin"
    });
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`Default admin created (admin@mise.app) with random password: ${defaultPw}`);
      console.log("   Set ADMIN_PASSWORD env var to use a fixed password.");
    } else {
      console.log("Default admin account created (admin@mise.app).");
    }
  }
}

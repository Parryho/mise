import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeRecipe } from "./scraper";
import {
  insertRecipeSchema, insertIngredientSchema, insertFridgeSchema, insertHaccpLogSchema,
  insertGuestCountSchema, insertCateringEventSchema, insertStaffSchema, insertShiftTypeSchema, insertScheduleEntrySchema, insertMenuPlanSchema,
  registerUserSchema, loginUserSchema, insertTaskSchema, updateTaskStatusSchema,
  insertLocationSchema, insertRotationTemplateSchema, insertRotationSlotSchema,
  insertMasterIngredientSchema, insertCateringMenuItemSchema, insertMenuPlanTemperatureSchema,
  insertSupplierSchema, insertSubRecipeLinkSchema, insertGuestAllergenProfileSchema,
  updateUserSchema, updateRecipeSchema, updateFridgeSchema, updateGuestCountSchema,
  updateCateringEventSchema, updateStaffSchema, updateShiftTypeSchema, updateScheduleEntrySchema,
  updateMenuPlanSchema, updateRotationTemplateSchema, updateRotationSlotSchema,
  updateMasterIngredientSchema, updateSettingSchema, updateTaskTemplateSchema,
  updateSupplierSchema, updateGuestAllergenProfileSchema
} from "@shared/schema";
import { autoCategorize } from "@shared/categorizer";
import { parseFelixText } from "./felix-parser";
import { getAirtableStatus, testAirtableConnection, syncAirtableEvents } from "./airtable";
import { generateWeekFromRotation, getRotationOverview, ensureDefaultTemplate, getOrGenerateWeekPlan } from "./rotation";
import { autoFillRotation } from "./rotation-agent";
import { getProductionList } from "./production";
import { getShoppingList } from "./shopping";
import { getDishCost, getWeeklyCostReport } from "./costs";
import { resolveRecipeIngredients, wouldCreateCycle } from "./sub-recipes";
import { getDailyAllergenMatrix, getWeeklyAllergenMatrix } from "./allergens";
import { getPaxTrends, getHaccpCompliance, getPopularDishes } from "./analytics";
import { getBuffetCards, getBuffetCardsForDate } from "./buffet-cards";
import { getPublicMenu } from "./public-menu";
import multer from "multer";
import { createRequire } from "module";
const _require = createRequire(typeof __filename !== "undefined" ? __filename : import.meta.url);
const pdfParse = _require("pdf-parse");
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { pool, ensureSessionTable } from "./db";

// R2-T2: Rate limiting for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per window per IP
  message: { error: "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 registrations per hour per IP
  message: { error: "Zu viele Registrierungen. Bitte warten Sie eine Stunde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Extend express-session to include user
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Kitchen positions
const KITCHEN_POSITIONS = [
  "Küchenchef", "Sous-Chef", "Koch", "Früh-Koch", "Lehrling", "Abwasch", "Küchenhilfe", "Patissier", "Commis"
];

// Helper to safely get route parameter as string (Express 5 types params as string | string[])
const getParam = (param: string | string[]): string => Array.isArray(param) ? param[0] : param;

// Roles with permission levels
const ROLE_PERMISSIONS: Record<string, number> = {
  admin: 100,
  souschef: 80,
  koch: 60,
  fruehkoch: 50,
  lehrling: 30,
  abwasch: 20,
  guest: 10,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Ensure session table exists in PostgreSQL
  await ensureSessionTable();

  // Migrate old recipe categories to new ones
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

  // Session middleware with PostgreSQL store
  const isProduction = process.env.NODE_ENV === "production";
  const PgSession = connectPgSimple(session);

  // R1-T2: Validate SESSION_SECRET in production
  const sessionSecret = process.env.SESSION_SECRET;
  if (isProduction && !sessionSecret) {
    throw new Error("FATAL: SESSION_SECRET environment variable is required in production mode. Server cannot start without it.");
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
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // CSRF protection: verify Origin/Referer on mutation requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      // Allow requests without Origin (e.g., server-to-server, curl in dev)
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
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      username: "admin@mise.app",
      name: "Administrator",
      email: "admin@mise.app",
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      position: "Admin"
    });
    console.log("Default admin account created (admin@mise.app).");
  }

  // Auth middleware — checks session for logged-in user
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
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

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
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

  const requireRole = (...roles: string[]) => {
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
  const audit = (req: Request, action: string, tableName: string, recordId?: string | number, before?: unknown, after?: unknown) => {
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

  // === AUTH ROUTES ===

  // Register new user (R2-T2: rate limited)
  app.post("/api/auth/register", registerRateLimiter, async (req, res) => {
    try {
      const parsed = registerUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ error: "E-Mail-Adresse bereits registriert" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      
      // Create user (not approved yet, role is guest by default)
      const user = await storage.createUser({
        username: parsed.email,
        password: hashedPassword,
        name: parsed.name,
        email: parsed.email,
        position: parsed.position,
        role: "guest",
        isApproved: false,
      });
      
      res.status(201).json({ 
        message: "Registrierung erfolgreich! Bitte warten Sie auf die Freischaltung durch den Administrator.",
        user: { id: user.id, name: user.name, email: user.email, isApproved: user.isApproved }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Login (R2-T2: rate limited)
  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const parsed = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(parsed.email);
      if (!user) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten" });
      }
      
      const validPassword = await bcrypt.compare(parsed.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten" });
      }
      
      if (!user.isApproved) {
        return res.status(403).json({ error: "Ihr Konto wurde noch nicht freigeschaltet. Bitte warten Sie auf die Freischaltung." });
      }
      
      // Regenerate session to prevent fixation, then set userId
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session-Fehler" });
        }
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session-Fehler" });
          }
          res.json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              position: user.position,
              role: user.role,
              isApproved: user.isApproved
            }
          });
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout fehlgeschlagen" });
      }
      res.json({ message: "Erfolgreich abgemeldet" });
    });
  });

  // Get current user from session
  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "Benutzer nicht gefunden" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      role: user.role,
      isApproved: user.isApproved
    });
  });

  // Get kitchen positions
  app.get("/api/auth/positions", (req, res) => {
    res.json(KITCHEN_POSITIONS);
  });

  // Check if initial setup is needed
  app.get("/api/auth/check-setup", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json({ needsSetup: users.length === 0 });
  });

  // === ADMIN: User Management ===
  
  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position,
      role: u.role,
      isApproved: u.isApproved,
      createdAt: u.createdAt
    })));
  });

  // Update user (admin only)
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const parsed = updateUserSchema.parse(req.body);
    const before = await storage.getUser(getParam(req.params.id));
    const updated = await storage.updateUser(getParam(req.params.id), parsed);

    if (!updated) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    audit(req, "update", "users", updated.id, before, updated);
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      position: updated.position,
      role: updated.role,
      isApproved: updated.isApproved
    });
  });

  // Create user (admin only) - replaces self-registration
  app.post("/api/admin/users/create", requireAdmin, async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, E-Mail und Passwort erforderlich" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Passwort muss mindestens 6 Zeichen haben" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "E-Mail-Adresse bereits registriert" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username: email,
        password: hashedPassword,
        name,
        email,
        position: "Koch",
        role: role || "koch",
        isApproved: true,
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        role: user.role,
        isApproved: user.isApproved,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const currentUser = (req as any).user;
    const userId = getParam(req.params.id);
    if (userId === currentUser.id) {
      return res.status(400).json({ error: "Sie können sich nicht selbst löschen" });
    }

    await storage.deleteUser(userId);
    res.status(204).send();
  });

  // === ADMIN: App Settings ===

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAllSettings();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }
    res.json(settingsObj);
  });

  app.put("/api/admin/settings/:key", requireAdmin, async (req, res) => {
    const { value } = updateSettingSchema.parse(req.body);
    const setting = await storage.setSetting(getParam(req.params.key), value);
    res.json(setting);
  });

  // Audit log viewer (admin only)
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || "100")), 500);
      const offset = parseInt(String(req.query.offset || "0"));
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create initial admin user if none exists
  app.post("/api/auth/setup", async (req, res) => {
    const users = await storage.getAllUsers();
    if (users.length > 0) {
      return res.status(400).json({ error: "Setup bereits abgeschlossen" });
    }
    
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, E-Mail und Passwort erforderlich" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({
      username: email,
      password: hashedPassword,
      name,
      email,
      position: "Küchenchef",
      role: "admin",
      isApproved: true,
    });
    
    req.session.userId = user.id;
    
    res.status(201).json({
      message: "Admin-Konto erstellt",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });

  // === RECIPES ===
  app.get("/api/recipes", requireAuth, async (req, res) => {
    const { q, category } = req.query;
    const filters = {
      q: typeof q === 'string' ? q : undefined,
      category: typeof category === 'string' ? category : undefined,
    };
    const recipes = await storage.getRecipes(filters);
    res.json(recipes);
  });

  app.get("/api/recipes/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ error: "Rezept nicht gefunden" });
    }
    const ingredients = await storage.getIngredients(id);
    res.json({ ...recipe, ingredientsList: ingredients });
  });

  app.post("/api/recipes", requireAuth, async (req, res) => {
    try {
      const parsed = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(parsed);
      
      // Create ingredients if provided
      if (req.body.ingredientsList && Array.isArray(req.body.ingredientsList)) {
        for (const ing of req.body.ingredientsList) {
          await storage.createIngredient({
            recipeId: recipe.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            allergens: ing.allergens || []
          });
        }
      }
      
      res.status(201).json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateRecipeSchema.parse(req.body);
      const before = await storage.getRecipe(id);
      const recipe = await storage.updateRecipe(id, parsed);
      if (!recipe) {
        return res.status(404).json({ error: "Rezept nicht gefunden" });
      }
      audit(req, "update", "recipes", id, { name: before?.name, category: before?.category }, { name: recipe.name, category: recipe.category });

      // Update ingredients if provided
      if (req.body.ingredientsList && Array.isArray(req.body.ingredientsList)) {
        await storage.deleteIngredientsByRecipe(id);
        for (const ing of req.body.ingredientsList) {
          await storage.createIngredient({
            recipeId: id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            allergens: ing.allergens || []
          });
        }
      }

      res.json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteRecipe(id);
    res.status(204).send();
  });

  // === RECIPE IMPORT FROM URL ===
  app.post("/api/recipes/import", requireAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL ist erforderlich" });
    }

    try {
      const scraped = await scrapeRecipe(url);
      if (!scraped) {
        return res.status(400).json({ error: "Rezept konnte nicht von URL geladen werden" });
      }

      // Auto-categorize based on recipe content
      const detectedCategory = autoCategorize(
        scraped.name,
        scraped.ingredients.map(i => i.name),
        scraped.steps
      );

      // Create the recipe
      const recipe = await storage.createRecipe({
        name: scraped.name,
        category: detectedCategory,
        portions: scraped.portions,
        prepTime: scraped.prepTime,
        image: scraped.image,
        sourceUrl: url,
        steps: scraped.steps,
        allergens: []
      });

      // Create ingredients
      for (const ing of scraped.ingredients) {
        await storage.createIngredient({
          recipeId: recipe.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          allergens: []
        });
      }

      const ingredients = await storage.getIngredients(recipe.id);
      res.status(201).json({ ...recipe, ingredientsList: ingredients });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // R2-T6: JSON Bulk Import (Admin only)
  app.post("/api/recipes/import-json", requireAdmin, async (req, res) => {
    try {
      const recipes = req.body;

      if (!Array.isArray(recipes)) {
        return res.status(400).json({ error: "Body muss ein Array von Rezepten sein" });
      }

      if (recipes.length === 0) {
        return res.status(400).json({ error: "Leeres Array" });
      }

      if (recipes.length > 100) {
        return res.status(400).json({ error: "Maximal 100 Rezepte pro Import" });
      }

      const validCategories = ["ClearSoups", "CreamSoups", "MainMeat", "MainVegan", "Sides", "ColdSauces", "HotSauces", "Salads", "HotDesserts", "ColdDesserts"];
      const created: any[] = [];
      const errors: { index: number; error: string }[] = [];

      for (let i = 0; i < recipes.length; i++) {
        const r = recipes[i];

        // Validate required fields
        if (!r.name || typeof r.name !== "string") {
          errors.push({ index: i, error: "name ist erforderlich" });
          continue;
        }
        if (!r.category || !validCategories.includes(r.category)) {
          errors.push({ index: i, error: `category muss einer von: ${validCategories.join(", ")}` });
          continue;
        }

        try {
          const recipe = await storage.createRecipe({
            name: r.name,
            category: r.category,
            portions: r.portions || 1,
            prepTime: r.prepTime || 0,
            image: r.image || null,
            sourceUrl: r.sourceUrl || null,
            steps: Array.isArray(r.steps) ? r.steps : [],
            allergens: Array.isArray(r.allergens) ? r.allergens : [],
            tags: Array.isArray(r.tags) ? r.tags : [],
          });

          // Create ingredients if provided
          if (Array.isArray(r.ingredients)) {
            for (const ing of r.ingredients) {
              if (ing.name && typeof ing.amount === "number" && ing.unit) {
                await storage.createIngredient({
                  recipeId: recipe.id,
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit,
                  allergens: Array.isArray(ing.allergens) ? ing.allergens : []
                });
              }
            }
          }

          created.push({ id: recipe.id, name: recipe.name });
        } catch (err: any) {
          errors.push({ index: i, error: err.message });
        }
      }

      res.status(201).json({
        message: `${created.length} Rezepte importiert`,
        created,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === INGREDIENTS ===
  app.get("/api/recipes/:id/ingredients", requireAuth, async (req, res) => {
    const recipeId = parseInt(getParam(req.params.id), 10);
    const ingredients = await storage.getIngredients(recipeId);
    res.json(ingredients);
  });

  // Bulk ingredients for multiple recipes (avoids N+1)
  app.get("/api/ingredients/bulk", requireAuth, async (req, res) => {
    const { recipeIds } = req.query;
    if (!recipeIds) return res.json([]);
    const ids = (recipeIds as string).split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const ingredients = await storage.getIngredientsByRecipeIds(ids);
    res.json(ingredients);
  });

  // === OCR PDF Extraction ===
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/ocr/pdf", requireAuth, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen" });
      }
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "PDF-Extraktion fehlgeschlagen" });
    }
  });

  // === FRIDGES ===
  app.get("/api/fridges", requireAuth, async (req, res) => {
    const { locationId } = req.query;
    const locId = locationId ? parseInt(locationId as string, 10) : undefined;
    const allFridges = await storage.getFridges();
    const filtered = locId ? allFridges.filter(f => f.locationId === locId) : allFridges;
    res.json(filtered);
  });

  app.post("/api/fridges", requireAuth, async (req, res) => {
    try {
      const parsed = insertFridgeSchema.parse(req.body);
      const fridge = await storage.createFridge(parsed);
      res.status(201).json(fridge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/fridges/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateFridgeSchema.parse(req.body);
      const fridge = await storage.updateFridge(id, parsed);
      if (!fridge) {
        return res.status(404).json({ error: "Kühlschrank nicht gefunden" });
      }
      res.json(fridge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/fridges/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteFridge(id);
    res.status(204).send();
  });

  // === HACCP LOGS ===
  app.get("/api/haccp-logs", requireAuth, async (req, res) => {
    const { limit, offset } = req.query;
    const lim = limit ? parseInt(limit as string, 10) : undefined;
    const off = offset ? parseInt(offset as string, 10) : undefined;
    const logs = await storage.getHaccpLogs({ limit: lim, offset: off });
    if (lim) {
      const total = await storage.getHaccpLogCount();
      return res.json({ logs, total, limit: lim, offset: off || 0 });
    }
    res.json(logs);
  });

  app.get("/api/fridges/:id/logs", requireAuth, async (req, res) => {
    const fridgeId = parseInt(getParam(req.params.id), 10);
    const logs = await storage.getHaccpLogsByFridge(fridgeId);
    res.json(logs);
  });

  app.post("/api/haccp-logs", requireAuth, async (req, res) => {
    try {
      const parsed = insertHaccpLogSchema.parse(req.body);

      // Auto-calculate status server-side based on fridge thresholds
      const fridge = await storage.getFridge(parsed.fridgeId);
      if (fridge) {
        const temp = parsed.temperature;
        const deviation = Math.max(fridge.tempMin - temp, temp - fridge.tempMax, 0);
        if (deviation === 0) {
          parsed.status = "OK";
        } else if (deviation > 2) {
          parsed.status = "CRITICAL";
        } else {
          parsed.status = "WARNING";
        }
      }

      const log = await storage.createHaccpLog(parsed);
      audit(req, "create", "haccp_logs", log.id, null, { fridgeId: log.fridgeId, temperature: log.temperature, status: log.status });
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // === SEED DATA (for initial setup) ===
  app.post("/api/seed", requireAdmin, async (req, res) => {
    try {
      // Check if data already exists
      const existingFridges = await storage.getFridges();
      if (existingFridges.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      // Seed fridges
      await storage.createFridge({ name: "Kühlraum", tempMin: 0, tempMax: 4 });
      await storage.createFridge({ name: "Tiefkühler", tempMin: -22, tempMax: -18 });
      await storage.createFridge({ name: "Vorbereitungskühlschrank", tempMin: 0, tempMax: 5 });

      // Seed shift types (Dienste)
      const existingShiftTypes = await storage.getShiftTypes();
      if (existingShiftTypes.length === 0) {
        await storage.createShiftType({ name: "Frühstück", startTime: "06:00", endTime: "14:30", color: "#22c55e" });
        await storage.createShiftType({ name: "Kochen Mittag", startTime: "07:00", endTime: "15:30", color: "#3b82f6" });
        await storage.createShiftType({ name: "Kochen Mittag 2", startTime: "08:00", endTime: "16:30", color: "#8b5cf6" });
        await storage.createShiftType({ name: "Abwasch", startTime: "08:00", endTime: "16:30", color: "#f59e0b" });
        await storage.createShiftType({ name: "Kochen Abend", startTime: "13:00", endTime: "21:30", color: "#ef4444" });
      }

      // Seed staff members from Dienstplan image
      const existingStaff = await storage.getStaff();
      if (existingStaff.length === 0) {
        await storage.createStaff({ name: "Moscher, Gerald", role: "Koch", color: "#3b82f6" });
        await storage.createStaff({ name: "Glanzer, Patrick", role: "Koch", color: "#22c55e" });
        await storage.createStaff({ name: "Cayli, Bugra", role: "Koch", color: "#f59e0b" });
        await storage.createStaff({ name: "Stindl, Michael", role: "Koch", color: "#8b5cf6" });
        await storage.createStaff({ name: "Deyab, Mona", role: "Koch", color: "#ec4899" });
        await storage.createStaff({ name: "Enoma, Helen", role: "Koch", color: "#06b6d4" });
        await storage.createStaff({ name: "Kononenko, Alina", role: "Koch", color: "#84cc16" });
        await storage.createStaff({ name: "Nsiah-Youngman, Ma", role: "Koch", color: "#ef4444" });
      }

      res.json({ message: "Seed data created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seed Austrian/Styrian recipes
  app.post("/api/seed-recipes", requireAdmin, async (req, res) => {
    try {
      const existingRecipes = await storage.getRecipes();
      if (existingRecipes.length >= 20) {
        return res.json({ message: "Recipes already seeded", count: existingRecipes.length });
      }

      const austrianRecipes = [
        // SOUPS (20+)
        { name: "Frittatensuppe", category: "ClearSoups", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Palatschinken backen", "In Streifen schneiden", "Mit heißer Rindssuppe servieren"] },
        { name: "Leberknödelsuppe", category: "ClearSoups", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Leber faschieren", "Mit Semmelbröseln und Ei vermengen", "Knödel formen", "In Suppe kochen"] },
        { name: "Grießnockerlsuppe", category: "ClearSoups", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Butter schaumig rühren", "Grieß und Ei untermengen", "Nockerl formen", "In Suppe kochen"] },
        { name: "Knoblauchcremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Knoblauch anrösten", "Mit Suppe aufgießen", "Obers hinzufügen", "Pürieren"] },
        { name: "Kürbiscremesuppe", category: "CreamSoups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Kürbis würfeln", "Mit Zwiebeln anbraten", "Aufgießen und pürieren", "Mit Kernöl verfeinern"] },
        { name: "Selleriecremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["G", "I"], steps: ["Sellerie kochen", "Pürieren", "Mit Obers verfeinern"] },
        { name: "Schwammerlsuppe", category: "CreamSoups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Pilze putzen", "Anbraten", "Mit Suppe aufgießen", "Mit Sauerrahm verfeinern"] },
        { name: "Erdäpfelsuppe", category: "CreamSoups", portions: 4, prepTime: 40, allergens: ["G", "I"], steps: ["Kartoffeln würfeln", "Mit Lauch anbraten", "Kochen und pürieren"] },
        { name: "Klare Rindsuppe", category: "ClearSoups", portions: 6, prepTime: 180, allergens: ["I"], steps: ["Rindfleisch und Knochen kochen", "Wurzelgemüse hinzufügen", "Abseihen", "Würzen"] },
        { name: "Karfiolcremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["G"], steps: ["Karfiol kochen", "Pürieren", "Mit Obers verfeinern", "Mit Muskat würzen"] },
        { name: "Spargelcremesuppe", category: "CreamSoups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Spargel kochen", "Schalen für Fond", "Pürieren", "Mit Obers vollenden"] },
        { name: "Bärlauchcremesuppe", category: "CreamSoups", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Zwiebeln anbraten", "Bärlauch hinzufügen", "Pürieren", "Mit Sauerrahm servieren"] },
        { name: "Tomatencremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["G"], steps: ["Tomaten rösten", "Mit Basilikum pürieren", "Obers einrühren"] },
        { name: "Linsensuppe", category: "ClearSoups", portions: 4, prepTime: 45, allergens: [], steps: ["Linsen mit Gemüse kochen", "Mit Essig abschmecken"] },
        { name: "Erbsensuppe", category: "ClearSoups", portions: 4, prepTime: 60, allergens: ["I"], steps: ["Erbsen einweichen", "Mit Suppengrün kochen", "Pürieren"] },
        { name: "Bohnensuppe", category: "ClearSoups", portions: 4, prepTime: 50, allergens: [], steps: ["Weiße Bohnen kochen", "Mit Speck verfeinern"] },
        { name: "Zwiebelsuppe", category: "ClearSoups", portions: 4, prepTime: 40, allergens: ["A", "G"], steps: ["Zwiebeln karamellisieren", "Mit Suppe aufgießen", "Mit Käsetoast servieren"] },
        { name: "Nudelsuppe", category: "ClearSoups", portions: 4, prepTime: 20, allergens: ["A", "C"], steps: ["Rindssuppe aufkochen", "Nudeln einlegen", "Schnittlauch darüber"] },
        { name: "Einmachsuppe", category: "ClearSoups", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Einmach aus Butter und Mehl", "Mit Suppe aufgießen", "Mit Sauerrahm vollenden"] },
        { name: "Kaspressknödelsuppe", category: "ClearSoups", portions: 4, prepTime: 40, allergens: ["A", "C", "G"], steps: ["Knödel aus Altbrot und Käse formen", "Braten", "In Suppe servieren"] },

        // MAINS - Meat (25+)
        { name: "Wiener Schnitzel", category: "MainMeat", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Fleisch klopfen", "Panieren", "In Butterschmalz ausbacken", "Mit Zitrone servieren"] },
        { name: "Schweinsbraten", category: "MainMeat", portions: 6, prepTime: 120, allergens: [], steps: ["Schwarte einschneiden", "Würzen", "Im Rohr braten", "Mit Bratensaft servieren"] },
        { name: "Tafelspitz", category: "MainMeat", portions: 6, prepTime: 180, allergens: ["L"], steps: ["Rindfleisch mit Suppengemüse kochen", "Mit Schnittlauchsauce servieren", "Apfelkren dazu reichen"] },
        { name: "Backhendl", category: "MainMeat", portions: 4, prepTime: 45, allergens: ["A", "C"], steps: ["Hendl zerteilen", "Panieren", "In Fett ausbacken"] },
        { name: "Rindsgulasch", category: "MainMeat", portions: 6, prepTime: 120, allergens: [], steps: ["Zwiebeln rösten", "Fleisch anbraten", "Mit Paprika würzen", "Langsam schmoren"] },
        { name: "Zwiebelrostbraten", category: "MainMeat", portions: 4, prepTime: 40, allergens: [], steps: ["Rostbraten braten", "Röstzwiebeln zubereiten", "Mit Bratensaft servieren"] },
        { name: "Stelze", category: "MainMeat", portions: 4, prepTime: 150, allergens: [], steps: ["Stelze würzen", "Im Rohr knusprig braten", "Mit Kraut servieren"] },
        { name: "Cordon Bleu", category: "MainMeat", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Schnitzel füllen", "Mit Schinken und Käse", "Panieren", "Ausbacken"] },
        { name: "Leberkäse", category: "MainMeat", portions: 8, prepTime: 90, allergens: [], steps: ["Leberkäse backen", "In Scheiben schneiden", "Mit Senf und Semmel servieren"] },
        { name: "Beuschel", category: "MainMeat", portions: 4, prepTime: 90, allergens: ["A"], steps: ["Innereien kochen", "Sauce zubereiten", "Mit Semmelknödel servieren"] },
        { name: "Blunzengröstl", category: "MainMeat", portions: 4, prepTime: 30, allergens: ["C"], steps: ["Blutwurst würfeln", "Mit Erdäpfeln braten", "Mit Spiegelei servieren"] },
        { name: "Kalbsrahmgeschnetzeltes", category: "MainMeat", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Kalbfleisch schnetzeln", "Anbraten", "Mit Rahmsauce servieren"] },
        { name: "Altwiener Suppentopf", category: "MainMeat", portions: 6, prepTime: 120, allergens: ["I"], steps: ["Rindfleisch mit Gemüse kochen", "Als Eintopf servieren"] },
        { name: "Faschierter Braten", category: "MainMeat", portions: 6, prepTime: 70, allergens: ["A", "C"], steps: ["Faschiertes würzen", "Formen", "Im Rohr braten"] },
        { name: "Krautfleckerl mit Speck", category: "MainMeat", portions: 4, prepTime: 40, allergens: ["A", "C"], steps: ["Kraut dünsten", "Fleckerl kochen", "Mit Speck mischen"] },
        { name: "Gebackene Leber", category: "MainMeat", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Leber schneiden", "Panieren", "Ausbacken", "Mit Erdäpfelpüree servieren"] },
        { name: "Steirisches Wurzelfleisch", category: "MainMeat", portions: 6, prepTime: 90, allergens: ["L"], steps: ["Schweinfleisch kochen", "Mit Kren servieren", "Wurzelgemüse dazu"] },
        { name: "Grammelknödel", category: "MainMeat", portions: 4, prepTime: 50, allergens: ["A", "C"], steps: ["Kartoffelteig zubereiten", "Mit Grammeln füllen", "Kochen"] },
        { name: "Fleischlaberl", category: "MainMeat", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Faschiertes würzen", "Laibchen formen", "Braten"] },
        { name: "Geselchtes mit Sauerkraut", category: "MainMeat", portions: 4, prepTime: 60, allergens: [], steps: ["Geselchtes kochen", "Sauerkraut dünsten", "Zusammen servieren"] },
        { name: "Kümmelbraten", category: "MainMeat", portions: 6, prepTime: 100, allergens: [], steps: ["Schweinefleisch mit Kümmel würzen", "Langsam braten"] },
        { name: "Lammstelze", category: "MainMeat", portions: 4, prepTime: 120, allergens: [], steps: ["Lamm marinieren", "Im Rohr schmoren"] },
        { name: "Hühnerkeule überbacken", category: "MainMeat", portions: 4, prepTime: 50, allergens: ["G"], steps: ["Hühnerkeulen braten", "Mit Käse überbacken"] },
        { name: "Putenschnitzel", category: "MainMeat", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Pute klopfen", "Panieren", "Braten"] },
        { name: "Lasagne", category: "MainMeat", portions: 6, prepTime: 75, allergens: ["A", "C", "G"], steps: ["Bolognese zubereiten", "Schichten", "Überbacken"] },

        // MAINS - Vegetarian (20+)
        { name: "Käsespätzle", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Spätzle kochen", "Schichten mit Käse", "Mit Röstzwiebeln servieren"] },
        { name: "Spinatknödel", category: "MainVegan", portions: 4, prepTime: 40, allergens: ["A", "C", "G"], steps: ["Spinat hacken", "Mit Knödelteig mischen", "Kochen", "Mit brauner Butter servieren"] },
        { name: "Gemüsestrudel", category: "MainVegan", portions: 6, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Gemüse dünsten", "In Strudelteig wickeln", "Backen"] },
        { name: "Eierschwammerl mit Knödel", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Schwammerl putzen", "In Rahm schwenken", "Mit Semmelknödel servieren"] },
        { name: "Kasnocken", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Nockenteig zubereiten", "Mit Käse schichten", "Im Rohr überbacken"] },
        { name: "Erdäpfelgulasch", category: "MainVegan", portions: 4, prepTime: 40, allergens: [], steps: ["Kartoffeln und Würstel würfeln", "Mit Paprika kochen"] },
        { name: "Eiernockerl", category: "MainVegan", portions: 2, prepTime: 15, allergens: ["A", "C"], steps: ["Nockerl braten", "Mit Ei stocken lassen", "Mit grünem Salat servieren"] },
        { name: "Topfenknödel", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Topfenteig zubereiten", "Knödel formen", "Kochen", "In Butterbröseln wälzen"] },
        { name: "Marillenknödel", category: "MainVegan", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Marillen einwickeln", "Kochen", "In Bröseln wälzen"] },
        { name: "Zwetschgenknödel", category: "MainVegan", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Zwetschgen einwickeln", "Kochen", "Mit Zimt-Zucker servieren"] },
        { name: "Mohnnudeln", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffelteig zu Nudeln formen", "Kochen", "In Mohn und Butter wälzen"] },
        { name: "Krautstrudel", category: "MainVegan", portions: 6, prepTime: 60, allergens: ["A", "C"], steps: ["Kraut dünsten", "Mit Kümmel würzen", "In Strudelteig wickeln", "Backen"] },
        { name: "Gemüselaibchen", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C"], steps: ["Gemüse raspeln", "Mit Ei und Mehl binden", "Braten"] },
        { name: "Käsesuppe", category: "MainVegan", portions: 4, prepTime: 25, allergens: ["A", "G"], steps: ["Zwiebeln anbraten", "Mit Suppe aufgießen", "Käse einschmelzen"] },
        { name: "Reiberdatschi", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffeln reiben", "Würzen", "Als Laibchen braten"] },
        { name: "Polenta mit Schwammerl", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Polenta kochen", "Pilze braten", "Mit Parmesan servieren"] },
        { name: "Risotto mit Spargel", category: "MainVegan", portions: 4, prepTime: 40, allergens: ["G"], steps: ["Spargel kochen", "Risotto zubereiten", "Zusammen servieren"] },
        { name: "Quiche Lorraine", category: "MainVegan", portions: 6, prepTime: 55, allergens: ["A", "C", "G"], steps: ["Mürbteig backen", "Mit Eiermasse füllen", "Backen"] },
        { name: "Flammkuchen", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Teig dünn ausrollen", "Mit Sauerrahm bestreichen", "Belegen", "Backen"] },
        { name: "Schinkenfleckerl", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Fleckerl kochen", "Mit Schinken und Sauerrahm überbacken"] },

        // SIDES (25+)
        { name: "Pommes Frites", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Kartoffeln schneiden", "Frittieren", "Salzen"] },
        { name: "Erdäpfelpüree", category: "Sides", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Kartoffeln kochen", "Stampfen", "Mit Butter und Milch verfeinern"] },
        { name: "Semmelknödel", category: "Sides", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Semmeln einweichen", "Mit Ei binden", "Knödel formen", "Kochen"] },
        { name: "Petersilkartoffeln", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Kartoffeln kochen", "In Butter schwenken", "Mit Petersilie bestreuen"] },
        { name: "Reis", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Reis waschen", "Kochen", "Mit Butter verfeinern"] },
        { name: "Butternockerl", category: "Sides", portions: 4, prepTime: 20, allergens: ["A", "C", "G"], steps: ["Nockenteig zubereiten", "In Wasser kochen", "Mit Butter servieren"] },
        { name: "Kroketten", category: "Sides", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffelmasse zubereiten", "Formen", "Panieren", "Frittieren"] },
        { name: "Spätzle", category: "Sides", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Teig zubereiten", "Durch Spätzlepresse drücken", "In Butter schwenken"] },
        { name: "Serviettenknödel", category: "Sides", portions: 6, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Knödelmasse in Serviette wickeln", "Kochen", "In Scheiben schneiden"] },
        { name: "Bratkartoffeln", category: "Sides", portions: 4, prepTime: 30, allergens: [], steps: ["Kartoffeln kochen", "In Scheiben schneiden", "Knusprig braten"] },
        { name: "Sauerkraut", category: "Sides", portions: 4, prepTime: 40, allergens: [], steps: ["Kraut mit Kümmel dünsten", "Mit Schmalz verfeinern"] },
        { name: "Rotkraut", category: "Sides", portions: 4, prepTime: 50, allergens: [], steps: ["Rotkraut hobeln", "Mit Apfel und Essig schmoren"] },
        { name: "Speckkraut", category: "Sides", portions: 4, prepTime: 35, allergens: [], steps: ["Weißkraut mit Speck dünsten", "Mit Kümmel würzen"] },
        { name: "Bohnensalat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Bohnen kochen", "Mit Essig-Öl marinieren", "Mit Zwiebeln servieren"] },
        { name: "Gurkensalat", category: "Sides", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Gurken hobeln", "Mit Sauerrahm-Dressing anmachen"] },
        { name: "Erdäpfelsalat", category: "Sides", portions: 4, prepTime: 30, allergens: [], steps: ["Kartoffeln kochen", "Warm marinieren", "Mit Essig und Öl anmachen"] },
        { name: "Krautsalat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Kraut hobeln", "Mit heißem Essig-Öl marinieren"] },
        { name: "Karottensalat", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Karotten raspeln", "Mit Zitrone und Öl anmachen"] },
        { name: "Rote Rüben Salat", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Rote Rüben kochen", "Schneiden", "Mit Kren marinieren"] },
        { name: "Vogerlsalat", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Feldsalat waschen", "Mit Kernöl-Dressing anrichten"] },
        { name: "Gemischter Salat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Verschiedene Salate waschen", "Mit Dressing anrichten"] },
        { name: "Bratgemüse", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Gemüse würfeln", "Im Ofen rösten"] },
        { name: "Karottengemüse", category: "Sides", portions: 4, prepTime: 20, allergens: ["G"], steps: ["Karotten kochen", "In Butter schwenken"] },
        { name: "Kohlsprossen", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Kohlsprossen putzen", "Kochen", "In Butter schwenken"] },
        { name: "Rahmkohlrabi", category: "Sides", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Kohlrabi kochen", "In Rahmsauce schwenken"] },

        // DESSERTS (25+)
        { name: "Kaiserschmarrn", category: "HotDesserts", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Teig zubereiten", "In Pfanne backen", "Zerreißen", "Mit Puderzucker bestreuen"] },
        { name: "Apfelstrudel", category: "HotDesserts", portions: 8, prepTime: 60, allergens: ["A"], steps: ["Strudelteig ziehen", "Äpfel einwickeln", "Backen", "Mit Vanillesauce servieren"] },
        { name: "Sachertorte", category: "ColdDesserts", portions: 12, prepTime: 90, allergens: ["A", "C", "G"], steps: ["Schokobiskuit backen", "Mit Marmelade füllen", "Glasieren"] },
        { name: "Palatschinken", category: "HotDesserts", portions: 4, prepTime: 20, allergens: ["A", "C", "G"], steps: ["Teig zubereiten", "Dünne Pfannkuchen backen", "Mit Marmelade füllen"] },
        { name: "Topfenstrudel", category: "HotDesserts", portions: 8, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Topfenfülle zubereiten", "Einwickeln", "Backen"] },
        { name: "Germknödel", category: "HotDesserts", portions: 4, prepTime: 60, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Powidl füllen", "Dämpfen", "Mit Mohn bestreuen"] },
        { name: "Buchteln", category: "HotDesserts", portions: 12, prepTime: 75, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Marmelade füllen", "Backen", "Mit Vanillesauce servieren"] },
        { name: "Linzer Torte", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C", "H"], steps: ["Mürbteig mit Nüssen", "Mit Ribiselmarmelade füllen", "Gitter auflegen", "Backen"] },
        { name: "Esterházy Torte", category: "ColdDesserts", portions: 12, prepTime: 90, allergens: ["A", "C", "H"], steps: ["Nussböden backen", "Mit Buttercreme füllen", "Marmorglasur"] },
        { name: "Punschkrapferl", category: "ColdDesserts", portions: 16, prepTime: 60, allergens: ["A", "C"], steps: ["Biskuitreste mit Punsch vermengen", "Formen", "Rosa glasieren"] },
        { name: "Powidltascherl", category: "HotDesserts", portions: 4, prepTime: 45, allergens: ["A", "C"], steps: ["Kartoffelteig zubereiten", "Mit Powidl füllen", "Kochen", "In Bröseln wälzen"] },
        { name: "Grießschmarrn", category: "HotDesserts", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Grießbrei kochen", "In Pfanne anbraten", "Zerreißen"] },
        { name: "Scheiterhaufen", category: "HotDesserts", portions: 6, prepTime: 65, allergens: ["A", "C", "G"], steps: ["Semmeln und Äpfel schichten", "Mit Eiermilch übergießen", "Backen"] },
        { name: "Milchrahmstrudel", category: "HotDesserts", portions: 8, prepTime: 55, allergens: ["A", "C", "G"], steps: ["Milchrahmfülle zubereiten", "In Strudelteig wickeln", "Backen"] },
        { name: "Nussschnitte", category: "ColdDesserts", portions: 16, prepTime: 50, allergens: ["A", "C", "H"], steps: ["Biskuit backen", "Mit Nusscreme füllen", "Schneiden"] },
        { name: "Kardinalschnitte", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C"], steps: ["Biskuit und Baiser backen", "Schichten", "Schneiden"] },
        { name: "Vanillekipferl", category: "ColdDesserts", portions: 40, prepTime: 45, allergens: ["A", "H"], steps: ["Mürbteig mit Nüssen", "Kipferl formen", "Backen", "In Vanillezucker wälzen"] },
        { name: "Marmorkuchen", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C", "G"], steps: ["Rührteig zubereiten", "Teil mit Kakao färben", "Marmorieren", "Backen"] },
        { name: "Gugelhupf", category: "ColdDesserts", portions: 12, prepTime: 70, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Rosinen", "In Form backen"] },
        { name: "Mohntorte", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C"], steps: ["Mohnmasse zubereiten", "Torte backen", "Mit Schlag servieren"] },
        { name: "Nusstorte", category: "ColdDesserts", portions: 12, prepTime: 70, allergens: ["A", "C", "H"], steps: ["Nussböden backen", "Mit Creme füllen"] },
        { name: "Indianer", category: "ColdDesserts", portions: 8, prepTime: 40, allergens: ["A", "C"], steps: ["Bisquit backen", "Aushöhlen", "Mit Schlag füllen", "Glasieren"] },
        { name: "Cremeschnitte", category: "ColdDesserts", portions: 12, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Blätterteig backen", "Vanillecreme zubereiten", "Schichten"] },
        { name: "Obstknödel", category: "HotDesserts", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Obst einwickeln", "Kochen", "In Bröseln wälzen"] },
        { name: "Wiener Melange Mousse", category: "ColdDesserts", portions: 4, prepTime: 30, allergens: ["C", "G"], steps: ["Kaffee-Mousse zubereiten", "Kalt stellen", "Mit Schlag servieren"] },

        // SALADS (10+)
        { name: "Steirischer Käferbohnensalat", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Käferbohnen kochen", "Mit Kernöl marinieren", "Mit Zwiebeln servieren"] },
        { name: "Nüsslisalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Feldsalat waschen", "Mit Essig-Öl anmachen"] },
        { name: "Endiviensalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Endivie waschen", "Mit Speckdressing anrichten"] },
        { name: "Radicchio Salat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Radicchio waschen", "Mit Balsamico anrichten"] },
        { name: "Tomatensalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Tomaten schneiden", "Mit Zwiebeln und Essig-Öl anmachen"] },
        { name: "Wurstsalat", category: "Salads", portions: 4, prepTime: 15, allergens: [], steps: ["Wurst in Streifen schneiden", "Mit Zwiebeln und Essig-Öl anmachen"] },
        { name: "Hirtensalat", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Gurken, Tomaten, Paprika schneiden", "Mit Schafskäse servieren"] },
        { name: "Caesar Salad", category: "Salads", portions: 4, prepTime: 20, allergens: ["A", "C", "D", "G"], steps: ["Romanasalat waschen", "Mit Caesar-Dressing anrichten", "Croûtons und Parmesan dazu"] },
        { name: "Fisolensalat", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Fisolen kochen", "Mit Essig-Öl marinieren"] },
        { name: "Selleriesalat", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Sellerie raspeln", "Mit Mayonnaise anmachen"] },

        // BREAKFAST (10+)
        { name: "Bauernfrühstück", category: "Sides", portions: 2, prepTime: 20, allergens: ["C"], steps: ["Kartoffeln braten", "Eier und Speck dazugeben", "Stocken lassen"] },
        { name: "Strammer Max", category: "Sides", portions: 2, prepTime: 15, allergens: ["A", "C"], steps: ["Brot mit Schinken belegen", "Spiegelei darauf geben"] },
        { name: "Eierspeis", category: "Sides", portions: 2, prepTime: 10, allergens: ["C"], steps: ["Eier verquirlen", "In Butter stocken lassen"] },
        { name: "Speckbrot", category: "Sides", portions: 2, prepTime: 10, allergens: ["A"], steps: ["Speck anbraten", "Auf Brot servieren"] },
        { name: "Verhackerts", category: "Sides", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Grammel faschieren", "Würzen", "Auf Brot streichen"] },
        { name: "Kipferl mit Butter", category: "Sides", portions: 4, prepTime: 5, allergens: ["A", "G"], steps: ["Kipferl aufschneiden", "Mit Butter bestreichen"] },
        { name: "Birchermüsli", category: "Sides", portions: 4, prepTime: 15, allergens: ["A", "G", "H"], steps: ["Haferflocken einweichen", "Mit Joghurt und Obst mischen"] },
        { name: "Käseaufstrich", category: "Sides", portions: 4, prepTime: 10, allergens: ["G"], steps: ["Topfen mit Käse mischen", "Würzen", "Auf Brot streichen"] },
        { name: "Liptauer", category: "Sides", portions: 4, prepTime: 10, allergens: ["G"], steps: ["Topfen mit Paprika und Gewürzen mischen", "Kalt stellen"] },
        { name: "Wiener Frühstück", category: "Sides", portions: 2, prepTime: 15, allergens: ["A", "C", "G"], steps: ["Semmel mit Butter", "Weiches Ei", "Kaffee dazu"] },

        // SNACKS (10+)
        { name: "Bosna", category: "Sides", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Bratwürste grillen", "In Semmel mit Zwiebeln und Senf servieren"] },
        { name: "Käsekrainer", category: "Sides", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Krainer grillen", "Mit Senf und Kren servieren"] },
        { name: "Frankfurter", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Würstel erhitzen", "Mit Senf servieren"] },
        { name: "Leberkässemmel", category: "Sides", portions: 4, prepTime: 10, allergens: ["A"], steps: ["Leberkäse anbraten", "In Semmel mit Senf servieren"] },
        { name: "Brezel", category: "Sides", portions: 6, prepTime: 30, allergens: ["A"], steps: ["Laugengebäck formen", "Backen", "Mit Butter servieren"] },
        { name: "Langosch", category: "Sides", portions: 4, prepTime: 25, allergens: ["A", "G"], steps: ["Teig ausbacken", "Mit Knoblauch und Käse belegen"] },
        { name: "Topfengolatsche", category: "Sides", portions: 8, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Blätterteig mit Topfen füllen", "Backen"] },
        { name: "Apfeltaschen", category: "Sides", portions: 8, prepTime: 40, allergens: ["A"], steps: ["Blätterteig mit Apfel füllen", "Backen"] },
        { name: "Mohnflesserl", category: "Sides", portions: 6, prepTime: 35, allergens: ["A"], steps: ["Germteig flechten", "Mit Mohn bestreuen", "Backen"] },
        { name: "Salzstangerl", category: "Sides", portions: 8, prepTime: 30, allergens: ["A"], steps: ["Laugengebäck formen", "Mit Salz bestreuen", "Backen"] },

        // DRINKS (10+)
        { name: "Wiener Melange", category: "ColdSauces", portions: 1, prepTime: 5, allergens: ["G"], steps: ["Espresso zubereiten", "Mit aufgeschäumter Milch servieren"] },
        { name: "Einspänner", category: "ColdSauces", portions: 1, prepTime: 5, allergens: ["G"], steps: ["Mokka in Glas", "Mit Schlagobers bedecken"] },
        { name: "Almudler Spritzer", category: "ColdSauces", portions: 1, prepTime: 2, allergens: [], steps: ["Almdudler mit Soda mischen"] },
        { name: "Hollunder Spritzer", category: "ColdSauces", portions: 1, prepTime: 2, allergens: [], steps: ["Holundersirup mit Soda aufgießen"] },
        { name: "Zitronen Eistee", category: "ColdSauces", portions: 4, prepTime: 15, allergens: [], steps: ["Tee kochen", "Mit Zitrone kalt stellen"] },
        { name: "Apfelsaft gespritzt", category: "ColdSauces", portions: 1, prepTime: 2, allergens: [], steps: ["Apfelsaft mit Mineralwasser mischen"] },
        { name: "Heiße Schokolade", category: "ColdSauces", portions: 1, prepTime: 10, allergens: ["G"], steps: ["Milch erhitzen", "Schokolade einrühren", "Mit Schlag servieren"] },
        { name: "Punsch", category: "ColdSauces", portions: 4, prepTime: 15, allergens: [], steps: ["Tee mit Gewürzen kochen", "Fruchtsaft hinzufügen"] },
        { name: "Glühwein", category: "ColdSauces", portions: 4, prepTime: 15, allergens: [], steps: ["Rotwein mit Gewürzen erhitzen", "Nicht kochen"] },
        { name: "Frischer Orangensaft", category: "ColdSauces", portions: 2, prepTime: 5, allergens: [], steps: ["Orangen auspressen", "Kalt servieren"] },

        // STARTERS (10+)
        { name: "Gebackene Champignons", category: "Salads", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Champignons panieren", "Ausbacken", "Mit Sauce Tartare servieren"] },
        { name: "Schinkenröllchen", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Schinken mit Kren-Frischkäse füllen", "Aufrollen"] },
        { name: "Geräucherte Forelle", category: "Salads", portions: 4, prepTime: 10, allergens: ["D"], steps: ["Forelle filetieren", "Mit Kren-Rahm servieren"] },
        { name: "Vitello Tonnato", category: "Salads", portions: 6, prepTime: 30, allergens: ["C", "D"], steps: ["Kalbfleisch kochen", "Mit Thunfischsauce servieren"] },
        { name: "Beef Tatar", category: "Salads", portions: 4, prepTime: 20, allergens: ["C"], steps: ["Rindfleisch fein hacken", "Würzen", "Mit Toast servieren"] },
        { name: "Carpaccio", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Rindfleisch dünn aufschneiden", "Mit Parmesan und Rucola servieren"] },
        { name: "Bruschetta", category: "Salads", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Brot rösten", "Mit Tomaten-Basilikum belegen"] },
        { name: "Antipasti Teller", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Mariniertes Gemüse anrichten", "Mit Oliven servieren"] },
        { name: "Bündnerfleisch", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Bündnerfleisch dünn aufschneiden", "Mit Brot servieren"] },
        { name: "Räucherlachs", category: "Salads", portions: 4, prepTime: 10, allergens: ["D"], steps: ["Lachs auslegen", "Mit Dill und Zitrone servieren"] }
      ];

      let created = 0;
      for (const recipe of austrianRecipes) {
        await storage.createRecipe({
          name: recipe.name,
          category: recipe.category,
          portions: recipe.portions,
          prepTime: recipe.prepTime,
          image: null,
          sourceUrl: null,
          steps: recipe.steps,
          allergens: recipe.allergens
        });
        created++;
      }

      res.json({ message: `${created} Austrian recipes created successfully`, count: created });
    } catch (error: any) {
      console.error('Seed recipes error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === RECIPE EXPORT ===
  app.get("/api/recipes/:id/export/:format", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const format = getParam(req.params.format);
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ error: "Rezept nicht gefunden" });
      }
      
      const ingredients = await storage.getIngredients(id);
      
      if (format === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf"`);
        
        doc.pipe(res);
        
        doc.fontSize(24).font('Helvetica-Bold').text(recipe.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Kategorie: ${recipe.category} | Portionen: ${recipe.portions} | Zubereitungszeit: ${recipe.prepTime} Min.`);
        doc.moveDown();
        
        if (recipe.allergens && recipe.allergens.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Allergene: ');
          doc.font('Helvetica').text(recipe.allergens.join(', '));
          doc.moveDown();
        }
        
        doc.fontSize(14).font('Helvetica-Bold').text('Zutaten:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        for (const ing of ingredients) {
          const allergenInfo = ing.allergens && ing.allergens.length > 0 ? ` (${ing.allergens.join(', ')})` : '';
          doc.text(`• ${ing.amount} ${ing.unit} ${ing.name}${allergenInfo}`);
        }
        doc.moveDown();
        
        doc.fontSize(14).font('Helvetica-Bold').text('Zubereitung:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        recipe.steps.forEach((step, idx) => {
          doc.text(`${idx + 1}. ${step}`);
          doc.moveDown(0.5);
        });
        
        doc.end();
      } else if (format === 'docx') {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, NumberFormat } = await import('docx');
        
        const children: any[] = [
          new Paragraph({
            text: recipe.name,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Kategorie: ${recipe.category} | Portionen: ${recipe.portions} | Zeit: ${recipe.prepTime} Min.` }),
            ],
          }),
          new Paragraph({ text: '' }),
        ];
        
        if (recipe.allergens && recipe.allergens.length > 0) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: 'Allergene: ', bold: true }),
              new TextRun({ text: recipe.allergens.join(', ') }),
            ],
          }));
        }
        
        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Zutaten:', heading: HeadingLevel.HEADING_2 })
        );
        
        for (const ing of ingredients) {
          const allergenInfo = ing.allergens && ing.allergens.length > 0 ? ` (${ing.allergens.join(', ')})` : '';
          children.push(new Paragraph({ text: `• ${ing.amount} ${ing.unit} ${ing.name}${allergenInfo}` }));
        }
        
        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Zubereitung:', heading: HeadingLevel.HEADING_2 })
        );
        
        recipe.steps.forEach((step, idx) => {
          children.push(new Paragraph({ text: `${idx + 1}. ${step}` }));
        });
        
        const doc = new Document({
          sections: [{ children }],
        });
        
        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.docx"`);
        res.send(buffer);
      } else {
        res.status(400).json({ error: "Nicht unterstütztes Format. Verwenden Sie 'pdf' oder 'docx'" });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === GUEST COUNTS ===
  app.get("/api/guests", requireAuth, async (req, res) => {
    const { start, end, locationId } = req.query;
    const startDate = (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const locId = locationId ? parseInt(locationId as string, 10) : undefined;
    const counts = await storage.getGuestCounts(startDate, endDate, locId);
    res.json(counts);
  });

  app.post("/api/guests", requireAuth, async (req, res) => {
    try {
      const parsed = insertGuestCountSchema.parse(req.body);
      const existing = await storage.getGuestCountByDateMeal(parsed.date, parsed.meal);
      if (existing) {
        const updated = await storage.updateGuestCount(existing.id, parsed);
        return res.json(updated);
      }
      const created = await storage.createGuestCount(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/guests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateGuestCountSchema.parse(req.body);
      const updated = await storage.updateGuestCount(id, parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guests/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteGuestCount(id);
    res.status(204).send();
  });

  // === CATERING EVENTS ===
  app.get("/api/catering", requireAuth, async (req, res) => {
    const { locationId } = req.query;
    const locId = locationId ? parseInt(locationId as string, 10) : undefined;
    const events = await storage.getCateringEvents();
    const filtered = locId ? events.filter(e => e.locationId === locId) : events;
    res.json(filtered);
  });

  app.get("/api/catering/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    const event = await storage.getCateringEvent(id);
    if (!event) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(event);
  });

  app.post("/api/catering", requireAuth, async (req, res) => {
    try {
      const parsed = insertCateringEventSchema.parse(req.body);
      const created = await storage.createCateringEvent(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/catering/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateCateringEventSchema.parse(req.body);
      const updated = await storage.updateCateringEvent(id, parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/catering/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteCateringEvent(id);
    res.status(204).send();
  });

  // === STAFF ===
  app.get("/api/staff", requireAuth, async (req, res) => {
    const { locationId } = req.query;
    const locId = locationId ? parseInt(locationId as string, 10) : undefined;
    const members = await storage.getStaff();
    const filtered = locId ? members.filter(s => s.locationId === locId) : members;
    res.json(filtered);
  });

  app.get("/api/staff/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    const member = await storage.getStaffMember(id);
    if (!member) return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    res.json(member);
  });

  app.post("/api/staff", requireAuth, async (req, res) => {
    try {
      const parsed = insertStaffSchema.parse(req.body);
      const created = await storage.createStaff(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/staff/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateStaffSchema.parse(req.body);
      const updated = await storage.updateStaff(id, parsed);
      if (!updated) return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/staff/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteStaff(id);
    res.status(204).send();
  });

  // === SHIFT TYPES (Dienste) ===
  app.get("/api/shift-types", requireAuth, async (req, res) => {
    const shiftTypes = await storage.getShiftTypes();
    res.json(shiftTypes);
  });

  app.post("/api/shift-types", requireAuth, async (req, res) => {
    try {
      const parsed = insertShiftTypeSchema.parse(req.body);
      const created = await storage.createShiftType(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/shift-types/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateShiftTypeSchema.parse(req.body);
      const updated = await storage.updateShiftType(id, parsed);
      if (!updated) return res.status(404).json({ error: "Diensttyp nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/shift-types/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteShiftType(id);
    res.status(204).send();
  });

  // === SCHEDULE ===
  // R2-T9: Added mine=1 filter for "Meine Schichten"
  app.get("/api/schedule", requireAuth, async (req, res) => {
    const { start, end, mine } = req.query;
    const startDate = (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (end as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let entries = await storage.getScheduleEntries(startDate, endDate);

    // Filter to only show user's own shifts
    if (mine === "1") {
      const user = (req as any).user;
      if (user) {
        // Find staff member linked to this user
        const allStaff = await storage.getStaff();
        const myStaff = allStaff.find((s: any) => s.userId === user.id);
        if (myStaff) {
          entries = entries.filter(e => e.staffId === myStaff.id);
        } else {
          // No staff linked to user, return empty
          entries = [];
        }
      }
    }

    res.json(entries);
  });

  app.post("/api/schedule", requireAuth, async (req, res) => {
    try {
      const parsed = insertScheduleEntrySchema.parse(req.body);
      const created = await storage.createScheduleEntry(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateScheduleEntrySchema.parse(req.body);
      const updated = await storage.updateScheduleEntry(id, parsed);
      if (!updated) return res.status(404).json({ error: "Schichteintrag nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/schedule/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteScheduleEntry(id);
    res.status(204).send();
  });

  // === MENU PLANS ===

  // Week-based menu plan query with auto-generate from rotation
  app.get("/api/menu-plans/week", requireAuth, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string);
      const week = parseInt(req.query.week as string);
      if (!year || !week || week < 1 || week > 53) {
        return res.status(400).json({ error: "year und week (1-53) erforderlich" });
      }
      const result = await getOrGenerateWeekPlan(year, week);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/menu-plans", requireAuth, async (req, res) => {
    const { start, end, date, withRecipes } = req.query;
    // Support single date or date range
    const startDate = (date as string) || (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (date as string) || (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plans = await storage.getMenuPlans(startDate, endDate);

    // Optionally include recipe data
    if (withRecipes === '1' || withRecipes === 'true') {
      const recipes = await storage.getRecipes();
      const recipeMap = new Map(recipes.map(r => [r.id, r]));
      const plansWithRecipes = plans.map(plan => ({
        ...plan,
        recipe: plan.recipeId ? recipeMap.get(plan.recipeId) : null,
      }));
      return res.json(plansWithRecipes);
    }

    res.json(plans);
  });

  app.post("/api/menu-plans", requireAuth, async (req, res) => {
    try {
      const parsed = insertMenuPlanSchema.parse(req.body);
      const created = await storage.createMenuPlan(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/menu-plans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateMenuPlanSchema.parse(req.body);
      const updated = await storage.updateMenuPlan(id, parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/menu-plans/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteMenuPlan(id);
    res.status(204).send();
  });

  // === HACCP REPORT PDF EXPORT ===
  app.get("/api/haccp-logs/export", requireAuth, async (req, res) => {
    try {
      const { start, end } = req.query;
      const logs = await storage.getHaccpLogs();
      const fridges = await storage.getFridges();
      
      // Filter by date range if provided
      let filteredLogs = logs;
      if (start && end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        endDate.setHours(23, 59, 59);
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
      }
      
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="HACCP_Bericht_${new Date().toISOString().split('T')[0]}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('HACCP Temperaturbericht', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, { align: 'center' });
      doc.moveDown(2);
      
      // Group by fridge
      const fridgeMap = new Map<number, typeof filteredLogs>();
      for (const log of filteredLogs) {
        if (!fridgeMap.has(log.fridgeId)) fridgeMap.set(log.fridgeId, []);
        fridgeMap.get(log.fridgeId)!.push(log);
      }
      
      for (const [fridgeId, fridgeLogs] of Array.from(fridgeMap.entries())) {
        const fridge = fridges.find(f => f.id === fridgeId);
        if (!fridge) continue;
        
        doc.fontSize(14).font('Helvetica-Bold').text(fridge.name);
        doc.fontSize(10).font('Helvetica').text(`Sollbereich: ${fridge.tempMin}°C bis ${fridge.tempMax}°C`);
        doc.moveDown(0.5);
        
        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Datum/Zeit', 50, doc.y, { width: 120, continued: true });
        doc.text('Temp.', 170, doc.y, { width: 50, continued: true });
        doc.text('Status', 220, doc.y, { width: 60, continued: true });
        doc.text('Benutzer', 280, doc.y);
        doc.moveDown(0.3);
        
        doc.font('Helvetica').fontSize(9);
        for (const log of fridgeLogs.slice(0, 20)) {
          const date = new Date(log.timestamp).toLocaleString('de-DE');
          doc.text(date, 50, doc.y, { width: 120, continued: true });
          doc.text(`${log.temperature}°C`, 170, doc.y, { width: 50, continued: true });
          doc.text(log.status, 220, doc.y, { width: 60, continued: true });
          doc.text(log.user, 280, doc.y);
        }
        
        if (fridgeLogs.length > 20) {
          doc.text(`... und ${fridgeLogs.length - 20} weitere Einträge`);
        }
        
        doc.moveDown(1.5);
      }
      
      if (filteredLogs.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Keine HACCP-Einträge im ausgewählten Zeitraum.', { align: 'center' });
      }
      
      doc.end();
    } catch (error: any) {
      console.error('HACCP export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === MENU PLAN EXPORT (PDF, XLSX, DOCX) ===
  app.get("/api/menu-plans/export", requireAuth, async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const plans = await storage.getMenuPlans(startDate, endDate);
      const recipes = await storage.getRecipes();
      
      const mealNames: Record<string, string> = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen' };
      const courseNames: Record<string, string> = { soup: 'Suppe', main_meat: 'Fleisch', side1: 'Beilage 1', side2: 'Beilage 2', main_veg: 'Vegetarisch', dessert: 'Dessert', main: 'Gericht' };
      
      const dateMap = new Map<string, { meal: string; course: string; recipeName: string; portions: number }[]>();
      for (const plan of plans) {
        if (!dateMap.has(plan.date)) dateMap.set(plan.date, []);
        const recipe = recipes.find(r => r.id === plan.recipeId);
        dateMap.get(plan.date)!.push({
          meal: plan.meal,
          course: (plan as any).course || 'main',
          recipeName: recipe?.name || '-',
          portions: plan.portions
        });
      }
      
      const sortedDates = Array.from(dateMap.keys()).sort();
      
      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Menüplan');
        
        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mahlzeit', key: 'meal', width: 15 },
          { header: 'Gang', key: 'course', width: 15 },
          { header: 'Rezept', key: 'recipe', width: 30 },
          { header: 'Portionen', key: 'portions', width: 12 }
        ];
        
        for (const date of sortedDates) {
          const entries = dateMap.get(date)!;
          for (const entry of entries) {
            sheet.addRow({
              date: new Date(date).toLocaleDateString('de-DE'),
              meal: mealNames[entry.meal] || entry.meal,
              course: courseNames[entry.course] || entry.course,
              recipe: entry.recipeName,
              portions: entry.portions
            });
          }
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }
      
      // Default: PDF - Modern "Let's do lunch" style
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      const orange = '#F37021';
      const darkGray = '#333333';
      const lightGray = '#666666';
      const bgLight = '#FFF8F5';
      const pageWidth = 515;
      const startX = 40;
      
      // Header with orange accent bar
      doc.rect(0, 0, 595, 80).fill(orange);
      doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('MENÜPLAN', startX, 25, { align: 'center' });
      
      // Date range subtitle
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      const dateRange = `${startD.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} - ${endD.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      doc.fontSize(12).font('Helvetica').text(dateRange, startX, 55, { align: 'center' });
      
      doc.fillColor(darkGray);
      let yPos = 100;
      
      // Group by date for the week view
      const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      
      for (const date of sortedDates) {
        const d = new Date(date);
        const entries = dateMap.get(date)!;
        
        // Check for page break
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        
        // Day header card
        doc.rect(startX, yPos, pageWidth, 28).fill(orange);
        doc.fillColor('white').fontSize(14).font('Helvetica-Bold');
        doc.text(`${weekdays[d.getDay()]}, ${d.getDate()}. ${d.toLocaleDateString('de-DE', { month: 'long' })}`, startX + 12, yPos + 7);
        yPos += 35;
        
        // Meals for this day
        const meals = ['lunch', 'dinner'];
        for (const meal of meals) {
          const mealEntries = entries.filter(e => e.meal === meal);
          if (mealEntries.length > 0) {
            // Meal header
            doc.fillColor(orange).fontSize(11).font('Helvetica-Bold');
            const mealIcon = meal === 'lunch' ? '☀️' : '🌙';
            doc.text(`${mealNames[meal].toUpperCase()}`, startX + 8, yPos);
            yPos += 16;
            
            // Course entries
            for (const entry of mealEntries) {
              doc.fillColor(lightGray).fontSize(9).font('Helvetica');
              doc.text(`${courseNames[entry.course] || entry.course}:`, startX + 12, yPos, { continued: true });
              doc.fillColor(darkGray).font('Helvetica-Bold').text(` ${entry.recipeName}`, { continued: true });
              doc.fillColor(lightGray).font('Helvetica').text(` (${entry.portions} Port.)`);
              yPos += 14;
            }
            yPos += 4;
          }
        }
        yPos += 10;
      }
      
      if (sortedDates.length === 0) {
        doc.fillColor(lightGray).fontSize(14).font('Helvetica').text('Keine Einträge im ausgewählten Zeitraum.', startX, yPos + 50, { align: 'center' });
      }
      
      // Footer
      doc.fontSize(8).fillColor(lightGray).text('Mise - before Serve | Menüplan', startX, 780, { align: 'center' });
      
      doc.end();
    } catch (error: any) {
      console.error('Menu plan export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === GUEST COUNTS EXPORT ===
  app.get("/api/guest-counts/export", async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const counts = await storage.getGuestCounts(startDate, endDate);
      const mealNames: Record<string, string> = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen' };
      
      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Gästezahlen');
        
        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mahlzeit', key: 'meal', width: 15 },
          { header: 'Erwachsene', key: 'adults', width: 12 },
          { header: 'Kinder', key: 'children', width: 12 },
          { header: 'Gesamt', key: 'total', width: 12 },
          { header: 'Notizen', key: 'notes', width: 30 }
        ];
        
        for (const count of counts) {
          sheet.addRow({
            date: new Date(count.date).toLocaleDateString('de-DE'),
            meal: mealNames[count.meal] || count.meal,
            adults: count.adults,
            children: count.children,
            total: count.adults + count.children,
            notes: count.notes || ''
          });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Gaestezahlen_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }
      
      // Default: PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Gaestezahlen_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('Gästezahlen', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`${startDate} bis ${endDate}`, { align: 'center' });
      doc.moveDown(2);
      
      const dateMap = new Map<string, typeof counts>();
      for (const count of counts) {
        if (!dateMap.has(count.date)) dateMap.set(count.date, []);
        dateMap.get(count.date)!.push(count);
      }
      
      for (const [date, dayCounts] of Array.from(dateMap.entries()).sort()) {
        const d = new Date(date);
        doc.fontSize(12).font('Helvetica-Bold').text(d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }));
        
        for (const count of dayCounts) {
          doc.fontSize(10).font('Helvetica').text(`  ${mealNames[count.meal]}: ${count.adults} Erw. + ${count.children} Kinder = ${count.adults + count.children} Gesamt`);
        }
        doc.moveDown(0.5);
      }
      
      if (counts.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Keine Einträge im ausgewählten Zeitraum.', { align: 'center' });
      }
      
      doc.end();
    } catch (error: any) {
      console.error('Guest counts export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === SCHEDULE EXPORT ===
  app.get("/api/schedule/export", requireAuth, async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const entries = await storage.getScheduleEntries(startDate, endDate);
      const staffList = await storage.getStaff();
      
      const typeNames: Record<string, string> = { shift: 'Schicht', vacation: 'Urlaub', sick: 'Krank', off: 'Frei' };
      const shiftNames: Record<string, string> = { early: 'Früh', late: 'Spät', night: 'Nacht' };
      
      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Dienstplan');
        
        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mitarbeiter', key: 'staff', width: 20 },
          { header: 'Typ', key: 'type', width: 12 },
          { header: 'Schicht', key: 'shift', width: 12 },
          { header: 'Notizen', key: 'notes', width: 30 }
        ];
        
        for (const entry of entries) {
          const staffMember = staffList.find(s => s.id === entry.staffId);
          sheet.addRow({
            date: new Date(entry.date).toLocaleDateString('de-DE'),
            staff: staffMember?.name || 'Unbekannt',
            type: typeNames[entry.type] || entry.type,
            shift: entry.shift ? shiftNames[entry.shift] || entry.shift : '-',
            notes: entry.notes || ''
          });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Dienstplan_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }
      
      // Default: PDF - Landscape table format like traditional Dienstplan
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Dienstplan_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      const shiftTypes = await storage.getShiftTypes();
      
      const orange = '#F37021';
      const yellow = '#FFD700';
      const darkGray = '#333333';
      const lightGray = '#E5E5E5';
      const pageWidth = 780;
      const startX = 30;
      const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      
      // Generate all dates in range
      const allDates: Date[] = [];
      const current = new Date(startDate);
      const endD = new Date(endDate);
      while (current <= endD) {
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      // Header
      doc.rect(0, 0, 842, 50).fill(orange);
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('DIENSTPLAN', startX, 15, { align: 'center' });
      
      const startDStr = new Date(startDate);
      const endDStr = new Date(endDate);
      const dateRange = `${startDStr.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} - ${endDStr.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      doc.fontSize(10).text(dateRange, startX, 38, { align: 'center' });
      
      // Table setup
      const nameColWidth = 100;
      const dayColWidth = Math.min(90, (pageWidth - nameColWidth) / allDates.length);
      const rowHeight = 22;
      let yPos = 65;
      
      // Table header row - Days
      doc.fillColor(darkGray);
      doc.rect(startX, yPos, nameColWidth, rowHeight).fill('#F0F0F0').stroke();
      doc.fillColor(darkGray).fontSize(9).font('Helvetica-Bold').text('Mitarbeiter', startX + 5, yPos + 6);
      
      for (let i = 0; i < allDates.length; i++) {
        const d = allDates[i];
        const x = startX + nameColWidth + (i * dayColWidth);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        doc.rect(x, yPos, dayColWidth, rowHeight).fill(isWeekend ? yellow : '#F0F0F0').stroke();
        doc.fillColor(darkGray).fontSize(8).font('Helvetica-Bold');
        doc.text(`${weekdays[d.getDay()]}`, x + 2, yPos + 4, { width: dayColWidth - 4, align: 'center' });
        doc.fontSize(7).font('Helvetica').text(`${d.getDate()}.${d.getMonth() + 1}`, x + 2, yPos + 13, { width: dayColWidth - 4, align: 'center' });
      }
      yPos += rowHeight;
      
      // Staff rows
      for (const staff of staffList) {
        // Name cell
        doc.rect(startX, yPos, nameColWidth, rowHeight).fill('#FAFAFA').stroke();
        doc.fillColor(darkGray).fontSize(8).font('Helvetica-Bold').text(staff.name.split(' ')[0], startX + 5, yPos + 7);
        
        // Day cells
        for (let i = 0; i < allDates.length; i++) {
          const d = allDates[i];
          const dateStr = d.toISOString().split('T')[0];
          const x = startX + nameColWidth + (i * dayColWidth);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          
          const entry = entries.find(e => e.staffId === staff.id && e.date === dateStr);
          
          let cellBg = isWeekend ? '#FFFACD' : 'white';
          let cellText = '';
          
          if (entry) {
            if (entry.type === 'vacation') {
              cellBg = '#90EE90';
              cellText = 'U';
            } else if (entry.type === 'sick') {
              cellBg = '#FFB6C1';
              cellText = 'K';
            } else if (entry.type === 'off') {
              cellText = 'X';
            } else if (entry.type === 'wor') {
              cellText = 'WOR';
            } else if (entry.type === 'shift' && entry.shiftTypeId) {
              const st = shiftTypes.find(s => s.id === entry.shiftTypeId);
              if (st) {
                cellText = `${st.startTime.substring(0, 5)}`;
              }
            }
          }
          
          doc.rect(x, yPos, dayColWidth, rowHeight).fill(cellBg).stroke();
          if (cellText) {
            doc.fillColor(darkGray).fontSize(7).font('Helvetica').text(cellText, x + 2, yPos + 7, { width: dayColWidth - 4, align: 'center' });
          }
        }
        yPos += rowHeight;
        
        // Page break check
        if (yPos > 520) {
          doc.addPage();
          yPos = 40;
        }
      }
      
      // Legend
      yPos += 15;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkGray).text('Legende:', startX, yPos);
      yPos += 12;
      doc.fontSize(7).font('Helvetica');
      const legendItems = [
        { text: 'U = Urlaub', color: '#90EE90' },
        { text: 'K = Krank', color: '#FFB6C1' },
        { text: 'X = Frei', color: 'white' },
        { text: 'WOR = Freier Tag', color: 'white' },
      ];
      let legendX = startX;
      for (const item of legendItems) {
        doc.rect(legendX, yPos, 10, 10).fill(item.color).stroke();
        doc.fillColor(darkGray).text(item.text, legendX + 14, yPos + 1);
        legendX += 70;
      }
      
      // Shift types legend
      yPos += 15;
      doc.text('Dienste: ', startX, yPos, { continued: true });
      for (const st of shiftTypes) {
        doc.text(`${st.name} (${st.startTime.substring(0,5)}-${st.endTime.substring(0,5)})  `, { continued: true });
      }
      
      // Footer
      doc.fontSize(7).fillColor('#999').text('Mise - before Serve | Dienstplan', startX, 550, { align: 'center' });
      
      doc.end();
    } catch (error: any) {
      console.error('Schedule export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === TASKS ("Heute" Modul) ===

  // Get tasks by date (default: today)
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const taskList = await storage.getTasksByDate(date);
      res.json(taskList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create task
  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const parsed = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(parsed);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update task status
  app.patch("/api/tasks/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = updateTaskStatusSchema.parse(req.body);
      const updated = await storage.updateTask(parseInt(getParam(req.params.id), 10), { status });
      if (!updated) {
        return res.status(404).json({ error: "Task nicht gefunden" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTask(parseInt(getParam(req.params.id), 10));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === R2-T12: TASK TEMPLATES (Admin only) ===
  app.get("/api/task-templates", requireAuth, async (_req, res) => {
    const templates = await storage.getTaskTemplates();
    res.json(templates);
  });

  app.get("/api/task-templates/:id", requireAuth, async (req, res) => {
    const template = await storage.getTaskTemplate(parseInt(getParam(req.params.id), 10));
    if (!template) {
      return res.status(404).json({ error: "Vorlage nicht gefunden" });
    }
    res.json(template);
  });

  app.post("/api/task-templates", requireAdmin, async (req, res) => {
    try {
      const { name, items } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name ist erforderlich" });
      }
      const template = await storage.createTaskTemplate({
        name,
        items: JSON.stringify(items || [])
      });
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/task-templates/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = updateTaskTemplateSchema.parse(req.body);
      const update: any = {};
      if (parsed.name) update.name = parsed.name;
      if (parsed.items) update.items = JSON.stringify(parsed.items);
      const template = await storage.updateTaskTemplate(parseInt(getParam(req.params.id), 10), update);
      if (!template) {
        return res.status(404).json({ error: "Vorlage nicht gefunden" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/task-templates/:id", requireAdmin, async (req, res) => {
    await storage.deleteTaskTemplate(parseInt(getParam(req.params.id), 10));
    res.status(204).send();
  });

  // R2-T13: Create tasks from template
  app.post("/api/task-templates/:id/apply", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(getParam(req.params.id), 10);
      const { date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const template = await storage.getTaskTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Vorlage nicht gefunden" });
      }

      const items = JSON.parse(template.items || "[]");
      const created: any[] = [];

      for (const item of items) {
        const task = await storage.createTask({
          date: targetDate,
          title: item.title,
          note: item.note || null,
          priority: item.priority || 0,
          status: "open"
        });
        created.push(task);
      }

      res.status(201).json({
        message: `${created.length} Tasks aus "${template.name}" erstellt`,
        tasks: created
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========================
  // NEW ROUTES: Locations, Rotation, Felix OCR, Airtable, Production, Shopping, Costs, Health
  // ========================

  // --- Health ---
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Locations ---
  app.get("/api/locations", requireAuth, async (_req: Request, res: Response) => {
    const locs = await storage.getLocations();
    res.json(locs);
  });

  app.post("/api/locations", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const loc = await storage.createLocation(data);
      res.status(201).json(loc);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Rotation Templates ---
  app.get("/api/rotation-templates", requireAuth, async (_req: Request, res: Response) => {
    const templates = await storage.getRotationTemplates();
    res.json(templates);
  });

  app.post("/api/rotation-templates/ensure-default", requireAuth, async (_req: Request, res: Response) => {
    try {
      const template = await ensureDefaultTemplate();
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rotation-templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const overview = await getRotationOverview(parseInt(String(req.params.id)));
      res.json(overview);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.post("/api/rotation-templates", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const data = insertRotationTemplateSchema.parse(req.body);
      const template = await storage.createRotationTemplate(data);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/rotation-templates/:id", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const parsed = updateRotationTemplateSchema.parse(req.body);
      const updated = await storage.updateRotationTemplate(parseInt(String(req.params.id)), parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Rotation Slots ---
  app.get("/api/rotation-slots/:templateId", requireAuth, async (req: Request, res: Response) => {
    const weekNr = req.query.weekNr ? parseInt(req.query.weekNr as string) : undefined;
    if (weekNr) {
      const slots = await storage.getRotationSlotsByWeek(parseInt(String(req.params.templateId)), weekNr);
      res.json(slots);
    } else {
      const slots = await storage.getRotationSlots(parseInt(String(req.params.templateId)));
      res.json(slots);
    }
  });

  app.post("/api/rotation-slots", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    try {
      if (Array.isArray(req.body)) {
        const slots = req.body.map((s: any) => insertRotationSlotSchema.parse(s));
        const created = await storage.createRotationSlots(slots);
        res.status(201).json(created);
      } else {
        const data = insertRotationSlotSchema.parse(req.body);
        const slot = await storage.createRotationSlot(data);
        res.status(201).json(slot);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/rotation-slots/:id", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    try {
      const parsed = updateRotationSlotSchema.parse(req.body);
      const updated = await storage.updateRotationSlot(parseInt(String(req.params.id)), parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Auto-fill rotation slots ---
  app.post("/api/rotation/auto-fill", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const { templateId, overwrite } = req.body;
      if (!templateId) {
        return res.status(400).json({ error: "templateId erforderlich" });
      }
      const result = await autoFillRotation(templateId, { overwrite: !!overwrite });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Generate menu from rotation ---
  app.post("/api/menu-plans/generate-from-rotation", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const { templateId, weekNr, startDate } = req.body;
      if (!templateId || !weekNr || !startDate) {
        return res.status(400).json({ error: "templateId, weekNr und startDate erforderlich" });
      }
      const result = await generateWeekFromRotation(templateId, weekNr, startDate);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Felix OCR ---
  app.post("/api/ocr/felix", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      let text = '';
      if (req.file) {
        if (req.file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          text = pdfData.text;
        } else {
          // For images, use tesseract.js
          const Tesseract = await import("tesseract.js");
          const worker = await Tesseract.createWorker('deu');
          const { data } = await worker.recognize(req.file.buffer);
          text = data.text;
          await worker.terminate();
        }
      } else if (req.body.text) {
        text = req.body.text;
      } else {
        return res.status(400).json({ error: "Datei oder Text erforderlich" });
      }
      const result = parseFelixText(text);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Airtable ---
  app.get("/api/airtable/status", requireAuth, (_req: Request, res: Response) => {
    res.json(getAirtableStatus());
  });

  app.post("/api/airtable/test", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await testAirtableConnection(req.body.apiKey, req.body.baseId, req.body.tableName);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/airtable/sync", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const result = await syncAirtableEvents();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Master Ingredients ---
  app.get("/api/master-ingredients", requireAuth, async (_req: Request, res: Response) => {
    const ingredients = await storage.getMasterIngredients();
    res.json(ingredients);
  });

  app.post("/api/master-ingredients", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const data = insertMasterIngredientSchema.parse(req.body);
      const mi = await storage.createMasterIngredient(data);
      res.status(201).json(mi);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/master-ingredients/:id", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const parsed = updateMasterIngredientSchema.parse(req.body);
      const updated = await storage.updateMasterIngredient(parseInt(String(req.params.id)), parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/master-ingredients/:id", requireRole("admin"), async (req: Request, res: Response) => {
    await storage.deleteMasterIngredient(parseInt(String(req.params.id)));
    res.status(204).end();
  });

  // --- Production List ---
  app.get("/api/production-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate und endDate erforderlich" });
      }
      const result = await getProductionList(startDate, endDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Shopping List ---
  app.get("/api/shopping-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate und endDate erforderlich" });
      }
      const result = await getShoppingList(startDate, endDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Costs ---
  app.get("/api/costs", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const recipeId = req.query.recipeId ? parseInt(req.query.recipeId as string) : undefined;
      if (recipeId) {
        const result = await getDishCost(recipeId);
        return res.json(result);
      }
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate und endDate (oder recipeId) erforderlich" });
      }
      const result = await getWeeklyCostReport(startDate, endDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Catering Menu Items ---
  app.get("/api/catering-events/:eventId/menu-items", requireAuth, async (req: Request, res: Response) => {
    const items = await storage.getCateringMenuItems(parseInt(String(req.params.eventId)));
    res.json(items);
  });

  app.post("/api/catering-events/:eventId/menu-items", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertCateringMenuItemSchema.parse({ ...req.body, eventId: parseInt(String(req.params.eventId)) });
      const item = await storage.createCateringMenuItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/catering-menu-items/:id", requireAuth, async (req: Request, res: Response) => {
    await storage.deleteCateringMenuItem(parseInt(String(req.params.id)));
    res.status(204).end();
  });

  // --- Menu Plan Temperatures ---
  app.get("/api/menu-plans/:planId/temperatures", requireAuth, async (req: Request, res: Response) => {
    const temps = await storage.getMenuPlanTemperatures(parseInt(String(req.params.planId)));
    res.json(temps);
  });

  app.post("/api/menu-plans/:planId/temperatures", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertMenuPlanTemperatureSchema.parse({ ...req.body, menuPlanId: parseInt(String(req.params.planId)) });
      const temp = await storage.createMenuPlanTemperature(data);
      res.status(201).json(temp);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==========================================
  // Phase 2: Suppliers CRUD
  // ==========================================
  app.get("/api/suppliers", requireAuth, async (_req: Request, res: Response) => {
    const list = await storage.getSuppliers();
    res.json(list);
  });

  app.get("/api/suppliers/:id", requireAuth, async (req: Request, res: Response) => {
    const s = await storage.getSupplier(parseInt(getParam(req.params.id)));
    if (!s) return res.status(404).json({ error: "Lieferant nicht gefunden" });
    res.json(s);
  });

  app.post("/api/suppliers", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const created = await storage.createSupplier(data);
      audit(req, "create", "suppliers", String(created.id), null, created);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/suppliers/:id", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(getParam(req.params.id));
      const before = await storage.getSupplier(id);
      const data = updateSupplierSchema.parse(req.body);
      const updated = await storage.updateSupplier(id, data);
      if (!updated) return res.status(404).json({ error: "Lieferant nicht gefunden" });
      audit(req, "update", "suppliers", String(id), before, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/suppliers/:id", requireRole("admin"), async (req: Request, res: Response) => {
    const id = parseInt(getParam(req.params.id));
    const before = await storage.getSupplier(id);
    await storage.deleteSupplier(id);
    audit(req, "delete", "suppliers", String(id), before, null);
    res.status(204).end();
  });

  // ==========================================
  // Phase 2: Sub-Recipe Links
  // ==========================================
  app.get("/api/recipes/:id/sub-recipes", requireAuth, async (req: Request, res: Response) => {
    const recipeId = parseInt(getParam(req.params.id));
    const links = await storage.getSubRecipeLinks(recipeId);
    // Enrich with recipe names
    const enriched = await Promise.all(links.map(async (link) => {
      const child = await storage.getRecipe(link.childRecipeId);
      return { ...link, childRecipeName: child?.name || `#${link.childRecipeId}` };
    }));
    res.json(enriched);
  });

  app.post("/api/recipes/:id/sub-recipes", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(getParam(req.params.id));
      const { childRecipeId, portionMultiplier } = insertSubRecipeLinkSchema.parse({
        ...req.body,
        parentRecipeId: parentId,
      });
      // Cycle detection
      if (await wouldCreateCycle(parentId, childRecipeId)) {
        return res.status(400).json({ error: "Zirkuläre Referenz erkannt — Sub-Rezept kann nicht hinzugefügt werden." });
      }
      const created = await storage.createSubRecipeLink({ parentRecipeId: parentId, childRecipeId, portionMultiplier: portionMultiplier ?? 1 });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/sub-recipe-links/:id", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    await storage.deleteSubRecipeLink(parseInt(getParam(req.params.id)));
    res.status(204).end();
  });

  app.get("/api/recipes/:id/resolved-ingredients", requireAuth, async (req: Request, res: Response) => {
    const recipeId = parseInt(getParam(req.params.id));
    const resolved = await resolveRecipeIngredients(recipeId);
    res.json(resolved);
  });

  // ==========================================
  // Phase 2: Guest Allergen Profiles
  // ==========================================
  app.get("/api/guest-profiles", requireAuth, async (req: Request, res: Response) => {
    const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
    const profiles = await storage.getGuestAllergenProfiles(locationId);
    res.json(profiles);
  });

  app.get("/api/guest-profiles/:id", requireAuth, async (req: Request, res: Response) => {
    const p = await storage.getGuestAllergenProfile(parseInt(getParam(req.params.id)));
    if (!p) return res.status(404).json({ error: "Profil nicht gefunden" });
    res.json(p);
  });

  app.post("/api/guest-profiles", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    try {
      const data = insertGuestAllergenProfileSchema.parse(req.body);
      const created = await storage.createGuestAllergenProfile(data);
      audit(req, "create", "guest_allergen_profiles", String(created.id), null, created);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/guest-profiles/:id", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(getParam(req.params.id));
      const before = await storage.getGuestAllergenProfile(id);
      const data = updateGuestAllergenProfileSchema.parse(req.body);
      const updated = await storage.updateGuestAllergenProfile(id, data);
      if (!updated) return res.status(404).json({ error: "Profil nicht gefunden" });
      audit(req, "update", "guest_allergen_profiles", String(id), before, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guest-profiles/:id", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    const id = parseInt(getParam(req.params.id));
    const before = await storage.getGuestAllergenProfile(id);
    await storage.deleteGuestAllergenProfile(id);
    audit(req, "delete", "guest_allergen_profiles", String(id), before, null);
    res.status(204).end();
  });

  // ==========================================
  // Phase 2: Allergen Analysis (Batch 2 + 4)
  // ==========================================
  app.get("/api/allergens/daily", requireAuth, async (req: Request, res: Response) => {
    try {
      const date = String(req.query.date || new Date().toISOString().split('T')[0]);
      const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
      const result = await getDailyAllergenMatrix(date, locationId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/allergens/weekly", requireAuth, async (req: Request, res: Response) => {
    try {
      const startDate = String(req.query.startDate);
      const endDate = String(req.query.endDate);
      if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
      const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
      const result = await getWeeklyAllergenMatrix(startDate, endDate, locationId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/buffet-cards", requireAuth, async (req: Request, res: Response) => {
    try {
      const date = String(req.query.date || new Date().toISOString().split('T')[0]);
      const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
      const cards = await getBuffetCardsForDate(date, locationId);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // Phase 2: Analytics (Batch 2)
  // ==========================================
  app.get("/api/analytics/pax-trends", requireAuth, async (req: Request, res: Response) => {
    try {
      const startDate = String(req.query.startDate);
      const endDate = String(req.query.endDate);
      if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
      const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
      const result = await getPaxTrends(startDate, endDate, locationId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/haccp-compliance", requireAuth, async (req: Request, res: Response) => {
    try {
      const startDate = String(req.query.startDate);
      const endDate = String(req.query.endDate);
      if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
      const result = await getHaccpCompliance(startDate, endDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/popular-dishes", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;
      const result = await getPopularDishes(limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/food-cost", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const startDate = String(req.query.startDate);
      const endDate = String(req.query.endDate);
      if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
      const result = await getWeeklyCostReport(startDate, endDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // Phase 2: Public Menu (Batch 5) — NO AUTH
  // ==========================================
  app.get("/api/public/menu/:locationSlug/:date?", async (req: Request, res: Response) => {
    try {
      const locationSlug = getParam(req.params.locationSlug);
      const date = req.params.date ? getParam(req.params.date) : undefined;
      const menu = await getPublicMenu(locationSlug, date);
      if (!menu) return res.status(404).json({ error: "Standort nicht gefunden" });
      res.json(menu);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

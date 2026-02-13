import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { registerUserSchema, loginUserSchema, updateUserSchema, VALID_ROLES } from "@shared/schema";
import { requireAuth, requireAdmin, requireRole, audit, getParam, storage, KITCHEN_POSITIONS, authRateLimiter, registerRateLimiter } from "./middleware";

export function registerAuthRoutes(app: Express) {
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
        role: role && (VALID_ROLES as readonly string[]).includes(role) ? role : "koch",
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
}

import type { Express, Request, Response } from "express";
import { requireAuth, requireRole, requireAdmin, audit, getParam, storage, expensiveRateLimiter } from "./middleware";
import { insertMasterIngredientSchema, updateMasterIngredientSchema, insertSupplierSchema, updateSupplierSchema } from "@shared/schema";
import { getProductionList, getShoppingList, getDishCost, getWeeklyCostReport } from "../modules/menu";

export function registerSupplierRoutes(app: Express) {
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
  app.get("/api/production-list", requireAuth, expensiveRateLimiter, async (req: Request, res: Response) => {
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
  app.get("/api/shopping-list", requireAuth, expensiveRateLimiter, async (req: Request, res: Response) => {
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
  app.get("/api/costs", requireRole("admin", "souschef"), expensiveRateLimiter, async (req: Request, res: Response) => {
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
}

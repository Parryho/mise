import type { Express, Request, Response } from "express";
import { requireAuth, getParam, storage } from "./middleware";
import { insertCateringEventSchema, updateCateringEventSchema, insertCateringMenuItemSchema } from "@shared/schema";

export function registerCateringRoutes(app: Express) {

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
}

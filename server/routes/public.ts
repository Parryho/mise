import type { Express, Request, Response } from "express";
import { requireAuth, getParam, aiRateLimiter } from "./middleware";
import { getDailyAllergenMatrix, getWeeklyAllergenMatrix } from "../allergens";
import { getBuffetCardsForDate } from "../buffet-cards";
import { detectAllergensHandler, suggestAllergensForRecipeHandler } from "../allergen-detection";
import { getPublicMenu } from "../public-menu";
import { formatLocalDate } from "@shared/constants";

export function registerPublicRoutes(app: Express) {
  // ==========================================
  // Phase 2: Allergen Analysis (Batch 2 + 4)
  // ==========================================
  app.get("/api/allergens/daily", requireAuth, async (req: Request, res: Response) => {
    try {
      const date = String(req.query.date || formatLocalDate(new Date()));
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
      const date = String(req.query.date || formatLocalDate(new Date()));
      const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
      const cards = await getBuffetCardsForDate(date, locationId);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Phase 3: AI Allergen Detection
  app.post("/api/allergens/detect", requireAuth, aiRateLimiter, detectAllergensHandler);
  app.post("/api/allergens/suggest-recipe", requireAuth, aiRateLimiter, suggestAllergensForRecipeHandler);

  // ==========================================
  // Phase 2: Public Menu (Batch 5) — NO AUTH
  // ==========================================
  app.get("/api/public/menu/:locationSlug{/:date}", async (req: Request, res: Response) => {
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
}

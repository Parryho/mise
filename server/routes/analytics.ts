import type { Express, Request, Response } from "express";
import { requireAuth, requireRole, expensiveRateLimiter } from "./middleware";
import { getPaxTrends, getHaccpCompliance, getPopularDishes } from "../analytics";
import { getWeeklyCostReport } from "../costs";
import { handlePaxForecast } from "../pax-forecast";
import { handleGetWastePrediction } from "../waste-prediction";

export function registerAnalyticsRoutes(app: Express) {
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

  app.get("/api/analytics/food-cost", requireRole("admin", "souschef"), expensiveRateLimiter, async (req: Request, res: Response) => {
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

  app.get("/api/analytics/pax-forecast", requireAuth, expensiveRateLimiter, handlePaxForecast);
  app.get("/api/analytics/waste-prediction", requireAuth, expensiveRateLimiter, handleGetWastePrediction);
}

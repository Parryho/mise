import type { Express, Request, Response } from "express";
import { requireAuth, requireRole, storage, aiRateLimiter } from "./middleware";
import {
  insertRotationTemplateSchema, updateRotationTemplateSchema,
  insertRotationSlotSchema, updateRotationSlotSchema
} from "@shared/schema";
import { getRotationOverview, ensureDefaultTemplate } from "../rotation";
import { autoFillRotation } from "../rotation-agent";
import { handleOptimizeRotation, handleGetAnalysis } from "../smart-rotation";
import { handleGetWeekCombos, handleSubmitFeedback, handleGetMyRatings, handleGetPairingScores, handleGetDashboardStats, handleGetLearnedRules, handleAIValidate, handleGameFeedback, handleAIResearch, handleGameEntry, handleGetGameEntries } from "../quiz-feedback";

export function registerRotationRoutes(app: Express) {
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

  // --- Clear rotation slots ---
  app.post("/api/rotation-slots/clear", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const { templateId, scope, weekNr, dayOfWeek } = req.body;
      if (!templateId || !scope) {
        return res.status(400).json({ error: "templateId und scope erforderlich" });
      }
      let cleared = 0;
      if (scope === "all") {
        cleared = await storage.clearRotationSlotsByTemplate(templateId);
      } else if (scope === "week") {
        if (weekNr == null) return res.status(400).json({ error: "weekNr erforderlich für scope=week" });
        cleared = await storage.clearRotationSlotsByWeek(templateId, weekNr);
      } else if (scope === "day") {
        if (weekNr == null || dayOfWeek == null) return res.status(400).json({ error: "weekNr und dayOfWeek erforderlich für scope=day" });
        cleared = await storage.clearRotationSlotsByDay(templateId, weekNr, dayOfWeek);
      } else {
        return res.status(400).json({ error: "scope muss 'all', 'week' oder 'day' sein" });
      }
      res.json({ cleared });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Auto-fill rotation slots ---
  app.post("/api/rotation/auto-fill", requireRole("admin", "souschef"), aiRateLimiter, async (req: Request, res: Response) => {
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

  // --- Optimize + Analysis (delegate to handlers) ---
  app.post("/api/rotation/optimize", requireRole("admin", "souschef"), aiRateLimiter, handleOptimizeRotation);
  app.get("/api/rotation/:templateId/analysis", requireAuth, handleGetAnalysis);

  // --- Quiz Feedback Routes ---
  app.get("/api/quiz/week-combos/:templateId/:weekNr", requireAuth, handleGetWeekCombos);
  app.post("/api/quiz/feedback", requireAuth, handleSubmitFeedback);
  app.get("/api/quiz/my-ratings/:templateId/:weekNr", requireAuth, handleGetMyRatings);
  app.get("/api/quiz/pairing-scores", requireAuth, handleGetPairingScores);
  app.get("/api/quiz/dashboard-stats", requireAuth, handleGetDashboardStats);
  app.get("/api/quiz/learned-rules", requireAuth, handleGetLearnedRules);
  app.post("/api/quiz/ai-validate", requireRole("admin"), handleAIValidate);
  app.post("/api/quiz/game-feedback", requireAuth, handleGameFeedback);
  app.post("/api/quiz/ai-research", requireAuth, handleAIResearch);
  app.post("/api/quiz/game-entry", requireAuth, handleGameEntry);
  app.get("/api/quiz/game-entries", requireAuth, handleGetGameEntries);
}

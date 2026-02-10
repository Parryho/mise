import type { Express, Request, Response } from "express";
import { requireRole, getParam, aiRateLimiter } from "./middleware";
import { storage } from "./middleware";
import { runTeamBriefing, registerSSEListener, unregisterSSEListener, type SSEEvent } from "../agent-team";

export function registerAgentTeamRoutes(app: Express) {
  // Start a new briefing run
  app.post("/api/agent-team/run", requireRole("admin", "souschef"), aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { locationSlug, weekStart } = req.body;
      if (!locationSlug || !weekStart) {
        return res.status(400).json({ error: "locationSlug and weekStart required" });
      }

      // Validate weekStart is a Monday
      const d = new Date(weekStart);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid weekStart date" });
      }

      const userId = (req as any).user?.id;

      // Create run record first so we can return runId immediately
      const run = await storage.createTeamRun({
        locationSlug,
        weekStart,
        triggeredBy: userId ?? null,
        status: "running",
        durationMs: null,
        hasAiSummary: false,
        summary: null,
        briefing: null,
      });

      // Run orchestrator in background, passing existing runId
      runTeamBriefing(locationSlug, weekStart, userId, run.id).catch(err => {
        console.error(`Agent team run ${run.id} failed:`, err);
      });

      res.json({ runId: run.id, status: "running" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List past runs (paginated)
  app.get("/api/agent-team/runs", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;
      const runs = await storage.getTeamRuns(limit);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single run with full briefing
  app.get("/api/agent-team/runs/:id", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(getParam(req.params.id));
      if (isNaN(id)) return res.status(400).json({ error: "Invalid run ID" });

      const run = await storage.getTeamRun(id);
      if (!run) return res.status(404).json({ error: "Run not found" });

      const actions = await storage.getTeamActions(id);

      // Parse briefing JSON if available
      let briefing = null;
      if (run.briefing) {
        try { briefing = JSON.parse(run.briefing); } catch {}
      }

      res.json({ ...run, briefing, actions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SSE stream for real-time progress
  app.get("/api/agent-team/stream/:runId", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    const runId = parseInt(getParam(req.params.runId));
    if (isNaN(runId)) return res.status(400).json({ error: "Invalid run ID" });

    // Check if run exists
    const run = await storage.getTeamRun(runId);
    if (!run) return res.status(404).json({ error: "Run not found" });

    // If already completed, send the result immediately
    if (run.status === "completed" || run.status === "failed") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let briefing = null;
      if (run.briefing) {
        try { briefing = JSON.parse(run.briefing); } catch {}
      }

      res.write(`data: ${JSON.stringify({ type: "briefing-complete", briefing: briefing || { status: run.status } })}\n\n`);
      res.end();
      return;
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const emit = (event: SSEEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === "briefing-complete") {
        res.end();
      }
    };

    registerSSEListener(runId, emit);

    req.on("close", () => {
      unregisterSSEListener(runId, emit);
    });
  });
}

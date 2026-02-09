import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, getParam, storage } from "./middleware";
import { insertTaskSchema, updateTaskStatusSchema, updateTaskTemplateSchema } from "@shared/schema";

export function registerTaskRoutes(app: Express) {
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
}

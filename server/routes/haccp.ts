import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, audit, getParam, storage } from "./middleware";
import { insertFridgeSchema, updateFridgeSchema, insertHaccpLogSchema } from "@shared/schema";
import { detectAnomalies, getFridgeHealthScore } from "../haccp-anomaly";
import { formatLocalDate } from "@shared/constants";

export function registerHaccpRoutes(app: Express) {

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

  // === HACCP LOGS PDF EXPORT ===
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
      res.setHeader('Content-Disposition', `attachment; filename="HACCP_Bericht_${formatLocalDate(new Date())}.pdf"`);

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

  // === HACCP ANOMALY DETECTION ===
  app.get("/api/haccp/anomalies", requireAuth, async (req: Request, res: Response) => {
    try {
      const locationId = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const result = await detectAnomalies(locationId, startDate, endDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/haccp/fridge-health", requireAuth, async (req: Request, res: Response) => {
    try {
      const fridgeId = parseInt(String(req.query.fridgeId));
      if (!fridgeId) return res.status(400).json({ error: "fridgeId required" });
      const days = req.query.days ? parseInt(String(req.query.days)) : 30;
      const result = await getFridgeHealthScore(fridgeId, days);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

import type { Express, Request, Response } from "express";
import { requireAuth, requireRole, audit, getParam, storage } from "./middleware";
import { insertGuestCountSchema, updateGuestCountSchema, insertGuestAllergenProfileSchema, updateGuestAllergenProfileSchema } from "@shared/schema";
import { formatLocalDate } from "@shared/constants";

export function registerGuestRoutes(app: Express) {

  // === GUEST COUNTS ===
  app.get("/api/guests", requireAuth, async (req, res) => {
    const { start, end, locationId } = req.query;
    const startDate = (start as string) || formatLocalDate(new Date());
    const endDate = (end as string) || formatLocalDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
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

  // === GUEST COUNTS EXPORT ===
  app.get("/api/guest-counts/export", requireAuth, async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || formatLocalDate(new Date());
      const endDate = (end as string) || formatLocalDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

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
}

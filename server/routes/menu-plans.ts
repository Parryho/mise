import type { Express, Request, Response } from "express";
import { requireAuth, requireRole, getParam, storage } from "./middleware";
import { insertMenuPlanSchema, updateMenuPlanSchema, insertMenuPlanTemperatureSchema, menuPlans } from "@shared/schema";
import { generateWeekFromRotation, getOrGenerateWeekPlan } from "../modules/menu";
import { formatLocalDate } from "@shared/constants";
import { db } from "../db";
import { and, eq } from "drizzle-orm";

// Cache location IDs for City/SÜD auto-sync
let cityLocId: number | null = null;
let suedLocId: number | null = null;
async function getLocIds() {
  if (cityLocId !== null) return { cityLocId, suedLocId };
  const locs = await storage.getLocations();
  cityLocId = locs.find(l => l.slug === "city")?.id ?? null;
  suedLocId = locs.find(l => l.slug === "sued")?.id ?? null;
  return { cityLocId, suedLocId };
}

/** If entry is City Lunch, find or create the matching SÜD Lunch entry */
async function syncCityToSued(date: string, meal: string, course: string, recipeId: number | null, portions: number, rotationWeekNr?: number | null) {
  const { cityLocId: cId, suedLocId: sId } = await getLocIds();
  if (!cId || !sId) return;
  // Find existing SÜD entry for same date+meal+course
  const [existing] = await db.select().from(menuPlans).where(
    and(eq(menuPlans.date, date), eq(menuPlans.meal, meal), eq(menuPlans.course, course), eq(menuPlans.locationId, sId))
  );
  if (existing) {
    await db.update(menuPlans).set({ recipeId, portions }).where(eq(menuPlans.id, existing.id));
  } else {
    await db.insert(menuPlans).values({ date, meal, course, recipeId, portions, locationId: sId, rotationWeekNr: rotationWeekNr ?? null });
  }
}

/** If deleting a City Lunch entry, also delete matching SÜD Lunch entry */
async function deleteSuedMirror(date: string, meal: string, course: string) {
  const { suedLocId: sId } = await getLocIds();
  if (!sId) return;
  await db.delete(menuPlans).where(
    and(eq(menuPlans.date, date), eq(menuPlans.meal, meal), eq(menuPlans.course, course), eq(menuPlans.locationId, sId))
  );
}

function isCityLunch(locationId: number | null | undefined, meal: string): boolean {
  return meal === "lunch" && locationId === cityLocId;
}

export function registerMenuPlanRoutes(app: Express) {

  // === MENU PLANS ===

  // Week-based menu plan query with auto-generate from rotation
  // ?force=true to delete+regenerate from current rotation state
  app.get("/api/menu-plans/week", requireAuth, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string);
      const week = parseInt(req.query.week as string);
      const force = req.query.force === "true" || req.query.force === "1";
      if (!year || !week || week < 1 || week > 53) {
        return res.status(400).json({ error: "year und week (1-53) erforderlich" });
      }
      const result = await getOrGenerateWeekPlan(year, week, force);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/menu-plans", requireAuth, async (req, res) => {
    const { start, end, date, withRecipes } = req.query;
    // Support single date or date range
    const startDate = (date as string) || (start as string) || formatLocalDate(new Date());
    const endDate = (date as string) || (end as string) || formatLocalDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const plans = await storage.getMenuPlans(startDate, endDate);

    // Optionally include recipe data
    if (withRecipes === '1' || withRecipes === 'true') {
      const recipes = await storage.getRecipes();
      const recipeMap = new Map(recipes.map(r => [r.id, r]));
      const plansWithRecipes = plans.map(plan => ({
        ...plan,
        recipe: plan.recipeId ? recipeMap.get(plan.recipeId) : null,
      }));
      return res.json(plansWithRecipes);
    }

    res.json(plans);
  });

  app.post("/api/menu-plans", requireAuth, async (req, res) => {
    try {
      const parsed = insertMenuPlanSchema.parse(req.body);
      const created = await storage.createMenuPlan(parsed);
      // Auto-sync City Lunch → SÜD Lunch
      await getLocIds();
      if (isCityLunch(parsed.locationId, parsed.meal)) {
        await syncCityToSued(parsed.date, parsed.meal, parsed.course ?? "main", parsed.recipeId ?? null, parsed.portions ?? 1, parsed.rotationWeekNr);
      }
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/menu-plans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateMenuPlanSchema.parse(req.body);
      const updated = await storage.updateMenuPlan(id, parsed);
      if (!updated) return res.status(404).json({ error: "Nicht gefunden" });
      // Auto-sync City Lunch → SÜD Lunch
      await getLocIds();
      if (isCityLunch(updated.locationId, updated.meal)) {
        await syncCityToSued(updated.date, updated.meal, updated.course, updated.recipeId, updated.portions, updated.rotationWeekNr);
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/menu-plans/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    // Check if this is a City Lunch entry before deleting
    await getLocIds();
    const plan = await storage.getMenuPlan(id);
    await storage.deleteMenuPlan(id);
    // Auto-delete matching SÜD Lunch entry
    if (plan && isCityLunch(plan.locationId, plan.meal)) {
      await deleteSuedMirror(plan.date, plan.meal, plan.course);
    }
    res.status(204).send();
  });

  // === MENU PLAN EXPORT (PDF, XLSX, DOCX) ===
  app.get("/api/menu-plans/export", requireAuth, async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || formatLocalDate(new Date());
      const endDate = (end as string) || formatLocalDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      const plans = await storage.getMenuPlans(startDate, endDate);
      const recipes = await storage.getRecipes();

      const mealNames: Record<string, string> = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen' };
      const courseNames: Record<string, string> = { soup: 'Suppe', main_meat: 'Fleisch', side1: 'Beilage 1', side2: 'Beilage 2', main_veg: 'Vegetarisch', dessert: 'Dessert', main: 'Gericht' };

      const dateMap = new Map<string, { meal: string; course: string; recipeName: string; portions: number }[]>();
      for (const plan of plans) {
        if (!dateMap.has(plan.date)) dateMap.set(plan.date, []);
        const recipe = recipes.find(r => r.id === plan.recipeId);
        dateMap.get(plan.date)!.push({
          meal: plan.meal,
          course: (plan as any).course || 'main',
          recipeName: recipe?.name || '-',
          portions: plan.portions
        });
      }

      const sortedDates = Array.from(dateMap.keys()).sort();

      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Menüplan');

        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mahlzeit', key: 'meal', width: 15 },
          { header: 'Gang', key: 'course', width: 15 },
          { header: 'Rezept', key: 'recipe', width: 30 },
          { header: 'Portionen', key: 'portions', width: 12 }
        ];

        for (const date of sortedDates) {
          const entries = dateMap.get(date)!;
          for (const entry of entries) {
            sheet.addRow({
              date: new Date(date).toLocaleDateString('de-DE'),
              meal: mealNames[entry.meal] || entry.meal,
              course: courseNames[entry.course] || entry.course,
              recipe: entry.recipeName,
              portions: entry.portions
            });
          }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }

      // Default: PDF - Modern "Let's do lunch" style
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.pdf"`);

      doc.pipe(res);

      const orange = '#F37021';
      const darkGray = '#333333';
      const lightGray = '#666666';
      const bgLight = '#FFF8F5';
      const pageWidth = 515;
      const startX = 40;

      // Header with orange accent bar
      doc.rect(0, 0, 595, 80).fill(orange);
      doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('MENÜPLAN', startX, 25, { align: 'center' });

      // Date range subtitle
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      const dateRange = `${startD.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} - ${endD.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      doc.fontSize(12).font('Helvetica').text(dateRange, startX, 55, { align: 'center' });

      doc.fillColor(darkGray);
      let yPos = 100;

      // Group by date for the week view
      const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

      for (const date of sortedDates) {
        const d = new Date(date);
        const entries = dateMap.get(date)!;

        // Check for page break
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        // Day header card
        doc.rect(startX, yPos, pageWidth, 28).fill(orange);
        doc.fillColor('white').fontSize(14).font('Helvetica-Bold');
        doc.text(`${weekdays[d.getDay()]}, ${d.getDate()}. ${d.toLocaleDateString('de-DE', { month: 'long' })}`, startX + 12, yPos + 7);
        yPos += 35;

        // Meals for this day
        const meals = ['lunch', 'dinner'];
        for (const meal of meals) {
          const mealEntries = entries.filter(e => e.meal === meal);
          if (mealEntries.length > 0) {
            // Meal header
            doc.fillColor(orange).fontSize(11).font('Helvetica-Bold');
            const mealIcon = meal === 'lunch' ? '☀️' : '🌙';
            doc.text(`${mealNames[meal].toUpperCase()}`, startX + 8, yPos);
            yPos += 16;

            // Course entries
            for (const entry of mealEntries) {
              doc.fillColor(lightGray).fontSize(9).font('Helvetica');
              doc.text(`${courseNames[entry.course] || entry.course}:`, startX + 12, yPos, { continued: true });
              doc.fillColor(darkGray).font('Helvetica-Bold').text(` ${entry.recipeName}`, { continued: true });
              doc.fillColor(lightGray).font('Helvetica').text(` (${entry.portions} Port.)`);
              yPos += 14;
            }
            yPos += 4;
          }
        }
        yPos += 10;
      }

      if (sortedDates.length === 0) {
        doc.fillColor(lightGray).fontSize(14).font('Helvetica').text('Keine Einträge im ausgewählten Zeitraum.', startX, yPos + 50, { align: 'center' });
      }

      // Footer
      doc.fontSize(8).fillColor(lightGray).text('Mise - before Serve | Menüplan', startX, 780, { align: 'center' });

      doc.end();
    } catch (error: any) {
      console.error('Menu plan export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Generate menu from rotation ---
  app.post("/api/menu-plans/generate-from-rotation", requireRole("admin", "souschef"), async (req: Request, res: Response) => {
    try {
      const { templateId, weekNr, startDate } = req.body;
      if (!templateId || !weekNr || !startDate) {
        return res.status(400).json({ error: "templateId, weekNr und startDate erforderlich" });
      }
      const result = await generateWeekFromRotation(templateId, weekNr, startDate);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Menu Plan Temperatures ---
  app.get("/api/menu-plans/:planId/temperatures", requireAuth, async (req: Request, res: Response) => {
    const temps = await storage.getMenuPlanTemperatures(parseInt(String(req.params.planId)));
    res.json(temps);
  });

  app.post("/api/menu-plans/:planId/temperatures", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertMenuPlanTemperatureSchema.parse({ ...req.body, menuPlanId: parseInt(String(req.params.planId)) });
      const temp = await storage.createMenuPlanTemperature(data);
      res.status(201).json(temp);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}

import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, requireRole, audit, getParam, storage, aiRateLimiter } from "./middleware";
import { insertRecipeSchema, updateRecipeSchema, insertIngredientSchema, insertSubRecipeLinkSchema, recipes, ingredients } from "@shared/schema";
import { autoCategorize } from "@shared/categorizer";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { scrapeRecipe, resolveRecipeIngredients, wouldCreateCycle, handleAIRecipeImport, handleGetSuggestions, scaleRecipeHandler, recipeMediaUpload, handleUploadMedia, handleGetMedia, handleUpdateMedia, handleDeleteMedia, detectAllergens, getAllergensFromIngredients, autoTagAllRecipes } from "../modules/recipe";
import { z } from "zod";
import multer from "multer";
import { createRequire } from "module";
const _require = createRequire(typeof __filename !== "undefined" ? __filename : import.meta.url);
const pdfParse = _require("pdf-parse");

export function registerRecipeRoutes(app: Express) {

  // === RECIPES CRUD ===
  app.get("/api/recipes", requireAuth, async (req, res) => {
    const { q, category, searchIngredients } = req.query;
    const filters = {
      q: typeof q === 'string' ? q : undefined,
      category: typeof category === 'string' ? category : undefined,
      searchIngredients: searchIngredients === 'true',
    };
    const recipes = await storage.getRecipes(filters);
    res.json(recipes);
  });

  app.get("/api/recipes/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ error: "Rezept nicht gefunden" });
    }
    const ingredients = await storage.getIngredients(id);
    res.json({ ...recipe, ingredientsList: ingredients });
  });

  app.post("/api/recipes", requireAuth, async (req, res) => {
    try {
      const parsed = insertRecipeSchema.parse(req.body);
      // If allergens provided manually, mark as verified
      if (parsed.allergens && parsed.allergens.length > 0) {
        (parsed as any).allergenStatus = 'verified';
      }
      const recipe = await db.transaction(async (tx) => {
        const [created] = await tx.insert(recipes).values(parsed).returning();
        if (req.body.ingredientsList && Array.isArray(req.body.ingredientsList)) {
          const ings = req.body.ingredientsList.map((ing: any) => ({
            recipeId: created.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            allergens: ing.allergens || [],
          }));
          if (ings.length > 0) await tx.insert(ingredients).values(ings);
        }
        return created;
      });

      res.status(201).json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const parsed = updateRecipeSchema.parse(req.body);
      // Manual save with allergens = verified
      if (parsed.allergens) {
        (parsed as any).allergenStatus = 'verified';
      }
      const before = await storage.getRecipe(id);
      const recipe = await db.transaction(async (tx) => {
        const [updated] = await tx.update(recipes).set({ ...parsed, updatedAt: new Date() }).where(eq(recipes.id, id)).returning();
        if (!updated) return null;
        if (req.body.ingredientsList && Array.isArray(req.body.ingredientsList)) {
          await tx.delete(ingredients).where(eq(ingredients.recipeId, id));
          const ings = req.body.ingredientsList.map((ing: any) => ({
            recipeId: id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            allergens: ing.allergens || [],
          }));
          if (ings.length > 0) await tx.insert(ingredients).values(ings);
        }
        return updated;
      });
      if (!recipe) {
        return res.status(404).json({ error: "Rezept nicht gefunden" });
      }
      audit(req, "update", "recipes", id, { name: before?.name, category: before?.category }, { name: recipe.name, category: recipe.category });

      res.json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
    const id = parseInt(getParam(req.params.id), 10);
    await storage.deleteRecipe(id);
    res.status(204).send();
  });

  // === RECIPE IMPORT FROM URL ===
  app.post("/api/recipes/import", requireAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL ist erforderlich" });
    }

    try {
      const scraped = await scrapeRecipe(url);
      if (!scraped) {
        return res.status(400).json({ error: "Rezept konnte nicht von URL geladen werden" });
      }

      const detectedCategory = autoCategorize(
        scraped.name,
        scraped.ingredients.map(i => i.name),
        scraped.steps
      );

      // Detect allergens from ingredients
      const recipeAllergens = getAllergensFromIngredients(scraped.ingredients);

      const result = await db.transaction(async (tx) => {
        const [recipe] = await tx.insert(recipes).values({
          name: scraped.name,
          category: detectedCategory,
          portions: scraped.portions,
          prepTime: scraped.prepTime,
          image: scraped.image,
          sourceUrl: url,
          steps: scraped.steps,
          allergens: recipeAllergens,
          allergenStatus: scraped.ingredients.length > 0 ? 'auto' : null,
        }).returning();

        if (scraped.ingredients.length > 0) {
          await tx.insert(ingredients).values(
            scraped.ingredients.map(ing => ({
              recipeId: recipe.id,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              allergens: detectAllergens(ing.name),
            }))
          );
        }

        const ings = await tx.select().from(ingredients).where(eq(ingredients.recipeId, recipe.id));
        return { ...recipe, ingredientsList: ings };
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // R2-T6: JSON Bulk Import (Admin only)
  app.post("/api/recipes/import-json", requireAdmin, async (req, res) => {
    try {
      const importData = req.body;

      if (!Array.isArray(importData)) {
        return res.status(400).json({ error: "Body muss ein Array von Rezepten sein" });
      }

      if (importData.length === 0) {
        return res.status(400).json({ error: "Leeres Array" });
      }

      if (importData.length > 100) {
        return res.status(400).json({ error: "Maximal 100 Rezepte pro Import" });
      }

      const validCategories = ["ClearSoups", "CreamSoups", "MainMeat", "MainFish", "MainVegan", "Sides", "ColdSauces", "HotSauces", "Salads", "HotDesserts", "ColdDesserts"];
      const created: any[] = [];
      const errors: { index: number; error: string }[] = [];

      for (let i = 0; i < importData.length; i++) {
        const r = importData[i];

        // Validate required fields
        if (!r.name || typeof r.name !== "string") {
          errors.push({ index: i, error: "name ist erforderlich" });
          continue;
        }
        if (!r.category || !validCategories.includes(r.category)) {
          errors.push({ index: i, error: `category muss einer von: ${validCategories.join(", ")}` });
          continue;
        }

        try {
          const recipe = await db.transaction(async (tx) => {
            const [created] = await tx.insert(recipes).values({
              name: r.name,
              category: r.category,
              portions: r.portions || 1,
              prepTime: r.prepTime || 0,
              image: r.image || null,
              sourceUrl: r.sourceUrl || null,
              steps: Array.isArray(r.steps) ? r.steps : [],
              allergens: Array.isArray(r.allergens) ? r.allergens : [],
              tags: Array.isArray(r.tags) ? r.tags : [],
            }).returning();

            if (Array.isArray(r.ingredients)) {
              const ings = r.ingredients
                .filter((ing: any) => ing.name && typeof ing.amount === "number" && ing.unit)
                .map((ing: any) => ({
                  recipeId: created.id,
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit,
                  allergens: Array.isArray(ing.allergens) ? ing.allergens : [],
                }));
              if (ings.length > 0) await tx.insert(ingredients).values(ings);
            }

            return created;
          });

          created.push({ id: recipe.id, name: recipe.name });
        } catch (err: any) {
          errors.push({ index: i, error: err.message });
        }
      }

      res.status(201).json({
        message: `${created.length} Rezepte importiert`,
        created,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === INGREDIENTS ===
  app.get("/api/recipes/:id/ingredients", requireAuth, async (req, res) => {
    const recipeId = parseInt(getParam(req.params.id), 10);
    const ingredients = await storage.getIngredients(recipeId);
    res.json(ingredients);
  });

  // Bulk ingredients for multiple recipes (avoids N+1)
  app.get("/api/ingredients/bulk", requireAuth, async (req, res) => {
    const { recipeIds } = req.query;
    if (!recipeIds) return res.json([]);
    const ids = (recipeIds as string).split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const ingredients = await storage.getIngredientsByRecipeIds(ids);
    res.json(ingredients);
  });

  // === OCR PDF Extraction ===
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/ocr/pdf", requireAuth, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen" });
      }
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "PDF-Extraktion fehlgeschlagen" });
    }
  });

  // === RECIPE EXPORT (PDF + DOCX) ===
  app.get("/api/recipes/:id/export/:format", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getParam(req.params.id), 10);
      const format = getParam(req.params.format);
      const recipe = await storage.getRecipe(id);

      if (!recipe) {
        return res.status(404).json({ error: "Rezept nicht gefunden" });
      }

      const ingredients = await storage.getIngredients(id);

      if (format === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf"`);

        doc.pipe(res);

        doc.fontSize(24).font('Helvetica-Bold').text(recipe.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Kategorie: ${recipe.category} | Portionen: ${recipe.portions} | Zubereitungszeit: ${recipe.prepTime} Min.`);
        doc.moveDown();

        if (recipe.allergens && recipe.allergens.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Allergene: ');
          doc.font('Helvetica').text(recipe.allergens.join(', '));
          doc.moveDown();
        }

        doc.fontSize(14).font('Helvetica-Bold').text('Zutaten:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        for (const ing of ingredients) {
          const allergenInfo = ing.allergens && ing.allergens.length > 0 ? ` (${ing.allergens.join(', ')})` : '';
          doc.text(`• ${ing.amount} ${ing.unit} ${ing.name}${allergenInfo}`);
        }
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Zubereitung:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        recipe.steps.forEach((step, idx) => {
          doc.text(`${idx + 1}. ${step}`);
          doc.moveDown(0.5);
        });

        doc.end();
      } else if (format === 'docx') {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, NumberFormat } = await import('docx');

        const children: any[] = [
          new Paragraph({
            text: recipe.name,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Kategorie: ${recipe.category} | Portionen: ${recipe.portions} | Zeit: ${recipe.prepTime} Min.` }),
            ],
          }),
          new Paragraph({ text: '' }),
        ];

        if (recipe.allergens && recipe.allergens.length > 0) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: 'Allergene: ', bold: true }),
              new TextRun({ text: recipe.allergens.join(', ') }),
            ],
          }));
        }

        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Zutaten:', heading: HeadingLevel.HEADING_2 })
        );

        for (const ing of ingredients) {
          const allergenInfo = ing.allergens && ing.allergens.length > 0 ? ` (${ing.allergens.join(', ')})` : '';
          children.push(new Paragraph({ text: `• ${ing.amount} ${ing.unit} ${ing.name}${allergenInfo}` }));
        }

        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Zubereitung:', heading: HeadingLevel.HEADING_2 })
        );

        recipe.steps.forEach((step, idx) => {
          children.push(new Paragraph({ text: `${idx + 1}. ${step}` }));
        });

        const doc = new Document({
          sections: [{ children }],
        });

        const buffer = await Packer.toBuffer(doc);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.docx"`);
        res.send(buffer);
      } else {
        res.status(400).json({ error: "Nicht unterstütztes Format. Verwenden Sie 'pdf' oder 'docx'" });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === SUB-RECIPES ===
  app.get("/api/recipes/:id/sub-recipes", requireAuth, async (req: Request, res: Response) => {
    const recipeId = parseInt(getParam(req.params.id));
    const links = await storage.getSubRecipeLinks(recipeId);
    // Enrich with recipe names
    const enriched = await Promise.all(links.map(async (link) => {
      const child = await storage.getRecipe(link.childRecipeId);
      return { ...link, childRecipeName: child?.name || `#${link.childRecipeId}` };
    }));
    res.json(enriched);
  });

  app.post("/api/recipes/:id/sub-recipes", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(getParam(req.params.id));
      const { childRecipeId, portionMultiplier } = insertSubRecipeLinkSchema.parse({
        ...req.body,
        parentRecipeId: parentId,
      });
      // Cycle detection
      if (await wouldCreateCycle(parentId, childRecipeId)) {
        return res.status(400).json({ error: "Zirkuläre Referenz erkannt — Sub-Rezept kann nicht hinzugefügt werden." });
      }
      const created = await storage.createSubRecipeLink({ parentRecipeId: parentId, childRecipeId, portionMultiplier: portionMultiplier ?? 1 });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/sub-recipe-links/:id", requireRole("admin", "souschef", "koch"), async (req: Request, res: Response) => {
    await storage.deleteSubRecipeLink(parseInt(getParam(req.params.id)));
    res.status(204).end();
  });

  app.get("/api/recipes/:id/resolved-ingredients", requireAuth, async (req: Request, res: Response) => {
    const recipeId = parseInt(getParam(req.params.id));
    const resolved = await resolveRecipeIngredients(recipeId);
    res.json(resolved);
  });

  // === BULK TAG UPDATE ===
  const bulkTagSchema = z.object({
    updates: z.array(z.object({
      id: z.number().int().positive(),
      cuisineType: z.string().nullable().optional(),
      flavorProfile: z.string().nullable().optional(),
      dishType: z.string().nullable().optional(),
    })).min(1).max(500),
  });

  app.post("/api/recipes/bulk-tags", requireRole("admin", "souschef"), async (req, res) => {
    try {
      const { updates } = bulkTagSchema.parse(req.body);
      let updated = 0;
      await db.transaction(async (tx) => {
        for (const u of updates) {
          const set: Record<string, string | null> = {};
          if (u.cuisineType !== undefined) set.cuisineType = u.cuisineType;
          if (u.flavorProfile !== undefined) set.flavorProfile = u.flavorProfile;
          if (u.dishType !== undefined) set.dishType = u.dishType;
          if (Object.keys(set).length === 0) continue;
          const [row] = await tx.update(recipes).set(set).where(eq(recipes.id, u.id)).returning({ id: recipes.id });
          if (row) updated++;
        }
      });
      res.json({ updated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Ungültige Daten" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // === AUTO-TAG ALL RECIPES ===
  app.post("/api/recipes/auto-tag", requireRole("admin", "souschef"), async (_req, res) => {
    try {
      const stats = await autoTagAllRecipes();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === AI RECIPE IMPORT + SUGGESTIONS ===
  app.post("/api/recipes/ai-import", requireAuth, aiRateLimiter, handleAIRecipeImport);
  app.get("/api/recipes/suggestions", requireAuth, aiRateLimiter, handleGetSuggestions);

  // === INTELLIGENT SCALING ===
  app.post("/api/recipes/scale", requireAuth, scaleRecipeHandler);

  // === RECIPE MEDIA ===
  app.post("/api/recipes/:id/media", requireAuth, recipeMediaUpload.array("files", 10), handleUploadMedia);
  app.get("/api/recipes/:id/media", requireAuth, handleGetMedia);
  app.put("/api/recipes/:id/media/:mediaId", requireAuth, handleUpdateMedia);
  app.delete("/api/recipes/:id/media/:mediaId", requireAuth, handleDeleteMedia);
}

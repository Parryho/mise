import type { Express, Request, Response } from "express";
import { requireAuth, requireRole, audit, getParam, storage } from "./middleware";
import { insertOrderItemSchema, updateOrderItemSchema } from "@shared/schema";
import { z } from "zod";

export function registerOrderRoutes(app: Express) {
  // Get active (open) order list + items
  app.get("/api/orders/active", requireAuth, async (_req: Request, res: Response) => {
    let list = await storage.getActiveOrderList();
    if (!list) {
      // Auto-create a new open list
      const user = ((_req as any).user);
      list = await storage.createOrderList({
        status: "open",
        createdBy: user?.id || null,
        createdByName: user?.name || null,
      });
    }
    const items = await storage.getOrderItems(list.id);
    res.json({ list, items });
  });

  // Get all order lists (optionally filter by status)
  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const lists = await storage.getOrderLists(status);
    res.json(lists);
  });

  // Get specific order list + items
  app.get("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    const id = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(id);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });
    const items = await storage.getOrderItems(id);
    res.json({ list, items });
  });

  // Create new order list
  app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const list = await storage.createOrderList({
      status: "open",
      createdBy: user?.id || null,
      createdByName: user?.name || null,
      notes: req.body.notes || null,
    });
    res.status(201).json(list);
  });

  // Update order list (status change: mark as ordered/archived)
  app.put("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    const id = parseInt(getParam(req.params.id));
    const { status, notes } = req.body;
    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (status === "ordered") update.orderedAt = new Date();

    const updated = await storage.updateOrderList(id, update);
    if (!updated) return res.status(404).json({ error: "Liste nicht gefunden" });
    audit(req, "update", "order_lists", id, null, updated);
    res.json(updated);
  });

  // Add item(s) to order list
  app.post("/api/orders/:id/items", requireAuth, async (req: Request, res: Response) => {
    const listId = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(listId);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });

    const user = (req as any).user;
    const body = req.body;

    // Support single item or array
    const rawItems = Array.isArray(body) ? body : [body];
    const items = rawItems.map((item: any) => ({
      listId,
      name: String(item.name || "").trim(),
      amount: item.amount ? String(item.amount).trim() : null,
      supplierId: item.supplierId || null,
      isChecked: false,
      addedBy: user?.id || null,
      addedByName: user?.name || null,
      sortOrder: item.sortOrder || 0,
    })).filter(item => item.name.length > 0);

    if (items.length === 0) {
      return res.status(400).json({ error: "Mindestens ein Artikel erforderlich" });
    }

    const created = await storage.createOrderItems(items);
    res.status(201).json(created);
  });

  // Update single item (check/uncheck, edit name/amount)
  app.put("/api/orders/items/:itemId", requireAuth, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(getParam(req.params.itemId));
      const data = updateOrderItemSchema.parse(req.body);
      const updated = await storage.updateOrderItem(itemId, data);
      if (!updated) return res.status(404).json({ error: "Artikel nicht gefunden" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete single item
  app.delete("/api/orders/items/:itemId", requireAuth, async (req: Request, res: Response) => {
    const itemId = parseInt(getParam(req.params.itemId));
    await storage.deleteOrderItem(itemId);
    res.status(204).end();
  });

  // === Phase 2: OCR Scan ===
  app.post("/api/orders/:id/scan", requireAuth, async (req: Request, res: Response) => {
    const listId = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(listId);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });

    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Bild (base64) erforderlich" });
    }

    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic();

      // Detect media type from base64 header or default to jpeg
      let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";
      let base64Data = imageBase64;
      if (imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:(image\/\w+);base64,/);
        if (match) {
          mediaType = match[1] as typeof mediaType;
          base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        }
      }

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: `Du siehst ein Foto eines handgeschriebenen Küchen-Bestellzettels.
Extrahiere alle Artikel mit Menge und Name.

Antworte NUR mit validem JSON in diesem Format:
{
  "items": [
    { "name": "Mehl", "amount": "2kg", "confidence": 0.95 },
    { "name": "Butter", "amount": "500g", "confidence": 0.8 }
  ]
}

Regeln:
- Menge und Einheit zusammen als String (z.B. "2kg", "3 Stk", "1 Kiste")
- Wenn Menge unklar, setze amount auf null
- confidence: 0.0-1.0, wie sicher du dir beim Lesen bist
- Österreichische Küchenbegriffe beibehalten
- Leere/unleserliche Einträge weglassen`,
            },
          ],
        }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      // Extract JSON from response (might be wrapped in markdown code block)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(422).json({ error: "Konnte keine Artikel erkennen", raw: text });
      }

      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } catch (error: any) {
      console.error("OCR scan error:", error);
      res.status(500).json({ error: "Scan fehlgeschlagen: " + error.message });
    }
  });

  // === Phase 3: Public read-only endpoint for wall display ===
  app.get("/api/public/order-list", async (_req: Request, res: Response) => {
    const list = await storage.getActiveOrderList();
    if (!list) return res.json({ list: null, items: [] });
    const items = await storage.getOrderItems(list.id);
    res.json({ list, items });
  });
}

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

  // === Phase 2: OCR Scan (Google Gemini Vision, free) ===
  app.post("/api/orders/:id/scan", requireAuth, async (req: Request, res: Response) => {
    const listId = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(listId);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });

    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Bild (base64) erforderlich" });
    }

    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return res.status(400).json({ error: "GOOGLE_AI_API_KEY nicht konfiguriert" });
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(googleKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      // Strip data URI prefix to get raw base64
      let mimeType = "image/jpeg";
      let base64Data = imageBase64;
      if (imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:(image\/\w+);base64,/);
        if (match) {
          mimeType = match[1];
          base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        }
      }

      const prompt = `Du siehst ein Foto eines handgeschriebenen Küchen-Bestellzettels.
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
- Leere/unleserliche Einträge weglassen`;

      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt },
      ]);

      const text = result.response.text();
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

  // === Voice-to-Items (Gemini text parsing) ===
  app.post("/api/orders/:id/voice", requireAuth, async (req: Request, res: Response) => {
    const listId = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(listId);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text erforderlich" });

    // Local fallback parser (no API needed)
    const parseLocal = (input: string) => {
      const parts = input.split(/,|\bund\b|\bdann\b|\baußerdem\b|\bnoch\b/i).map(s => s.trim()).filter(Boolean);
      return {
        items: parts.map(part => {
          const m = part.match(/^(\d+[\.,]?\d*\s*(?:kg|g|l|ml|stk|stück|pkg|kiste|sack|fl|bd|bund|dosen?|glas|eimer|beutel|karton)?)\s+(.+)$/i);
          return {
            name: m ? m[2].trim() : part,
            amount: m ? m[1].trim() : null,
            confidence: 0.6,
          };
        }).filter(i => i.name.length > 1),
      };
    };

    const googleKey = process.env.GOOGLE_AI_API_KEY;

    // Try Gemini first, fall back to local parser
    if (googleKey) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(googleKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `Du bekommst eine gesprochene Bestellung aus einer Großküche (österreichisches Deutsch, evtl. Dialekt).
Extrahiere alle Artikel mit Menge und Name.

Gesprochener Text: "${text}"

Antworte NUR mit validem JSON:
{
  "items": [
    { "name": "Mehl", "amount": "2kg", "confidence": 0.95 },
    { "name": "Butter", "amount": "500g", "confidence": 0.8 }
  ]
}

Regeln:
- NUR Lebensmittel, Zutaten und Küchenprodukte extrahieren
- Zwischengespräche, Smalltalk, Kommentare IGNORIEREN (z.B. "wart mal", "was noch", "ach ja")
- Menge und Einheit zusammen als String (z.B. "2kg", "3 Stk", "1 Kiste")
- Wenn Menge unklar oder nicht genannt, setze amount auf null
- confidence: 0.0-1.0, wie sicher du dir bei der Erkennung bist
- Österreichische Küchenbegriffe beibehalten (Erdäpfel, Paradeiser, Topfen...)
- "und" / "dann noch" / "außerdem" als Trennzeichen interpretieren
- Dialekt in Hochdeutsch-Artikelnamen umwandeln (z.B. "Erdöpfe" → "Erdäpfel")
- DUPLIKATE zusammenfassen (Spracherkennung wiederholt oft Wörter)
- Wenn gar kein Lebensmittel erkennbar, gib leeres items-Array zurück`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.json(JSON.parse(jsonMatch[0]));
        }
      } catch (error: any) {
        console.error("Gemini voice parse failed, using local fallback:", error.message);
      }
    }

    // Fallback: lokaler Parser
    res.json(parseLocal(text));
  });

  // === Transgourmet: Artikel-Matching ===
  app.post("/api/orders/:id/transgourmet/match", requireAuth, async (req: Request, res: Response) => {
    const listId = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(listId);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });

    const items = await storage.getOrderItems(listId);
    const uncheckedItems = items
      .filter((i: any) => !i.isChecked)
      .map((i: any) => ({ name: i.name, amount: i.amount }));

    if (uncheckedItems.length === 0) {
      return res.json({ matched: [], unmatched: [] });
    }

    try {
      const { matchOrderItems } = await import("../transgourmet-agent");
      const results = await matchOrderItems(uncheckedItems);

      const matched = results.filter(r => r.match !== null);
      const unmatched = results.filter(r => r.match === null);

      res.json({ matched, unmatched });
    } catch (error: any) {
      console.error("Transgourmet match error:", error);
      res.status(500).json({ error: "Matching fehlgeschlagen: " + error.message });
    }
  });

  // === Transgourmet: In Warenkorb legen ===
  app.post("/api/orders/:id/transgourmet/order", requireAuth, async (req: Request, res: Response) => {
    const listId = parseInt(getParam(req.params.id));
    const list = await storage.getOrderList(listId);
    if (!list) return res.status(404).json({ error: "Liste nicht gefunden" });

    const { items } = req.body; // [{artikelNr, name, menge}]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Keine Artikel angegeben" });
    }

    try {
      const { addToCart } = await import("../transgourmet-agent");
      const result = await addToCart(items);

      // Save result in order list notes
      if (result.success) {
        await storage.updateOrderList(listId, {
          notes: `Transgourmet: ${result.itemsAdded} Artikel im Warenkorb. ${result.cartUrl || ""}`,
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Transgourmet order error:", error);
      res.status(500).json({ error: "Bestellung fehlgeschlagen: " + error.message });
    }
  });

  // === Transgourmet: Katalog durchsuchen (online search) ===
  app.post("/api/orders/transgourmet/search", requireAuth, async (req: Request, res: Response) => {
    const { queries } = req.body; // string[]
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: "Suchbegriffe erforderlich" });
    }
    // Limit to 5 queries per request
    const limited = queries.slice(0, 5).map((q: string) => String(q).trim()).filter(Boolean);
    try {
      const { searchTransgourmet } = await import("../transgourmet-agent");
      const results = await searchTransgourmet(limited);
      res.json({ results });
    } catch (error: any) {
      console.error("Transgourmet search error:", error);
      res.status(500).json({ error: "Suche fehlgeschlagen: " + error.message });
    }
  });

  // === Transgourmet: Screenshot (Debug) ===
  app.get("/api/orders/transgourmet/screenshot", requireAuth, async (_req: Request, res: Response) => {
    try {
      const { screenshotSchnellerfassung } = await import("../transgourmet-agent");
      const screenshot = await screenshotSchnellerfassung();
      res.json({ screenshot: `data:image/png;base64,${screenshot}` });
    } catch (error: any) {
      console.error("Transgourmet screenshot error:", error);
      res.status(500).json({ error: "Screenshot fehlgeschlagen: " + error.message });
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

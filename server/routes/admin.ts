import type { Express, Request, Response } from "express";
import express from "express";
import { insertLocationSchema, updateSettingSchema } from "@shared/schema";
import { requireAuth, requireAdmin, requireRole, storage, getParam } from "./middleware";
import { getAirtableStatus, testAirtableConnection, syncAirtableEvents } from "../airtable";
import { sendEmail, initializeTransporter, verifySmtp, isSmtpConfigured } from "../email";
import { handleGetVapidPublicKey, handlePushSubscribe, handlePushUnsubscribe, handlePushTest } from "../push-notifications";
import { handleListBackups, handleCreateBackup, handleDownloadBackup, handleRestoreBackup, handleDeleteBackup } from "../backup";
import { handleGdprExportOwn, handleGdprExportUser, handleGdprCountsOwn, handleGdprCountsUser, handleGdprDeleteOwn, handleGdprDeleteUser } from "../gdpr";
import { healthHandler } from "../health";
import { metricsHandler } from "../metrics";
import { getUploadDir } from "../recipe-media";

export function registerAdminRoutes(app: Express) {
  // === ADMIN: App Settings ===

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = await storage.getAllSettings();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }
    res.json(settingsObj);
  });

  app.put("/api/admin/settings/:key", requireAdmin, async (req, res) => {
    const { value } = updateSettingSchema.parse(req.body);
    const setting = await storage.setSetting(getParam(req.params.key), value);
    res.json(setting);
  });

  // Audit log viewer (admin only)
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || "100")), 500);
      const offset = parseInt(String(req.query.offset || "0"));
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === Seed Data ===

  app.post("/api/seed", requireAdmin, async (req, res) => {
    try {
      // Check if data already exists
      const existingFridges = await storage.getFridges();
      if (existingFridges.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      // Seed fridges
      await storage.createFridge({ name: "Kühlraum", tempMin: 0, tempMax: 4 });
      await storage.createFridge({ name: "Tiefkühler", tempMin: -22, tempMax: -18 });
      await storage.createFridge({ name: "Vorbereitungskühlschrank", tempMin: 0, tempMax: 5 });

      // Seed shift types (Dienste)
      const existingShiftTypes = await storage.getShiftTypes();
      if (existingShiftTypes.length === 0) {
        await storage.createShiftType({ name: "Frühstück", startTime: "06:00", endTime: "14:30", color: "#22c55e" });
        await storage.createShiftType({ name: "Kochen Mittag", startTime: "07:00", endTime: "15:30", color: "#3b82f6" });
        await storage.createShiftType({ name: "Kochen Mittag 2", startTime: "08:00", endTime: "16:30", color: "#8b5cf6" });
        await storage.createShiftType({ name: "Abwasch", startTime: "08:00", endTime: "16:30", color: "#f59e0b" });
        await storage.createShiftType({ name: "Kochen Abend", startTime: "13:00", endTime: "21:30", color: "#ef4444" });
      }

      // Seed staff members from Dienstplan image
      const existingStaff = await storage.getStaff();
      if (existingStaff.length === 0) {
        await storage.createStaff({ name: "Moscher, Gerald", role: "Koch", color: "#3b82f6" });
        await storage.createStaff({ name: "Glanzer, Patrick", role: "Koch", color: "#22c55e" });
        await storage.createStaff({ name: "Cayli, Bugra", role: "Koch", color: "#f59e0b" });
        await storage.createStaff({ name: "Stindl, Michael", role: "Koch", color: "#8b5cf6" });
        await storage.createStaff({ name: "Deyab, Mona", role: "Koch", color: "#ec4899" });
        await storage.createStaff({ name: "Enoma, Helen", role: "Koch", color: "#06b6d4" });
        await storage.createStaff({ name: "Kononenko, Alina", role: "Koch", color: "#84cc16" });
        await storage.createStaff({ name: "Nsiah-Youngman, Ma", role: "Koch", color: "#ef4444" });
      }

      res.json({ message: "Seed data created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seed Austrian/Styrian recipes
  app.post("/api/seed-recipes", requireAdmin, async (req, res) => {
    try {
      const existingRecipes = await storage.getRecipes();
      if (existingRecipes.length >= 20) {
        return res.json({ message: "Recipes already seeded", count: existingRecipes.length });
      }

      const austrianRecipes = [
        // SOUPS (20+)
        { name: "Frittatensuppe", category: "ClearSoups", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Palatschinken backen", "In Streifen schneiden", "Mit heißer Rindssuppe servieren"] },
        { name: "Leberknödelsuppe", category: "ClearSoups", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Leber faschieren", "Mit Semmelbröseln und Ei vermengen", "Knödel formen", "In Suppe kochen"] },
        { name: "Grießnockerlsuppe", category: "ClearSoups", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Butter schaumig rühren", "Grieß und Ei untermengen", "Nockerl formen", "In Suppe kochen"] },
        { name: "Knoblauchcremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Knoblauch anrösten", "Mit Suppe aufgießen", "Obers hinzufügen", "Pürieren"] },
        { name: "Kürbiscremesuppe", category: "CreamSoups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Kürbis würfeln", "Mit Zwiebeln anbraten", "Aufgießen und pürieren", "Mit Kernöl verfeinern"] },
        { name: "Selleriecremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["G", "L"], steps: ["Sellerie kochen", "Pürieren", "Mit Obers verfeinern"] },
        { name: "Schwammerlsuppe", category: "CreamSoups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Pilze putzen", "Anbraten", "Mit Suppe aufgießen", "Mit Sauerrahm verfeinern"] },
        { name: "Erdäpfelsuppe", category: "CreamSoups", portions: 4, prepTime: 40, allergens: ["G", "L"], steps: ["Kartoffeln würfeln", "Mit Lauch anbraten", "Kochen und pürieren"] },
        { name: "Klare Rindsuppe", category: "ClearSoups", portions: 6, prepTime: 180, allergens: ["L"], steps: ["Rindfleisch und Knochen kochen", "Wurzelgemüse hinzufügen", "Abseihen", "Würzen"] },
        { name: "Karfiolcremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["G"], steps: ["Karfiol kochen", "Pürieren", "Mit Obers verfeinern", "Mit Muskat würzen"] },
        { name: "Spargelcremesuppe", category: "CreamSoups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Spargel kochen", "Schalen für Fond", "Pürieren", "Mit Obers vollenden"] },
        { name: "Bärlauchcremesuppe", category: "CreamSoups", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Zwiebeln anbraten", "Bärlauch hinzufügen", "Pürieren", "Mit Sauerrahm servieren"] },
        { name: "Tomatencremesuppe", category: "CreamSoups", portions: 4, prepTime: 30, allergens: ["G"], steps: ["Tomaten rösten", "Mit Basilikum pürieren", "Obers einrühren"] },
        { name: "Linsensuppe", category: "ClearSoups", portions: 4, prepTime: 45, allergens: [], steps: ["Linsen mit Gemüse kochen", "Mit Essig abschmecken"] },
        { name: "Erbsensuppe", category: "ClearSoups", portions: 4, prepTime: 60, allergens: ["L"], steps: ["Erbsen einweichen", "Mit Suppengrün kochen", "Pürieren"] },
        { name: "Bohnensuppe", category: "ClearSoups", portions: 4, prepTime: 50, allergens: [], steps: ["Weiße Bohnen kochen", "Mit Speck verfeinern"] },
        { name: "Zwiebelsuppe", category: "ClearSoups", portions: 4, prepTime: 40, allergens: ["A", "G"], steps: ["Zwiebeln karamellisieren", "Mit Suppe aufgießen", "Mit Käsetoast servieren"] },
        { name: "Nudelsuppe", category: "ClearSoups", portions: 4, prepTime: 20, allergens: ["A", "C"], steps: ["Rindssuppe aufkochen", "Nudeln einlegen", "Schnittlauch darüber"] },
        { name: "Einmachsuppe", category: "ClearSoups", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Einmach aus Butter und Mehl", "Mit Suppe aufgießen", "Mit Sauerrahm vollenden"] },
        { name: "Kaspressknödelsuppe", category: "ClearSoups", portions: 4, prepTime: 40, allergens: ["A", "C", "G"], steps: ["Knödel aus Altbrot und Käse formen", "Braten", "In Suppe servieren"] },

        // MAINS - Meat (25+)
        { name: "Wiener Schnitzel", category: "MainMeat", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Fleisch klopfen", "Panieren", "In Butterschmalz ausbacken", "Mit Zitrone servieren"] },
        { name: "Schweinsbraten", category: "MainMeat", portions: 6, prepTime: 120, allergens: [], steps: ["Schwarte einschneiden", "Würzen", "Im Rohr braten", "Mit Bratensaft servieren"] },
        { name: "Tafelspitz", category: "MainMeat", portions: 6, prepTime: 180, allergens: ["L"], steps: ["Rindfleisch mit Suppengemüse kochen", "Mit Schnittlauchsauce servieren", "Apfelkren dazu reichen"] },
        { name: "Backhendl", category: "MainMeat", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Hendl zerteilen", "Panieren", "In Fett ausbacken"] },
        { name: "Rindsgulasch", category: "MainMeat", portions: 6, prepTime: 120, allergens: ["A", "L"], steps: ["Zwiebeln rösten", "Fleisch anbraten", "Mit Paprika würzen", "Langsam schmoren"] },
        { name: "Zwiebelrostbraten", category: "MainMeat", portions: 4, prepTime: 40, allergens: [], steps: ["Rostbraten braten", "Röstzwiebeln zubereiten", "Mit Bratensaft servieren"] },
        { name: "Stelze", category: "MainMeat", portions: 4, prepTime: 150, allergens: [], steps: ["Stelze würzen", "Im Rohr knusprig braten", "Mit Kraut servieren"] },
        { name: "Cordon Bleu", category: "MainMeat", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Schnitzel füllen", "Mit Schinken und Käse", "Panieren", "Ausbacken"] },
        { name: "Leberkäse", category: "MainMeat", portions: 8, prepTime: 90, allergens: [], steps: ["Leberkäse backen", "In Scheiben schneiden", "Mit Senf und Semmel servieren"] },
        { name: "Beuschel", category: "MainMeat", portions: 4, prepTime: 90, allergens: ["A"], steps: ["Innereien kochen", "Sauce zubereiten", "Mit Semmelknödel servieren"] },
        { name: "Blunzengröstl", category: "MainMeat", portions: 4, prepTime: 30, allergens: ["C"], steps: ["Blutwurst würfeln", "Mit Erdäpfeln braten", "Mit Spiegelei servieren"] },
        { name: "Kalbsrahmgeschnetzeltes", category: "MainMeat", portions: 4, prepTime: 35, allergens: ["A", "G"], steps: ["Kalbfleisch schnetzeln", "Anbraten", "Mit Rahmsauce servieren"] },
        { name: "Altwiener Suppentopf", category: "MainMeat", portions: 6, prepTime: 120, allergens: ["L"], steps: ["Rindfleisch mit Gemüse kochen", "Als Eintopf servieren"] },
        { name: "Faschierter Braten", category: "MainMeat", portions: 6, prepTime: 70, allergens: ["A", "C"], steps: ["Faschiertes würzen", "Formen", "Im Rohr braten"] },
        { name: "Krautfleckerl mit Speck", category: "MainMeat", portions: 4, prepTime: 40, allergens: ["A", "C"], steps: ["Kraut dünsten", "Fleckerl kochen", "Mit Speck mischen"] },
        { name: "Gebackene Leber", category: "MainMeat", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Leber schneiden", "Panieren", "Ausbacken", "Mit Erdäpfelpüree servieren"] },
        { name: "Steirisches Wurzelfleisch", category: "MainMeat", portions: 6, prepTime: 90, allergens: ["L"], steps: ["Schweinfleisch kochen", "Mit Kren servieren", "Wurzelgemüse dazu"] },
        { name: "Grammelknödel", category: "MainMeat", portions: 4, prepTime: 50, allergens: ["A", "C"], steps: ["Kartoffelteig zubereiten", "Mit Grammeln füllen", "Kochen"] },
        { name: "Fleischlaberl", category: "MainMeat", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Faschiertes würzen", "Laibchen formen", "Braten"] },
        { name: "Geselchtes mit Sauerkraut", category: "MainMeat", portions: 4, prepTime: 60, allergens: [], steps: ["Geselchtes kochen", "Sauerkraut dünsten", "Zusammen servieren"] },
        { name: "Kümmelbraten", category: "MainMeat", portions: 6, prepTime: 100, allergens: [], steps: ["Schweinefleisch mit Kümmel würzen", "Langsam braten"] },
        { name: "Lammstelze", category: "MainMeat", portions: 4, prepTime: 120, allergens: [], steps: ["Lamm marinieren", "Im Rohr schmoren"] },
        { name: "Hühnerkeule überbacken", category: "MainMeat", portions: 4, prepTime: 50, allergens: ["G"], steps: ["Hühnerkeulen braten", "Mit Käse überbacken"] },
        { name: "Putenschnitzel", category: "MainMeat", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Pute klopfen", "Panieren", "Braten"] },
        { name: "Lasagne", category: "MainMeat", portions: 6, prepTime: 75, allergens: ["A", "C", "G"], steps: ["Bolognese zubereiten", "Schichten", "Überbacken"] },

        // MAINS - Vegetarian (20+)
        { name: "Käsespätzle", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Spätzle kochen", "Schichten mit Käse", "Mit Röstzwiebeln servieren"] },
        { name: "Spinatknödel", category: "MainVegan", portions: 4, prepTime: 40, allergens: ["A", "C", "G"], steps: ["Spinat hacken", "Mit Knödelteig mischen", "Kochen", "Mit brauner Butter servieren"] },
        { name: "Gemüsestrudel", category: "MainVegan", portions: 6, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Gemüse dünsten", "In Strudelteig wickeln", "Backen"] },
        { name: "Eierschwammerl mit Knödel", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Schwammerl putzen", "In Rahm schwenken", "Mit Semmelknödel servieren"] },
        { name: "Kasnocken", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Nockenteig zubereiten", "Mit Käse schichten", "Im Rohr überbacken"] },
        { name: "Erdäpfelgulasch", category: "MainVegan", portions: 4, prepTime: 40, allergens: [], steps: ["Kartoffeln und Würstel würfeln", "Mit Paprika kochen"] },
        { name: "Eiernockerl", category: "MainVegan", portions: 2, prepTime: 15, allergens: ["A", "C"], steps: ["Nockerl braten", "Mit Ei stocken lassen", "Mit grünem Salat servieren"] },
        { name: "Topfenknödel", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Topfenteig zubereiten", "Knödel formen", "Kochen", "In Butterbröseln wälzen"] },
        { name: "Marillenknödel", category: "MainVegan", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Marillen einwickeln", "Kochen", "In Bröseln wälzen"] },
        { name: "Zwetschgenknödel", category: "MainVegan", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Zwetschgen einwickeln", "Kochen", "Mit Zimt-Zucker servieren"] },
        { name: "Mohnnudeln", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffelteig zu Nudeln formen", "Kochen", "In Mohn und Butter wälzen"] },
        { name: "Krautstrudel", category: "MainVegan", portions: 6, prepTime: 60, allergens: ["A", "C"], steps: ["Kraut dünsten", "Mit Kümmel würzen", "In Strudelteig wickeln", "Backen"] },
        { name: "Gemüselaibchen", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C"], steps: ["Gemüse raspeln", "Mit Ei und Mehl binden", "Braten"] },
        { name: "Käsesuppe", category: "MainVegan", portions: 4, prepTime: 25, allergens: ["A", "G"], steps: ["Zwiebeln anbraten", "Mit Suppe aufgießen", "Käse einschmelzen"] },
        { name: "Reiberdatschi", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffeln reiben", "Würzen", "Als Laibchen braten"] },
        { name: "Polenta mit Schwammerl", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Polenta kochen", "Pilze braten", "Mit Parmesan servieren"] },
        { name: "Risotto mit Spargel", category: "MainVegan", portions: 4, prepTime: 40, allergens: ["G"], steps: ["Spargel kochen", "Risotto zubereiten", "Zusammen servieren"] },
        { name: "Quiche Lorraine", category: "MainVegan", portions: 6, prepTime: 55, allergens: ["A", "C", "G"], steps: ["Mürbteig backen", "Mit Eiermasse füllen", "Backen"] },
        { name: "Flammkuchen", category: "MainVegan", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Teig dünn ausrollen", "Mit Sauerrahm bestreichen", "Belegen", "Backen"] },
        { name: "Schinkenfleckerl", category: "MainVegan", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Fleckerl kochen", "Mit Schinken und Sauerrahm überbacken"] },

        // SIDES (25+)
        { name: "Pommes Frites", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Kartoffeln schneiden", "Frittieren", "Salzen"] },
        { name: "Erdäpfelpüree", category: "Sides", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Kartoffeln kochen", "Stampfen", "Mit Butter und Milch verfeinern"] },
        { name: "Semmelknödel", category: "Sides", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Semmeln einweichen", "Mit Ei binden", "Knödel formen", "Kochen"] },
        { name: "Petersilkartoffeln", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Kartoffeln kochen", "In Butter schwenken", "Mit Petersilie bestreuen"] },
        { name: "Reis", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Reis waschen", "Kochen", "Mit Butter verfeinern"] },
        { name: "Butternockerl", category: "Sides", portions: 4, prepTime: 20, allergens: ["A", "C", "G"], steps: ["Nockenteig zubereiten", "In Wasser kochen", "Mit Butter servieren"] },
        { name: "Kroketten", category: "Sides", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffelmasse zubereiten", "Formen", "Panieren", "Frittieren"] },
        { name: "Spätzle", category: "Sides", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Teig zubereiten", "Durch Spätzlepresse drücken", "In Butter schwenken"] },
        { name: "Serviettenknödel", category: "Sides", portions: 6, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Knödelmasse in Serviette wickeln", "Kochen", "In Scheiben schneiden"] },
        { name: "Bratkartoffeln", category: "Sides", portions: 4, prepTime: 30, allergens: [], steps: ["Kartoffeln kochen", "In Scheiben schneiden", "Knusprig braten"] },
        { name: "Sauerkraut", category: "Sides", portions: 4, prepTime: 40, allergens: [], steps: ["Kraut mit Kümmel dünsten", "Mit Schmalz verfeinern"] },
        { name: "Rotkraut", category: "Sides", portions: 4, prepTime: 50, allergens: [], steps: ["Rotkraut hobeln", "Mit Apfel und Essig schmoren"] },
        { name: "Speckkraut", category: "Sides", portions: 4, prepTime: 35, allergens: [], steps: ["Weißkraut mit Speck dünsten", "Mit Kümmel würzen"] },
        { name: "Bohnensalat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Bohnen kochen", "Mit Essig-Öl marinieren", "Mit Zwiebeln servieren"] },
        { name: "Gurkensalat", category: "Sides", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Gurken hobeln", "Mit Sauerrahm-Dressing anmachen"] },
        { name: "Erdäpfelsalat", category: "Sides", portions: 4, prepTime: 30, allergens: [], steps: ["Kartoffeln kochen", "Warm marinieren", "Mit Essig und Öl anmachen"] },
        { name: "Krautsalat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Kraut hobeln", "Mit heißem Essig-Öl marinieren"] },
        { name: "Karottensalat", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Karotten raspeln", "Mit Zitrone und Öl anmachen"] },
        { name: "Rote Rüben Salat", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Rote Rüben kochen", "Schneiden", "Mit Kren marinieren"] },
        { name: "Vogerlsalat", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Feldsalat waschen", "Mit Kernöl-Dressing anrichten"] },
        { name: "Gemischter Salat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Verschiedene Salate waschen", "Mit Dressing anrichten"] },
        { name: "Bratgemüse", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Gemüse würfeln", "Im Ofen rösten"] },
        { name: "Karottengemüse", category: "Sides", portions: 4, prepTime: 20, allergens: ["G"], steps: ["Karotten kochen", "In Butter schwenken"] },
        { name: "Kohlsprossen", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Kohlsprossen putzen", "Kochen", "In Butter schwenken"] },
        { name: "Rahmkohlrabi", category: "Sides", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Kohlrabi kochen", "In Rahmsauce schwenken"] },

        // DESSERTS (25+)
        { name: "Kaiserschmarrn", category: "HotDesserts", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Teig zubereiten", "In Pfanne backen", "Zerreißen", "Mit Puderzucker bestreuen"] },
        { name: "Apfelstrudel", category: "HotDesserts", portions: 8, prepTime: 60, allergens: ["A"], steps: ["Strudelteig ziehen", "Äpfel einwickeln", "Backen", "Mit Vanillesauce servieren"] },
        { name: "Sachertorte", category: "ColdDesserts", portions: 12, prepTime: 90, allergens: ["A", "C", "G"], steps: ["Schokobiskuit backen", "Mit Marmelade füllen", "Glasieren"] },
        { name: "Palatschinken", category: "HotDesserts", portions: 4, prepTime: 20, allergens: ["A", "C", "G"], steps: ["Teig zubereiten", "Dünne Pfannkuchen backen", "Mit Marmelade füllen"] },
        { name: "Topfenstrudel", category: "HotDesserts", portions: 8, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Topfenfülle zubereiten", "Einwickeln", "Backen"] },
        { name: "Germknödel", category: "HotDesserts", portions: 4, prepTime: 60, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Powidl füllen", "Dämpfen", "Mit Mohn bestreuen"] },
        { name: "Buchteln", category: "HotDesserts", portions: 12, prepTime: 75, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Marmelade füllen", "Backen", "Mit Vanillesauce servieren"] },
        { name: "Linzer Torte", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C", "H"], steps: ["Mürbteig mit Nüssen", "Mit Ribiselmarmelade füllen", "Gitter auflegen", "Backen"] },
        { name: "Esterházy Torte", category: "ColdDesserts", portions: 12, prepTime: 90, allergens: ["A", "C", "H"], steps: ["Nussböden backen", "Mit Buttercreme füllen", "Marmorglasur"] },
        { name: "Punschkrapferl", category: "ColdDesserts", portions: 16, prepTime: 60, allergens: ["A", "C"], steps: ["Biskuitreste mit Punsch vermengen", "Formen", "Rosa glasieren"] },
        { name: "Powidltascherl", category: "HotDesserts", portions: 4, prepTime: 45, allergens: ["A", "C"], steps: ["Kartoffelteig zubereiten", "Mit Powidl füllen", "Kochen", "In Bröseln wälzen"] },
        { name: "Grießschmarrn", category: "HotDesserts", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Grießbrei kochen", "In Pfanne anbraten", "Zerreißen"] },
        { name: "Scheiterhaufen", category: "HotDesserts", portions: 6, prepTime: 65, allergens: ["A", "C", "G"], steps: ["Semmeln und Äpfel schichten", "Mit Eiermilch übergießen", "Backen"] },
        { name: "Milchrahmstrudel", category: "HotDesserts", portions: 8, prepTime: 55, allergens: ["A", "C", "G"], steps: ["Milchrahmfülle zubereiten", "In Strudelteig wickeln", "Backen"] },
        { name: "Nussschnitte", category: "ColdDesserts", portions: 16, prepTime: 50, allergens: ["A", "C", "H"], steps: ["Biskuit backen", "Mit Nusscreme füllen", "Schneiden"] },
        { name: "Kardinalschnitte", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C"], steps: ["Biskuit und Baiser backen", "Schichten", "Schneiden"] },
        { name: "Vanillekipferl", category: "ColdDesserts", portions: 40, prepTime: 45, allergens: ["A", "H"], steps: ["Mürbteig mit Nüssen", "Kipferl formen", "Backen", "In Vanillezucker wälzen"] },
        { name: "Marmorkuchen", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C", "G"], steps: ["Rührteig zubereiten", "Teil mit Kakao färben", "Marmorieren", "Backen"] },
        { name: "Gugelhupf", category: "ColdDesserts", portions: 12, prepTime: 70, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Rosinen", "In Form backen"] },
        { name: "Mohntorte", category: "ColdDesserts", portions: 12, prepTime: 60, allergens: ["A", "C"], steps: ["Mohnmasse zubereiten", "Torte backen", "Mit Schlag servieren"] },
        { name: "Nusstorte", category: "ColdDesserts", portions: 12, prepTime: 70, allergens: ["A", "C", "H"], steps: ["Nussböden backen", "Mit Creme füllen"] },
        { name: "Indianer", category: "ColdDesserts", portions: 8, prepTime: 40, allergens: ["A", "C"], steps: ["Bisquit backen", "Aushöhlen", "Mit Schlag füllen", "Glasieren"] },
        { name: "Cremeschnitte", category: "ColdDesserts", portions: 12, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Blätterteig backen", "Vanillecreme zubereiten", "Schichten"] },
        { name: "Obstknödel", category: "HotDesserts", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Obst einwickeln", "Kochen", "In Bröseln wälzen"] },
        { name: "Wiener Melange Mousse", category: "ColdDesserts", portions: 4, prepTime: 30, allergens: ["C", "G"], steps: ["Kaffee-Mousse zubereiten", "Kalt stellen", "Mit Schlag servieren"] },

        // SALADS (10+)
        { name: "Steirischer Käferbohnensalat", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Käferbohnen kochen", "Mit Kernöl marinieren", "Mit Zwiebeln servieren"] },
        { name: "Nüsslisalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Feldsalat waschen", "Mit Essig-Öl anmachen"] },
        { name: "Endiviensalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Endivie waschen", "Mit Speckdressing anrichten"] },
        { name: "Radicchio Salat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Radicchio waschen", "Mit Balsamico anrichten"] },
        { name: "Tomatensalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Tomaten schneiden", "Mit Zwiebeln und Essig-Öl anmachen"] },
        { name: "Wurstsalat", category: "Salads", portions: 4, prepTime: 15, allergens: [], steps: ["Wurst in Streifen schneiden", "Mit Zwiebeln und Essig-Öl anmachen"] },
        { name: "Hirtensalat", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Gurken, Tomaten, Paprika schneiden", "Mit Schafskäse servieren"] },
        { name: "Caesar Salad", category: "Salads", portions: 4, prepTime: 20, allergens: ["A", "C", "D", "G"], steps: ["Romanasalat waschen", "Mit Caesar-Dressing anrichten", "Croûtons und Parmesan dazu"] },
        { name: "Fisolensalat", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Fisolen kochen", "Mit Essig-Öl marinieren"] },
        { name: "Selleriesalat", category: "Salads", portions: 4, prepTime: 15, allergens: ["C", "G", "L"], steps: ["Sellerie raspeln", "Mit Mayonnaise anmachen"] },

        // BREAKFAST (10+)
        { name: "Bauernfrühstück", category: "Sides", portions: 2, prepTime: 20, allergens: ["C"], steps: ["Kartoffeln braten", "Eier und Speck dazugeben", "Stocken lassen"] },
        { name: "Strammer Max", category: "Sides", portions: 2, prepTime: 15, allergens: ["A", "C"], steps: ["Brot mit Schinken belegen", "Spiegelei darauf geben"] },
        { name: "Eierspeis", category: "Sides", portions: 2, prepTime: 10, allergens: ["C"], steps: ["Eier verquirlen", "In Butter stocken lassen"] },
        { name: "Speckbrot", category: "Sides", portions: 2, prepTime: 10, allergens: ["A"], steps: ["Speck anbraten", "Auf Brot servieren"] },
        { name: "Verhackerts", category: "Sides", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Grammel faschieren", "Würzen", "Auf Brot streichen"] },
        { name: "Kipferl mit Butter", category: "Sides", portions: 4, prepTime: 5, allergens: ["A", "G"], steps: ["Kipferl aufschneiden", "Mit Butter bestreichen"] },
        { name: "Birchermüsli", category: "Sides", portions: 4, prepTime: 15, allergens: ["A", "G", "H"], steps: ["Haferflocken einweichen", "Mit Joghurt und Obst mischen"] },
        { name: "Käseaufstrich", category: "Sides", portions: 4, prepTime: 10, allergens: ["G"], steps: ["Topfen mit Käse mischen", "Würzen", "Auf Brot streichen"] },
        { name: "Liptauer", category: "Sides", portions: 4, prepTime: 10, allergens: ["G"], steps: ["Topfen mit Paprika und Gewürzen mischen", "Kalt stellen"] },
        { name: "Wiener Frühstück", category: "Sides", portions: 2, prepTime: 15, allergens: ["A", "C", "G"], steps: ["Semmel mit Butter", "Weiches Ei", "Kaffee dazu"] },

        // SNACKS (10+)
        { name: "Bosna", category: "Sides", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Bratwürste grillen", "In Semmel mit Zwiebeln und Senf servieren"] },
        { name: "Käsekrainer", category: "Sides", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Krainer grillen", "Mit Senf und Kren servieren"] },
        { name: "Frankfurter", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Würstel erhitzen", "Mit Senf servieren"] },
        { name: "Leberkässemmel", category: "Sides", portions: 4, prepTime: 10, allergens: ["A"], steps: ["Leberkäse anbraten", "In Semmel mit Senf servieren"] },
        { name: "Brezel", category: "Sides", portions: 6, prepTime: 30, allergens: ["A"], steps: ["Laugengebäck formen", "Backen", "Mit Butter servieren"] },
        { name: "Langosch", category: "Sides", portions: 4, prepTime: 25, allergens: ["A", "G"], steps: ["Teig ausbacken", "Mit Knoblauch und Käse belegen"] },
        { name: "Topfengolatsche", category: "Sides", portions: 8, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Blätterteig mit Topfen füllen", "Backen"] },
        { name: "Apfeltaschen", category: "Sides", portions: 8, prepTime: 40, allergens: ["A"], steps: ["Blätterteig mit Apfel füllen", "Backen"] },
        { name: "Mohnflesserl", category: "Sides", portions: 6, prepTime: 35, allergens: ["A"], steps: ["Germteig flechten", "Mit Mohn bestreuen", "Backen"] },
        { name: "Salzstangerl", category: "Sides", portions: 8, prepTime: 30, allergens: ["A"], steps: ["Laugengebäck formen", "Mit Salz bestreuen", "Backen"] },

        // DRINKS (10+)
        { name: "Wiener Melange", category: "ColdSauces", portions: 1, prepTime: 5, allergens: ["G"], steps: ["Espresso zubereiten", "Mit aufgeschäumter Milch servieren"] },
        { name: "Einspänner", category: "ColdSauces", portions: 1, prepTime: 5, allergens: ["G"], steps: ["Mokka in Glas", "Mit Schlagobers bedecken"] },
        { name: "Almudler Spritzer", category: "ColdSauces", portions: 1, prepTime: 2, allergens: [], steps: ["Almdudler mit Soda mischen"] },
        { name: "Hollunder Spritzer", category: "ColdSauces", portions: 1, prepTime: 2, allergens: [], steps: ["Holundersirup mit Soda aufgießen"] },
        { name: "Zitronen Eistee", category: "ColdSauces", portions: 4, prepTime: 15, allergens: [], steps: ["Tee kochen", "Mit Zitrone kalt stellen"] },
        { name: "Apfelsaft gespritzt", category: "ColdSauces", portions: 1, prepTime: 2, allergens: [], steps: ["Apfelsaft mit Mineralwasser mischen"] },
        { name: "Heiße Schokolade", category: "ColdSauces", portions: 1, prepTime: 10, allergens: ["G"], steps: ["Milch erhitzen", "Schokolade einrühren", "Mit Schlag servieren"] },
        { name: "Punsch", category: "ColdSauces", portions: 4, prepTime: 15, allergens: [], steps: ["Tee mit Gewürzen kochen", "Fruchtsaft hinzufügen"] },
        { name: "Glühwein", category: "ColdSauces", portions: 4, prepTime: 15, allergens: [], steps: ["Rotwein mit Gewürzen erhitzen", "Nicht kochen"] },
        { name: "Frischer Orangensaft", category: "ColdSauces", portions: 2, prepTime: 5, allergens: [], steps: ["Orangen auspressen", "Kalt servieren"] },

        // STARTERS (10+)
        { name: "Gebackene Champignons", category: "Salads", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Champignons panieren", "Ausbacken", "Mit Sauce Tartare servieren"] },
        { name: "Schinkenröllchen", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Schinken mit Kren-Frischkäse füllen", "Aufrollen"] },
        { name: "Geräucherte Forelle", category: "Salads", portions: 4, prepTime: 10, allergens: ["D"], steps: ["Forelle filetieren", "Mit Kren-Rahm servieren"] },
        { name: "Vitello Tonnato", category: "Salads", portions: 6, prepTime: 30, allergens: ["C", "D"], steps: ["Kalbfleisch kochen", "Mit Thunfischsauce servieren"] },
        { name: "Beef Tatar", category: "Salads", portions: 4, prepTime: 20, allergens: ["C"], steps: ["Rindfleisch fein hacken", "Würzen", "Mit Toast servieren"] },
        { name: "Carpaccio", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Rindfleisch dünn aufschneiden", "Mit Parmesan und Rucola servieren"] },
        { name: "Bruschetta", category: "Salads", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Brot rösten", "Mit Tomaten-Basilikum belegen"] },
        { name: "Antipasti Teller", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Mariniertes Gemüse anrichten", "Mit Oliven servieren"] },
        { name: "Bündnerfleisch", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Bündnerfleisch dünn aufschneiden", "Mit Brot servieren"] },
        { name: "Räucherlachs", category: "Salads", portions: 4, prepTime: 10, allergens: ["D"], steps: ["Lachs auslegen", "Mit Dill und Zitrone servieren"] }
      ];

      let created = 0;
      for (const recipe of austrianRecipes) {
        await storage.createRecipe({
          name: recipe.name,
          category: recipe.category,
          portions: recipe.portions,
          prepTime: recipe.prepTime,
          image: null,
          sourceUrl: null,
          steps: recipe.steps,
          allergens: recipe.allergens
        });
        created++;
      }

      res.json({ message: `${created} Austrian recipes created successfully`, count: created });
    } catch (error: any) {
      console.error('Seed recipes error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Health ---
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Locations ---
  app.get("/api/locations", requireAuth, async (_req: Request, res: Response) => {
    const locs = await storage.getLocations();
    res.json(locs);
  });

  app.post("/api/locations", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const loc = await storage.createLocation(data);
      res.status(201).json(loc);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Airtable ---
  app.get("/api/airtable/status", requireAuth, (_req: Request, res: Response) => {
    res.json(getAirtableStatus());
  });

  app.post("/api/airtable/test", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const result = await testAirtableConnection(req.body.apiKey, req.body.baseId, req.body.tableName);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/airtable/sync", requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const result = await syncAirtableEvents();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded recipe media files
  app.use("/uploads", express.static(getUploadDir()));

  // Email: test sending
  app.post("/api/email/test", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { to } = req.body;
      const recipient = to || (req as any).user?.email;
      if (!recipient) {
        return res.status(400).json({ error: "Keine E-Mail-Adresse angegeben" });
      }
      const result = await sendEmail(
        recipient,
        "Test-E-Mail von mise.at",
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #F37021;">mise.at - Test-E-Mail</h2>
          <p>Diese E-Mail bestaetigt, dass Ihr SMTP-Server korrekt konfiguriert ist.</p>
          <p style="color: #6b7280; font-size: 13px;">Gesendet am ${new Date().toLocaleString("de-AT")}</p>
        </div>`
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email: get settings
  app.get("/api/email/settings", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const settings: Record<string, string> = {};
      const rows = await storage.getAllSettings();
      for (const row of rows) {
        if (row.key.startsWith("email_") || row.key.startsWith("smtp_")) {
          settings[row.key] = row.key === "smtp_pass" ? "********" : row.value;
        }
      }
      settings["smtp_configured"] = isSmtpConfigured() ? "true" : "false";
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email: save settings
  app.put("/api/email/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
              email_haccp_alerts, email_schedule_changes, email_catering_confirmations, email_weekly_report } = req.body;

      // Save SMTP settings to app_settings
      const settingsToSave: Record<string, string> = {
        smtp_host: smtp_host || "",
        smtp_port: String(smtp_port || 587),
        smtp_user: smtp_user || "",
        smtp_from: smtp_from || "",
        email_haccp_alerts: email_haccp_alerts || "false",
        email_schedule_changes: email_schedule_changes || "false",
        email_catering_confirmations: email_catering_confirmations || "false",
        email_weekly_report: email_weekly_report || "false",
      };

      // Only update password if not masked
      if (smtp_pass && smtp_pass !== "********") {
        settingsToSave.smtp_pass = smtp_pass;
      }

      for (const [key, value] of Object.entries(settingsToSave)) {
        await storage.setSetting(key, value);
      }

      // Re-initialize transporter with new settings
      const savedPass = smtp_pass === "********"
        ? (await storage.getSetting("smtp_pass"))?.value || ""
        : smtp_pass || "";

      initializeTransporter({
        host: smtp_host || "",
        port: parseInt(smtp_port || "587", 10),
        user: smtp_user || "",
        pass: savedPass,
        from: smtp_from || "",
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email: verify SMTP connection
  app.post("/api/email/verify", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await verifySmtp();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Push Notifications
  app.get("/api/push/vapid-public-key", requireAuth, handleGetVapidPublicKey);
  app.post("/api/push/subscribe", requireAuth, handlePushSubscribe);
  app.post("/api/push/unsubscribe", requireAuth, handlePushUnsubscribe);
  app.post("/api/push/test", requireAuth, handlePushTest);

  // Backup & Restore
  app.get("/api/admin/backups", requireAdmin, handleListBackups);
  app.post("/api/admin/backups", requireAdmin, handleCreateBackup);
  app.get("/api/admin/backups/:filename", requireAdmin, handleDownloadBackup);
  app.post("/api/admin/backups/:filename/restore", requireAdmin, handleRestoreBackup);
  app.delete("/api/admin/backups/:filename", requireAdmin, handleDeleteBackup);

  // GDPR / DSGVO
  app.get("/api/gdpr/export", requireAuth, handleGdprExportOwn);
  app.get("/api/gdpr/export/:userId", requireAdmin, handleGdprExportUser);
  app.get("/api/gdpr/counts", requireAuth, handleGdprCountsOwn);
  app.get("/api/gdpr/counts/:userId", requireAdmin, handleGdprCountsUser);
  app.delete("/api/gdpr/delete", requireAuth, handleGdprDeleteOwn);
  app.delete("/api/gdpr/delete/:userId", requireAdmin, handleGdprDeleteUser);

  // Monitoring & Health
  app.get("/api/health/detailed", requireAdmin, healthHandler);
  app.get("/api/metrics", requireAdmin, metricsHandler);
}

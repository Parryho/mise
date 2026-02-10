# mise.at — Unified Kitchen Workflow App

Küchenmanagement-System für Hotels und Gastronomie.
Menüplanung, 6-Wochen-Rotation, HACCP-Dokumentation, Rezeptverwaltung, Personalplanung, Einkaufslisten, AI-Features.

**Live**: https://mise.at | **Server**: Hetzner VPS `46.225.63.168`
**Stack**: Express 5 + React 19 + Vite 7 + PostgreSQL 16 + Drizzle ORM + shadcn/ui + Tailwind v4

---

## Wo finde ich was?

### Menüplanung & Rotation — `server/modules/menu/`
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/MenuPlan.tsx` | Wochenplan-UI mit Drag & Drop |
| `client/src/pages/Rotation.tsx` | 6-Wochen-Rotation Editor |
| `client/src/pages/RotationPrint.tsx` | Rotation Druckansicht |
| `client/src/pages/SmartRotation.tsx` | AI-gestützte Rotation-Optimierung |
| `server/modules/menu/index.ts` | **Barrel** — Public API des Menu-Moduls |
| `server/modules/menu/rotation.ts` | Rotation CRUD + Wochenplan-Generierung |
| `server/modules/menu/rotation-agent.ts` | AI Auto-Fill Agent (v2) mit kulinarischen Regeln |
| `server/modules/menu/smart-rotation.ts` | Claude API Rotation-Optimierung |
| `server/modules/menu/production.ts` | Produktionslisten-Generierung |
| `server/modules/menu/shopping.ts` | Einkaufskonsolidierung |
| `server/modules/menu/costs.ts` | Food-Cost Analyse |
| `server/modules/menu/public-menu.ts` | Public Menu API |
| `server/modules/menu/buffet-cards.ts` | Buffet-Karten Generierung |
| `shared/constants.ts` | Meal-Slots: `soup, main1, side1a, side1b, main2, side2a, side2b, dessert` |

### Rezepte & Allergene — `server/modules/recipe/`
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/Recipes.tsx` | Rezept-Bibliothek mit Suche/Filter |
| `client/src/pages/RecipeAIImport.tsx` | AI Rezept-Import (Text/Foto) |
| `client/src/pages/RecipeSuggestions.tsx` | AI Rezeptvorschläge |
| `client/src/components/RecipeDetailDialog.tsx` | Rezept-Detail Dialog |
| `client/src/components/RecipeMediaUpload.tsx` | Foto-Upload |
| `client/src/components/RecipeMediaGallery.tsx` | Foto-Galerie |
| `client/src/components/IntelligentScaling.tsx` | Intelligentes Portions-Scaling |
| `client/src/components/AllergenBadge.tsx` | Allergen-Badge Komponente |
| `client/src/components/AllergenAutoDetect.tsx` | AI Allergen-Erkennung UI |
| `client/src/components/AllergenConflictBanner.tsx` | Konflikt-Warnung |
| `client/src/pages/AllergenOverview.tsx` | Tägliche Allergen-Matrix |
| `client/src/pages/GuestProfiles.tsx` | Gäste-Allergenprofile |
| `server/modules/recipe/index.ts` | **Barrel** — Public API des Recipe-Moduls |
| `server/modules/recipe/llm-import.ts` | Claude API Rezept-Import |
| `server/modules/recipe/suggestions.ts` | AI Rezept-Scoring |
| `server/modules/recipe/scaling.ts` | Nicht-lineares Scaling |
| `server/modules/recipe/media.ts` | Foto-Upload (Multer) |
| `server/modules/recipe/scraper.ts` | URL-Rezept-Scraping (Cheerio, JSON-LD) |
| `server/modules/recipe/sub-recipes.ts` | Rezept-in-Rezept Auflösung |
| `server/modules/recipe/allergen-detection.ts` | AI Allergen-Erkennung |
| `server/modules/recipe/allergen-matrix.ts` | Allergen-Matrix Generierung |
| `server/modules/recipe/auto-tag.ts` | Auto-Tagging (cuisine, flavor, dish type) |
| `server/modules/recipe/pairing-engine.ts` | Adaptive Beilagen-Bewertung |
| `server/modules/recipe/quiz-feedback.ts` | Quiz + Feedback Handlers |
| `shared/allergens.ts` | 14 EU-Allergene (A-R Codes), Parser + Formatter |
| `shared/categorizer.ts` | Auto-Kategorisierung |
| `script/batch-import-gutekueche.ts` | Batch-Scraping von gutekueche.at + chefkoch.de |
| `script/seed-ingredients.ts` | 108 Rezepte mit Zutaten befüllen |
| `client/src/lib/recipe-images.ts` | Kategorie-spezifische Default-Bilder |

### HACCP & Temperatur
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/HACCP.tsx` | Temperatur-Logging UI |
| `client/src/pages/analytics/HaccpCompliance.tsx` | HACCP Compliance Report |
| `client/src/pages/analytics/HaccpAnomalies.tsx` | Anomalie-Dashboard |
| `server/haccp-anomaly.ts` | Anomalie-Erkennung + Health Scores |

### Gäste / PAX
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/Guests.tsx` | Gästezahlen Verwaltung |
| `client/src/pages/analytics/PaxTrends.tsx` | PAX Trends + Charts |
| `client/src/pages/analytics/PaxForecast.tsx` | AI PAX Prognose |
| `server/pax-forecast.ts` | Statistische PAX-Vorhersage |
| `server/felix-parser.ts` | Felix OCR-Daten Parser |

### Catering & Events
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/Catering.tsx` | Catering-Event Verwaltung |
| `server/airtable.ts` | Airtable-Sync (Catering) |

### Personal & Dienstplan
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/Schedule.tsx` | Dienstplan-Übersicht |
| `client/src/pages/ScheduleStaff.tsx` | Mitarbeiter-Verwaltung |
| `client/src/pages/ScheduleShifts.tsx` | Schichttypen |

### Produktion & Einkauf
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/ProductionList.tsx` | Produktionsliste |
| `client/src/pages/ShoppingList.tsx` | Einkaufsliste mit Lieferanten |
| `client/src/pages/MasterIngredients.tsx` | Zutatenstammdaten mit Preisen |
| `client/src/pages/Suppliers.tsx` | Lieferanten-Verwaltung |
| Server-Logik in `server/modules/menu/` | `production.ts`, `shopping.ts`, `costs.ts` |

### Analytics & Reports
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/Reports.tsx` | Reports Dashboard |
| `client/src/pages/analytics/FoodCost.tsx` | Food-Cost Analyse |
| `client/src/pages/analytics/PopularDishes.tsx` | Beliebte Rezepte |
| `client/src/pages/analytics/WastePrediction.tsx` | AI Waste-Prediction |
| `server/analytics.ts` | Analytics Backend |
| `server/waste-prediction.ts` | Abfall-Vorhersage |

### Öffentliche Seiten (ohne Auth)
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/public/GuestMenu.tsx` | Gäste-Speisekarte (`/speisekarte/:location/:date`) |
| `client/src/pages/public/DigitalSignage.tsx` | Digital Signage für Lobby (`/signage/:location`) |
| `client/src/pages/BuffetCards.tsx` | Druckbare Buffet-Karten |
| `client/src/pages/QRGenerator.tsx` | QR-Code Generator |
| Server-Logik in `server/modules/menu/` | `public-menu.ts`, `buffet-cards.ts` |

### Agent Team (Küchen-Orchestrator)
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/AgentTeam.tsx` | Dashboard: Pipeline-Visualisierung, Aktionspunkte, AI-Summary |
| `client/src/components/AgentCard.tsx` | Agent-Status Karte (pending/running/completed/failed) |
| `client/src/components/ActionItemList.tsx` | Priorisierte Aktionspunkte (HIGH/MEDIUM/LOW) |
| `server/agent-team.ts` | Orchestrator: 4-Phasen Pipeline, Conflict Resolution, AI Synthesis |
| `server/agent-adapters.ts` | 7 Wrapper für bestehende Agents |
| `server/routes/agent-team.ts` | API: POST /run, GET /runs, GET /runs/:id, GET /stream/:runId (SSE) |

### Admin & System
| Datei | Beschreibung |
|-------|-------------|
| `client/src/pages/Settings.tsx` | App-Settings + Benutzerverwaltung |
| `client/src/pages/EmailSettings.tsx` | SMTP E-Mail Konfiguration |
| `client/src/pages/ServerStatus.tsx` | Monitoring Dashboard |
| `client/src/pages/BackupRestore.tsx` | Backup-Verwaltung |
| `client/src/pages/GDPRExport.tsx` | DSGVO Datenexport/-löschung |
| `server/backup.ts` | Backup/Restore |
| `server/gdpr.ts` | DSGVO Export/Delete |
| `server/email.ts` | SMTP Versand (Nodemailer) |
| `server/email-templates.ts` | HTML E-Mail Templates |
| `server/push-notifications.ts` | Web Push (VAPID) |
| `server/health.ts` | Health Check Endpoint |
| `server/metrics.ts` | Prometheus Metrics |
| `server/monitoring.ts` | Sentry Integration |

### Internationalisierung
| Datei | Beschreibung |
|-------|-------------|
| `client/src/i18n/locales/de.json` | Deutsche Übersetzungen (627 Keys) |
| `client/src/i18n/locales/en.json` | Englische Übersetzungen (627 Keys) |
| `client/src/i18n/index.ts` | i18next Setup |
| `client/src/hooks/useTranslation.ts` | Translation Hook |
| `client/src/components/LanguageSwitcher.tsx` | Sprachwechsler DE/EN |

### PWA & Offline
| Datei | Beschreibung |
|-------|-------------|
| `client/public/manifest.json` | PWA Manifest |
| `client/public/sw-custom.js` | Service Worker (Push) |
| `client/src/lib/offline-db.ts` | IndexedDB Offline-Cache |
| `client/src/hooks/useOnlineStatus.ts` | Online/Offline Erkennung |
| `client/src/components/OfflineIndicator.tsx` | Offline-Anzeige |

---

## Wichtige Dateien

### Einstiegspunkte
- **Server**: `server/index.ts` — Express App Setup, CORS, Logging, Error Handler
- **Routes**: `server/routes/index.ts` — Orchestrator, 15 modulare Route-Dateien unter `server/routes/`
- **Recipe Module**: `server/modules/recipe/index.ts` — Barrel für Rezepte + Allergene (11 Dateien)
- **Menu Module**: `server/modules/menu/index.ts` — Barrel für Menüplanung + Rotation (8 Dateien)
- **Client**: `client/src/main.tsx` — React Entry + Sentry + i18n Init
- **Router**: `client/src/App.tsx` — Wouter Router + Auth + Layout

### Server-Modul-Architektur
```
server/
  modules/
    recipe/          # Rezepte + Allergene (11 Dateien)
      index.ts       # Public API Barrel — alle Imports über diesen Pfad
    menu/            # Menüplanung + Rotation + Produktion (8 Dateien)
      index.ts       # Public API Barrel — alle Imports über diesen Pfad
  routes/            # 15 Route-Dateien (importieren aus modules/)
  db.ts              # PostgreSQL Connection Pool
  storage.ts         # Data Access Layer (shared)
```
**Cross-Domain**: `menu → recipe` (one-way). Menu-Modul importiert `resolveRecipeIngredients` + `loadAllScores` aus Recipe-Modul. Keine umgekehrte Abhängigkeit.

### Datenbank
- **Schema**: `shared/schema.ts` — Drizzle ORM Schema (22 Tabellen + Zod Validation)
- **Connection**: `server/db.ts` — Pool-Management
- **Storage**: `server/storage.ts` — Data Access Layer
- **Config**: `drizzle.config.ts` — Drizzle Kit Konfiguration
- **Schema Push**: `npm run db:push` — Schema auf DB anwenden

### Konfiguration
- **Env Template**: `.env.example` — Alle Umgebungsvariablen
- **TypeScript**: `tsconfig.json` — Path Aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- **Vite**: `vite.config.ts` — Build + PWA + Tailwind v4
- **Tests**: `vitest.config.ts` — 60% Coverage Threshold
- **E2E**: `playwright.config.ts`
- **UI Library**: `components.json` — shadcn/ui (New York Style, Lucide Icons)
- **Design System**: `docs/DESIGN_SYSTEM.md` — Farben, Typographie, Spacing

### Build & Deploy
- **Build**: `tsx script/build.ts` (esbuild)
- **Dockerfile**: `docker/Dockerfile` — Multi-Stage Node 22 Alpine
- **Docker Compose**: `docker-compose.prod.yml` — App + DB + Nginx + Certbot + Backup
- **Nginx**: `docker/nginx/nginx.conf` — HTTPS Reverse Proxy
- **CI/CD**: `.github/workflows/ci.yml` (Lint/Build/Test), `deploy.yml` (SSH Deploy), `backup.yml` (Weekly)

---

## Datenbank-Tabellen

| Tabelle | Zweck |
|---------|-------|
| `users` | Benutzer (Rollen: admin, souschef, koch, fruehkoch, lehrling, abwasch, guest) |
| `session` | Express Sessions (connect-pg-simple) |
| `app_settings` | Key-Value App-Einstellungen |
| `locations` | Standorte: city (Küche City), sued (Küche SÜD), ak (Catering) |
| `recipes` | Rezepte mit Kategorie, Allergenen, Tags, Saison |
| `ingredients` | Zutaten pro Rezept |
| `master_ingredients` | Zutatenstammdaten mit Preisen + Lieferant |
| `fridges` | Kühlgeräte mit Temperatur-Bereichen |
| `haccp_logs` | Temperatur-Messungen |
| `guest_counts` | Gästezahlen pro Tag/Mahlzeit/Standort |
| `rotation_templates` | Rotations-Vorlagen (6-Wochen) |
| `rotation_slots` | Rezept-Zuordnungen in Rotation |
| `menu_plans` | Wochenplan-Einträge |
| `menu_plan_temperatures` | HACCP-Temperaturen pro Menüplan-Slot |
| `catering_events` | Catering-Events |
| `catering_menu_items` | Menüpunkte pro Event |
| `staff` | Mitarbeiter |
| `shift_types` | Schichttypen |
| `schedule_entries` | Dienstplan-Einträge |
| `tasks` | Tagesaufgaben |
| `task_templates` | Aufgaben-Vorlagen |
| `suppliers` | Lieferanten |
| `sub_recipe_links` | Rezept-in-Rezept Verknüpfungen |
| `guest_allergen_profiles` | Gäste-Allergenprofile |
| `push_subscriptions` | Web Push Subscriptions |
| `recipe_media` | Rezept-Fotos |
| `audit_logs` | Audit Trail (DSGVO) |

---

## Konventionen

### Datei-Benennung
- **Client Pages**: PascalCase (`MenuPlan.tsx`, `HaccpCompliance.tsx`)
- **Client Components**: PascalCase (`AllergenBadge.tsx`)
- **Client Hooks**: camelCase mit `use`-Prefix (`useTranslation.ts`)
- **Server Module**: kebab-case unter `server/modules/{domain}/` (`rotation-agent.ts`, `allergen-matrix.ts`)
- **Server Sonstige**: kebab-case direkt unter `server/` (`haccp-anomaly.ts`, `analytics.ts`)
- **Shared Module**: camelCase (`allergens.ts`, `constants.ts`)
- **Imports aus Modulen**: Immer über Barrel `server/modules/recipe` oder `server/modules/menu`

### Allergen-Codes (EU-Verordnung 1169/2011, AT-konform)
```
A = Glutenhaltiges Getreide    H = Schalenfrüchte
B = Krebstiere                 L = Sellerie
C = Eier                       M = Senf
D = Fisch                      N = Sesam
E = Erdnüsse                   O = Sulfite/Schwefeldioxid
F = Soja                       P = Lupinen
G = Milch/Laktose              R = Weichtiere
```
Definiert in `shared/allergens.ts`. 14 Codes (A-R, ohne I/J/K/Q).

### Rezept-Kategorien
```
ClearSoups, CreamSoups, MainMeat, MainFish, MainVegan,
Sides, ColdSauces, HotSauces, Salads, HotDesserts, ColdDesserts
```
Definiert in `shared/schema.ts` → `RECIPE_CATEGORIES`.

### Meal-Slots (pro Tag & Mahlzeit)
```
soup → Suppe
main1 → Fleisch/Fisch      side1a → Beilage 1a    side1b → Beilage 1b
main2 → Vegetarisch         side2a → Beilage 2a    side2b → Beilage 2b
dessert → Dessert
```
Definiert in `shared/constants.ts` → `MEAL_SLOTS`.

### Rezept-Tags (für Rotation-Agent)
- `stärke` — Stärkebeilage (Kartoffeln, Knödel, Reis, Nudeln...)
- `gemüse` — Gemüsebeilage
- `mehlspeise-garnitur` — Garnitur für Dessert-Hauptgerichte
- `kein-rotation` — Vom Auto-Fill ausgeschlossen

### Standorte
- `city` — Küche City (Default PAX: 60)
- `sued` — Küche SÜD (Default PAX: 45)
- `ak` — Catering (Default PAX: 80)

### TypeScript Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

### Tests
- **Unit**: `tests/server/*.test.ts`, `tests/shared/*.test.ts` (Vitest)
- **E2E**: `e2e/*.spec.ts` (Playwright)
- **Ausführen**: `npm test` (Unit), `npm run test:e2e` (E2E)
- **Coverage**: `npm run test:coverage` (Threshold: 60%)

---

## Agents & Automatisierung

### Rotation-Agent v2 (`server/modules/menu/rotation-agent.ts`)
AI Auto-Fill für 6-Wochen-Rotation mit kulinarischen Regeln:
- **DISH_META**: ~120 Einträge mit Metadaten (selfContained, dessertMain, preferredStarches, forbiddenStarches)
- **Shared Rule Templates**: PANIERT, BRATEN, GULASCH, GESCHNETZELTES, FISCH, SC (selfContained), DM (dessertMain)
- **STARCH_GROUPS**: 55 Stärkebeilagen → 9 Gruppen (reis, teig, knödel, kartoffel, nudel, getreide, polenta, risotto, dampfnudel)
- **getDishMeta()**: 3-stufig: Exact Name → Substring → Keyword-Regex Fallback
- **Regeln**: Paniertes nie mit Knödel, Braten immer mit Semmelknödel, Self-Contained ohne Stärkebeilage, Dessert-Mains ohne Stärke+Gemüse

### Claude AI Integration
- **API**: `@anthropic-ai/sdk` — Claude für Rezept-Import, Rotation-Optimierung, Allergen-Erkennung
- **Module**: `server/modules/recipe/llm-import.ts`, `server/modules/menu/smart-rotation.ts`, `server/modules/recipe/allergen-detection.ts`, `server/modules/recipe/suggestions.ts`

### Claude Code Agents (`.claude/agents/`)
- `devops-expert.md` — DevOps Spezialist
- `github-actions-expert.md` — CI/CD Spezialist
- `lingodotdev-i18n.md` — i18n Spezialist
- `monitoring-specialist.md` — Monitoring Experte
- `test-engineer.md` — Testing Spezialist

### GitHub Actions (`.github/workflows/`)
- `ci.yml` — Lint, Typecheck, Build, Test bei jedem Push
- `deploy.yml` — SSH Deploy auf Produktion bei Push auf `main`
- `backup.yml` — Wöchentliches DB-Backup (Sonntag 3:00 UTC)

---

## Scripts

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Dev-Server starten (Express + Vite HMR) |
| `npm run build` | Production Build (esbuild → `dist/`) |
| `npm start` | Production Server starten |
| `npm run check` | TypeScript Typecheck |
| `npm run db:push` | Schema auf Datenbank pushen |
| `npm run db:seed` | Demo-Daten seeden |
| `npm test` | Vitest Unit Tests |
| `npm run test:e2e` | Playwright E2E Tests |
| `npx tsx script/seed-recipe-pool.ts` | 335 Rezepte in DB seeden |
| `npx tsx script/seed-ingredients.ts` | 108 Rezepte mit Zutaten befüllen |
| `npx tsx script/batch-import-gutekueche.ts` | Rezeptdaten von gutekueche.at/chefkoch.de scrapen |
| `npx tsx script/batch-import-gutekueche.ts --dry-run` | Nur suchen, nicht in DB schreiben |
| `npx tsx script/batch-import-gutekueche.ts --limit 10` | Nur 10 Rezepte importieren |
| `npx tsx script/deduplicate.ts` | Rezept-Duplikate entfernen |

---

## Deployment

```bash
# Manuell via SSH
ssh -i ~/.ssh/id_ed25519 root@46.225.63.168
cd /opt/mise && git pull && \
  docker compose -f docker-compose.prod.yml build app && \
  docker compose -f docker-compose.prod.yml up -d app
```

Docker Compose Services: `app` (Node 22), `db` (PostgreSQL 16), `nginx` (Reverse Proxy + SSL), `certbot` (Let's Encrypt), `db-backup` (Daily Cron)

---

## Bekannte Probleme / TODOs

- ~~**Rotation braucht Template**: Template-Erstellung + Auswahl-UI jetzt in Rotation.tsx~~  ✅ Behoben
- ~~**routes.ts ist zu groß**: Aufgeteilt in 15 modulare Dateien unter `server/routes/`~~ ✅ Behoben
- **Seed-Script nicht im Docker-Image**: `script/` wird nicht ins Production-Image kopiert, Seeding muss via SQL oder temporärem Container erfolgen

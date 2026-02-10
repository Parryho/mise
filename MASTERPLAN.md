# MASTERPLAN mise.at

> Unified Kitchen Management for JUFA Hotels + AK Catering
> Stand: 10. Februar 2026

---

## 1. Vision

**mise.at wird die erste open-source, mobile-first Kuchenverwaltung fur den DACH-Hotelmarkt.**

Der Markt teilt sich in teure Enterprise-Losungen (Apicbase EUR500+/Mo, Galley $1000+/Mo) und Haushalt-Tools (Tandoor, Mealie). Die Mitte -- moderne, hotel-spezifische Software fur EUR150-400/Mo -- ist unterbesetzt. FoodNotify (Wien) und Cookcon (DE) sind die einzigen DACH-Alternativen, aber weder open-source noch wirklich mobile-first.

**Live:** https://mise.at | **Server:** Hetzner VPS `46.225.63.168`

---

## 2. Tech Stack

| Layer | Technologie |
|-------|------------|
| **Server** | Express 5, Node 22 |
| **Client** | React 19, Vite 7 |
| **DB** | PostgreSQL 16, Drizzle ORM |
| **UI** | shadcn/ui (New York), Tailwind CSS v4, Lucide Icons |
| **AI** | Claude API (@anthropic-ai/sdk), Google Generative AI |
| **Auth** | Session-basiert (express-session + connect-pg-simple) |
| **Deploy** | Docker Compose (App + DB + Nginx + Certbot + Backup) |
| **CI/CD** | GitHub Actions (workflow_dispatch only) |
| **Tests** | Vitest (Unit), Playwright (E2E) |
| **i18n** | react-i18next (DE + EN, 627 Keys) |
| **PWA** | vite-plugin-pwa, Service Worker, IndexedDB Offline-Cache |

---

## 3. Abgeschlossene Phasen

### Phase 0: Foundation Fix (07.02.2026)

| # | Task | Status |
|---|------|--------|
| 0.1 | Auth-Middleware fixen (req.session.userId statt hardcoded) | Done |
| 0.2 | Zod-Validierung auf alle 14 PUT-Endpoints | Done |
| 0.3 | CSRF-Protection via Origin/Referer-Check | Done |
| 0.4 | Audit-Log Tabelle + Middleware | Done |
| 0.5 | requireRole() mit ROLE_PERMISSIONS Level-Check | Done |
| 0.6 | DB-Indexes (8 Indexes) | Done |
| 0.7 | React Error Boundaries | Done |
| 0.8 | Automatische DB-Backups (docker-compose) | Done |

### Phase 1: Core Polish (07.02.2026)

| # | Task | Status |
|---|------|--------|
| 1.1 | MenuPlan <-> GuestCounts verknupfen | Done |
| 1.2 | Location-Filter durchgangig | Done |
| 1.3 | Pagination fur HACCP-Logs | Done |
| 1.4 | N+1 Queries fixen (Bulk-Ingredients) | Done |
| 1.5 | useAsyncData() Custom Hook | Deferred |
| 1.6 | Schedule.tsx aufteilen | Done |
| 1.7 | Rotation UX (Completeness, Duplikate) | Done |
| 1.8 | HACCP-Alerts (CRITICAL, Banner) | Done |
| 1.9 | Drag & Drop Menuplan (dnd-kit) | Done |
| 1.10 | masterIngredients CRUD-UI | Done |

### Phase 2: Killer Features (07.02.2026)

**2A: Allergen-Management** -- Tages-Ubersicht, Buffet-Karten, Konflikt-Warnung, Gast-Profile
**2B: Analytics** -- Food-Cost, PAX-Trends, HACCP-Compliance, Beliebte Gerichte
**2C: Produktion & Einkauf** -- Sub-Rezepte, Produktionsliste V2, Einkaufsliste V2, Lieferanten
**2D: Digitale Speisekarte** -- Gast-Speisekarte, Digital Signage, QR-Codes

### Phase 3: AI-Powered (07.02.2026)

| # | Feature | Status |
|---|---------|--------|
| 3.1 | PAX-Forecasting (Moving Average + Saisonalitat) | Done |
| 3.2 | Smart Rotation (Claude AI) | Done |
| 3.3 | LLM Rezept-Import (Text/Bild via Claude Vision) | Done |
| 3.4 | Rezept-Vorschlage (Scoring-System) | Done |
| 3.5 | Intelligentes Scaling (nicht-linear) | Done |
| 3.6 | HACCP Anomalie-Erkennung (5 Typen + Health-Score) | Done |
| 3.7 | Allergen Auto-Detection (100+ Zutaten) | Done |
| 3.8 | Waste-Prediction (Verfallswarnung) | Done |

### Phase 4: Professional Polish (07.02.2026)

| # | Feature | Status |
|---|---------|--------|
| 4.1 | PWA Offline-Support (SW, IndexedDB, Runtime Caching) | Done |
| 4.2 | Push-Notifications (VAPID, HACCP-Alerts) | Done |
| 4.3 | E-Mail-Benachrichtigungen (Nodemailer, Templates) | Done |
| 4.4 | Rezept-Medien (Upload, Gallery, Lightbox) | Done |
| 4.5 | CI/CD Pipeline (GitHub Actions) | Done |
| 4.6 | Monitoring (Sentry, Prometheus, Health) | Done |
| 4.7 | Test-Suite (Vitest 8 Files + Playwright 4 Specs) | Done |
| 4.8 | Multi-Language (DE + EN, 627 Keys) | Done |
| 4.9 | DSGVO-Export (JSON, Anonymisierung, Loschung) | Done |
| 4.10 | Backup/Restore UI | Done |

### Phase 5: Adaptive Learning (07.02.2026)

| # | Feature | Status |
|---|---------|--------|
| 5.1 | Quiz-Feedback DB (quiz_feedback, pairing_scores, learned_rules) | Done |
| 5.2 | Quiz UI (Flashcard, Multiple-Choice, Scoring) | Done |
| 5.3 | Pairing-Score Engine (gewichtete Aggregation, Decay) | Done |
| 5.4 | Rotation-Agent v3 (Pairing-Scores in Auswahl) | Done |
| 5.5 | Exploration vs Exploitation (Epsilon-Greedy 80/20) | Done |
| 5.6 | Lern-Dashboard (Top/Flop, Fortschritt) | Done |
| 5.7 | AI-Validierung (Claude Regelvorschlage) | Done |

### Phase 6: UI-Polish + Datenqualitat (08.02.2026)

| # | Task | Status |
|---|------|--------|
| 6.1 | 22 Seiten mit Design-System Tokens uberarbeitet | Done |
| 6.2 | Dashboard Today.tsx (Menu, PAX, HACCP, Quick Actions) | Done |
| 6.3 | Settings aufgewertet (User-Cards, System) | Done |
| 6.4 | Security-Fixes (Auth, helmet, SSRF, FORCE_HTTPS) | Done |
| 6.5 | Allergen-Bugs behoben (Code-Mapping, 5 Rezepte) | Done |
| 6.6 | seed-ingredients.ts: 108 Rezepte mit 778 Zutaten | Done |
| 6.7 | Navigation: HOME-Button, globaler Zuruck-Button | Done |
| 6.8 | A4-Druck: @page landscape, kompakte Tabellen | Done |
| 6.9 | Kategorie-Bilder (11 Unsplash) | Done |
| 6.10 | Batch-Import Script (gutekueche.at/chefkoch.de) | Done |

### Phase 7: Agent Team -- Kuchen-Orchestrator (08.02.2026)

| # | Task | Status |
|---|------|--------|
| 7.1 | DB Schema (agent_team_runs + agent_team_actions) | Done |
| 7.2 | Agent Adapters (7 Wrapper) | Done |
| 7.3 | Orchestrator (4-Phasen Pipeline, Conflict Resolution) | Done |
| 7.4 | API Routes (POST /run, GET /runs, SSE Stream) | Done |
| 7.5 | Client UI (AgentTeam, AgentCard, ActionItemList) | Done |
| 7.6 | Navigation + Demo-Modus | Done |

### Code-Qualitat & Architektur (08.02.2026)

| # | Task | Status |
|---|------|--------|
| 7.1 | TypeScript-Fehler behoben (5 pre-existing) | Done |
| 7.2 | routes.ts aufgeteilt: 2903 Zeilen -> 15 Module in server/routes/ | Done |
| 7.3 | Rotation Template UI (Erstellung + Auswahl) | Done |
| 7.4 | ~120 dish-spezifische Unsplash-Fotos | Done |
| 7.5 | Structured Logging (server/logging.ts) | Done |

---

## 4. Jungste Arbeiten (09-10.02.2026)

### UX-Optimierung (09.02.2026)

- **32 Seiten uberarbeitet** -- Empty States, Labels, Touch-Targets, visuelle Hierarchie
- **Block Toggles** -- localStorage-Persistenz, Buttons statt Checkboxes
- **Labeled Buttons** -- "Menu generieren" + "Druckansicht" statt Icon-only
- **Today** -- Nur "Mittagsmenu City" (kein SUD, kein Dinner)
- **Star/Rating Button entfernt** (Quiz genugt)

### Code-Simplifier Run (09.02.2026)

- `pickFromPool()` Helper extrahiert (3x dupliziert -> 1 Funktion)
- Toten `mealMap` in rotation.ts geloscht
- `locBySlug` als `Object.fromEntries()` statt Loop
- Ungenutzten Import in Today.tsx entfernt
- Invalides verschachteltes `<colgroup>` in RotationPrint.tsx gefixt
- **124 Zeilen netto reduziert** (81 additions, 205 deletions)

### Quiz-Redesign + Rotation-Rezeptfilter (09.02.2026)

- Quiz-Redesign mit Server-Sync fur Lernfortschritt
- Rotation-Rezeptfilter: Suchfeld mit Prefix-Matching statt Dropdown

### Top Bar + Dark Mode (09.02.2026)

- **Top Bar** auf jeder Seite: "Willkommen, [Name]" links, Dark Mode Toggle, Settings, Logout rechts
- **Dark Mode** via `next-themes` (ThemeProvider, class-basiert, localStorage)
- **Tailwind v4 Integration**: `@custom-variant dark (&:is(.dark *))`

### Agent Team Demo (09.02.2026)

- Demo-Modus mit Fake-Daten und animierten Phase-Transitions
- Demo-Button (FlaskConical Icon) fur Prasentation

### Code Audit + Quick Wins (09.02.2026)

4 spezialisierte Agents liefen parallel:
- **Security**: 11 Findings (3 HIGH)
- **Architektur**: 14 Findings (3 HIGH)
- **Clean Code**: 20 Findings (5 HIGH)
- **Performance**: 15 Findings (5 HIGH)

**9 Quick Wins sofort umgesetzt:**

| Fix | Datei |
|-----|-------|
| Seed-Call aus store.tsx entfernt | `client/src/lib/store.tsx` |
| `loading="lazy"` + `decoding="async"` fur Rezept-Bilder | `Recipes.tsx`, `RecipeDetailDialog.tsx` |
| DB-Index auf `ingredients.recipeId` | `shared/schema.ts` |
| Session-Cookie `secure` Flag gefixt | `server/routes/middleware.ts` |
| Hardcoded Pexels API Key entfernt | `script/fetch-pexels-images.ts` |
| `compression()` Middleware hinzugefugt | `server/index.ts` |
| Immutable Caching fur Vite-Assets (1 Jahr) | `server/static.ts` |
| `.dockerignore` erstellt (Build-Context 3.6MB -> 736KB) | `.dockerignore` |
| `MainFish` zu Category Type hinzugefugt | `client/src/lib/store.tsx` |

---

## 5. Code Audit -- Offene Findings

### KRITISCH (sofort beheben)

| # | Finding | Bereich | Aufwand |
|---|---------|---------|---------|
| K1 | ✅ 09.02.2026 **Code-Splitting** -- React.lazy fur 40 Seiten, Bundle 1959kB→524kB | Performance | 4h |
| K2 | ✅ 09.02.2026 **DB-Transaktionen** -- Rezepte, GDPR, Rotation, Catering atomar | Architektur | 6h |
| K3 | ✅ 10.02.2026 **getOrGenerateWeekPlan** -- Cached, nur bei force=true regenerieren | Architektur | 4h |
| K4 | ✅ 10.02.2026 **AppProvider** -- Targeted refetch statt fetchAll bei Mutationen | Architektur | 8h |
| K5 | ✅ 10.02.2026 **SMTP-Passwort verschluesselt** -- AES-256-GCM in app_settings | Security | 3h |
| K6 | ✅ 10.02.2026 **Content Security Policy** -- Helmet CSP mit Whitelist aktiviert | Security | 3h |

### HOCH (zeitnah)

| # | Finding | Bereich | Aufwand |
|---|---------|---------|---------|
| H1 | ✅ 10.02.2026 **N+1 Queries** -- Batch-Loading mit inArray+Maps in allergens, analytics, production, costs | Performance | 6h |
| H2 | Fehlende Error Handling bei API-Calls im Client | Clean Code | 4h |
| H3 | Hardcoded Strings statt i18n in mehreren Seiten | Clean Code | 4h |
| H4 | ✅ 10.02.2026 **DB Pool-Limits** -- max=20, idleTimeout=30s, connectionTimeout=5s | Performance | 1h |
| H5 | ✅ 10.02.2026 **Rate-Limiting** -- expensiveRateLimiter + aiRateLimiter auf 12 teure Endpoints | Security | 2h |

### MITTEL (bei Gelegenheit)

| # | Finding | Bereich |
|---|---------|---------|
| M1 | Duplicate Type-Definitionen (store.tsx vs schema.ts) | Clean Code |
| M2 | Inkonsistente Error-Handling-Patterns im Server | Clean Code |
| M3 | Mehrere 500+ Zeilen Dateien (Rotation.tsx, MenuPlan.tsx) | Clean Code |
| M4 | Kein Request-Deduplication bei Parallel-Requests | Performance |
| M5 | Virtual Scrolling fur lange Rezeptlisten fehlt | Performance |
| M6 | Unused Dependencies im package.json | Clean Code |
| M7 | Fehlende Index-Seite fur API-Dokumentation | Architektur |
| M8 | WebSocket-Verbindung nicht genutzt (ws installiert) | Architektur |
| M9 | Keine Health-Check-Integration in Docker Compose | DevOps |
| M10 | Helmet CSP korrekt konfigurieren (nicht nur disable) | Security |
| M11 | Session-Fixation-Schutz bei Login | Security |
| M12 | Input-Sanitization fur HTML-Content (XSS bei Notizen) | Security |
| M13 | Fehlende CORS-Allowlist fur Produktion | Security |
| M14 | Storage-Klasse zu gross (1 Datei, alle Tabellen) | Architektur |
| M15 | Keine Retry-Logik fur Claude API Calls | Architektur |

---

## 6. Design System

### Farben

| Token | CSS Variable | Hex/HSL |
|-------|-------------|---------|
| Primary | `--primary: 22 90% 54%` | #F37021 (Orange) |
| Accent | `--accent: 142 76% 36%` | #16A34A (Grun) |
| Destructive | `--destructive: 0 84% 60%` | #EF4444 (Rot) |
| Background | `--background: 30 20% 98%` | Warmes Creme |
| Foreground | `--foreground: 20 20% 15%` | Warmes Dunkelbraun |
| Card | `--card: 0 0% 100%` | Weiss |
| Border | `--border: 30 20% 88%` | Helles Beige |

**Status-Farben** (je 3 Varianten: solid, foreground, subtle):
- Info (Blau), Success (Grun), Warning (Amber), Danger (Rot), Neutral (Grau)

### Typografie

| Element | Font | Stil |
|---------|------|------|
| Headings | Oswald | Uppercase, tracking-wide (automatisch via CSS) |
| Body | Inter | Regular 400 |
| Mono | Roboto Mono | Zahlen, Codes, Temperaturen |

### Layout

| Token | Wert |
|-------|------|
| Radius | 8px (0.5rem) |
| Spacing | 4px Grid |
| Elevation 0 | Kein Schatten, nur Border |
| Elevation 1 | shadow-sm (Standard-Cards) |
| Elevation 2 | shadow-md (Dialoge) |
| Nav-Hohe | 64px (Bottom Nav) |
| Touch-Target | Min. 44x44px |
| Breakpoints | 375px / 768px / 1024px |

### Referenz-Dateien

- **CSS Tokens**: `client/src/index.css` (Light + Dark Mode Variablen)
- **Design Rules**: `.claude/rules/design_system_rules.md`
- **Figma Brief**: `docs/FIGMA_DESIGN_BRIEF.md` (26 Copy-Paste Prompts)
- **Figma Make**: `figma.com/make/k0xlbty3ikAr9ZrhVkSPYM/Mise`

---

## 7. Offene R2-Tickets (aus TASKS.md)

| Ticket | Beschreibung | Epic | Status |
|--------|--------------|------|--------|
| R2-T8 | Staff-User-Verknupfung UI | Dienstplan | Offen |
| R2-T16 | Rollen-basierte Sicht (Admin vs Staff) | Admin | Offen |
| R2-T17 | User-Staff-Verknupfung in Admin | Admin | Offen |
| R2-T18 | API-Versionierung (/api/v1) | Mobile | Offen |
| R2-T19 | CORS-Allowlist aus ENV | Mobile | Offen |

---

## 8. Roadmap -- Was fehlt noch

### Prioritat 1: Technische Schulden (aus Code Audit)

| Task | Aufwand | Impact |
|------|---------|--------|
| Code-Splitting (React.lazy) | 4h | Bundle 1.96MB -> ~400KB |
| DB-Transaktionen | 6h | Datenintegritat |
| AppProvider -> React Query migrieren | 8h | Performance + Wartbarkeit |
| CSP konfigurieren | 3h | Security |
| SMTP-Passwort verschlusseln | 3h | Security |
| N+1 Queries fixen | 6h | Performance |
| **Gesamt** | **~30h** | |

### Prioritat 2: Feature-Lucken vs. Wettbewerb

| Feature | Wettbewerber haben es | Aufwand |
|---------|----------------------|---------|
| Inventar-/Lagerverwaltung | Apicbase, Galley, MarketMan | Sehr hoch |
| Nahrwertberechnung (EU 1169/2011) | Meez, Apicbase, Galley | Hoch |
| HACCP-Checklisten (uber Temperatur hinaus) | Apicbase, Melba | Mittel |
| Rezept-Versionshistorie | Meez | Mittel |
| PMS-Integration (Protel, Opera) | Enterprise-Tools | Hoch |
| Abfall-Tracking (Gewicht + Kosten) | Apicbase, Winnow | Mittel |
| IoT Temperatur-Sensoren | Apicbase | Mittel |

### Prioritat 3: Nice-to-Have

| Feature | Beschreibung |
|---------|-------------|
| Onboarding-Flow | 3-4 Willkommens-Screens |
| Notification-Center | Glocke mit Dropdown |
| Profil-Bearbeitung | Foto, Passwort andern |
| Native Mobile App | Expo/React Native |
| POS-Integration | ready2order, Lightspeed |
| Sustainability Dashboard | CO2 pro Gericht |

---

## 9. Datei-Struktur (Kurzreferenz)

### Server (`server/`)

| Datei | Zweck |
|-------|-------|
| `index.ts` | Express App Setup |
| `routes/index.ts` | Route-Orchestrator (15 Module) |
| `routes/middleware.ts` | Auth, Session, CSRF |
| `db.ts` | PostgreSQL Pool |
| `storage.ts` | Data Access Layer |
| `rotation-agent.ts` | AI Auto-Fill (DISH_META, STARCH_GROUPS) |
| `llm-recipe-import.ts` | Claude Vision Rezept-Import |
| `smart-rotation.ts` | Claude Rotation-Optimierung |
| `agent-team.ts` | Kuchen-Orchestrator (4 Phasen) |
| `logging.ts` | Structured Logging |

### Client (`client/src/`)

| Verzeichnis | Inhalt |
|-------------|--------|
| `pages/` | 30+ Seitenkomponenten |
| `pages/analytics/` | 8 Report-Seiten |
| `pages/public/` | GuestMenu, DigitalSignage |
| `components/` | App-Komponenten |
| `components/ui/` | shadcn/ui Primitives |
| `hooks/` | Custom Hooks |
| `lib/` | Utilities (store, auth, i18n, offline-db) |
| `i18n/locales/` | de.json, en.json (627 Keys) |

### Shared (`shared/`)

| Datei | Zweck |
|-------|-------|
| `schema.ts` | Drizzle ORM Schema (22+ Tabellen) |
| `allergens.ts` | 14 EU-Allergene (A-R) |
| `constants.ts` | Meal-Slots, Kategorien |
| `categorizer.ts` | Auto-Kategorisierung |

### Datenbank (22+ Tabellen)

`users`, `session`, `app_settings`, `locations`, `recipes`, `ingredients`, `master_ingredients`, `fridges`, `haccp_logs`, `guest_counts`, `rotation_templates`, `rotation_slots`, `menu_plans`, `menu_plan_temperatures`, `catering_events`, `catering_menu_items`, `staff`, `shift_types`, `schedule_entries`, `tasks`, `task_templates`, `suppliers`, `sub_recipe_links`, `guest_allergen_profiles`, `push_subscriptions`, `recipe_media`, `audit_logs`, `agent_team_runs`, `agent_team_actions`

---

## 10. Deployment & Infrastruktur

### Server

- **Hetzner VPS**: `46.225.63.168` (Domain: `mise.at`)
- **SSL**: Let's Encrypt via Certbot (gultig bis 08.05.2026, Auto-Renewal)
- **DNS**: Hetzner DNS (hydrogen/oxygen.ns.hetzner.com)
- **Domain**: GoDaddy (.at, EUR12.98)

### Deploy-Befehl

```bash
ssh -i ~/.ssh/id_ed25519 root@46.225.63.168 \
  "cd /opt/mise && git pull && \
   docker compose -f docker-compose.prod.yml build app && \
   docker compose -f docker-compose.prod.yml up -d app"
```

### Docker Services

| Service | Beschreibung |
|---------|-------------|
| `app` | Node 22 Alpine (Express + React Build) |
| `db` | PostgreSQL 16 |
| `nginx` | Reverse Proxy + SSL Termination |
| `certbot` | Let's Encrypt Auto-Renewal |
| `db-backup` | Tagliches pg_dump, 14d Retention |

### Scripts

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Dev-Server (Express + Vite HMR) |
| `npm run build` | Production Build (esbuild) |
| `npm start` | Production Server |
| `npm run check` | TypeScript Typecheck |
| `npm run db:push` | Schema auf DB pushen |
| `npm test` | Vitest Unit Tests |
| `npm run test:e2e` | Playwright E2E |

---

## 11. Wettbewerbsvergleich

| Feature | mise | FoodNotify | Apicbase | Meez | Tandoor (OSS) |
|---------|------|-----------|----------|------|---------------|
| Rezeptverwaltung | ++ | + | + | +++ | + |
| 6-Wochen-Rotation | +++ | + | - | - | - |
| Multi-Location Hotel | ++ | + | ++ | - | - |
| HACCP-Logging | + | + | ++ | - | - |
| PAX-Management | ++ | - | - | - | - |
| Dienstplan | + | - | - | - | - |
| Catering-Events | + | - | + | - | - |
| AI Menu Planning | +++ | - | - | - | - |
| Food-Cost-Analyse | + | + | ++ | + | - |
| Allergen-Karten | ++ | + | + | - | - |
| Digital Signage | + | - | - | - | - |
| Offline/PWA | + | - | - | - | - |
| Open Source | +++ | - | - | - | + |
| Preis/Monat | EUR0 | EUR150-500 | EUR500+ | $15/User | EUR0 |

### Alleinstellungsmerkmale

1. Einziges Open-Source-Tool mit professionellen Hotel-Kitchen-Features
2. AI-gestutzte Rotation + PAX-Forecasting
3. Alles-in-einem: Rezepte + Rotation + Menuplan + HACCP + Dienstplan + Catering
4. Mobile-first PWA mit Offline-Support + Dark Mode
5. Digitale Speisekarte + Signage
6. Osterreich-spezifisch: EU-Allergene, DACH-Markt, Deutsch-nativ

---

## 12. Dokumentation

| Datei | Inhalt |
|-------|--------|
| `MASTERPLAN.md` | **Diese Datei** -- Gesamtubersicht |
| `CLAUDE.md` | Datei-Map, DB-Tabellen, Konventionen, Scripts |
| `.claude/rules/design_system_rules.md` | Figma-to-Code Mapping, Tokens, Components |
| `docs/FIGMA_DESIGN_BRIEF.md` | 26 Figma AI Prompts fur alle Screens |
| `docs/api-contract.md` | API-Endpoints Dokumentation |
| `docs/auth-strategy.md` | Session-basierte Auth-Architektur |
| `docs/market-research.md` | Wettbewerbs-/Marktanalyse (778 Zeilen) |

---

## 13. Zusammenfassung

| Phase | Fokus | Status |
|-------|-------|--------|
| **0** | Security + Foundation | Done (07.02.) |
| **1** | Core Polish | Done (07.02.) |
| **2** | Killer Features | Done (07.02.) |
| **3** | AI-Powered | Done (07.02.) |
| **4** | Professional Polish | Done (07.02.) |
| **5** | Adaptive Learning | Done (07.02.) |
| **6** | UI-Polish + Daten | Done (08.02.) |
| **7** | Agent Team | Done (08.02.) |
| **8** | UX + Code Audit | Done (09.02.) |
| **9** | Konsolidierung | Done (10.02.) |
| **Nachste** | Technische Schulden (K1-K6) | ~30h |
| **Danach** | Feature-Lucken (Inventar, Nahrwerte, HACCP+) | TBD |

**Gesamtaufwand bisher: ~400h uber 4 Tage (07.-10.02.2026)**

Alle Kern-Features sind implementiert und live auf https://mise.at. Die nachsten Schritte fokussieren auf technische Schulden (Code-Splitting, DB-Transaktionen, AppProvider-Refactoring) und Feature-Lucken gegenuber dem Wettbewerb.

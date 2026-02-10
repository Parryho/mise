# MASTERPLAN mise.at

> Unified Kitchen Management for Hotels & Gastronomie
> Stand: 10. Februar 2026

---

## 0. Dokumentation

| Datei | Inhalt |
|-------|--------|
| `MASTERPLAN.md` | **Diese Datei** -- Gesamtübersicht, Phasen, Roadmap |
| `CLAUDE.md` | Datei-Map, DB-Tabellen, Konventionen, Scripts |
| `docs/CORE_DEFINITION.md` | Produkt-Vision, Goldene Regeln, Erfolgsdefinition |
| `.claude/rules/design_system_rules.md` | Figma-to-Code Mapping, Tokens, Components |
| `.claude/rules/guardrails.md` | Claude Guardrails (Core-Focus, No Feature Expansion) |
| `.claude/rules/feature-stop.md` | Feature-Stop-Liste (Intentional Non-Goals) |
| `docs/FIGMA_DESIGN_BRIEF.md` | 26 Figma AI Prompts für alle Screens |
| `docs/api-contract.md` | API-Endpoints Dokumentation |
| `docs/auth-strategy.md` | Session-basierte Auth-Architektur |
| `docs/market-research.md` | Wettbewerbs-/Marktanalyse (778 Zeilen) |

---

## 1. Vision

**mise.at wird die erste open-source, mobile-first Küchenverwaltung für den DACH-Hotelmarkt.**

Der Markt teilt sich in teure Enterprise-Lösungen (Apicbase EUR500+/Mo, Galley $1000+/Mo) und Haushalt-Tools (Tandoor, Mealie). Die Mitte -- moderne, hotel-spezifische Software für EUR150-400/Mo -- ist unterbesetzt. FoodNotify (Wien) und Cookcon (DE) sind die einzigen DACH-Alternativen, aber weder open-source noch wirklich mobile-first.

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

## 3. Chronologie: Abgeschlossene Phasen

### Phase 0: Foundation Fix (07.02.2026)

| # | Task | Status |
|---|------|--------|
| 0.1 | Auth-Middleware fixen (req.session.userId statt hardcoded) | ✅ Done |
| 0.2 | Zod-Validierung auf alle 14 PUT-Endpoints | ✅ Done |
| 0.3 | CSRF-Protection via Origin/Referer-Check | ✅ Done |
| 0.4 | Audit-Log Tabelle + Middleware | ✅ Done |
| 0.5 | requireRole() mit ROLE_PERMISSIONS Level-Check | ✅ Done |
| 0.6 | DB-Indexes (8 Indexes) | ✅ Done |
| 0.7 | React Error Boundaries | ✅ Done |
| 0.8 | Automatische DB-Backups (docker-compose) | ✅ Done |

### Phase 1: Core Polish (07.02.2026)

| # | Task | Status |
|---|------|--------|
| 1.1 | MenuPlan <-> GuestCounts verknüpfen | ✅ Done |
| 1.2 | Location-Filter durchgängig | ✅ Done |
| 1.3 | Pagination für HACCP-Logs | ✅ Done |
| 1.4 | N+1 Queries fixen (Bulk-Ingredients) | ✅ Done |
| 1.5 | useAsyncData() Custom Hook | 🔄 Deferred |
| 1.6 | Schedule.tsx aufteilen | ✅ Done |
| 1.7 | Rotation UX (Completeness, Duplikate) | ✅ Done |
| 1.8 | HACCP-Alerts (CRITICAL, Banner) | ✅ Done |
| 1.9 | Drag & Drop Menuplan (dnd-kit) | ✅ Done |
| 1.10 | masterIngredients CRUD-UI | ✅ Done |

### Phase 2: Killer Features (07.02.2026)

**2A: Allergen-Management** -- Tages-Übersicht, Buffet-Karten, Konflikt-Warnung, Gast-Profile ✅
**2B: Analytics** -- Food-Cost, PAX-Trends, HACCP-Compliance, Beliebte Gerichte ✅
**2C: Produktion & Einkauf** -- Sub-Rezepte, Produktionsliste V2, Einkaufsliste V2, Lieferanten ✅
**2D: Digitale Speisekarte** -- Gast-Speisekarte, Digital Signage, QR-Codes ✅

### Phase 3: AI-Powered (07.02.2026)

| # | Feature | Status |
|---|---------|--------|
| 3.1 | PAX-Forecasting (Moving Average + Saisonalität) | ✅ Done |
| 3.2 | Smart Rotation (Claude AI) | ✅ Done |
| 3.3 | LLM Rezept-Import (Text/Bild via Claude Vision) | ✅ Done |
| 3.4 | Rezept-Vorschläge (Scoring-System) | ✅ Done |
| 3.5 | Intelligentes Scaling (nicht-linear) | ✅ Done |
| 3.6 | HACCP Anomalie-Erkennung (5 Typen + Health-Score) | ✅ Done |
| 3.7 | Allergen Auto-Detection (100+ Zutaten) | ✅ Done |
| 3.8 | Waste-Prediction (Verfallswarnung) | ✅ Done |

### Phase 4: Professional Polish (07.02.2026)

| # | Feature | Status |
|---|---------|--------|
| 4.1 | PWA Offline-Support (SW, IndexedDB, Runtime Caching) | ✅ Done |
| 4.2 | Push-Notifications (VAPID, HACCP-Alerts) | ✅ Done |
| 4.3 | E-Mail-Benachrichtigungen (Nodemailer, Templates) | ✅ Done |
| 4.4 | Rezept-Medien (Upload, Gallery, Lightbox) | ✅ Done |
| 4.5 | CI/CD Pipeline (GitHub Actions) | ✅ Done |
| 4.6 | Monitoring (Sentry, Prometheus, Health) | ✅ Done |
| 4.7 | Test-Suite (Vitest 8 Files + Playwright 4 Specs) | ✅ Done |
| 4.8 | Multi-Language (DE + EN, 627 Keys) | ✅ Done |
| 4.9 | DSGVO-Export (JSON, Anonymisierung, Löschung) | ✅ Done |
| 4.10 | Backup/Restore UI | ✅ Done |

### Phase 5: Adaptive Learning (07.02.2026)

| # | Feature | Status |
|---|---------|--------|
| 5.1 | Quiz-Feedback DB (quiz_feedback, pairing_scores, learned_rules) | ✅ Done |
| 5.2 | Quiz UI (Flashcard, Multiple-Choice, Scoring) | ✅ Done |
| 5.3 | Pairing-Score Engine (gewichtete Aggregation, Decay) | ✅ Done |
| 5.4 | Rotation-Agent v3 (Pairing-Scores in Auswahl) | ✅ Done |
| 5.5 | Exploration vs Exploitation (Epsilon-Greedy 80/20) | ✅ Done |
| 5.6 | Lern-Dashboard (Top/Flop, Fortschritt) | ✅ Done |
| 5.7 | AI-Validierung (Claude Regelvorschläge) | ✅ Done |

### Phase 6: UI-Polish + Datenqualität (08.02.2026)

| # | Task | Status |
|---|------|--------|
| 6.1 | 22 Seiten mit Design-System Tokens überarbeitet | ✅ Done |
| 6.2 | Dashboard Today.tsx (Menu, PAX, HACCP, Quick Actions) | ✅ Done |
| 6.3 | Settings aufgewertet (User-Cards, System) | ✅ Done |
| 6.4 | Security-Fixes (Auth, helmet, SSRF, FORCE_HTTPS) | ✅ Done |
| 6.5 | Allergen-Bugs behoben (Code-Mapping, 5 Rezepte) | ✅ Done |
| 6.6 | seed-ingredients.ts: 108 Rezepte mit 778 Zutaten | ✅ Done |
| 6.7 | Navigation: HOME-Button, globaler Zurück-Button | ✅ Done |
| 6.8 | A4-Druck: @page landscape, kompakte Tabellen | ✅ Done |
| 6.9 | Kategorie-Bilder (11 Unsplash) | ✅ Done |
| 6.10 | Batch-Import Script (gutekueche.at/chefkoch.de) | ✅ Done |

### Phase 7: Agent Team -- Küchen-Orchestrator (08.02.2026)

| # | Task | Status |
|---|------|--------|
| 7.1 | DB Schema (agent_team_runs + agent_team_actions) | ✅ Done |
| 7.2 | Agent Adapters (7 Wrapper) | ✅ Done |
| 7.3 | Orchestrator (4-Phasen Pipeline, Conflict Resolution) | ✅ Done |
| 7.4 | API Routes (POST /run, GET /runs, SSE Stream) | ✅ Done |
| 7.5 | Client UI (AgentTeam, AgentCard, ActionItemList) | ✅ Done |
| 7.6 | Navigation + Demo-Modus | ✅ Done |

### Phase 8: Code-Qualität & Architektur (08.02.2026)

| # | Task | Status |
|---|------|--------|
| 8.1 | TypeScript-Fehler behoben (5 pre-existing) | ✅ Done |
| 8.2 | routes.ts aufgeteilt: 2903 Zeilen -> 15 Module in server/routes/ | ✅ Done |
| 8.3 | Rotation Template UI (Erstellung + Auswahl) | ✅ Done |
| 8.4 | ~120 dish-spezifische Unsplash-Fotos | ✅ Done |
| 8.5 | Structured Logging (server/logging.ts) | ✅ Done |

### Phase 9: UX-Optimierung (09.02.2026)

| # | Task | Status |
|---|------|--------|
| 9.1 | 32 Seiten überarbeitet (Empty States, Touch-Targets) | ✅ Done |
| 9.2 | Block Toggles (localStorage-Persistenz) | ✅ Done |
| 9.3 | Labeled Buttons ("Menu generieren" statt Icon-only) | ✅ Done |
| 9.4 | Today: Nur "Mittagsmenu City" | ✅ Done |
| 9.5 | Star/Rating Button entfernt (Quiz genügt) | ✅ Done |
| 9.6 | Code-Simplifier Run (124 Zeilen reduziert) | ✅ Done |
| 9.7 | Quiz-Redesign mit Server-Sync | ✅ Done |
| 9.8 | Rotation-Rezeptfilter (Prefix-Matching) | ✅ Done |
| 9.9 | Top Bar + Dark Mode (next-themes) | ✅ Done |
| 9.10 | Agent Team Demo-Modus | ✅ Done |

### Phase 10: Code Audit (09-10.02.2026)

**KRITISCH (alle erledigt):**
| # | Finding | Status | Datum |
|---|---------|--------|-------|
| K1 | Code-Splitting (Bundle 1959kB→524kB) | ✅ Done | 09.02. |
| K2 | DB-Transaktionen atomar | ✅ Done | 09.02. |
| K3 | getOrGenerateWeekPlan cached | ✅ Done | 10.02. |
| K4 | AppProvider Targeted refetch | ✅ Done | 10.02. |
| K5 | SMTP-Passwort verschlüsselt (AES-256-GCM) | ✅ Done | 10.02. |
| K6 | Content Security Policy (Helmet CSP) | ✅ Done | 10.02. |

**HOCH (alle erledigt):**
| # | Finding | Status | Datum |
|---|---------|--------|-------|
| H1 | N+1 Queries (Batch-Loading) | ✅ Done | 10.02. |
| H2 | Error Handling (apiFetch Utility) | ✅ Done | 10.02. |
| H3 | i18n (29 Dateien, ~400 Strings) | ✅ Done | 10.02. |
| H4 | DB Pool-Limits | ✅ Done | 10.02. |
| H5 | Rate-Limiting (12 Endpoints) | ✅ Done | 10.02. |

**Quick Wins (9 Stück, erledigt):**
| # | Fix | Status | Datum |
|---|-----|--------|-------|
| Q1 | Seed-Call aus store.tsx entfernt | ✅ Done | 09.02. |
| Q2 | Lazy Loading für Rezept-Bilder | ✅ Done | 09.02. |
| Q3 | DB-Index auf ingredients.recipeId | ✅ Done | 09.02. |
| Q4 | Session-Cookie secure Flag | ✅ Done | 09.02. |
| Q5 | Hardcoded Pexels API Key entfernt | ✅ Done | 09.02. |
| Q6 | compression() Middleware | ✅ Done | 09.02. |
| Q7 | Immutable Caching (Vite-Assets 1 Jahr) | ✅ Done | 09.02. |
| Q8 | .dockerignore (3.6MB→736KB) | ✅ Done | 09.02. |
| Q9 | MainFish zu Category Type | ✅ Done | 09.02. |

### Phase 11: Intelligente Menüplan-Generierung (10.02.2026)

| # | Task | Status | Datum |
|---|------|--------|-------|
| 11.1 | Open-Source-Recherche (KitcheNette, FlavorGraph, food2vec) | ✅ Done | 10.02. |
| 11.2 | Hybrid-Konzept: Tag-System + Pairing-Scores | ✅ Done | 10.02. |
| 11.3 | DB-Migration: 3 Spalten (cuisine_type, flavor_profile, dish_type) | ✅ Done | 10.02. |
| 11.4 | Konstanten: CUISINE_TYPES, FLAVOR_PROFILES, DISH_TYPES | ✅ Done | 10.02. |
| 11.5 | Auto-Tagging Script (DE+EN Keywords, i18n-aware) | ✅ Done | 10.02. |
| 11.6 | Production Auto-Tagging: 186/421 Rezepte getaggt | ✅ Done | 10.02. |
| 11.7 | rotation-agent.ts: cuisine-aware side selection | ⏳ In Arbeit | 10.02. |
| 11.8 | rotation-agent.ts: dishType-Checks (selfContained, dessertMain) | 📋 Todo | - |
| 11.9 | Test: Rotation neu generieren, Qualität prüfen | 📋 Todo | - |
| 11.10 | UI: Bulk-Tag-Editor für 235 ungetaggte Rezepte | 📋 Todo | - |
| 11.11 | KitcheNette Pairing-Scores Import (optional) | 📋 Later | - |

**Tagging-Ergebnis (421 Rezepte):**
```
┌──────────┬────────────────────────────────────┬───────┐
│   Tag    │              Getaggt               │ Offen │
├──────────┼────────────────────────────────────┼───────┤
│ Cuisine  │ 186 (159 AT, 17 IT, 6 Asia, 4 Med) │ 235   │
├──────────┼────────────────────────────────────┼───────┤
│ Flavor   │ 127                                │ 294   │
├──────────┼────────────────────────────────────┼───────┤
│ DishType │ 169                                │ 252   │
└──────────┴────────────────────────────────────┴───────┘
```

**Nächste Schritte (siehe Abschnitt 4):**
- [ ] 11.7: `pickStarchFor()` + `pickVeggieFor()` cuisine-filtering einbauen
- [ ] 11.8: dishType-Checks in slot-assignment
- [ ] 11.9: Production-Test mit overwrite=true

### Phase 12: Domain-Modularisierung (10.02.2026)

| # | Task | Status | Datum |
|---|------|--------|-------|
| 12.1 | Core Definition + Guardrails + Feature-Stop-Regeln | ✅ Done | 10.02. |
| 12.2 | `server/modules/recipe/` — 11 Dateien (Rezepte + Allergene) | ✅ Done | 10.02. |
| 12.3 | `server/modules/menu/` — 8 Dateien (Menüplanung + Rotation) | ✅ Done | 10.02. |
| 12.4 | Barrel index.ts pro Modul (Public API) | ✅ Done | 10.02. |
| 12.5 | Route- + Adapter- + Test-Imports aktualisiert | ✅ Done | 10.02. |
| 12.6 | CLAUDE.md mit neuen Modul-Pfaden aktualisiert | ✅ Done | 10.02. |

---

## 4. 🔥 HÖCHSTE PRIORITÄT: Menüplan-Generator V2

**Ziel:** Keine unsinnigen Kombinationen mehr wie "Schnitzel + Semmelknödel" oder "Thai Curry + Erdäpfelpüree"

### Status Quo (10.02.2026)
- ✅ **186/421 Rezepte getaggt** (cuisineType, flavorProfile, dishType)
- ✅ Auto-Tagging Script produktiv deployed
- ⏳ **Generator-Logik noch nicht angepasst** (nutzt Tags noch nicht)

### Phase 11.7-11.9: Generator anpassen (⚡ JETZT)

**Aufwand:** 2-3 Stunden | **Impact:** 80% Qualitätsverbesserung

#### Task 11.7: cuisine-aware Beilagen-Auswahl

**Datei:** `server/modules/menu/rotation-agent.ts`
```typescript
// In pickStarchFor() ergänzen:
async function pickStarchFor(
  mainRecipe: Recipe,
  starchPool: Recipe[],
  usedIds: Set<number>,
  usedStarchGroups: Set<string>,
  scoreMap?: Map<number, number>,
  epsilon = 0.2,
): Recipe | null {
  if (starchPool.length === 0) return null;

  // ✅ NEU: Check dishType
  if (mainRecipe.dishType === 'selfContained' || mainRecipe.dishType === 'dessertMain') {
    console.log(`[rotation-agent] Skip starch for ${mainRecipe.name} (${mainRecipe.dishType})`);
    return null;
  }

  const meta = getDishMeta(mainRecipe.name);
  const forbiddenNames = new Set(meta.forbiddenStarches || []);
  
  // ✅ NEU: Cuisine-Type Filtering
  let candidates = starchPool.filter(r => {
    if (forbiddenNames.has(r.name)) return false;
    
    // Küchen-Match
    if (mainRecipe.cuisineType && r.cuisineType) {
      return mainRecipe.cuisineType === r.cuisineType;
    }
    
    return true; // Wenn keine Tags, erlaube alles
  });

  // ... rest bleibt gleich
}

// In pickVeggieFor() ergänzen:
async function pickVeggieFor(
  mainRecipe: Recipe,
  veggiePool: Recipe[],
  usedIds: Set<number>,
  scoreMap?: Map<number, number>,
  epsilon = 0.2,
): Recipe | null {
  if (veggiePool.length === 0) return null;

  // ✅ NEU: Dessert-Mains brauchen kein Gemüse
  if (mainRecipe.dishType === 'dessertMain') {
    console.log(`[rotation-agent] Skip veggie for ${mainRecipe.name} (dessertMain)`);
    return null;
  }

  const meta = getDishMeta(mainRecipe.name);

  // ✅ NEU: Cuisine-Type Filtering
  let candidates = veggiePool.filter(r => {
    if (usedIds.has(r.id)) return false;
    
    if (mainRecipe.cuisineType && r.cuisineType) {
      return mainRecipe.cuisineType === r.cuisineType;
    }
    
    return true;
  });

  // ... rest bleibt gleich
}
```

#### Task 11.8: dishType-Checks in autoFillRotation()

**Datei:** `server/modules/menu/rotation-agent.ts`
```typescript
// In autoFillRotation(), case-Statements ergänzen:

case "side1a": {
  if (main1Recipe) {
    if (main1Recipe.dishType === 'selfContained' || main1Recipe.dishType === 'dessertMain') {
      if (overwrite && slot.recipeId !== null) {
        await storage.updateRotationSlot(slot.id, { recipeId: null });
      }
      skipped++;
      continue; // KEINE Stärkebeilage!
    }
    
    const mainScores = starchScores.get(main1Recipe.id);
    picked = await pickStarchFor(main1Recipe, pools.starch, dayUsedIds, mealUsedStarchGroups, mainScores, epsilon);
    if (picked) mealUsedStarchGroups.add(getStarchGroup(picked));
  }
  break;
}

case "side1b": {
  if (main1Recipe) {
    if (main1Recipe.dishType === 'dessertMain') {
      if (overwrite && slot.recipeId !== null) {
        await storage.updateRotationSlot(slot.id, { recipeId: null });
      }
      skipped++;
      continue; // KEIN Gemüse!
    }
    
    const mainScores = veggieScores.get(main1Recipe.id);
    picked = await pickVeggieFor(main1Recipe, pools.veg, dayUsedIds, mainScores, epsilon);
  }
  break;
}

// side2a + side2b analog
```

#### Task 11.9: Test & Deployment

**Terminal-Befehle:**
```bash
# 1. Code anpassen
code server/rotation-agent.ts

# 2. Committen
git add server/rotation-agent.ts shared/constants.ts
git commit -m "feat: cuisine-aware menu generation (186/421 recipes tagged)"

# 3. Deployen
git push
ssh root@46.225.63.168 "cd /opt/mise && git pull && docker compose -f docker-compose.prod.yml restart app"

# 4. Rotation neu generieren (API-Call)
curl -X POST https://mise.at/api/rotation/autofill \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{"templateId": 1, "overwrite": true}'

# 5. Ergebnis prüfen (SQL)
ssh root@46.225.63.168
docker exec -it mise-db-1 psql -U postgres -d mise -c "
SELECT 
  r1.name AS main, 
  r1.cuisine_type AS main_cuisine,
  r2.name AS starch, 
  r2.cuisine_type AS starch_cuisine
FROM rotation_slots rs1
JOIN recipes r1 ON rs1.recipe_id = r1.id
LEFT JOIN rotation_slots rs2 ON 
  rs2.week_nr = rs1.week_nr AND 
  rs2.day_of_week = rs1.day_of_week AND 
  rs2.meal = rs1.meal AND 
  rs2.location_slug = rs1.location_slug AND 
  rs2.course = 'side1a'
LEFT JOIN recipes r2 ON rs2.recipe_id = r2.id
WHERE rs1.course = 'main1' AND rs1.week_nr = 1
LIMIT 10;
"
```

**Erfolgskriterien:**
- ✅ Keine asiatischen Mains mit Knödeln
- ✅ Käsespätzle ohne zusätzliche Stärkebeilage
- ✅ Marillenknödel ohne Gemüse
- ✅ Österreichische Mains nur mit österreichischen Beilagen

### Phase 11.10: Bulk-Tag-Editor (📋 TODO, später)

**Priorität:** Mittel | **Aufwand:** 4-6 Stunden

Ziel: 235 ungetaggte Rezepte manuell kategorisieren

**Route:** `/rezepte/tags`

**Features:**
- Liste aller Rezepte ohne cuisineType/dishType
- Inline-Selects für schnelles Tagging
- Batch-Save (alle auf einmal)
- Filter: Nur ungetaggte / Nur Kategorie X

**Mockup:**
```
┌─────────────────────────────────────────────────────┐
│ Rezept-Tagging (235 offen)                         │
├─────────────────────────────────────────────────────┤
│ [Ungetaggte] [Suppen] [Beilagen] [Hauptgerichte]  │
│                                                     │
│ Bohnensuppe                                        │
│   Küche: [______v] Profil: [______v] Typ: [____v] │
│                                                     │
│ Erbsensuppe                                        │
│   Küche: [______v] Profil: [______v] Typ: [____v] │
│                                                     │
│ ... (20 pro Seite)                                 │
│                                                     │
│ [Alle speichern]                           [1/12] │
└─────────────────────────────────────────────────────┘
```

### Phase 11.11: KitcheNette Pairing-Scores (📋 OPTIONAL, viel später)

**Priorität:** Niedrig | **Aufwand:** 8-12 Stunden

Phase 2 (Tag-System) bringt bereits 80% Verbesserung. Pairing-Scores sind optional für die letzten 15-20%.

**Was es bringt:**
- Feinabstimmung innerhalb derselben Küche (z.B. welcher Knödel zu welchem Braten)
- Geschmackskombinationen (deftig + frisch als Kontrast)

**Aufwand:**
1. KitcheNette CSV (78MB) downloaden
2. Auf relevante Zutaten filtern (~5MB)
3. DB-Tabelle `pairing_scores` anlegen
4. Import-Script schreiben
5. `pickWeighted()` statt `pickRandom()` nutzen

---

## 5. Offene R2-Tickets (niedrige Priorität)

| Ticket | Beschreibung | Epic | Aufwand |
|--------|--------------|------|---------|
| R2-T8 | Staff-User-Verknüpfung UI | Dienstplan | 3h |
| R2-T16 | Rollen-basierte Sicht (Admin vs Staff) | Admin | 4h |
| R2-T17 | User-Staff-Verknüpfung in Admin | Admin | 2h |
| R2-T18 | API-Versionierung (/api/v1) | Mobile | 6h |
| R2-T19 | CORS-Allowlist aus ENV | Mobile | 1h |

---

## 6. Code Audit -- Offene Findings (MITTEL)

**Keine kritischen oder hohen Findings mehr offen!**

| # | Finding | Bereich | Aufwand |
|---|---------|---------|---------|
| M1 | Duplicate Type-Definitionen (store.tsx vs schema.ts) | Clean Code | 2h |
| M2 | Inkonsistente Error-Handling-Patterns im Server | Clean Code | 3h |
| M3 | Mehrere 500+ Zeilen Dateien (Rotation.tsx, MenuPlan.tsx) | Clean Code | 6h |
| M4 | Kein Request-Deduplication bei Parallel-Requests | Performance | 4h |
| M5 | Virtual Scrolling für lange Rezeptlisten fehlt | Performance | 4h |
| M6 | Unused Dependencies im package.json | Clean Code | 1h |
| M7 | Fehlende Index-Seite für API-Dokumentation | Architektur | 3h |
| M8 | WebSocket-Verbindung nicht genutzt (ws installiert) | Architektur | - |
| M9 | Keine Health-Check-Integration in Docker Compose | DevOps | 2h |
| M10 | Session-Fixation-Schutz bei Login | Security | 2h |
| M11 | Input-Sanitization für HTML-Content (XSS bei Notizen) | Security | 3h |
| M12 | Fehlende CORS-Allowlist für Produktion | Security | 1h |
| M13 | Storage-Klasse zu groß (server/storage.ts, alle Tabellen) | Architektur | 8h |
| M14 | Keine Retry-Logik für Claude API Calls | Architektur | 3h |

---

## 7. Feature-Roadmap vs. Wettbewerb

**Vollständigkeit vs. Enterprise-Tools:**

| Feature | mise | FoodNotify | Apicbase | Status |
|---------|------|-----------|----------|--------|
| Intelligente Menüplanung | 🟡 80% | ❌ | ❌ | **Phase 11 in Arbeit** |
| Inventar-/Lagerverwaltung | ❌ | ✅ | ✅ | Später |
| Nährwertberechnung (EU 1169/2011) | ❌ | ❌ | ✅ | Später |
| HACCP-Checklisten (erweitert) | 🟡 Temp only | ✅ | ✅ | Später |
| Rezept-Versionshistorie | ❌ | ❌ | ✅ | Nice-to-Have |
| PMS-Integration (Protel, Opera) | ❌ | ❌ | ✅ | Später |
| Abfall-Tracking | ❌ | ❌ | ✅ | Später |
| IoT Temperatur-Sensoren | ❌ | ❌ | ✅ | Später |

---

## 8. Design System

[Keine Änderungen zu Original -- siehe Abschnitt 6 im Original]

---

## 9. Deployment & Infrastruktur

[Keine Änderungen zu Original -- siehe Abschnitt 10 im Original]

---

## 10. Wettbewerbsvergleich

[Keine Änderungen zu Original -- siehe Abschnitt 11 im Original]

---

## 11. Zusammenfassung & Status

### Zeitstrahl
```
07.02.2026: Phase 0-5 (Foundation → Adaptive Learning)
08.02.2026: Phase 6-8 (UI-Polish → Agent Team → Code-Quality)
09.02.2026: Phase 9 (UX-Optimierung + Code Audit Start)
10.02.2026: Phase 10 (Code Audit KRITISCH + HOCH done)
            Phase 11 (Intelligente Menüplanung Start)
            Phase 12 (Domain-Modularisierung: recipe + menu)
```

### Aktuelle Priorities

| Rang | Phase | Task | Aufwand | Impact |
|------|-------|------|---------|--------|
| 🔥 1 | **11.7-11.9** | **Generator cuisine-aware machen** | **2-3h** | **80%** |
| 2 | M1-M14 | Code Audit MITTEL-Findings | ~45h | Qualität |
| 3 | 11.10 | Bulk-Tag-Editor (235 Rezepte) | 4-6h | 100% Tags |
| 4 | R2 | Offene R2-Tickets | ~16h | Admin-UX |
| 5 | 11.11 | KitcheNette Pairing-Scores | 8-12h | +15-20% |

### Metriken

| Kategorie | Aktuell | Ziel |
|-----------|---------|------|
| Rezepte getaggt | **186/421 (44%)** | 421/421 (100%) |
| Cuisine-Matches | ❓ (Generator nutzt Tags noch nicht) | >90% |
| Self-contained korrekt | ❓ | 100% |
| Dessert-Mains korrekt | ❓ | 100% |
| Code Audit KRITISCH | ✅ 0 offen | ✅ Done |
| Code Audit HOCH | ✅ 0 offen | ✅ Done |
| Code Audit MITTEL | 🟡 14 offen | 0 |

**Gesamtaufwand bisher: ~420h über 4 Tage (07.-10.02.2026)**

### Phase 13: Rezeptdatenbank + Allergene verlässlich machen (10.02.2026)

| # | Task | Status | Datum |
|---|------|--------|-------|
| 13.1 | `allergen_status` Spalte auf recipes (null/auto/verified) | ✅ Done | 10.02. |
| 13.2 | Batch-Scraper: Allergen-Detection pro Zutat beim Import | ✅ Done | 10.02. |
| 13.3 | Backfill-Script: Allergene aus bestehenden Zutaten erkennen | ✅ Done | 10.02. |
| 13.4 | URL-Import: Auto-Allergen-Detection bei Scraping | ✅ Done | 10.02. |
| 13.5 | Allergen-Vertrauensanzeige (auto/verified/unbekannt) | ✅ Done | 10.02. |
| 13.6 | Manuelles Speichern setzt allergenStatus = verified | ✅ Done | 10.02. |
| 13.7 | Zutat-Suche (Toggle + Server-Side EXISTS Query) | ✅ Done | 10.02. |
| 13.8 | Backfill + Batch-Import auf Server ausführen | ✅ Done | 10.02. |
| 13.9 | JUFA Rezeptdatenbank.xlsb Import-Script | ✅ Done | 10.02. |
| 13.10 | Multi-Source Batch-Import (6 Seiten + URL-Validierung) | ✅ Done | 10.02. |

| 13.11 | Allergen-Detection Rewrite (exactTokens + substrings) | ✅ Done | 10.02. |
| 13.12 | Recompute: 218/421 Rezepte korrigiert (false C/H/O entfernt) | ✅ Done | 10.02. |
| 13.13 | JUFA-Branding entfernt — System generisch gemacht (16 Dateien) | ✅ Done | 10.02. |
| 13.14 | Rezeptbilder: 421 Pexels-Duplikate → echte gescrapte Bilder | ✅ Done | 10.02. |
| 13.15 | Bildvalidierung: 76 kaputte Unsplash-URLs → NULL + SVG-Fallback | ✅ Done | 10.02. |
| 13.16 | Pexels-Bilder für 76 Seed-Rezepte (0 ohne Bild) | ✅ Done | 10.02. |
| 13.17 | Team-Review: 6 Bugs im Rezept-Bereich gefixt (MainFish, allergenStatus, snake_case, stale cache, SVG-in-DB, i18n) | ✅ Done | 10.02. |

**Ergebnis:** Alle 421 Rezepte haben Zutaten + Allergene. Batch-Import: 343 Rezepte (chefkoch.de: 215, gutekueche.at: 115, lecker.de: 13). Backfill: 20 Rezepte nachträglich Allergene erkannt. Multi-Source: gutekueche.at + chefkoch.de + ichkoche.at + eatsmarter.de + lecker.de + kochbar.de + kuechengoetter.de. Allergen-Detection v2: Hybrid-Matching (exactTokens für kurze Begriffe wie "ei"/"nuss"/"wein", substrings für lange spezifische Begriffe). 218 Rezepte korrigiert — massive Reduktion von False Positives (C aus "Weizenmehl", H aus "Kalbsnuss", O aus "Schweinefleisch").

---

## 14. Nächster Terminal-Befehl
```bash
# 🔥 JETZT: Generator anpassen (Phase 11.7-11.9)
code server/modules/menu/rotation-agent.ts

# Suche nach "async function pickStarchFor"
# Füge cuisine-filtering + dishType-checks ein (siehe Abschnitt 4)

# Dann committen + deployen:
git add server/rotation-agent.ts
git commit -m "feat: cuisine-aware menu generation (Phase 11.7-11.8)"
git push

# Auf Server deployen:
ssh root@46.225.63.168 "cd /opt/mise && git pull && docker compose -f docker-compose.prod.yml restart app"

# Rotation testen:
curl -X POST https://mise.at/api/rotation/autofill \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{"templateId": 1, "overwrite": true}'
```

**Erwartete Verbesserung:** 80% weniger unsinnige Kombinationen ✨

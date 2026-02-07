# MASTERPLAN mise.at

> Unified Kitchen Management for JUFA Hotels + AK Catering
> Stand: Februar 2026

---

## Vision

**mise.at wird die erste open-source, mobile-first Küchenverwaltung für den DACH-Hotelmarkt.**

Der Markt teilt sich in teure Enterprise-Lösungen (Apicbase €500+/Mo, Galley $1000+/Mo) und Haushalt-Tools (Tandoor, Mealie). Die Mitte — moderne, hotel-spezifische Software für €150-400/Mo — ist unterbesetzt. FoodNotify (Wien) und Cookcon (DE) sind die einzigen DACH-Alternativen, aber weder open-source noch wirklich mobile-first.

mise hat bereits: React 19 + Express 5 + PostgreSQL + Drizzle ORM, Multi-Location (City/SÜD/AK), 6-Wochen-Rotation, HACCP, Catering, PAX, Dienstplan, 250+ Rezepte. **Kein Open-Source-Projekt kommt auch nur annähernd an diese Feature-Kombination.**

---

## Status Quo: Was funktioniert, was nicht

### ✓ Stärken
- Saubere Architektur (server/client/shared)
- Moderner Stack mit TypeScript durchgehend
- 250+ österreichische Rezepte mit Kategorien + Allergenen
- 6-Wochen-Rotation mit Auto-Fill Agent
- HACCP-Logging mit PDF-Export
- Rezept-Import (URL-Scraping + Bulk-JSON)
- Multi-Location DB-Struktur (City, SÜD, AK)
- Design System dokumentiert (DESIGN_SYSTEM.md)
- Mobile-responsive mit Bottom-Nav

### ✗ Kritische Probleme
1. **Auth-Middleware kaputt** — gibt IMMER Admin zurück (routes.ts:149)
2. **Keine Input-Validierung** auf PUT-Endpoints
3. **Kein Audit-Log** — HACCP-Compliance-Risiko
4. **MenuPlan ↔ GuestCounts nicht verknüpft** — manuelle Portionseingabe
5. **masterIngredients-Tabelle verwaist** — nie in der API verwendet
6. **Keine Pagination** — alle Listen ohne Limit
7. **Schedule.tsx 43KB** — muss aufgeteilt werden
8. **Reports-Seite leer** — nur 3 Links, keine Inhalte

---

## Phasen-Plan

### Phase 0: FOUNDATION FIX (Woche 1-2) ✅ ERLEDIGT
> Sicherheit + Datenintegrität — **Pflicht vor Production**

| # | Task | Aufwand | Prio | Status |
|---|------|---------|------|--------|
| 0.1 | **Auth-Middleware fixen** — `req.session.userId` statt hardcoded Admin | 3h | KRITISCH | ✅ Done |
| 0.2 | **Zod-Validierung** auf alle 14 PUT-Endpoints | 5h | KRITISCH | ✅ Done |
| 0.3 | **CSRF-Protection** via Origin/Referer-Check Middleware | 3h | KRITISCH | ✅ Done |
| 0.4 | **Audit-Log Tabelle + Middleware** — `auditLogs` Table + API + Calls auf User/Recipe/HACCP | 10h | KRITISCH | ✅ Done |
| 0.5 | **requireRole() fixen** — echte Rollenprüfung mit `ROLE_PERMISSIONS` Level-Check | 3h | KRITISCH | ✅ Done |
| 0.6 | **DB-Indexes** — 8 Indexes auf recipes, guestCounts, menuPlans, scheduleEntries, haccpLogs, rotationSlots | 2h | HOCH | ✅ Done |
| 0.7 | **Error Boundaries** — React ErrorBoundary mit Fallback-UI + "Zur Startseite" | 3h | HOCH | ✅ Done |
| 0.8 | **Automatische DB-Backups** — `db-backup` Service in docker-compose, täglich, 14d Retention | 2h | HOCH | ✅ Done |

**Gesamt Phase 0: ~31h** ✅ Abgeschlossen am 07.02.2026

---

### Phase 1: CORE POLISH (Woche 3-5) ✅ ERLEDIGT
> Bestehende Features production-ready machen

| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 1.1 | **MenuPlan ↔ GuestCounts verknüpfen** — Auto-Portionen aus PAX-Daten | 8h | ✅ Done |
| 1.2 | **Location-Filter durchgängig** — alle Seiten filtern nach aktiver Location | 6h | ✅ Done |
| 1.3 | **Pagination** für HACCP-Logs (Server-seitig mit Limit/Offset) | 8h | ✅ Done |
| 1.4 | **N+1 Queries fixen** — Bulk-Ingredients-Endpoint für Einkaufsliste | 8h | ✅ Done |
| 1.5 | **useAsyncData() Custom Hook** — DRY-Refactoring (deferred, nice-to-have) | 4h | ⏭ Deferred |
| 1.6 | **Schedule.tsx aufteilen** — StaffView + ShiftTypesView extrahiert | 5h | ✅ Done |
| 1.7 | **Rotation UX verbessern** — Completeness-Stats, Duplikat-Erkennung, leere Slots | 4h | ✅ Done |
| 1.8 | **HACCP-Alerts** — CRITICAL-Status bei >2°C, Tages-Banner, Live-Preview | 6h | ✅ Done |
| 1.9 | **Drag & Drop Menüplan** — Rezepte per DnD in Wochenplan-Slots (dnd-kit) | 8h | ✅ Done |
| 1.10 | **masterIngredients aktivieren** — CRUD-UI unter /recipes/ingredients mit Preisen | 8h | ✅ Done |

**Gesamt Phase 1: ~65h** ✅ Abgeschlossen am 07.02.2026

---

### Phase 2: KILLER FEATURES (Woche 6-10) ✅ ERLEDIGT
> Differenzierende Features, die kein Open-Source-Tool hat

#### 2A: Allergen-Management (EU-Verordnung 1169/2011)
| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 2A.1 | **Allergen-Übersicht pro Tag** — Tagesansicht mit allen 14 EU-Allergenen pro Gericht | 6h | ✅ Done |
| 2A.2 | **Buffet-Allergenkarten** — Druckbare Karten für Buffet-Aufsteller (A4/A5) | 4h | ✅ Done |
| 2A.3 | **Allergen-Konflikt-Warnung** — beim Menüplan-Erstellen: "Achtung: 5 von 7 Gerichten enthalten Gluten" | 4h | ✅ Done |
| 2A.4 | **Gast-Allergen-Profile** — Gruppenreservierungen mit spez. Diätanforderungen | 6h | ✅ Done |

#### 2B: Analytics Dashboard
| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 2B.1 | **Food-Cost-Analyse** — Kosten pro Gericht, pro Woche, pro Monat (basierend auf masterIngredients) | 10h | ✅ Done |
| 2B.2 | **PAX-Trends** — Gästezahlen-Verlauf als Chart (Recharts), Wochentag-Muster, Saison-Vergleich | 6h | ✅ Done |
| 2B.3 | **HACCP-Compliance-Report** — Lückenanalyse, Temperatur-Trends pro Kühlschrank | 6h | ✅ Done |
| 2B.4 | **Beliebteste Gerichte** — Häufigkeitsanalyse aus Rotation + Wochenplan | 4h | ✅ Done |

#### 2C: Produktion & Einkauf
| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 2C.1 | **Sub-Rezepte** — Rezept als Zutat in anderem Rezept (z.B. "Grundbrühe" in Suppen) → Basis für genaue Kalkulation | 8h | ✅ Done |
| 2C.2 | **Produktionsliste V2** — Mengen aus PAX × Portionen, sortiert nach Vorbereitungsreihenfolge | 8h | ✅ Done |
| 2C.3 | **Einkaufsliste V2** — Zutatenkonsoldierung über Tage/Locations, Lieferanten-Zuordnung | 8h | ✅ Done |
| 2C.4 | **Lieferanten-Verwaltung** — CRUD + Zuordnung zu masterIngredients | 6h | ✅ Done |

#### 2D: Digitale Speisekarte
| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 2D.1 | **Gast-Speisekarte** — Öffentliche URL pro Location/Tag mit Allergenen + Bildern | 8h | ✅ Done |
| 2D.2 | **Digital Signage** — Vollbild-Ansicht für Lobby-Bildschirm (Auto-Refresh) | 4h | ✅ Done |
| 2D.3 | **QR-Code Generator** — Pro Tag/Location einen QR-Code für die Speisekarte | 2h | ✅ Done |

**Gesamt Phase 2: ~82h** ✅ Abgeschlossen am 07.02.2026

---

### Phase 3: AI-POWERED (Woche 11-14) ✅ ERLEDIGT
> AI als echten Differentiator nutzen — mise hat bereits `rotation-agent.ts` als Fundament

| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 3.1 | **PAX-Forecasting** — Statistische Vorhersage (Moving Average + Saisonalität + Wochentag-Pattern) mit MAPE | 12h | ✅ Done |
| 3.2 | **Smart Rotation** — Claude AI analysiert und optimiert 6-Wochen-Rotation (Abwechslung, Saison, Kosten) | 8h | ✅ Done |
| 3.3 | **LLM Rezept-Import** — Unstrukturierten Text/Bild per Claude Vision zu strukturiertem Rezept parsen | 6h | ✅ Done |
| 3.4 | **Rezept-Vorschläge** — Scoring-System (Saison, Abwechslung, Kategorie-Balance) + optionale AI-Bewertung | 6h | ✅ Done |
| 3.5 | **Intelligentes Scaling** — Nicht-lineare Skalierung für Großküche (Gewürze, Backpulver, Fette) | 6h | ✅ Done |
| 3.6 | **HACCP Anomalie-Erkennung** — 5 Anomalie-Typen + Kühlschrank-Health-Score | 6h | ✅ Done |
| 3.7 | **Allergen Auto-Detection** — 100+ deutsche Zutatennamen → 14 EU-Allergene Mapping | 4h | ✅ Done |
| 3.8 | **Waste-Prediction** — Verfallswarnung für geplante Zutaten mit Verwertungsvorschlägen | 8h | ✅ Done |

**Gesamt Phase 3: ~56h** ✅ Abgeschlossen am 07.02.2026

---

### Phase 4: PROFESSIONAL POLISH (Woche 15-18) ✅ ERLEDIGT
> Enterprise-ready machen

| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 4.1 | **PWA Offline-Support** — Service Worker, Offline-Indicator, IndexedDB Cache, Runtime Caching | 8h | ✅ Done |
| 4.2 | **Push-Notifications** — VAPID Keys, Subscription-API, HACCP-Alert + Schedule-Change Push | 6h | ✅ Done |
| 4.3 | **E-Mail-Benachrichtigungen** — Nodemailer SMTP, Settings-UI, HTML-Templates, HACCP/Catering-Alerts | 6h | ✅ Done |
| 4.4 | **Rezept-Medien** — Multer Upload, Gallery, pro Zubereitungsschritt, Lightbox | 8h | ✅ Done |
| 4.5 | **CI/CD Pipeline** — GitHub Actions: CI (Test+Build), Deploy, Backup Workflows | 8h | ✅ Done |
| 4.6 | **Monitoring** — Sentry Client/Server, Prometheus Metrics, Health-Endpoint, Server-Status UI | 6h | ✅ Done |
| 4.7 | **Test-Suite** — Vitest (8 Test-Files: Auth, Recipes, HACCP, Production, Rotation, PAX, Allergens, Constants) + Playwright E2E (4 Specs) | 12h | ✅ Done |
| 4.8 | **Multi-Language** — react-i18next (DE + EN), 627 Translation Keys, LanguageSwitcher | 10h | ✅ Done |
| 4.9 | **DSGVO-Export** — Kompletter Datenexport als JSON, Anonymisierung, Löschung, Admin-Verwaltung | 4h | ✅ Done |
| 4.10 | **Backup/Restore UI** — Admin-Seite mit Backup-Liste, Download, Restore, pg_dump/pg_restore | 4h | ✅ Done |

**Gesamt Phase 4: ~72h** ✅ Abgeschlossen am 07.02.2026

---

### Phase 5: ADAPTIVE LEARNING (Woche 19-22)
> Self-learning system via Chef-Quiz — Rotation-Agent lernt aus Koch-Feedback

**Vorarbeit erledigt:** Rotation-Agent v2 (07.02.2026) — kulinarische Regeln (DISH_META, selfContained, dessertMain, preferred/forbidden Paarungen, Random-Auswahl statt Round-Robin)

| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 5.1 | **Quiz-Feedback DB** — `quiz_feedback`, `pairing_scores`, `learned_rules` Tabellen (Drizzle) | 6h | ✅ 07.02.2026 |
| 5.2 | **Quiz UI** — Menü-Kombination bewerten (1-5 Sterne), Swipe-Interface | 10h | ✅ 07.02.2026 |
| 5.3 | **Pairing-Score Engine** — Feedback → gewichtete Scores aggregieren, Decay-Funktion | 8h | ✅ 07.02.2026 |
| 5.4 | **Rotation-Agent v3 Integration** — Pairing-Scores in Stärke/Gemüse-Auswahl einbauen | 8h | ✅ 07.02.2026 |
| 5.5 | **Exploration vs Exploitation** — Epsilon-Greedy: 80% bewährte Paarungen, 20% neue Kombis | 4h | ✅ 07.02.2026 |
| 5.6 | **Lern-Dashboard** — Top/Flop-Paarungen, Lernfortschritt, Score-Verteilung | 6h | ✅ 07.02.2026 |
| 5.7 | **AI-Validierung** — Claude API für Regelvorschläge aus gesammeltem Feedback | 6h | ✅ 07.02.2026 |

**Gesamt Phase 5: ~48h**

---

## Zusammenfassung

| Phase | Fokus | Aufwand | Zeitraum |
|-------|-------|---------|----------|
| **0** | Security + Foundation Fix | ~31h | Woche 1-2 ✅ |
| **1** | Core Polish | ~65h | Woche 3-5 ✅ |
| **2** | Killer Features | ~82h | Woche 6-10 ✅ |
| **3** | AI-Powered | ~56h | Woche 11-14 ✅ |
| **4** | Professional Polish | ~72h | Woche 15-18 ✅ |
| **5** | Adaptive Learning | ~48h | Woche 19-22 ✅ |
| **TOTAL** | | **~362h** | **Alle 5 Phasen abgeschlossen** |

---

## Wettbewerbsvergleich nach Umsetzung

| Feature | mise | FoodNotify | Apicbase | Meez | Tandoor (OSS) |
|---------|------|-----------|----------|------|---------------|
| Rezeptverwaltung | ✓ | ✓ | ✓ | ✓✓ | ✓ |
| 6-Wochen-Rotation | ✓✓ | ✓ | ✗ | ✗ | ✗ |
| Multi-Location Hotel | ✓✓ | ✓ | ✓✓ | ✗ | ✗ |
| HACCP-Logging | ✓ | ✓ | ✓ | ✗ | ✗ |
| PAX-Management | ✓ | ✗ | ✗ | ✗ | ✗ |
| Dienstplan | ✓ | ✗ | ✗ | ✗ | ✗ |
| Catering-Events | ✓ | ✗ | ✓ | ✗ | ✗ |
| AI Menu Planning | ✓✓ | ✗ | ✗ | ✗ | ✗ |
| Food-Cost-Analyse | ✓ | ✓ | ✓✓ | ✓ | ✗ |
| Allergen-Karten | ✓ | ✓ | ✓ | ✗ | ✗ |
| Digital Signage | ✓ | ✗ | ✗ | ✗ | ✗ |
| Offline/PWA | ✓ | ✗ | ✗ | ✗ | ✗ |
| Open Source | ✓✓ | ✗ | ✗ | ✗ | ✓ |
| Preis/Monat | €0 (self-hosted) | €150-500 | €500+ | €15/User | €0 |

**mise's Unique Selling Points nach Umsetzung:**
1. Einziges Open-Source-Tool mit professionellen Hotel-Kitchen-Features
2. AI-gestützte Rotation + PAX-Forecasting (kein Wettbewerber hat das)
3. Alles-in-einem: Rezepte + Rotation + Menüplan + HACCP + Dienstplan + Catering
4. Mobile-first PWA mit Offline-Support
5. Digitale Speisekarte + Signage als Bonus für Gäste
6. Österreich-spezifisch: EU-Allergene, DACH-Markt, Deutsch-nativ

---

## Installed Agent Skills (Vercel)

Folgende Skills sind unter `.agents/skills/` installiert und sollten bei der Umsetzung berücksichtigt werden:

| Skill | Regeln | Relevanz für mise |
|-------|--------|-------------------|
| **vercel-composition-patterns** | 8 Rules | Compound Components, State Lifting → für Schedule, MenuPlan |
| **vercel-react-best-practices** | 57 Rules | Async Waterfalls, Bundle Optimization, Rendering → überall |
| **vercel-react-native-skills** | 31 Rules | Weniger relevant (Web, nicht Native) |
| **web-design-guidelines** | UX Audit Tool | Für Phase 4 UX-Review |

**Wichtigste Regeln für mise:**
- `architecture-compound-components` → Schedule + MenuPlan aufteilen
- `async-parallel` → Parallele API-Calls statt Wasserfall
- `bundle-dynamic-imports` → Lazy-Loading für Seiten
- `rerender-derived-state` → useMemo statt useEffect für berechnete Werte
- `state-lift-state` → Shared State zwischen Location-Switcher und Seiten

---

## Nächster Schritt

**Alle 5 Phasen abgeschlossen** (07.02.2026). Phase 5 (Adaptive Learning) implementiert: Quiz-Feedback UI, Pairing-Score Engine mit Zeitverfall, Rotation-Agent v3 mit score-gewichteter Beilagen-Auswahl (Explore/Exploit), Lern-Dashboard mit Recharts, AI-Regelvalidierung via Claude API. `npm run db:push` für 3 neue Tabellen erforderlich.

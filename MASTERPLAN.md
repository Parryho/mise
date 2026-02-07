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

### Phase 1: CORE POLISH (Woche 3-5)
> Bestehende Features production-ready machen

| # | Task | Aufwand |
|---|------|---------|
| 1.1 | **MenuPlan ↔ GuestCounts verknüpfen** — Auto-Portionen aus PAX-Daten | 8h |
| 1.2 | **Location-Filter durchgängig** — alle Seiten filtern nach aktiver Location | 6h |
| 1.3 | **Pagination** für Rezepte, HACCP-Logs, Schedule, Catering | 8h |
| 1.4 | **N+1 Queries fixen** — Drizzle Joins für Slots+Rezepte, Logs+Fridges, Schedule+Staff | 8h |
| 1.5 | **useAsyncData() Custom Hook** — DRY-Refactoring der 10+ identischen Fetch-Patterns | 4h |
| 1.6 | **Schedule.tsx aufteilen** — ScheduleCalendar, ShiftEditor, StaffCard extrahieren | 5h |
| 1.7 | **Rotation UX verbessern** — Completeness-Check, leere Slots highlighten, Validation | 4h |
| 1.8 | **HACCP-Alerts** — Out-of-Range Temperatur → Toast + E-Mail an Küchenchef | 6h |
| 1.9 | **Drag & Drop Menüplan** — Rezepte per DnD in Wochenplan-Slots ziehen | 8h |
| 1.10 | **masterIngredients aktivieren** — CRUD-UI, Verknüpfung zu recipe ingredients, Preise | 8h |

**Gesamt Phase 1: ~65h**

---

### Phase 2: KILLER FEATURES (Woche 6-10)
> Differenzierende Features, die kein Open-Source-Tool hat

#### 2A: Allergen-Management (EU-Verordnung 1169/2011)
| # | Task | Aufwand |
|---|------|---------|
| 2A.1 | **Allergen-Übersicht pro Tag** — Tagesansicht mit allen 14 EU-Allergenen pro Gericht | 6h |
| 2A.2 | **Buffet-Allergenkarten** — Druckbare Karten für Buffet-Aufsteller (A4/A5) | 4h |
| 2A.3 | **Allergen-Konflikt-Warnung** — beim Menüplan-Erstellen: "Achtung: 5 von 7 Gerichten enthalten Gluten" | 4h |
| 2A.4 | **Gast-Allergen-Profile** — Gruppenreservierungen mit spez. Diätanforderungen | 6h |

#### 2B: Analytics Dashboard
| # | Task | Aufwand |
|---|------|---------|
| 2B.1 | **Food-Cost-Analyse** — Kosten pro Gericht, pro Woche, pro Monat (basierend auf masterIngredients) | 10h |
| 2B.2 | **PAX-Trends** — Gästezahlen-Verlauf als Chart (Recharts), Wochentag-Muster, Saison-Vergleich | 6h |
| 2B.3 | **HACCP-Compliance-Report** — Lückenanalyse, Temperatur-Trends pro Kühlschrank | 6h |
| 2B.4 | **Beliebteste Gerichte** — Häufigkeitsanalyse aus Rotation + Wochenplan | 4h |

#### 2C: Produktion & Einkauf
| # | Task | Aufwand |
|---|------|---------|
| 2C.1 | **Sub-Rezepte** — Rezept als Zutat in anderem Rezept (z.B. "Grundbrühe" in Suppen) → Basis für genaue Kalkulation | 8h |
| 2C.2 | **Produktionsliste V2** — Mengen aus PAX × Portionen, sortiert nach Vorbereitungsreihenfolge | 8h |
| 2C.3 | **Einkaufsliste V2** — Zutatenkonsoldierung über Tage/Locations, Lieferanten-Zuordnung | 8h |
| 2C.4 | **Lieferanten-Verwaltung** — CRUD + Zuordnung zu masterIngredients | 6h |

#### 2D: Digitale Speisekarte
| # | Task | Aufwand |
|---|------|---------|
| 2D.1 | **Gast-Speisekarte** — Öffentliche URL pro Location/Tag mit Allergenen + Bildern | 8h |
| 2D.2 | **Digital Signage** — Vollbild-Ansicht für Lobby-Bildschirm (Auto-Refresh) | 4h |
| 2D.3 | **QR-Code Generator** — Pro Tag/Location einen QR-Code für die Speisekarte | 2h |

**Gesamt Phase 2: ~82h**

---

### Phase 3: AI-POWERED (Woche 11-14)
> AI als echten Differentiator nutzen — mise hat bereits `rotation-agent.ts` als Fundament

| # | Task | Aufwand |
|---|------|---------|
| 3.1 | **PAX-Forecasting** — ML-Modell auf historische guestCounts → Vorhersage nächste Woche | 12h |
| 3.2 | **Smart Rotation** — Claude AI optimiert 6-Wochen-Rotation (Abwechslung, Saison, Kosten) | 8h |
| 3.3 | **LLM Rezept-Import** — Unstrukturierten Text/Bild einfügen → AI strukturiert zu Rezept (Name, Zutaten, Schritte, Allergene) | 6h |
| 3.4 | **Rezept-Vorschläge** — "Basierend auf Saison + verfügbaren Zutaten empfehle ich..." | 6h |
| 3.5 | **Intelligentes Scaling** — Nicht-lineare Skalierung für Großküche (Salz, Gewürze, Backpulver) | 6h |
| 3.6 | **HACCP Anomalie-Erkennung** — Ungewöhnliche Temperaturmuster automatisch flaggen | 6h |
| 3.7 | **Allergen Auto-Detection** — Aus Zutatennamen automatisch Allergene vorschlagen | 4h |
| 3.8 | **Waste-Prediction** — Welche Zutaten drohen zu verderben, Menüvorschläge zur Verwertung | 8h |

**Gesamt Phase 3: ~56h**

---

### Phase 4: PROFESSIONAL POLISH (Woche 15-18)
> Enterprise-ready machen

| # | Task | Aufwand |
|---|------|---------|
| 4.1 | **PWA Offline-Support** — Service Worker, Offline-Seite, Sync-Queue für HACCP-Logs | 8h |
| 4.2 | **Push-Notifications** — HACCP-Alarm, Schichtänderung, neue Aufgaben | 6h |
| 4.3 | **E-Mail-Benachrichtigungen** — Nodemailer/SendGrid für Alerts + Catering-Bestätigungen | 6h |
| 4.4 | **Rezept-Medien** — Fotos pro Zubereitungsschritt (S3/MinIO Upload) | 8h |
| 4.5 | **CI/CD Pipeline** — GitHub Actions: Test → Build → Deploy (Staging → Prod) | 8h |
| 4.6 | **Monitoring** — Sentry Error-Tracking + Prometheus Metrics + Grafana Dashboard | 6h |
| 4.7 | **Test-Suite** — Vitest für Auth + CRUD, Playwright für kritische Workflows | 12h |
| 4.8 | **Multi-Language** — i18next Integration (DE + EN) | 10h |
| 4.9 | **Daten-Export** — DSGVO-konformer User-Datenexport + Löschung | 4h |
| 4.10 | **Backup/Restore UI** — Admin-Seite für DB-Export/Import | 4h |

**Gesamt Phase 4: ~72h**

---

## Zusammenfassung

| Phase | Fokus | Aufwand | Zeitraum |
|-------|-------|---------|----------|
| **0** | Security + Foundation Fix | ~31h | Woche 1-2 |
| **1** | Core Polish | ~65h | Woche 3-5 |
| **2** | Killer Features | ~90h | Woche 6-10 |
| **3** | AI-Powered | ~56h | Woche 11-14 |
| **4** | Professional Polish | ~72h | Woche 15-18 |
| **TOTAL** | | **~314h** | **~18 Wochen** |

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
| AI Menu Planning | ✓ (geplant) | ✗ | ✗ | ✗ | ✗ |
| Food-Cost-Analyse | Phase 2 | ✓ | ✓✓ | ✓ | ✗ |
| Allergen-Karten | Phase 2 | ✓ | ✓ | ✗ | ✗ |
| Digital Signage | Phase 2 | ✗ | ✗ | ✗ | ✗ |
| Offline/PWA | Phase 4 | ✗ | ✗ | ✗ | ✗ |
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

**Empfehlung: Phase 0 sofort starten.** Die Auth-Middleware ist das kritischste Problem — jeder Request wird als Admin ausgeführt. Das muss vor dem nächsten Deploy gefixt werden.

Soll ich mit Phase 0.1 (Auth-Middleware fixen) beginnen?

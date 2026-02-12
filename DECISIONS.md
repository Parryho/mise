# Entscheidungen & Findings

Dokumentiert Diskussionen und Änderungen zwischen Mobile-Terminal und Desktop (Cursor).
Neue Einträge oben.

---

## 2026-02-12 — Code-Analyse: Konkrete Findings

### Sicherheit

| Prio | Issue | Datei | Status |
|------|-------|-------|--------|
| HOCH | `xlsx` hat 2 High-Vulns, kein Fix verfügbar — ersetzen durch `exceljs` | `package.json` | offen |
| HOCH | `jsPDF` 4x moderate Vulns (PDF Injection, DoS) | `package.json` | offen |
| MITTEL | Role-Parameter bei User-Erstellung nicht gegen Enum validiert | `server/routes/auth.ts:189` | offen |
| MITTEL | SSRF-Schutz fehlt IPv6 (`::1`, `fe80::`) | `server/modules/recipe/scraper.ts:28` | offen |
| MITTEL | Public Endpoints ohne Rate Limiting | `server/routes/public.ts` | offen |
| SKIP | Passwort-Policy 6 Zeichen — bewusst so belassen | `server/routes/auth.ts:173` | entschieden |

### Performance

| Prio | Issue | Datei | Status |
|------|-------|-------|--------|
| HOCH | Menu-Export lädt ALLE Rezepte statt nur referenzierte | `server/routes/menu-plans.ts:142` | offen |
| HOCH | Fehlende DB-Indexes (recipes.name, staff, tasks) | `shared/schema.ts` | offen |
| MITTEL | Unbounded Queries ohne Pagination | `server/storage.ts` | offen |
| MITTEL | Kein Image-Resizing — volle Fotos ans Handy | `server/modules/recipe/media.ts` | offen |

### Code-Qualität

| Datei | Zeilen | Problem | Status |
|-------|--------|---------|--------|
| `rotation-agent.ts` | 954 | Daten + Logik vermischt | offen |
| `storage.ts` | 600 | Monolithischer Data Layer | offen |
| `routes/recipes.ts` | 486 | Groß für eine Route-Datei | offen |
| `routes/admin.ts` | 473 | Alles zusammen (Settings, GDPR, Backup) | offen |

### Schema-Design

| Issue | Datei | Status |
|-------|-------|--------|
| `date` als TEXT statt DATE-Typ | `shared/schema.ts` (menuPlans, guestCounts etc.) | offen |
| Allergen-Arrays nicht indexierbar | `shared/schema.ts` | offen |
| `locationId` nullable wo unnötig | `shared/schema.ts` | offen |

### Aufräumen

| Was | Status |
|-----|--------|
| `.htpasswd`, `*.bak`, `batch-import.log` → `.gitignore` | erledigt |
| Utility-Scripts nach `script/` verschoben (backup.sh, push-schema.sh, tag-recipes.mjs) | erledigt |
| Uncommitted `nginx.conf` reviewen | offen |

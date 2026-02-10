# mise.at — Figma Design Brief

> Umfassender Prompt/Brief zum Erstellen eines vollständigen UI-Designs in Figma.
> Ziel: Alle bestehenden Screens abbilden + designtechnische Verbesserungen einarbeiten.

---

## Projekt-Briefing

**App-Name:** mise.at — Küchenmanagement-System
**Zielgruppe:** Köche, Souschefs, Küchenleitungen in Hotelküchen und Catering-Betrieben
**Nutzungskontext:** Küche — nasse/bemehlte Hände, Handschuhe, Stress, Zeitdruck, oft nur eine Hand frei
**Geräte:** Primär Smartphones (PWA), sekundär Tablets und Desktop
**Sprache:** Deutsch (primär), Englisch (sekundär)

---

## Brand Identity

### Farben

| Token | Wert | Verwendung |
|-------|------|------------|
| **Primary** | `#F37021` (Orange, HSL 22 90% 54%) | Buttons, aktive Navigation, Links, Branding |
| **Accent** | `#16A34A` (Grün, HSL 142 76% 36%) | Erfolg, frisch, sicher, HACCP OK |
| **Destructive** | `#EF4444` (Rot) | Fehler, Löschen, Temperatur-Alarm |
| **Background** | Warmes Creme `hsl(30 20% 98%)` | Hintergrund |
| **Foreground** | Warmes Dunkelbraun `hsl(20 20% 15%)` | Text |
| **Card** | Weiß `#FFFFFF` | Karten |
| **Border** | `hsl(30 20% 88%)` | Ränder, Trennlinien |
| **Muted** | `hsl(30 20% 94%)` | Deaktivierte Flächen |

### Status-Farben (je 3 Varianten: solid, foreground, subtle)

| Status | Wert | Verwendung |
|--------|------|------------|
| **Info** | Blau `hsl(217 91% 60%)` | Geplant, Info |
| **Success** | Grün `hsl(142 76% 36%)` | Bestätigt, OK |
| **Warning** | Amber `hsl(38 92% 50%)` | Warnung |
| **Danger** | Rot `hsl(0 84% 60%)` | Fehler, Alarm |
| **Neutral** | Grau `hsl(220 9% 46%)` | Archiviert, erledigt |

### Typografie

| Element | Font | Stil | Verwendung |
|---------|------|------|------------|
| **Headings** | Oswald | Uppercase, Tracking-Wide | h1–h6, Seitentitel, Navigation |
| **Body** | Inter | Regular 400 | Fließtext, Labels, Beschreibungen |
| **Mono** | Roboto Mono | Regular | Zahlen, Codes, Temperaturen, Portionen |

### Form-Sprache

| Token | Wert |
|-------|------|
| **Radius** | 8px (0.5rem) default |
| **Spacing-Grid** | 4px Basis (4, 8, 12, 16, 20, 24, 32, 48, 64) |
| **Elevation 0** | Kein Schatten, nur Border — flache Karten, Kategorie-Buttons |
| **Elevation 1** | `shadow-sm` — Standard-Karten |
| **Elevation 2** | `shadow-md` — Dialoge, Popovers, erhöhte Elemente |

---

## App-Struktur (alle Screens)

### Navigation

**Bottom Nav** (fixed, 64px Höhe): 6 Items mit Icon + Label

| # | Label | Icon | Route |
|---|-------|------|-------|
| 1 | Home | `Home` | `/today` |
| 2 | Planung | `CalendarDays` | `/rotation` |
| 3 | Rezepte | `ChefHat` | `/recipes` |
| 4 | Quiz | `Dices` | `/quiz` |
| 5 | HACCP | `Thermometer` | `/haccp` |
| 6 | Personal | `Users` | `/schedule` |

- Aktiver Nav-Item: Primary-Farbe, gefülltes Icon, dickerer Stroke
- Min. Touch Target: 60×48px pro Item

**Top Bar** (sticky): Zurück-Button (links), Settings-Zahnrad (rechts)

---

### 1. Today (Dashboard / Landing)

**Route:** `/today`

- Begrüßung mit Tageszeit + Username ("Guten Morgen, Gerald")
- **PAX-Karte:** Gästezahlen pro Standort (City/SÜD/AK), Mittag/Abend
- **Heutiges Menü:** Mittagsmenü City — Suppe, Hauptgericht 1+2 mit Beilagen, Dessert. Farbcodierte Icons pro Gang
- **HACCP-Status:** Gemessen/Offen/Alarme mit Progress-Bar
- **Aufgaben:** Offene Tasks mit Priorität-Farbbalken (links), Toggle erledigt
- **Quick Actions:** 5 Icon-Buttons in Grid (Planung, Rezepte, Einkauf, Produktion, Briefing)

---

### 2. Rotation (6-Wochen-Editor)

**Route:** `/rotation`

- **Template-Selector:** Dropdown oben zum Auswählen/Erstellen von Vorlagen
- **Wochenwahl:** W1–W6 Toggle-Buttons (horizontal)
- **Block-Toggles:** City Mittag, City Abend, SÜD Abend (ein-/ausblendbar, localStorage-Persistenz)
- **Tabelle:** 7 Tage × 8 Gänge (Suppe, Fleisch, Beilage 1a, 1b, Vegi, Beilage 2a, 2b, Dessert) × bis zu 3 Blöcke
- **Zellen:** Klick öffnet Rezept-Suche (Dropdown mit Prefix-Matching)
- **Actions:** "Menü generieren" (AI Auto-Fill, labeled Button), "Druckansicht" (labeled Button)

---

### 3. Rotation Print

**Route:** `/rotation/print`

- A4-optimiert, eine Woche pro Seite
- Kompakte Tabelle mit zusätzlicher °C-Spalte (Platzhalter für handschriftliche Temperatur-Notiz nach Druck)
- Block-Toggles wie Rotation
- Nur Druckvorschau, minimale UI-Chrome

---

### 4. Rezepte (Bibliothek)

**Route:** `/recipes`

- **Globale Suche:** Sticky Suchleiste oben, min. 2 Zeichen für Aktivierung
- **Kategorien:** Horizontale Tabs mit Zähler-Badge (Suppen, Fleisch, Fisch, Vegan, Beilagen, Saucen, Salate, Desserts)
- **Rezept-Karten:** Bild (Unsplash-Default oder eigenes Foto), Titel, Badges (Zeit, Portionen, Allergene)
- **Actions:** AI-Import (Text/Foto/URL), Neues Rezept, Zutatenstammdaten
- **Layout:** 1 Spalte mobil, 2 Spalten Tablet, 3 Spalten Desktop

---

### 5. Rezept-Detail (Dialog/Modal)

- **Hero:** 48px Rezeptbild mit Gradient-Overlay, Kategorie-Badge oben rechts
- **Portionen:** +/- Stepper mit großer Mono-Zahl (intelligentes Scaling)
- **Allergene:** Rote Badges mit Code + deutschem Namen (z.B. "A Gluten", "G Milch")
- **Tags:** Orange-getönte Pills
- **Zutaten-Liste:** Hover-Highlight, Allergen-Codes inline
- **Zubereitungsschritte:** Nummerierte Kreise + Text
- **Actions:** Bearbeiten, PDF, DOCX, Website-Link, Löschen

---

### 6. AI Rezept-Import

**Route:** `/recipes/import`

- **3 Tabs:** Text-Eingabe, Foto-Upload, URL-Import
- **Geparster Vorschau:** Editierbares Formular mit erkannten Zutaten, Schritten, Metadaten
- Sparkles-Icon (✨) für alle AI-Features als visuelles Signal

---

### 7. HACCP (Temperatur-Logging)

**Route:** `/haccp`

- **Summary-Karten:** 3er-Grid (OK/Warnung/Kritisch) mit Farbcodierung (Grün/Amber/Rot)
- **Kühlgeräte-Liste:** Karten mit letzter Temperatur, Status-Badge, prominenter "Messen"-Button
- **Log-Dialog:** Gerät wählen, Temperatur eingeben (große Zifferneingabe), Notiz-Feld
- **Export:** PDF-Button in Action-Bar

---

### 8. Gästezahlen

**Route:** `/guests`

- **Ansichts-Toggle:** Tag/Woche/Monat
- **Kalender-Grid:** 7 Tage × 3 Mahlzeiten (Frühstück, Mittag, Abend), Erwachsene + Kinder pro Zelle
- **Standort-Tabs:** City / SÜD / AK
- **Summary:** Tages-Summen in Footer-Zeile
- **Export:** Excel-Button

---

### 9. Dienstplan

**Route:** `/schedule`

**3 Tabs:**

1. **Dienstplan:** Wochenansicht — Mitarbeiter-Zeilen × 7 Tage, farbcodierte Schichten
   - Zell-Aktionen: Klick → Schicht zuweisen (Bottom Sheet mobil)
2. **Mitarbeiter:** Liste mit Name, Rolle, Kontakt
3. **Schichttypen:** Farbige Tags mit Kürzel und Zeiten
   - Schichtfarben: Früh (gelb), Spät (blau), Teildienst (lila), Urlaub (grün), Krank (rot), Frei (grau), WOR (orange)

---

### 10. Catering Events

**Route:** `/catering`

- **Filter:** Typ-Dropdown (Brunch, Ball, Buffet, Bankett, Empfang, Seminar), Status-Dropdown
- **Event-Karten:** Farbcodiert nach Typ
  - Brunch = Gelb, Ball = Violett, Buffet = Orange, Bankett = Blau, Empfang = Grün, Seminar = Grau
- **Metadaten pro Karte:** Datum, Zeit, Personenzahl, Kontakt, Raum, Status-Badge
- **Actions:** Neues Event, Airtable-Sync

---

### 11. Einkaufsliste

**Route:** `/shopping`

- **Datumsbereich-Wahl:** Von/Bis mit Calendar-Picker
- **Ansicht-Toggle:** Kategorie / Lieferant
- **Kollapsbare Gruppen** mit Zwischensummen und Chevron-Icon
- **Zeilen:** Zutat, Menge, Einheit, Preis
- **Gesamtsumme** am Footer mit Währung (EUR)
- **Export:** PDF / Excel

---

### 12. Produktionsliste

**Route:** `/production`

- **Datumsbereich-Wahl**
- **Kollapsbare Mahlzeit-Karten:** Datum + Mahlzeit (Mittag/Abend) + Standort + PAX-Zahl
- **Gericht-Details:** Rezeptname, Zutaten mit skalierten Mengen, Zubereitungshinweise
- **Export:** PDF

---

### 13. Reports Dashboard

**Route:** `/reports`

- **Karten-Grid:** 2 Spalten mobil, 3 Spalten Desktop
- **Report-Karten:** Icon (Lucide), Titel, kurze Beschreibung, Link-Pfeil

**Sub-Seiten:**

| Report | Route | Beschreibung |
|--------|-------|--------------|
| Food-Cost | `/analytics/food-cost` | Kostenanalyse pro Gericht/Kategorie |
| PAX-Trends | `/analytics/pax-trends` | Gästezahlen-Verlauf, Charts |
| HACCP-Compliance | `/analytics/haccp-compliance` | Compliance-Score, Lücken |
| Anomalien | `/analytics/haccp-anomalies` | Temperatur-Anomalie-Dashboard |
| Beliebte Gerichte | `/analytics/popular-dishes` | Top-Rezepte nach Häufigkeit |
| Waste Prediction | `/analytics/waste-prediction` | AI Abfall-Vorhersage |
| PAX Forecast | `/analytics/pax-forecast` | AI Gäste-Prognose |
| Lern-Dashboard | `/analytics/learning` | Quiz-Fortschritt |

---

### 14. Allergen-Matrix

**Route:** `/allergens`

- **Tabelle:** 14 Allergen-Spalten (A–R) × Gerichte-Zeilen
- **Spaltenheader:** Allergen-Code + Icon/Kürzel
- **Zellen:** Checkmark (✓) für Vorhandensein, leer wenn nicht
- **Gast-Konflikt-Banner:** Rote Warnung oben wenn Gästeprofil-Konflikt erkannt

**EU-Allergen-Codes:**

```
A = Gluten    H = Schalenfrüchte
B = Krebstiere   L = Sellerie
C = Eier     M = Senf
D = Fisch    N = Sesam
E = Erdnüsse    O = Sulfite
F = Soja     P = Lupinen
G = Milch    R = Weichtiere
```

---

### 15. Buffet-Karten (Druck)

**Route:** `/buffet-cards`

- A5 Landscape, ein Gericht pro Karte
- Großer Gerichtname (Oswald, uppercase, zentriert)
- Allergen-Codes unten (Badges)
- Optional: Beschreibung, Herkunft
- Print-optimiert: Seitenumbruch pro Karte

---

### 16. Einstellungen

**Route:** `/settings`

- **Profil:** Avatar-Kreis mit Initialen, Name, Rolle-Badge
- **Sprache:** DE/EN Toggle-Switch
- **Benutzerverwaltung:** Tabelle mit Name, E-Mail, Rolle (farbige Badges), Aktionen
- **Standorte:** Karten mit Name, Slug, Default-PAX

**Sub-Seiten:**

| Seite | Route | Inhalt |
|-------|-------|--------|
| Server-Status | `/server-status` | Monitoring-Dashboard, Uptime, DB-Status |
| E-Mail | `/email-settings` | SMTP-Konfiguration |
| Backup | `/backup` | Backup erstellen/wiederherstellen |
| DSGVO | `/gdpr` | Datenexport, Kontolöschung |
| Lieferanten | `/suppliers` | Lieferanten-Verwaltung |
| Gästeprofile | `/guest-profiles` | Allergen-Profile für wiederkehrende Gäste |

---

### 17. Quiz (Menü-Lernspiel)

**Route:** `/quiz`

- **Flashcard-Style:** Gerichtname wird angezeigt → korrekte Beilage + Gemüse auswählen
- **Multiple-Choice:** 4 Optionen pro Frage
- **Scoring:** Punkte-Anzeige oben, Timer optional
- **Feedback:** Grün = richtig, Rot = falsch mit korrekter Antwort
- **Fortschritt:** Progress-Bar, Streak-Counter

---

### 18. Agent Team (AI Orchestrator)

**Route:** `/agent-team`

- **Pipeline-Visualisierung:** 4 Phasen horizontal (Analyse → Planung → Optimierung → Zusammenfassung)
- **Agent-Status-Karten:** Status-Badges (pending=grau, running=blau pulsierend, completed=grün, failed=rot)
- **Aktionspunkte:** Priorisierte Liste
  - HIGH = Rot-Badge links
  - MEDIUM = Gelb-Badge links
  - LOW = Blau-Badge links
- **AI-Summary:** Zusammenfassungs-Karte mit Sparkles-Icon

---

### 19. Öffentliche Seiten (ohne Login)

**Speisekarte** (`/speisekarte/:location/:date`):
- Orange-Gradient Header mit mise-Branding
- Gang-Karten: Suppe, Hauptgerichte, Dessert
- Allergen-Badges pro Gericht
- Große, gut lesbare Schrift
- QR-Code zum Teilen

**Digital Signage** (`/signage/:location`):
- Vollbild-Modus, kein UI-Chrome
- Große Schrift (Mindestens 24pt body)
- Auto-Rotation der Gerichte
- Kein Touch-Interaktion nötig
- Dunkler Hintergrund mit heller Schrift (bessere Fernlesbarkeit)

---

### 20. Login

**Route:** `/login`

- Zentriertes Formular: E-Mail + Passwort
- mise.at Logo/Branding oben
- Primary-Button "Anmelden"
- Hero-Illustration oder Küchen-Hintergrundbild (subtle, mit Overlay)

---

## Design-Verbesserungsvorschläge

### 1. Konsistenz & Systematik

- Einheitliche Card-Patterns (gleiche Padding, gleiche Header-Struktur überall)
- Standardisierte Seitenheader: Titel links, Actions rechts, immer gleiche Höhe (48px)
- Konsistente Empty States mit Illustration + Call-to-Action-Button
- Einheitliche Loading-States (Skeleton statt Spinner)

### 2. Information Architecture

- Dashboard-Widgets konfigurierbar machen (Drag & Drop Reihenfolge)
- Mega-Tabellen (Rotation, Dienstplan) für Mobile überdenken — Kartenansicht als Alternative anbieten
- Reports-Seite: Favoriten-Reports pinnen, zuletzt geöffnete zuerst anzeigen
- Breadcrumbs für tiefe Verschachtelungen (Settings → E-Mail → SMTP)

### 3. Micro-Interactions

- Skeleton-Loading statt Spinner für bessere Perceived Performance
- Swipe-Gesten: Links-Swipe = Löschen (mit Confirm), Rechts-Swipe = Erledigt (bei Tasks)
- Pull-to-Refresh auf allen Listen
- Haptic Feedback (Vibration) bei Temperatur-Logging-Bestätigung
- Smooth Transitions bei Seitenwechsel (Slide-Animationen)

### 4. Visuelles Design

- Hero-Illustration für Login-Screen und Onboarding
- Subtile Texturen/Muster im Hintergrund (Küchen-Thematik: Holzstruktur, Marmor — sehr dezent)
- Lottie-Animationen für Status-Übergänge (pending → running → completed)
- Farbverläufe statt Flat-Backgrounds für Hero-Sektionen
- Dark Mode vollständig durchdesignen (nicht nur Token-Overrides, sondern eigene Farbpalette)

### 5. Touch & Mobile UX

- Floating Action Button (FAB) für häufigste Aktion pro Seite
- Bottom Sheet statt Dialoge für mobile Eingaben (näher am Daumen)
- Gesten-Navigation: Horizontal-Swipe für Wochen/Tage-Navigation in Rotation & Dienstplan
- Größere Touch-Targets in Tabellen (min. 44×44px auch für Tabellenzellen)
- Große Zifferneingabe für Temperaturen (Num-Pad Style, nicht Standard-Input)

### 6. Datenvisualisierung

- HACCP-Dashboard: Sparkline-Charts in Kühlgeräte-Karten (Temperatur-Verlauf letzte 7 Tage)
- PAX-Trends: Heatmap-Kalender (Farbintensität = Auslastung) zusätzlich zu Balkendiagrammen
- Food-Cost: Donut-Charts für Kategorie-Aufschlüsselung
- Rotation: Farbcodierung nach Rezept-Kategorie (Fleisch=rot, Fisch=blau, Vegan=grün, Suppe=gelb)
- Dienstplan: Mini-Heatmap für Personalabdeckung (unterbesetzt=rot, überbesetzt=blau)

### 7. Onboarding & Hilfe

- First-Use-Tooltips für neue Features (3-4 Screens beim ersten Login)
- Kurze Coach-Marks: Spotlight auf wichtige Buttons mit Erklärtext
- Kontextuelle Hilfetexte (?) in komplexen Screens (Rotation, HACCP-Compliance)
- Leere Zustände mit hilfreichen Hinweisen ("Noch keine Rezepte? Starte mit dem AI-Import!")

### 8. Barrierefreiheit

- Kontrast-Check aller Farbkombinationen (WCAG AA mindestens, AAA für kritische Texte)
- Focus-States für Keyboard-Navigation sichtbarer gestalten (2px Orange Ring)
- Screen-Reader Labels für alle Icon-Buttons (aria-label)
- Reduzierte Bewegung respektieren (prefers-reduced-motion)
- Farbkodierung nie als einziges Unterscheidungsmerkmal (zusätzlich Icons/Text)

### 9. Print-Design

- Dedizierte Print-Layouts als eigene Figma-Frames
- Buffet-Karten: Schriftart/Größe-Varianten (Standard, Groß, Elegant)
- Wochenplan-Druck: Landscape + Portrait Varianten designen
- QR-Code auf gedruckten Plänen → Link zur digitalen Version
- Einkaufsliste-Druck: Checkbox-Spalte zum Abhaken

### 10. Fehlende Screens / Flows

- **Onboarding-Flow:** 3–4 Willkommens-Screens (Was ist mise? → Hauptfunktionen → Los geht's)
- **Notification-Center:** Glocke oben rechts, Dropdown mit ungelesenen Benachrichtigungen
- **Profil-Bearbeitung:** Eigenes Foto hochladen, Passwort ändern, Präferenzen
- **Offline-Modus-Anzeige:** Prominenter Banner oben (gelb), nicht nur kleines Icon
- **Konfirmations-Dialoge:** Einheitliches Pattern für alle Lösch-/Destructive-Aktionen
- **Error States:** Einheitliche Fehlerseiten (404, 500, Offline, Berechtigung)

---

## Figma-Struktur-Empfehlung

```
mise.at Design
├── 🎨 Design Tokens
│   ├── Colors (Brand, Status 5×3, Neutrals)
│   ├── Typography (Oswald, Inter, Roboto Mono — Größen + Gewichte)
│   ├── Spacing (4px Grid: 4, 8, 12, 16, 20, 24, 32, 48, 64)
│   ├── Radius (4px, 8px, 12px, 16px, full)
│   └── Elevation (0: flat, 1: shadow-sm, 2: shadow-md)
│
├── 🧱 Components
│   ├── Primitives
│   │   ├── Button (default, destructive, outline, secondary, ghost, link × sm/md/lg/icon)
│   │   ├── Input (text, number, search, password)
│   │   ├── Select, Combobox, DatePicker
│   │   ├── Badge (default, secondary, destructive, outline)
│   │   ├── Card (Header, Content, Footer)
│   │   ├── Dialog / Sheet / Bottom Sheet
│   │   ├── Tabs, Toggle, Switch, Checkbox, Radio
│   │   ├── Table (Header, Row, Cell)
│   │   └── Toast / Alert
│   ├── Navigation
│   │   ├── Bottom Nav (6 Items, active/inactive)
│   │   ├── Top Bar (Titel, Back, Settings)
│   │   └── Tabs (horizontal, scrollable)
│   ├── Data Display
│   │   ├── Stat Card (Wert + Label + Trend)
│   │   ├── Progress Bar
│   │   ├── Chart (Bar, Line, Donut, Heatmap)
│   │   ├── Skeleton Loader
│   │   └── Empty State (Illustration + Text + CTA)
│   ├── Feedback
│   │   ├── Toast (success, error, info, warning)
│   │   ├── Spinner
│   │   ├── Offline Banner
│   │   └── Confirmation Dialog
│   └── Domain-Specific
│       ├── RecipeCard (Bild, Titel, Badges)
│       ├── MealSlot (Gang-Zelle in Rotation)
│       ├── AllergenBadge (A–R, rot, rund)
│       ├── FridgeCard (Name, Temp, Status)
│       ├── ShiftBadge (Typ, Farbe, Zeit)
│       ├── AgentCard (Status, Phase)
│       ├── TaskItem (Priorität, Text, Toggle)
│       └── EventCard (Typ-Farbe, Metadaten)
│
├── 📱 Screens — Mobile (375px)
│   ├── Auth
│   │   ├── Login
│   │   └── Onboarding (3–4 Screens)
│   ├── Dashboard
│   │   └── Today
│   ├── Planning
│   │   ├── Rotation (Editor)
│   │   ├── Rotation Print (Druckvorschau)
│   │   ├── MenuPlan (Wochenplan)
│   │   └── Smart Rotation (AI)
│   ├── Recipes
│   │   ├── Library (Übersicht)
│   │   ├── Detail (Dialog)
│   │   ├── AI Import (3 Tabs)
│   │   ├── Suggestions (AI)
│   │   └── MasterIngredients
│   ├── HACCP
│   │   ├── Logging (Übersicht + Dialog)
│   │   └── Compliance Report
│   ├── Operations
│   │   ├── ShoppingList
│   │   ├── ProductionList
│   │   └── Guests (Gästezahlen)
│   ├── Staff
│   │   ├── Schedule (Wochenansicht)
│   │   ├── Staff (Mitarbeiter)
│   │   └── ShiftTypes
│   ├── Catering
│   │   └── Events
│   ├── Analytics
│   │   ├── Reports Dashboard
│   │   ├── FoodCost
│   │   ├── PaxTrends
│   │   ├── HaccpCompliance
│   │   ├── HaccpAnomalies
│   │   ├── PopularDishes
│   │   ├── WastePrediction
│   │   └── PaxForecast
│   ├── Settings
│   │   ├── Main (Profil, Sprache, Benutzer)
│   │   ├── ServerStatus
│   │   ├── EmailSettings
│   │   ├── Backup
│   │   ├── GDPR
│   │   ├── Suppliers
│   │   └── GuestProfiles
│   ├── Public (ohne Login)
│   │   ├── GuestMenu (Speisekarte)
│   │   └── DigitalSignage
│   └── AI Features
│       ├── AgentTeam
│       ├── Quiz
│       └── RecipeSuggestions
│
├── 💻 Screens — Tablet (768px)
│   ├── (gleiche Screens, 2-Spalten-Layout wo sinnvoll)
│   └── Rotation: Side-by-Side Tabelle + Detail
│
├── 🖥️ Screens — Desktop (1024px+)
│   ├── (gleiche Screens, max-width Container)
│   ├── Rotation: Volle Tabelle ohne Scroll
│   └── Dashboard: Widget-Grid 3 Spalten
│
├── 🖨️ Print Layouts
│   ├── Rotation Wochenplan (A4 Portrait + Landscape)
│   ├── Buffet-Karten (A5 Landscape, 3 Varianten)
│   ├── Einkaufsliste (A4 Portrait mit Checkboxen)
│   └── HACCP-Protokoll (A4 Portrait)
│
└── 🔄 Flows & Prototyping
    ├── Onboarding → Login → Dashboard
    ├── Rezept erstellen (manuell)
    ├── Rezept importieren (AI: Text/Foto/URL)
    ├── Rotation befüllen (manuell + AI Auto-Fill)
    ├── Temperatur loggen (HACCP)
    ├── Woche planen → Einkauf generieren → Produktionsliste
    ├── Catering-Event anlegen
    ├── Dienstplan befüllen
    └── Quiz spielen
```

---

## Technische Hinweise für den Designer

| Aspekt | Detail |
|--------|--------|
| **Icon-Library** | Lucide Icons (https://lucide.dev) — konsistent verwenden, keine Mischung mit anderen Libraries |
| **Breakpoints** | 375px (mobile), 768px (tablet), 1024px (desktop) |
| **Component Library Basis** | shadcn/ui (New York Style) — https://ui.shadcn.com |
| **Spacing Grid** | 4px Basis (4, 8, 12, 16, 20, 24, 32, 48, 64) |
| **Min. Touch Target** | 44×44px (absolutes Minimum, 48×48px bevorzugt) |
| **Bottom Nav Höhe** | 64px (fest, nicht scrollbar) |
| **Content Padding** | 16px (mobil), 24px (tablet), 32px (desktop) |
| **Bottom Padding** | 96px (für Bottom Nav Clearance) |
| **PWA** | Standalone-Modus, kein Browser-Chrome sichtbar |
| **Auto-Layout** | Überall verwenden für responsive Anpassung |
| **Naming Convention** | Slash-Notation: `Button/Primary/Default`, `Card/Recipe/Mobile` |

---

## Zusammenfassung der Prioritäten

1. **Mobile-First:** Alle Screens zuerst für 375px designen
2. **Touch-Optimiert:** Große Targets, keine Hover-Only-Interaktionen
3. **Küchen-tauglich:** Einhändig bedienbar, schnell erfassbar, robust
4. **Konsistent:** Gleiche Patterns überall wiederverwenden
5. **Warm & Professionell:** Orange-Branding, warme Neutraltöne, kein kaltes Corporate-Feeling
6. **Print-Ready:** Rotation + Buffet-Karten + Einkaufsliste müssen gedruckt funktionieren
7. **Barrierearm:** WCAG AA, Screen-Reader-kompatibel, Farbblindheit berücksichtigen

---

## Copy-Paste Prompts für Figma AI

> **Anleitung:** Diese Prompts einzeln in Figma AI (Make Designs / Figma Make) eingeben.
> Reihenfolge einhalten: Zuerst Tokens & Components, dann Screens.
> Jeden Prompt in ein neues Frame/Section setzen.

---

### Prompt 0: Kontext-Prefix (vor jeden Prompt kopieren)

> Diesen Block vor **jeden** der folgenden Prompts setzen, damit Figma den Kontext kennt.

```
Context: "mise.at" is a kitchen management PWA for hotel kitchens and catering. Used by chefs with wet/gloved hands under time pressure. Mobile-first (375px), touch-optimized (min 44px targets). German UI language.

Brand: Primary orange #F37021, accent green #16A34A, destructive red #EF4444. Warm cream background hsl(30,20%,98%), dark brown text hsl(20,20%,15%), white cards. Border hsl(30,20%,88%). Radius 8px. Fonts: Oswald uppercase for headings, Inter for body, Roboto Mono for numbers/data. Icons: Lucide icon library. Component style: shadcn/ui New York.
```

---

### Prompt 1: Design Tokens — Farbpalette

```
Design a color palette reference sheet for a design system.

Show swatches with hex values and labels for:

Brand Colors:
- Primary: #F37021 (orange)
- Primary Foreground: #FFFFFF
- Accent: #16A34A (green)
- Destructive: #EF4444 (red)

Neutrals:
- Background: hsl(30,20%,98%) — warm cream
- Foreground: hsl(20,20%,15%) — warm dark brown
- Card: #FFFFFF
- Muted: hsl(30,20%,94%)
- Border: hsl(30,20%,88%)

Status Colors (each with solid, foreground, and subtle variant):
- Info: hsl(217,91%,60%) — blue
- Success: hsl(142,76%,36%) — green
- Warning: hsl(38,92%,50%) — amber
- Danger: hsl(0,84%,60%) — red
- Neutral: hsl(220,9%,46%) — gray

Layout as organized grid with clear grouping. Show each color as a rounded rectangle swatch with the color name and hex value below.
```

---

### Prompt 2: Design Tokens — Typografie

```
Design a typography scale reference sheet.

Three font families:
1. Oswald — uppercase, letter-spacing wide — used for all headings (h1-h6), page titles, navigation labels. Show sizes: h1 (30px), h2 (24px), h3 (20px), h4 (18px), h5 (16px), h6 (14px). All uppercase.
2. Inter — regular 400 — used for body text, labels, descriptions. Show sizes: body-lg (18px), body (16px), body-sm (14px), caption (12px).
3. Roboto Mono — used for numbers, temperatures, codes, portions. Show sizes: mono-lg (20px), mono (16px), mono-sm (14px).

Text color: warm dark brown hsl(20,20%,15%). Secondary text: hsl(20,10%,45%). Use warm cream hsl(30,20%,98%) background. Show each sample with the font name, weight, size, and a sample text line in German.
```

---

### Prompt 3: Component — Buttons

```
Design a button component sheet for a kitchen management app. 375px wide frame.

Show all button variants in a grid:
- Variants: Default (orange #F37021 bg, white text), Destructive (red #EF4444), Outline (border only, orange text), Secondary (muted bg hsl(30,20%,94%)), Ghost (transparent, subtle hover), Link (underline, orange)
- Sizes per variant: Small (32px height), Default (36px height), Large (40px height), Icon-only (36x36px square)

All buttons have 8px border-radius, Inter font 14px medium. Include a Lucide icon (Plus, Trash2, Settings) in some examples. Show pressed state with slight scale-down effect. Min touch target 44x44px.

Label examples in German: "Speichern", "Abbrechen", "Loeschen", "Neues Rezept".
```

---

### Prompt 4: Component — Cards, Badges, Inputs

```
Design a component sheet (375px wide) showing:

1. CARD: White background, 8px radius, subtle shadow (shadow-sm), 1px border hsl(30,20%,88%). Show 3 variants:
   - Basic card with header (Oswald uppercase title) + content
   - Card with header + description + content + footer with buttons
   - Compact card (less padding) for list items

2. BADGES: Small rounded pills, 6 variants:
   - Default: orange #F37021 bg, white text
   - Secondary: muted bg, dark text
   - Destructive: red bg, white text
   - Outline: border only, dark text
   - Status badges: info (blue), success (green), warning (amber), danger (red), neutral (gray) — each in solid and subtle variant

3. INPUTS: Full-width input fields:
   - Text input (36px height, 8px radius, border, placeholder in gray)
   - Search input with magnifying glass icon left
   - Number input with +/- stepper buttons
   - Select dropdown with chevron
   - Date picker input with calendar icon

All using Inter font, warm cream background behind. Labels above in Inter 14px medium.
```

---

### Prompt 5: Component — Navigation

```
Design navigation components for a mobile kitchen management app (375px wide).

1. BOTTOM NAV BAR: Fixed bottom, 64px height, white background, top border.
   6 items evenly spaced, each with Lucide icon (24px) above label (12px Inter):
   - Home (Home icon), Planung (CalendarDays), Rezepte (ChefHat), Quiz (Dices), HACCP (Thermometer), Personal (Users)
   - Show active state: orange #F37021 icon + label, slightly thicker icon stroke
   - Show inactive state: gray hsl(220,9%,46%) icon + label
   - Min touch target per item: 60x48px

2. TOP BAR: Sticky top, 48px height, white background, bottom border.
   - Left: back arrow icon (ChevronLeft)
   - Center: page title in Oswald uppercase 16px
   - Right: settings gear icon (Settings)

3. TAB BAR: Horizontal scrollable tabs.
   - Show 6 tabs: "Alle", "Suppen (12)", "Fleisch (45)", "Fisch (8)", "Vegan (23)", "Desserts (18)"
   - Active tab: orange text + orange bottom border 2px
   - Inactive: gray text, no border
   - Inter 14px medium, height 40px
```

---

### Prompt 6: Component — Domain-Specific

```
Design domain-specific components for a kitchen app (375px wide frame).

1. RECIPE CARD: Vertical card, image on top (16:10 ratio, 8px top radius), below: recipe title (Inter 16px semibold), row of small badges (clock icon + "45 Min", utensils icon + "4 Portionen"), row of allergen badges (small red circles with white letter: "A", "C", "G"). White card, shadow-sm, 8px radius.

2. ALLERGEN BADGE: Small circle (24px diameter) with red background #EF4444, white single letter centered (A, B, C... R). Show all 14: A(Gluten), B(Krebstiere), C(Eier), D(Fisch), E(Erdnuesse), F(Soja), G(Milch), H(Schalen), L(Sellerie), M(Senf), N(Sesam), O(Sulfite), P(Lupinen), R(Weichtiere).

3. FRIDGE CARD: White card showing: fridge name (Inter 16px bold), large temperature in Roboto Mono 28px (e.g. "4.2 C"), status badge (green "OK" or red "ALARM"), small text "Letzte Messung: 08:30". Prominent orange "Messen" button bottom.

4. TASK ITEM: Horizontal row with colored priority bar (4px wide, left edge — red/amber/blue), checkbox circle, task text (Inter 14px), subtle timestamp right. Show 3 items with different priorities.

5. SHIFT BADGE: Rounded pill showing shift type. Colors: Frueh (yellow bg), Spaet (blue bg), Teildienst (purple bg), Urlaub (green bg), Krank (red bg), Frei (gray bg). White text, 8px radius, Inter 12px bold.
```

---

### Prompt 7: Screen — Login

```
Design a mobile login screen (375x812px) for "mise.at" kitchen management app.

Top section: Large mise.at logo/wordmark, subtle kitchen background image with dark overlay (opacity 0.3). Warm, professional feel.

Center: White card (8px radius, shadow-md, 24px padding) containing:
- "Anmelden" heading in Oswald uppercase 24px
- Email input field with envelope icon, placeholder "E-Mail"
- Password input field with lock icon, placeholder "Passwort"
- Large orange (#F37021) button "Anmelden" full width, 44px height, white text, 8px radius
- Small "Passwort vergessen?" link below in gray

Background: warm cream hsl(30,20%,98%). The overall feeling should be warm, inviting, professional — not cold corporate.
```

---

### Prompt 8: Screen — Today (Dashboard)

```
Design a mobile dashboard screen (375x812px, scrollable) for a kitchen management app. German language.

Top area (no top bar on this page):
- Greeting: "Guten Morgen, Gerald" in Inter 14px gray, below "Montag, 10. Februar" in Oswald uppercase 20px

Scrollable content (16px horizontal padding, 16px gaps between cards):

CARD 1 — "Gaestezahlen": White card. Title "GAESTEZAHLEN" in Oswald 14px uppercase. 3 columns: City (60), SUED (45), AK (80). Each with location name (12px gray) and number (Roboto Mono 24px bold). Small "Mittag" label.

CARD 2 — "Heutiges Menu": White card. Title "MITTAGSMENUE CITY" in Oswald 14px. List of meal courses:
- Bowl icon (orange) + "Kuerbiscremesuppe" + allergen badges "A G"
- Utensils icon (red) + "Wiener Schnitzel" + "Petersilkartoffeln, Preiselbeeren"
- Leaf icon (green) + "Gemuese-Curry" + "Basmatireis"
- IceCream icon (purple) + "Topfenstrudel"
Each line with course icon, dish name (Inter 15px), side dishes (Inter 13px gray).

CARD 3 — "HACCP Status": White card. Title "HACCP STATUS". Progress bar (green, 75% filled). "6/8 gemessen" text. Row of 3 mini stats: "6 OK" (green), "1 Warnung" (amber), "1 Offen" (gray).

CARD 4 — "Aufgaben": White card. Title "AUFGABEN". 3 task items with colored priority bar (4px left): "Lieferung kontrollieren" (red), "Mise en place Abend" (amber), "Kuehlhaus aufraumen" (blue). Each with checkbox.

Bottom: 5 quick action buttons in a row — small icon circles (48px) with labels below (10px): Planung, Rezepte, Einkauf, Produktion, Briefing.

96px bottom padding for nav clearance. Warm cream background.
```

---

### Prompt 9: Screen — Rezepte (Bibliothek)

```
Design a mobile recipe library screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow left, "REZEPTE" center (Oswald uppercase 16px), settings gear right.

Below top bar: Sticky search bar with magnifying glass icon, placeholder "Rezept suchen...", full width with 16px margins, 40px height, 8px radius, white bg.

Below search: Horizontal scrollable category tabs:
"Alle (335)", "Suppen (42)", "Fleisch (67)", "Fisch (18)", "Vegan (31)", "Beilagen (55)", "Saucen (24)", "Salate (28)", "Desserts (40)"
Active tab "Alle" has orange text + orange bottom border. Others gray.

Recipe cards grid (1 column mobile): Show 4 recipe cards vertically:
1. Image (landscape photo of food, placeholder), below: "Wiener Schnitzel" (Inter 16px semibold), badges row: clock "45 Min", portion "4", allergen circles "A C G"
2. "Kuerbiscremesuppe" with soup image
3. "Gemuese-Curry" with curry image
4. "Topfenstrudel" with pastry image

Each card: white, 8px radius, shadow-sm, full width. Image fills top with 8px top radius.

Floating action button: Bottom right (above nav), 56px circle, orange #F37021, white Plus icon. Shadow-md.

Bottom: 96px padding. Warm cream background.
```

---

### Prompt 10: Screen — Rezept-Detail

```
Design a mobile recipe detail screen as a full-screen modal/dialog (375x812px, scrollable). German language.

Hero section: Large food photo (full width, 240px height) with dark gradient overlay at bottom. Floating close button (X) top right (white, 36px circle). Category badge top left on image ("HAUPTGERICHT" in small orange pill).

Below image:
Title: "Wiener Schnitzel" in Oswald uppercase 24px.

Portion stepper: Row with minus button (circle, outline), large "4" in Roboto Mono 28px, plus button. Label "Portionen" above.

Allergen section: Row of red circle badges: A (Gluten), C (Eier), G (Milch). Each 28px circle with white letter.

Tags: Row of orange-tinted pills (light orange bg, orange text): "oesterreichisch", "klassiker", "paniert"

Section "ZUTATEN" (Oswald 14px uppercase, border-bottom):
Ingredient list, each row: quantity in Roboto Mono (e.g. "600 g"), ingredient name in Inter ("Kalbsschnitzel"), optional allergen code in small red badge.
Show 6-8 ingredients.

Section "ZUBEREITUNG" (Oswald 14px uppercase):
Numbered steps with orange circle (24px, number inside), step text in Inter 14px.
Show 4 steps.

Bottom action bar: Row of icon buttons — Edit (Pencil), PDF, Share (ExternalLink), Delete (Trash2 red). 48px touch targets each.

White background for content area. 16px horizontal padding.
```

---

### Prompt 11: Screen — Rotation (6-Wochen-Editor)

```
Design a mobile rotation planner screen (375x812px, scrollable horizontally and vertically) for a kitchen menu planning app. German language.

Top bar: Back arrow, "ROTATION" (Oswald uppercase), settings gear.

Below top bar (sticky toolbar area):
- Template dropdown: "Standard-Rotation 2025" with chevron-down, full width
- Week selector: 6 toggle buttons in a row "W1 W2 W3 W4 W5 W6". W1 is active (orange bg, white text). Others have outline style.
- Block toggles: 3 pill-toggle buttons: "City Mittag" (active, orange), "City Abend" (active, outline), "SUED Abend" (inactive, gray). These show/hide table sections.
- Action buttons row: "Menue generieren" (orange button with sparkle icon) and "Druckansicht" (outline button with printer icon)

Main content — Data table (horizontally scrollable):
Header row: Days of week "MO DI MI DO FR SA SO" in Oswald 12px uppercase, each column ~120px wide.
Row headers (left sticky column, 80px): "Suppe", "Fleisch", "Beilage 1a", "Beilage 1b", "Vegi", "Beilage 2a", "Beilage 2b", "Dessert" in Inter 12px.

Table cells: Small white rectangles (120x36px) with recipe name in Inter 11px, truncated with ellipsis. Some cells filled ("Gulasch", "Spaetzle"), some empty with dashed border. Tapping a cell would open recipe search.

Show section header "CITY MITTAG" above the table block in Oswald 12px, uppercase, with a subtle orange left border.

Compact layout, small text sizes to fit data. Warm cream background. 96px bottom padding.
```

---

### Prompt 12: Screen — HACCP Temperatur-Logging

```
Design a mobile HACCP temperature logging screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "HACCP" (Oswald uppercase), PDF export icon right.

Summary cards row (3 cards, horizontal scroll or tight grid):
- "6 OK" with green background, checkmark icon
- "1 Warnung" with amber background, alert-triangle icon
- "1 Offen" with gray background, clock icon
Each card: 8px radius, white text, 60px height.

Section title: "KUEHLGERAETE" in Oswald 14px uppercase.

Fridge cards (stacked vertically, full width):

Card 1: "Kuehlhaus 1" (Inter 16px bold). Large "3.8 C" (Roboto Mono 32px). Green badge "OK". Small text "08:30 Uhr" gray. A tiny sparkline showing 7 temperature dots. Big orange button "MESSEN" (full width within card, 44px height).

Card 2: "Kuehlhaus 2" — "5.1 C", amber badge "WARNUNG", sparkline trending up.

Card 3: "Tiefkuehler" — "-18.2 C", green badge "OK".

Card 4: "Dessert-Kuehlung" — no measurement yet, gray badge "OFFEN", "Messen" button prominent.

Each card: white, 8px radius, shadow-sm, 16px padding, 12px gap between cards.

Warm cream background. 96px bottom padding.
```

---

### Prompt 13: Screen — Gaestezahlen

```
Design a mobile guest count management screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "GAESTEZAHLEN" (Oswald uppercase), Excel export icon right.

Below: View toggle — 3 buttons "Tag | Woche | Monat", "Woche" active (orange). Date display: "KW 7 — 10.-16. Feb 2026" with left/right chevron arrows for navigation.

Location tabs: "City | SUED | AK" — "City" active with orange underline.

Weekly grid table:
- Column headers: "MO 10. DI 11. MI 12. DO 13. FR 14. SA 15. SO 16." in Inter 11px
- Row "Fruehstueck": Numbers in each cell (Roboto Mono 14px): 58, 62, 55, 60, 70, 45, 42
- Row "Mittag": 60, 58, 63, 55, 65, 48, 40
- Row "Abend": 45, 50, 48, 52, 55, 38, 35
- Footer row "Summe": Bold totals per day

Each cell is tappable (subtle border, 44px min height). Numbers centered. Active/edited cells have light orange background tint.

Add button: Small "+" button to add a new entry.

Summary card below table: "Wochensumme: 1.245 Gaeste" in a white card with large Roboto Mono number.

Warm cream background. 96px bottom padding.
```

---

### Prompt 14: Screen — Dienstplan

```
Design a mobile staff schedule screen (375x812px, horizontally scrollable) for a kitchen app. German language.

Top bar: Back arrow, "DIENSTPLAN" (Oswald uppercase).

Tabs below: "Dienstplan | Mitarbeiter | Schichten" — "Dienstplan" active.

Week navigation: "KW 7" with left/right arrows. "10.-16. Feb 2026" in gray.

Schedule grid (horizontally scrollable):
- Column headers: MO DI MI DO FR SA SO (Oswald 11px, each 80px wide)
- Left sticky column (100px): Staff names — "Thomas K.", "Maria S.", "Josef R.", "Anna B.", "Lena W."
- Cells contain colored shift badges:
  - "F" yellow pill = Frueh (06:00-14:00)
  - "S" blue pill = Spaet (14:00-22:00)
  - "T" purple pill = Teildienst
  - "U" green pill = Urlaub
  - "K" red pill = Krank
  - "—" gray pill = Frei
  - Empty cells have dashed border (tap to assign)

Each cell min 44px height, badge centered. Compact but tappable.

Bottom summary: "5 Mitarbeiter | 28 Schichten | 2 Frei" in a subtle info bar.

Warm cream background. 96px bottom padding.
```

---

### Prompt 15: Screen — Einkaufsliste

```
Design a mobile shopping list screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "EINKAUFSLISTE" (Oswald uppercase), export icons (PDF, Excel) right.

Date range picker: Two date inputs side by side "Von: 10.02.2026" "Bis: 14.02.2026" with calendar icons.

View toggle: "Kategorie | Lieferant" — "Kategorie" active (orange).

Collapsible category groups:
GROUP 1: "FLEISCH & WURST" (Oswald 13px uppercase, chevron-down icon, right-aligned subtotal "EUR 342,50"). Below:
- "Kalbsschnitzel — 4,8 kg — EUR 86,40" (Inter 14px)
- "Schweinefilet — 3,2 kg — EUR 44,80"
- "Faschiertes — 5,0 kg — EUR 47,50"
Each row with checkbox left, ingredient, quantity (Roboto Mono), price right.

GROUP 2: "MILCHPRODUKTE" (collapsed, chevron-right, "EUR 128,30")

GROUP 3: "GEMUESE & OBST" (expanded):
- "Kartoffeln — 15,0 kg — EUR 22,50"
- "Karotten — 4,0 kg — EUR 7,60"
- "Zwiebeln — 3,0 kg — EUR 4,50"

GROUP 4: "TROCKENWAREN" (collapsed)

Footer bar (sticky bottom, above nav): "GESAMT: EUR 847,20" in Roboto Mono 20px bold, white background, top border, 16px padding.

White cards per group, 8px radius. Warm cream background. 96px bottom padding.
```

---

### Prompt 16: Screen — Catering Events

```
Design a mobile catering events screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "CATERING" (Oswald uppercase), plus icon right (new event).

Filter row: Two small dropdowns side by side — "Alle Typen" and "Alle Status" with chevron-down icons.

Event cards (stacked vertically):

Card 1: Left color bar (4px, yellow = Brunch). Content: "Sonntagsbrunch" (Inter 16px semibold). Below: calendar icon "So, 16.02.2026 | 09:00-13:00", people icon "85 Personen", map-pin icon "Saal A", user icon "Fr. Mueller". Status badge top right: green "BESTAETIGT".

Card 2: Left color bar (purple = Ball). "Faschingsball 2026". "Sa, 01.03.2026 | 19:00-02:00", "220 Personen", "Festsaal". Status: blue "GEPLANT".

Card 3: Left color bar (orange = Buffet). "Firmenevent Sparkasse". "Mi, 19.02.2026 | 11:30-14:00", "45 Personen", "Seminarraum B". Status: amber "IN VORBEREITUNG".

Card 4: Left color bar (gray = Seminar). "Workshop Ernaehrung". "Do, 20.02.2026". Status: gray "ENTWURF".

Each card: white, 8px radius, shadow-sm, 16px padding. Warm cream background. 96px bottom padding.
```

---

### Prompt 17: Screen — Quiz

```
Design a mobile quiz/flashcard screen (375x812px) for a kitchen menu learning game. German language.

Top bar: "MENU-QUIZ" (Oswald uppercase center), close X right.

Progress: Thin orange progress bar below top bar (60% filled). "Frage 6/10" right-aligned small text.

Score area: Row showing "Streak: 4" with fire icon (orange), "Punkte: 450" with star icon.

Main flashcard area (center, large):
White card (280px wide, 200px height, 12px radius, shadow-md, centered). Content:
- Small gray label "Welche Beilagen passen zu..."
- Large dish name: "Wiener Schnitzel" in Oswald 22px uppercase, centered
- Small category badge below: "HAUPTGERICHT" orange pill

Answer options (below card, 4 buttons stacked):
- "Petersilkartoffeln + Preiselbeeren" — white card, full width, 52px height, 8px radius, Inter 15px
- "Spaetzle + Rotkraut" — same style
- "Reis + Brokkoli" — same style
- "Knoedel + Sauerkraut" — same style
Each option has subtle border, tappable (press effect). One option highlighted green (correct) or red (wrong) after selection.

Bottom: "Naechste Frage" orange button (hidden until answered). 96px bottom padding.

Warm cream background. Playful but professional feel.
```

---

### Prompt 18: Screen — Reports Dashboard

```
Design a mobile reports dashboard screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "REPORTS" (Oswald uppercase).

Report cards in a 2-column grid (16px gap):

Row 1:
- "Food-Cost" — Euro icon (DollarSign), subtitle "Kostenanalyse", white card, shadow-sm, 8px radius, chevron-right
- "PAX-Trends" — TrendingUp icon, subtitle "Gaestezahlen", same style

Row 2:
- "HACCP" — Shield icon, subtitle "Compliance-Report"
- "Anomalien" — AlertTriangle icon, subtitle "Temperatur-Alarm"

Row 3:
- "Beliebt" — Heart icon, subtitle "Top-Rezepte"
- "Waste" — Trash icon, subtitle "Abfall-Prognose"

Row 4:
- "PAX Prognose" — Brain icon (AI), subtitle "KI-Vorhersage"
- "Lern-Dashboard" — GraduationCap icon, subtitle "Quiz-Fortschritt"

Each card: 100% column width, ~100px height, centered icon (32px, orange), title (Inter 14px semibold), subtitle (Inter 12px gray), chevron-right icon far right. White background, 8px radius, shadow-sm.

Warm cream background. 96px bottom padding. Clean, scannable layout.
```

---

### Prompt 19: Screen — Einstellungen

```
Design a mobile settings screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "EINSTELLUNGEN" (Oswald uppercase).

Profile section (top card):
- Avatar circle (64px) with initials "GS" in orange bg, white text (Oswald)
- Name: "Gerald Schinagl" (Inter 16px semibold)
- Role badge: "Admin" in orange pill
- Email: "gerald@mise.at" (Inter 14px gray)

Section "ALLGEMEIN" (Oswald 13px uppercase, gray):
- "Sprache" — row with label left, "DE | EN" toggle switch right, DE active
- "Benachrichtigungen" — row with toggle switch
- "Dark Mode" — row with toggle switch (off)

Section "VERWALTUNG":
Menu list items (each a tappable row, 52px height, chevron-right):
- Users icon + "Benutzerverwaltung"
- MapPin icon + "Standorte"
- Truck icon + "Lieferanten"
- UserCheck icon + "Gaesteprofile"

Section "SYSTEM":
- Server icon + "Server-Status"
- Mail icon + "E-Mail Einstellungen"
- Database icon + "Backup & Restore"
- Shield icon + "DSGVO / Datenschutz"

Each section separated by 24px gap. White cards with border, 8px radius. Items have subtle separator lines. Warm cream background. 96px bottom padding.
```

---

### Prompt 20: Screen — Speisekarte (Oeffentlich)

```
Design a mobile public menu screen (375x812px, scrollable) for hotel guests viewing today's menu. German language. No login required, no bottom navigation.

Hero header: Full width, 160px height, gradient from #F37021 (orange) to #D45A10 (darker orange). White text:
- "Küche City" in Oswald 14px uppercase
- "Mittagsmenue" in Oswald 28px uppercase
- "Montag, 10. Februar 2026" in Inter 14px

Content below (white background, 16px padding):

Course cards (stacked, 12px gap):

Card "SUPPE":
- Small label "SUPPE" in Oswald 12px uppercase gray, with bowl icon
- "Kuerbiscremesuppe" in Inter 18px semibold
- Allergen badges: small circles "A" "G" with red bg
- Decorative left border 3px orange

Card "HAUPTGERICHT 1":
- "Wiener Schnitzel" in Inter 18px
- "mit Petersilkartoffeln und Preiselbeeren" in Inter 14px gray
- Allergen badges: "A" "C" "G"
- Left border red (meat)

Card "HAUPTGERICHT 2":
- "Gemuese-Curry" in Inter 18px
- "mit Basmatireis" in Inter 14px gray
- Allergen badges: "F"
- Left border green (vegetarian), small leaf icon

Card "DESSERT":
- "Topfenstrudel mit Vanillesauce"
- Allergen badges: "A" "C" "G"
- Left border purple

Bottom: Allergen legend (small text, all 14 codes listed). QR code icon for sharing.

Clean, elegant, large readable text. No interactive elements needed.
```

---

### Prompt 21: Screen — Allergen-Matrix

```
Design a mobile allergen matrix screen (375x812px, horizontally scrollable) for a kitchen app. German language.

Top bar: Back arrow, "ALLERGEN-MATRIX" (Oswald uppercase).

Date selector: "Montag, 10.02.2026" with left/right arrows.

Conflict banner (conditional): Red background bar with AlertTriangle icon: "Achtung: Gast 'Mueller' hat Allergie gegen Gluten (A) und Milch (G)" — white text, 8px radius.

Matrix table (horizontally scrollable):
- Column headers (sticky top): 14 allergen codes in red circles: A B C D E F G H L M N O P R. Each 28px circle.
- Left sticky column: Dish names in Inter 13px
  - "Kuerbiscremesuppe"
  - "Wiener Schnitzel"
  - "Petersilkartoffeln"
  - "Gemuese-Curry"
  - "Topfenstrudel"

Table cells: Checkmark icon (green, small) where allergen is present, empty/dash where not. Cell size 36x36px. Alternating row backgrounds (white / very subtle cream).

Footer: Allergen legend — compact 2-column list: "A = Gluten, B = Krebstiere, C = Eier..." in Inter 11px gray.

White background for table. 96px bottom padding.
```

---

### Prompt 22: Screen — Agent Team (AI Orchestrator)

```
Design a mobile AI agent dashboard screen (375x812px, scrollable) for a kitchen management app. German language. Futuristic but warm feel.

Top bar: Back arrow, "KI-ASSISTENT" (Oswald uppercase), sparkles icon right.

Pipeline visualization (horizontal scroll):
4 phase cards connected by arrows/lines:
1. "Analyse" — magnifying glass icon, green badge "FERTIG"
2. "Planung" — calendar icon, blue badge pulsing "LAEUFT..."
3. "Optimierung" — zap icon, gray badge "WARTEND"
4. "Zusammenfassung" — file-text icon, gray badge "WARTEND"
Each card 140px wide, 80px height, white, 8px radius, icon centered above label.

AI Summary card: White card with sparkles icon, title "KI-ZUSAMMENFASSUNG" (Oswald 14px). Text content in Inter 14px: "Die Rotation fuer KW 8 wurde optimiert. 3 Konflikte wurden automatisch behoben. Paniertes wurde korrekt mit Kartoffelbeilagen kombiniert."

Section "AKTIONSPUNKTE" (Oswald 14px):
3 action items as cards:
- Red dot left: "Kein Dessert fuer Mittwoch SUD Abend — bitte manuell waehlen"
- Amber dot left: "Fisch am Freitag hat gleiche Beilage wie Donnerstag — Alternative pruefen"
- Blue dot left: "Suppe Dienstag und Donnerstag sind beide Cremesuppen — optional variieren"

Each with Inter 14px text, tappable. Warm cream background. 96px bottom padding.
```

---

### Prompt 23: Screen — Produktionsliste

```
Design a mobile production list screen (375x812px, scrollable) for a kitchen app. German language.

Top bar: Back arrow, "PRODUKTIONSLISTE" (Oswald uppercase), PDF export icon right.

Date range: "10.02. - 14.02.2026" with calendar icon, tappable.

Collapsible meal cards:

CARD 1 (expanded): Header with orange left border:
"MONTAG 10.02. — MITTAG — CITY — 60 PAX" (Oswald 13px uppercase)
Chevron-up icon right (expanded).
Content:
- "Kuerbiscremesuppe" (Inter 15px semibold)
  Indented ingredients: "Kuerbis 6,0 kg | Zwiebeln 0,8 kg | Sahne 1,2 L | Curry 30 g"
  (Roboto Mono 13px for quantities, Inter 13px for names)
- "Wiener Schnitzel" (Inter 15px semibold)
  "Kalbsschnitzel 9,0 kg | Semmelboesel 1,5 kg | Eier 24 Stk | Mehl 0,8 kg"
- "Petersilkartoffeln"
  "Kartoffeln 12,0 kg | Petersilie 120 g | Butter 360 g"

CARD 2 (collapsed): "MONTAG 10.02. — ABEND — CITY — 45 PAX" with chevron-right.
CARD 3 (collapsed): "DIENSTAG 11.02. — MITTAG — CITY — 58 PAX"

Each card: white, 8px radius, shadow-sm. Quantities in Roboto Mono for easy reading. Warm cream background. 96px bottom padding.
```

---

### Prompt 24: Komponente — Empty States

```
Design 4 empty state illustrations for a kitchen management app (375px wide frame). German language. Minimal, warm, friendly style with orange #F37021 accent.

1. "Keine Rezepte": Simple line illustration of an empty cooking pot with a question mark. Text below: "Noch keine Rezepte" (Oswald 18px). "Erstelle dein erstes Rezept oder importiere eines mit KI." (Inter 14px gray). Orange button "Rezept hinzufuegen".

2. "Keine Aufgaben": Illustration of a checkmark in a circle (relaxed). "Alles erledigt!" (Oswald 18px). "Keine offenen Aufgaben fuer heute." (Inter 14px gray).

3. "Keine Messung": Illustration of a thermometer with a clock. "Noch keine Messung heute" (Oswald 18px). "Starte mit der ersten Temperaturkontrolle." (Inter 14px gray). Orange button "Jetzt messen".

4. "Kein Ergebnis": Illustration of a magnifying glass with empty plate. "Keine Ergebnisse" (Oswald 18px). "Versuche einen anderen Suchbegriff." (Inter 14px gray).

Each in a centered layout, illustration ~120px height, muted colors with orange accents. White or cream background.
```

---

### Prompt 25: Print Layout — Buffet-Karten

```
Design a printable buffet card (A5 landscape = 210x148mm) for a hotel kitchen. German language.

Elegant, clean design:
- Large dish name centered: "Wiener Schnitzel" in Oswald uppercase, 36px, dark brown text
- Subtitle: "vom Kalb, mit Petersilkartoffeln und Preiselbeeren" in Inter 16px, gray
- Bottom row: Allergen badges (red circles with white letters): A C G
- Small allergen legend text: "A=Gluten C=Eier G=Milch" in Inter 10px
- Subtle decorative border (thin line, 8px inset from edges)
- Optional: Small mise.at logo bottom right corner, very subtle

Show 3 variants:
1. Standard (as described above)
2. Large text variant (name 48px, for far visibility)
3. Elegant variant (thin serif-style feel, decorative divider line between name and description)

White background. Print-optimized: no shadows, clean lines, high contrast.
```

---

### Prompt 26: Dark Mode — Dashboard

```
Design a dark mode version of the mobile dashboard screen (375x812px) for a kitchen app. German language.

Dark color scheme:
- Background: hsl(20, 15%, 10%) — very dark warm brown
- Card background: hsl(20, 10%, 15%) — slightly lighter
- Text: hsl(30, 20%, 90%) — warm off-white
- Muted text: hsl(20, 10%, 55%)
- Border: hsl(20, 10%, 20%)
- Primary orange stays #F37021
- Status colors stay the same but slightly more saturated

Same layout as light dashboard:
- Greeting "Guten Abend, Gerald"
- PAX card with guest counts
- Today's menu card (Mittagsmenue City)
- HACCP status card
- Task list
- Quick action buttons (orange icons on dark circles)
- Bottom nav (dark bg, orange active item)

The feeling should be warm and cozy — not cold dark gray. Think evening kitchen ambiance. All text must be readable (WCAG AA contrast).
```

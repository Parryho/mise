import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH = path.join(__dirname, '..', 'REZEPT_AUDIT_2026-02-12.xlsx');

const ORANGE = 'FFF37021';
const WHITE = 'FFFFFFFF';
const LIGHT_BLUE = 'FFE3F2FD';
const LIGHT_GREEN = 'FFE8F5E9';
const LIGHT_GRAY = 'FFF5F5F5';
const GREEN_TEXT = 'FF16A34A';
const BLACK = 'FF000000';

function setSectionHeader(sheet, row, text, colCount) {
  const r = sheet.getRow(row);
  sheet.mergeCells(row, 1, row, colCount);
  const cell = r.getCell(1);
  cell.value = text;
  cell.font = { bold: true, size: 12, color: { argb: BLACK } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
  cell.alignment = { vertical: 'middle' };
  r.height = 22;
}

function setDataHeaders(sheet, row, headers) {
  const r = sheet.getRow(row);
  headers.forEach((h, i) => {
    const cell = r.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFB0BEC5' } } };
  });
  r.height = 18;
}

function addDataRow(sheet, rowNum, values, opts = {}) {
  const r = sheet.getRow(rowNum);
  values.forEach((v, i) => {
    const cell = r.getCell(i + 1);
    cell.value = v;
    cell.font = opts.bold ? { bold: true, size: 10 } : { size: 10 };
    if (typeof v === 'string' && v.includes('✅')) {
      cell.font = { ...cell.font, color: { argb: GREEN_TEXT } };
    }
  });
  if ((rowNum % 2) === 0) {
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
    });
  }
}

async function main() {
  console.log('Opening workbook:', EXCEL_PATH);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);
  console.log('Existing sheets:', workbook.worksheets.map(s => s.name).join(', '));

  // Remove old Änderungsprotokoll if exists
  const oldSheet = workbook.getWorksheet('Änderungsprotokoll');
  if (oldSheet) {
    workbook.removeWorksheet(oldSheet.id);
    console.log('Removed old Änderungsprotokoll sheet');
  }

  // Create new comprehensive sheet
  const ws = workbook.addWorksheet('Änderungsprotokoll', {
    properties: { tabColor: { argb: ORANGE } },
  });

  // Move to first position
  workbook.worksheets.forEach((s) => {
    if (s.name !== 'Änderungsprotokoll') s.orderNo = s.orderNo + 1;
  });
  ws.orderNo = 0;

  ws.columns = [
    { width: 18 }, { width: 35 }, { width: 22 }, { width: 22 },
    { width: 30 }, { width: 22 }, { width: 18 },
  ];

  let row = 1;

  // ===== TITLE =====
  ws.mergeCells(row, 1, row, 7);
  const title = ws.getRow(row).getCell(1);
  title.value = 'Rezept-Audit Änderungsprotokoll — 12.02.2026 — 520 Fixes total';
  title.font = { bold: true, size: 14, color: { argb: WHITE } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(row).height = 32;
  row += 2;

  // ===== GESAMTÜBERSICHT =====
  setSectionHeader(ws, row, 'Gesamtübersicht', 7);
  row++;
  setDataHeaders(ws, row, ['Runde', 'Kategorie', 'Anzahl Fixes', 'DB-Tabelle', 'SQL-Datei', 'Status', '']);
  row++;

  const overview = [
    ['Runde 1', 'Allergen-Korrekturen', 13,  'recipes', 'fix-allergen-issues.sql', '✅ Applied'],
    ['Runde 1', 'Portionen normalisiert (1→10)', 263, 'recipes', 'fix-allergen-issues.sql', '✅ Applied'],
    ['Runde 1', 'Übersetzungs-Fixes (EN/TR/UK)', 166, 'recipe_translations + ingredient_translations', 'fix-translations.sql', '✅ Applied'],
    ['Runde 2', 'Fehlende Steps geschrieben', 8,  'recipes', 'fix-missing-steps.sql', '✅ Applied'],
    ['Runde 2', 'Allergen-Detection (46 Rezepte)', 46, 'recipes', 'fix-missing-allergens.sql', '✅ Applied'],
    ['Runde 2', 'Kategorien korrigiert', 11, 'recipes', 'fix-categories.sql', '✅ Applied'],
    ['Runde 2', 'Duplikate entfernt', 8,  'recipes + ingredients + translations', 'fix-duplicates.sql', '✅ Applied'],
    ['Runde 2', 'Bilder korrigiert', 5,  'recipes', 'fix-broken-images.sql', '✅ Applied'],
  ];

  overview.forEach((d) => { addDataRow(ws, row, d); row++; });
  addDataRow(ws, row, ['', 'GESAMT', 520, '', '', '✅ Alle angewendet', ''], { bold: true });
  row += 2;

  // ===== RUNDE 1: ALLERGEN-FIXES =====
  setSectionHeader(ws, row, 'Runde 1 — Allergen-Fixes (13 Rezepte)', 7);
  row++;
  setDataHeaders(ws, row, ['ID', 'Rezeptname', 'Vorher', 'Nachher', 'Änderung', '', 'Status']);
  row++;

  const allergenFixes = [
    [2, 'Leberknödelsuppe', '{C}', '{A,C}', '+A (Gluten)', '', '✅'],
    [34, 'Faschierter Braten', '{C,M}', '{A,C,M}', '+A (Gluten)', '', '✅'],
    [39, 'Fleischlaberl', '{C,M}', '{A,C,M}', '+A (Gluten)', '', '✅'],
    [68, 'Semmelknödel', '{C,G}', '{A,C,G}', '+A (Gluten)', '', '✅'],
    [101, 'Powidltascherl', '{}', '{A}', '+A (Gluten)', '', '✅'],
    [220, 'Sauerbraten', '{C}', '{A,C}', '+A (Gluten)', '', '✅'],
    [221, 'Kalbsbraten', '{C}', '{A,C}', '+A (Gluten)', '', '✅'],
    [228, 'Putenbraten', '{C}', '{A,C}', '+A (Gluten)', '', '✅'],
    [409, 'Semmelkren', '{G}', '{A,G}', '+A (Gluten)', '', '✅'],
    [215, 'Gebackener Karpfen', '{A,C,G}', '{A,C,D,G}', '+D (Fisch)', '', '✅'],
    [261, 'Karpfen blau', '{A,G,L,O}', '{A,D,G,L,O}', '+D (Fisch)', '', '✅'],
    [269, 'Penne al Forno', '{G}', '{D,G}', '+D (Fisch)', '', '✅'],
    [230, 'Ganslbraten', '{A,G,O}', '{A,G,H,O}', '+H (Nüsse)', '', '✅'],
  ];
  allergenFixes.forEach((d) => { addDataRow(ws, row, d); row++; });
  row++;

  // ===== RUNDE 1: PORTIONEN =====
  setSectionHeader(ws, row, 'Runde 1 — Portionen normalisiert (263 Rezepte, 1→10)', 7);
  row++;
  setDataHeaders(ws, row, ['Kategorie', 'Anzahl', 'Vorher', 'Nachher', '', '', 'Status']);
  row++;

  const portionen = [
    ['ClearSoups', 9, 1, 10, '', '', '✅'],
    ['ColdDesserts', 12, 1, 10, '', '', '✅'],
    ['ColdSauces', 7, 1, 10, '', '', '✅'],
    ['CreamSoups', 34, 1, 10, '', '', '✅'],
    ['HotDesserts', 4, 1, 10, '', '', '✅'],
    ['HotSauces', 2, 1, 10, '', '', '✅'],
    ['MainFish', 17, 1, 10, '', '', '✅'],
    ['MainMeat', 37, 1, 10, '', '', '✅'],
    ['MainVegan', 53, 1, 10, '', '', '✅'],
    ['Salads', 1, 1, 10, '', '', '✅'],
    ['Sides', 87, 1, 10, '', '', '✅'],
  ];
  portionen.forEach((d) => { addDataRow(ws, row, d); row++; });
  addDataRow(ws, row, ['Gesamt', 263, '', '', '', '', ''], { bold: true });
  row += 2;

  // ===== RUNDE 2: STEPS =====
  setSectionHeader(ws, row, 'Runde 2 — Fehlende Zubereitungsschritte (8 Rezepte)', 7);
  row++;
  setDataHeaders(ws, row, ['ID', 'Rezeptname', 'Kategorie', 'Schritte hinzugefügt', '', '', 'Status']);
  row++;

  const steps = [
    [429, 'Sauerrahmdip', 'ColdSauces', 6, '', '', '✅'],
    [430, 'Joghurtdip', 'ColdSauces', 8, '', '', '✅'],
    [431, 'Parmesan (gerieben)', 'Sides', 3, '', '', '✅'],
    [432, 'Tomatensauce', 'Sides', 8, '', '', '✅'],
    [433, 'Apfelkompott', 'ColdDesserts', 7, '', '', '✅'],
    [434, 'Birnenkompott', 'ColdDesserts', 8, '', '', '✅'],
    [435, 'Apfelmus', 'ColdDesserts', 7, '', '', '✅'],
    [436, 'Basilikum (frisch)', 'Sides', 4, '', '', '✅'],
  ];
  steps.forEach((d) => { addDataRow(ws, row, d); row++; });
  row++;

  // ===== RUNDE 2: ALLERGEN DETECTION =====
  setSectionHeader(ws, row, 'Runde 2 — Allergen-Detection (46 Rezepte geprüft)', 7);
  row++;
  setDataHeaders(ws, row, ['ID', 'Rezeptname', 'Erkannte Allergene', 'Methode', '', '', 'Status']);
  row++;

  const allergenDetect = [
    [27, 'Stelze', '{A}', 'Bier → Gluten', '', '', '✅'],
    [57, 'Krautstrudel', '{A}', 'Strudelteig → Gluten', '', '', '✅'],
    [72, 'Kroketten', '{A,G}', 'Fertigprodukt → Gluten+Milch', '', '', '✅'],
    [78, 'Speckkraut', '{L}', 'Rinderbrühe → Sellerie', '', '', '✅'],
    [126, 'Bauernfrühstück', '{C}', 'Eier', '', '', '✅'],
    [128, 'Eierspeis', '{C}', 'Eierspeis = Rührei', '', '', '✅'],
    [162, 'Bruschetta', '{A}', 'Brot → Gluten', '', '', '✅'],
    [224, 'Spanferkel', '{L}', 'Gemüsefond → Sellerie', '', '', '✅'],
    [229, 'Entenkeule', '{L}', 'Entenfond → Sellerie', '', '', '✅'],
    [242, 'Grillhendl', '{O}', 'Aperol → Sulfite', '', '', '✅'],
    [267, 'Pasta Arrabiata', '{A}', 'Penne → Gluten', '', '', '✅'],
    [274, 'Spaghetti Aglio e Olio', '{A}', 'Spaghetti → Gluten', '', '', '✅'],
    [278, 'Spinatstrudel', '{A}', 'Strudelteig → Gluten', '', '', '✅'],
    [324, 'Kartoffelgratin', '{G}', 'Gratin → Milch/Sahne', '', '', '✅'],
    [344, 'Penne', '{A}', 'Penne → Gluten', '', '', '✅'],
    [348, 'Risotto', '{L}', 'Gemüsebrühe → Sellerie', '', '', '✅'],
    [352, 'Ebly/Weizen', '{A,L}', 'Ebly=Weizen + Brühe→Sellerie', '', '', '✅'],
    [373, 'Wurzelgemüse', '{L}', 'Wurzelmischung → Sellerie', '', '', '✅'],
    [398, 'Ofengemüse', '{L}', 'Wurzelmischung → Sellerie', '', '', '✅'],
    [417, 'Marillenröster', '{O}', 'Marillenbrand → Sulfite', '', '', '✅'],
  ];
  allergenDetect.forEach((d) => { addDataRow(ws, row, d); row++; });

  // Add note about 26 without allergens
  addDataRow(ws, row, ['', '+ 26 Rezepte als "geprüft, keine Allergene" markiert', '', 'allergen_status=auto', '', '', '✅'], { bold: false });
  row += 2;

  // ===== RUNDE 2: KATEGORIEN =====
  setSectionHeader(ws, row, 'Runde 2 — Kategorie-Korrekturen (11 Rezepte)', 7);
  row++;
  setDataHeaders(ws, row, ['ID', 'Rezeptname', 'Alte Kategorie', 'Neue Kategorie', 'Begründung', '', 'Status']);
  row++;

  const categories = [
    [53, 'Topfenknödel', 'MainVegan', 'HotDesserts', 'Süße Topfenknödel = Dessert', '', '✅'],
    [54, 'Marillenknödel', 'MainVegan', 'HotDesserts', 'Süße Fruchtknödel = Dessert', '', '✅'],
    [55, 'Zwetschgenknödel', 'MainVegan', 'HotDesserts', 'Süße Fruchtknödel = Dessert', '', '✅'],
    [56, 'Mohnnudeln', 'MainVegan', 'HotDesserts', 'Süße Mehlspeise = Dessert', '', '✅'],
    [33, 'Altwiener Suppentopf', 'MainMeat', 'ClearSoups', 'Suppentopf = Suppe', '', '✅'],
    [187, 'Kalbsknochensuppe', 'CreamSoups', 'ClearSoups', 'Klare Knochenbrühe', '', '✅'],
    [192, 'Gulaschsuppe', 'CreamSoups', 'ClearSoups', 'Brühe, nicht püriert', '', '✅'],
    [198, 'Frz. Zwiebelsuppe', 'CreamSoups', 'ClearSoups', 'Klare Brühe + Gruyère', '', '✅'],
    [210, 'Borschtsch', 'CreamSoups', 'ClearSoups', 'Klare Rübenbrühe', '', '✅'],
    [269, 'Penne al Forno', 'MainFish', 'MainVegan', 'Nudelauflauf, kein Fisch', '', '✅'],
    [414, 'Vanillesauce', 'ColdSauces', 'HotSauces', 'Wird warm serviert', '', '✅'],
  ];
  categories.forEach((d) => { addDataRow(ws, row, d); row++; });
  row++;

  // ===== RUNDE 2: DUPLIKATE =====
  setSectionHeader(ws, row, 'Runde 2 — Duplikate entfernt (8 Rezepte gelöscht, 412 verbleibend)', 7);
  row++;
  setDataHeaders(ws, row, ['Gelöscht ID', 'Gelöschter Name', 'Behalten ID', 'Behaltener Name', 'Grund', '', 'Status']);
  row++;

  const duplicates = [
    [311, 'Gefüllte Paprika', 428, 'Gefüllte Paprika', 'Bessere Datenqualität (428)', '', '✅'],
    [245, 'Beuscherl', 30, 'Beuschel', 'Schreibvariante', '', '✅'],
    [381, 'Bratgemüse (Mischung)', 87, 'Bratgemüse', '87 hat mehr Zutaten', '', '✅'],
    [371, 'Karottengemüse glasiert', 88, 'Karottengemüse', 'Gleiches Gericht', '', '✅'],
    [363, 'Kohlsprossen/Rosenkohl', 89, 'Kohlsprossen', 'Alias-Name', '', '✅'],
    [128, 'Eierspeis', 316, 'Eierspeise/Bauernomelett', '316 hat Allergene', '', '✅'],
    [399, 'Ratatouille (Beilage)', 306, 'Ratatouille', '306 hat mehr Zutaten', '', '✅'],
    [288, 'Kartoffelgratin', 324, 'Kartoffelgratin (Beilage)', '324 hat stärke-Tag', '', '✅'],
  ];
  duplicates.forEach((d) => { addDataRow(ws, row, d); row++; });
  addDataRow(ws, row, ['', 'FK-Referenzen umgeleitet:', '', '16 rotation_slots + 13 menu_plans', '', '', '✅'], { bold: false });
  row += 2;

  // ===== RUNDE 2: BILDER =====
  setSectionHeader(ws, row, 'Runde 2 — Bilder korrigiert (5 falsche Bilder)', 7);
  row++;
  setDataHeaders(ws, row, ['ID', 'Rezeptname', 'Problem', 'Fix', '', '', 'Status']);
  row++;

  const images = [
    [34, 'Faschierter Braten', 'Schweinsbraten-Bild', 'Neues Bild von gutekueche.at', '', '', '✅'],
    [146, 'Wiener Melange', 'Kaiserschmarrn-Bild', 'NULL → Kategorie-Fallback', '', '', '✅'],
    [147, 'Einspänner', 'Kaiserschmarrn-Bild', 'Neues Bild von chefkoch.de', '', '', '✅'],
    [185, 'Steirische Wurzelsuppe', 'Pfannengemüse-Bild', 'Neues Suppenbild von chefkoch.de', '', '', '✅'],
    [419, 'Mohnbutter', 'Mohnnudeln-Bild', 'Mohnbutter-Bild von chefkoch.de', '', '', '✅'],
  ];
  images.forEach((d) => { addDataRow(ws, row, d); row++; });
  row += 2;

  // ===== FINAL SUMMARY =====
  setSectionHeader(ws, row, 'Endergebnis — Rezeptdatenbank nach Audit', 7);
  row++;

  const summary = [
    ['Rezepte gesamt:', '412', '(vorher 420, 8 Duplikate entfernt)'],
    ['Rezepte mit Steps:', '412 (100%)', '(vorher 98%)'],
    ['Rezepte mit Allergenen:', '386 (94%)', '(vorher 89%, +26 als "keine" bestätigt)'],
    ['Portionen normalisiert:', '412 (100%)', '(vorher 63% mit Portions=1)'],
    ['Übersetzungen (EN/TR/UK):', '~98% korrekt', '(vorher ~91%)'],
    ['Kategorien korrekt:', '412 (100%)', '(11 umkategorisiert)'],
    ['Bilder korrekt:', '407 (99%)', '(5 falsche korrigiert)'],
    ['Änderungen gesamt:', '520 DB-Operationen', 'in 7 SQL-Dateien dokumentiert'],
    ['Durchgeführt:', '12.02.2026', 'automatisiert via Claude Code'],
  ];

  summary.forEach((d) => {
    const r = ws.getRow(row);
    r.getCell(1).value = d[0];
    r.getCell(1).font = { bold: true, size: 11 };
    r.getCell(2).value = d[1];
    r.getCell(2).font = { bold: true, size: 11, color: { argb: GREEN_TEXT } };
    r.getCell(3).value = d[2];
    r.getCell(3).font = { size: 10, color: { argb: 'FF666666' } };
    row++;
  });

  // Freeze panes
  ws.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

  await workbook.xlsx.writeFile(EXCEL_PATH);
  console.log('Excel updated with comprehensive Änderungsprotokoll!');

  // Verify
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile(EXCEL_PATH);
  console.log('\nSheets:');
  wb2.worksheets.forEach((s, i) => console.log(`  ${i}: "${s.name}" (${s.rowCount} rows)`));
}

main().catch((err) => { console.error('Error:', err); process.exit(1); });

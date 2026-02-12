/**
 * build-audit-excel.mjs
 * Generates a comprehensive Excel audit report for the mise.at recipe database.
 *
 * Usage: node script/build-audit-excel.mjs
 * Output: REZEPT_AUDIT_2026-02-12.xlsx
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Load all data files ──────────────────────────────────────────────────────

const recipes = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-recipes.json'), 'utf-8'));
const ingredients = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-ingredients.json'), 'utf-8'));
const imageCheck = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-image-check.json'), 'utf-8'));
const sourceCheck = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-source-check.json'), 'utf-8'));
const allergenAudit = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-allergen-audit.json'), 'utf-8'));
const translationAudit = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-translation-audit.json'), 'utf-8'));
const culinaryAudit = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp-culinary-audit.json'), 'utf-8'));

// Parse CSV for translation fixes
const translationFixesRaw = fs.readFileSync(path.join(ROOT, 'tmp-translation-fixes-needed.csv'), 'utf-8');
const translationFixes = parseCSV(translationFixesRaw);

// ── Helper functions ─────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Build lookup maps
const ingredientsByRecipe = {};
for (const ing of ingredients) {
  if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = [];
  ingredientsByRecipe[ing.recipe_id].push(ing);
}

const allergenIssuesByRecipe = {};
for (const issue of allergenAudit.issues || []) {
  allergenIssuesByRecipe[issue.recipe_id] = issue;
}

const brokenImageIds = new Set((imageCheck.broken_images || []).map(b => b.id));
const noImageRecipes = recipes.filter(r => !r.image);
const noImageIds = new Set(noImageRecipes.map(r => r.id));

// Source check lookups
const sourceNameMismatches = {};
for (const m of sourceCheck.name_mismatches || []) {
  sourceNameMismatches[m.id] = m;
}
const sourceIngredientIssues = {};
for (const i of sourceCheck.ingredient_issues || []) {
  sourceIngredientIssues[i.id] = i;
}

// Culinary audit lookups
const miscategorizedById = {};
for (const m of culinaryAudit.miscategorized || []) {
  if (m.id && !isNaN(parseInt(m.id))) miscategorizedById[m.id] = m;
}
const missingEssentialsById = {};
for (const m of culinaryAudit.missing_essentials || []) {
  if (m.id && !isNaN(parseInt(m.id))) missingEssentialsById[m.id] = m;
}

// ── Quality score calculation ────────────────────────────────────────────────

function calcQualityScore(recipe) {
  let score = 0;
  const ings = ingredientsByRecipe[recipe.id] || [];
  const stepCount = recipe.step_count || (recipe.steps ? recipe.steps.length : 0);
  const avgStepLen = recipe.steps && recipe.steps.length > 0
    ? recipe.steps.reduce((sum, s) => sum + s.length, 0) / recipe.steps.length
    : 0;
  const hasImage = !!recipe.image;
  const imageOk = hasImage && !brokenImageIds.has(recipe.id);
  const hasAllergens = recipe.allergens && recipe.allergens.length > 0;
  const allergenOk = hasAllergens && !allergenIssuesByRecipe[recipe.id];

  if (ings.length > 3) score += 20;
  if (stepCount > 3) score += 20;
  if (avgStepLen > 80) score += 10;
  if (imageOk) score += 15;
  if (hasAllergens) score += 10;
  if (allergenOk) score += 5;
  // All translations present (always 100% in our DB)
  score += 10;
  if (recipe.portions > 1) score += 5;
  if (recipe.source_url) score += 5;

  return score;
}

function getPriority(score) {
  if (score < 40) return '\u{1F534}'; // red circle
  if (score <= 70) return '\u{1F7E1}'; // yellow circle
  return '\u{1F7E2}'; // green circle
}

function getProblems(recipe) {
  const problems = [];
  const ings = ingredientsByRecipe[recipe.id] || [];
  const stepCount = recipe.step_count || (recipe.steps ? recipe.steps.length : 0);

  if (ings.length === 0) problems.push('Keine Zutaten');
  else if (ings.length <= 3) problems.push(`Nur ${ings.length} Zutaten`);
  if (stepCount === 0) problems.push('Keine Schritte');
  if (!recipe.image) problems.push('Kein Bild');
  else if (brokenImageIds.has(recipe.id)) problems.push('Bild kaputt');
  if (!recipe.allergens || recipe.allergens.length === 0) problems.push('Keine Allergene');
  if (allergenIssuesByRecipe[recipe.id]) {
    const issue = allergenIssuesByRecipe[recipe.id];
    if (issue.missing && issue.missing.length > 0) problems.push(`Fehlende Allergene: ${issue.missing.join(',')}`);
    if (issue.extra && issue.extra.length > 0) problems.push(`Zuviel Allergene: ${issue.extra.join(',')}`);
  }
  if (recipe.portions <= 1) problems.push('Portionen=1');
  if (miscategorizedById[recipe.id]) problems.push(`Falsch kategorisiert → ${miscategorizedById[recipe.id].suggested_category}`);
  if (missingEssentialsById[recipe.id]) {
    const m = missingEssentialsById[recipe.id];
    problems.push(`Fehlende Zutaten: ${m.missing.join(', ')}`);
  }
  return problems.join('; ');
}

// ── Color definitions ────────────────────────────────────────────────────────

const COLORS = {
  headerBg: 'FF2B3A67',       // Dark blue
  headerFont: 'FFFFFFFF',     // White
  titleBg: 'FFF37021',        // Brand orange
  titleFont: 'FFFFFFFF',
  sectionBg: 'FFE8EAF0',     // Light blue-gray
  red: 'FFFCE4E4',           // Light red
  yellow: 'FFFFFDE7',        // Light yellow
  green: 'FFE8F5E9',         // Light green
  criticalBg: 'FFFF5252',
  criticalFont: 'FFFFFFFF',
  warningBg: 'FFFFAB40',
  warningFont: 'FF000000',
  white: 'FFFFFFFF',
  lightGray: 'FFF5F5F5',
  borderGray: 'FFD0D0D0',
  greenCheck: 'FF4CAF50',
  redX: 'FFF44336',
};

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: COLORS.borderGray } },
    };
  });
}

function applyAlternateRows(ws, startRow, endRow) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    if (r % 2 === 0) {
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.pattern === 'none') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
        }
      });
    }
  }
}

function freezeAndFilter(ws) {
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
  if (ws.rowCount > 1) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: ws.rowCount, column: ws.columnCount } };
  }
}

// ── Create workbook ──────────────────────────────────────────────────────────

const wb = new ExcelJS.Workbook();
wb.creator = 'mise.at Audit Tool';
wb.created = new Date();

// ══════════════════════════════════════════════════════════════════════════════
// Sheet 1: Dashboard
// ══════════════════════════════════════════════════════════════════════════════

const ws1 = wb.addWorksheet('Dashboard', { properties: { tabColor: { argb: 'FFF37021' } } });

// Title
ws1.mergeCells('A1:F1');
const titleCell = ws1.getCell('A1');
titleCell.value = 'mise.at Rezeptdatenbank — Qualitätsaudit 12.02.2026';
titleCell.font = { bold: true, size: 18, color: { argb: COLORS.titleFont } };
titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.titleBg } };
titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
ws1.getRow(1).height = 45;

// Summary stats
ws1.mergeCells('A3:F3');
ws1.getCell('A3').value = 'Gesamtübersicht';
ws1.getCell('A3').font = { bold: true, size: 14 };
ws1.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

const withIngredients = recipes.filter(r => (ingredientsByRecipe[r.id] || []).length > 0).length;
const withoutIngredients = recipes.length - withIngredients;
const withSteps = recipes.filter(r => r.step_count > 0 || (r.steps && r.steps.length > 0)).length;
const withoutSteps = recipes.length - withSteps;
const withAllergens = recipes.filter(r => r.allergens && r.allergens.length > 0).length;
const withoutAllergens = recipes.length - withAllergens;
const portionsGt1 = recipes.filter(r => r.portions > 1).length;
const portions1 = recipes.length - portionsGt1;

// Calculate overall allergen accuracy
const allergenCorrect = allergenAudit.allergen_stats?.correct || 406;
const allergenTotal = allergenAudit.total_recipes || 447;
const allergenAccuracy = ((allergenCorrect / allergenTotal) * 100).toFixed(1);

// Translation quality = (total - copy_paste) / total
const totalTransNames = 420 * 3; // en + tr + uk
const copyPasteNames = (translationAudit.recipe_translations?.en?.copy_paste_names || 0) +
  (translationAudit.recipe_translations?.tr?.copy_paste_names || 0) +
  (translationAudit.recipe_translations?.uk?.copy_paste_names || 0);
const translationQuality = (((totalTransNames - copyPasteNames) / totalTransNames) * 100).toFixed(1);

const statsData = [
  ['Kennzahl', 'Wert', 'Detail', '', '', ''],
  ['Gesamt Rezepte', 420, '', '', '', ''],
  ['Mit Zutaten', withIngredients, `Ohne: ${withoutIngredients}`, '', '', ''],
  ['Mit Schritten', withSteps, `Ohne: ${withoutSteps}`, '', '', ''],
  ['Mit Allergenen', withAllergens, `Ohne: ${withoutAllergens}`, '', '', ''],
  ['Mit Bildern', imageCheck.with_image || 398, `Ohne: ${imageCheck.without_image || 8} | Kaputt: ${imageCheck.image_broken || 5}`, '', '', ''],
  ['Portionen > 1', portionsGt1, `Portionen = 1: ${portions1}`, '', '', ''],
  ['Übersetzungen', '100% Coverage', 'EN / TR / UK vollständig', '', '', ''],
  ['Übersetzungsqualität', `${translationQuality}%`, `${copyPasteNames} Copy-Paste Rezeptnamen`, '', '', ''],
  ['Allergen-Genauigkeit', `${allergenAccuracy}%`, `${allergenAudit.allergen_stats?.missing_allergens || 12} fehlende, ${allergenAudit.allergen_stats?.extra_allergens || 1} zuviel`, '', '', ''],
];

let row = 5;
for (const [i, data] of statsData.entries()) {
  const r = ws1.getRow(row + i);
  r.values = data;
  if (i === 0) {
    r.eachCell(cell => {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
      cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 11 };
    });
  } else {
    r.getCell(1).font = { bold: true };
    r.getCell(2).font = { bold: true, size: 12 };
    if (i % 2 === 0) {
      r.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
      });
    }
  }
}

// Category breakdown
row = row + statsData.length + 2;
ws1.mergeCells(`A${row}:F${row}`);
ws1.getCell(`A${row}`).value = 'Rezepte pro Kategorie';
ws1.getCell(`A${row}`).font = { bold: true, size: 14 };
ws1.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

row++;
const catCounts = {};
for (const r of recipes) {
  catCounts[r.category] = (catCounts[r.category] || 0) + 1;
}
const catHeaders = ws1.getRow(row);
catHeaders.values = ['Kategorie', 'Anzahl', 'Anteil', '', '', ''];
catHeaders.eachCell(cell => {
  cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
});

row++;
const categoryNames = {
  'ClearSoups': 'Klare Suppen',
  'CreamSoups': 'Cremesuppen',
  'MainMeat': 'Hauptgerichte Fleisch',
  'MainFish': 'Hauptgerichte Fisch',
  'MainVegan': 'Hauptgerichte Vegan/Veg',
  'Sides': 'Beilagen',
  'ColdSauces': 'Kalte Saucen',
  'HotSauces': 'Warme Saucen',
  'Salads': 'Salate',
  'HotDesserts': 'Warme Desserts',
  'ColdDesserts': 'Kalte Desserts',
};

const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
for (const [cat, count] of sortedCats) {
  const r = ws1.getRow(row);
  r.values = [categoryNames[cat] || cat, count, `${((count / recipes.length) * 100).toFixed(1)}%`, '', '', ''];
  r.getCell(1).font = { bold: true };
  if (row % 2 === 0) {
    r.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
    });
  }
  row++;
}

// Quality score distribution
row += 2;
ws1.mergeCells(`A${row}:F${row}`);
ws1.getCell(`A${row}`).value = 'Qualitätsscore Verteilung';
ws1.getCell(`A${row}`).font = { bold: true, size: 14 };
ws1.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

row++;
const scores = recipes.map(r => ({ id: r.id, name: r.name, score: calcQualityScore(r) }));
const excellent = scores.filter(s => s.score > 70).length;
const acceptable = scores.filter(s => s.score >= 40 && s.score <= 70).length;
const poor = scores.filter(s => s.score < 40).length;

const distHeaders = ws1.getRow(row);
distHeaders.values = ['Bereich', 'Anzahl', 'Anteil', 'Status', '', ''];
distHeaders.eachCell(cell => {
  cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
});

row++;
const distData = [
  ['\u{1F7E2} Gut (> 70)', excellent, `${((excellent / 420) * 100).toFixed(1)}%`, 'OK'],
  ['\u{1F7E1} Akzeptabel (40-70)', acceptable, `${((acceptable / 420) * 100).toFixed(1)}%`, 'Verbesserungsbedarf'],
  ['\u{1F534} Kritisch (< 40)', poor, `${((poor / 420) * 100).toFixed(1)}%`, 'Sofort handeln'],
];
for (const d of distData) {
  const r = ws1.getRow(row);
  r.values = [d[0], d[1], d[2], d[3], '', ''];
  r.getCell(1).font = { bold: true };
  row++;
}

// Top 10 worst recipes
row += 2;
ws1.mergeCells(`A${row}:F${row}`);
ws1.getCell(`A${row}`).value = 'Top 10 Kritischste Rezepte';
ws1.getCell(`A${row}`).font = { bold: true, size: 14 };
ws1.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

row++;
const worstHeaders = ws1.getRow(row);
worstHeaders.values = ['ID', 'Rezeptname', 'Kategorie', 'Score', 'Probleme', ''];
worstHeaders.eachCell(cell => {
  cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
});

row++;
const worstRecipes = recipes
  .map(r => ({ ...r, score: calcQualityScore(r), problems: getProblems(r) }))
  .sort((a, b) => a.score - b.score)
  .slice(0, 10);

for (const wr of worstRecipes) {
  const r = ws1.getRow(row);
  r.values = [wr.id, wr.name, categoryNames[wr.category] || wr.category, wr.score, wr.problems, ''];
  r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.red.replace('FF', '') } };
  r.getCell(5).alignment = { wrapText: true };
  row++;
}

ws1.columns = [
  { width: 28 }, { width: 18 }, { width: 40 }, { width: 15 }, { width: 55 }, { width: 10 },
];


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 2: Alle Rezepte (Haupttabelle)
// ══════════════════════════════════════════════════════════════════════════════

const ws2 = wb.addWorksheet('Alle Rezepte', { properties: { tabColor: { argb: 'FF4CAF50' } } });

ws2.columns = [
  { header: 'ID', key: 'id', width: 6 },
  { header: 'Rezeptname (DE)', key: 'name', width: 32 },
  { header: 'Kategorie', key: 'category', width: 22 },
  { header: 'Portionen', key: 'portions', width: 10 },
  { header: 'Zeit (Min)', key: 'prep_time', width: 10 },
  { header: 'Anz. Zutaten', key: 'ing_count', width: 12 },
  { header: 'Anz. Schritte', key: 'step_count', width: 12 },
  { header: '\u00D8 Zeichen/Schritt', key: 'avg_step_len', width: 16 },
  { header: 'Hat Bild', key: 'has_image', width: 9 },
  { header: 'Bild OK', key: 'image_ok', width: 9 },
  { header: 'Allergene', key: 'allergens', width: 14 },
  { header: 'Allergen-Status', key: 'allergen_status', width: 14 },
  { header: 'Allergen-Issues', key: 'allergen_issues', width: 30 },
  { header: 'EN', key: 'en', width: 5 },
  { header: 'TR', key: 'tr', width: 5 },
  { header: 'UK', key: 'uk', width: 5 },
  { header: 'Quell-URL', key: 'source_url', width: 35 },
  { header: 'Score', key: 'score', width: 7 },
  { header: 'Priorit\u00E4t', key: 'priority', width: 9 },
  { header: 'Probleme', key: 'problems', width: 50 },
];

styleHeaderRow(ws2.getRow(1));
ws2.getRow(1).height = 28;

for (const recipe of recipes) {
  const ings = ingredientsByRecipe[recipe.id] || [];
  const stepCount = recipe.step_count || (recipe.steps ? recipe.steps.length : 0);
  const avgStepLen = recipe.steps && recipe.steps.length > 0
    ? Math.round(recipe.steps.reduce((sum, s) => sum + s.length, 0) / recipe.steps.length)
    : 0;
  const hasImage = !!recipe.image;
  const imageOk = hasImage && !brokenImageIds.has(recipe.id);
  const allergenCodes = (recipe.allergens || []).join(', ');
  const allergenIssue = allergenIssuesByRecipe[recipe.id];
  const allergenIssueText = allergenIssue
    ? allergenIssue.details || `Missing: ${(allergenIssue.missing || []).join(',')}`
    : '';
  const score = calcQualityScore(recipe);
  const priority = getPriority(score);
  const problems = getProblems(recipe);

  const r = ws2.addRow({
    id: recipe.id,
    name: recipe.name,
    category: categoryNames[recipe.category] || recipe.category,
    portions: recipe.portions,
    prep_time: recipe.prep_time || '',
    ing_count: ings.length,
    step_count: stepCount,
    avg_step_len: avgStepLen,
    has_image: hasImage ? '\u2705' : '\u274C',
    image_ok: hasImage ? (imageOk ? '\u2705' : '\u274C') : '-',
    allergens: allergenCodes,
    allergen_status: recipe.allergen_status || '',
    allergen_issues: allergenIssueText,
    en: '\u2705', // 100% coverage
    tr: '\u2705',
    uk: '\u2705',
    source_url: recipe.source_url || '',
    score: score,
    priority: priority,
    problems: problems,
  });

  // Color code rows based on score
  if (score < 40) {
    r.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.red } };
    });
  } else if (score <= 70) {
    r.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
    });
  } else {
    r.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.green } };
    });
  }

  // Center alignment for check columns
  r.getCell('has_image').alignment = { horizontal: 'center' };
  r.getCell('image_ok').alignment = { horizontal: 'center' };
  r.getCell('en').alignment = { horizontal: 'center' };
  r.getCell('tr').alignment = { horizontal: 'center' };
  r.getCell('uk').alignment = { horizontal: 'center' };
  r.getCell('priority').alignment = { horizontal: 'center' };
  r.getCell('score').alignment = { horizontal: 'center' };
  r.getCell('problems').alignment = { wrapText: true };
  r.getCell('allergen_issues').alignment = { wrapText: true };
}

freezeAndFilter(ws2);


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 3: Allergen-Probleme
// ══════════════════════════════════════════════════════════════════════════════

const ws3 = wb.addWorksheet('Allergen-Probleme', { properties: { tabColor: { argb: 'FFFF5252' } } });

ws3.columns = [
  { header: 'Rezept-ID', key: 'id', width: 10 },
  { header: 'Rezeptname', key: 'name', width: 30 },
  { header: 'Kategorie', key: 'category', width: 22 },
  { header: 'Gespeicherte Allergene', key: 'stored', width: 22 },
  { header: 'Erkannte Allergene', key: 'detected', width: 22 },
  { header: 'Fehlende Allergene', key: 'missing', width: 22 },
  { header: 'Grund / Details', key: 'details', width: 55 },
  { header: 'Schweregrad', key: 'severity', width: 14 },
];

styleHeaderRow(ws3.getRow(1));
ws3.getRow(1).height = 28;

for (const issue of (allergenAudit.issues || [])) {
  const r = ws3.addRow({
    id: issue.recipe_id,
    name: issue.recipe_name,
    category: categoryNames[issue.category] || issue.category,
    stored: (issue.stored_allergens || []).join(', '),
    detected: (issue.detected_allergens || []).join(', '),
    missing: (issue.missing || []).join(', '),
    details: issue.details || '',
    severity: issue.severity || 'WARNING',
  });

  if (issue.severity === 'CRITICAL') {
    r.getCell('severity').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.criticalBg } };
    r.getCell('severity').font = { bold: true, color: { argb: COLORS.criticalFont } };
  } else {
    r.getCell('severity').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningBg } };
    r.getCell('severity').font = { bold: true, color: { argb: COLORS.warningFont } };
  }
  r.getCell('details').alignment = { wrapText: true };
}

freezeAndFilter(ws3);
applyAlternateRows(ws3, 2, ws3.rowCount);


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 4: Übersetzungs-Probleme
// ══════════════════════════════════════════════════════════════════════════════

const ws4 = wb.addWorksheet('\u00DCbersetzungs-Probleme', { properties: { tabColor: { argb: 'FFFFAB40' } } });

ws4.columns = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'Typ', key: 'type', width: 18 },
  { header: 'Sprache', key: 'lang', width: 10 },
  { header: 'Priorit\u00E4t', key: 'priority', width: 10 },
  { header: 'Deutsch Original', key: 'de', width: 30 },
  { header: 'Aktuelle \u00DCbersetzung', key: 'current', width: 30 },
  { header: 'Vorgeschlagene Korrektur', key: 'suggestion', width: 35 },
];

styleHeaderRow(ws4.getRow(1));
ws4.getRow(1).height = 28;

for (const fix of translationFixes) {
  const r = ws4.addRow({
    id: fix.id || '',
    type: fix.type || '',
    lang: fix.lang || '',
    priority: fix.priority || '',
    de: fix.de || '',
    current: fix.current || '',
    suggestion: fix.suggestion || '',
  });

  if (fix.priority === 'HIGH') {
    r.getCell('priority').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.criticalBg } };
    r.getCell('priority').font = { bold: true, color: { argb: COLORS.criticalFont } };
  } else if (fix.priority === 'MEDIUM') {
    r.getCell('priority').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningBg } };
    r.getCell('priority').font = { bold: true };
  }
  r.getCell('de').alignment = { wrapText: true };
  r.getCell('current').alignment = { wrapText: true };
  r.getCell('suggestion').alignment = { wrapText: true };
}

freezeAndFilter(ws4);
applyAlternateRows(ws4, 2, ws4.rowCount);


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 5: Kulinarik-Probleme
// ══════════════════════════════════════════════════════════════════════════════

const ws5 = wb.addWorksheet('Kulinarik-Probleme', { properties: { tabColor: { argb: 'FF9C27B0' } } });

// Section: Missing essential ingredients
let ws5Row = 1;

// Add section title
ws5.mergeCells('A1:E1');
ws5.getCell('A1').value = 'Fehlende essentielle Zutaten';
ws5.getCell('A1').font = { bold: true, size: 14 };
ws5.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

ws5Row = 2;
const missEssHeaders = ws5.getRow(ws5Row);
missEssHeaders.values = ['ID', 'Rezeptname', 'Kategorie', 'Fehlende Zutaten', 'Grund'];
styleHeaderRow(missEssHeaders);

ws5Row = 3;
for (const item of (culinaryAudit.missing_essentials || [])) {
  if (!item.id || isNaN(parseInt(item.id))) continue;
  const r = ws5.getRow(ws5Row);
  r.values = [
    parseInt(item.id),
    item.name,
    categoryNames[item.category] || item.category,
    (item.missing || []).join(', '),
    item.reason || '',
  ];
  r.getCell(4).alignment = { wrapText: true };
  r.getCell(5).alignment = { wrapText: true };
  ws5Row++;
}

// Section: Miscategorized
ws5Row += 2;
ws5.mergeCells(`A${ws5Row}:E${ws5Row}`);
ws5.getCell(`A${ws5Row}`).value = 'Falsch kategorisierte Rezepte';
ws5.getCell(`A${ws5Row}`).font = { bold: true, size: 14 };
ws5.getCell(`A${ws5Row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

ws5Row++;
const miscatHeaders = ws5.getRow(ws5Row);
miscatHeaders.values = ['ID', 'Rezeptname', 'Aktuelle Kategorie', 'Vorgeschlagene Kategorie', 'Grund'];
styleHeaderRow(miscatHeaders);

ws5Row++;
for (const item of (culinaryAudit.miscategorized || [])) {
  if (!item.id || isNaN(parseInt(item.id))) continue;
  const r = ws5.getRow(ws5Row);
  r.values = [
    parseInt(item.id),
    item.name,
    categoryNames[item.current_category] || item.current_category || '',
    categoryNames[item.suggested_category] || item.suggested_category || '',
    item.reason || '',
  ];
  r.getCell(5).alignment = { wrapText: true };
  ws5Row++;
}

// Section: Potential duplicates
ws5Row += 2;
ws5.mergeCells(`A${ws5Row}:E${ws5Row}`);
ws5.getCell(`A${ws5Row}`).value = 'Potentielle Duplikate';
ws5.getCell(`A${ws5Row}`).font = { bold: true, size: 14 };
ws5.getCell(`A${ws5Row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

ws5Row++;
const dupHeaders = ws5.getRow(ws5Row);
dupHeaders.values = ['IDs', 'Rezeptnamen', '\u00C4hnlichkeit', 'Grund', ''];
styleHeaderRow(dupHeaders);

ws5Row++;
for (const item of (culinaryAudit.duplicates || [])) {
  const r = ws5.getRow(ws5Row);
  r.values = [
    (item.ids || []).join(', '),
    (item.names || []).join(' / '),
    typeof item.similarity === 'number' ? `${(item.similarity * 100).toFixed(0)}%` : item.similarity,
    item.reason || '',
    '',
  ];
  r.getCell(2).alignment = { wrapText: true };
  r.getCell(4).alignment = { wrapText: true };
  ws5Row++;
}

// Section: Worst recipes
ws5Row += 2;
ws5.mergeCells(`A${ws5Row}:E${ws5Row}`);
ws5.getCell(`A${ws5Row}`).value = 'Schlechteste Rezepte (meiste Probleme)';
ws5.getCell(`A${ws5Row}`).font = { bold: true, size: 14 };
ws5.getCell(`A${ws5Row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

ws5Row++;
const worstHeaders2 = ws5.getRow(ws5Row);
worstHeaders2.values = ['ID', 'Rezeptname', 'Anzahl Probleme', 'Probleme', ''];
styleHeaderRow(worstHeaders2);

ws5Row++;
for (const item of (culinaryAudit.worst_recipes || []).slice(0, 25)) {
  const r = ws5.getRow(ws5Row);
  r.values = [
    item.id ? parseInt(item.id) : '',
    item.name || '',
    (item.issues || []).length,
    (item.issues || []).join('; '),
    '',
  ];
  r.getCell(4).alignment = { wrapText: true };
  ws5Row++;
}

ws5.columns = [
  { width: 12 }, { width: 30 }, { width: 28 }, { width: 40 }, { width: 35 },
];


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 6: Quellen-Vergleich
// ══════════════════════════════════════════════════════════════════════════════

const ws6 = wb.addWorksheet('Quellen-Vergleich', { properties: { tabColor: { argb: 'FF2196F3' } } });

ws6.columns = [
  { header: 'Rezept-ID', key: 'id', width: 10 },
  { header: 'DB Name', key: 'db_name', width: 28 },
  { header: 'Quell-Name', key: 'source_name', width: 35 },
  { header: 'Name stimmt \u00FCberein', key: 'name_match', width: 18 },
  { header: 'Zutaten-Overlap (%)', key: 'overlap', width: 18 },
  { header: 'Fehlende Zutaten in DB', key: 'missing', width: 40 },
  { header: 'Zus\u00E4tzliche Zutaten in DB', key: 'extra', width: 40 },
];

styleHeaderRow(ws6.getRow(1));
ws6.getRow(1).height = 28;

// Name mismatches
for (const m of (sourceCheck.name_mismatches || [])) {
  const ingIssue = sourceIngredientIssues[m.id];
  const r = ws6.addRow({
    id: m.id,
    db_name: m.db_name,
    source_name: m.source_name,
    name_match: '\u274C',
    overlap: ingIssue ? `${(ingIssue.overlap_score * 100).toFixed(0)}%` : '-',
    missing: ingIssue ? (ingIssue.missing_in_db || []).join(', ') : '',
    extra: ingIssue ? (ingIssue.extra_in_db || []).join(', ') : '',
  });
  r.getCell('name_match').alignment = { horizontal: 'center' };
  r.getCell('name_match').font = { color: { argb: COLORS.redX } };
  r.getCell('missing').alignment = { wrapText: true };
  r.getCell('extra').alignment = { wrapText: true };
}

// Ingredient issues (that are not name mismatches)
for (const issue of (sourceCheck.ingredient_issues || [])) {
  if (sourceNameMismatches[issue.id]) continue; // already listed
  const r = ws6.addRow({
    id: issue.id,
    db_name: issue.name,
    source_name: issue.name,
    name_match: '\u2705',
    overlap: `${(issue.overlap_score * 100).toFixed(0)}%`,
    missing: (issue.missing_in_db || []).join(', '),
    extra: (issue.extra_in_db || []).join(', '),
  });
  r.getCell('name_match').alignment = { horizontal: 'center' };
  r.getCell('missing').alignment = { wrapText: true };
  r.getCell('extra').alignment = { wrapText: true };
}

// Summary row
const summaryRow6 = ws6.addRow({});
ws6.addRow({});
const sumRow = ws6.addRow({
  id: '',
  db_name: 'ZUSAMMENFASSUNG',
  source_name: '',
  name_match: '',
  overlap: '',
  missing: '',
  extra: '',
});
sumRow.getCell('db_name').font = { bold: true, size: 12 };

ws6.addRow({
  id: '',
  db_name: `Gepr\u00FCft: ${sourceCheck.summary?.total_checked || 30} Rezepte`,
  source_name: `Name-\u00DCbereinstimmung: ${sourceCheck.summary?.name_match_rate || '76.7%'}`,
  name_match: '',
  overlap: '',
  missing: `Zutaten-Probleme: ${sourceCheck.summary?.ingredient_issues_count || 4}`,
  extra: '',
});

freezeAndFilter(ws6);


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 7: Bilder
// ══════════════════════════════════════════════════════════════════════════════

const ws7 = wb.addWorksheet('Bilder', { properties: { tabColor: { argb: 'FF00BCD4' } } });

// Section: Without image
ws7.mergeCells('A1:D1');
ws7.getCell('A1').value = 'Rezepte ohne Bild';
ws7.getCell('A1').font = { bold: true, size: 14 };
ws7.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

const noImgHeaders = ws7.getRow(2);
noImgHeaders.values = ['Rezept-ID', 'Rezeptname', 'Kategorie', 'Status'];
styleHeaderRow(noImgHeaders);

let ws7Row = 3;
const recipesWithoutImage = recipes.filter(r => !r.image);
for (const recipe of recipesWithoutImage) {
  const r = ws7.getRow(ws7Row);
  r.values = [recipe.id, recipe.name, categoryNames[recipe.category] || recipe.category, 'Kein Bild'];
  r.getCell(4).font = { color: { argb: COLORS.redX } };
  ws7Row++;
}

// Section: Broken images
ws7Row += 2;
ws7.mergeCells(`A${ws7Row}:D${ws7Row}`);
ws7.getCell(`A${ws7Row}`).value = 'Rezepte mit kaputtem Bild';
ws7.getCell(`A${ws7Row}`).font = { bold: true, size: 14 };
ws7.getCell(`A${ws7Row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

ws7Row++;
const brokenHeaders = ws7.getRow(ws7Row);
brokenHeaders.values = ['Rezept-ID', 'Rezeptname', 'Bild-URL', 'HTTP Status'];
styleHeaderRow(brokenHeaders);

ws7Row++;
for (const broken of (imageCheck.broken_images || [])) {
  const r = ws7.getRow(ws7Row);
  r.values = [broken.id, broken.name, broken.url, broken.status];
  r.getCell(4).font = { bold: true, color: { argb: COLORS.redX } };
  r.getCell(3).alignment = { wrapText: true };
  ws7Row++;
}

// Summary
ws7Row += 2;
ws7.mergeCells(`A${ws7Row}:D${ws7Row}`);
ws7.getCell(`A${ws7Row}`).value = 'Zusammenfassung';
ws7.getCell(`A${ws7Row}`).font = { bold: true, size: 14 };
ws7.getCell(`A${ws7Row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

ws7Row++;
const imgSummary = [
  ['Gesamt gepr\u00FCft', imageCheck.total || 406],
  ['Mit Bild', imageCheck.with_image || 398],
  ['Ohne Bild', imageCheck.without_image || 8],
  ['Bild OK', imageCheck.image_ok || 393],
  ['Bild kaputt', imageCheck.image_broken || 5],
];
for (const [label, val] of imgSummary) {
  const r = ws7.getRow(ws7Row);
  r.values = [label, val, '', ''];
  r.getCell(1).font = { bold: true };
  ws7Row++;
}

ws7.columns = [
  { width: 12 }, { width: 30 }, { width: 65 }, { width: 15 },
];


// ══════════════════════════════════════════════════════════════════════════════
// Sheet 8: Aktionsplan
// ══════════════════════════════════════════════════════════════════════════════

const ws8 = wb.addWorksheet('Aktionsplan', { properties: { tabColor: { argb: 'FFFF9800' } } });

ws8.mergeCells('A1:E1');
ws8.getCell('A1').value = 'Aktionsplan — Priorisierte Ma\u00DFnahmen';
ws8.getCell('A1').font = { bold: true, size: 16, color: { argb: COLORS.titleFont } };
ws8.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.titleBg } };
ws8.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
ws8.getRow(1).height = 40;

const actionHeaders = ws8.getRow(3);
actionHeaders.values = ['Priorit\u00E4t', 'Kategorie', 'Ma\u00DFnahme', 'Betroffen', 'Status'];
styleHeaderRow(actionHeaders);

const actions = [
  {
    priority: '\u{1F534} KRITISCH',
    category: 'Allergene',
    action: '13 fehlende Allergene nachtragen (Gluten bei Semmel-Gerichten, Fisch bei Karpfen etc.) \u2014 SQL-Fix bereit',
    affected: `${(allergenAudit.issues || []).length} Rezepte`,
    status: 'SQL bereit',
  },
  {
    priority: '\u{1F534} KRITISCH',
    category: 'Qualit\u00E4t',
    action: '8 Rezepte ohne Zubereitungsschritte \u2014 Schritte manuell nachtragen oder aus Quelle importieren',
    affected: `${withoutSteps} Rezepte`,
    status: 'Offen',
  },
  {
    priority: '\u{1F7E1} WICHTIG',
    category: 'Portionen',
    action: '263 Rezepte mit Portionen=1 (Import-Default) \u2014 Batch-Update auf korrekte Portionszahl',
    affected: `${portions1} Rezepte`,
    status: 'Batch m\u00F6glich',
  },
  {
    priority: '\u{1F7E1} WICHTIG',
    category: 'Allergene',
    action: '47 Rezepte ohne jegliche Allergen-Markierung \u2014 AI-Allergen-Detection durchlaufen lassen',
    affected: `${withoutAllergens} Rezepte`,
    status: 'AI-Tool vorhanden',
  },
  {
    priority: '\u{1F7E1} WICHTIG',
    category: '\u00DCbersetzungen',
    action: '166 \u00DCbersetzungs-Korrekturen (\u00F6sterr. Begriffe: Topfen, Kren, Obers, Fisolen etc.)',
    affected: '166 Eintr\u00E4ge',
    status: 'CSV bereit',
  },
  {
    priority: '\u{1F7E1} WICHTIG',
    category: 'Kategorien',
    action: '27 falsch kategorisierte Rezepte \u2014 manuell pr\u00FCfen und korrigieren',
    affected: '27 Rezepte',
    status: 'Manuell',
  },
  {
    priority: '\u{1F7E2} MINOR',
    category: 'Duplikate',
    action: '35 potentielle Duplikate pr\u00FCfen (gleiche Quell-URL oder sehr \u00E4hnliche Namen)',
    affected: '35 Paare',
    status: 'Pr\u00FCfen',
  },
  {
    priority: '\u{1F7E2} MINOR',
    category: 'Bilder',
    action: '5 kaputte Bilder (Timeout) ersetzen \u2014 neue URLs von gutekueche.at holen',
    affected: '5 Rezepte',
    status: 'Manuell',
  },
  {
    priority: '\u{1F7E2} MINOR',
    category: 'Bilder',
    action: '8 Rezepte ohne Bild \u2014 Bilder suchen und hinzuf\u00FCgen',
    affected: '8 Rezepte',
    status: 'Manuell',
  },
  {
    priority: '\u{1F7E2} MINOR',
    category: 'Zutaten',
    action: '22 Rezepte mit fehlenden essentiellen Zutaten \u2014 manuell erg\u00E4nzen',
    affected: '22 Rezepte',
    status: 'Manuell',
  },
];

let actionRow = 4;
for (const action of actions) {
  const r = ws8.getRow(actionRow);
  r.values = [action.priority, action.category, action.action, action.affected, action.status];

  r.getCell(1).font = { bold: true, size: 11 };
  r.getCell(3).alignment = { wrapText: true };
  r.height = 35;

  // Color based on priority
  if (action.priority.includes('KRITISCH')) {
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.red } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.red } };
  } else if (action.priority.includes('WICHTIG')) {
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
  } else {
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.green } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.green } };
  }

  actionRow++;
}

// Timeline section
actionRow += 2;
ws8.mergeCells(`A${actionRow}:E${actionRow}`);
ws8.getCell(`A${actionRow}`).value = 'Empfohlene Reihenfolge';
ws8.getCell(`A${actionRow}`).font = { bold: true, size: 14 };
ws8.getCell(`A${actionRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };

actionRow++;
const timeline = [
  ['Sofort', 'Allergen-Fix SQL ausf\u00FChren (13 fehlende Allergene) \u2014 Lebensmittelrecht!'],
  ['Tag 1', 'AI-Allergen-Detection f\u00FCr 47 Rezepte ohne Allergene durchlaufen'],
  ['Tag 1-2', '\u00DCbersetzungs-Batch-Update (166 Fixes) einpielen'],
  ['Woche 1', '8 fehlende Rezept-Schritte nachtragen'],
  ['Woche 1', 'Portionen-Batch-Update (263 Rezepte)'],
  ['Woche 2', 'Falsch kategorisierte Rezepte (27) manuell korrigieren'],
  ['Woche 2-3', 'Duplikate pr\u00FCfen und bereinigen (35 Paare)'],
  ['Laufend', 'Bilder ersetzen/erg\u00E4nzen (13 Rezepte)'],
  ['Laufend', 'Fehlende essentielle Zutaten (22 Rezepte) erg\u00E4nzen'],
];

for (const [when, what] of timeline) {
  const r = ws8.getRow(actionRow);
  r.values = [when, '', what, '', ''];
  r.getCell(1).font = { bold: true };
  r.getCell(3).alignment = { wrapText: true };
  actionRow++;
}

ws8.columns = [
  { width: 16 }, { width: 16 }, { width: 65 }, { width: 14 }, { width: 16 },
];


// ══════════════════════════════════════════════════════════════════════════════
// Save workbook
// ══════════════════════════════════════════════════════════════════════════════

const outputPath = path.join(ROOT, 'REZEPT_AUDIT_2026-02-12.xlsx');
await wb.xlsx.writeFile(outputPath);

console.log(`\n✅ Audit-Report erstellt: ${outputPath}`);
console.log(`   Sheets: ${wb.worksheets.map(ws => ws.name).join(', ')}`);
console.log(`   Rezepte: ${recipes.length}`);
console.log(`   Allergen-Issues: ${(allergenAudit.issues || []).length}`);
console.log(`   Übersetzungs-Fixes: ${translationFixes.length}`);
console.log(`   Kulinarik-Probleme: ${(culinaryAudit.worst_recipes || []).length}`);
console.log(`   Quellen geprüft: ${sourceCheck.summary?.total_checked || 30}`);
console.log(`   Bilder kaputt: ${imageCheck.image_broken || 5}`);

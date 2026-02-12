/**
 * Generate SQL for 25 round-2 verified recipes.
 */
import { readFileSync, writeFileSync } from 'fs';

const list = JSON.parse(readFileSync('rescrape-round2-verified.json', 'utf8'));

function escSql(s) {
  if (!s) return '';
  return s.replace(/'/g, "''");
}

function stepsToArray(steps) {
  if (!steps || steps.length === 0) return null;
  const elements = steps.map(s => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''") + '"');
  return "'{" + elements.join(',') + "}'";
}

const lines = [];
lines.push('-- Re-scrape round 2: 25 verified recipes from new URLs');
lines.push('-- Generated: ' + new Date().toISOString());
lines.push('');

let totalIngredients = 0;

for (const r of list) {
  const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  lines.push(`-- ID ${r.id}: ${r.name} → "${clean}" (${r.source})`);

  lines.push(`DELETE FROM ingredient_translations WHERE ingredient_id IN (SELECT id FROM ingredients WHERE recipe_id = ${r.id});`);
  lines.push(`DELETE FROM ingredients WHERE recipe_id = ${r.id};`);

  for (const ing of r.ingredients) {
    lines.push(`INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (${r.id}, '${escSql(ing.name)}', ${ing.amount || 0}, '${escSql(ing.unit)}');`);
    totalIngredients++;
  }

  if (r.steps && r.steps.length > 0) {
    const arr = stepsToArray(r.steps);
    if (arr) lines.push(`UPDATE recipes SET steps = ${arr} WHERE id = ${r.id};`);
  }

  // Update source_url to the new correct URL
  if (r.newUrl) {
    lines.push(`UPDATE recipes SET source_url = '${escSql(r.newUrl)}' WHERE id = ${r.id};`);
  }

  if (r.portions && r.portions > 0 && r.portions !== 4) {
    lines.push(`UPDATE recipes SET portions = ${r.portions} WHERE id = ${r.id};`);
  }

  lines.push('');
}

lines.push(`-- Summary: ${list.length} recipes, ${totalIngredients} ingredients`);

writeFileSync('script/fix-rescrape-round2.sql', lines.join('\n'));
console.log(`Generated script/fix-rescrape-round2.sql`);
console.log(`  ${list.length} recipes, ${totalIngredients} ingredients`);

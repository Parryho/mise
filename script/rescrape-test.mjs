/**
 * Re-scrape 10 random garbled recipes from their source URLs.
 * Uses fixed parser. DRY RUN only — shows what the new data would look like.
 */
import { scrapeRecipe } from '../server/modules/recipe/scraper.ts';
import { readFileSync } from 'fs';

// Simple name similarity
function nameSimilarity(a, b) {
  const norm = s => s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9 ]/g, '').trim();
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const wa = new Set(na.split(/\s+/));
  const wb = new Set(nb.split(/\s+/));
  const overlap = [...wa].filter(w => wb.has(w) && w.length > 2).length;
  return overlap / Math.max(wa.size, wb.size);
}

const lines = readFileSync('tmp-garbled-list.txt', 'utf8').trim().split('\n');
const recipes = lines.map(l => {
  const [id, name, category, url] = l.split('|');
  return { id: +id, name, category, url };
});

console.log(`Total garbled: ${recipes.length}`);
console.log(`With URL: ${recipes.filter(r => r.url).length}`);
console.log(`Without URL: ${recipes.filter(r => !r.url).length}\n`);

// Pick 10 random WITH urls
const withUrl = recipes.filter(r => r.url && r.url.startsWith('http'));
const sample = [];
const used = new Set();
while (sample.length < 10 && sample.length < withUrl.length) {
  const idx = Math.floor(Math.random() * withUrl.length);
  if (!used.has(idx)) { used.add(idx); sample.push(withUrl[idx]); }
}

for (const recipe of sample) {
  console.log('─'.repeat(70));
  console.log(`ID ${recipe.id}: ${recipe.name} (${recipe.category})`);
  console.log(`URL: ${recipe.url.substring(0, 80)}...`);

  try {
    const scraped = await scrapeRecipe(recipe.url);
    if (!scraped) { console.log('  ❌ Scrape returned null\n'); continue; }

    const sim = nameSimilarity(recipe.name, scraped.name);
    const match = sim >= 0.3 ? '✅' : '❌ MISMATCH';
    console.log(`  Scraped name: "${scraped.name}"`);
    console.log(`  Name match: ${match} (${(sim * 100).toFixed(0)}%)`);
    console.log(`  Ingredients (${scraped.ingredients.length}):`);
    for (const i of scraped.ingredients) {
      console.log(`    ${i.amount} ${i.unit} | ${i.name}`);
    }
    console.log(`  Steps (${scraped.steps.length}):`);
    for (const [idx, s] of scraped.steps.entries()) {
      console.log(`    ${idx + 1}. ${s.substring(0, 120)}${s.length > 120 ? '...' : ''}`);
    }
  } catch (err) {
    console.log(`  💥 Error: ${err.message}`);
  }
  console.log();
  await new Promise(r => setTimeout(r, 500));
}

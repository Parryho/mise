/**
 * Re-scrape ALL 164 garbled recipes with the fixed parser.
 * DRY RUN — categorizes results, writes JSON report.
 */
import { scrapeRecipe } from '../server/modules/recipe/scraper.ts';
import { readFileSync, writeFileSync } from 'fs';

function nameSimilarity(a, b) {
  const norm = s => s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9 ]/g, '').trim();
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // Word overlap (words > 2 chars)
  const wa = new Set(na.split(/\s+/));
  const wb = new Set(nb.split(/\s+/));
  const overlap = [...wa].filter(w => wb.has(w) && w.length > 2).length;
  return overlap / Math.max(wa.size, wb.size);
}

// Garbled ingredient signatures
const GARBLED_NAMES = new Set(['(s)','(n)','(rote)','(er)','e','r','t','z','n','l','h','a','B. Olivenöl']);
function isGarbled(ingredients) {
  return ingredients.some(i =>
    GARBLED_NAMES.has(i.name) ||
    i.name.startsWith('und Pfeffer') ||
    i.name.startsWith('/n ') ||
    i.name.startsWith(', ') ||
    /^Salz/.test(i.unit) ||
    /^Pfeffe/.test(i.unit) ||
    /^Muska/.test(i.unit) ||
    (i.name.length <= 2 && /^[^A-Z]/.test(i.name))
  );
}

const lines = readFileSync('tmp-garbled-list.txt', 'utf8').trim().split('\n');
const recipes = lines.map(l => {
  const [id, name, category, ...urlParts] = l.split('|');
  return { id: +id, name, category, url: urlParts.join('|') };
});

console.log(`Processing ${recipes.length} garbled recipes...\n`);

const results = { fixed: [], wrongUrl: [], noUrl: [], scrapeFailed: [] };
let processed = 0;

for (const recipe of recipes) {
  processed++;
  const url = recipe.url;

  if (!url || !url.startsWith('http')) {
    results.noUrl.push(recipe);
    process.stdout.write(`[${processed}/${recipes.length}] ${recipe.name} — NO URL\n`);
    continue;
  }

  try {
    const scraped = await scrapeRecipe(url);
    if (!scraped || scraped.ingredients.length === 0) {
      results.scrapeFailed.push({ ...recipe, reason: 'No ingredients returned' });
      process.stdout.write(`[${processed}/${recipes.length}] ${recipe.name} — SCRAPE FAILED\n`);
      continue;
    }

    const sim = nameSimilarity(recipe.name, scraped.name);
    const stillGarbled = isGarbled(scraped.ingredients);

    if (sim < 0.25) {
      results.wrongUrl.push({
        ...recipe,
        scrapedName: scraped.name,
        similarity: sim,
        ingredientCount: scraped.ingredients.length,
        stepCount: scraped.steps.length,
      });
      process.stdout.write(`[${processed}/${recipes.length}] ${recipe.name} — WRONG URL (→ "${scraped.name}" ${(sim*100).toFixed(0)}%)\n`);
    } else if (stillGarbled) {
      results.scrapeFailed.push({ ...recipe, reason: 'Still garbled after re-parse' });
      process.stdout.write(`[${processed}/${recipes.length}] ${recipe.name} — STILL GARBLED\n`);
    } else {
      results.fixed.push({
        ...recipe,
        scrapedName: scraped.name,
        similarity: sim,
        ingredients: scraped.ingredients,
        steps: scraped.steps,
        image: scraped.image,
        portions: scraped.portions,
      });
      process.stdout.write(`[${processed}/${recipes.length}] ${recipe.name} — ✅ FIXED (${scraped.ingredients.length} ingr, ${scraped.steps.length} steps)\n`);
    }
  } catch (err) {
    results.scrapeFailed.push({ ...recipe, reason: err.message?.substring(0, 100) });
    process.stdout.write(`[${processed}/${recipes.length}] ${recipe.name} — ERROR: ${err.message?.substring(0, 60)}\n`);
  }

  // Rate limit: 400ms between requests
  await new Promise(r => setTimeout(r, 400));
}

// === REPORT ===
console.log('\n' + '='.repeat(70));
console.log('ERGEBNIS');
console.log('='.repeat(70));
console.log(`✅ Fixbar (URL korrekt, sauber geparst):    ${results.fixed.length}`);
console.log(`❌ Falsche URL (Name-Mismatch):             ${results.wrongUrl.length}`);
console.log(`⚠️  Keine URL:                               ${results.noUrl.length}`);
console.log(`💥 Scrape fehlgeschlagen:                    ${results.scrapeFailed.length}`);
console.log(`   TOTAL:                                    ${recipes.length}`);

// Save full report as JSON
writeFileSync('rescrape-report.json', JSON.stringify(results, null, 2));
console.log('\nReport saved to rescrape-report.json');

// Show WRONG URL details
if (results.wrongUrl.length > 0) {
  console.log('\n' + '─'.repeat(70));
  console.log('FALSCHE URLs — brauchen neue Quelle:');
  console.log('─'.repeat(70));
  for (const r of results.wrongUrl) {
    console.log(`  ID ${r.id}: "${r.name}" → gescrapt: "${r.scrapedName}" (${(r.similarity*100).toFixed(0)}%)`);
  }
}

// Show NO URL details
if (results.noUrl.length > 0) {
  console.log('\n' + '─'.repeat(70));
  console.log('KEINE URL — brauchen neue Quelle:');
  console.log('─'.repeat(70));
  for (const r of results.noUrl) {
    console.log(`  ID ${r.id}: "${r.name}" (${r.category})`);
  }
}

// Show SCRAPE FAILED details
if (results.scrapeFailed.length > 0) {
  console.log('\n' + '─'.repeat(70));
  console.log('SCRAPE FEHLGESCHLAGEN:');
  console.log('─'.repeat(70));
  for (const r of results.scrapeFailed) {
    console.log(`  ID ${r.id}: "${r.name}" — ${r.reason}`);
  }
}

// Show 5 FIXED samples with full data
console.log('\n' + '─'.repeat(70));
console.log('STICHPROBEN — Fixbare Rezepte (neue Daten):');
console.log('─'.repeat(70));
for (const r of results.fixed.slice(0, 5)) {
  console.log(`\n📖 ID ${r.id}: ${r.name} (${r.category})`);
  console.log(`   Gescraptes Name: "${r.scrapedName}" (Ähnlichkeit: ${(r.similarity * 100).toFixed(0)}%)`);
  console.log(`   Zutaten (${r.ingredients.length}):`);
  for (const i of r.ingredients) {
    console.log(`     ${i.amount} ${i.unit} | ${i.name}`);
  }
  console.log(`   Zubereitung (${r.steps.length} Schritte):`);
  for (const [idx, s] of r.steps.entries()) {
    console.log(`     ${idx + 1}. ${s.substring(0, 150)}${s.length > 150 ? '...' : ''}`);
  }
}

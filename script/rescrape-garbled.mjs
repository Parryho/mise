/**
 * Re-scrape garbled recipes with fixed parser.
 * Phase 1: DRY RUN — only shows results, changes nothing.
 */
import { scrapeRecipe } from '../server/modules/recipe/scraper.ts';
import pg from 'pg';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:admin@127.0.0.1:5432/mise';
const pool = new pg.Pool({ connectionString: DB_URL });

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

// Simple name similarity check
function nameSimilarity(a, b) {
  const normalize = s => s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]/g, '');
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // Word overlap
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = new Set(b.toLowerCase().split(/\s+/));
  const overlap = [...wa].filter(w => wb.has(w) && w.length > 2).length;
  const total = Math.max(wa.size, wb.size);
  return overlap / total;
}

async function main() {
  // Get all garbled recipes with their source URLs and current ingredients
  const { rows: garbled } = await pool.query(`
    SELECT DISTINCT r.id, r.name, r.category, r.source_url
    FROM recipes r JOIN ingredients i ON i.recipe_id = r.id
    WHERE i.name IN ('(s)','(n)','(rote)','(er)','e','r','t','z','n','l','h','a','B. Olivenöl')
      OR i.name LIKE 'und Pfeffer%'
      OR i.name LIKE '/n %'
      OR i.name LIKE ', %'
      OR i.unit LIKE '%Salz%'
      OR i.unit LIKE '%Pfeffe%'
      OR i.unit LIKE '%Muska%'
      OR (LENGTH(i.name) <= 2 AND i.name ~ '^[^A-Z]')
    ORDER BY r.id
  `);

  console.log(`Found ${garbled.length} garbled recipes\n`);

  const results = { fixed: [], wrongUrl: [], noUrl: [], scrapeFailed: [] };
  const SAMPLE = process.argv.includes('--sample');
  const list = SAMPLE ? garbled.slice(0, 10) : garbled;

  for (const recipe of list) {
    const url = recipe.source_url;

    if (!url || !url.startsWith('http')) {
      results.noUrl.push(recipe);
      continue;
    }

    try {
      const scraped = await scrapeRecipe(url);
      if (!scraped || scraped.ingredients.length === 0) {
        results.scrapeFailed.push({ ...recipe, reason: 'No ingredients returned' });
        continue;
      }

      // Check name similarity
      const sim = nameSimilarity(recipe.name, scraped.name);
      const stillGarbled = isGarbled(scraped.ingredients);

      if (sim < 0.3) {
        results.wrongUrl.push({
          ...recipe,
          scrapedName: scraped.name,
          similarity: sim,
          ingredients: scraped.ingredients,
        });
      } else if (stillGarbled) {
        results.scrapeFailed.push({ ...recipe, reason: 'Still garbled after re-parse' });
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
      }
    } catch (err) {
      results.scrapeFailed.push({ ...recipe, reason: err.message });
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  // === REPORT ===
  console.log('='.repeat(70));
  console.log(`RESULTS (${SAMPLE ? 'SAMPLE 10' : 'ALL ' + garbled.length})`);
  console.log('='.repeat(70));
  console.log(`✅ Fixable (correct URL, clean parse):  ${results.fixed.length}`);
  console.log(`❌ Wrong URL (name mismatch):            ${results.wrongUrl.length}`);
  console.log(`⚠️  No source URL:                       ${results.noUrl.length}`);
  console.log(`💥 Scrape failed:                        ${results.scrapeFailed.length}`);

  // Show 10 fixed samples
  console.log('\n' + '='.repeat(70));
  console.log('SAMPLES — Fixable recipes (new ingredients from fixed parser):');
  console.log('='.repeat(70));
  for (const r of results.fixed.slice(0, 10)) {
    console.log(`\n📖 ID ${r.id}: ${r.name} (${r.category})`);
    console.log(`   URL-Name: "${r.scrapedName}" (similarity: ${(r.similarity * 100).toFixed(0)}%)`);
    console.log(`   Ingredients (${r.ingredients.length}):`);
    for (const i of r.ingredients) {
      console.log(`     ${i.amount} ${i.unit} | ${i.name}`);
    }
  }

  // Show wrong URLs
  if (results.wrongUrl.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('WRONG URLs — recipe name does NOT match scraped name:');
    console.log('='.repeat(70));
    for (const r of results.wrongUrl) {
      console.log(`  ID ${r.id}: "${r.name}" → scraped: "${r.scrapedName}" (${(r.similarity * 100).toFixed(0)}%)`);
    }
  }

  // Show no URL
  if (results.noUrl.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('NO URL — need to find source:');
    console.log('='.repeat(70));
    for (const r of results.noUrl) {
      console.log(`  ID ${r.id}: "${r.name}" (${r.category})`);
    }
  }

  // Show failed
  if (results.scrapeFailed.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('SCRAPE FAILED:');
    console.log('='.repeat(70));
    for (const r of results.scrapeFailed) {
      console.log(`  ID ${r.id}: "${r.name}" — ${r.reason}`);
    }
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

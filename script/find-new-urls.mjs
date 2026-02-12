/**
 * Find new URLs for the 101 remaining garbled recipes.
 * Strategy: Search gutekueche.at and chefkoch.de by recipe name,
 * scrape first matching result, validate with strict name matching.
 */
import { scrapeRecipe } from '../server/modules/recipe/scraper.ts';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';

// Load the 63 already-fixed IDs
const fixedIds = new Set(
  JSON.parse(readFileSync('rescrape-final.json', 'utf8')).map(r => r.id)
);

// Load all 164 garbled recipes
const lines = readFileSync('tmp-garbled-list.txt', 'utf8').trim().split('\n');
const allGarbled = lines.map(l => {
  const [id, name, category, ...urlParts] = l.split('|');
  return { id: +id, name, category, url: urlParts.join('|') };
});

// The 101 remaining
const remaining = allGarbled.filter(r => !fixedIds.has(r.id));
console.log(`Remaining garbled recipes: ${remaining.length}\n`);

// Strict name similarity (same as final-filter)
function strictSimilarity(ourName, scrapedName) {
  const cleanScraped = scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  const norm = s => s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[-_()\/]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const na = norm(ourName), nb = norm(cleanScraped);
  if (na === nb) return 1.0;
  if (nb.includes(na) && na.length / nb.length >= 0.4) return 0.8;
  if (na.includes(nb) && nb.length / na.length >= 0.4) return 0.8;
  const wa = new Set(na.split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(nb.split(/\s+/).filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  const overlap = [...wa].filter(w => wb.has(w)).length;
  return overlap / Math.max(wa.size, wb.size);
}

// Garbled check
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

// Search gutekueche.at for a recipe name, return first result URL
async function searchGutekueche(name) {
  try {
    const searchUrl = `https://www.gutekueche.at/rezepte/suche?q=${encodeURIComponent(name)}`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'de-DE,de;q=0.9'
      }
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    const $ = cheerio.load(html);
    const urls = [];
    $('a[href*="/rezept-"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('gutekueche.at') && !urls.includes(href)) {
        urls.push(href);
      }
    });
    // Also try relative URLs
    $('a[href^="/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('-rezept-') && !urls.some(u => u.includes(href))) {
        urls.push('https://www.gutekueche.at' + href);
      }
    });
    return urls.slice(0, 3); // Top 3 results
  } catch {
    return [];
  }
}

// Search chefkoch.de
async function searchChefkoch(name) {
  try {
    const searchUrl = `https://www.chefkoch.de/rs/s0/${encodeURIComponent(name)}/Rezepte.html`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'de-DE,de;q=0.9'
      }
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    const $ = cheerio.load(html);
    const urls = [];
    $('a[href*="/rezepte/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.match(/\/rezepte\/\d+/) && !urls.includes(href)) {
        const fullUrl = href.startsWith('http') ? href : 'https://www.chefkoch.de' + href;
        // Strip tracking hash
        urls.push(fullUrl.split('#')[0]);
      }
    });
    return [...new Set(urls)].slice(0, 3);
  } catch {
    return [];
  }
}

const results = { fixed: [], notFound: [], wrongMatch: [] };
let processed = 0;

for (const recipe of remaining) {
  processed++;
  let found = false;

  // Try gutekueche.at first
  const gkUrls = await searchGutekueche(recipe.name);
  for (const url of gkUrls) {
    if (found) break;
    try {
      const scraped = await scrapeRecipe(url);
      if (!scraped || scraped.ingredients.length === 0) continue;
      const sim = strictSimilarity(recipe.name, scraped.name);
      if (sim >= 0.25 && !isGarbled(scraped.ingredients)) {
        results.fixed.push({
          ...recipe,
          newUrl: url,
          source: 'gutekueche.at',
          scrapedName: scraped.name,
          similarity: sim,
          ingredients: scraped.ingredients,
          steps: scraped.steps,
          image: scraped.image,
          portions: scraped.portions,
        });
        found = true;
        process.stdout.write(`[${processed}/${remaining.length}] ✅ ${recipe.name} → gutekueche.at (${scraped.ingredients.length} ingr)\n`);
      }
    } catch { /* skip */ }
    await new Promise(r => setTimeout(r, 300));
  }

  // Try chefkoch.de if gutekueche didn't work
  if (!found) {
    const ckUrls = await searchChefkoch(recipe.name);
    for (const url of ckUrls) {
      if (found) break;
      try {
        const scraped = await scrapeRecipe(url);
        if (!scraped || scraped.ingredients.length === 0) continue;
        const sim = strictSimilarity(recipe.name, scraped.name);
        if (sim >= 0.25 && !isGarbled(scraped.ingredients)) {
          results.fixed.push({
            ...recipe,
            newUrl: url,
            source: 'chefkoch.de',
            scrapedName: scraped.name,
            similarity: sim,
            ingredients: scraped.ingredients,
            steps: scraped.steps,
            image: scraped.image,
            portions: scraped.portions,
          });
          found = true;
          process.stdout.write(`[${processed}/${remaining.length}] ✅ ${recipe.name} → chefkoch.de (${scraped.ingredients.length} ingr)\n`);
        }
      } catch { /* skip */ }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (!found) {
    results.notFound.push(recipe);
    process.stdout.write(`[${processed}/${remaining.length}] ❌ ${recipe.name} — keine passende Quelle gefunden\n`);
  }

  // Rate limit between recipes
  await new Promise(r => setTimeout(r, 200));
}

// Report
console.log('\n' + '='.repeat(60));
console.log(`ERGEBNIS — Neue URLs für die restlichen ${remaining.length} Rezepte`);
console.log('='.repeat(60));
console.log(`✅ Neue Quelle gefunden:  ${results.fixed.length}`);
console.log(`❌ Keine Quelle:          ${results.notFound.length}`);

if (results.fixed.length > 0) {
  console.log('\nGefundene Rezepte:');
  for (const r of results.fixed) {
    const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
    console.log(`  ✅ ID ${r.id}: "${r.name}" → "${clean}" (${r.source}, ${r.ingredients.length} ingr)`);
  }
}

if (results.notFound.length > 0) {
  console.log('\nNicht gefunden:');
  for (const r of results.notFound) {
    console.log(`  ❌ ID ${r.id}: "${r.name}" (${r.category})`);
  }
}

writeFileSync('rescrape-round2.json', JSON.stringify(results, null, 2));
console.log(`\nSaved to rescrape-round2.json`);

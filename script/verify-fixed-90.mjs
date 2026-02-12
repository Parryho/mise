/**
 * Verify all 90 "fixed" recipes — catch false positives from includes() matching.
 * A recipe is only truly fixed if:
 * 1. The scraped name (without "von Author") IS the same dish
 * 2. Not just a substring match where our name appears in a compound dish
 */
import { readFileSync, writeFileSync } from 'fs';

const report = JSON.parse(readFileSync('rescrape-report.json', 'utf8'));

function strictSimilarity(ourName, scrapedName) {
  // Step 1: Strip "von AuthorName" suffix from chefkoch names
  const cleanScraped = scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();

  const norm = s => s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[-_()]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const na = norm(ourName);
  const nb = norm(cleanScraped);

  if (na === nb) return { score: 1.0, method: 'exact' };

  // includes check: only if shorter is >= 50% of longer
  if (nb.includes(na)) {
    const ratio = na.length / nb.length;
    if (ratio >= 0.4) return { score: 0.8, method: `includes(${(ratio*100).toFixed(0)}%)` };
  }
  if (na.includes(nb)) {
    const ratio = nb.length / na.length;
    if (ratio >= 0.4) return { score: 0.8, method: `reverse-includes(${(ratio*100).toFixed(0)}%)` };
  }

  // Word overlap
  const wa = new Set(na.split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(nb.split(/\s+/).filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return { score: 0, method: 'no-words' };

  const overlap = [...wa].filter(w => wb.has(w)).length;
  const score = overlap / Math.max(wa.size, wb.size);
  return { score, method: `words(${overlap}/${Math.max(wa.size, wb.size)})` };
}

const verified = [];
const rejected = [];

for (const r of report.fixed) {
  const { score, method } = strictSimilarity(r.name, r.scrapedName);

  if (score >= 0.25) {
    verified.push(r);
  } else {
    rejected.push({ ...r, newScore: score, method });
  }
}

console.log(`VERIFIED: ${verified.length} (safe to apply)`);
console.log(`REJECTED: ${rejected.length} (false positives)\n`);

if (rejected.length > 0) {
  console.log('REJECTED recipes (false positive name matches):');
  console.log('─'.repeat(70));
  for (const r of rejected) {
    const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
    console.log(`  ID ${r.id}: "${r.name}" → "${clean}" (${(r.newScore*100).toFixed(0)}% via ${r.method})`);
  }
}

console.log('\nVERIFIED recipes:');
console.log('─'.repeat(70));
for (const r of verified) {
  const { score, method } = strictSimilarity(r.name, r.scrapedName);
  const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  console.log(`  ID ${r.id}: "${r.name}" → "${clean}" (${(score*100).toFixed(0)}% via ${method}) [${r.ingredients.length} ingr]`);
}

// Save verified list
writeFileSync('rescrape-verified.json', JSON.stringify({ verified, rejected }, null, 2));
console.log(`\nSaved to rescrape-verified.json`);

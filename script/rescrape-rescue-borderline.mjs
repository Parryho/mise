/**
 * Review the 60 "wrong URL" recipes more carefully.
 * Some have correct URLs but fail name matching due to:
 * 1. Hyphen vs space normalization bug
 * 2. Austrian vs German dish names (Blunzengröstl = Blutwurstpfanne)
 * 3. Author suffix in chefkoch names ("von xyz")
 *
 * This script re-checks with improved similarity + manual overrides.
 */
import { readFileSync } from 'fs';

const report = JSON.parse(readFileSync('rescrape-report.json', 'utf8'));

// Improved name similarity — normalize hyphens to spaces
function nameSimilarity(a, b) {
  const norm = s => s.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[-_]/g, ' ')                // hyphens/underscores → spaces
    .replace(/\s+von\s+.*$/, '')          // strip " von AuthorName"
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // Word overlap (words > 2 chars)
  const wa = new Set(na.split(/\s+/));
  const wb = new Set(nb.split(/\s+/));
  const overlap = [...wa].filter(w => wb.has(w) && w.length > 2).length;
  return overlap / Math.max(wa.size, wb.size);
}

// Manual overrides: same dish, different name
const SAME_DISH = {
  31: true,   // Blunzengröstl = Blutwurstpfanne/Blunzngröstl (Austrian name)
  141: true,  // Langosch = Langos (Hungarian/Austrian spelling)
};

console.log('Re-checking 60 "wrong URL" recipes with improved matching:\n');

let rescued = 0;
let stillWrong = 0;

for (const r of report.wrongUrl) {
  const newSim = nameSimilarity(r.name, r.scrapedName);
  const isOverride = SAME_DISH[r.id];
  const isRescued = newSim >= 0.25 || isOverride;

  if (isRescued) {
    rescued++;
    console.log(`✅ RESCUED ID ${r.id}: "${r.name}" → "${r.scrapedName}" (${(newSim*100).toFixed(0)}%${isOverride ? ' + manual override' : ''})`);
  } else {
    stillWrong++;
    console.log(`❌ STILL WRONG ID ${r.id}: "${r.name}" → "${r.scrapedName}" (${(newSim*100).toFixed(0)}%)`);
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`Rescued: ${rescued}`);
console.log(`Still wrong: ${stillWrong}`);
console.log(`\nUpdated totals:`);
console.log(`  ✅ Fixbar: ${report.fixed.length} + ${rescued} = ${report.fixed.length + rescued}`);
console.log(`  ❌ Falsche URL: ${stillWrong}`);
console.log(`  💥 Scrape failed: ${report.scrapeFailed.length}`);

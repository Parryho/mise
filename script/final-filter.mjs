/**
 * Manual final filter — remove remaining false positives from the verified list.
 * These are cases where our recipe name appears as substring in a DIFFERENT dish.
 */
import { readFileSync, writeFileSync } from 'fs';

const { verified } = JSON.parse(readFileSync('rescrape-verified.json', 'utf8'));

// Manual exclusions: recipe name matches but dish is completely different
const EXCLUDE = new Set([
  138,  // Frankfurter (sausage) → Frankfurter Kranz-Schnitten (cake)
  147,  // Einspänner (Viennese coffee) → Gerollte Einspänner (pastry)
  164,  // Bündnerfleisch (cured meat) → Rote Bete Mousse mit Bündnerfleisch
  165,  // Räucherlachs (smoked salmon) → Spaghetti mit Räucherlachs-Sauce
  223,  // Selchfleisch (smoked meat) → Selchfleischknödel (dumplings)
  319,  // Salzkartoffeln (boiled potatoes) → Spinat, Spiegelei und Salzkartoffeln (complete dish)
  377,  // Rote Rüben warm (warm beets) → Rote Rüben Cremesuppe (soup)
  423,  // Fruchtcoulis (fruit sauce) → Spekulatiuscreme im Schokoladenmantel (chocolate dessert)
  348,  // Risotto als Beilage (plain risotto) → Fenchel-Risotto (fennel risotto)
]);

const finalList = verified.filter(r => !EXCLUDE.has(r.id));
const excluded = verified.filter(r => EXCLUDE.has(r.id));

console.log(`Original verified: ${verified.length}`);
console.log(`Excluded: ${excluded.length}`);
console.log(`Final safe list: ${finalList.length}\n`);

console.log('EXCLUDED (false positives):');
for (const r of excluded) {
  const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  console.log(`  ❌ ID ${r.id}: "${r.name}" → "${clean}"`);
}

console.log('\nFINAL LIST (safe to apply):');
for (const r of finalList) {
  const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  console.log(`  ✅ ID ${r.id}: "${r.name}" → "${clean}" [${r.ingredients.length} ingr, ${r.steps.length} steps]`);
}

// Save final list
writeFileSync('rescrape-final.json', JSON.stringify(finalList, null, 2));
console.log(`\nSaved ${finalList.length} recipes to rescrape-final.json`);

// Summary of what remains unfixed
const allReport = JSON.parse(readFileSync('rescrape-report.json', 'utf8'));
const totalGarbled = allReport.fixed.length + allReport.wrongUrl.length + allReport.scrapeFailed.length;
const unfixed = totalGarbled - finalList.length;
console.log(`\n${'='.repeat(50)}`);
console.log(`GESAMTSTATUS:`);
console.log(`  Total garbled:    ${totalGarbled}`);
console.log(`  ✅ Fixbar jetzt:  ${finalList.length}`);
console.log(`  ❌ Noch offen:    ${unfixed} (brauchen neue URLs)`);

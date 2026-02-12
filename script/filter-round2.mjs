/**
 * Filter round 2 results — exclude false positives where the dish type
 * is fundamentally different (cake vs sausage, coffee vs pastry, etc.)
 */
import { readFileSync, writeFileSync } from 'fs';

const { fixed, notFound } = JSON.parse(readFileSync('rescrape-round2.json', 'utf8'));

// Exclude: dish type is fundamentally different
const EXCLUDE = new Set([
  138,  // Frankfurter (sausage) → Frankfurter Kranz (cake)
  147,  // Einspänner (coffee) → Gerollte Einspänner (pastry)
  164,  // Bündnerfleisch (cured meat) → Rote Bete Mousse
  165,  // Räucherlachs (smoked salmon) → Spaghetti mit Räucherlachs (pasta)
  223,  // Selchfleisch (smoked meat) → Selchfleischknödel (dumplings)
  300,  // Karotten-Ingwer-Bratlinge (patties) → Ingwer-Möhren mit Honig (carrots)
  319,  // Salzkartoffeln (boiled potatoes) → Spinat+Spiegelei+Salzkartoffeln (complete dish)
  327,  // Kartoffelpüree mit Kräutern → Kräuter-Kartoffelstampf mit Fischstäbchen (fish!)
  348,  // Risotto als Beilage (plain) → Fenchel-Risotto (specific flavor)
  352,  // Ebly/Weizen (plain grain) → Ebly-Pfanne mit Schinkengulasch (pan dish)
  359,  // Hirse (plain grain) → Hirse-Käsebratlinge (patties)
  377,  // Rote Rüben warm (beets) → Rote Rüben Cremesuppe (soup)
  385,  // Broccoli mit Butter → Brokkoli mit Mandelbutter (different butter type)
  420,  // Nussbrösel (nut crumbs) → Mohnnudeln mit Nussbröseln (noodle dish)
  423,  // Fruchtcoulis (fruit sauce) → Spekulatiuscreme (chocolate dessert)
  87,   // Bratgemüse (roasted veg) → Bratgemüse mit Sojagranulat (soy added)
]);

const verified = fixed.filter(r => !EXCLUDE.has(r.id));
const rejected = fixed.filter(r => EXCLUDE.has(r.id));

console.log(`Round 2 results: ${fixed.length} found`);
console.log(`Excluded (false positives): ${rejected.length}`);
console.log(`Verified safe: ${verified.length}\n`);

console.log('VERIFIED (safe to apply):');
for (const r of verified) {
  const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  console.log(`  ✅ ID ${r.id}: "${r.name}" → "${clean}" (${r.ingredients.length} ingr)`);
}

console.log('\nEXCLUDED:');
for (const r of rejected) {
  const clean = r.scrapedName.replace(/\s+von\s+\S.*$/i, '').trim();
  console.log(`  ❌ ID ${r.id}: "${r.name}" → "${clean}"`);
}

// Total unfixed = notFound + excluded
const totalUnfixed = notFound.length + rejected.length;
console.log(`\n${'='.repeat(50)}`);
console.log(`GESAMTSTATUS nach Runde 1+2:`);
console.log(`  Runde 1: 63 gefixt`);
console.log(`  Runde 2: ${verified.length} gefixt`);
console.log(`  Total gefixt: ${63 + verified.length} von 164`);
console.log(`  Noch offen: ${totalUnfixed}`);

writeFileSync('rescrape-round2-verified.json', JSON.stringify(verified, null, 2));
console.log(`\nSaved ${verified.length} to rescrape-round2-verified.json`);

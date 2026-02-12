import { scrapeRecipe } from '../server/modules/recipe/scraper.ts';

const urls = [
  'https://www.chefkoch.de/rezepte/743391176908148/Kaspressknoedelsuppe.html',
  'https://www.chefkoch.de/rezepte/1049981209974299/Baerlauchcremesuppe-mit-Croutons-und-gebratener-Chorizo.html',
  'https://www.gutekueche.at/wiener-schnitzel-rezept-118',
];

for (const url of urls) {
  const r = await scrapeRecipe(url);
  if (!r) { console.log('FAIL:', url); continue; }
  console.log('\n=== ' + r.name + ' ===');
  r.ingredients.forEach(i => console.log('  ' + i.amount + ' ' + i.unit + ' | ' + i.name));
}

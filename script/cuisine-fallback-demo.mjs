/**
 * Small runnable demo for cuisine-aware 3-tier fallback side selection.
 *
 * Run:
 *   npm run demo:cuisine-fallback
 */

const CUISINE_COMPAT = {
  austrian: ["austrian"],
  italian: ["italian", "mediterranean"],
  asian: ["asian"],
  mediterranean: ["mediterranean", "italian"],
};

function isCuisineCompatible(mainCuisine, sideCuisine) {
  if (!mainCuisine) return true;
  if (!sideCuisine) return false;
  if (mainCuisine === sideCuisine) return true;
  return (CUISINE_COMPAT[mainCuisine] || []).includes(sideCuisine);
}

function norm(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[()_,.;:!?-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNeutralSideName(name) {
  const n = norm(name);
  const words = n.split(" ");

  const neutralSet = new Set([
    "reis",
    "butterreis",
    "salzkartoffeln",
    "kartoffeln",
    "salat",
    "blattsalat",
    "gurkensalat",
    "tomatensalat",
    "gemuse",
    "saisongemuse",
  ]);

  if (neutralSet.has(n)) return true;
  if (words.some(w => w.includes("reis"))) return true;
  if (words.some(w => w.includes("salzkartoffel"))) return true;
  if (words.some(w => w.endsWith("salat"))) return true;
  return false;
}

function pickSide(mainRecipe, sidePool) {
  const base = sidePool;

  if (mainRecipe.dishType === "selfContained" || mainRecipe.dishType === "dessertMain") {
    return { tier: "SKIP", pick: null, candidates: [] };
  }

  let candidates = base;

  if (mainRecipe.cuisineType) {
    candidates = base.filter(s => isCuisineCompatible(mainRecipe.cuisineType, s.cuisineType));
    if (candidates.length > 0) return { tier: "A", pick: candidates[0], candidates };

    candidates = base.filter(s => isNeutralSideName(s.name));
    if (candidates.length > 0) return { tier: "B", pick: candidates[0], candidates };

    return { tier: "C", pick: base[0] || null, candidates: base };
  }

  return { tier: "C", pick: base[0] || null, candidates: base };
}

const mainDishes = [
  { name: "Thai Curry", cuisineType: "asian", dishType: "needsSides" },
  { name: "Käsespätzle", cuisineType: "austrian", dishType: "selfContained" },
  { name: "Marillenknödel", cuisineType: "austrian", dishType: "dessertMain" },
];

const sides = [
  { name: "Semmelknödel", cuisineType: "austrian" },
  { name: "Butterreis", cuisineType: null },
  { name: "Wok-Gemüse", cuisineType: "asian" },
];

console.log("\n=== Cuisine-aware 3-tier demo ===");
for (const main of mainDishes) {
  const result = pickSide(main, sides);
  const picked = result.pick ? result.pick.name : "-";
  console.log(`\nMain: ${main.name} (${main.cuisineType ?? "untagged"}, ${main.dishType})`);
  console.log(`Tier: ${result.tier}`);
  console.log(`Candidates: ${result.candidates.map(c => c.name).join(", ") || "-"}`);
  console.log(`Picked: ${picked}`);
}

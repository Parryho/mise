function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[()_,.;:!?-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NEUTRAL_SIDE_NAMES = new Set(
  [
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
  ].map(norm),
);

export function isNeutralSideName(name: string): boolean {
  const n = norm(name);
  if (!n) return false;
  if (NEUTRAL_SIDE_NAMES.has(n)) return true;

  const words = n.split(" ");
  if (words.some(w => w.includes("reis"))) return true;
  if (words.some(w => w.includes("salzkartoffel"))) return true;
  if (words.some(w => w.endsWith("salat"))) return true;

  return false;
}

/**
 * Reliable recipe placeholder images.
 * Uses inline SVG data URIs — no external dependencies, always works.
 * Category-specific gradient colors for visual distinction.
 */

// ═══════════════════════════════════════════════════════════
// Category → gradient colors
// ═══════════════════════════════════════════════════════════
const CATEGORY_COLORS: Record<string, [string, string]> = {
  ClearSoups:   ["#fbbf24", "#b45309"],  // amber
  CreamSoups:   ["#fb923c", "#c2410c"],  // orange
  MainMeat:     ["#f87171", "#b91c1c"],  // red
  MainFish:     ["#60a5fa", "#1d4ed8"],  // blue
  MainVegan:    ["#4ade80", "#15803d"],  // green
  Sides:        ["#c084fc", "#7e22ce"],  // purple
  ColdSauces:   ["#22d3ee", "#0e7490"],  // cyan
  HotSauces:    ["#fb7185", "#be123c"],  // rose
  Salads:       ["#a3e635", "#4d7c0f"],  // lime
  HotDesserts:  ["#f472b6", "#be185d"],  // pink
  ColdDesserts: ["#a78bfa", "#6d28d9"],  // violet
};

const DEFAULT_COLORS: [string, string] = ["#9ca3af", "#4b5563"]; // gray

/**
 * Generate an SVG data URI placeholder with category-specific gradient.
 * Always works — no network dependency.
 */
export function getPlaceholderImage(category?: string | null): string {
  const [from, to] = CATEGORY_COLORS[category || ""] || DEFAULT_COLORS;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${from}"/>` +
    `<stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#g)"/>` +
    `</svg>`
  )}`;
}

/**
 * Returns a reliable default image for a recipe.
 * Uses category-specific SVG gradient placeholder.
 */
export function getDefaultRecipeImage(category?: string | null, _recipeName?: string | null): string {
  return getPlaceholderImage(category);
}

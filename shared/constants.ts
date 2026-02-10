// Client-safe constants (no server dependencies)

export const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const DAY_NAMES_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const INGREDIENT_CATEGORIES: Record<string, string> = {
  fleisch: 'Fleisch & Wurst',
  fisch: 'Fisch & Meeresfrüchte',
  gemuese: 'Gemüse & Salat',
  milchprodukte: 'Milchprodukte',
  trockenwaren: 'Trockenwaren & Getreide',
  gewuerze: 'Gewürze & Kräuter',
  eier_fette: 'Eier & Fette',
  obst: 'Obst & Früchte',
  tiefkuehl: 'Tiefkühlware',
  sonstiges: 'Sonstiges',
};

export const UNITS: Record<string, string> = {
  g: 'Gramm',
  kg: 'Kilogramm',
  ml: 'Milliliter',
  l: 'Liter',
  stueck: 'Stück',
};

export const MEAL_SLOTS = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'] as const;
export type MealSlotName = typeof MEAL_SLOTS[number];

export const MEAL_SLOT_LABELS: Record<MealSlotName, string> = {
  soup: 'Suppe',
  main1: 'Fleisch/Fisch',
  side1a: 'Beilage 1a',
  side1b: 'Beilage 1b',
  main2: 'Vegetarisch',
  side2a: 'Beilage 2a',
  side2b: 'Beilage 2b',
  dessert: 'Dessert',
};

export const EVENT_TYPES = [
  { id: 'brunch', label: 'Brunch' },
  { id: 'ball', label: 'Ball' },
  { id: 'buffet', label: 'Buffet' },
  { id: 'bankett', label: 'Bankett' },
  { id: 'empfang', label: 'Empfang' },
  { id: 'seminar', label: 'Seminar' },
  { id: 'sonstiges', label: 'Sonstiges' },
] as const;

export const EVENT_STATUSES = [
  { id: 'geplant', label: 'Geplant', color: 'bg-blue-100 text-blue-800' },
  { id: 'bestaetigt', label: 'Bestätigt', color: 'bg-green-100 text-green-800' },
  { id: 'abgesagt', label: 'Abgesagt', color: 'bg-red-100 text-red-800' },
  { id: 'abgeschlossen', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' },
] as const;

/** Format a Date as YYYY-MM-DD using local timezone (avoids UTC shift from toISOString) */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getSlotCategory(slotKey: string): string {
  if (slotKey === 'soup') return 'soup';
  if (slotKey === 'main1' || slotKey === 'main2') return 'main';
  if (slotKey.startsWith('side')) return 'side';
  if (slotKey === 'dessert') return 'dessert';
  return slotKey;
}

// ============================================================
// Culinary Tags for intelligent menu planning
// ============================================================

export const CUISINE_TYPES = {
  austrian: { de: "Österreichisch", en: "Austrian" },
  italian: { de: "Italienisch", en: "Italian" },
  asian: { de: "Asiatisch", en: "Asian" },
  mediterranean: { de: "Mediterran", en: "Mediterranean" },
} as const;

export const FLAVOR_PROFILES = {
  hearty: { de: "Deftig", en: "Hearty" },
  light: { de: "Leicht", en: "Light" },
  spicy: { de: "Scharf", en: "Spicy" },
  creamy: { de: "Cremig", en: "Creamy" },
  fresh: { de: "Frisch", en: "Fresh" },
} as const;

export const DISH_TYPES = {
  needsSides: { de: "Braucht Beilagen", en: "Needs sides" },
  selfContained: { de: "Komplett", en: "Self-contained" },
  dessertMain: { de: "Süßes Hauptgericht", en: "Dessert main" },
} as const;

export type CuisineType = keyof typeof CUISINE_TYPES;
export type FlavorProfile = keyof typeof FLAVOR_PROFILES;
export type DishType = keyof typeof DISH_TYPES;

export function getWeekDateRange(year: number, week: number): { from: string; to: string } {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: formatLocalDate(monday), to: formatLocalDate(sunday) };
}

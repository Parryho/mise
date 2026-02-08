/**
 * Category-specific default images for recipes without photos.
 * All images from Unsplash (free to use).
 */

const CATEGORY_IMAGES: Record<string, string> = {
  ClearSoups: "photo-1547592166-23ac45744acd",
  CreamSoups: "photo-1603105037880-880cd4edfb0d",
  MainMeat: "photo-1544025162-d76694265947",
  MainFish: "photo-1467003909585-2f8a72700288",
  MainVegan: "photo-1512621776951-a57141f2eefd",
  Sides: "photo-1568901346375-23c9450c58cd",
  ColdSauces: "photo-1472476443507-c7a5948772fc",
  HotSauces: "photo-1472476443507-c7a5948772fc",
  Salads: "photo-1540420773420-3366772f4999",
  HotDesserts: "photo-1551024506-0bccd828d307",
  ColdDesserts: "photo-1488477181946-6428a0291777",
};

const DEFAULT_IMAGE = "photo-1495521821757-a1efb6729352";

export function getDefaultRecipeImage(category?: string | null): string {
  const photoId = (category && CATEGORY_IMAGES[category]) || DEFAULT_IMAGE;
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=80&w=800`;
}

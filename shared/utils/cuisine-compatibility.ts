import type { CuisineType } from "../constants";

export const CUISINE_COMPAT: Record<CuisineType, CuisineType[]> = {
  austrian: ["austrian"],
  italian: ["italian", "mediterranean"],
  asian: ["asian"],
  mediterranean: ["mediterranean", "italian"],
} as const;

export function isCuisineCompatible(
  mainCuisine: CuisineType | null | undefined,
  sideCuisine: CuisineType | null | undefined,
): boolean {
  if (!mainCuisine) return true;
  if (!sideCuisine) return false;
  if (mainCuisine === sideCuisine) return true;

  const allowed = CUISINE_COMPAT[mainCuisine];
  return Array.isArray(allowed) ? allowed.includes(sideCuisine) : false;
}

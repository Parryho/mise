import { describe, it, expect } from "vitest";
import { isCuisineCompatible } from "../shared/utils/cuisine-compatibility";
import { isNeutralSideName } from "../shared/utils/neutral-sides";

describe("Cuisine compatibility", () => {
  it("IT + Mediterranean kompatibel", () => {
    expect(isCuisineCompatible("italian", "mediterranean")).toBe(true);
  });

  it("Asia + AT NICHT kompatibel", () => {
    expect(isCuisineCompatible("asian", "austrian")).toBe(false);
  });

  it("Main gesetzt, Side ungetaggt => nicht kompatibel", () => {
    expect(isCuisineCompatible("asian", null)).toBe(false);
  });
});

describe("Neutral side detection", () => {
  it("erkennt neutrale Beilage via Exact Match", () => {
    expect(isNeutralSideName("Butterreis")).toBe(true);
    expect(isNeutralSideName("Semmelknödel")).toBe(false);
  });

  it("erkennt neutrale Beilage robust trotz Trennzeichen/Case", () => {
    expect(isNeutralSideName("BASMATI-REIS")).toBe(true);
    expect(isNeutralSideName("Tomaten-Salat")).toBe(true);
  });

  it("erkennt neutrale Beilage robust mit Umlauten", () => {
    expect(isNeutralSideName("Saisongemüse")).toBe(true);
  });
});

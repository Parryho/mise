// Menu Planning domain — public API

// Rotation
export { generateWeekFromRotation, getRotationOverview, ensureDefaultTemplate, getOrGenerateWeekPlan } from "./rotation";

// Rotation agent (auto-fill)
export { autoFillRotation } from "./rotation-agent";

// Smart rotation (AI optimization)
export { getRotationAnalysis, optimizeRotation, handleOptimizeRotation, handleGetAnalysis } from "./smart-rotation";

// Production list
export { getProductionList } from "./production";

// Shopping list
export { getShoppingList } from "./shopping";

// Food cost
export { getDishCost, getWeeklyCostReport } from "./costs";

// Public menu
export { getPublicMenu } from "./public-menu";

// Buffet cards
export { getBuffetCards, getBuffetCardsForDate } from "./buffet-cards";

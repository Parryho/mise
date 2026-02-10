// Recipe + Allergen domain — public API

// Allergen detection
export { detectAllergens, suggestAllergensForRecipe, getAllergensFromIngredients, detectAllergensHandler, suggestAllergensForRecipeHandler } from "./allergen-detection";

// Allergen matrix (daily/weekly aggregation)
export { getDailyAllergenMatrix, getWeeklyAllergenMatrix } from "./allergen-matrix";

// Auto-tagging
export { autoTagAllRecipes } from "./auto-tag";

// AI recipe import
export { parseRecipeWithAI, handleAIRecipeImport } from "./llm-import";

// Media upload
export { recipeMediaUpload, handleUploadMedia, handleGetMedia, handleUpdateMedia, handleDeleteMedia, getUploadDir } from "./media";

// Recipe suggestions
export { getRecipeSuggestions, getAISuggestions, handleGetSuggestions } from "./suggestions";

// Web scraper
export { scrapeRecipe, getSupportedPlatforms } from "./scraper";

// Sub-recipes
export { resolveRecipeIngredients, wouldCreateCycle } from "./sub-recipes";

// Intelligent scaling
export { scaleIngredient, scaleRecipe, scaleRecipeHandler, scaleIngredientPreview } from "./scaling";

// Pairing engine (adaptive learning)
export { calculateDecayWeight, aggregatePairingScores, getScoresForMain, loadAllScores, analyzePatterns } from "./pairing-engine";
export type { AnalyzedPattern } from "./pairing-engine";

// Quiz feedback handlers
export { handleGetWeekCombos, handleSubmitFeedback, handleGetMyRatings, handleGetPairingScores, handleGetDashboardStats, handleGetLearnedRules, handleAIValidate, handleGameFeedback, handleAIResearch, handleGameEntry, handleGetGameEntries, getAdaptiveEpsilon } from "./quiz-feedback";

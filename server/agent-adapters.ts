/**
 * Agent Adapters — Thin wrappers around existing agent functions
 * Each adapter normalizes inputs/outputs for the orchestrator
 */

import { getPaxForecast } from "./pax-forecast";
import { detectAnomalies, getFridgeHealthScore } from "./haccp-anomaly";
import { getWastePredictions } from "./waste-prediction";
import { getRecipeSuggestions } from "./recipe-suggestions";
import { getAllergensFromIngredients } from "./allergen-detection";
import { formatLocalDate } from "@shared/constants";
import { getRotationAnalysis } from "./smart-rotation";
import { scaleRecipe } from "./intelligent-scaling";
import { storage } from "./storage";

// ── Types ──────────────────────────────────────────────────────────

export interface AgentContext {
  locationId: number | undefined;
  locationSlug: string;
  weekStart: string; // YYYY-MM-DD Monday
  weekEnd: string;   // YYYY-MM-DD Sunday
}

export interface AgentResult {
  agentName: string;
  status: "completed" | "failed" | "skipped";
  durationMs: number;
  confidence: number; // 0-100
  resultSummary: string;
  data: unknown;
}

// ── Helper ─────────────────────────────────────────────────────────

function weekEndDate(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return formatLocalDate(d);
}

async function runAdapter(
  name: string,
  fn: () => Promise<{ summary: string; confidence: number; data: unknown }>
): Promise<AgentResult> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      agentName: name,
      status: "completed",
      durationMs: Date.now() - start,
      confidence: result.confidence,
      resultSummary: result.summary,
      data: result.data,
    };
  } catch (err: any) {
    return {
      agentName: name,
      status: "failed",
      durationMs: Date.now() - start,
      confidence: 0,
      resultSummary: `Fehler: ${err.message}`,
      data: null,
    };
  }
}

// ── Adapters ───────────────────────────────────────────────────────

export async function adaptPaxForecast(ctx: AgentContext): Promise<AgentResult> {
  return runAdapter("pax-forecast", async () => {
    const result = await getPaxForecast(ctx.locationId, ctx.weekStart);
    const forecasts = result.forecasts || [];
    const avgPax = forecasts.length
      ? Math.round(forecasts.reduce((s, f) => s + f.predicted, 0) / forecasts.length)
      : 0;
    const spikes = forecasts.filter(f => f.predicted > (f.avg4Week || f.predicted) * 1.2);
    return {
      summary: `Durchschn. ${avgPax} PAX/Mahlzeit, ${spikes.length} Spitzentage erkannt`,
      confidence: result.accuracy?.mape ? Math.max(0, 100 - result.accuracy.mape) : 60,
      data: { forecasts, avgPax, spikes, accuracy: result.accuracy },
    };
  });
}

export async function adaptHaccpAnomaly(ctx: AgentContext): Promise<AgentResult> {
  return runAdapter("haccp-anomaly", async () => {
    const result = await detectAnomalies(ctx.locationId, ctx.weekStart, ctx.weekEnd);
    const anomalies = result.anomalies || [];
    const summary = result.summary || { critical: 0, warning: 0, info: 0 };

    // Get fridge health scores
    const fridges = await storage.getFridges();
    const relevantFridges = ctx.locationId
      ? fridges.filter(f => f.locationId === ctx.locationId)
      : fridges;
    const healthScores = await Promise.all(
      relevantFridges.map(f => getFridgeHealthScore(f.id).catch(() => ({
        fridgeId: f.id, fridgeName: f.name, score: -1, totalChecks: 0, anomalyCount: 0, recommendation: "N/A"
      })))
    );

    return {
      summary: `${summary.critical} kritisch, ${summary.warning} Warnungen, ${anomalies.length} Anomalien gesamt`,
      confidence: anomalies.length === 0 ? 90 : 75,
      data: { anomalies, summary, healthScores },
    };
  });
}

export async function adaptWastePrediction(ctx: AgentContext): Promise<AgentResult> {
  return runAdapter("waste-prediction", async () => {
    const result = await getWastePredictions(ctx.locationId, ctx.weekStart, ctx.weekEnd);
    const atRisk = result.atRisk || [];
    const redCount = result.summary?.redCount || 0;
    return {
      summary: `${atRisk.length} Zutaten at-risk (${redCount} rot)`,
      confidence: 70,
      data: result,
    };
  });
}

export async function adaptRecipeSuggestions(ctx: AgentContext): Promise<AgentResult> {
  return runAdapter("recipe-suggestions", async () => {
    const suggestions = await getRecipeSuggestions({
      locationId: ctx.locationId,
      date: ctx.weekStart,
      meal: "mittag",
    });
    const topN = (suggestions || []).slice(0, 15);
    return {
      summary: `${topN.length} Rezeptvorschläge mit Score ${topN[0]?.score ?? 0}–${topN[topN.length - 1]?.score ?? 0}`,
      confidence: 65,
      data: topN,
    };
  });
}

export async function adaptAllergenCheck(ctx: AgentContext): Promise<AgentResult> {
  return runAdapter("allergen-check", async () => {
    // Get active guest profiles for this week
    const profiles = await storage.getGuestAllergenProfilesByDateRange(
      ctx.weekStart, ctx.weekEnd, ctx.locationId
    );
    // Get planned recipes for this week
    const allPlans = await storage.getMenuPlansByDateRange(ctx.weekStart, ctx.weekEnd, ctx.locationId);
    const recipeIds = Array.from(new Set(allPlans.filter(p => p.recipeId).map(p => p.recipeId!)));

    // Collect allergens from planned recipes
    const conflicts: Array<{
      profileGroup: string;
      allergen: string;
      recipeName: string;
      date: string;
    }> = [];

    for (const plan of allPlans) {
      if (!plan.recipeId) continue;
      const recipe = await storage.getRecipe(plan.recipeId);
      if (!recipe) continue;
      const recipeAllergens = recipe.allergens || [];

      for (const profile of profiles) {
        const profileAllergens = profile.allergens || [];
        const overlap = recipeAllergens.filter(a => profileAllergens.includes(a));
        for (const allergen of overlap) {
          conflicts.push({
            profileGroup: profile.groupName,
            allergen,
            recipeName: recipe.name,
            date: plan.date,
          });
        }
      }
    }

    return {
      summary: `${conflicts.length} Allergen-Konflikte, ${profiles.length} Gästeprofile aktiv`,
      confidence: conflicts.length > 0 ? 85 : 95,
      data: { conflicts, activeProfiles: profiles.length, plannedRecipes: recipeIds.length },
    };
  });
}

export async function adaptRotationAnalysis(ctx: AgentContext): Promise<AgentResult> {
  return runAdapter("rotation-analysis", async () => {
    // Find active template for this location
    const templates = await storage.getRotationTemplates();
    const template = ctx.locationId
      ? templates.find(t => t.locationId === ctx.locationId && t.isActive)
      : templates.find(t => t.isActive);

    if (!template) {
      return { summary: "Keine aktive Rotation gefunden", confidence: 0, data: null };
    }

    const analysis = await getRotationAnalysis(template.id);
    return {
      summary: `${analysis.fillPercentage}% befüllt, Vielfalt ${analysis.varietyScore}/100, ${analysis.recipesUsedMultipleTimes.length} Duplikate`,
      confidence: 80,
      data: analysis,
    };
  });
}

export async function adaptPortionScaling(
  ctx: AgentContext,
  paxData?: { avgPax: number; spikes: Array<{ date: string; predicted: number }> }
): Promise<AgentResult> {
  return runAdapter("portion-scaling", async () => {
    if (!paxData || paxData.avgPax === 0) {
      return { summary: "Keine PAX-Daten für Scaling", confidence: 0, data: null };
    }

    // Get planned recipes for this week and scale the first few
    const plans = await storage.getMenuPlansByDateRange(ctx.weekStart, ctx.weekEnd, ctx.locationId);
    const uniqueRecipeIds = Array.from(new Set(plans.filter(p => p.recipeId).map(p => p.recipeId!))).slice(0, 5);

    const scaledResults = await Promise.all(
      uniqueRecipeIds.map(async (recipeId) => {
        try {
          return await scaleRecipe(recipeId, paxData.avgPax);
        } catch {
          return null;
        }
      })
    );

    const validResults = scaledResults.filter(Boolean);
    return {
      summary: `${validResults.length} Rezepte auf ${paxData.avgPax} PAX skaliert`,
      confidence: 70,
      data: { targetPax: paxData.avgPax, scaledRecipes: validResults },
    };
  });
}

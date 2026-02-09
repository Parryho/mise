/**
 * Agent Team Orchestrator — Coordinates 7 existing AI agents into a unified Weekly Planning Briefing
 *
 * Phase 1 (parallel): PAX Forecast, HACCP Anomaly, Waste Prediction
 * Phase 2 (parallel): Recipe Suggestions, Allergen Check
 * Phase 3 (sequential): Rotation Analysis, Portion Scaling (uses Phase 1 PAX data)
 * Phase 4 (optional): Claude AI synthesis
 */

import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import {
  type AgentContext,
  type AgentResult,
  adaptPaxForecast,
  adaptHaccpAnomaly,
  adaptWastePrediction,
  adaptRecipeSuggestions,
  adaptAllergenCheck,
  adaptRotationAnalysis,
  adaptPortionScaling,
} from "./agent-adapters";

// ── Types ──────────────────────────────────────────────────────────

export type ActionPriority = "HIGH" | "MEDIUM" | "LOW";

export interface ActionItem {
  priority: ActionPriority;
  source: string; // agent name
  title: string;
  detail: string;
  recipeId?: number;
  date?: string;
}

export interface TeamBriefing {
  runId: number;
  locationSlug: string;
  weekStart: string;
  status: "running" | "completed" | "failed";
  durationMs: number;
  phases: {
    phase: number;
    agents: AgentResult[];
  }[];
  actionItems: ActionItem[];
  summary: string;
  hasAiSummary: boolean;
}

export type SSEEvent =
  | { type: "phase-start"; phase: number; agents: string[] }
  | { type: "agent-start"; phase: number; agent: string }
  | { type: "agent-complete"; phase: number; agent: string; status: string; summary: string; durationMs: number }
  | { type: "phase-complete"; phase: number; durationMs: number }
  | { type: "briefing-complete"; briefing: TeamBriefing };

// Global map of active run SSE emitters
const sseEmitters = new Map<number, ((event: SSEEvent) => void)[]>();

export function registerSSEListener(runId: number, emit: (event: SSEEvent) => void) {
  if (!sseEmitters.has(runId)) sseEmitters.set(runId, []);
  sseEmitters.get(runId)!.push(emit);
}

export function unregisterSSEListener(runId: number, emit: (event: SSEEvent) => void) {
  const listeners = sseEmitters.get(runId);
  if (!listeners) return;
  const idx = listeners.indexOf(emit);
  if (idx >= 0) listeners.splice(idx, 1);
  if (listeners.length === 0) sseEmitters.delete(runId);
}

function emitSSE(runId: number, event: SSEEvent) {
  const listeners = sseEmitters.get(runId);
  if (listeners) listeners.forEach(fn => fn(event));
}

// ── Orchestrator ───────────────────────────────────────────────────

export async function runTeamBriefing(
  locationSlug: string,
  weekStart: string,
  triggeredBy?: string,
  existingRunId?: number
): Promise<TeamBriefing> {
  const totalStart = Date.now();

  // Resolve location
  const location = await storage.getLocationBySlug(locationSlug);
  const locationId = location?.id;

  const weekEnd = addDays(weekStart, 6);

  const ctx: AgentContext = { locationId, locationSlug, weekStart, weekEnd };

  // Use existing run ID or create a new one
  let runId: number;
  if (existingRunId) {
    runId = existingRunId;
  } else {
    const run = await storage.createTeamRun({
      locationSlug,
      weekStart,
      triggeredBy: triggeredBy ?? null,
      status: "running",
      durationMs: null,
      hasAiSummary: false,
      summary: null,
      briefing: null,
    });
    runId = run.id;
  }

  const phases: TeamBriefing["phases"] = [];

  try {
    // ── Phase 1: Independent data agents (parallel) ──
    const phase1Agents = ["pax-forecast", "haccp-anomaly", "waste-prediction"];
    emitSSE(runId, { type: "phase-start", phase: 1, agents: phase1Agents });

    const phase1Start = Date.now();
    const [paxResult, haccpResult, wasteResult] = await Promise.all([
      wrapWithSSE(runId, 1, "pax-forecast", () => adaptPaxForecast(ctx)),
      wrapWithSSE(runId, 1, "haccp-anomaly", () => adaptHaccpAnomaly(ctx)),
      wrapWithSSE(runId, 1, "waste-prediction", () => adaptWastePrediction(ctx)),
    ]);
    phases.push({ phase: 1, agents: [paxResult, haccpResult, wasteResult] });
    emitSSE(runId, { type: "phase-complete", phase: 1, durationMs: Date.now() - phase1Start });

    // Persist phase 1 actions
    await persistActions(runId, [paxResult, haccpResult, wasteResult]);

    // ── Phase 2: Context-aware agents (parallel, uses Phase 1 for context) ──
    const phase2Agents = ["recipe-suggestions", "allergen-check"];
    emitSSE(runId, { type: "phase-start", phase: 2, agents: phase2Agents });

    const phase2Start = Date.now();
    const [suggestionsResult, allergenResult] = await Promise.all([
      wrapWithSSE(runId, 2, "recipe-suggestions", () => adaptRecipeSuggestions(ctx)),
      wrapWithSSE(runId, 2, "allergen-check", () => adaptAllergenCheck(ctx)),
    ]);
    phases.push({ phase: 2, agents: [suggestionsResult, allergenResult] });
    emitSSE(runId, { type: "phase-complete", phase: 2, durationMs: Date.now() - phase2Start });

    await persistActions(runId, [suggestionsResult, allergenResult]);

    // ── Phase 3: Dependent agents ──
    const phase3Agents = ["rotation-analysis", "portion-scaling"];
    emitSSE(runId, { type: "phase-start", phase: 3, agents: phase3Agents });

    const phase3Start = Date.now();
    const paxData = paxResult.status === "completed" && paxResult.data
      ? (paxResult.data as { avgPax: number; spikes: Array<{ date: string; predicted: number }> })
      : undefined;

    const [rotationResult, scalingResult] = await Promise.all([
      wrapWithSSE(runId, 3, "rotation-analysis", () => adaptRotationAnalysis(ctx)),
      wrapWithSSE(runId, 3, "portion-scaling", () => adaptPortionScaling(ctx, paxData)),
    ]);
    phases.push({ phase: 3, agents: [rotationResult, scalingResult] });
    emitSSE(runId, { type: "phase-complete", phase: 3, durationMs: Date.now() - phase3Start });

    await persistActions(runId, [rotationResult, scalingResult]);

    // ── Conflict Resolution ──
    const actionItems = resolveConflicts(
      paxResult, haccpResult, wasteResult,
      suggestionsResult, allergenResult,
      rotationResult, scalingResult
    );

    // ── Phase 4: Optional AI Synthesis ──
    let summary = buildAlgorithmicSummary(phases, actionItems);
    let hasAiSummary = false;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        emitSSE(runId, { type: "phase-start", phase: 4, agents: ["ai-synthesis"] });
        const phase4Start = Date.now();
        const aiSummary = await generateAISummary(phases, actionItems, locationSlug, weekStart);
        if (aiSummary) {
          summary = aiSummary;
          hasAiSummary = true;
        }
        emitSSE(runId, { type: "phase-complete", phase: 4, durationMs: Date.now() - phase4Start });
      } catch (err) {
        console.error("Phase 4 AI synthesis failed:", err);
      }
    }

    const durationMs = Date.now() - totalStart;
    const briefing: TeamBriefing = {
      runId,
      locationSlug,
      weekStart,
      status: "completed",
      durationMs,
      phases,
      actionItems,
      summary,
      hasAiSummary,
    };

    // Persist final result
    await storage.updateTeamRun(runId, {
      status: "completed",
      durationMs,
      hasAiSummary,
      summary,
      briefing: JSON.stringify(briefing),
    });

    emitSSE(runId, { type: "briefing-complete", briefing });
    return briefing;

  } catch (err: any) {
    const durationMs = Date.now() - totalStart;
    await storage.updateTeamRun(runId, {
      status: "failed",
      durationMs,
      summary: `Fehler: ${err.message}`,
    });
    throw err;
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function wrapWithSSE(
  runId: number,
  phase: number,
  agentName: string,
  fn: () => Promise<AgentResult>
): Promise<AgentResult> {
  emitSSE(runId, { type: "agent-start", phase, agent: agentName });
  const result = await fn();
  emitSSE(runId, {
    type: "agent-complete",
    phase,
    agent: agentName,
    status: result.status,
    summary: result.resultSummary,
    durationMs: result.durationMs,
  });
  return result;
}

async function persistActions(runId: number, results: AgentResult[]) {
  await Promise.all(
    results.map(r =>
      storage.createTeamAction({
        runId,
        agentName: r.agentName,
        status: r.status,
        durationMs: r.durationMs,
        resultSummary: r.resultSummary,
        resultData: JSON.stringify(r.data),
        confidence: r.confidence,
      })
    )
  );
}

// ── Conflict Resolution ────────────────────────────────────────────

function resolveConflicts(
  pax: AgentResult,
  haccp: AgentResult,
  waste: AgentResult,
  suggestions: AgentResult,
  allergen: AgentResult,
  rotation: AgentResult,
  scaling: AgentResult
): ActionItem[] {
  const items: ActionItem[] = [];

  // 1. HACCP Critical — food safety always top priority
  if (haccp.status === "completed" && haccp.data) {
    const data = haccp.data as {
      anomalies: Array<{ severity: string; message: string; fridgeName: string }>;
      healthScores: Array<{ fridgeName: string; score: number; recommendation: string }>;
    };
    for (const anomaly of (data.anomalies || []).filter(a => a.severity === "critical")) {
      items.push({
        priority: "HIGH",
        source: "haccp-anomaly",
        title: `HACCP Kritisch: ${anomaly.fridgeName}`,
        detail: anomaly.message,
      });
    }
    for (const hs of (data.healthScores || []).filter(h => h.score >= 0 && h.score < 50)) {
      items.push({
        priority: "HIGH",
        source: "haccp-anomaly",
        title: `Kühlgerät ${hs.fridgeName}: Health Score ${hs.score}%`,
        detail: hs.recommendation,
      });
    }
  }

  // 2. Allergen conflicts
  if (allergen.status === "completed" && allergen.data) {
    const data = allergen.data as {
      conflicts: Array<{ profileGroup: string; allergen: string; recipeName: string; date: string }>;
    };
    for (const c of data.conflicts || []) {
      items.push({
        priority: "HIGH",
        source: "allergen-check",
        title: `Allergen-Konflikt: ${c.allergen} in "${c.recipeName}"`,
        detail: `Gruppe "${c.profileGroup}" hat Allergen ${c.allergen}, geplant am ${c.date}`,
        date: c.date,
      });
    }
  }

  // 3. Waste prediction: RED risk items
  if (waste.status === "completed" && waste.data) {
    const data = waste.data as {
      atRisk: Array<{ ingredientName: string; riskLevel: string; daysUntilExpiry: number; suggestedRecipes: string[] }>;
    };
    for (const item of (data.atRisk || []).filter(i => i.riskLevel === "red")) {
      items.push({
        priority: "MEDIUM",
        source: "waste-prediction",
        title: `Verschwendungsrisiko: ${item.ingredientName}`,
        detail: `Ablauf in ${item.daysUntilExpiry} Tagen. Vorschläge: ${(item.suggestedRecipes || []).slice(0, 3).join(", ") || "keine"}`,
      });
    }
  }

  // 4. PAX spikes (>20% above average)
  if (pax.status === "completed" && pax.data) {
    const data = pax.data as {
      spikes: Array<{ date: string; predicted: number; dayName?: string }>;
      avgPax: number;
    };
    for (const spike of data.spikes || []) {
      items.push({
        priority: "MEDIUM",
        source: "pax-forecast",
        title: `PAX-Spitze: ${spike.predicted} PAX am ${spike.date}`,
        detail: `${Math.round(((spike.predicted - data.avgPax) / data.avgPax) * 100)}% über Durchschnitt — Portionen & Einkauf prüfen`,
        date: spike.date,
      });
    }
  }

  // 5. Rotation gaps
  if (rotation.status === "completed" && rotation.data) {
    const data = rotation.data as { fillPercentage: number; emptySlots: number; varietyScore: number };
    if (data.fillPercentage < 80) {
      items.push({
        priority: "MEDIUM",
        source: "rotation-analysis",
        title: `Rotation nur ${data.fillPercentage}% befüllt`,
        detail: `${data.emptySlots} leere Slots — Auto-Fill oder manuell ergänzen`,
      });
    }
    if (data.varietyScore < 50) {
      items.push({
        priority: "LOW",
        source: "rotation-analysis",
        title: `Geringe Vielfalt: ${data.varietyScore}/100`,
        detail: "Mehr verschiedene Rezepte einsetzen, um Abwechslung zu erhöhen",
      });
    }
  }

  // Sort: HIGH first, then MEDIUM, then LOW
  const priorityOrder: Record<ActionPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

// ── Algorithmic Summary ────────────────────────────────────────────

function buildAlgorithmicSummary(
  phases: TeamBriefing["phases"],
  actionItems: ActionItem[]
): string {
  const allAgents = phases.flatMap(p => p.agents);
  const completed = allAgents.filter(a => a.status === "completed").length;
  const failed = allAgents.filter(a => a.status === "failed").length;
  const high = actionItems.filter(a => a.priority === "HIGH").length;
  const medium = actionItems.filter(a => a.priority === "MEDIUM").length;

  const lines = [`${completed}/${allAgents.length} Agents erfolgreich (${failed} fehlgeschlagen)`];
  if (high > 0) lines.push(`${high} kritische Aktionspunkte`);
  if (medium > 0) lines.push(`${medium} Warnungen`);

  const summaries = allAgents
    .filter(a => a.status === "completed")
    .map(a => `• ${a.agentName}: ${a.resultSummary}`);

  return lines.join(". ") + "\n\n" + summaries.join("\n");
}

// ── AI Synthesis (Phase 4, optional) ───────────────────────────────

async function generateAISummary(
  phases: TeamBriefing["phases"],
  actionItems: ActionItem[],
  locationSlug: string,
  weekStart: string
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const agentSummaries = phases.flatMap(p => p.agents)
    .filter(a => a.status === "completed")
    .map(a => `${a.agentName}: ${a.resultSummary}`)
    .join("\n");

  const actionSummary = actionItems
    .map(a => `[${a.priority}] ${a.title}: ${a.detail}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Du bist Küchenchef-Assistent. Fasse dieses Wochen-Briefing für Standort "${locationSlug}" (KW ab ${weekStart}) auf Deutsch zusammen. Kurz, klar, handlungsorientiert (max 4-5 Sätze).

Agent-Ergebnisse:
${agentSummaries}

Aktionspunkte:
${actionSummary || "Keine"}

Gib eine kurze Zusammenfassung mit den wichtigsten Handlungsempfehlungen.`,
    }],
  });

  const content = message.content[0];
  if (content.type === "text") return content.text;
  return null;
}

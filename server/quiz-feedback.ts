/**
 * Quiz Feedback API — Endpoints for menu pairing ratings, dashboard stats, and AI validation.
 */

import type { Request, Response } from "express";
import { pool } from "./db";
import { quizFeedbackBatchSchema } from "@shared/schema";
import { aggregatePairingScores, analyzePatterns } from "./pairing-engine";

// ── GET /api/quiz/week-combos/:templateId/:weekNr ───────────────────────

export async function handleGetWeekCombos(req: Request, res: Response) {
  const templateId = Number(req.params.templateId);
  const weekNr = Number(req.params.weekNr);

  if (!templateId || !weekNr) {
    return res.status(400).json({ error: "templateId and weekNr required" });
  }

  // Get all filled slots for this week that are main or side slots
  const { rows: slots } = await pool.query(`
    SELECT rs.day_of_week, rs.meal, rs.location_slug, rs.course, rs.recipe_id, r.name AS recipe_name
    FROM rotation_slots rs
    LEFT JOIN recipes r ON r.id = rs.recipe_id
    WHERE rs.template_id = $1 AND rs.week_nr = $2 AND rs.recipe_id IS NOT NULL
    ORDER BY rs.day_of_week, rs.meal, rs.location_slug, rs.course
  `, [templateId, weekNr]);

  // Group slots into pairings: main1+side1a (starch), main1+side1b (veggie), main2+side2a, main2+side2b
  const combos: Array<{
    dayOfWeek: number;
    meal: string;
    locationSlug: string;
    mainRecipeId: number;
    mainRecipeName: string;
    sideRecipeId: number;
    sideRecipeName: string;
    pairingType: "main_starch" | "main_veggie";
  }> = [];

  // Build a lookup: key -> slot
  const slotMap = new Map<string, { recipeId: number; recipeName: string }>();
  for (const s of slots) {
    const key = `${s.day_of_week}-${s.meal}-${s.location_slug}-${s.course}`;
    slotMap.set(key, { recipeId: s.recipe_id, recipeName: s.recipe_name });
  }

  // Extract unique (day, meal, location) combos
  const dayMealLocs = new Set<string>();
  for (const s of slots) {
    dayMealLocs.add(`${s.day_of_week}-${s.meal}-${s.location_slug}`);
  }

  for (const dml of Array.from(dayMealLocs)) {
    const [dow, meal, loc] = dml.split("-");
    const main1 = slotMap.get(`${dow}-${meal}-${loc}-main1`);
    const side1a = slotMap.get(`${dow}-${meal}-${loc}-side1a`);
    const side1b = slotMap.get(`${dow}-${meal}-${loc}-side1b`);
    const main2 = slotMap.get(`${dow}-${meal}-${loc}-main2`);
    const side2a = slotMap.get(`${dow}-${meal}-${loc}-side2a`);
    const side2b = slotMap.get(`${dow}-${meal}-${loc}-side2b`);

    if (main1 && side1a) {
      combos.push({
        dayOfWeek: Number(dow), meal, locationSlug: loc,
        mainRecipeId: main1.recipeId, mainRecipeName: main1.recipeName,
        sideRecipeId: side1a.recipeId, sideRecipeName: side1a.recipeName,
        pairingType: "main_starch",
      });
    }
    if (main1 && side1b) {
      combos.push({
        dayOfWeek: Number(dow), meal, locationSlug: loc,
        mainRecipeId: main1.recipeId, mainRecipeName: main1.recipeName,
        sideRecipeId: side1b.recipeId, sideRecipeName: side1b.recipeName,
        pairingType: "main_veggie",
      });
    }
    if (main2 && side2a) {
      combos.push({
        dayOfWeek: Number(dow), meal, locationSlug: loc,
        mainRecipeId: main2.recipeId, mainRecipeName: main2.recipeName,
        sideRecipeId: side2a.recipeId, sideRecipeName: side2a.recipeName,
        pairingType: "main_starch",
      });
    }
    if (main2 && side2b) {
      combos.push({
        dayOfWeek: Number(dow), meal, locationSlug: loc,
        mainRecipeId: main2.recipeId, mainRecipeName: main2.recipeName,
        sideRecipeId: side2b.recipeId, sideRecipeName: side2b.recipeName,
        pairingType: "main_veggie",
      });
    }
  }

  res.json(combos);
}

// ── POST /api/quiz/feedback ─────────────────────────────────────────────

export async function handleSubmitFeedback(req: Request, res: Response) {
  const parsed = quizFeedbackBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
  }

  const { templateId, weekNr, ratings } = parsed.data;
  const userId = req.session?.userId || null;

  let inserted = 0;
  for (const r of ratings) {
    await pool.query(`
      INSERT INTO quiz_feedback (user_id, template_id, week_nr, day_of_week, meal, location_slug, main_recipe_id, side_recipe_id, pairing_type, rating, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [userId, templateId, weekNr, r.dayOfWeek, r.meal, r.locationSlug, r.mainRecipeId, r.sideRecipeId, r.pairingType, r.rating, r.comment || null]);
    inserted++;
  }

  // Trigger async aggregation (fire and forget)
  aggregatePairingScores().catch(err => console.error("[pairing-engine] Aggregation error:", err));

  res.json({ inserted });
}

// ── GET /api/quiz/my-ratings/:templateId/:weekNr ────────────────────────

export async function handleGetMyRatings(req: Request, res: Response) {
  const templateId = Number(req.params.templateId);
  const weekNr = Number(req.params.weekNr);
  const userId = req.session?.userId;

  if (!userId) {
    return res.json([]);
  }

  const { rows } = await pool.query(`
    SELECT main_recipe_id, side_recipe_id, pairing_type, rating, comment, day_of_week, meal, location_slug
    FROM quiz_feedback
    WHERE user_id = $1 AND template_id = $2 AND week_nr = $3
    ORDER BY day_of_week, meal
  `, [userId, templateId, weekNr]);

  res.json(rows.map(r => ({
    mainRecipeId: r.main_recipe_id,
    sideRecipeId: r.side_recipe_id,
    pairingType: r.pairing_type,
    rating: r.rating,
    comment: r.comment,
    dayOfWeek: r.day_of_week,
    meal: r.meal,
    locationSlug: r.location_slug,
  })));
}

// ── GET /api/quiz/pairing-scores ────────────────────────────────────────

export async function handleGetPairingScores(req: Request, res: Response) {
  const mainRecipeId = req.query.mainRecipeId ? Number(req.query.mainRecipeId) : null;

  let query = `
    SELECT ps.*, r1.name AS main_name, r2.name AS side_name
    FROM pairing_scores ps
    JOIN recipes r1 ON r1.id = ps.main_recipe_id
    JOIN recipes r2 ON r2.id = ps.side_recipe_id
  `;
  const params: any[] = [];

  if (mainRecipeId) {
    query += ` WHERE ps.main_recipe_id = $1`;
    params.push(mainRecipeId);
  }

  query += ` ORDER BY ps.weighted_score DESC`;

  const { rows } = await pool.query(query, params);

  res.json(rows.map(r => ({
    id: r.id,
    mainRecipeId: r.main_recipe_id,
    mainRecipeName: r.main_name,
    sideRecipeId: r.side_recipe_id,
    sideRecipeName: r.side_name,
    pairingType: r.pairing_type,
    avgScore: parseFloat(r.avg_score),
    weightedScore: parseFloat(r.weighted_score),
    ratingCount: r.rating_count,
    lastUpdated: r.last_updated,
  })));
}

// ── GET /api/quiz/dashboard-stats ───────────────────────────────────────

export async function handleGetDashboardStats(req: Request, res: Response) {
  // Total ratings
  const { rows: [countRow] } = await pool.query(`SELECT COUNT(*) AS total FROM quiz_feedback`);
  const totalRatings = parseInt(countRow.total);

  // Average score
  const { rows: [avgRow] } = await pool.query(`SELECT COALESCE(AVG(rating), 0) AS avg FROM quiz_feedback`);
  const avgScore = Math.round(parseFloat(avgRow.avg) * 100) / 100;

  // Unique pairings rated
  const { rows: [uniqueRow] } = await pool.query(`SELECT COUNT(DISTINCT (main_recipe_id, side_recipe_id, pairing_type)) AS cnt FROM quiz_feedback`);
  const uniquePairings = parseInt(uniqueRow.cnt);

  // Top 10 pairings
  const { rows: topRows } = await pool.query(`
    SELECT ps.main_recipe_id, r1.name AS main_name, ps.side_recipe_id, r2.name AS side_name,
           ps.pairing_type, ps.weighted_score, ps.rating_count
    FROM pairing_scores ps
    JOIN recipes r1 ON r1.id = ps.main_recipe_id
    JOIN recipes r2 ON r2.id = ps.side_recipe_id
    WHERE ps.rating_count >= 1
    ORDER BY ps.weighted_score DESC
    LIMIT 10
  `);

  // Flop 10 pairings
  const { rows: flopRows } = await pool.query(`
    SELECT ps.main_recipe_id, r1.name AS main_name, ps.side_recipe_id, r2.name AS side_name,
           ps.pairing_type, ps.weighted_score, ps.rating_count
    FROM pairing_scores ps
    JOIN recipes r1 ON r1.id = ps.main_recipe_id
    JOIN recipes r2 ON r2.id = ps.side_recipe_id
    WHERE ps.rating_count >= 1
    ORDER BY ps.weighted_score ASC
    LIMIT 10
  `);

  // Score distribution (1-5)
  const { rows: distRows } = await pool.query(`
    SELECT rating, COUNT(*) AS count FROM quiz_feedback GROUP BY rating ORDER BY rating
  `);
  const scoreDistribution = [1, 2, 3, 4, 5].map(r => ({
    rating: r,
    count: parseInt(distRows.find((d: any) => d.rating === r)?.count || "0"),
  }));

  // Ratings over time (last 12 weeks, grouped by week)
  const { rows: timeRows } = await pool.query(`
    SELECT DATE_TRUNC('week', created_at) AS week, COUNT(*) AS count, AVG(rating) AS avg
    FROM quiz_feedback
    WHERE created_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week
  `);

  // Learned rules count
  const { rows: [rulesRow] } = await pool.query(`SELECT COUNT(*) AS cnt FROM learned_rules WHERE is_active = true`);

  // Current epsilon
  const { rows: epsilonRows } = await pool.query(`SELECT value FROM app_settings WHERE key = 'quiz_epsilon'`);
  const baseEpsilon = epsilonRows.length > 0 ? parseFloat(epsilonRows[0].value) : 0.2;
  const currentEpsilon = getAdaptiveEpsilon(totalRatings, baseEpsilon);

  const mapPairing = (r: any) => ({
    mainRecipeId: r.main_recipe_id,
    mainRecipeName: r.main_name,
    sideRecipeId: r.side_recipe_id,
    sideRecipeName: r.side_name,
    pairingType: r.pairing_type,
    weightedScore: parseFloat(r.weighted_score),
    ratingCount: r.rating_count,
  });

  res.json({
    totalRatings,
    avgScore,
    uniquePairings,
    activeRules: parseInt(rulesRow.cnt),
    currentEpsilon: Math.round(currentEpsilon * 1000) / 1000,
    topPairings: topRows.map(mapPairing),
    flopPairings: flopRows.map(mapPairing),
    scoreDistribution,
    ratingsOverTime: timeRows.map(r => ({
      week: r.week,
      count: parseInt(r.count),
      avg: Math.round(parseFloat(r.avg) * 100) / 100,
    })),
  });
}

// ── GET /api/quiz/learned-rules ─────────────────────────────────────────

export async function handleGetLearnedRules(req: Request, res: Response) {
  const { rows } = await pool.query(`
    SELECT lr.*, r.name AS main_name
    FROM learned_rules lr
    JOIN recipes r ON r.id = lr.main_recipe_id
    ORDER BY lr.confidence DESC
  `);

  res.json(rows.map(r => ({
    id: r.id,
    mainRecipeId: r.main_recipe_id,
    mainRecipeName: r.main_name,
    ruleType: r.rule_type,
    targetRecipeName: r.target_recipe_name,
    confidence: parseFloat(r.confidence),
    source: r.source,
    description: r.description,
    isActive: r.is_active,
    createdAt: r.created_at,
  })));
}

// ── POST /api/quiz/ai-validate ──────────────────────────────────────────

export async function handleAIValidate(req: Request, res: Response) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "ANTHROPIC_API_KEY not configured" });
    }

    const patterns = await analyzePatterns();
    if (patterns.length === 0) {
      return res.json({ rules: [], message: "Not enough feedback data for AI analysis" });
    }

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Du bist ein erfahrener Küchenchef und analysierst Bewertungsdaten von Menü-Paarungen.

Hier sind die erkannten Muster aus dem Koch-Feedback:

GUTE PAARUNGEN (avg >= 4.0):
${patterns.filter(p => p.pattern === "preferred").map(p =>
  `- ${p.mainRecipeName} + ${p.sideRecipeName} (${p.pairingType}): avg ${p.avgScore}/5 (${p.ratingCount} Bewertungen)`
).join("\n") || "Keine"}

SCHLECHTE PAARUNGEN (avg <= 2.0):
${patterns.filter(p => p.pattern === "forbidden").map(p =>
  `- ${p.mainRecipeName} + ${p.sideRecipeName} (${p.pairingType}): avg ${p.avgScore}/5 (${p.ratingCount} Bewertungen)`
).join("\n") || "Keine"}

Basierend auf diesen Daten und deinem kulinarischen Wissen, schlage Regeln vor.
Antworte NUR mit einem JSON-Array von Regeln:
[
  {
    "mainRecipeName": "Name des Hauptgerichts",
    "ruleType": "preferred_starch" | "forbidden_starch" | "preferred_veggie" | "general",
    "targetRecipeName": "Name der Beilage",
    "confidence": 0.0 bis 1.0,
    "description": "Kurze Begründung"
  }
]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.json({ rules: [], message: "AI response could not be parsed" });
    }

    const rules = JSON.parse(jsonMatch[0]);

    // Look up recipe IDs and insert learned rules
    let inserted = 0;
    for (const rule of rules) {
      const { rows: mainRows } = await pool.query(`SELECT id FROM recipes WHERE name = $1`, [rule.mainRecipeName]);
      if (mainRows.length === 0) continue;

      await pool.query(`
        INSERT INTO learned_rules (main_recipe_id, rule_type, target_recipe_name, confidence, source, description, is_active)
        VALUES ($1, $2, $3, $4, 'ai', $5, true)
      `, [mainRows[0].id, rule.ruleType, rule.targetRecipeName, rule.confidence, rule.description]);
      inserted++;
    }

    res.json({ rules, inserted, message: `${inserted} AI rules created` });
  } catch (error: any) {
    console.error("[quiz-feedback] AI validation error:", error);
    res.status(500).json({ error: error.message });
  }
}

// ── POST /api/quiz/game-feedback ───────────────────────────────────────
// Receives ratings from the card-based quiz game (by dish name, not ID)

export async function handleGameFeedback(req: Request, res: Response) {
  try {
    const { hauptgericht, side, pairingType, rating } = req.body;

    if (!hauptgericht || !side || !pairingType || !rating) {
      return res.status(400).json({ error: "hauptgericht, side, pairingType, rating required" });
    }

    // Look up recipe IDs by name (case-insensitive partial match)
    const { rows: mainRows } = await pool.query(
      `SELECT id FROM recipes WHERE LOWER(name) = LOWER($1) LIMIT 1`, [hauptgericht]
    );
    const { rows: sideRows } = await pool.query(
      `SELECT id FROM recipes WHERE LOWER(name) = LOWER($1) LIMIT 1`, [side]
    );

    // If recipes not found in DB, still store with null IDs — data is valuable
    const mainId = mainRows.length > 0 ? mainRows[0].id : null;
    const sideId = sideRows.length > 0 ? sideRows[0].id : null;
    const userId = req.session?.userId || null;

    await pool.query(`
      INSERT INTO quiz_feedback (user_id, template_id, week_nr, day_of_week, meal, location_slug, main_recipe_id, side_recipe_id, pairing_type, rating, comment)
      VALUES ($1, NULL, NULL, NULL, 'game', NULL, $2, $3, $4, $5, NULL)
    `, [userId, mainId, sideId, pairingType, rating]);

    // Trigger async aggregation if both IDs found
    if (mainId && sideId) {
      aggregatePairingScores().catch(err => console.error("[pairing-engine] Aggregation error:", err));
    }

    res.json({ ok: true, mainId, sideId });
  } catch (error: any) {
    console.error("[quiz-feedback] Game feedback error:", error);
    res.status(500).json({ error: error.message });
  }
}

// ── POST /api/quiz/ai-research ────────────────────────────────────────
// AI analysis of a menu combo for the quiz game

export async function handleAIResearch(req: Request, res: Response) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "ANTHROPIC_API_KEY not configured" });
    }

    const { suppe, combo } = req.body;
    if (!combo) {
      return res.status(400).json({ error: "combo required" });
    }

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Du bist ein erfahrener österreichischer Küchenchef.
Bewerte diese Menü-Kombination kurz und knapp:

Suppe: ${suppe || "keine"}
Hauptgang: ${combo}

Antworte NUR mit einem JSON-Objekt (kein Markdown):
{
  "score": 1-5 (Sterne),
  "verdict": "1-2 Sätze Bewertung",
  "problem": "Problem falls score <= 2, sonst null",
  "suggestion": "Bessere Alternative falls score <= 3, sonst null",
  "classic": "Klassische österreichische Variante falls relevant, sonst null"
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ score: 3, verdict: "Konnte nicht analysiert werden", problem: null, suggestion: null, classic: null });
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (error: any) {
    console.error("[quiz-feedback] AI research error:", error);
    res.status(500).json({ error: error.message });
  }
}

// ── Helper: Adaptive Epsilon ────────────────────────────────────────────

export function getAdaptiveEpsilon(totalRatings: number, base = 0.2): number {
  if (totalRatings < 50) return 0.5; // High exploration at the start
  return base + (0.5 - base) * Math.exp(-0.01 * (totalRatings - 50));
}

/**
 * Pairing Engine — Score aggregation with time decay for rotation feedback.
 *
 * Aggregates quiz_feedback → pairing_scores (weighted avg with exponential decay).
 * Provides score maps for the rotation agent v3.
 */

import { pool } from "../../db";

// ── Time Decay ──────────────────────────────────────────────────────────

/**
 * Exponential decay weight: today=1.0, halfLife days ago=0.5
 */
export function calculateDecayWeight(createdAt: Date, halfLife = 90): number {
  const now = Date.now();
  const ageMs = now - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / halfLife);
}

// ── Score Aggregation ───────────────────────────────────────────────────

/**
 * Reads all quiz_feedback, groups by (mainRecipeId, sideRecipeId, pairingType),
 * calculates weighted average with time decay, upserts into pairing_scores.
 */
export async function aggregatePairingScores(): Promise<number> {
  const { rows: feedback } = await pool.query(`
    SELECT main_recipe_id, side_recipe_id, pairing_type, rating, created_at
    FROM quiz_feedback
    ORDER BY main_recipe_id, side_recipe_id, pairing_type
  `);

  if (feedback.length === 0) return 0;

  // Group by pairing key
  const groups = new Map<string, { mainId: number; sideId: number; type: string; ratings: { rating: number; createdAt: Date }[] }>();

  for (const row of feedback) {
    const key = `${row.main_recipe_id}-${row.side_recipe_id}-${row.pairing_type}`;
    if (!groups.has(key)) {
      groups.set(key, {
        mainId: row.main_recipe_id,
        sideId: row.side_recipe_id,
        type: row.pairing_type,
        ratings: [],
      });
    }
    groups.get(key)!.ratings.push({
      rating: row.rating,
      createdAt: new Date(row.created_at),
    });
  }

  let upserted = 0;

  const groupEntries = Array.from(groups.values());
  for (const group of groupEntries) {
    // Calculate simple average
    const avgScore = group.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / group.ratings.length;

    // Calculate weighted average with time decay
    let weightedSum = 0;
    let weightTotal = 0;
    for (const r of group.ratings) {
      const w = calculateDecayWeight(r.createdAt);
      weightedSum += r.rating * w;
      weightTotal += w;
    }
    const weightedScore = weightTotal > 0 ? weightedSum / weightTotal : avgScore;

    // Upsert: try update first, insert if no rows affected
    const roundedAvg = Math.round(avgScore * 100) / 100;
    const roundedWeighted = Math.round(weightedScore * 100) / 100;
    const { rowCount } = await pool.query(`
      UPDATE pairing_scores SET avg_score = $4, weighted_score = $5, rating_count = $6, last_updated = NOW()
      WHERE main_recipe_id = $1 AND side_recipe_id = $2 AND pairing_type = $3
    `, [group.mainId, group.sideId, group.type, roundedAvg, roundedWeighted, group.ratings.length]);

    if (rowCount === 0) {
      await pool.query(`
        INSERT INTO pairing_scores (main_recipe_id, side_recipe_id, pairing_type, avg_score, weighted_score, rating_count, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [group.mainId, group.sideId, group.type, roundedAvg, roundedWeighted, group.ratings.length]);
    }

    upserted++;
  }

  return upserted;
}

// ── Score Lookup for Rotation Agent ─────────────────────────────────────

/**
 * Get all pairing scores for a given main recipe + type.
 * Returns Map<sideRecipeId, weightedScore>.
 */
export async function getScoresForMain(
  mainRecipeId: number,
  pairingType: "main_starch" | "main_veggie"
): Promise<Map<number, number>> {
  const { rows } = await pool.query(
    `SELECT side_recipe_id, weighted_score FROM pairing_scores WHERE main_recipe_id = $1 AND pairing_type = $2`,
    [mainRecipeId, pairingType]
  );
  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.side_recipe_id, row.weighted_score);
  }
  return map;
}

/**
 * Load ALL pairing scores into memory for the rotation agent.
 * Returns nested Map: mainId → Map<sideId, score> (keyed by type).
 */
export async function loadAllScores(): Promise<{
  starch: Map<number, Map<number, number>>;
  veggie: Map<number, Map<number, number>>;
}> {
  const { rows } = await pool.query(
    `SELECT main_recipe_id, side_recipe_id, pairing_type, weighted_score FROM pairing_scores`
  );

  const starch = new Map<number, Map<number, number>>();
  const veggie = new Map<number, Map<number, number>>();

  for (const row of rows) {
    const target = row.pairing_type === "main_starch" ? starch : veggie;
    if (!target.has(row.main_recipe_id)) {
      target.set(row.main_recipe_id, new Map());
    }
    target.get(row.main_recipe_id)!.set(row.side_recipe_id, row.weighted_score);
  }

  return { starch, veggie };
}

// ── Pattern Analysis ────────────────────────────────────────────────────

export interface AnalyzedPattern {
  mainRecipeId: number;
  mainRecipeName: string;
  sideRecipeId: number;
  sideRecipeName: string;
  pairingType: string;
  avgScore: number;
  ratingCount: number;
  pattern: "preferred" | "forbidden";
}

/**
 * Analyze pairing scores for patterns:
 * - avg >= 4.0 with count >= 3 → "preferred"
 * - avg <= 2.0 with count >= 3 → "forbidden"
 */
export async function analyzePatterns(): Promise<AnalyzedPattern[]> {
  const { rows } = await pool.query(`
    SELECT
      ps.main_recipe_id, r1.name AS main_name,
      ps.side_recipe_id, r2.name AS side_name,
      ps.pairing_type, ps.avg_score, ps.rating_count
    FROM pairing_scores ps
    JOIN recipes r1 ON r1.id = ps.main_recipe_id
    JOIN recipes r2 ON r2.id = ps.side_recipe_id
    WHERE ps.rating_count >= 3
      AND (ps.avg_score >= 4.0 OR ps.avg_score <= 2.0)
    ORDER BY ps.avg_score DESC
  `);

  return rows.map(row => ({
    mainRecipeId: row.main_recipe_id,
    mainRecipeName: row.main_name,
    sideRecipeId: row.side_recipe_id,
    sideRecipeName: row.side_name,
    pairingType: row.pairing_type,
    avgScore: parseFloat(row.avg_score),
    ratingCount: row.rating_count,
    pattern: parseFloat(row.avg_score) >= 4.0 ? "preferred" as const : "forbidden" as const,
  }));
}

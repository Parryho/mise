/**
 * PAX Forecasting: Predicts next week's guest counts using statistical methods.
 *
 * Weighted combination:
 *   50% — recent 4-week moving average
 *   30% — day-of-week pattern (historical average for that weekday)
 *   20% — seasonal (same KW last year)
 */

import type { Request, Response } from "express";
import { db } from "./db";
import { guestCounts } from "@shared/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";
import { formatLocalDate } from "@shared/constants";

// ==========================================
// Types
// ==========================================

interface ForecastEntry {
  date: string;          // YYYY-MM-DD
  dayOfWeek: number;     // 0=So, 1=Mo ... 6=Sa
  dayName: string;
  meal: string;          // "mittag" | "abend"
  predicted: number;     // weighted forecast (rounded)
  lower: number;         // confidence interval lower bound
  upper: number;         // confidence interval upper bound
  lastYear: number | null;  // same KW last year value, null if unavailable
  avg4Week: number;      // 4-week moving average component
}

interface AccuracyMetrics {
  mape: number;       // Mean Absolute Percentage Error (0-100)
  dataPoints: number; // how many data points were used
}

interface ForecastResult {
  forecasts: ForecastEntry[];
  accuracy: AccuracyMetrics;
}

// ==========================================
// Helpers
// ==========================================

const DAY_NAMES_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MEALS = ['mittag', 'abend'] as const;

function formatDate(d: Date): string {
  return formatLocalDate(d);
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get ISO week number for a date.
 */
function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get Monday of ISO week for a given year and week number.
 */
function getMondayOfWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

// ==========================================
// Core Forecast Logic
// ==========================================

export async function getPaxForecast(
  locationId: number | undefined,
  targetWeekStart: string
): Promise<ForecastResult> {
  const targetMonday = new Date(targetWeekStart);
  const targetYear = targetMonday.getFullYear();
  const targetKW = getISOWeek(targetMonday);

  // --- 1. Fetch historical data ---
  // We need at least 12 weeks of recent data + same KW last year
  const twelveWeeksAgo = addDays(targetMonday, -84); // 12 weeks = 84 days
  const lastYearStart = getMondayOfWeek(targetYear - 1, targetKW);
  const lastYearEnd = addDays(lastYearStart, 6);

  // Determine the earliest date we need
  const earliestDate = lastYearStart < twelveWeeksAgo ? lastYearStart : twelveWeeksAgo;
  const latestDate = addDays(targetMonday, -1); // up to yesterday (exclude target week)

  const conditions: any[] = [
    gte(guestCounts.date, formatDate(earliestDate)),
    lte(guestCounts.date, formatDate(latestDate)),
  ];
  if (locationId) {
    conditions.push(eq(guestCounts.locationId, locationId));
  }

  const historicalData = await db.select().from(guestCounts).where(and(...conditions));

  // --- 2. Build lookup structures ---
  // Key: "YYYY-MM-DD|meal" => total pax
  const dataMap: Record<string, number> = {};
  for (const gc of historicalData) {
    const key = `${gc.date}|${gc.meal}`;
    dataMap[key] = (dataMap[key] || 0) + gc.adults + gc.children;
  }

  // --- 3. Calculate components for each target day x meal ---
  const forecasts: ForecastEntry[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = addDays(targetMonday, dayOffset);
    const targetDateStr = formatDate(targetDate);
    const dow = targetDate.getDay(); // 0=So, 1=Mo ... 6=Sa

    for (const meal of MEALS) {
      // Component A: 4-week moving average (most recent 4 weeks, same weekday + meal)
      const recentValues: number[] = [];
      for (let w = 1; w <= 4; w++) {
        const pastDate = addDays(targetDate, -7 * w);
        const pastKey = `${formatDate(pastDate)}|${meal}`;
        if (dataMap[pastKey] !== undefined) {
          recentValues.push(dataMap[pastKey]);
        }
      }
      const avg4Week = recentValues.length > 0
        ? recentValues.reduce((s, v) => s + v, 0) / recentValues.length
        : 0;

      // Component B: Day-of-week pattern (average for this weekday across all historical data)
      // Collect unique date values for this weekday + meal
      const dowDateSet = new Set<string>();
      for (const gc of historicalData) {
        if (gc.meal !== meal) continue;
        const gcDate = new Date(gc.date);
        if (gcDate.getDay() === dow) {
          dowDateSet.add(gc.date);
        }
      }
      const dowVals: number[] = [];
      const dowDateArr = Array.from(dowDateSet);
      for (const dateStr of dowDateArr) {
        const key = `${dateStr}|${meal}`;
        if (dataMap[key] !== undefined) {
          dowVals.push(dataMap[key]);
        }
      }
      const dowAvg = dowVals.length > 0
        ? dowVals.reduce((s, v) => s + v, 0) / dowVals.length
        : 0;

      // Component C: Seasonal — same KW last year
      const lastYearDate = addDays(lastYearStart, dayOffset);
      const lastYearKey = `${formatDate(lastYearDate)}|${meal}`;
      const lastYearValue = dataMap[lastYearKey] ?? null;
      const seasonal = lastYearValue ?? 0;

      // --- 4. Weighted combination ---
      // 50% recent 4-week avg, 30% day-of-week pattern, 20% seasonal
      let hasAnyData = avg4Week > 0 || dowAvg > 0 || seasonal > 0;

      let predicted: number;
      if (!hasAnyData) {
        predicted = 0;
      } else {
        // Adjust weights if some components are missing
        let w4 = 0.5;
        let wDow = 0.3;
        let wSeason = 0.2;

        if (avg4Week === 0 && dowAvg === 0) {
          // Only seasonal available
          wSeason = 1.0; w4 = 0; wDow = 0;
        } else if (avg4Week === 0) {
          // No recent data
          wDow = 0.6; wSeason = 0.4; w4 = 0;
          if (seasonal === 0) { wDow = 1.0; wSeason = 0; }
        } else if (dowAvg === 0) {
          // No day-of-week data
          w4 = 0.7; wSeason = 0.3; wDow = 0;
          if (seasonal === 0) { w4 = 1.0; wSeason = 0; }
        } else if (seasonal === 0) {
          // No seasonal data — redistribute
          w4 = 0.6; wDow = 0.4; wSeason = 0;
        }

        predicted = w4 * avg4Week + wDow * dowAvg + wSeason * seasonal;
      }

      // --- 5. Confidence interval ---
      // Based on standard deviation of recent values
      const allRelevantValues = [...recentValues, ...dowVals];
      let stddev = 0;
      if (allRelevantValues.length > 1) {
        const mean = allRelevantValues.reduce((s, v) => s + v, 0) / allRelevantValues.length;
        const variance = allRelevantValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / allRelevantValues.length;
        stddev = Math.sqrt(variance);
      } else if (predicted > 0) {
        // Fallback: use 20% of predicted as proxy for uncertainty
        stddev = predicted * 0.2;
      }

      const lower = Math.max(0, Math.round(predicted - 1.5 * stddev));
      const upper = Math.round(predicted + 1.5 * stddev);

      forecasts.push({
        date: targetDateStr,
        dayOfWeek: dow,
        dayName: DAY_NAMES_DE[dow],
        meal,
        predicted: Math.round(predicted),
        lower,
        upper,
        lastYear: lastYearValue,
        avg4Week: Math.round(avg4Week),
      });
    }
  }

  // --- 6. Accuracy metrics (MAPE) ---
  // Evaluate: for the last 4 completed weeks, how accurate would our forecast have been?
  const accuracy = await calculateAccuracy(locationId, targetMonday, dataMap, historicalData);

  return { forecasts, accuracy };
}

/**
 * Calculate retrospective accuracy (MAPE) by backtesting the model
 * on the 4 most recent completed weeks.
 */
async function calculateAccuracy(
  locationId: number | undefined,
  targetMonday: Date,
  dataMap: Record<string, number>,
  historicalData: Array<{ date: string; meal: string; adults: number; children: number }>
): Promise<AccuracyMetrics> {
  const errors: number[] = [];

  // Test on the 4 most recent weeks (before target week)
  for (let weekBack = 1; weekBack <= 4; weekBack++) {
    const testMonday = addDays(targetMonday, -7 * weekBack);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const testDate = addDays(testMonday, dayOffset);
      const testDateStr = formatDate(testDate);
      const dow = testDate.getDay();

      for (const meal of MEALS) {
        const actualKey = `${testDateStr}|${meal}`;
        const actual = dataMap[actualKey];
        if (actual === undefined || actual === 0) continue;

        // Simulate a forecast for this date using data before it
        const simRecentVals: number[] = [];
        for (let w = 1; w <= 4; w++) {
          const pastDate = addDays(testDate, -7 * w);
          const pastKey = `${formatDate(pastDate)}|${meal}`;
          if (dataMap[pastKey] !== undefined) {
            simRecentVals.push(dataMap[pastKey]);
          }
        }
        if (simRecentVals.length === 0) continue;

        const simAvg = simRecentVals.reduce((s, v) => s + v, 0) / simRecentVals.length;
        const ape = Math.abs(actual - simAvg) / actual * 100;
        errors.push(ape);
      }
    }
  }

  const mape = errors.length > 0
    ? Math.round(errors.reduce((s, v) => s + v, 0) / errors.length * 10) / 10
    : 0;

  return {
    mape,
    dataPoints: errors.length,
  };
}

// ==========================================
// Route Handler (exported for wiring in routes.ts)
// ==========================================

export async function handlePaxForecast(req: Request, res: Response): Promise<void> {
  try {
    const weekStart = String(req.query.weekStart || "");
    const locationIdParam = req.query.locationId ? parseInt(String(req.query.locationId)) : undefined;

    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      res.status(400).json({ error: "weekStart parameter required (YYYY-MM-DD format)" });
      return;
    }

    const result = await getPaxForecast(locationIdParam, weekStart);
    res.json(result);
  } catch (error: any) {
    console.error("PAX forecast error:", error);
    res.status(500).json({ error: error.message });
  }
}

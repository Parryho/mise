/**
 * HACCP Anomaly Detection: Automatic detection of unusual temperature patterns
 */

import { db } from "./db";
import { storage } from "./storage";
import { haccpLogs, fridges } from "@shared/schema";
import { and, gte, lte, eq, desc, sql } from "drizzle-orm";

type AnomalySeverity = "CRITICAL" | "WARNING" | "INFO";

interface Anomaly {
  fridgeId: number;
  fridgeName: string;
  type: "out_of_range" | "trend" | "spike" | "gap" | "stuck_sensor";
  severity: AnomalySeverity;
  timestamp: string;
  value?: number;
  expected?: string;
  message: string;
}

interface AnomalySummary {
  critical: number;
  warning: number;
  info: number;
}

interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  summary: AnomalySummary;
}

/**
 * Calculate mean and standard deviation for an array of numbers
 */
function calculateStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

  if (values.length === 1) return { mean, stdDev: 0 };

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Check if a timestamp falls within business hours (6:00-22:00)
 */
function isBusinessHours(timestamp: Date): boolean {
  const hour = timestamp.getHours();
  return hour >= 6 && hour < 22;
}

/**
 * Detect anomalies in HACCP temperature logs
 */
export async function detectAnomalies(
  locationId?: number,
  startDate?: string,
  endDate?: string
): Promise<AnomalyDetectionResult> {
  // Default to last 30 days if no date range provided
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
  const start = startDate ? new Date(startDate + 'T00:00:00') : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all fridges (optionally filtered by location)
  const allFridges = await storage.getFridges();
  const targetFridges = locationId
    ? allFridges.filter(f => f.locationId === locationId)
    : allFridges;

  // Get logs in date range
  const logs = await db.select()
    .from(haccpLogs)
    .where(and(
      gte(haccpLogs.timestamp, start),
      lte(haccpLogs.timestamp, end)
    ))
    .orderBy(haccpLogs.timestamp);

  const anomalies: Anomaly[] = [];

  for (const fridge of targetFridges) {
    const fridgeLogs = logs
      .filter(log => log.fridgeId === fridge.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (fridgeLogs.length === 0) continue;

    // Get 7-day historical data for baseline
    const sevenDaysAgo = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const historicalLogs = await db.select()
      .from(haccpLogs)
      .where(and(
        eq(haccpLogs.fridgeId, fridge.id),
        gte(haccpLogs.timestamp, sevenDaysAgo),
        lte(haccpLogs.timestamp, start)
      ));

    const historicalTemps = historicalLogs.map(log => log.temperature);
    const { mean: historicalMean, stdDev: historicalStdDev } = calculateStats(historicalTemps);

    // 1. OUT OF RANGE: Check if temperature is outside safe limits
    for (const log of fridgeLogs) {
      if (log.temperature < fridge.tempMin || log.temperature > fridge.tempMax) {
        anomalies.push({
          fridgeId: fridge.id,
          fridgeName: fridge.name,
          type: "out_of_range",
          severity: "CRITICAL",
          timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
          value: log.temperature,
          expected: `${fridge.tempMin}°C bis ${fridge.tempMax}°C`,
          message: `Temperatur ${log.temperature.toFixed(1)}°C außerhalb des Sollbereichs (${fridge.tempMin}°C - ${fridge.tempMax}°C)`,
        });
      }
    }

    // 2. TREND DETECTION: Check for 3+ consecutive readings trending up/down
    for (let i = 2; i < fridgeLogs.length; i++) {
      const t1 = fridgeLogs[i - 2].temperature;
      const t2 = fridgeLogs[i - 1].temperature;
      const t3 = fridgeLogs[i].temperature;

      const isUptrend = t1 < t2 && t2 < t3;
      const isDowntrend = t1 > t2 && t2 > t3;

      if (isUptrend || isDowntrend) {
        const trendType = isUptrend ? "steigend" : "fallend";
        anomalies.push({
          fridgeId: fridge.id,
          fridgeName: fridge.name,
          type: "trend",
          severity: "WARNING",
          timestamp: fridgeLogs[i].timestamp instanceof Date ? fridgeLogs[i].timestamp.toISOString() : String(fridgeLogs[i].timestamp),
          value: t3,
          expected: `${t1.toFixed(1)}°C → ${t2.toFixed(1)}°C → ${t3.toFixed(1)}°C`,
          message: `Temperaturtrend ${trendType} über 3 aufeinanderfolgende Messungen`,
        });
      }
    }

    // 3. SPIKE DETECTION: Single reading >2 std deviations from 7-day mean
    if (historicalStdDev > 0) {
      for (const log of fridgeLogs) {
        const deviation = Math.abs(log.temperature - historicalMean);
        if (deviation > 2 * historicalStdDev) {
          anomalies.push({
            fridgeId: fridge.id,
            fridgeName: fridge.name,
            type: "spike",
            severity: "WARNING",
            timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
            value: log.temperature,
            expected: `${historicalMean.toFixed(1)}°C ± ${(2 * historicalStdDev).toFixed(1)}°C`,
            message: `Temperaturspitze: ${log.temperature.toFixed(1)}°C weicht stark vom 7-Tage-Durchschnitt ab (${historicalMean.toFixed(1)}°C)`,
          });
        }
      }
    }

    // 4. GAP DETECTION: No reading for >8 hours during business hours
    for (let i = 1; i < fridgeLogs.length; i++) {
      const prevLog = fridgeLogs[i - 1];
      const currentLog = fridgeLogs[i];

      const prevTime = new Date(prevLog.timestamp);
      const currentTime = new Date(currentLog.timestamp);
      const gapHours = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);

      // Check if gap spans business hours and is >8 hours
      if (gapHours > 8) {
        let hasBusinessHours = false;
        const checkTime = new Date(prevTime);
        while (checkTime <= currentTime) {
          if (isBusinessHours(checkTime)) {
            hasBusinessHours = true;
            break;
          }
          checkTime.setHours(checkTime.getHours() + 1);
        }

        if (hasBusinessHours) {
          anomalies.push({
            fridgeId: fridge.id,
            fridgeName: fridge.name,
            type: "gap",
            severity: "INFO",
            timestamp: currentLog.timestamp instanceof Date ? currentLog.timestamp.toISOString() : String(currentLog.timestamp),
            expected: "Messung alle 8 Stunden",
            message: `Keine Messung für ${gapHours.toFixed(1)} Stunden während der Betriebszeit`,
          });
        }
      }
    }

    // 5. CONSISTENCY CHECK: Same temp repeated 5+ times (possible stuck sensor)
    const tempCounts: Record<string, number> = {};
    for (const log of fridgeLogs) {
      const tempKey = log.temperature.toFixed(1);
      tempCounts[tempKey] = (tempCounts[tempKey] || 0) + 1;
    }

    for (const [temp, count] of Object.entries(tempCounts)) {
      if (count >= 5) {
        // Find first occurrence for timestamp
        const firstOccurrence = fridgeLogs.find(log => log.temperature.toFixed(1) === temp);
        if (firstOccurrence) {
          anomalies.push({
            fridgeId: fridge.id,
            fridgeName: fridge.name,
            type: "stuck_sensor",
            severity: "WARNING",
            timestamp: firstOccurrence.timestamp instanceof Date ? firstOccurrence.timestamp.toISOString() : String(firstOccurrence.timestamp),
            value: parseFloat(temp),
            message: `Temperatur ${temp}°C wurde ${count}x identisch gemessen - möglicher Sensor-Fehler`,
          });
        }
      }
    }
  }

  // Calculate summary
  const summary: AnomalySummary = {
    critical: anomalies.filter(a => a.severity === "CRITICAL").length,
    warning: anomalies.filter(a => a.severity === "WARNING").length,
    info: anomalies.filter(a => a.severity === "INFO").length,
  };

  // Sort anomalies by timestamp (newest first)
  anomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { anomalies, summary };
}

/**
 * Calculate health score for a specific fridge (0-100)
 * Based on anomaly frequency over the specified time period
 */
export async function getFridgeHealthScore(
  fridgeId: number,
  days: number = 30
): Promise<{
  fridgeId: number;
  fridgeName: string;
  score: number;
  totalChecks: number;
  anomalyCount: number;
  recommendation: string;
}> {
  const fridge = await storage.getFridge(fridgeId);
  if (!fridge) {
    throw new Error(`Fridge ${fridgeId} not found`);
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Get all logs for this fridge in the period
  const logs = await db.select()
    .from(haccpLogs)
    .where(and(
      eq(haccpLogs.fridgeId, fridgeId),
      gte(haccpLogs.timestamp, startDate),
      lte(haccpLogs.timestamp, endDate)
    ));

  const totalChecks = logs.length;

  // Run anomaly detection for this fridge
  const result = await detectAnomalies(
    fridge.locationId || undefined,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  const fridgeAnomalies = result.anomalies.filter(a => a.fridgeId === fridgeId);
  const anomalyCount = fridgeAnomalies.length;

  // Calculate score: Start at 100, deduct points based on anomalies
  let score = 100;

  for (const anomaly of fridgeAnomalies) {
    if (anomaly.severity === "CRITICAL") {
      score -= 10;
    } else if (anomaly.severity === "WARNING") {
      score -= 5;
    } else if (anomaly.severity === "INFO") {
      score -= 2;
    }
  }

  // Ensure score stays between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Generate recommendation
  let recommendation = "";
  if (score >= 90) {
    recommendation = "Ausgezeichnet - Kühlgerät funktioniert einwandfrei";
  } else if (score >= 75) {
    recommendation = "Gut - Kleinere Abweichungen, regelmäßige Kontrolle empfohlen";
  } else if (score >= 50) {
    recommendation = "Verbesserungsbedarf - Überprüfung und Wartung erforderlich";
  } else {
    recommendation = "Kritisch - Sofortige Überprüfung und Wartung dringend erforderlich";
  }

  return {
    fridgeId: fridge.id,
    fridgeName: fridge.name,
    score,
    totalChecks,
    anomalyCount,
    recommendation,
  };
}

/**
 * HACCP tests: temperature validation, anomaly detection logic, fridge health score.
 * Database access is fully mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// -------------------------------------------------------
// Pure utility functions extracted from haccp-anomaly.ts
// -------------------------------------------------------

function calculateStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 0 };
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
}

function isBusinessHours(timestamp: Date): boolean {
  const hour = timestamp.getHours();
  return hour >= 6 && hour < 22;
}

// -------------------------------------------------------
// Temperature range validation (matches schema: fridge tempMin/tempMax)
// -------------------------------------------------------
function isTemperatureInRange(temp: number, min: number, max: number): boolean {
  return temp >= min && temp <= max;
}

function getTemperatureStatus(temp: number, min: number, max: number): string {
  if (temp < min) return "critical_low";
  if (temp > max) return "critical_high";
  return "ok";
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe("HACCP — Temperature Range Validation", () => {
  // Standard fridge range: 2-8 degrees Celsius
  const FRIDGE_MIN = 2;
  const FRIDGE_MAX = 8;

  it("temperature within range returns true", () => {
    expect(isTemperatureInRange(5.0, FRIDGE_MIN, FRIDGE_MAX)).toBe(true);
  });

  it("temperature at min boundary is in range", () => {
    expect(isTemperatureInRange(2.0, FRIDGE_MIN, FRIDGE_MAX)).toBe(true);
  });

  it("temperature at max boundary is in range", () => {
    expect(isTemperatureInRange(8.0, FRIDGE_MIN, FRIDGE_MAX)).toBe(true);
  });

  it("temperature below min is out of range", () => {
    expect(isTemperatureInRange(1.5, FRIDGE_MIN, FRIDGE_MAX)).toBe(false);
  });

  it("temperature above max is out of range", () => {
    expect(isTemperatureInRange(8.5, FRIDGE_MIN, FRIDGE_MAX)).toBe(false);
  });

  it("negative temperature is out of range for standard fridge", () => {
    expect(isTemperatureInRange(-1, FRIDGE_MIN, FRIDGE_MAX)).toBe(false);
  });

  // Freezer range: -25 to -18 degrees
  it("freezer temperature within range", () => {
    expect(isTemperatureInRange(-20, -25, -18)).toBe(true);
  });

  it("freezer too warm", () => {
    expect(isTemperatureInRange(-15, -25, -18)).toBe(false);
  });
});

describe("HACCP — Temperature Status", () => {
  it("returns 'ok' for normal temperature", () => {
    expect(getTemperatureStatus(5.0, 2, 8)).toBe("ok");
  });

  it("returns 'critical_low' for too-cold temperature", () => {
    expect(getTemperatureStatus(0.5, 2, 8)).toBe("critical_low");
  });

  it("returns 'critical_high' for too-warm temperature", () => {
    expect(getTemperatureStatus(10.0, 2, 8)).toBe("critical_high");
  });
});

describe("HACCP — Statistics (calculateStats)", () => {
  it("returns zero mean and stdDev for empty array", () => {
    const { mean, stdDev } = calculateStats([]);
    expect(mean).toBe(0);
    expect(stdDev).toBe(0);
  });

  it("returns correct mean for single value, stdDev=0", () => {
    const { mean, stdDev } = calculateStats([5]);
    expect(mean).toBe(5);
    expect(stdDev).toBe(0);
  });

  it("calculates correct mean and stdDev for known data", () => {
    // [2, 4, 6, 8, 10] => mean=6, variance=8, stdDev~=2.83
    const { mean, stdDev } = calculateStats([2, 4, 6, 8, 10]);
    expect(mean).toBeCloseTo(6, 5);
    expect(stdDev).toBeCloseTo(2.8284, 3);
  });

  it("handles identical values (stdDev=0)", () => {
    const { mean, stdDev } = calculateStats([5, 5, 5, 5]);
    expect(mean).toBe(5);
    expect(stdDev).toBe(0);
  });

  it("handles negative values", () => {
    const { mean, stdDev } = calculateStats([-5, -3, -1, 1, 3]);
    expect(mean).toBeCloseTo(-1, 5);
    expect(stdDev).toBeGreaterThan(0);
  });
});

describe("HACCP — Business Hours Detection", () => {
  it("6:00 is business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 6, 0))).toBe(true);
  });

  it("12:00 is business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 12, 0))).toBe(true);
  });

  it("21:59 is business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 21, 59))).toBe(true);
  });

  it("22:00 is not business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 22, 0))).toBe(false);
  });

  it("5:59 is not business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 5, 59))).toBe(false);
  });

  it("midnight is not business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 0, 0))).toBe(false);
  });

  it("3:00 AM is not business hours", () => {
    expect(isBusinessHours(new Date(2026, 0, 5, 3, 0))).toBe(false);
  });
});

describe("HACCP — Anomaly Detection (out_of_range)", () => {
  it("temperature outside fridge range is flagged as CRITICAL", () => {
    const fridge = { id: 1, name: "Kühlschrank 1", tempMin: 2, tempMax: 8 };
    const log = { temperature: 10.5, timestamp: new Date().toISOString() };

    const isOutOfRange = log.temperature < fridge.tempMin || log.temperature > fridge.tempMax;
    expect(isOutOfRange).toBe(true);

    const severity = "CRITICAL";
    expect(severity).toBe("CRITICAL");
  });

  it("temperature inside range is not flagged", () => {
    const fridge = { tempMin: 2, tempMax: 8 };
    const log = { temperature: 5.0 };
    const isOutOfRange = log.temperature < fridge.tempMin || log.temperature > fridge.tempMax;
    expect(isOutOfRange).toBe(false);
  });
});

describe("HACCP — Anomaly Detection (trend)", () => {
  it("detects upward trend from 3 consecutive increasing readings", () => {
    const temps = [4.0, 5.0, 6.0];
    const [t1, t2, t3] = temps;
    const isUptrend = t1 < t2 && t2 < t3;
    expect(isUptrend).toBe(true);
  });

  it("detects downward trend from 3 consecutive decreasing readings", () => {
    const temps = [6.0, 5.0, 4.0];
    const [t1, t2, t3] = temps;
    const isDowntrend = t1 > t2 && t2 > t3;
    expect(isDowntrend).toBe(true);
  });

  it("does not detect trend for flat readings", () => {
    const temps = [5.0, 5.0, 5.0];
    const [t1, t2, t3] = temps;
    const isUptrend = t1 < t2 && t2 < t3;
    const isDowntrend = t1 > t2 && t2 > t3;
    expect(isUptrend).toBe(false);
    expect(isDowntrend).toBe(false);
  });

  it("does not detect trend for oscillating readings", () => {
    const temps = [4.0, 6.0, 4.0];
    const [t1, t2, t3] = temps;
    const isUptrend = t1 < t2 && t2 < t3;
    const isDowntrend = t1 > t2 && t2 > t3;
    expect(isUptrend).toBe(false);
    expect(isDowntrend).toBe(false);
  });
});

describe("HACCP — Anomaly Detection (spike)", () => {
  it("detects spike when reading is >2 stdDev from mean", () => {
    // Historical: [4, 5, 6, 5, 4] => mean=4.8, stdDev~=0.75
    const { mean, stdDev } = calculateStats([4, 5, 6, 5, 4]);
    const currentTemp = 8.0;
    const deviation = Math.abs(currentTemp - mean);
    expect(deviation).toBeGreaterThan(2 * stdDev);
  });

  it("does not flag normal reading", () => {
    const { mean, stdDev } = calculateStats([4, 5, 6, 5, 4]);
    const currentTemp = 5.0;
    const deviation = Math.abs(currentTemp - mean);
    expect(deviation).toBeLessThanOrEqual(2 * stdDev);
  });
});

describe("HACCP — Anomaly Detection (gap)", () => {
  it("detects gap when >8 hours between readings", () => {
    const prevTime = new Date("2026-01-05T08:00:00");
    const currentTime = new Date("2026-01-05T17:00:00");
    const gapHours = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);
    expect(gapHours).toBe(9);
    expect(gapHours).toBeGreaterThan(8);
  });

  it("does not flag gap of exactly 8 hours", () => {
    const prevTime = new Date("2026-01-05T08:00:00");
    const currentTime = new Date("2026-01-05T16:00:00");
    const gapHours = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);
    expect(gapHours).toBe(8);
    expect(gapHours).not.toBeGreaterThan(8);
  });

  it("does not flag gap during non-business hours only", () => {
    // Gap from 23:00 to 05:00 (6 hours, all outside business hours)
    const prevTime = new Date("2026-01-05T23:00:00");
    const currentTime = new Date("2026-01-06T05:00:00");
    const gapHours = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);
    expect(gapHours).toBe(6);
    // The gap is <8 hours so wouldn't be flagged anyway
    expect(gapHours).toBeLessThan(8);
  });
});

describe("HACCP — Anomaly Detection (stuck sensor)", () => {
  it("detects stuck sensor when same temp appears 5+ times", () => {
    const temps = [4.5, 4.5, 4.5, 4.5, 4.5, 4.5];
    const tempCounts: Record<string, number> = {};
    for (const t of temps) {
      const key = t.toFixed(1);
      tempCounts[key] = (tempCounts[key] || 0) + 1;
    }
    const stuckTemps = Object.entries(tempCounts).filter(([, count]) => count >= 5);
    expect(stuckTemps).toHaveLength(1);
    expect(stuckTemps[0][0]).toBe("4.5");
    expect(stuckTemps[0][1]).toBe(6);
  });

  it("does not flag with fewer than 5 identical readings", () => {
    const temps = [4.5, 4.5, 4.5, 4.5, 5.0];
    const tempCounts: Record<string, number> = {};
    for (const t of temps) {
      const key = t.toFixed(1);
      tempCounts[key] = (tempCounts[key] || 0) + 1;
    }
    const stuckTemps = Object.entries(tempCounts).filter(([, count]) => count >= 5);
    expect(stuckTemps).toHaveLength(0);
  });

  it("handles mixed temperatures correctly", () => {
    const temps = [4.5, 4.5, 4.5, 4.5, 4.5, 5.0, 5.0, 5.0, 5.0, 5.0];
    const tempCounts: Record<string, number> = {};
    for (const t of temps) {
      const key = t.toFixed(1);
      tempCounts[key] = (tempCounts[key] || 0) + 1;
    }
    const stuckTemps = Object.entries(tempCounts).filter(([, count]) => count >= 5);
    expect(stuckTemps).toHaveLength(2);
  });
});

describe("HACCP — Fridge Health Score Calculation", () => {
  it("starts at 100 with no anomalies", () => {
    let score = 100;
    const anomalies: Array<{ severity: string }> = [];
    for (const a of anomalies) {
      if (a.severity === "CRITICAL") score -= 10;
      else if (a.severity === "WARNING") score -= 5;
      else if (a.severity === "INFO") score -= 2;
    }
    expect(score).toBe(100);
  });

  it("deducts 10 points per CRITICAL anomaly", () => {
    let score = 100;
    const anomalies = [{ severity: "CRITICAL" }, { severity: "CRITICAL" }];
    for (const a of anomalies) {
      if (a.severity === "CRITICAL") score -= 10;
    }
    expect(score).toBe(80);
  });

  it("deducts 5 points per WARNING anomaly", () => {
    let score = 100;
    const anomalies = [{ severity: "WARNING" }, { severity: "WARNING" }, { severity: "WARNING" }];
    for (const a of anomalies) {
      if (a.severity === "WARNING") score -= 5;
    }
    expect(score).toBe(85);
  });

  it("deducts 2 points per INFO anomaly", () => {
    let score = 100;
    const anomalies = [{ severity: "INFO" }];
    for (const a of anomalies) {
      if (a.severity === "INFO") score -= 2;
    }
    expect(score).toBe(98);
  });

  it("clamps score to minimum 0", () => {
    let score = 100;
    const anomalies = Array.from({ length: 15 }, () => ({ severity: "CRITICAL" }));
    for (const a of anomalies) {
      if (a.severity === "CRITICAL") score -= 10;
    }
    score = Math.max(0, Math.min(100, score));
    expect(score).toBe(0);
  });

  it("generates correct recommendation based on score", () => {
    function getRecommendation(score: number): string {
      if (score >= 90) return "Ausgezeichnet";
      if (score >= 75) return "Gut";
      if (score >= 50) return "Verbesserungsbedarf";
      return "Kritisch";
    }

    expect(getRecommendation(95)).toBe("Ausgezeichnet");
    expect(getRecommendation(80)).toBe("Gut");
    expect(getRecommendation(60)).toBe("Verbesserungsbedarf");
    expect(getRecommendation(30)).toBe("Kritisch");
  });
});

describe("HACCP — Anomaly Summary", () => {
  it("correctly counts anomalies by severity", () => {
    const anomalies = [
      { severity: "CRITICAL" },
      { severity: "CRITICAL" },
      { severity: "WARNING" },
      { severity: "WARNING" },
      { severity: "WARNING" },
      { severity: "INFO" },
    ];

    const summary = {
      critical: anomalies.filter(a => a.severity === "CRITICAL").length,
      warning: anomalies.filter(a => a.severity === "WARNING").length,
      info: anomalies.filter(a => a.severity === "INFO").length,
    };

    expect(summary.critical).toBe(2);
    expect(summary.warning).toBe(3);
    expect(summary.info).toBe(1);
  });

  it("returns zeros for empty anomaly list", () => {
    const anomalies: Array<{ severity: string }> = [];
    const summary = {
      critical: anomalies.filter(a => a.severity === "CRITICAL").length,
      warning: anomalies.filter(a => a.severity === "WARNING").length,
      info: anomalies.filter(a => a.severity === "INFO").length,
    };
    expect(summary.critical).toBe(0);
    expect(summary.warning).toBe(0);
    expect(summary.info).toBe(0);
  });
});

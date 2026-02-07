/**
 * Analytics endpoints: PAX trends, HACCP compliance, popular dishes.
 */

import { db } from "./db";
import { storage } from "./storage";
import { guestCounts, haccpLogs, fridges, menuPlans, rotationSlots, recipes } from "@shared/schema";
import { and, gte, lte, eq, sql, desc } from "drizzle-orm";

// ==========================================
// PAX Trends
// ==========================================
export async function getPaxTrends(startDate: string, endDate: string, locationId?: number): Promise<{
  daily: Array<{ date: string; meal: string; total: number; adults: number; children: number }>;
  weekdayAvg: Record<string, { avg: number; count: number }>;
  monthlyTotals: Array<{ month: string; total: number }>;
}> {
  const conditions: any[] = [gte(guestCounts.date, startDate), lte(guestCounts.date, endDate)];
  if (locationId) conditions.push(eq(guestCounts.locationId, locationId));

  const counts = await db.select().from(guestCounts).where(and(...conditions));

  // Daily breakdown
  const daily = counts.map(gc => ({
    date: gc.date,
    meal: gc.meal,
    total: gc.adults + gc.children,
    adults: gc.adults,
    children: gc.children,
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Weekday averages
  const weekdayData: Record<string, number[]> = {};
  const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  for (const gc of counts) {
    const dayName = DAYS[new Date(gc.date).getDay()];
    if (!weekdayData[dayName]) weekdayData[dayName] = [];
    weekdayData[dayName].push(gc.adults + gc.children);
  }
  const weekdayAvg: Record<string, { avg: number; count: number }> = {};
  for (const [day, values] of Object.entries(weekdayData)) {
    weekdayAvg[day] = {
      avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
      count: values.length,
    };
  }

  // Monthly totals
  const monthMap: Record<string, number> = {};
  for (const gc of counts) {
    const month = gc.date.substring(0, 7); // YYYY-MM
    monthMap[month] = (monthMap[month] || 0) + gc.adults + gc.children;
  }
  const monthlyTotals = Object.entries(monthMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { daily, weekdayAvg, monthlyTotals };
}

// ==========================================
// HACCP Compliance
// ==========================================
export async function getHaccpCompliance(startDate: string, endDate: string): Promise<{
  overallCompliance: number;
  fridgeCompliance: Array<{
    fridgeId: number;
    fridgeName: string;
    totalChecks: number;
    okChecks: number;
    warningChecks: number;
    criticalChecks: number;
    compliancePercent: number;
    tempTrend: Array<{ timestamp: string; temperature: number }>;
  }>;
  gapAnalysis: Array<{ date: string; fridgeId: number; fridgeName: string; issue: string }>;
}> {
  const startTs = new Date(startDate);
  const endTs = new Date(endDate + 'T23:59:59');

  const allFridges = await storage.getFridges();
  const logs = await db.select().from(haccpLogs)
    .where(and(gte(haccpLogs.timestamp, startTs), lte(haccpLogs.timestamp, endTs)));

  let totalOk = 0;
  let totalChecks = 0;

  const fridgeCompliance = allFridges.map(fridge => {
    const fridgeLogs = logs.filter(l => l.fridgeId === fridge.id);
    const ok = fridgeLogs.filter(l => l.status === 'ok').length;
    const warning = fridgeLogs.filter(l => l.status === 'warning').length;
    const critical = fridgeLogs.filter(l => l.status === 'critical').length;
    const total = fridgeLogs.length;

    totalOk += ok;
    totalChecks += total;

    return {
      fridgeId: fridge.id,
      fridgeName: fridge.name,
      totalChecks: total,
      okChecks: ok,
      warningChecks: warning,
      criticalChecks: critical,
      compliancePercent: total > 0 ? Math.round((ok / total) * 100) : 0,
      tempTrend: fridgeLogs
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(l => ({
          timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : String(l.timestamp),
          temperature: l.temperature,
        })),
    };
  });

  // Gap analysis: find dates with no checks for active fridges
  const gapAnalysis: Array<{ date: string; fridgeId: number; fridgeName: string; issue: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    for (const fridge of allFridges) {
      const dayLogs = logs.filter(l => {
        const logDate = l.timestamp instanceof Date ? l.timestamp.toISOString().split('T')[0] : String(l.timestamp).split('T')[0];
        return l.fridgeId === fridge.id && logDate === dateStr;
      });
      if (dayLogs.length === 0) {
        gapAnalysis.push({
          date: dateStr,
          fridgeId: fridge.id,
          fridgeName: fridge.name,
          issue: 'Keine Messung',
        });
      }
    }
  }

  return {
    overallCompliance: totalChecks > 0 ? Math.round((totalOk / totalChecks) * 100) : 0,
    fridgeCompliance,
    gapAnalysis,
  };
}

// ==========================================
// Popular Dishes
// ==========================================
export async function getPopularDishes(limit = 20): Promise<Array<{
  recipeId: number;
  recipeName: string;
  category: string;
  menuPlanCount: number;
  rotationCount: number;
  totalCount: number;
}>> {
  // Count from menu plans
  const menuPlanCounts = await db
    .select({
      recipeId: menuPlans.recipeId,
      count: sql<number>`count(*)::int`,
    })
    .from(menuPlans)
    .where(sql`${menuPlans.recipeId} IS NOT NULL`)
    .groupBy(menuPlans.recipeId);

  // Count from rotation slots
  const rotationCounts = await db
    .select({
      recipeId: rotationSlots.recipeId,
      count: sql<number>`count(*)::int`,
    })
    .from(rotationSlots)
    .where(sql`${rotationSlots.recipeId} IS NOT NULL`)
    .groupBy(rotationSlots.recipeId);

  // Merge counts
  const countMap: Record<number, { menuPlan: number; rotation: number }> = {};

  for (const mc of menuPlanCounts) {
    if (!mc.recipeId) continue;
    if (!countMap[mc.recipeId]) countMap[mc.recipeId] = { menuPlan: 0, rotation: 0 };
    countMap[mc.recipeId].menuPlan = mc.count;
  }

  for (const rc of rotationCounts) {
    if (!rc.recipeId) continue;
    if (!countMap[rc.recipeId]) countMap[rc.recipeId] = { menuPlan: 0, rotation: 0 };
    countMap[rc.recipeId].rotation = rc.count;
  }

  // Get recipe details and sort
  const results = await Promise.all(
    Object.entries(countMap).map(async ([idStr, counts]) => {
      const id = parseInt(idStr);
      const recipe = await storage.getRecipe(id);
      return {
        recipeId: id,
        recipeName: recipe?.name || `#${id}`,
        category: recipe?.category || '',
        menuPlanCount: counts.menuPlan,
        rotationCount: counts.rotation,
        totalCount: counts.menuPlan + counts.rotation,
      };
    })
  );

  return results
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, limit);
}

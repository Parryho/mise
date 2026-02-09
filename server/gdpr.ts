/**
 * GDPR (DSGVO) Data Export & Deletion
 *
 * Provides user data export, anonymization and deletion functionality
 * in compliance with EU GDPR and HACCP food safety regulations.
 *
 * HACCP data is NEVER fully deleted — only anonymized (EU food safety regulation).
 */

import type { Request, Response } from "express";
import { db } from "./db";
import { storage } from "./storage";
import {
  users, haccpLogs, scheduleEntries, auditLogs, staff,
  menuPlanTemperatures, tasks, pushSubscriptions, session
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { formatLocalDate } from "@shared/constants";

// ==========================================
// Core GDPR functions
// ==========================================

interface UserDataExport {
  exportDate: string;
  userId: string;
  profile: Record<string, unknown>;
  haccpLogs: Record<string, unknown>[];
  scheduleEntries: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  menuPlanTemperatures: Record<string, unknown>[];
  auditLogs: Record<string, unknown>[];
  pushSubscriptions: Record<string, unknown>[];
  staffProfiles: Record<string, unknown>[];
}

interface DataCounts {
  profile: number;
  haccpLogs: number;
  scheduleEntries: number;
  tasks: number;
  menuPlanTemperatures: number;
  auditLogs: number;
  pushSubscriptions: number;
  staffProfiles: number;
}

/**
 * Export all data associated with a user across all tables
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("Benutzer nicht gefunden");
  }

  // Profile data (excluding password hash)
  const { password, ...profileData } = user;

  // HACCP logs where user field matches
  const userHaccpLogs = await db.select().from(haccpLogs)
    .where(eq(haccpLogs.user, user.name));

  // Staff profiles linked to this user
  const userStaff = await db.select().from(staff)
    .where(eq(staff.userId, userId));

  // Schedule entries for linked staff
  let userScheduleEntries: any[] = [];
  for (const s of userStaff) {
    const entries = await db.select().from(scheduleEntries)
      .where(eq(scheduleEntries.staffId, s.id));
    userScheduleEntries.push(...entries);
  }

  // Tasks assigned to this user
  const userTasks = await db.select().from(tasks)
    .where(eq(tasks.assignedToUserId, userId));

  // Menu plan temperatures recorded by this user
  const userTemps = await db.select().from(menuPlanTemperatures)
    .where(eq(menuPlanTemperatures.recordedBy, user.name));

  // Audit logs by this user
  const userAuditLogs = await db.select().from(auditLogs)
    .where(eq(auditLogs.userId, userId));

  // Push subscriptions
  const userPushSubs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return {
    exportDate: new Date().toISOString(),
    userId,
    profile: profileData,
    haccpLogs: userHaccpLogs,
    scheduleEntries: userScheduleEntries,
    tasks: userTasks,
    menuPlanTemperatures: userTemps,
    auditLogs: userAuditLogs,
    pushSubscriptions: userPushSubs.map(({ auth: _a, p256dh: _p, ...rest }) => rest), // Remove keys
    staffProfiles: userStaff,
  };
}

/**
 * Get counts of data per category for a user (for preview)
 */
export async function getUserDataCounts(userId: string): Promise<DataCounts> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("Benutzer nicht gefunden");
  }

  const [haccpCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(haccpLogs).where(eq(haccpLogs.user, user.name));

  const userStaff = await db.select().from(staff)
    .where(eq(staff.userId, userId));

  let scheduleCount = 0;
  for (const s of userStaff) {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(scheduleEntries).where(eq(scheduleEntries.staffId, s.id));
    scheduleCount += result?.count ?? 0;
  }

  const [taskCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(tasks).where(eq(tasks.assignedToUserId, userId));

  const [tempCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(menuPlanTemperatures).where(eq(menuPlanTemperatures.recordedBy, user.name));

  const [auditCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(auditLogs).where(eq(auditLogs.userId, userId));

  const [pushCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  return {
    profile: 1,
    haccpLogs: haccpCount?.count ?? 0,
    scheduleEntries: scheduleCount,
    tasks: taskCount?.count ?? 0,
    menuPlanTemperatures: tempCount?.count ?? 0,
    auditLogs: auditCount?.count ?? 0,
    pushSubscriptions: pushCount?.count ?? 0,
    staffProfiles: userStaff.length,
  };
}

/**
 * Anonymize user: replace personal data but keep anonymized records for HACCP compliance
 */
export async function anonymizeUser(userId: string, performedByUserId: string): Promise<{
  anonymized: string[];
  deleted: string[];
}> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("Benutzer nicht gefunden");
  }

  const anonymizedLabel = `Gelöschter Benutzer [${userId.substring(0, 8)}]`;
  const anonymizedEmail = `deleted_${userId.substring(0, 8)}@anonymized.local`;
  const result = { anonymized: [] as string[], deleted: [] as string[] };

  await db.transaction(async (tx) => {
    // 1. Anonymize HACCP logs (keep records, replace user name)
    await tx.update(haccpLogs)
      .set({ user: anonymizedLabel })
      .where(eq(haccpLogs.user, user.name));
    result.anonymized.push("HACCP-Protokolle (anonymisiert)");

    // 2. Anonymize menu plan temperatures (HACCP-relevant)
    await tx.update(menuPlanTemperatures)
      .set({ recordedBy: anonymizedLabel })
      .where(eq(menuPlanTemperatures.recordedBy, user.name));
    result.anonymized.push("Temperaturmessungen (anonymisiert)");

    // 3. Anonymize audit logs (keep for compliance, anonymize user reference)
    await tx.update(auditLogs)
      .set({ userName: anonymizedLabel })
      .where(eq(auditLogs.userId, userId));
    result.anonymized.push("Audit-Protokolle (anonymisiert)");

    // 4. Delete push subscriptions
    await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    result.deleted.push("Push-Benachrichtigungen");

    // 5. Delete sessions
    await tx.delete(session).where(
      sql`sess::jsonb->>'userId' = ${userId}`
    );
    result.deleted.push("Sitzungen");

    // 6. Unlink staff profiles (don't delete — they might be needed for schedule history)
    await tx.update(staff)
      .set({ userId: null, name: anonymizedLabel, email: null, phone: null })
      .where(eq(staff.userId, userId));
    result.anonymized.push("Mitarbeiterprofil (anonymisiert)");

    // 7. Unlink tasks
    await tx.update(tasks)
      .set({ assignedToUserId: null })
      .where(eq(tasks.assignedToUserId, userId));
    result.anonymized.push("Aufgaben-Zuweisungen (entfernt)");

    // 8. Anonymize user account (deactivate, replace personal data)
    await tx.update(users)
      .set({
        name: anonymizedLabel,
        email: anonymizedEmail,
        username: anonymizedEmail,
        password: "ANONYMIZED",
        isApproved: false,
        role: "guest",
      })
      .where(eq(users.id, userId));
    result.anonymized.push("Benutzerkonto (deaktiviert & anonymisiert)");

    // 9. Log the action
    await tx.insert(auditLogs).values({
      userId: performedByUserId,
      userName: null,
      action: "gdpr_anonymize",
      tableName: "users",
      recordId: userId,
      before: JSON.stringify({ name: user.name, email: user.email }),
      after: JSON.stringify({ name: anonymizedLabel, email: anonymizedEmail }),
    });
  });

  return result;
}

/**
 * Delete user completely (with HACCP anonymization)
 * For non-compliance-critical data: full delete
 * For HACCP data: anonymize only (legal requirement)
 */
export async function deleteUserCompletely(userId: string, performedByUserId: string): Promise<{
  anonymized: string[];
  deleted: string[];
  summary: string;
}> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("Benutzer nicht gefunden");
  }

  // Anonymize + delete in one transaction
  const result = await anonymizeUser(userId, performedByUserId);

  // Delete the anonymized user account entirely
  await db.delete(users).where(eq(users.id, userId));
  result.deleted.push("Benutzerkonto (vollständig gelöscht)");
  result.anonymized = result.anonymized.filter(a => !a.includes("Benutzerkonto"));
  result.deleted.push("Alle Sitzungsdaten");

  const summary = `Benutzer "${user.name}" wurde verarbeitet: ${result.deleted.length} Kategorien gelöscht, ${result.anonymized.length} Kategorien anonymisiert (HACCP-Aufbewahrungspflicht).`;

  return { ...result, summary };
}


// ==========================================
// API Route Handlers (for integration into routes.ts)
// ==========================================

/**
 * GET /api/gdpr/export — export own data
 */
export async function handleGdprExportOwn(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Nicht angemeldet" });

    const data = await exportUserData(user.id);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="dsgvo_export_${user.id.substring(0, 8)}_${formatLocalDate(new Date())}.json"`);
    return res.json(data);
  } catch (error: any) {
    console.error("GDPR export error:", error);
    return res.status(500).json({ error: error.message || "Export fehlgeschlagen" });
  }
}

/**
 * GET /api/gdpr/export/:userId — export specific user data (admin)
 */
export async function handleGdprExportUser(req: Request, res: Response) {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const data = await exportUserData(userId);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="dsgvo_export_${userId.substring(0, 8)}_${formatLocalDate(new Date())}.json"`);
    return res.json(data);
  } catch (error: any) {
    console.error("GDPR export error:", error);
    return res.status(500).json({ error: error.message || "Export fehlgeschlagen" });
  }
}

/**
 * GET /api/gdpr/counts — get data counts for current user (preview)
 */
export async function handleGdprCountsOwn(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Nicht angemeldet" });

    const counts = await getUserDataCounts(user.id);
    return res.json(counts);
  } catch (error: any) {
    console.error("GDPR counts error:", error);
    return res.status(500).json({ error: error.message || "Fehler beim Abrufen der Datenübersicht" });
  }
}

/**
 * GET /api/gdpr/counts/:userId — get data counts for specific user (admin)
 */
export async function handleGdprCountsUser(req: Request, res: Response) {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const counts = await getUserDataCounts(userId);
    return res.json(counts);
  } catch (error: any) {
    console.error("GDPR counts error:", error);
    return res.status(500).json({ error: error.message || "Fehler beim Abrufen der Datenübersicht" });
  }
}

/**
 * DELETE /api/gdpr/delete — request own account deletion
 */
export async function handleGdprDeleteOwn(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Nicht angemeldet" });

    // Require confirmation
    const { confirm } = req.body;
    if (confirm !== "LÖSCHEN") {
      return res.status(400).json({ error: "Bestätigung erforderlich: Bitte 'LÖSCHEN' eingeben" });
    }

    // Prevent admin self-deletion if they're the last admin
    if (user.role === "admin") {
      const allUsers = await storage.getAllUsers();
      const admins = allUsers.filter(u => u.role === "admin" && u.isApproved && u.id !== user.id);
      if (admins.length === 0) {
        return res.status(400).json({ error: "Der letzte Admin kann sich nicht selbst löschen" });
      }
    }

    const result = await deleteUserCompletely(user.id, user.id);

    // Destroy session
    req.session.destroy(() => {});

    return res.json({
      success: true,
      message: result.summary,
      details: result,
    });
  } catch (error: any) {
    console.error("GDPR delete error:", error);
    return res.status(500).json({ error: error.message || "Löschung fehlgeschlagen" });
  }
}

/**
 * DELETE /api/gdpr/delete/:userId — delete specific user (admin)
 */
export async function handleGdprDeleteUser(req: Request, res: Response) {
  try {
    const admin = (req as any).user;
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    // Require confirmation
    const { confirm } = req.body;
    if (confirm !== "LÖSCHEN") {
      return res.status(400).json({ error: "Bestätigung erforderlich: Bitte 'LÖSCHEN' eingeben" });
    }

    // Prevent deleting yourself through admin endpoint
    if (userId === admin.id) {
      return res.status(400).json({ error: "Eigenes Konto kann nicht über die Admin-Funktion gelöscht werden" });
    }

    const result = await deleteUserCompletely(userId, admin.id);
    return res.json({
      success: true,
      message: result.summary,
      details: result,
    });
  } catch (error: any) {
    console.error("GDPR delete error:", error);
    return res.status(500).json({ error: error.message || "Löschung fehlgeschlagen" });
  }
}

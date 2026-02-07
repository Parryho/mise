/**
 * Backup & Restore Management
 *
 * Provides backup listing, manual creation, download, restore and deletion
 * for the PostgreSQL database. Backups are stored as gzipped SQL dumps
 * in /backups/ (Docker volume shared with db-backup service).
 *
 * SECURITY: Path traversal prevention, admin-only access, rate limiting,
 * restore requires explicit confirmation.
 */

import type { Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

const execAsync = promisify(exec);

// Path to backups directory (mounted Docker volume)
const BACKUPS_DIR = "/backups";

// Dev fallback: use local backups directory if /backups doesn't exist
function getBackupsDir(): string {
  if (fs.existsSync(BACKUPS_DIR)) return BACKUPS_DIR;
  // In development, create a local backups dir
  const localDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}

// Strict filename validation: only alphanumeric, underscore, dash, dot
// Must end with .sql.gz
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_\-]+\.sql\.gz$/;

function isValidFilename(filename: string): boolean {
  if (!filename || typeof filename !== "string") return false;
  if (filename.length > 100) return false;
  if (!SAFE_FILENAME_REGEX.test(filename)) return false;
  // Extra paranoia: no path separators
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return false;
  return true;
}

// Rate limiting for backup creation
let lastBackupTime = 0;
const BACKUP_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ==========================================
// Core Backup Functions
// ==========================================

interface BackupInfo {
  filename: string;
  size: number;
  sizeFormatted: string;
  date: string;
  isAutomatic: boolean;
}

/**
 * List all backups in the backups directory
 */
export function listBackups(): BackupInfo[] {
  const dir = getBackupsDir();

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".sql.gz") && isValidFilename(f));

  const backups: BackupInfo[] = files.map(filename => {
    const filePath = path.join(dir, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      date: stats.mtime.toISOString(),
      isAutomatic: !filename.includes("manual"),
    };
  });

  // Sort by date descending (newest first)
  backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return backups;
}

/**
 * Create a manual backup via pg_dump
 */
export async function createBackup(): Promise<BackupInfo> {
  const now = Date.now();
  if (now - lastBackupTime < BACKUP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((BACKUP_COOLDOWN_MS - (now - lastBackupTime)) / 1000);
    throw new Error(`Backup-Limit: Bitte warten Sie noch ${remainingSeconds} Sekunden`);
  }

  const dir = getBackupsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "").replace("T", "_").substring(0, 15);
  const filename = `mise_manual_${timestamp}.sql.gz`;
  const filePath = path.join(dir, filename);

  // Determine pg_dump connection params from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL nicht konfiguriert");
  }

  try {
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || "5432";
    const user = url.username;
    const dbName = url.pathname.replace("/", "");
    const password = url.password;

    const env = { ...process.env, PGPASSWORD: password };
    const cmd = `pg_dump -h ${host} -p ${port} -U ${user} ${dbName} | gzip > "${filePath}"`;

    await execAsync(cmd, { env, timeout: 120000 });

    lastBackupTime = Date.now();

    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      date: stats.mtime.toISOString(),
      isAutomatic: false,
    };
  } catch (error: any) {
    // Clean up partial file
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    throw new Error(`Backup fehlgeschlagen: ${error.message}`);
  }
}

/**
 * Get full path for a backup file (with validation)
 */
function getBackupPath(filename: string): string {
  if (!isValidFilename(filename)) {
    throw new Error("Ungültiger Dateiname");
  }
  const dir = getBackupsDir();
  const filePath = path.join(dir, filename);
  // Ensure resolved path is still within backups dir (prevent path traversal)
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(dir))) {
    throw new Error("Ungültiger Dateipfad");
  }
  return resolved;
}

/**
 * Restore database from a backup file
 */
export async function restoreBackup(filename: string): Promise<string> {
  const filePath = getBackupPath(filename);
  if (!fs.existsSync(filePath)) {
    throw new Error("Backup-Datei nicht gefunden");
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL nicht konfiguriert");
  }

  try {
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || "5432";
    const user = url.username;
    const dbName = url.pathname.replace("/", "");
    const password = url.password;

    const env = { ...process.env, PGPASSWORD: password };
    const cmd = `gunzip -c "${filePath}" | psql -h ${host} -p ${port} -U ${user} ${dbName}`;

    await execAsync(cmd, { env, timeout: 300000 });

    return `Wiederherstellung von "${filename}" abgeschlossen.`;
  } catch (error: any) {
    throw new Error(`Wiederherstellung fehlgeschlagen: ${error.message}`);
  }
}

/**
 * Delete a backup file
 */
export function deleteBackup(filename: string): void {
  const filePath = getBackupPath(filename);
  if (!fs.existsSync(filePath)) {
    throw new Error("Backup-Datei nicht gefunden");
  }
  fs.unlinkSync(filePath);
}

/**
 * Get total storage usage of all backups
 */
export function getStorageUsage(): { totalSize: number; totalSizeFormatted: string; fileCount: number } {
  const backups = listBackups();
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    fileCount: backups.length,
  };
}


// ==========================================
// API Route Handlers
// ==========================================

/**
 * GET /api/admin/backups — list all backups
 */
export function handleListBackups(_req: Request, res: Response) {
  try {
    const backups = listBackups();
    const usage = getStorageUsage();
    return res.json({ backups, storage: usage });
  } catch (error: any) {
    console.error("Backup list error:", error);
    return res.status(500).json({ error: error.message || "Fehler beim Auflisten der Backups" });
  }
}

/**
 * POST /api/admin/backups — create manual backup
 */
export async function handleCreateBackup(req: Request, res: Response) {
  try {
    const admin = (req as any).user;

    const backup = await createBackup();

    // Audit log
    await storage.createAuditLog({
      userId: admin.id,
      userName: admin.name,
      action: "backup_create",
      tableName: "system",
      recordId: backup.filename,
      after: { filename: backup.filename, size: backup.sizeFormatted },
    });

    return res.json({ success: true, backup });
  } catch (error: any) {
    console.error("Backup creation error:", error);
    return res.status(500).json({ error: error.message || "Backup-Erstellung fehlgeschlagen" });
  }
}

/**
 * GET /api/admin/backups/:filename — download a backup file
 */
export function handleDownloadBackup(req: Request, res: Response) {
  try {
    const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
    const filePath = getBackupPath(filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup-Datei nicht gefunden" });
    }

    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error: any) {
    console.error("Backup download error:", error);
    return res.status(400).json({ error: error.message || "Download fehlgeschlagen" });
  }
}

/**
 * POST /api/admin/backups/:filename/restore — restore from backup
 */
export async function handleRestoreBackup(req: Request, res: Response) {
  try {
    const admin = (req as any).user;
    const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;

    // Require explicit confirmation
    const { confirm } = req.body;
    if (confirm !== "RESTORE") {
      return res.status(400).json({ error: "Bestätigung erforderlich: Bitte senden Sie {confirm: \"RESTORE\"}" });
    }

    // Audit log BEFORE restore (in case restore breaks things)
    await storage.createAuditLog({
      userId: admin.id,
      userName: admin.name,
      action: "backup_restore",
      tableName: "system",
      recordId: filename,
      before: { action: "restore_initiated" },
      after: { filename },
    });

    const message = await restoreBackup(filename);

    return res.json({ success: true, message });
  } catch (error: any) {
    console.error("Backup restore error:", error);
    return res.status(500).json({ error: error.message || "Wiederherstellung fehlgeschlagen" });
  }
}

/**
 * DELETE /api/admin/backups/:filename — delete a backup file
 */
export async function handleDeleteBackup(req: Request, res: Response) {
  try {
    const admin = (req as any).user;
    const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;

    // Get file info before deletion for audit log
    const backups = listBackups();
    const backupInfo = backups.find(b => b.filename === filename);

    deleteBackup(filename);

    // Audit log
    await storage.createAuditLog({
      userId: admin.id,
      userName: admin.name,
      action: "backup_delete",
      tableName: "system",
      recordId: filename,
      before: backupInfo ? { filename, size: backupInfo.sizeFormatted } : { filename },
    });

    return res.json({ success: true, message: `Backup "${filename}" wurde gelöscht` });
  } catch (error: any) {
    console.error("Backup delete error:", error);
    return res.status(400).json({ error: error.message || "Löschung fehlgeschlagen" });
  }
}

/**
 * Email Service for mise.at
 * Uses nodemailer with SMTP. Graceful fallback to console logging if SMTP not configured.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  haccpAlertTemplate,
  scheduleChangeTemplate,
  cateringConfirmationTemplate,
  weeklyReportTemplate,
  type HaccpAlertData,
  type ScheduleChangeData,
  type CateringConfirmationData,
  type WeeklyReportData,
} from "./email-templates";

let transporter: Transporter | null = null;
let smtpConfigured = false;

/**
 * Initialize or re-initialize SMTP transporter from env vars or passed config
 */
export function initializeTransporter(config?: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}): boolean {
  const host = config?.host || process.env.SMTP_HOST;
  const port = config?.port || parseInt(process.env.SMTP_PORT || "587", 10);
  const user = config?.user || process.env.SMTP_USER;
  const pass = config?.pass || process.env.SMTP_PASS;
  const from = config?.from || process.env.SMTP_FROM;

  if (!host || !user || !pass) {
    console.log("[email] SMTP not configured. Emails will be logged to console.");
    smtpConfigured = false;
    transporter = null;
    return false;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    smtpConfigured = true;
    console.log(`[email] SMTP configured: ${host}:${port} (from: ${from || user})`);
    return true;
  } catch (error) {
    console.error("[email] Failed to create SMTP transporter:", error);
    smtpConfigured = false;
    transporter = null;
    return false;
  }
}

// Initialize on module load from env vars
initializeTransporter();

/**
 * Get the configured "from" address
 */
function getFrom(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@mise.at";
}

/**
 * Base email sending function
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipients = Array.isArray(to) ? to.join(", ") : to;

  if (!smtpConfigured || !transporter) {
    // Graceful fallback: log to console
    console.log("=== EMAIL (console fallback) ===");
    console.log(`To: ${recipients}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML length: ${html.length} chars`);
    console.log("================================");
    return { success: true, messageId: "console-fallback" };
  }

  try {
    const info = await transporter.sendMail({
      from: getFrom(),
      to: recipients,
      subject,
      html,
    });
    console.log(`[email] Sent: "${subject}" to ${recipients} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[email] Failed to send "${subject}" to ${recipients}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send HACCP critical temperature alert
 */
export async function sendHaccpAlert(
  recipientEmails: string[],
  fridgeName: string,
  temperature: number,
  tempMin: number,
  tempMax: number,
  message: string
) {
  const data: HaccpAlertData = {
    fridgeName,
    temperature,
    tempMin,
    tempMax,
    message,
    timestamp: new Date().toLocaleString("de-AT", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
  const html = haccpAlertTemplate(data);
  return sendEmail(
    recipientEmails,
    `HACCP WARNUNG: ${fridgeName} - ${temperature.toFixed(1)}C`,
    html
  );
}

/**
 * Send schedule change notification
 */
export async function sendScheduleNotification(
  userEmail: string,
  userName: string,
  changes: ScheduleChangeData["changes"]
) {
  const data: ScheduleChangeData = { userName, changes };
  const html = scheduleChangeTemplate(data);
  return sendEmail(
    userEmail,
    `Dienstplan-Aenderung - mise.at`,
    html
  );
}

/**
 * Send catering event confirmation
 */
export async function sendCateringConfirmation(eventDetails: CateringConfirmationData) {
  const html = cateringConfirmationTemplate(eventDetails);
  // Send to admin/management email from env
  const adminEmail = process.env.CATERING_NOTIFY_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!adminEmail) {
    console.warn("[email] No catering notification email configured");
    return { success: false, error: "No notification email configured" };
  }
  return sendEmail(
    adminEmail,
    `Catering bestaetigt: ${eventDetails.eventName} (${eventDetails.date})`,
    html
  );
}

/**
 * Send weekly report to admin
 */
export async function sendWeeklyReport(adminEmail: string, reportData: WeeklyReportData) {
  const html = weeklyReportTemplate(reportData);
  return sendEmail(
    adminEmail,
    `Wochenbericht ${reportData.weekLabel} - mise.at`,
    html
  );
}

/**
 * Verify SMTP connection
 */
export async function verifySmtp(): Promise<{ success: boolean; error?: string }> {
  if (!smtpConfigured || !transporter) {
    return { success: false, error: "SMTP nicht konfiguriert" };
  }
  try {
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if SMTP is configured
 */
export function isSmtpConfigured(): boolean {
  return smtpConfigured;
}

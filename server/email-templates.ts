/**
 * Email Templates for mise.at
 * Professional HTML email templates with inline CSS
 * Brand color: #F37021 (mise orange)
 */

const BRAND_COLOR = "#F37021";
const BRAND_DARK = "#D85E15";
const BG_COLOR = "#f9fafb";
const CARD_BG = "#ffffff";
const TEXT_COLOR = "#1f2937";
const TEXT_MUTED = "#6b7280";
const BORDER_COLOR = "#e5e7eb";
const RED_BG = "#fef2f2";
const RED_TEXT = "#991b1b";
const RED_BORDER = "#fecaca";
const GREEN_TEXT = "#166534";

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 0; border-bottom: 3px solid ${BRAND_COLOR};">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${BRAND_COLOR};">mise.at</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Kuechen-Management</p>
            </td>
          </tr>
        </table>
        <!-- Content -->
        ${content}
        <!-- Footer -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; border-top: 1px solid ${BORDER_COLOR};">
          <tr>
            <td style="padding: 16px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED};">
                Diese E-Mail wurde automatisch von mise.at gesendet.<br/>
                mise.at Kuechenmanagement
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface HaccpAlertData {
  fridgeName: string;
  temperature: number;
  tempMin: number;
  tempMax: number;
  message: string;
  timestamp: string;
}

export function haccpAlertTemplate(data: HaccpAlertData): string {
  const content = `
    <table cellpadding="0" cellspacing="0" width="100%" style="background: ${RED_BG}; border: 2px solid ${RED_BORDER}; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="background: #dc2626; padding: 16px; text-align: center;">
          <h2 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">HACCP WARNUNG</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="text-align: center; padding-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Kuehlschrank</p>
                <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: ${TEXT_COLOR};">${data.fridgeName}</p>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; padding-bottom: 20px;">
                <div style="display: inline-block; background: ${RED_BORDER}; border-radius: 12px; padding: 16px 32px;">
                  <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${RED_TEXT};">${data.temperature.toFixed(1)}&deg;C</p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: ${TEXT_MUTED};">Erlaubter Bereich: ${data.tempMin.toFixed(1)}&deg;C - ${data.tempMax.toFixed(1)}&deg;C</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid ${BORDER_COLOR};">
                <p style="margin: 0; font-size: 14px; color: ${TEXT_COLOR};"><strong>Nachricht:</strong> ${data.message}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; font-size: 13px; color: ${TEXT_MUTED};">Zeitpunkt: ${data.timestamp}</p>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
            <tr>
              <td style="text-align: center;">
                <a href="https://mise.at/haccp" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Sofort pruefen</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return baseLayout("HACCP Warnung - mise.at", content);
}

export interface ScheduleChangeData {
  userName: string;
  changes: Array<{
    date: string;
    oldShift?: string;
    newShift: string;
    notes?: string;
  }>;
}

export function scheduleChangeTemplate(data: ScheduleChangeData): string {
  const changeRows = data.changes.map(change => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${BORDER_COLOR}; font-size: 14px; color: ${TEXT_COLOR};">${change.date}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${BORDER_COLOR}; font-size: 14px; color: ${TEXT_MUTED}; text-decoration: line-through;">${change.oldShift || "-"}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${BORDER_COLOR}; font-size: 14px; font-weight: 600; color: ${BRAND_COLOR};">${change.newShift}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${BORDER_COLOR}; font-size: 13px; color: ${TEXT_MUTED};">${change.notes || ""}</td>
    </tr>
  `).join("");

  const content = `
    <table cellpadding="0" cellspacing="0" width="100%" style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="background: ${BRAND_COLOR}; padding: 16px;">
          <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 700;">Dienstplan-Aenderung</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 16px; font-size: 15px; color: ${TEXT_COLOR};">
            Hallo <strong>${data.userName}</strong>,<br/>
            es gibt Aenderungen in Ihrem Dienstplan:
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid ${BORDER_COLOR}; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: ${BG_COLOR};">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Datum</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Vorher</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Nachher</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Anmerkung</th>
              </tr>
            </thead>
            <tbody>
              ${changeRows}
            </tbody>
          </table>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
            <tr>
              <td style="text-align: center;">
                <a href="https://mise.at/schedule" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Dienstplan ansehen</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return baseLayout("Dienstplan-Aenderung - mise.at", content);
}

export interface CateringConfirmationData {
  clientName: string;
  eventName: string;
  date: string;
  time: string;
  personCount: number;
  dishes: string[];
  notes?: string;
  contactPerson?: string;
  room?: string;
}

export function cateringConfirmationTemplate(data: CateringConfirmationData): string {
  const dishList = data.dishes.map(dish => `
    <tr>
      <td style="padding: 6px 12px; font-size: 14px; color: ${TEXT_COLOR};">&#8226; ${dish}</td>
    </tr>
  `).join("");

  const content = `
    <table cellpadding="0" cellspacing="0" width="100%" style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="background: ${BRAND_COLOR}; padding: 16px;">
          <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 700;">Catering-Bestaetigung</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 20px; font-size: 15px; color: ${TEXT_COLOR};">
            Das Catering-Event wurde bestaetigt:
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED}; width: 120px;">Kunde:</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${TEXT_COLOR};">${data.clientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED};">Event:</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${TEXT_COLOR};">${data.eventName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED};">Datum:</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${TEXT_COLOR};">${data.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED};">Uhrzeit:</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${TEXT_COLOR};">${data.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED};">Personen:</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: ${BRAND_COLOR};">${data.personCount}</td>
            </tr>
            ${data.room ? `<tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED};">Raum:</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${TEXT_COLOR};">${data.room}</td>
            </tr>` : ""}
            ${data.contactPerson ? `<tr>
              <td style="padding: 8px 0; font-size: 13px; color: ${TEXT_MUTED};">Kontakt:</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${TEXT_COLOR};">${data.contactPerson}</td>
            </tr>` : ""}
          </table>
          ${data.dishes.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Gerichte:</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="background: ${BG_COLOR}; border-radius: 6px; padding: 8px;">
              ${dishList}
            </table>
          </div>` : ""}
          ${data.notes ? `<div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Anmerkungen:</strong> ${data.notes}</p>
          </div>` : ""}
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
            <tr>
              <td style="text-align: center;">
                <a href="https://mise.at/catering" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Catering verwalten</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return baseLayout("Catering-Bestaetigung - mise.at", content);
}

export interface WeeklyReportData {
  weekLabel: string; // e.g. "KW 5 / 2026"
  paxTotal: number;
  paxAvgPerDay: number;
  foodCostTotal: number;
  foodCostPerPax: number;
  haccpCompliancePercent: number;
  haccpLogCount: number;
  haccpAlertCount: number;
  openTaskCount: number;
  cateringEventCount: number;
}

export function weeklyReportTemplate(data: WeeklyReportData): string {
  const complianceColor = data.haccpCompliancePercent >= 95 ? GREEN_TEXT : data.haccpCompliancePercent >= 80 ? "#ca8a04" : RED_TEXT;

  const content = `
    <table cellpadding="0" cellspacing="0" width="100%" style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="background: ${BRAND_COLOR}; padding: 16px;">
          <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 700;">Woechentlicher Bericht</h2>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">${data.weekLabel}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <!-- Summary cards -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td style="width: 50%; padding: 8px;">
                <div style="background: ${BG_COLOR}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">PAX Gesamt</p>
                  <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">${data.paxTotal.toLocaleString("de-AT")}</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: ${TEXT_MUTED};">&#216; ${data.paxAvgPerDay.toFixed(0)} / Tag</p>
                </div>
              </td>
              <td style="width: 50%; padding: 8px;">
                <div style="background: ${BG_COLOR}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Food Cost</p>
                  <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: ${TEXT_COLOR};">&euro;${data.foodCostTotal.toFixed(0)}</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: ${TEXT_MUTED};">&euro;${data.foodCostPerPax.toFixed(2)} / PAX</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 8px;">
                <div style="background: ${BG_COLOR}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">HACCP Compliance</p>
                  <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: ${complianceColor};">${data.haccpCompliancePercent.toFixed(0)}%</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: ${TEXT_MUTED};">${data.haccpLogCount} Messungen, ${data.haccpAlertCount} Alarme</p>
                </div>
              </td>
              <td style="width: 50%; padding: 8px;">
                <div style="background: ${BG_COLOR}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px;">Offene Aufgaben</p>
                  <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: ${data.openTaskCount > 0 ? "#ca8a04" : GREEN_TEXT};">${data.openTaskCount}</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: ${TEXT_MUTED};">${data.cateringEventCount} Catering-Events</p>
                </div>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
            <tr>
              <td style="text-align: center;">
                <a href="https://mise.at/today" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Dashboard oeffnen</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return baseLayout(`Wochenbericht ${data.weekLabel} - mise.at`, content);
}

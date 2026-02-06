/**
 * Airtable integration for AK Catering Events (READ-ONLY).
 * Ported from Menuplaner (Project A) and adapted for Drizzle/Express.
 */

import { storage } from "./storage";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Catering Events';

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

function getField(record: AirtableRecord, fieldName: string): string {
  const val = record.fields[fieldName];
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return '';
  return String(val);
}

function extractPax(...texts: string[]): number {
  for (const text of texts) {
    if (!text) continue;
    const paxMatch = text.match(/(?:ca\.?\s*)?(\d+)\s*pax/i);
    if (paxMatch) return parseInt(paxMatch[1]);
    const persMatch = text.match(/(?:ca\.?\s*)?(\d+)\s*pers(?:onen|\.)?/i);
    if (persMatch) return parseInt(persMatch[1]);
    const fuerMatch = text.match(/f[uü]r\s+(\d+)/i);
    if (fuerMatch) return parseInt(fuerMatch[1]);
  }
  return 0;
}

function extractDateFromText(text: string): string {
  if (!text) return '';
  const currentYear = new Date().getFullYear();
  const fullMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (fullMatch) {
    const day = fullMatch[1].padStart(2, '0');
    const month = fullMatch[2].padStart(2, '0');
    let year = fullMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const shortMatch = text.match(/(\d{1,2})\.(\d{1,2})\./);
  if (shortMatch) {
    const day = shortMatch[1].padStart(2, '0');
    const month = shortMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }
  return '';
}

function extractTimesFromField(value: string): { timeStart: string; timeEnd: string; rest: string } {
  if (!value) return { timeStart: '', timeEnd: '', rest: '' };
  const timeRegex = /(\d{1,2})[.:](\d{2})(?:\s*Uhr)?/g;
  const times: string[] = [];
  let rest = value;
  let match;
  while ((match = timeRegex.exec(value)) !== null) {
    const hours = parseInt(match[1]);
    const afterMatch = value.substring(match.index + match[0].length);
    if (afterMatch.startsWith('.')) continue;
    if (hours > 24) continue;
    times.push(`${match[1].padStart(2, '0')}:${match[2]}`);
    rest = rest.replace(match[0], '').trim();
  }
  rest = rest.replace(/^[\s,;:\-–|/]+|[\s,;:\-–|/]+$/g, '').replace(/\s{2,}/g, ' ').trim();
  return { timeStart: times[0] || '', timeEnd: times[1] || '', rest };
}

function mapEventType(airtableType: string): string {
  if (!airtableType) return 'sonstiges';
  const t = airtableType.toLowerCase().trim();
  if (t.includes('brunch')) return 'brunch';
  if (t.includes('ball')) return 'ball';
  if (t.includes('buffet')) return 'buffet';
  if (t.includes('bankett')) return 'bankett';
  if (t.includes('empfang') || t.includes('reception')) return 'empfang';
  if (t.includes('seminar') || t.includes('tagung') || t.includes('konferenz') || t.includes('workshop')) return 'seminar';
  return 'sonstiges';
}

function mapStatus(airtableStatus: string): string {
  if (!airtableStatus) return 'geplant';
  const s = airtableStatus.toLowerCase().trim();
  if (s === 'scheduled' || s === 'geplant') return 'geplant';
  if (s === 'confirmed' || s === 'bestaetigt' || s === 'bestätigt') return 'bestaetigt';
  if (s === 'cancelled' || s === 'canceled' || s === 'abgesagt') return 'abgesagt';
  if (s === 'completed' || s === 'abgeschlossen') return 'abgeschlossen';
  return 'geplant';
}

export function getAirtableStatus() {
  return {
    configured: !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID),
    baseId: AIRTABLE_BASE_ID ? `${AIRTABLE_BASE_ID.slice(0, 6)}...` : '',
    tableName: AIRTABLE_TABLE_NAME,
  };
}

export async function testAirtableConnection(apiKey?: string, baseId?: string, tableName?: string) {
  const testKey = apiKey || AIRTABLE_API_KEY;
  const testBase = baseId || AIRTABLE_BASE_ID;
  const testTable = tableName || AIRTABLE_TABLE_NAME;

  if (!testKey || !testBase) {
    throw new Error('API Key und Base ID erforderlich');
  }

  const url = `https://api.airtable.com/v0/${testBase}/${encodeURIComponent(testTable)}?maxRecords=1`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${testKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable Verbindung fehlgeschlagen: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as AirtableResponse;
  return {
    ok: true,
    message: 'Verbindung erfolgreich',
    availableFields: data.records.length > 0 ? Object.keys(data.records[0].fields) : [],
    recordCount: data.records.length,
  };
}

async function fetchAllAirtableRecords(): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`);
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!response.ok) throw new Error(`Airtable API: ${response.status} ${response.statusText}`);
    const data = await response.json() as AirtableResponse;
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);
  return allRecords;
}

export async function syncAirtableEvents(): Promise<{ synced: number; created: number; updated: number; errors: string[] }> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable nicht konfiguriert. Setze AIRTABLE_API_KEY und AIRTABLE_BASE_ID in .env');
  }

  const records = await fetchAllAirtableRecords();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  for (const record of records) {
    try {
      const eventName = getField(record, 'Event Name');
      const date = getField(record, 'Event Date');
      const eventTimeRaw = getField(record, 'Event Time');
      const endTimeRaw = getField(record, 'End Time');
      const typeOfEvent = getField(record, 'Type of Event');
      const specialRequests = getField(record, 'Special Requests');
      const statusRaw = getField(record, 'Status');

      const resolvedDate = date || extractDateFromText(eventName);
      if (!resolvedDate) { errors.push(`Record ${record.id}: Kein Datum`); continue; }

      const { timeStart, timeEnd: timeEndFromEvent, rest: timeOverflow } = extractTimesFromField(eventTimeRaw);
      const { timeStart: endTimeExplicit } = extractTimesFromField(endTimeRaw);
      const timeEnd = endTimeExplicit || timeEndFromEvent;
      const menuNotes = [timeOverflow, specialRequests].filter(Boolean).join('\n');
      const pax = extractPax(eventName, eventTimeRaw);

      const existing = await storage.getCateringEventByAirtableId(record.id);

      if (existing) {
        await storage.updateCateringEvent(existing.id, {
          date: resolvedDate,
          eventType: mapEventType(typeOfEvent),
          personCount: pax,
          timeStart,
          timeEnd,
          eventName,
          notes: menuNotes,
          status: mapStatus(statusRaw),
        });
        updated++;
      } else {
        await storage.createCateringEvent({
          clientName: 'AK',
          eventName,
          date: resolvedDate,
          time: timeStart,
          personCount: pax,
          dishes: [],
          notes: menuNotes,
          eventType: mapEventType(typeOfEvent),
          timeStart,
          timeEnd,
          status: mapStatus(statusRaw),
          airtableId: record.id,
        });
        created++;
      }
    } catch (err) {
      errors.push(`Record ${record.id}: ${err instanceof Error ? err.message : 'Fehler'}`);
    }
  }

  return { synced: records.length, created, updated, errors };
}

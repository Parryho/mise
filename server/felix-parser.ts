/**
 * Felix Pensionsliste parser.
 * Extracts guest counts from OCR text or PDF text.
 * Ported from Menuplaner (Project A) - framework-agnostic TypeScript.
 */

export interface DayCount {
  date: string;
  day: string;
  gesamtPax: number;
  fruehstueck: number;
  kpVorm: number;
  mittag: number;
  kpNach: number;
  abendE: number;
  abendK: number;
  abendGesamt: number;
  confidence: number;
}

export interface FelixResult {
  hotel: string;
  zeitraum: string;
  days: DayCount[];
  rawText?: string;
}

const DAY_ABBREVS: Record<string, string> = {
  montag: 'Mo', dienstag: 'Di', mittwoch: 'Mi', donnerstag: 'Do',
  freitag: 'Fr', samstag: 'Sa', sonntag: 'So',
  mo: 'Mo', di: 'Di', mi: 'Mi', do: 'Do', fr: 'Fr', sa: 'Sa', so: 'So',
};

const DAY_OCR_FIXES: Record<string, string> = {
  er: 'Fr', oi: 'Di', oo: 'Do', '0i': 'Di', '0o': 'Do',
};

const GARBAGE_PATTERNS = [
  /^[A-Z]{2,6}$/, /^[a-z]{2,4}$/,
  /FORD|BABE|SWEET|VULCE|BORN|DERN?/i,
  /^[.,\-_|]+$/, /^N$/i, /^a$/i, /^S$/i,
  /Seite \d/i, /\.rpt$/i, /Hotel.*Report/i,
];

function fixOcrToken(token: string): string {
  const digitCount = (token.match(/\d/g) || []).length;
  if (digitCount === 0 && token.length > 1) return token;
  return token.replace(/[oO]/g, '0').replace(/[lI]/g, '1').replace(/[Bb]/g, '8').replace(/[Zz]/g, '2');
}

function extractDate(line: string): string | null {
  const m = line.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yy = m[3].length === 2 ? m[3] : m[3].slice(2);
  return `${dd}.${mm}.${yy}`;
}

function extractDay(line: string): string {
  const lower = line.toLowerCase();
  for (const [key, abbr] of Object.entries(DAY_ABBREVS)) {
    if (lower.includes(key)) return abbr;
  }
  const tokens = line.split(/[\s|.,]+/).filter(Boolean);
  for (const token of tokens) {
    const t = token.toLowerCase().replace(/[|]/g, '');
    if (t.length === 2) {
      const fix = DAY_OCR_FIXES[t];
      if (fix) return fix;
    }
  }
  return '';
}

function isGarbageToken(token: string): boolean {
  return GARBAGE_PATTERNS.some(p => p.test(token));
}

function extractNumbers(line: string): number[] {
  let cleaned = line.replace(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/, '   ');
  cleaned = cleaned.replace(/\|/g, ' ');
  for (const key of Object.keys(DAY_ABBREVS)) {
    cleaned = cleaned.replace(new RegExp(key, 'gi'), '   ');
  }
  for (const key of Object.keys(DAY_OCR_FIXES)) {
    cleaned = cleaned.replace(new RegExp(`\\b${key}\\b`, 'gi'), '   ');
  }
  cleaned = cleaned.replace(/ges(?:amt)?\.?/gi, '   ');
  cleaned = cleaned.replace(/[A-Z]{2,}\s+\d+\s+[A-Z]{2,}/g, '   ');

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const numbers: number[] = [];
  for (const token of tokens) {
    if (isGarbageToken(token)) continue;
    if (/^[a-zA-ZÄÖÜäöüß]+$/.test(token)) continue;
    if (token.length === 1 && !/\d/.test(token)) continue;
    if (/^[.,\-_]+$/.test(token)) continue;
    const fixed = fixOcrToken(token);
    const num = parseInt(fixed, 10);
    if (!isNaN(num) && num >= 0) numbers.push(num);
  }
  return numbers;
}

function detectHeaderColumns(lines: string[]): number {
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasGesamt = lower.includes('ges');
    const hasFrueh = lower.includes('fr') && (lower.includes('hst') || lower.includes('üh'));
    const hasMittag = lower.includes('mittag');
    const hasAbend = lower.includes('abend');
    if ((hasGesamt ? 1 : 0) + (hasFrueh ? 1 : 0) + (hasMittag ? 1 : 0) + (hasAbend ? 1 : 0) >= 2) {
      let cols = 0;
      if (hasGesamt) cols++;
      if (hasFrueh) cols++;
      if (lower.includes('kp') || lower.includes('kaffeepause')) cols += 2;
      if (hasMittag) cols++;
      if (hasAbend) cols += 2;
      return Math.max(cols, 7);
    }
  }
  return 7;
}

function computeConfidence(day: Partial<DayCount>, hasDate: boolean, hasDay: boolean, numCount: number): number {
  let score = 0;
  if (hasDate) score += 0.3;
  if (hasDay) score += 0.15;
  if (numCount >= 5 && numCount <= 7) score += 0.25;
  else if (numCount >= 3) score += 0.15;
  else if (numCount >= 2) score += 0.05;
  if (day.gesamtPax && day.gesamtPax > 1) {
    if (day.mittag !== undefined && day.gesamtPax >= day.mittag) score += 0.1;
    if (day.abendGesamt !== undefined && day.gesamtPax >= day.abendGesamt) score += 0.1;
  }
  const vals = [day.gesamtPax, day.fruehstueck, day.mittag, day.abendE, day.abendK].filter(v => v !== undefined);
  if (vals.length > 0 && vals.every(v => v! >= 0 && v! <= 500)) score += 0.1;
  return Math.min(1, score);
}

function assignColumns(nums: number[]): Omit<DayCount, 'date' | 'day' | 'confidence'> {
  if (nums.length >= 7) {
    return { gesamtPax: nums[0], fruehstueck: nums[1], kpVorm: nums[2], mittag: nums[3], kpNach: nums[4], abendE: nums[5], abendK: nums[6], abendGesamt: nums[5] + nums[6] };
  }
  if (nums.length === 6) {
    return { gesamtPax: nums[0], fruehstueck: nums[1], kpVorm: nums[2], mittag: nums[3], kpNach: nums[4], abendE: 0, abendK: nums[5], abendGesamt: nums[5] };
  }
  if (nums.length === 5) {
    return { gesamtPax: nums[0], fruehstueck: nums[1], kpVorm: 0, mittag: nums[2], kpNach: 0, abendE: nums[3], abendK: nums[4], abendGesamt: nums[3] + nums[4] };
  }
  if (nums.length === 4) {
    return { gesamtPax: nums[0], fruehstueck: nums[1], kpVorm: 0, mittag: nums[2], kpNach: 0, abendE: nums[3], abendK: 0, abendGesamt: nums[3] };
  }
  if (nums.length === 3) {
    return { gesamtPax: nums[0], fruehstueck: nums[1], kpVorm: 0, mittag: nums[2], kpNach: 0, abendE: 0, abendK: 0, abendGesamt: 0 };
  }
  return { gesamtPax: nums[0] || 0, fruehstueck: nums[1] || 0, kpVorm: 0, mittag: 0, kpNach: 0, abendE: 0, abendK: 0, abendGesamt: 0 };
}

function isValidDataLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (!lower.includes('ges')) return false;
  if (lower.includes('vegan') || lower.includes('vegetarisch')) return false;
  if (lower.includes('universität') || lower.includes('gymnasium')) return false;
  if (lower.includes('bitte') || lower.includes('verpflegung')) return false;
  if (lower.includes('sem ') || lower.includes('gross') || lower.includes('hinrichs')) return false;
  if (lower.includes('seite') || lower.includes('.rpt') || lower.includes('report')) return false;
  if (lower.includes('pensionsliste') && lower.includes('von')) return false;
  return true;
}

function preprocessOcrText(text: string): string {
  return text.split('\n').map(line => {
    let cleaned = line;
    cleaned = cleaned.replace(/[A-Z]{3,}(?:[ \t]+[A-Z]{2,})+/g, ' ');
    cleaned = cleaned.replace(/\b[A-Z]{2}[ \t]+[A-Z]{2}[ \t]+[A-Z]{2}\b/g, ' ');
    cleaned = cleaned.replace(/[ \t]{3,}/g, '  ');
    return cleaned;
  }).join('\n');
}

export function parseFelixText(text: string): FelixResult {
  const processedText = preprocessOcrText(text);
  const lines = processedText.split('\n').map(l => l.trim()).filter(Boolean);
  const days: DayCount[] = [];

  detectHeaderColumns(lines);

  for (const line of lines) {
    const date = extractDate(line);
    if (!date) continue;
    if (!isValidDataLine(line)) continue;
    if (/\b(jan|feb|mär|apr|mai|jun|jul|aug|sep|okt|nov|dez)\b/i.test(line) && line.toLowerCase().includes('pensionsliste')) continue;

    const nums = extractNumbers(line);
    const dayName = extractDay(line);
    if (nums.length < 2) continue;

    const columns = assignColumns(nums);
    const confidence = computeConfidence({ ...columns }, true, dayName !== '', nums.length);
    days.push({ date, day: dayName, ...columns, confidence });
  }

  if (days.length === 0) {
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!lower.includes('ges') && !lower.includes('total')) continue;
      const nums = extractNumbers(line);
      if (nums.length < 2) continue;
      days.push({ date: '', day: '', ...assignColumns(nums), confidence: 0.2 });
    }
  }

  if (days.length > 1) {
    days.sort((a, b) => {
      const parseDate = (d: string) => {
        if (!d) return 99999999;
        const [dd, mm, yy] = d.split('.').map(Number);
        return (2000 + yy) * 10000 + mm * 100 + dd;
      };
      return parseDate(a.date) - parseDate(b.date);
    });
  }

  let hotel = '';
  const fullText = text.toLowerCase();
  if (fullText.includes('süd') || fullText.includes('sud') || fullText.includes('sued')) hotel = 'sued';
  else if (fullText.includes('city')) hotel = 'city';

  let zeitraum = '';
  const zeitraumMatch = text.match(/von\s+(\d{1,2}\.\d{1,2}\.\d{2,4})\s+bis\s+(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
  if (zeitraumMatch) zeitraum = `${zeitraumMatch[1]} – ${zeitraumMatch[2]}`;

  return { hotel, zeitraum, days, rawText: text };
}

export function confidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-red-100 text-red-800 border-red-300',
} as const;

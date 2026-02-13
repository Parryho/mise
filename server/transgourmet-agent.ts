/**
 * Transgourmet Bestell-Agent
 * Automatisiert Login + Warenkorb-Befüllung via Playwright
 *
 * Workflow: Login → Portal (JS-Bundles) → Schnellerfassung-Widget
 * WICHTIG: Schnellerfassung nur als Widget vom Portal aus nutzbar,
 * nicht als eigenständige Seite (kein JS ohne Portal-Context).
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import path from "path";
import fs from "fs";

const SHOP_URL = "https://shop.transgourmet.at";
const LOGIN_URL = `${SHOP_URL}/simplelogin`;
const PORTAL_URL = `${SHOP_URL}/portal`;

// Reuse session cookies across calls
let savedCookies: any[] | null = null;

interface OrderItem {
  artikelNr: string;
  name: string;
  menge: number;
}

interface AgentResult {
  success: boolean;
  cartUrl?: string;
  itemsAdded: number;
  itemsFailed: string[];
  screenshot?: string; // base64
  error?: string;
}

function getCredentials() {
  const user = process.env.TRANSGOURMET_USER;
  const pass = process.env.TRANSGOURMET_PASSWORD;
  if (!user || !pass) throw new Error("TRANSGOURMET_USER/PASSWORD nicht in .env gesetzt");
  return { user, pass };
}

async function launchBrowser(): Promise<Browser> {
  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium";
  return chromium.launch({
    headless: true,
    executablePath: fs.existsSync(execPath) ? execPath : undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

async function createContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  // Block Cookiebot to prevent cookie banner from blocking interactions
  await context.route("**/consent.cookiebot.eu/**", route => route.abort());
  if (savedCookies) await context.addCookies(savedCookies);
  return context;
}

async function login(page: Page): Promise<boolean> {
  const { user, pass } = getCredentials();

  await page.goto(LOGIN_URL, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Login form: #cid = Kundennummer, #password = Passwort
  await page.fill("#cid", user);
  await page.fill("#password", pass);
  await page.click('button[name="btn_login"]');
  await page.waitForTimeout(8000);

  const isLoggedIn = page.url().includes("portal");
  if (isLoggedIn) {
    savedCookies = await page.context().cookies();
  }
  return isLoggedIn;
}

/** Navigate to portal and open Schnellerfassung widget */
async function openSchnellerfassung(page: Page): Promise<boolean> {
  // Go to portal (has all JS bundles)
  await page.goto(PORTAL_URL, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Login if redirected
  if (page.url().includes("simplelogin")) {
    const ok = await login(page);
    if (!ok) return false;
    await page.goto(PORTAL_URL, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(5000);
  }

  // Click Schnellerfassung link → loads as widget in portal
  const link = await page.$('a[href*="quickadd"]');
  if (!link) return false;
  await link.click();
  await page.waitForTimeout(3000);

  // Verify quickadd widget is visible
  const visible = await page.evaluate(() => {
    const el = document.querySelector(".quickadd");
    return el ? el.offsetParent !== null : false;
  });
  return visible;
}

/**
 * Screenshot der Schnellerfassung
 */
export async function screenshotSchnellerfassung(): Promise<string> {
  const browser = await launchBrowser();
  try {
    const context = await createContext(browser);
    const page = await context.newPage();

    const ok = await openSchnellerfassung(page);
    if (!ok) throw new Error("Schnellerfassung konnte nicht geöffnet werden");

    const screenshot = await page.screenshot({ fullPage: true });
    savedCookies = await context.cookies();
    await context.close();
    return screenshot.toString("base64");
  } finally {
    await browser.close();
  }
}

/**
 * Hauptfunktion: Artikel in den Transgourmet-Warenkorb legen
 *
 * Workflow:
 * 1. Portal öffnen (lädt JS-Bundles)
 * 2. Schnellerfassung-Widget öffnen
 * 3. Pro Artikel: Artikelnr + Menge eingeben → "Hinzufügen" klicken
 * 4. "Alle hinzufügen" klicken → ab in den Warenkorb
 */
export async function addToCart(items: OrderItem[]): Promise<AgentResult> {
  if (items.length === 0) {
    return { success: true, itemsAdded: 0, itemsFailed: [] };
  }

  const browser = await launchBrowser();
  const itemsFailed: string[] = [];
  let itemsAdded = 0;

  try {
    const context = await createContext(browser);
    const page = await context.newPage();

    // Open Schnellerfassung widget via Portal
    const ok = await openSchnellerfassung(page);
    if (!ok) {
      return { success: false, itemsAdded: 0, itemsFailed: items.map(i => i.name), error: "Schnellerfassung nicht verfügbar" };
    }

    // Add each item via quickadd form
    for (const item of items) {
      try {
        const artnr = await page.$(".js-quickadd__input--artnr");
        const quant = await page.$(".js-quickadd__input--quant");
        if (!artnr || !quant) {
          itemsFailed.push(item.name);
          continue;
        }

        await artnr.fill(item.artikelNr);
        await quant.fill(String(item.menge));
        await page.click(".js-quickadd__btn-add");
        await page.waitForTimeout(2000);

        // Check if item was added to the table
        const added = await page.evaluate((artNr) => {
          const rows = document.querySelectorAll(".quickadd__table-container tbody tr");
          return Array.from(rows).some(r => r.textContent?.includes(artNr));
        }, item.artikelNr);

        if (added) {
          itemsAdded++;
        } else {
          itemsFailed.push(item.name);
        }
      } catch {
        itemsFailed.push(item.name);
      }
    }

    // Transfer all items to cart
    if (itemsAdded > 0) {
      const confirmBtn = await page.$(".js-quickadd__btn-confirm");
      if (confirmBtn) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    savedCookies = await context.cookies();
    const cartUrl = `${SHOP_URL}/order`;
    const screenshot = await page.screenshot({ fullPage: false });
    await context.close();

    return {
      success: itemsAdded > 0,
      cartUrl,
      itemsAdded,
      itemsFailed,
      screenshot: screenshot.toString("base64"),
    };
  } catch (error: any) {
    return {
      success: false,
      itemsAdded,
      itemsFailed: items.map(i => i.name),
      error: error.message,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Katalog-Matching: Order-Items gegen Transgourmet-Katalog matchen
 */
interface CatalogItem {
  artikelNr: string;
  name: string;
  kategorie: string;
  preis: number;
  einheit: string;
}

interface MatchResult {
  orderItemName: string;
  orderItemAmount: string | null;
  match: CatalogItem | null;
  confidence: number;
  suggestedQty: number;
}

let catalogCache: CatalogItem[] | null = null;

function loadCatalog(): CatalogItem[] {
  if (catalogCache) return catalogCache;
  const catalogPath = path.join(process.cwd(), "data", "transgourmet-catalog.json");
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  catalogCache = raw.items as CatalogItem[];
  return catalogCache;
}

/**
 * Lokaler String-Match (ohne AI)
 */
function localMatch(itemName: string, catalog: CatalogItem[]): { item: CatalogItem; score: number } | null {
  const needle = itemName.toLowerCase().trim();
  let bestMatch: CatalogItem | null = null;
  let bestScore = 0;

  for (const ci of catalog) {
    const haystack = ci.name.toLowerCase();

    // Exact match
    if (haystack === needle) return { item: ci, score: 1.0 };

    // Contains
    if (haystack.includes(needle) || needle.includes(haystack.split(" ")[0])) {
      const score = needle.length / haystack.length;
      if (score > bestScore) {
        bestScore = Math.min(score, 0.9);
        bestMatch = ci;
      }
    }

    // First word match (e.g. "Mehl" matches "Economy Weizenmehl T480 1kg glatt")
    const words = needle.split(/\s+/);
    for (const word of words) {
      if (word.length >= 3 && haystack.includes(word)) {
        const score = 0.5 + (word.length / haystack.length) * 0.3;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = ci;
        }
      }
    }
  }

  return bestMatch && bestScore > 0.3 ? { item: bestMatch, score: bestScore } : null;
}

/**
 * AI-gestütztes Matching via Gemini
 */
async function aiMatch(
  orderItems: { name: string; amount: string | null }[],
  catalog: CatalogItem[]
): Promise<MatchResult[]> {
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleKey) return []; // Fallback to local

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Build compact catalog reference (only name + artikelNr to save tokens)
    const catalogRef = catalog.map(c => `${c.artikelNr}|${c.name}`).join("\n");

    const itemList = orderItems.map(i => `${i.amount || "?"} ${i.name}`).join("\n");

    const prompt = `Du bist ein Küchen-Einkaufsassistent. Ordne die Bestellliste den Transgourmet-Artikeln zu.

BESTELLLISTE:
${itemList}

TRANSGOURMET-KATALOG (ArtikelNr|Name):
${catalogRef}

Antworte NUR mit validem JSON:
{
  "matches": [
    {"orderItem": "Mehl", "artikelNr": "3386547", "confidence": 0.95, "qty": 10},
    {"orderItem": "Butter", "artikelNr": "3865938", "confidence": 0.9, "qty": 5}
  ]
}

Regeln:
- Finde den passendsten Artikel aus dem Katalog
- confidence 0.0-1.0
- qty: geschätzte Bestellmenge basierend auf der Mengenangabe und Gebindegröße
- Wenn kein passender Artikel gefunden, artikelNr=null
- Österreichische Küchenbegriffe beachten`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.matches || []).map((m: any) => {
      const catalogItem = catalog.find(c => c.artikelNr === m.artikelNr) || null;
      const orderItem = orderItems.find(i => i.name.toLowerCase().includes(m.orderItem.toLowerCase())) || orderItems[0];
      return {
        orderItemName: m.orderItem,
        orderItemAmount: orderItem?.amount || null,
        match: catalogItem,
        confidence: m.confidence || 0,
        suggestedQty: m.qty || 1,
      };
    });
  } catch (error) {
    console.error("AI match failed:", error);
    return [];
  }
}

/**
 * Haupt-Matching: Erst AI, dann lokaler Fallback
 */
export async function matchOrderItems(
  orderItems: { name: string; amount: string | null }[]
): Promise<MatchResult[]> {
  const catalog = loadCatalog();

  // Try AI matching first
  const aiResults = await aiMatch(orderItems, catalog);
  if (aiResults.length > 0) return aiResults;

  // Fallback: local matching
  return orderItems.map(item => {
    const match = localMatch(item.name, catalog);
    return {
      orderItemName: item.name,
      orderItemAmount: item.amount,
      match: match?.item || null,
      confidence: match?.score || 0,
      suggestedQty: 1,
    };
  });
}

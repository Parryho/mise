/**
 * Transgourmet Bestell-Agent
 * Automatisiert Login + Warenkorb-Befüllung via Playwright
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import path from "path";
import fs from "fs";

const SHOP_URL = "https://shop.transgourmet.at";
const LOGIN_URL = `${SHOP_URL}/simplelogin`;
const SCHNELLERFASSUNG_URL = `${SHOP_URL}/de/functions/Schnellerfassung`;

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

async function login(page: Page): Promise<boolean> {
  const { user, pass } = getCredentials();

  await page.goto(LOGIN_URL, { waitUntil: "networkidle", timeout: 30000 });

  // Fill login form
  await page.fill('input[name="username"], input[name="j_username"], #username', user);
  await page.fill('input[name="password"], input[name="j_password"], #password', pass);

  // Click login button
  await page.click('button[type="submit"], input[type="submit"]');

  // Wait for redirect (successful login redirects away from /simplelogin)
  await page.waitForURL((url) => !url.pathname.includes("simplelogin"), { timeout: 15000 }).catch(() => {});

  const isLoggedIn = !page.url().includes("simplelogin");
  if (isLoggedIn) {
    // Save cookies for reuse
    savedCookies = await page.context().cookies();
  }
  return isLoggedIn;
}

/**
 * Screenshot der Schnellerfassung — zum Debuggen der Form-Struktur
 */
export async function screenshotSchnellerfassung(): Promise<string> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext();
    if (savedCookies) await context.addCookies(savedCookies);
    const page = await context.newPage();

    // Check if session still valid
    await page.goto(SCHNELLERFASSUNG_URL, { waitUntil: "networkidle", timeout: 30000 });
    if (page.url().includes("simplelogin")) {
      await login(page);
      await page.goto(SCHNELLERFASSUNG_URL, { waitUntil: "networkidle", timeout: 30000 });
    }

    const screenshot = await page.screenshot({ fullPage: true });
    await context.close();
    return screenshot.toString("base64");
  } finally {
    await browser.close();
  }
}

/**
 * Hauptfunktion: Artikel in den Transgourmet-Warenkorb legen
 */
export async function addToCart(items: OrderItem[]): Promise<AgentResult> {
  if (items.length === 0) {
    return { success: true, itemsAdded: 0, itemsFailed: [] };
  }

  const browser = await launchBrowser();
  const itemsFailed: string[] = [];
  let itemsAdded = 0;

  try {
    const context = await browser.newContext();
    if (savedCookies) await context.addCookies(savedCookies);
    const page = await context.newPage();

    // Navigate to Schnellerfassung
    await page.goto(SCHNELLERFASSUNG_URL, { waitUntil: "networkidle", timeout: 30000 });

    // Login if needed
    if (page.url().includes("simplelogin")) {
      const loggedIn = await login(page);
      if (!loggedIn) {
        return { success: false, itemsAdded: 0, itemsFailed: items.map(i => i.name), error: "Login fehlgeschlagen" };
      }
      await page.goto(SCHNELLERFASSUNG_URL, { waitUntil: "networkidle", timeout: 30000 });
    }

    // Try to find the Schnellerfassung form
    // Common patterns: article number input + quantity input + add button
    // We need to inspect the actual page structure

    // Strategy 1: Look for article number input fields
    const artInputs = await page.$$('input[name*="artnr"], input[name*="artikel"], input[name*="artNr"], input[placeholder*="Artikel"]');

    if (artInputs.length > 0) {
      // Schnellerfassung has input rows for article numbers
      for (const item of items) {
        try {
          // Find empty article number field
          const artInput = await page.$('input[name*="artnr"]:not([value]), input[name*="artikel"]:not([value]), input[placeholder*="Artikel"]');
          if (!artInput) {
            // Try adding a new row if possible
            const addRowBtn = await page.$('button:has-text("Zeile"), a:has-text("Zeile"), button:has-text("hinzufügen")');
            if (addRowBtn) await addRowBtn.click();
          }

          // Fill article number
          const currentArtInput = await page.$('input[name*="artnr"]:last-of-type, input[name*="artikel"]:last-of-type');
          if (currentArtInput) {
            await currentArtInput.fill(item.artikelNr);

            // Fill quantity (usually next sibling input or named "menge"/"quantity")
            const quantInput = await page.$(`input[name*="menge"], input[name*="quantity"], input[name*="quant"]`);
            if (quantInput) await quantInput.fill(String(item.menge));

            // Tab out to trigger validation/lookup
            await currentArtInput.press("Tab");
            await page.waitForTimeout(500);

            itemsAdded++;
          } else {
            itemsFailed.push(item.name);
          }
        } catch (err) {
          itemsFailed.push(item.name);
        }
      }

      // Submit / add to cart
      const submitBtn = await page.$('button:has-text("Warenkorb"), button:has-text("bestellen"), button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      // Strategy 2: Use search + add to cart for each item
      for (const item of items) {
        try {
          await page.goto(`${SHOP_URL}/search?query=${encodeURIComponent(item.artikelNr)}`, { waitUntil: "networkidle", timeout: 15000 });

          // Find quantity input and add-to-cart button for this product
          const quantInput = await page.$(`input[name*="quant_"], input[name*="quantity"]`);
          if (quantInput) {
            await quantInput.fill(String(item.menge));
          }

          const addBtn = await page.$('button:has-text("Warenkorb"), button.add-to-cart, button[title*="Warenkorb"]');
          if (addBtn) {
            await addBtn.click();
            await page.waitForTimeout(1000);
            itemsAdded++;
          } else {
            itemsFailed.push(item.name);
          }
        } catch (err) {
          itemsFailed.push(item.name);
        }
      }
    }

    // Save cookies for next time
    savedCookies = await context.cookies();

    // Get cart URL
    const cartUrl = `${SHOP_URL}/de/cart`;

    // Take screenshot of final state
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

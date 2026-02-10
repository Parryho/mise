/**
 * Validate and fix broken recipe images.
 *
 * 1. HEAD-request every recipe.image URL
 * 2. Broken → re-scrape from source_url (JSON-LD / og:image)
 * 3. Still broken → set to NULL (client-side SVG placeholder handles it)
 * 4. Log every change
 *
 * Usage:
 *   npx tsx script/validate-recipe-images.ts --dry-run
 *   npx tsx script/validate-recipe-images.ts
 *   DATABASE_URL=postgresql://... npx tsx script/validate-recipe-images.ts
 */

import { Pool } from "pg";
import * as cheerio from "cheerio";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@127.0.0.1:5432/mise";
const DRY_RUN = process.argv.includes("--dry-run");
const TIMEOUT_MS = 10000;
const SCRAPE_DELAY_MS = 400;

function log(msg: string) {
  console.log(`[validate] ${msg}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Validate image URL ──

async function isImageValid(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return true;
    // Some servers reject HEAD, retry with GET + range header
    if (res.status === 405 || res.status === 403) {
      const getRes = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Range": "bytes=0-0",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return getRes.ok || getRes.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Scrape image from source URL ──

async function scrapeImageFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. JSON-LD
    for (const script of $('script[type="application/ld+json"]').toArray()) {
      try {
        const data = JSON.parse($(script).html() || "");
        const img = findImageInJsonLd(data);
        if (img) return img;
      } catch { continue; }
    }

    // 2. og:image
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && ogImage.startsWith("http")) return ogImage;

    // 3. CSS selectors
    const selectors = [
      "img.recipe-image", ".recipe-main-image img", ".recipe-image img",
      "img.ds-image", ".main-image img", 'img[class*="recipe"]', 'img[class*="rezept"]',
    ];
    for (const sel of selectors) {
      const src = $(sel).first().attr("src");
      if (src && src.startsWith("http")) return src;
    }

    return null;
  } catch {
    return null;
  }
}

function findImageInJsonLd(data: any): string | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findImageInJsonLd(item);
      if (r) return r;
    }
    return null;
  }
  if (data && (data["@type"] === "Recipe" || (Array.isArray(data["@type"]) && data["@type"].includes("Recipe")))) {
    if (!data.image) return null;
    if (typeof data.image === "string") return data.image;
    if (Array.isArray(data.image)) {
      const first = data.image[0];
      return typeof first === "string" ? first : first?.url || null;
    }
    return data.image.url || null;
  }
  if (data && data["@graph"]) return findImageInJsonLd(data["@graph"]);
  return null;
}

// ── Main ──

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  log(`Database: ${DB_URL.replace(/:[^:@]+@/, ":***@")}`);
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  const { rows: recipes } = await pool.query(
    `SELECT id, name, category, image, source_url FROM recipes ORDER BY id`
  );
  log(`Rezepte gesamt: ${recipes.length}\n`);

  let valid = 0;
  let fixed = 0;
  let cleared = 0;
  const changes: { id: number; name: string; oldImage: string; newImage: string | null; reason: string }[] = [];

  // Batch: validate all images first (parallel, 20 at a time)
  log("Phase 1: Validiere alle Bild-URLs...");
  const BATCH_SIZE = 20;
  const validationResults: boolean[] = new Array(recipes.length);

  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(r => isImageValid(r.image)));
    for (let j = 0; j < results.length; j++) {
      validationResults[i + j] = results[j];
    }
    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= recipes.length) {
      log(`  ... ${Math.min(i + BATCH_SIZE, recipes.length)}/${recipes.length} geprüft`);
    }
  }

  const brokenCount = validationResults.filter(v => !v).length;
  log(`\nErgebnis: ${recipes.length - brokenCount} gültig, ${brokenCount} kaputt\n`);

  if (brokenCount === 0) {
    log("Alle Bilder sind gültig! Nichts zu tun.");
    await pool.end();
    return;
  }

  // Phase 2: Fix broken images
  log("Phase 2: Repariere kaputte Bilder...");
  for (let i = 0; i < recipes.length; i++) {
    if (validationResults[i]) {
      valid++;
      continue;
    }

    const recipe = recipes[i];
    const oldImage = recipe.image || "";
    let newImage: string | null = null;
    let reason = "";

    // Strategy 1: re-scrape from source_url
    if (recipe.source_url) {
      newImage = await scrapeImageFromUrl(recipe.source_url);
      if (newImage) {
        // Verify the scraped image is actually reachable
        const scraped_valid = await isImageValid(newImage);
        if (scraped_valid) {
          reason = `re-scraped from ${new URL(recipe.source_url).hostname}`;
        } else {
          newImage = null; // scraped image also broken
        }
      }
      await sleep(SCRAPE_DELAY_MS);
    }

    // Strategy 2: set to NULL — client-side SVG placeholder handles display
    if (!newImage) {
      reason = recipe.source_url ? "scrape failed → cleared (client SVG fallback)" : "no source_url → cleared (client SVG fallback)";
    }

    changes.push({
      id: recipe.id,
      name: recipe.name,
      oldImage: oldImage.substring(0, 70),
      newImage: newImage ? newImage.substring(0, 70) : "NULL",
      reason,
    });

    if (!DRY_RUN) {
      await pool.query(`UPDATE recipes SET image = $1 WHERE id = $2`, [newImage, recipe.id]);
    }

    if (newImage) {
      fixed++;
    } else {
      cleared++;
    }
  }

  // Print changes
  if (changes.length > 0) {
    log("\n══ Änderungen ══");
    for (const c of changes) {
      log(`  ID ${c.id}: ${c.name}`);
      log(`    Old: ${c.oldImage}...`);
      log(`    New: ${c.newImage}${c.newImage !== "NULL" ? "..." : ""}`);
      log(`    Reason: ${c.reason}`);
    }
  }

  log("\n══ Zusammenfassung ══");
  log(`Geprüft: ${recipes.length}`);
  log(`Gültig: ${valid}`);
  log(`Repariert (re-scraped): ${fixed}`);
  log(`Auf NULL gesetzt (SVG-Fallback): ${cleared}`);
  log("=== Fertig ===");

  await pool.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });

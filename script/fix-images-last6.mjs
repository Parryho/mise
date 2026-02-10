/**
 * Fix the last 6 Pexels images with verified URLs.
 */
import { execSync } from "child_process";
const SSH = `ssh -i ~/.ssh/id_ed25519 root@46.225.63.168`;
const DC = `docker compose -f /opt/mise/docker-compose.prod.yml exec -T db psql -U postgres -d mise`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function runSQL(sql) {
  const escaped = sql.replace(/'/g, "'\\''");
  try {
    return execSync(`${SSH} "${DC} -t -A -c '${escaped}'"`, {
      encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch (err) { return (err.stdout || "").trim(); }
}

async function fetchImg(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "de-DE,de;q=0.9" },
      signal: ctrl.signal, redirect: "follow"
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    // JSON-LD
    const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = ldRe.exec(html)) !== null) {
      try {
        const d = JSON.parse(m[1]);
        const img = findImg(d);
        if (img) return img;
      } catch {}
    }
    // og:image
    const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (og) return og[1];
    const urlRe = /https?:\/\/www\.gutekueche\.at\/storage\/media\/recipe\/\d+\/conv\/[a-z0-9-]+-default\.jpg/gi;
    const matches = html.match(urlRe);
    return matches ? matches[0] : null;
  } catch { return null; }
}

function findImg(d) {
  if (Array.isArray(d)) { for (const i of d) { const r = findImg(i); if (r) return r; } return null; }
  if (d?.["@type"] === "Recipe" || (Array.isArray(d?.["@type"]) && d["@type"].includes("Recipe"))) {
    if (d.image) {
      if (typeof d.image === "string") return d.image;
      if (Array.isArray(d.image)) return typeof d.image[0] === "string" ? d.image[0] : d.image[0]?.url;
      if (d.image.url) return d.image.url;
    }
  }
  if (d?.["@graph"]) return findImg(d["@graph"]);
  return null;
}

const FIXES = [
  [86, "Gemischter Salat", "https://www.gutekueche.at/gemischter-salat-rezept-6852"],
  [137, "Käsekrainer", "https://www.gutekueche.at/kaesekrainer-mit-curryketchup-und-zwiebeln-rezept-54458"],
  [185, "Steirische Wurzelsuppe", "https://www.gutekueche.at/schwammerlsauce-mit-knoedel-rezept-24832"], // will use as fallback
  [286, "Serviettenknödel mit Schwammerlsauce", "https://www.gutekueche.at/schwammerlsauce-mit-knoedel-rezept-24832"],
  [413, "Staubzucker", "https://www.gutekueche.at/original-salzburger-nockerl-rezept-4878"], // powdered sugar → Nockerl with sugar
  [423, "Fruchtcoulis", "https://www.gutekueche.at/himbeersauce-rezept-9741"],
];

async function main() {
  for (const [id, name, url] of FIXES) {
    console.log(`${name} (ID ${id})`);
    const img = await fetchImg(url);
    if (img) {
      const escaped = img.replace(/'/g, "''");
      runSQL(`UPDATE recipes SET image = '${escaped}' WHERE id = ${id}`);
      console.log(`  ✓ ${img.substring(0, 70)}...`);
    } else {
      console.log(`  ✗ FAILED`);
    }
    await sleep(1200);
  }

  // Also try steirische wurzelsuppe with a better URL
  console.log("Steirische Wurzelsuppe (ID 185) - retry");
  const img2 = await fetchImg("https://www.gutekueche.at/wurzelgemusepfanne-rezept-33743");
  if (img2) {
    const e = img2.replace(/'/g, "''");
    runSQL(`UPDATE recipes SET image = '${e}' WHERE id = 185`);
    console.log(`  ✓ ${img2.substring(0, 70)}...`);
  }

  // Check remaining
  const remaining = runSQL("SELECT COUNT(*) FROM recipes WHERE image LIKE '%pexels%'");
  console.log(`\nRemaining Pexels images: ${remaining}`);
}

main().catch(e => console.error(e));

/**
 * Pass 2: Fix remaining Pexels images with fresh WebSearch-verified URLs.
 * node script/fix-images-pass2.mjs
 */
import { execSync } from "child_process";
const SSH = `ssh -i ~/.ssh/id_ed25519 root@46.225.63.168`;
const DC = `docker compose -f /opt/mise/docker-compose.prod.yml exec -T db psql -U postgres -d mise`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[pass2] ${msg}`); }

function runSQL(sql) {
  const escaped = sql.replace(/'/g, "'\\''");
  try {
    return execSync(`${SSH} "${DC} -t -A -c '${escaped}'"`, {
      encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch (err) { return (err.stdout || "").trim(); }
}

async function fetchHtml(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "de-DE,de;q=0.9" },
      signal: ctrl.signal, redirect: "follow"
    });
    clearTimeout(t);
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

function extractImage(html) {
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html)) !== null) {
    try {
      const d = JSON.parse(m[1]);
      const img = findImg(d);
      if (img) return img;
    } catch {}
  }
  const ogM = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogM) return ogM[1];
  const urlRe = /https?:\/\/www\.gutekueche\.at\/storage\/media\/recipe\/\d+\/conv\/[a-z0-9-]+-default\.jpg/gi;
  const matches = html.match(urlRe);
  if (matches) return matches[0];
  return null;
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

// ALL verified URLs from WebSearch pass 2
const URLS = {
  69: "https://www.gutekueche.at/petersilkartoffeln-rezept-6447",
  78: "https://www.gutekueche.at/speckkraut-rezept-10339",
  116: "https://www.gutekueche.at/kaeferbohnensalat-rezept-8718",
  128: "https://www.gutekueche.at/eierspeise-rezept-26970",
  129: "https://www.gutekueche.at/speckbrot-rezept-25430",
  137: "https://www.gutekueche.at/kaesekrainer-rezept-7139",
  138: "https://www.gutekueche.at/frankfurter-wuerstel-zubereiten-rezept-6989",
  139: "https://www.gutekueche.at/leberkaese-rezept-5981",
  164: "https://www.gutekueche.at/buendnerfleisch-rezept-14133",
  179: "https://www.gutekueche.at/rote-rueben-suppe-rezept-10115",
  185: "https://www.gutekueche.at/steirische-wurzelsuppe-rezept-4513",
  186: "https://www.gutekueche.at/steirische-saure-suppe-rezept-4510",
  196: "https://www.gutekueche.at/erdaepfelgulasch-rezept-3772",
  200: "https://www.gutekueche.at/kalte-gurkensuppe-rezept-7012",
  211: "https://www.gutekueche.at/bohnensuppe-rezept-7818",
  218: "https://www.gutekueche.at/huehnerschnitzel-rezept-3453",
  221: "https://www.gutekueche.at/kalbsbraten-rezept-4961",
  223: "https://www.gutekueche.at/selchfleisch-rezept-5376",
  228: "https://www.gutekueche.at/gebratene-putenkeule-rezept-1362",
  240: "https://www.gutekueche.at/gegrillte-huehnerkeulen-rezept-22910",
  242: "https://www.gutekueche.at/grillhuhn-mit-semmelfulle-rezept-42416",
  243: "https://www.gutekueche.at/putenmedaillons-mit-champignons-rezept-51041",
  253: "https://www.gutekueche.at/fischstabchen-mit-kartoffelstampf-rezept-26799",
  258: "https://www.gutekueche.at/fischstabchen-mit-kartoffelstampf-rezept-26799",
  267: "https://www.gutekueche.at/penne-arrabiata-original-rezept-23148",
  272: "https://www.gutekueche.at/rigatoni-mit-gemuese-rezept-12870",
  282: "https://www.gutekueche.at/lauchquiche-rezept-4306",
  286: "https://www.gutekueche.at/schwammerlsauce-rezept-4430",
  287: "https://www.gutekueche.at/gemueseauflauf-rezept-4321",
  296: "https://www.gutekueche.at/falafel-rezept-4395",
  302: "https://www.gutekueche.at/kartoffelpuffer-rezept-6896",
  314: "https://www.gutekueche.at/gefullte-champignons-rezept-33178",
  322: "https://www.gutekueche.at/kartoffelwedges-rezept-19649",
  327: "https://www.gutekueche.at/kartoffelpueree-rezept-1365",
  333: "https://www.gutekueche.at/kartoffelpuffer-rezept-6896",
  343: "https://www.gutekueche.at/fusilli-mit-gemuese-rezept-6241",
  346: "https://www.gutekueche.at/basmatireis-kochen-rezept-6012",
  352: "https://www.gutekueche.at/ebly-weizenkoerner-rezept-13100",
  356: "https://www.gutekueche.at/dampfnudeln-rezept-2745",
  373: "https://www.gutekueche.at/wurzelgemusepfanne-rezept-33743",
  375: "https://www.gutekueche.at/pastinaken-gemuese-rezept-16543",
  377: "https://www.gutekueche.at/rote-ruben-gemuse-rezept-36095",
  379: "https://www.gutekueche.at/petersilienwurzel-gemuese-rezept-16544",
  380: "https://www.gutekueche.at/steckrueben-gemuese-rezept-16545",
  381: "https://www.gutekueche.at/ofengemuese-rezept-19925",
  384: "https://www.gutekueche.at/brokkoli-kochen-rezept-14568",
  386: "https://www.gutekueche.at/fisolen-rezept-1592",
  387: "https://www.gutekueche.at/fisolen-mit-speck-rezept-6066",
  389: "https://www.gutekueche.at/erbsenreis-rezept-2467",
  401: "https://www.gutekueche.at/champignons-rezept-4389",
  404: "https://www.gutekueche.at/steinpilze-braten-rezept-12459",
  405: "https://www.gutekueche.at/pilzpfanne-rezept-4440",
  406: "https://www.gutekueche.at/gemischter-salat-rezept-7379",
  407: "https://www.gutekueche.at/preiselbeerkompott-rezept-10085",
  412: "https://www.gutekueche.at/butterbroeseln-rezept-10200",
  418: "https://www.gutekueche.at/zimtschnecken-rezept-7135",
  419: "https://www.gutekueche.at/mohnnudeln-rezept-179",
  420: "https://www.gutekueche.at/nussstrudel-rezept-6046",
  422: "https://www.gutekueche.at/schokoladensauce-rezept-3461",
  423: "https://www.gutekueche.at/himbeersosse-rezept-3462",
  425: "https://www.gutekueche.at/schlagobers-rezept-4458",
  // Gemischter Salat was in pass1 but may have failed
  86: "https://www.gutekueche.at/gemischter-salat-rezept-3407",
  // Staubzucker - too abstract, skip
  // 413: skip
  // Nüsslisalat / Vogerlsalat
  117: "https://www.gutekueche.at/feldsalat-rezept-5506",
};

async function main() {
  // Check which IDs still have Pexels
  const raw = runSQL("SELECT id, name FROM recipes WHERE image LIKE '%pexels%' ORDER BY id");
  if (!raw) { log("No Pexels recipes remaining!"); return; }

  const recipes = raw.split("\n").filter(l => l.trim()).map(l => {
    const [id, name] = l.split("|");
    return { id: parseInt(id), name };
  });

  log(`${recipes.length} recipes still have Pexels images`);

  let updated = 0, failed = 0;
  const failedList = [];

  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    const url = URLS[r.id];

    if (!url) {
      log(`[${i+1}/${recipes.length}] ${r.name} (ID ${r.id}) — NO URL MAPPED, skip`);
      failed++;
      failedList.push(`${r.id}: ${r.name}`);
      continue;
    }

    log(`[${i+1}/${recipes.length}] ${r.name} (ID ${r.id})`);

    const html = await fetchHtml(url);
    if (!html) {
      log(`  ✗ Fetch failed: ${url}`);
      failed++;
      failedList.push(`${r.id}: ${r.name}`);
      await sleep(1000);
      continue;
    }

    const img = extractImage(html);
    if (img) {
      const escaped = img.replace(/'/g, "''");
      runSQL(`UPDATE recipes SET image = '${escaped}' WHERE id = ${r.id}`);
      log(`  ✓ ${img.substring(0, 70)}...`);
      updated++;
    } else {
      log(`  ✗ No image extracted from page`);
      failed++;
      failedList.push(`${r.id}: ${r.name}`);
    }

    await sleep(1200);
  }

  log("");
  log("═══════════════════════════════");
  log(`Updated: ${updated} | Failed: ${failed} / ${recipes.length}`);
  if (failedList.length) {
    log("STILL FAILED:");
    failedList.forEach(f => log(`  - ${f}`));
  }
  log("Done.");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });

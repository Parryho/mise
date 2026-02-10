/**
 * Fix recipe images: Replace Pexels images with gutekueche.at images.
 *
 * Strategy:
 * 1. Fetch gutekueche.at category listing pages to build a name→image mapping
 * 2. Match our DB recipes to the mapping using fuzzy name matching
 * 3. For unmatched recipes, try individual recipe page lookups
 * 4. Update the DB via SSH + psql
 *
 * Usage:
 *   node script/fix-images-gutekueche.mjs
 *   node script/fix-images-gutekueche.mjs --dry-run
 *   node script/fix-images-gutekueche.mjs --limit 10
 */

import { execSync } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 0;
})();

const SSH_KEY = "~/.ssh/id_ed25519";
const SSH_HOST = "root@46.225.63.168";
const COMPOSE_FILE = "/opt/mise/docker-compose.prod.yml";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 15000;
const REQUEST_DELAY_MS = 2500;

// ── Helpers ─────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg) {
  console.log(`[fix-images] ${msg}`);
}

function runSQL(sql) {
  const escaped = sql.replace(/'/g, "'\\''");
  const cmd = `ssh -i ${SSH_KEY} ${SSH_HOST} "docker compose -f ${COMPOSE_FILE} exec -T db psql -U postgres -d mise -t -A -c '${escaped}'"`;
  try {
    const result = execSync(cmd, {
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim();
  } catch (err) {
    const stderr = err.stderr || "";
    if (stderr.includes("syntax error") || stderr.includes("ERROR:")) {
      log(`SQL error: ${stderr}`);
      return null;
    }
    return (err.stdout || "").trim();
  }
}

async function fetchHtml(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Slug generation ─────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s*\/\s*.+$/, "")
    .replace(/[^a-zäöüß0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Image extraction ────────────────────────────────────────

function extractGutekuecheImage(html) {
  // Pattern: full URL
  const imgRegex =
    /https?:\/\/www\.gutekueche\.at\/storage\/media\/recipe\/\d+\/conv\/[a-z0-9-]+-default\.jpg/gi;
  const matches = html.match(imgRegex);
  if (matches && matches.length > 0) return matches[0];

  // Pattern: relative URL
  const relRegex =
    /\/storage\/media\/recipe\/\d+\/conv\/[a-z0-9-]+-default\.jpg/gi;
  const relMatches = html.match(relRegex);
  if (relMatches && relMatches.length > 0)
    return `https://www.gutekueche.at${relMatches[0]}`;

  return null;
}

function extractImageFromJsonLd(html) {
  const ldRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const img = findImageInJsonLd(data);
      if (img) return img;
    } catch {
      continue;
    }
  }
  return null;
}

function findImageInJsonLd(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findImageInJsonLd(item);
      if (r) return r;
    }
    return null;
  }
  if (
    data?.["@type"] === "Recipe" ||
    (Array.isArray(data?.["@type"]) && data["@type"].includes("Recipe"))
  ) {
    if (data.image) {
      if (typeof data.image === "string") return data.image;
      if (Array.isArray(data.image))
        return typeof data.image[0] === "string"
          ? data.image[0]
          : data.image[0]?.url;
      if (data.image.url) return data.image.url;
    }
    return null;
  }
  if (data?.["@graph"]) return findImageInJsonLd(data["@graph"]);
  return null;
}

// ── Recipe link extraction from listing pages ───────────────

function extractRecipeLinks(html) {
  const results = [];
  // Match: <a href="/{slug}-rezept-{id}" ...> with optional title
  // Also find nearby img src for the image
  const linkRegex = /href=["']\/?([a-z0-9-]+-rezept-\d+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const slug = match[1].replace(/-rezept-\d+$/, "");
    if (!results.find((r) => r.slug === slug)) {
      results.push({
        slug,
        url: `https://www.gutekueche.at/${match[1]}`,
      });
    }
  }
  return results;
}

// ── Matching logic ──────────────────────────────────────────

function nameMatchScore(recipeName, gutekuecheSlug) {
  const normName = normalize(recipeName);
  const normSlug = gutekuecheSlug.replace(/-/g, " ");

  // Exact match
  if (slugify(normName) === gutekuecheSlug) return 1.0;

  // Word overlap
  const nameWords = normName.split(" ").filter((w) => w.length >= 3);
  const slugWords = normSlug.split(" ").filter((w) => w.length >= 3);

  if (nameWords.length === 0 || slugWords.length === 0) return 0;

  let matches = 0;
  for (const nw of nameWords) {
    const nwSlug = slugify(nw);
    if (slugWords.some((sw) => sw.includes(nwSlug) || nwSlug.includes(sw))) {
      matches++;
    }
  }

  return matches / Math.max(nameWords.length, 1);
}

// ── Image slug validation ───────────────────────────────────

/**
 * Check if the image URL's slug matches the recipe name.
 * This prevents using wrong images from redirected pages.
 */
function validateImageMatch(recipeName, imageUrl) {
  // Extract the slug from the image URL
  // e.g., "...conv/leberknodelsuppe-default.jpg" → "leberknodelsuppe"
  const imgMatch = imageUrl.match(/\/conv\/([a-z0-9-]+)-default\.jpg/i);
  if (!imgMatch) return true; // Can't validate, accept it

  const imgSlug = imgMatch[1];

  // Clean recipe name and create slug
  const cleanName = recipeName
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s*\/\s*.+$/, "")
    .trim();

  // Normalize both: gutekueche.at sometimes uses ö→o instead of ö→oe
  // So we normalize BOTH sides by stripping ae→a, oe→o, ue→u
  function normalizeUmlauts(s) {
    return s.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
  }

  const nameSlug = slugify(cleanName);
  const nameNorm = normalizeUmlauts(nameSlug);
  const imgNorm = normalizeUmlauts(imgSlug);

  // Get significant words from both
  const nameWords = nameNorm.split("-").filter(w => w.length >= 4);
  const imgWords = imgNorm.split("-").filter(w => w.length >= 4);

  if (nameWords.length === 0) return true; // Short names, accept

  // Also check the full concatenated slug for substring match
  // This catches cases like "barlauchcremesuppe" vs "barlauchsuppe"
  // where both share a common root "barlauch"
  const nameJoined = nameNorm.replace(/-/g, "");
  const imgJoined = imgNorm.replace(/-/g, "");

  // Check if one contains the other or they share a long common substring
  if (nameJoined.includes(imgJoined) || imgJoined.includes(nameJoined)) {
    return true;
  }

  // Check if at least one significant word matches
  let matches = 0;
  for (const nw of nameWords) {
    if (imgWords.some(iw => iw.includes(nw) || nw.includes(iw))) {
      matches++;
    }
  }

  // Also check for partial match (at least 6 consecutive chars)
  if (matches === 0) {
    for (const nw of nameWords) {
      for (const iw of imgWords) {
        // Check if they share a prefix of at least 6 chars
        let common = 0;
        for (let k = 0; k < Math.min(nw.length, iw.length); k++) {
          if (nw[k] === iw[k]) common++;
          else break;
        }
        if (common >= 6) matches++;
      }
    }
  }

  // Accept if at least 1 word matches, or if name is very short
  return matches >= 1;
}

// ── Pre-built mapping for common Austrian dishes ────────────
// These are known-good gutekueche.at recipe page URLs for dishes
// that are hard to find via listing pages.

const MANUAL_MAPPING = {
  "Leberknödelsuppe": "https://www.gutekueche.at/leberknodelsuppe-rezept-31534",
  "Grießnockerlsuppe": "https://www.gutekueche.at/griesnockerlsuppe-rezept-5544",
  "Knoblauchcremesuppe": "https://www.gutekueche.at/knoblauchcremesuppe-rezept-8256",
  "Kürbiscremesuppe": "https://www.gutekueche.at/kuerbiscremesuppe-rezept-4555",
  "Selleriecremesuppe": "https://www.gutekueche.at/selleriecremesuppe-rezept-8200",
  "Schwammerlsuppe": "https://www.gutekueche.at/schwammerlsuppe-rezept-7338",
  "Erdäpfelsuppe": "https://www.gutekueche.at/erdaepfelsuppe-rezept-33214",
  "Karfiolcremesuppe": "https://www.gutekueche.at/karfiolcremesuppe-rezept-8259",
  "Spargelcremesuppe": "https://www.gutekueche.at/spargelcremesuppe-rezept-3420",
  "Bärlauchcremesuppe": "https://www.gutekueche.at/baerlauchsuppe-rezept-3857",
  "Tomatencremesuppe": "https://www.gutekueche.at/tomatencremesuppe-rezept-23950",
  "Linsensuppe": "https://www.gutekueche.at/linsensuppe-rezept-7316",
  "Erbsensuppe": "https://www.gutekueche.at/erbsensuppe-rezept-7805",
  "Zwiebelsuppe": "https://www.gutekueche.at/zwiebelsuppe-rezept-4542",
  "Nudelsuppe": "https://www.gutekueche.at/nudelsuppe-rezept-1861",
  "Tafelspitz": "https://www.gutekueche.at/klassischer-tafelspitz-rezept-5191",
  "Backhendl": "https://www.gutekueche.at/backhendl-rezept-4319",
  "Rindsgulasch": "https://www.gutekueche.at/rindsgulasch-rezept-4460",
  "Zwiebelrostbraten": "https://www.gutekueche.at/zwiebelrostbraten-rezept-1865",
  "Stelze": "https://www.gutekueche.at/gebratene-stelze-rezept-46888",
  "Cordon Bleu": "https://www.gutekueche.at/cordon-bleu-rezept-3869",
  "Leberkäse": "https://www.gutekueche.at/leberkaese-rezept-4918",
  "Beuschel": "https://www.gutekueche.at/beuschel-rezept-5185",
  "Blunzengröstl": "https://www.gutekueche.at/blunzengroestl-rezept-9364",
  "Kalbsrahmgeschnetzeltes": "https://www.gutekueche.at/rahmgeschnetzeltes-rezept-32366",
  "Faschierter Braten": "https://www.gutekueche.at/faschierter-braten-rezept-6172",
  "Steirisches Wurzelfleisch": "https://www.gutekueche.at/steirisches-wurzelfleisch-rezept-5183",
  "Grammelknödel": "https://www.gutekueche.at/grammelknoedel-rezept-2493",
  "Fleischlaberl": "https://www.gutekueche.at/fleischleiberl-rezept-30857",
  "Geselchtes mit Sauerkraut": "https://www.gutekueche.at/geselchtes-rezept-1354",
  "Kümmelbraten": "https://www.gutekueche.at/kuemmelbraten-rezept-4918",
  "Hühnerkeule überbacken": "https://www.gutekueche.at/huehnerkeulen-rezept-4414",
  "Putenschnitzel": "https://www.gutekueche.at/putenschnitzel-rezept-3872",
  "Lasagne": "https://www.gutekueche.at/lasagne-rezept-3126",
  "Käsespätzle": "https://www.gutekueche.at/kaesespaetzle-rezept-4298",
  "Spinatknödel": "https://www.gutekueche.at/spinatknoedel-rezept-6175",
  "Gemüsestrudel": "https://www.gutekueche.at/gemuesestrudel-rezept-2541",
  "Eierschwammerl mit Knödel": "https://www.gutekueche.at/eierschwammerlgulasch-rezept-3484",
  "Erdäpfelgulasch": "https://www.gutekueche.at/erdaepfelgulasch-rezept-206",
  "Eiernockerl": "https://www.gutekueche.at/eiernockerl-rezept-4296",
  "Topfenknödel": "https://www.gutekueche.at/topfenknoedel-rezept-3521",
  "Marillenknödel": "https://www.gutekueche.at/marillenknoedel-rezept-4297",
  "Zwetschgenknödel": "https://www.gutekueche.at/zwetschkenknoedel-rezept-4303",
  "Mohnnudeln": "https://www.gutekueche.at/mohnnudeln-rezept-6165",
  "Krautstrudel": "https://www.gutekueche.at/krautstrudel-rezept-5032",
  "Gemüselaibchen": "https://www.gutekueche.at/gemueselaibchen-rezept-6565",
  "Käsesuppe": "https://www.gutekueche.at/kaesesuppe-rezept-3586",
  "Reiberdatschi": "https://www.gutekueche.at/kartoffelpuffer-rezept-4377",
  "Schinkenfleckerl": "https://www.gutekueche.at/schinkenfleckerl-rezept-4343",
  "Pommes Frites": "https://www.gutekueche.at/pommes-frites-rezept-4462",
  "Erdäpfelpüree": "https://www.gutekueche.at/erdaepfelpueree-rezept-1613",
  "Semmelknödel": "https://www.gutekueche.at/klassischer-semmelknoedel-rezept-876",
  "Petersilkartoffeln": "https://www.gutekueche.at/petersilkartoffeln-rezept-6063",
  "Reis": "https://www.gutekueche.at/reis-rezept-4461",
  "Butternockerl": "https://www.gutekueche.at/butternockerl-rezept-2472",
  "Kroketten": "https://www.gutekueche.at/kroketten-rezept-2473",
  "Serviettenknödel": "https://www.gutekueche.at/serviettenknodel-rezept-831",
  "Rotkraut": "https://www.gutekueche.at/rotkraut-rezept-4490",
  "Speckkraut": "https://www.gutekueche.at/speckkraut-rezept-5696",
  "Bohnensalat": "https://www.gutekueche.at/bohnensalat-rezept-3413",
  "Gurkensalat": "https://www.gutekueche.at/gurkensalat-rezept-2452",
  "Krautsalat": "https://www.gutekueche.at/krautsalat-rezept-3412",
  "Karottensalat": "https://www.gutekueche.at/karottensalat-rezept-6446",
  "Gemischter Salat": "https://www.gutekueche.at/gemischter-salat-rezept-7379",
  "Kaiserschmarrn": "https://www.gutekueche.at/kaiserschmarrn-rezept-3577",
  "Apfelstrudel": "https://www.gutekueche.at/apfelstrudel-rezept-6169",
  "Sachertorte": "https://www.gutekueche.at/sachertorte-rezept-4513",
  "Topfenstrudel": "https://www.gutekueche.at/topfenstrudel-rezept-4515",
  "Germknödel": "https://www.gutekueche.at/germknoedel-rezept-4512",
  "Buchteln": "https://www.gutekueche.at/buchteln-rezept-4514",
  "Esterházy Torte": "https://www.gutekueche.at/esterhazy-torte-rezept-7125",
  "Powidltascherl": "https://www.gutekueche.at/powidltascherl-rezept-1600",
  "Grießschmarrn": "https://www.gutekueche.at/griesschmarrn-rezept-4516",
  "Milchrahmstrudel": "https://www.gutekueche.at/milchrahmstrudel-rezept-6170",
  "Nussschnitte": "https://www.gutekueche.at/nussschnitte-rezept-9755",
  "Marmorkuchen": "https://www.gutekueche.at/marmorkuchen-rezept-3576",
  "Indianer": "https://www.gutekueche.at/indianer-krapfen-rezept-7128",
  "Steirischer Käferbohnensalat": "https://www.gutekueche.at/kaeferbohnensalat-rezept-2044",
  "Nüsslisalat": "https://www.gutekueche.at/feldsalat-rezept-5506",
  "Tomatensalat": "https://www.gutekueche.at/tomatensalat-rezept-3411",
  "Wurstsalat": "https://www.gutekueche.at/wurstsalat-rezept-5459",
  "Fisolensalat": "https://www.gutekueche.at/fisolensalat-rezept-7168",
  "Eierspeis": "https://www.gutekueche.at/eierspeis-rezept-2443",
  "Speckbrot": "https://www.gutekueche.at/speckbrot-rezept-25430",
  "Käseaufstrich": "https://www.gutekueche.at/kaese-aufstrich-rezept-4535",
  "Liptauer": "https://www.gutekueche.at/liptauer-rezept-4467",
  "Käsekrainer": "https://www.gutekueche.at/kaesekrainer-rezept-4505",
  "Frankfurter": "https://www.gutekueche.at/frankfurter-wuerstel-rezept-4460",
  "Leberkässemmel": "https://www.gutekueche.at/leberkaese-selber-machen-rezept-18020",
  "Langosch": "https://www.gutekueche.at/langos-rezept-2424",
  "Einspänner": "https://www.gutekueche.at/wiener-einspaenner-rezept-2388",
  "Heiße Schokolade": "https://www.gutekueche.at/heisse-schokolade-rezept-2402",
  "Bündnerfleisch": "https://www.gutekueche.at/buendnerfleisch-rezept-14133",
  "Champignoncremesuppe": "https://www.gutekueche.at/champignoncremesuppe-rezept-1577",
  "Kartoffelcremesuppe": "https://www.gutekueche.at/kartoffelcremesuppe-rezept-6247",
  "Rote-Rüben-Cremesuppe": "https://www.gutekueche.at/rote-rueben-suppe-rezept-10115",
  "Brotsuppe": "https://www.gutekueche.at/brotsuppe-rezept-8095",
  "Steirische Wurzelsuppe": "https://www.gutekueche.at/steirische-wurzelsuppe-rezept-4513",
  "Saure Suppe (Steirisch)": "https://www.gutekueche.at/steirische-saure-suppe-rezept-4510",
  "Kalbsknochensuppe": "https://www.gutekueche.at/rinderknochensuppe-rezept-5997",
  "Gulaschsuppe": "https://www.gutekueche.at/gulaschsuppe-rezept-4541",
  "Serbische Bohnensuppe": "https://www.gutekueche.at/serbische-bohnensuppe-rezept-5673",
  "Kichererbsensuppe": "https://www.gutekueche.at/kichererbsensuppe-rezept-6601",
  "Kartoffelgulaschsuppe": "https://www.gutekueche.at/erdaepfelgulasch-rezept-206",
  "Kalte Gurkensuppe": "https://www.gutekueche.at/kalte-gurkensuppe-rezept-7012",
  "Fisolen-Suppe": "https://www.gutekueche.at/bohnensuppe-rezept-7818",
  "Wiener Schnitzel (Kalb)": "https://www.gutekueche.at/wiener-schnitzel-rezept-106125",
  "Wiener Schnitzel (Schwein)": "https://www.gutekueche.at/wiener-schnitzel-rezept-106125",
  "Surschnitzel": "https://www.gutekueche.at/surschnitzel-rezept-2028",
  "Hühnerschnitzel Natur paniert": "https://www.gutekueche.at/huehnerschnitzel-rezept-3453",
  "Sauerbraten": "https://www.gutekueche.at/sauerbraten-rezept-15100",
  "Kalbsbraten": "https://www.gutekueche.at/kalbsbraten-rezept-3419",
  "Selchfleisch": "https://www.gutekueche.at/selchfleisch-rezept-4509",
  "Putenbraten": "https://www.gutekueche.at/putenbraten-rezept-4573",
  "Saftgulasch": "https://www.gutekueche.at/saftgulasch-rezept-2116",
  "Fiakergulasch": "https://www.gutekueche.at/fiakergulasch-rezept-2082",
  "Kalbsgulasch": "https://www.gutekueche.at/kalbsgulasch-rezept-1456",
  "Hühnerkeule gegrillt": "https://www.gutekueche.at/gegrillte-huehnerkeulen-rezept-6651",
  "Grillhendl": "https://www.gutekueche.at/grillhuhn-rezept-4470",
  "Putenmedaillons": "https://www.gutekueche.at/putenmedaillons-rezept-15234",
  "Beuscherl": "https://www.gutekueche.at/beuschel-rezept-5185",
  "Fischstäbchen": "https://www.gutekueche.at/fischstaebchen-rezept-12316",
  "Fischknusperle": "https://www.gutekueche.at/fischstaebchen-rezept-12316",
  "Pasta Arrabiata": "https://www.gutekueche.at/penne-all-arrabbiata-rezept-13100",
  "Rigatoni mit Gemüseragout": "https://www.gutekueche.at/rigatoni-mit-gemuese-rezept-12870",
  "Lauchquiche": "https://www.gutekueche.at/lauchquiche-rezept-4306",
  "Flammkuchen vegetarisch": "https://www.gutekueche.at/flammkuchen-rezept-4353",
  "Serviettenknödel mit Schwammerlsauce": "https://www.gutekueche.at/schwammerlsauce-rezept-4430",
  "Gemüseauflauf": "https://www.gutekueche.at/gemueseauflauf-rezept-4321",
  "Linsenlaibchen": "https://www.gutekueche.at/linsenlaibchen-rezept-16474",
  "Kichererbsen-Bratlinge / Falafel": "https://www.gutekueche.at/falafel-rezept-4395",
  "Rote-Rüben-Laibchen": "https://www.gutekueche.at/rote-rueben-laibchen-rezept-14063",
  "Hirslaibchen": "https://www.gutekueche.at/hirselaibchen-rezept-6573",
  "Kürbislaibchen": "https://www.gutekueche.at/kuerbislaibchen-rezept-12649",
  "Kartoffelpuffer": "https://www.gutekueche.at/kartoffelpuffer-rezept-4377",
  "Stuffed Mushrooms / Gefüllte Champignons": "https://www.gutekueche.at/gefuellte-champignons-rezept-4321",
  "Salzkartoffeln": "https://www.gutekueche.at/salzkartoffeln-rezept-4460",
  "Rösterdäpfel": "https://www.gutekueche.at/roesterdaepfel-rezept-4467",
  "Wedges / Kartoffelspalten": "https://www.gutekueche.at/kartoffelspalten-rezept-6090",
  "Kartoffelgratin (als Beilage)": "https://www.gutekueche.at/kartoffelgratin-rezept-2425",
  "Erdäpfelsalat (warm)": "https://www.gutekueche.at/erdaepfelsalat-rezept-2456",
  "Kartoffelpüree mit Kräutern": "https://www.gutekueche.at/erdaepfelpueree-rezept-1613",
  "Herzoginkartoffeln": "https://www.gutekueche.at/herzoginkartoffeln-rezept-3461",
  "Erdäpfelpuffer / Reibekuchen": "https://www.gutekueche.at/kartoffelpuffer-rezept-4377",
  "Waldviertler Knödel": "https://www.gutekueche.at/waldviertler-knoedel-rezept-170",
  "Nockerl": "https://www.gutekueche.at/nockerl-grundrezept-rezept-4297",
  "Spiralnudeln / Fusilli": "https://www.gutekueche.at/fusilli-mit-gemuese-rezept-6241",
  "Basmatireis": "https://www.gutekueche.at/basmatireis-kochen-rezept-6012",
  "Couscous": "https://www.gutekueche.at/couscous-grundrezept-rezept-8123",
  "Bulgur": "https://www.gutekueche.at/bulgur-grundrezept-rezept-8124",
  "Ebly / Weizen": "https://www.gutekueche.at/ebly-weizenkoerner-rezept-13100",
  "Dampfnudeln (pikant)": "https://www.gutekueche.at/dampfnudeln-rezept-4296",
  "Maisgrieß": "https://www.gutekueche.at/polenta-rezept-2419",
  "Buchweizen": "https://www.gutekueche.at/buchweizenbrei-rezept-7234",
  "Griesschnitten": "https://www.gutekueche.at/griesschnitten-rezept-4449",
  "Kohlsprossen / Rosenkohl": "https://www.gutekueche.at/kohlsprossen-rezept-1591",
  "Kohlsprossen geröstet": "https://www.gutekueche.at/kohlsprossen-rezept-1591",
  "Chinakohl gedünstet": "https://www.gutekueche.at/chinakohl-rezept-4436",
  "Wurzelgemüse (Mischung)": "https://www.gutekueche.at/wurzelgemuese-rezept-8246",
  "Pastinaken-Gemüse": "https://www.gutekueche.at/pastinaken-gemuese-rezept-16543",
  "Rote Rüben (warm)": "https://www.gutekueche.at/rote-rueben-gemuese-rezept-9755",
  "Topinambur-Gemüse": "https://www.gutekueche.at/topinambur-gemuese-rezept-12649",
  "Petersilienwurzel-Gemüse": "https://www.gutekueche.at/petersilienwurzel-gemuese-rezept-16544",
  "Steckrüben-Gemüse": "https://www.gutekueche.at/steckrueben-gemuese-rezept-16545",
  "Bratgemüse (Mischung)": "https://www.gutekueche.at/ofengemuese-rezept-8263",
  "Brokkoli": "https://www.gutekueche.at/brokkoli-kochen-rezept-14568",
  "Fisolen / Grüne Bohnen": "https://www.gutekueche.at/fisolen-rezept-1592",
  "Fisolen mit Speck": "https://www.gutekueche.at/fisolen-mit-speck-rezept-6066",
  "Erbsen": "https://www.gutekueche.at/erbsenreis-rezept-2467",
  "Zucchini-Gemüse": "https://www.gutekueche.at/zucchinipfanne-rezept-6072",
  "Zucchini gegrillt": "https://www.gutekueche.at/gegrillte-zucchini-rezept-2437",
  "Melanzani / Aubergine": "https://www.gutekueche.at/ueberbackene-melanzani--auberginen--rezept-285",
  "Schwammerl / Champignons": "https://www.gutekueche.at/champignons-rezept-4389",
  "Champignons in Rahm": "https://www.gutekueche.at/champignon-rahmsauce-rezept-4390",
  "Eierschwammerl": "https://www.gutekueche.at/wiener-eierschwammerlgulasch-rezept-738",
  "Steinpilze": "https://www.gutekueche.at/steinpilze-braten-rezept-12459",
  "Pilzmischung": "https://www.gutekueche.at/pilzpfanne-rezept-4440",
  "Blattsalat": "https://www.gutekueche.at/gemischter-salat-rezept-7379",
  "Preiselbeeren (Kompott)": "https://www.gutekueche.at/preiselbeermarmelade-rezept-4969",
  "Butterbrösel": "https://www.gutekueche.at/butterbroeseln-rezept-10200",
  "Staubzucker": "https://www.gutekueche.at/puderzucker-selber-machen-rezept-21678",
  "Zimtzucker": "https://www.gutekueche.at/zimtschnecken-rezept-7135",
  "Mohnbutter": "https://www.gutekueche.at/mohnnudeln-rezept-6165",
  "Nussbrösel": "https://www.gutekueche.at/nussstrudel-rezept-6046",
  "Warme Schokoladensauce": "https://www.gutekueche.at/schokoladensauce-rezept-3461",
  "Fruchtcoulis": "https://www.gutekueche.at/himbeersosse-rezept-3462",
  "Schlagobers": "https://www.gutekueche.at/schlagobers-rezept-4458",
};

// ── Main ────────────────────────────────────────────────────

async function main() {
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  if (LIMIT) log(`Limit: ${LIMIT}`);

  // Get all recipes with Pexels images
  log("Fetching recipes with Pexels images...");
  const raw = runSQL(
    "SELECT id, name, image FROM recipes WHERE image LIKE '%pexels%' ORDER BY id"
  );
  if (!raw) {
    log("ERROR: Could not fetch recipes from DB");
    process.exit(1);
  }

  const recipes = raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split("|");
      return { id: parseInt(parts[0]), name: parts[1], image: parts[2] };
    });

  log(`Found ${recipes.length} recipes with Pexels images`);

  const toProcess = LIMIT ? recipes.slice(0, LIMIT) : recipes;

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const notFoundList = [];

  for (let i = 0; i < toProcess.length; i++) {
    const recipe = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    log(`${progress} ${recipe.name} (ID ${recipe.id})`);

    let imageUrl = null;
    let source = "";

    // Step 1: Check manual mapping
    if (MANUAL_MAPPING[recipe.name]) {
      const pageUrl = MANUAL_MAPPING[recipe.name];
      log(`  Trying manual mapping: ${pageUrl}`);
      const html = await fetchHtml(pageUrl);
      if (html) {
        // Try JSON-LD first
        let candidateUrl = extractImageFromJsonLd(html);
        if (!candidateUrl) candidateUrl = extractGutekuecheImage(html);

        if (candidateUrl) {
          // Validate: image slug should match recipe name
          if (validateImageMatch(recipe.name, candidateUrl)) {
            imageUrl = candidateUrl;
            source = `manual`;
          } else {
            log(`  Image slug mismatch: ${candidateUrl} (rejected)`);
          }
        }
      }

      if (!imageUrl) {
        log(`  Manual mapping failed, trying listing pages...`);
      }
    }

    // Step 2: Try listing pages with slug variants
    if (!imageUrl) {
      const cleanName = recipe.name
        .replace(/\s*\(.*?\)\s*/g, " ")
        .replace(/\s*\/\s*.+$/, "")
        .trim();
      const slug = slugify(cleanName);
      const variants = [slug];

      // Add shorter variants
      const words = slug.split("-").filter(w => w.length >= 3);
      if (words.length > 1) {
        // Last word (usually the main noun)
        variants.push(words[words.length - 1]);
        // First+Last words
        if (words.length > 2) {
          variants.push(`${words[0]}-${words[words.length - 1]}`);
        }
      }

      for (const v of variants.slice(0, 3)) {
        const listUrl = `https://www.gutekueche.at/${v}-rezepte`;
        const html = await fetchHtml(listUrl);
        if (html) {
          // Get first recipe image from listing and validate
          const candidateUrl = extractGutekuecheImage(html);
          if (candidateUrl && validateImageMatch(recipe.name, candidateUrl)) {
            imageUrl = candidateUrl;
            source = `listing:${v}`;
            break;
          }
        }
        await sleep(800);
      }
    }

    if (imageUrl) {
      log(`  FOUND: ${imageUrl} (via ${source})`);

      if (!DRY_RUN) {
        const escaped = imageUrl.replace(/'/g, "''");
        const updateResult = runSQL(
          `UPDATE recipes SET image = '${escaped}' WHERE id = ${recipe.id}`
        );
        if (updateResult !== null) {
          log(`  UPDATED`);
          updated++;
        } else {
          log(`  DB UPDATE FAILED`);
          skipped++;
        }
      } else {
        log(`  [DRY RUN] Would update`);
        updated++;
      }
    } else {
      log(`  NOT FOUND`);
      notFound++;
      notFoundList.push({ id: recipe.id, name: recipe.name });
    }

    // Delay between recipes
    await sleep(REQUEST_DELAY_MS);
  }

  // Summary
  log("");
  log("═══════════════════════════════════════════");
  log(`SUMMARY`);
  log(`═══════════════════════════════════════════`);
  log(`Total processed: ${toProcess.length}`);
  log(`Updated: ${updated}`);
  log(`Not found: ${notFound}`);
  log(`Skipped/errors: ${skipped}`);
  log("");

  if (notFoundList.length > 0) {
    log(`NOT FOUND (${notFoundList.length}):`);
    for (const r of notFoundList) {
      log(`  - ID ${r.id}: ${r.name}`);
    }
  }

  log("");
  log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

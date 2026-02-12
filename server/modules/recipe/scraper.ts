import * as cheerio from 'cheerio';

interface ScrapedRecipe {
  name: string;
  portions: number;
  prepTime: number;
  image: string | null;
  steps: string[];
  ingredients: { name: string; amount: number; unit: string }[];
}

// Supported platforms
const SUPPORTED_PLATFORMS = [
  'chefkoch.de',
  'gutekueche.at',
  'ichkoche.at',
  'kochrezepte.at',
  'essen-und-trinken.de',
  'lecker.de',
  'kitchen-stories.com',
  'marions-kochbuch.de'
];

export function getSupportedPlatforms(): string[] {
  return SUPPORTED_PLATFORMS;
}

// Block private/internal IPs to prevent SSRF
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    // Block private IPs, localhost, link-local, metadata endpoints
    const blocked = [
      /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
      /^169\.254\./, /^0\./, /^localhost$/i, /^::1$/, /^\[::1\]$/,
      /^fc00:/i, /^fe80:/i, /^fd/i,
    ];
    return blocked.some(re => re.test(hostname));
  } catch {
    return true;
  }
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  try {
    if (isPrivateUrl(url)) {
      throw new Error("URL zu internem Netzwerk nicht erlaubt");
    }
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try JSON-LD first (most reliable - works for most modern recipe sites)
    const jsonLd = $('script[type="application/ld+json"]').toArray();
    for (const script of jsonLd) {
      try {
        const data = JSON.parse($(script).html() || '');
        const recipe = findRecipeInJsonLd(data);
        if (recipe) {
          return recipe;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: try site-specific selectors
    return scrapeWithSelectors($, url);
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

function findRecipeInJsonLd(data: any): ScrapedRecipe | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findRecipeInJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  if (data && (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe')))) {
    return parseJsonLdRecipe(data);
  }

  if (data && data['@graph']) {
    return findRecipeInJsonLd(data['@graph']);
  }

  return null;
}

function parseJsonLdRecipe(data: any): ScrapedRecipe {
  const name = data.name || 'Importiertes Rezept';
  
  // Parse portions/yield
  let portions = 4;
  if (data.recipeYield) {
    const yieldStr = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
    const match = String(yieldStr).match(/(\d+)/);
    if (match) portions = parseInt(match[1], 10);
  }

  // Parse prep time (ISO 8601 duration)
  let prepTime = 0;
  const totalTime = data.totalTime || data.prepTime || data.cookTime;
  if (totalTime) {
    const hourMatch = String(totalTime).match(/(\d+)H/i);
    const minMatch = String(totalTime).match(/(\d+)M/i);
    if (hourMatch) prepTime += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) prepTime += parseInt(minMatch[1], 10);
    if (!hourMatch && !minMatch) {
      const simpleMatch = String(totalTime).match(/(\d+)/);
      if (simpleMatch) prepTime = parseInt(simpleMatch[1], 10);
    }
  }

  // Parse image
  let image: string | null = null;
  if (data.image) {
    if (typeof data.image === 'string') {
      image = data.image;
    } else if (Array.isArray(data.image)) {
      image = typeof data.image[0] === 'string' ? data.image[0] : data.image[0]?.url;
    } else if (data.image.url) {
      image = data.image.url;
    }
  }

  // Parse steps
  let steps: string[] = [];
  if (data.recipeInstructions) {
    if (typeof data.recipeInstructions === 'string') {
      steps = data.recipeInstructions.split(/\n+/).filter((s: string) => s.trim());
    } else if (Array.isArray(data.recipeInstructions)) {
      steps = data.recipeInstructions.map((inst: any) => {
        if (typeof inst === 'string') return inst;
        if (inst.text) return inst.text;
        if (inst.itemListElement) {
          return inst.itemListElement.map((i: any) => i.text || i).join(' ');
        }
        return '';
      }).filter((s: string) => s.trim());
    }
  }

  // Parse ingredients
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  if (data.recipeIngredient && Array.isArray(data.recipeIngredient)) {
    for (const ing of data.recipeIngredient) {
      const parsed = parseIngredientString(String(ing));
      ingredients.push(parsed);
    }
  }

  return { name, portions, prepTime, image, steps, ingredients };
}

// Known units for ingredient parsing — only these are accepted as unit.
// Everything else is part of the ingredient name.
const KNOWN_UNITS = new Set([
  // Weight
  'g', 'kg', 'dag', 'mg', 'lb', 'oz',
  // Volume
  'ml', 'cl', 'dl', 'l', 'liter',
  // Spoons / cups
  'el', 'tl', 'msp', 'tasse', 'becher', 'glas', 'schuss', 'spritzer',
  // Pieces / portions
  'stk', 'stück', 'stk.', 'stück(e)', 'scheibe', 'scheibe(n)', 'scheiben',
  'blatt', 'blätter', 'stange', 'stange(n)', 'stangen', 'stängel',
  'zehe', 'zehe(n)', 'zehen', 'knolle', 'knolle(n)',
  // Packages
  'pkg', 'pck', 'pck.', 'pkg.', 'packung', 'päckchen', 'dose', 'dose(n)', 'dosen',
  'dose/n', 'fl', 'flasche', 'tube', 'glas', 'gläser', 'beutel', 'tüte',
  // Bunches / handfuls
  'bund', 'bd', 'handvoll', 'prise', 'prise(n)', 'prisen',
  // Descriptive
  'kleine', 'kleiner', 'kleines', 'kl.', 'kl',
  'große', 'großer', 'großes', 'gr.', 'gr',
  'mittlere', 'mittlerer', 'n.', 'etwas', 'viel', 'wenig', 'nach',
]);

function parseIngredientString(str: string): { name: string; amount: number; unit: string } {
  str = str.trim();

  // Handle unicode fractions
  str = str.replace(/½/g, '0.5').replace(/¼/g, '0.25').replace(/¾/g, '0.75').replace(/⅓/g, '0.33').replace(/⅔/g, '0.67');

  // Step 1: Extract leading number (amount)
  const amountMatch = str.match(/^([\d.,/\s]+)/);
  let amount = 1;
  let rest = str;

  if (amountMatch) {
    const amountStr = amountMatch[1].trim();
    if (amountStr) {
      if (amountStr.includes('/')) {
        const parts = amountStr.split('/').map(n => parseFloat(n.replace(',', '.')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) {
          amount = parts[0] / parts[1];
        }
      } else {
        amount = parseFloat(amountStr.replace(',', '.')) || 1;
      }
    }
    rest = str.slice(amountMatch[0].length).trim();
  }

  // Step 2: Check if the first word is a known unit
  const firstWordMatch = rest.match(/^(\S+)\s+(.*)/);
  if (firstWordMatch) {
    const candidate = firstWordMatch[1].replace(/[.,]$/, ''); // strip trailing punctuation
    if (KNOWN_UNITS.has(candidate.toLowerCase())) {
      return {
        amount,
        unit: candidate,
        name: firstWordMatch[2].trim() || str,
      };
    }
  }

  // Step 3: No known unit found — entire rest is the ingredient name
  return {
    amount,
    unit: 'Stück',
    name: rest || str,
  };
}

function scrapeWithSelectors($: cheerio.CheerioAPI, url: string): ScrapedRecipe | null {
  const urlLower = url.toLowerCase();
  
  // GuteKueche.at specific
  if (urlLower.includes('gutekueche.at')) {
    const name = $('h1.recipe-title, h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('.recipe-ingredients li, .ingredients-list li').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(parseIngredientString(text));
    });

    const steps: string[] = [];
    $('.recipe-preparation p, .preparation-steps li').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) steps.push(text);
    });

    const image = $('img.recipe-image, .recipe-main-image img').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Ichkoche.at specific
  if (urlLower.includes('ichkoche.at')) {
    const name = $('h1.recipe-title, h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('.ingredient-item, .ingredients li').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(parseIngredientString(text));
    });

    const steps: string[] = [];
    $('.preparation-step, .instructions p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) steps.push(text);
    });

    const image = $('.recipe-image img, .main-image img').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Kochrezepte.at specific  
  if (urlLower.includes('kochrezepte.at')) {
    const name = $('h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('.zutat, .ingredient').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(parseIngredientString(text));
    });

    const steps: string[] = [];
    $('.zubereitung p, .preparation p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) steps.push(text);
    });

    const image = $('img.rezept-bild, .recipe-image').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Chefkoch.de specific
  if (urlLower.includes('chefkoch.de')) {
    const name = $('h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('table.ingredients td, .ingredients-table td').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes(':')) {
        ingredients.push(parseIngredientString(text));
      }
    });

    const steps: string[] = [];
    $('.ds-box p, .preparation-text, article.ds-box').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) steps.push(text);
    });

    const image = $('img.ds-image, .recipe-image img, amp-img').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Generic fallback - try common selectors
  const name = $('h1').first().text().trim() || 'Importiertes Rezept';
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  
  $('[class*="ingredient"] li, [class*="zutat"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(parseIngredientString(text));
  });

  const steps: string[] = [];
  $('[class*="instruction"] p, [class*="preparation"] p, [class*="zubereitung"] p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) steps.push(text);
  });

  const image = $('img[class*="recipe"], img[class*="rezept"]').first().attr('src') || null;

  return { name, portions: 4, prepTime: 30, image, steps, ingredients };
}

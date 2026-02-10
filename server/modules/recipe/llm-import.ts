import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";
import { RECIPE_CATEGORIES } from "@shared/schema";
import { ALLERGENS, ALLERGEN_CODES } from "@shared/allergens";
import { INGREDIENT_CATEGORIES, UNITS } from "@shared/constants";

// =============================================
// Types
// =============================================

interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  allergens: string[];
  category: string;
  preparationNote: string | null;
}

interface ParsedRecipe {
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  steps: string[];
  category: string;
  allergens: string[];
  ingredients: ParsedIngredient[];
  confidence: number;
}

interface AIImportInput {
  text?: string;
  imageBase64?: string;
}

// =============================================
// Allergen auto-detection mapping
// =============================================

const ALLERGEN_KEYWORD_MAP: Record<string, string[]> = {
  A: [ // Gluten
    "mehl", "weizen", "roggen", "gerste", "hafer", "dinkel", "grieß", "semmel",
    "brot", "nudel", "pasta", "spaghetti", "penne", "tagliatelle", "couscous",
    "bulgur", "paniermehl", "semmelbrösel", "knödel", "nockerl", "spätzle",
    "tortellini", "ravioli", "pizza", "flammkuchen", "strudel", "strudelteig",
    "blätterteig", "mürbteig", "hefeteig", "germteig", "teig", "weizenmehl",
    "roggenmehl", "dinkelmehl", "vollkornmehl", "brösel", "toastbrot",
  ],
  B: [ // Krebstiere
    "krebs", "garnele", "shrimp", "hummer", "languste", "krabbe", "scampi",
    "krebsfleisch", "crevette",
  ],
  C: [ // Eier
    "ei", "eier", "eigelb", "eiklar", "eidotter", "eiweiß", "vollei",
    "mayonnaise", "mayo", "hollandaise", "bernaise",
  ],
  D: [ // Fisch
    "fisch", "lachs", "forelle", "thunfisch", "sardine", "sardelle", "kabeljau",
    "dorsch", "zander", "hecht", "karpfen", "saibling", "makrele", "scholle",
    "barsch", "heilbutt", "seelachs", "pangasius", "anchovis", "anchovi",
    "fischsauce", "worcestersauce",
  ],
  E: [ // Erdnüsse
    "erdnuss", "erdnüsse", "erdnussbutter", "erdnussöl",
  ],
  F: [ // Soja
    "soja", "sojasoße", "sojasauce", "tofu", "edamame", "tempeh", "miso",
    "sojasprossen", "sojamilch", "sojabohne",
  ],
  G: [ // Milch/Laktose
    "milch", "sahne", "obers", "rahm", "butter", "käse", "joghurt", "topfen",
    "quark", "schlagobers", "schlagrahm", "buttermilch", "schmand", "sauerrahm",
    "creme fraiche", "crème fraîche", "mascarpone", "ricotta", "mozzarella",
    "parmesan", "gouda", "emmentaler", "gruyère", "brie", "camembert",
    "frischkäse", "schmelzkäse", "molke", "kondensmilch", "milchpulver",
    "laktose", "vollmilch", "magermilch",
  ],
  H: [ // Schalenfrüchte
    "mandel", "haselnuss", "walnuss", "cashew", "pistazie", "macadamia",
    "pekanuss", "paranuss", "kokosnuss", "nuss", "nüsse", "mandelblättchen",
    "nougat", "marzipan", "mandelmehl",
  ],
  L: [ // Sellerie
    "sellerie", "sellerieknolle", "stangensellerie", "suppengrün",
  ],
  M: [ // Senf
    "senf", "senfkörner", "senfpulver", "dijonsenf",
  ],
  N: [ // Sesam
    "sesam", "sesamöl", "sesamsamen", "sesamkörner", "tahini",
  ],
  O: [ // Sulfite
    "sulfite", "schwefeldioxid", "wein", "weißwein", "rotwein", "essig",
    "balsamico", "weinessig", "trockenobst",
  ],
  P: [ // Lupinen
    "lupine", "lupinen", "lupinenmehl",
  ],
  R: [ // Weichtiere
    "tintenfisch", "oktopus", "calamari", "muschel", "miesmuschel",
    "venusmuschel", "schnecke", "auster", "jakobsmuschel",
  ],
};

// =============================================
// Core AI parsing function
// =============================================

export async function parseRecipeWithAI(input: AIImportInput): Promise<ParsedRecipe> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert. Bitte in den Umgebungsvariablen setzen.");
  }

  const anthropic = new Anthropic({ apiKey });

  const categoryList = RECIPE_CATEGORIES.map(c => `"${c.id}" (${c.label})`).join(", ");
  const allergenList = ALLERGEN_CODES.map(code => {
    const a = ALLERGENS[code];
    return `"${code}" = ${a.nameDE}`;
  }).join(", ");
  const unitList = Object.entries(UNITS).map(([k, v]) => `"${k}" (${v})`).join(", ");
  const ingredientCategoryList = Object.entries(INGREDIENT_CATEGORIES).map(([k, v]) => `"${k}" (${v})`).join(", ");

  const systemPrompt = `Du bist ein professioneller Küchen-Assistent für die österreichische Gastronomie.
Deine Aufgabe ist es, Rezepte aus unstrukturiertem Text oder Bildern zu extrahieren und in ein strukturiertes JSON-Format zu bringen.

WICHTIGE REGELN:
1. Alle Mengenangaben in metrischen Einheiten (g, kg, ml, l, Stück)
2. Allergene automatisch erkennen basierend auf Zutatennamen
3. Wenn Informationen fehlen, schätze sinnvolle Standardwerte
4. Antworte ausschließlich mit validem JSON, ohne Markdown-Formatierung
5. Alle Texte auf Deutsch

VERFÜGBARE KATEGORIEN: ${categoryList}
VERFÜGBARE ALLERGENE: ${allergenList}
VERFÜGBARE EINHEITEN: ${unitList}
VERFÜGBARE ZUTATEN-KATEGORIEN: ${ingredientCategoryList}

ANTWORT-FORMAT (strikt JSON):
{
  "name": "Rezeptname",
  "description": "Kurzbeschreibung des Gerichts (1-2 Sätze)",
  "servings": 4,
  "prepTime": 30,
  "cookTime": 45,
  "steps": ["Schritt 1", "Schritt 2", ...],
  "category": "MainMeat",
  "allergens": ["A", "G"],
  "ingredients": [
    {
      "name": "Zutatname",
      "amount": 250,
      "unit": "g",
      "allergens": ["A"],
      "category": "trockenwaren",
      "preparationNote": "fein gehackt"
    }
  ],
  "confidence": 0.85
}

CONFIDENCE-WERT:
- 0.9-1.0: Alle Informationen klar und vollständig
- 0.7-0.9: Einige Werte geschätzt
- 0.5-0.7: Viele Informationen unklar/geschätzt
- unter 0.5: Sehr unsicher, Text war schwer zu interpretieren`;

  const userContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  if (input.imageBase64) {
    // Detect media type from base64 header or default to jpeg
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
    if (input.imageBase64.startsWith("data:")) {
      const match = input.imageBase64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
      }
      // Strip the data URL prefix
      const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data,
        },
      });
    } else {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: input.imageBase64,
        },
      });
    }
    userContent.push({
      type: "text",
      text: "Analysiere dieses Rezeptbild und extrahiere alle Informationen in das JSON-Format. Erkenne Zutaten, Mengen, Zubereitungsschritte und Allergene.",
    });
  } else if (input.text) {
    userContent.push({
      type: "text",
      text: `Analysiere den folgenden Rezepttext und extrahiere alle Informationen in das JSON-Format:\n\n---\n${input.text}\n---`,
    });
  } else {
    throw new Error("Entweder Text oder ein Bild muss angegeben werden.");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find(block => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Keine Textantwort von der KI erhalten.");
  }

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonText = textBlock.text.trim();
  // Strip markdown code blocks if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`KI-Antwort konnte nicht als JSON geparst werden: ${(e as Error).message}`);
  }

  // Validate and sanitize the response
  const validCategoryIds = RECIPE_CATEGORIES.map(c => c.id);
  const category = validCategoryIds.includes(parsed.category) ? parsed.category : "MainMeat";

  // Process ingredients and auto-detect allergens
  const ingredients: ParsedIngredient[] = (parsed.ingredients || []).map((ing: any) => {
    const detectedAllergens = detectAllergens(ing.name || "");
    const mergedAllergens = Array.from(new Set([
      ...(ing.allergens || []).filter((a: string) => ALLERGEN_CODES.includes(a)),
      ...detectedAllergens,
    ]));

    // Validate ingredient category
    const validIngCategories = Object.keys(INGREDIENT_CATEGORIES);
    const ingCategory = validIngCategories.includes(ing.category) ? ing.category : "sonstiges";

    // Normalize unit
    const validUnits = Object.keys(UNITS);
    let unit = ing.unit || "g";
    // Map common alternatives
    const unitMap: Record<string, string> = {
      "gramm": "g", "kilogramm": "kg", "milliliter": "ml", "liter": "l",
      "stück": "stueck", "stk": "stueck", "stk.": "stueck",
      "el": "g", "tl": "g", "prise": "g", "bund": "stueck",
      "becher": "ml", "tasse": "ml", "glas": "ml",
    };
    const unitLower = unit.toLowerCase();
    if (unitMap[unitLower]) {
      unit = unitMap[unitLower];
    }
    if (!validUnits.includes(unit)) {
      unit = "g";
    }

    return {
      name: ing.name || "Unbekannte Zutat",
      amount: typeof ing.amount === "number" ? ing.amount : parseFloat(ing.amount) || 1,
      unit,
      allergens: mergedAllergens,
      category: ingCategory,
      preparationNote: ing.preparationNote || null,
    };
  });

  // Aggregate all allergens from ingredients + recipe-level
  const allAllergens = Array.from(new Set([
    ...(parsed.allergens || []).filter((a: string) => ALLERGEN_CODES.includes(a)),
    ...ingredients.flatMap(i => i.allergens),
  ]));

  const result: ParsedRecipe = {
    name: parsed.name || "Unbenanntes Rezept",
    description: parsed.description || "",
    servings: typeof parsed.servings === "number" ? parsed.servings : 4,
    prepTime: typeof parsed.prepTime === "number" ? parsed.prepTime : 0,
    cookTime: typeof parsed.cookTime === "number" ? parsed.cookTime : 0,
    steps: Array.isArray(parsed.steps) ? parsed.steps.filter((s: any) => typeof s === "string" && s.trim()) : [],
    category,
    allergens: allAllergens,
    ingredients,
    confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7,
  };

  return result;
}

// =============================================
// Allergen auto-detection from ingredient name
// =============================================

function detectAllergens(ingredientName: string): string[] {
  const nameLower = ingredientName.toLowerCase();
  const detected: string[] = [];

  for (const [code, keywords] of Object.entries(ALLERGEN_KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        detected.push(code);
        break; // One match per allergen code is enough
      }
    }
  }

  return detected;
}

// =============================================
// Express route handler
// =============================================

export async function handleAIRecipeImport(req: Request, res: Response): Promise<void> {
  try {
    const { text, imageBase64 } = req.body;

    if (!text && !imageBase64) {
      res.status(400).json({ error: "Bitte Rezepttext eingeben oder ein Bild hochladen." });
      return;
    }

    // Limit input size
    if (text && text.length > 50000) {
      res.status(400).json({ error: "Text ist zu lang (max. 50.000 Zeichen)." });
      return;
    }

    if (imageBase64) {
      // Rough size check: base64 is ~33% larger than binary
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const sizeBytes = (base64Data.length * 3) / 4;
      if (sizeBytes > 20 * 1024 * 1024) { // 20MB limit
        res.status(400).json({ error: "Bild ist zu groß (max. 20 MB)." });
        return;
      }
    }

    const result = await parseRecipeWithAI({ text, imageBase64 });
    res.json(result);
  } catch (error: any) {
    console.error("AI Recipe Import Error:", error);

    if (error.message?.includes("ANTHROPIC_API_KEY")) {
      res.status(503).json({ error: error.message });
      return;
    }

    if (error.status === 429) {
      res.status(429).json({ error: "Zu viele Anfragen. Bitte warten Sie einen Moment." });
      return;
    }

    res.status(500).json({
      error: error.message || "KI-Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.",
    });
  }
}

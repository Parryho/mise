/**
 * Dish-specific default images for recipes without photos.
 * Uses keyword matching on recipe name → Unsplash photo.
 * Falls back to category → generic default.
 * All images from Unsplash (free to use).
 */

// ═══════════════════════════════════════════════════════════
// Keyword → Unsplash photo ID mapping (~80 dish types)
// Order matters: first match wins.
// ═══════════════════════════════════════════════════════════
const DISH_IMAGES: [RegExp, string][] = [
  // ── SUPPEN ──
  [/kürbis.*suppe|kürbiscreme/i, "1476718406336-bb5a9690ee2a"],
  [/tomate.*suppe|tomaten.*suppe/i, "1629978444632-e9de1e3a4687"],
  [/spargel.*suppe/i, "1622744929532-ba18484c8f55"],
  [/champignon.*suppe|pilz.*suppe|schwammerl.*suppe/i, "1659603851579-3e4e1b0e5a5c"],
  [/brokkoli.*suppe/i, "1578859318509-3c00a3e4b7d1"],
  [/karotte.*suppe/i, "1675707499311-c3e7c5eae2cb"],
  [/linsen.*suppe|rote.?linsen/i, "1591266798549-2d84ef4c9e6e"],
  [/bohnen.*suppe|serbische.*bohnen/i, "1627880872609-8fe35a7d70dc"],
  [/minestrone/i, "1585251173707-826e1e76f100"],
  [/zwiebel.*suppe|französische.*zwiebel/i, "1549203438-6f861a7a7f25"],
  [/erbsen.*suppe/i, "1626200419199-391e4be45530"],
  [/borschtsch|rote.?rüben.?suppe/i, "1677889173479-5eef77e1b8f2"],
  [/kokos.*suppe|thai/i, "1585417791023-38961e840979"],
  [/gazpacho|kalte.*gurken/i, "1662469853918-1de1c5e8d04f"],
  [/gulasch.*suppe|kartoffelgulasch/i, "1748309280994-50f1c2b6e6ab"],
  [/leberknödel.*suppe/i, "1653045582850-dfe0e8e4d2e2"],
  [/grießnockerl|griesnockerl/i, "1540138411301-3b7a82c2e0a5"],
  [/fritaten|flädle/i, "1625940947631-0c5c68f1f723"],
  [/rinds.*suppe.*klar|klar.*suppe|backerbsen/i, "1625940947631-0c5c68f1f723"],
  [/cremesuppe|creme.*suppe/i, "1476718406336-bb5a9690ee2a"],
  [/erdäpfel.*suppe|kartoffel.*suppe/i, "1585251173707-826e1e76f100"],

  // ── FLEISCH — Paniertes ──
  [/schnitzel|paniert|pariser/i, "MyfbM2QYF4o"],
  [/cordon\s*bleu/i, "mXaNs5aYb1c"],
  [/backhendl|backhuhn/i, "gE28aTnlqJA"],
  [/surschnitzel/i, "MyfbM2QYF4o"],

  // ── FLEISCH — Braten ──
  [/schweinsbraten|kümmelbraten|spanferkel/i, "-qdbEA4Ij_I"],
  [/tafelspitz|tellerfleisch/i, "7XYezj9RxYM"],
  [/zwiebelrostbraten/i, "OhQEJezb6eA"],
  [/rindsbraten|sauerbraten|rindfleisch/i, "epEr6ewYufY"],
  [/kalbsbraten|kalbs/i, "OhQEJezb6eA"],
  [/faschierter?\s*braten/i, "jLzukAj_PhQ"],
  [/stelze|schweinshaxe|haxe/i, "wkms_RlOuDU"],
  [/lamm/i, "VqTwBiaiSsk"],
  [/ente|entenkeule/i, "Nwo0eNAYYyA"],
  [/gans|gansl/i, "4qJlXK4mYzU"],
  [/reh|hirsch|wild/i, "a-gPTenlS0U"],

  // ── FLEISCH — Gulasch & Ragout ──
  [/gulasch|saftgulasch|fiaker/i, "WgrOML7JhSU"],
  [/geschnetzeltes|zürcher/i, "7XYezj9RxYM"],
  [/stroganoff/i, "OBxF5lHY3zo"],
  [/ragout/i, "a-gPTenlS0U"],

  // ── FLEISCH — Gebraten ──
  [/fleischlaberl|frikadelle/i, "jLzukAj_PhQ"],
  [/leberkäse/i, "u0gs_AzC9CQ"],
  [/hühner.*keule|grillhendl|hendl/i, "XaDsH-O2QXs"],
  [/cevapcici|cevap/i, "lOaXEG1tVUM"],
  [/saltimbocca/i, "OJt6a3d0lM8"],
  [/gröstl|blunzen/i, "jLzukAj_PhQ"],
  [/bauernschmaus|geselchtes|selchfleisch/i, "-qdbEA4Ij_I"],
  [/beuschel/i, "WgrOML7JhSU"],
  [/kalbsleber/i, "OhQEJezb6eA"],
  [/krainer|würstel/i, "u0gs_AzC9CQ"],
  [/puten.*medaillon|schweinemedaillon/i, "7XYezj9RxYM"],

  // ── FISCH ──
  [/lachs/i, "gUFI8SxNvxo"],
  [/forelle|müllerin/i, "bpPTlXWTOvg"],
  [/zander|dorsch|seelachs|pangasius|scholle/i, "AnC569NdAJc"],
  [/fischstäbchen|fischknusperle|gebacken.*karpfen|kabeljau/i, "YpQGo0QTshE"],
  [/garnele|shrimp/i, "ZD_CEnhS630"],
  [/thunfisch/i, "AnC569NdAJc"],
  [/matjes|karpfen/i, "bpPTlXWTOvg"],

  // ── VEGETARISCH — Teigwaren ──
  [/käsespätzle|mac.*cheese/i, "L4WylHZLl18"],
  [/lasagne/i, "PgkGsxjvGB4"],
  [/pasta|penne|rigatoni|spaghetti|tortellini|nudel.*auflauf|arrabiata|pomodoro|aglio/i, "SjrlOk3c-hc"],
  [/krautfleckerl|schinkenfleckerl/i, "SjrlOk3c-hc"],
  [/flammkuchen/i, "lJLXlh7KT38"],

  // ── VEGETARISCH — Strudel & Quiche ──
  [/strudel/i, "1QDNaIYlKVo"],
  [/quiche|tarte|zwiebelkuchen/i, "lJLXlh7KT38"],

  // ── VEGETARISCH — Knödel & Mehlspeisen ──
  [/kaiserschmarrn/i, "s_aGnOcfCq0"],
  [/palatschinken/i, "DAWIsEOcyx0"],
  [/marillenknödel|zwetschgenknödel/i, "K8z5FJUay74"],
  [/germknödel/i, "K8z5FJUay74"],
  [/spinatknödel|kaspressknödel|topfenknödel/i, "SiwrpBnxDww"],
  [/mohnnudeln/i, "SjrlOk3c-hc"],

  // ── VEGETARISCH — Aufläufe, Laibchen, Currys ──
  [/auflauf|gratin|moussaka|überbacken|parmigiana/i, "WpnGOZ3C5uU"],
  [/laibchen|bratlinge?|puffer|falafel|kichererbsen/i, "pQnsKWk5ljQ"],
  [/ratatouille/i, "R02KgL5Ti3Y"],
  [/curry|dal|linsen.*dal/i, "vgTntT8PmIM"],
  [/chili\s*sin/i, "vgTntT8PmIM"],
  [/gefüllte?\s*paprika|gefüllte?\s*zucchini|gefüllte?\s*champignon/i, "tFlpXzfxrzE"],
  [/wok|gemüsepfanne/i, "vgTntT8PmIM"],
  [/polenta.*schwammerl|eierschwammerl.*knödel|erdäpfelgulasch|pilzragout/i, "AcUUyHEQMwQ"],
  [/eierspeise|bauernomelett|knödel.*ei/i, "s_aGnOcfCq0"],

  // ── BEILAGEN — Kartoffel ──
  [/kartoffelpüree|erdäpfelpüree|püree/i, "LA0nKKY-SFo"],
  [/bratkartoffel|röstkartoffel|rösterdäpfel|schwenkkartoffel/i, "g2yjXF1fdn4"],
  [/pommes|frites|wedges|kartoffelspalten/i, "d5PbKQJ0Lu8"],
  [/kartoffelgratin/i, "lqRfdLcZm_w"],
  [/ofenkartoffel|hasselback/i, "g2yjXF1fdn4"],
  [/kartoffelrösti|reibekuchen|erdäpfelpuffer/i, "g2yjXF1fdn4"],
  [/herzoginkartoffel|krokette/i, "d5PbKQJ0Lu8"],
  [/petersilkartoffel|salzkartoffel/i, "LA0nKKY-SFo"],
  [/erdäpfelsalat|kartoffelsalat/i, "qrDM1rmKgOQ"],

  // ── BEILAGEN — Knödel ──
  [/semmelknödel|serviettenknödel|speckknödel|böhmische.*knödel/i, "N_yNKu-KW28"],
  [/kartoffelknödel|waldviertler|grammelknödel/i, "N_yNKu-KW28"],

  // ── BEILAGEN — Teigwaren & Getreide ──
  [/spätzle|eierspätzle|butternockerl|nockerl/i, "6PEuDjxChlA"],
  [/reis|basmatireis|safranreis/i, "xmuIgjuQG0M"],
  [/risotto/i, "qIPRTMulc-g"],
  [/polenta|maisgrieß/i, "iIhidk0lr9I"],
  [/gnocchi|schupfnudeln/i, "ZD_CEnhS630"],
  [/couscous|bulgur|ebly|quinoa|hirse|buchweizen/i, "XL3UhgGNa8c"],
  [/dampfnudel|griesschnitten/i, "N_yNKu-KW28"],
  [/fusilli|penne|bandnudel|spiralnudel/i, "SjrlOk3c-hc"],

  // ── GEMÜSEBEILAGEN ──
  [/sauerkraut|speckkraut|rahmkraut/i, "0dD78weVWpg"],
  [/rotkraut|rotkohl/i, "IbDhMlLu0GY"],
  [/rahmspinat|blattspinat|mangold/i, "O6ZhaRtXa3Q"],
  [/brokkoli|broccoli/i, "YTw7O_IY4l0"],
  [/karotten.*gemüse|glasiert/i, "bPNvATD1cvc"],
  [/champignon|schwammerl|eierschwammerl|steinpilz|pilzmischung/i, "AcUUyHEQMwQ"],
  [/salat|vogerlsalat|blattsalat|gurkensalat|tomatensalat|krautsalat/i, "IGfIGP5ONV0"],
  [/ofengemüse|bratgemüse|ratatouille.*beilage/i, "asK-tikpD5A"],
  [/fisolen|grüne.*bohnen|zuckerschoten/i, "YTw7O_IY4l0"],
  [/erbsen|erbsen.*karotten/i, "bPNvATD1cvc"],
  [/zucchini.*gemüse|paprika.*gemüse|melanzani|aubergine/i, "asK-tikpD5A"],
  [/kohlrabi|kohlsprossen|rosenkohl|wirsing|spitzkohl|grünkohl|chinakohl/i, "IbDhMlLu0GY"],
  [/kürbis.*gemüse|wurzelgemüse|sellerie.*gemüse|pastinaken|rübengemüse|topinambur|petersilienwurzel|steckrüben/i, "bPNvATD1cvc"],
  [/spargel/i, "bPNvATD1cvc"],
  [/preiselbeeren?|apfelkren|semmelkren|schnittlauchsauce|kräuterdip|kräuterrahm/i, "IGfIGP5ONV0"],

  // ── MEHLSPEISE-GARNITUREN ──
  [/vanillesauce|vanilleeis|schlagobers|topfencreme/i, "1551024506-0bccd828d307"],
  [/butterbrösel|staubzucker|zimtzucker|mohnbutter|nussbrösel/i, "1551024506-0bccd828d307"],
  [/röster|kompott|fruchtcoulis|schokoladensauce/i, "1488477181946-6428a0291777"],
];

// ═══════════════════════════════════════════════════════════
// Category fallback (used when no keyword matches)
// ═══════════════════════════════════════════════════════════
const CATEGORY_IMAGES: Record<string, string> = {
  ClearSoups: "1547592166-23ac45744acd",
  CreamSoups: "1603105037880-880cd4edfb0d",
  MainMeat: "1544025162-d76694265947",
  MainFish: "1467003909585-2f8a72700288",
  MainVegan: "1512621776951-a57141f2eefd",
  Sides: "1568901346375-23c9450c58cd",
  ColdSauces: "1472476443507-c7a5948772fc",
  HotSauces: "1472476443507-c7a5948772fc",
  Salads: "1540420773420-3366772f4999",
  HotDesserts: "1551024506-0bccd828d307",
  ColdDesserts: "1488477181946-6428a0291777",
};

const DEFAULT_IMAGE = "1495521821757-a1efb6729352";

function buildUrl(id: string): string {
  // Support both "photo-XXXXX" format and bare IDs
  const cleanId = id.startsWith("photo-") ? id : `photo-${id}`;
  return `https://images.unsplash.com/${cleanId}?auto=format&fit=crop&q=80&w=800`;
}

export function getDefaultRecipeImage(category?: string | null, recipeName?: string | null): string {
  // 1. Try keyword match on recipe name
  if (recipeName) {
    for (const [pattern, photoId] of DISH_IMAGES) {
      if (pattern.test(recipeName)) {
        return buildUrl(photoId);
      }
    }
  }

  // 2. Fall back to category image
  const catId = (category && CATEGORY_IMAGES[category]) || DEFAULT_IMAGE;
  return buildUrl(catId);
}

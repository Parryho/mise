/**
 * Dish-specific default images for recipes without photos.
 * Uses keyword matching on recipe name → image URL.
 * Falls back to category → generic default.
 * Uses Unsplash source URLs (stable, no API key needed).
 */

// ═══════════════════════════════════════════════════════════
// Keyword → Unsplash photo ID mapping (~80 dish types)
// Order matters: first match wins.
// Uses stable source.unsplash.com URLs (always resolve).
// ═══════════════════════════════════════════════════════════
const DISH_IMAGES: [RegExp, string][] = [
  // ── SUPPEN ──
  [/kürbis.*suppe|kürbiscreme/i, "mFnbFaCIu1I"],
  [/tomate.*suppe|tomaten.*suppe/i, "Hk9oENaEPFQ"],
  [/spargel.*suppe/i, "EMKdJH3MNew"],
  [/champignon.*suppe|pilz.*suppe|schwammerl.*suppe/i, "FIKD9t5_5zQ"],
  [/brokkoli.*suppe/i, "F_gDXPdJvFo"],
  [/karotte.*suppe/i, "DcJsSagiinc"],
  [/linsen.*suppe|rote.?linsen/i, "IGyfB4tgfPM"],
  [/bohnen.*suppe|serbische.*bohnen/i, "KlQetBDtkWc"],
  [/minestrone/i, "Bkci_8qcdvQ"],
  [/zwiebel.*suppe|französische.*zwiebel/i, "QoGcamBq7Kc"],
  [/erbsen.*suppe/i, "F_gDXPdJvFo"],
  [/borschtsch|rote.?rüben.?suppe/i, "7-ORJL3BraM"],
  [/kokos.*suppe|thai/i, "vHnVtLK8rCc"],
  [/gazpacho|kalte.*gurken/i, "Hk9oENaEPFQ"],
  [/gulasch.*suppe|kartoffelgulasch/i, "hrlvr2ZlUNk"],
  [/leberknödel.*suppe/i, "pEGMsjMfVXQ"],
  [/grießnockerl|griesnockerl/i, "pEGMsjMfVXQ"],
  [/fritaten|flädle/i, "pEGMsjMfVXQ"],
  [/rinds.*suppe.*klar|klar.*suppe|backerbsen/i, "pEGMsjMfVXQ"],
  [/cremesuppe|creme.*suppe/i, "mFnbFaCIu1I"],
  [/erdäpfel.*suppe|kartoffel.*suppe/i, "Bkci_8qcdvQ"],

  // ── FLEISCH — Paniertes ──
  [/schnitzel|paniert|pariser/i, "nUsJPqZL9RE"],
  [/cordon\s*bleu/i, "nUsJPqZL9RE"],
  [/backhendl|backhuhn/i, "2dDANFSyV5A"],
  [/surschnitzel/i, "nUsJPqZL9RE"],

  // ── FLEISCH — Braten ──
  [/schweinsbraten|kümmelbraten|spanferkel/i, "AhLw1xvSsJY"],
  [/tafelspitz|tellerfleisch/i, "ssLprRPsqeE"],
  [/zwiebelrostbraten/i, "sBKLiRcdRTM"],
  [/rindsbraten|sauerbraten|rindfleisch/i, "sBKLiRcdRTM"],
  [/kalbsbraten|kalbs/i, "sBKLiRcdRTM"],
  [/faschierter?\s*braten/i, "HbTetDPyXrc"],
  [/stelze|schweinshaxe|haxe/i, "AhLw1xvSsJY"],
  [/lamm/i, "P7IwLMXOmhE"],
  [/ente|entenkeule/i, "GpoA8BIkVJE"],
  [/gans|gansl/i, "GpoA8BIkVJE"],
  [/reh|hirsch|wild/i, "P7IwLMXOmhE"],

  // ── FLEISCH — Gulasch & Ragout ──
  [/gulasch|saftgulasch|fiaker/i, "hrlvr2ZlUNk"],
  [/geschnetzeltes|zürcher/i, "ssLprRPsqeE"],
  [/stroganoff/i, "hrlvr2ZlUNk"],
  [/ragout/i, "P7IwLMXOmhE"],

  // ── FLEISCH — Gebraten ──
  [/fleischlaberl|frikadelle/i, "HbTetDPyXrc"],
  [/leberkäse/i, "cX0Yg4a40Vs"],
  [/hühner.*keule|grillhendl|hendl/i, "2dDANFSyV5A"],
  [/cevapcici|cevap/i, "HbTetDPyXrc"],
  [/saltimbocca/i, "ssLprRPsqeE"],
  [/gröstl|blunzen/i, "HbTetDPyXrc"],
  [/bauernschmaus|geselchtes|selchfleisch/i, "AhLw1xvSsJY"],
  [/beuschel/i, "hrlvr2ZlUNk"],
  [/kalbsleber/i, "sBKLiRcdRTM"],
  [/krainer|würstel/i, "cX0Yg4a40Vs"],
  [/puten.*medaillon|schweinemedaillon/i, "ssLprRPsqeE"],

  // ── FISCH ──
  [/lachs/i, "JlO3-oY5ZlQ"],
  [/forelle|müllerin/i, "G2HA50x1gUo"],
  [/zander|dorsch|seelachs|pangasius|scholle/i, "G2HA50x1gUo"],
  [/fischstäbchen|fischknusperle|gebacken.*karpfen|kabeljau/i, "JlO3-oY5ZlQ"],
  [/garnele|shrimp/i, "0uAQMclz45I"],
  [/thunfisch/i, "JlO3-oY5ZlQ"],
  [/matjes|karpfen/i, "G2HA50x1gUo"],

  // ── VEGETARISCH — Teigwaren ──
  [/käsespätzle|mac.*cheese/i, "2pCBG2mDNBQ"],
  [/lasagne/i, "z_PfaGGOOBc"],
  [/pasta|penne|rigatoni|spaghetti|tortellini|nudel.*auflauf|arrabiata|pomodoro|aglio/i, "kcA-c3f_3FE"],
  [/krautfleckerl|schinkenfleckerl/i, "kcA-c3f_3FE"],
  [/flammkuchen/i, "MQUqbmszGGM"],

  // ── VEGETARISCH — Strudel & Quiche ──
  [/strudel/i, "fczBpWaFIHE"],
  [/quiche|tarte|zwiebelkuchen/i, "MQUqbmszGGM"],

  // ── VEGETARISCH — Knödel & Mehlspeisen ──
  [/kaiserschmarrn/i, "Y6OgisiGBjM"],
  [/palatschinken/i, "8Tpkec1Ximo"],
  [/marillenknödel|zwetschgenknödel/i, "OMhDIph8KBI"],
  [/germknödel/i, "OMhDIph8KBI"],
  [/spinatknödel|kaspressknödel|topfenknödel/i, "OMhDIph8KBI"],
  [/mohnnudeln/i, "kcA-c3f_3FE"],

  // ── VEGETARISCH — Aufläufe, Laibchen, Currys ──
  [/auflauf|gratin|moussaka|überbacken|parmigiana/i, "z_PfaGGOOBc"],
  [/laibchen|bratlinge?|puffer|falafel|kichererbsen/i, "uvdtfFeRdB8"],
  [/ratatouille/i, "12eHC6FxPyg"],
  [/curry|dal|linsen.*dal/i, "6JBgMRVvGiU"],
  [/chili\s*sin/i, "6JBgMRVvGiU"],
  [/gefüllte?\s*paprika|gefüllte?\s*zucchini|gefüllte?\s*champignon/i, "12eHC6FxPyg"],
  [/wok|gemüsepfanne/i, "6JBgMRVvGiU"],
  [/polenta.*schwammerl|eierschwammerl.*knödel|erdäpfelgulasch|pilzragout/i, "oGiGVffOHhg"],
  [/eierspeise|bauernomelett|knödel.*ei/i, "Y6OgisiGBjM"],

  // ── BEILAGEN — Kartoffel ──
  [/kartoffelpüree|erdäpfelpüree|püree/i, "2e3hm6vKQ3g"],
  [/bratkartoffel|röstkartoffel|rösterdäpfel|schwenkkartoffel/i, "tOYiQxFsPGE"],
  [/pommes|frites|wedges|kartoffelspalten/i, "vi0kZuoe0-8"],
  [/kartoffelgratin/i, "2e3hm6vKQ3g"],
  [/ofenkartoffel|hasselback/i, "tOYiQxFsPGE"],
  [/kartoffelrösti|reibekuchen|erdäpfelpuffer/i, "tOYiQxFsPGE"],
  [/herzoginkartoffel|krokette/i, "vi0kZuoe0-8"],
  [/petersilkartoffel|salzkartoffel/i, "2e3hm6vKQ3g"],
  [/erdäpfelsalat|kartoffelsalat/i, "08bOYnH_r_E"],

  // ── BEILAGEN — Knödel ──
  [/semmelknödel|serviettenknödel|speckknödel|böhmische.*knödel/i, "OMhDIph8KBI"],
  [/kartoffelknödel|waldviertler|grammelknödel/i, "OMhDIph8KBI"],

  // ── BEILAGEN — Teigwaren & Getreide ──
  [/spätzle|eierspätzle|butternockerl|nockerl/i, "2pCBG2mDNBQ"],
  [/reis|basmatireis|safranreis/i, "jcLcWL8DIoI"],
  [/risotto/i, "12eHC6FxPyg"],
  [/polenta|maisgrieß/i, "jcLcWL8DIoI"],
  [/gnocchi|schupfnudeln/i, "kcA-c3f_3FE"],
  [/couscous|bulgur|ebly|quinoa|hirse|buchweizen/i, "jcLcWL8DIoI"],
  [/dampfnudel|griesschnitten/i, "OMhDIph8KBI"],
  [/fusilli|penne|bandnudel|spiralnudel/i, "kcA-c3f_3FE"],

  // ── GEMÜSEBEILAGEN ──
  [/sauerkraut|speckkraut|rahmkraut/i, "qnKhZJPKFD8"],
  [/rotkraut|rotkohl/i, "qnKhZJPKFD8"],
  [/rahmspinat|blattspinat|mangold/i, "IGfIGP5ONV0"],
  [/brokkoli|broccoli/i, "kXQ3J7_2fpc"],
  [/karotten.*gemüse|glasiert/i, "kXQ3J7_2fpc"],
  [/champignon|schwammerl|eierschwammerl|steinpilz|pilzmischung/i, "oGiGVffOHhg"],
  [/salat|vogerlsalat|blattsalat|gurkensalat|tomatensalat|krautsalat/i, "IGfIGP5ONV0"],
  [/ofengemüse|bratgemüse|ratatouille.*beilage/i, "12eHC6FxPyg"],
  [/fisolen|grüne.*bohnen|zuckerschoten/i, "kXQ3J7_2fpc"],
  [/erbsen|erbsen.*karotten/i, "kXQ3J7_2fpc"],
  [/zucchini.*gemüse|paprika.*gemüse|melanzani|aubergine/i, "12eHC6FxPyg"],
  [/kohlrabi|kohlsprossen|rosenkohl|wirsing|spitzkohl|grünkohl|chinakohl/i, "qnKhZJPKFD8"],
  [/kürbis.*gemüse|wurzelgemüse|sellerie.*gemüse|pastinaken|rübengemüse|topinambur|petersilienwurzel|steckrüben/i, "kXQ3J7_2fpc"],
  [/spargel/i, "kXQ3J7_2fpc"],
  [/preiselbeeren?|apfelkren|semmelkren|schnittlauchsauce|kräuterdip|kräuterrahm/i, "IGfIGP5ONV0"],

  // ── MEHLSPEISE-GARNITUREN ──
  [/vanillesauce|vanilleeis|schlagobers|topfencreme/i, "mBGxm_yfxa4"],
  [/butterbrösel|staubzucker|zimtzucker|mohnbutter|nussbrösel/i, "mBGxm_yfxa4"],
  [/röster|kompott|fruchtcoulis|schokoladensauce/i, "doYk-KIqwJA"],
];

// ═══════════════════════════════════════════════════════════
// Category fallback (used when no keyword matches)
// ═══════════════════════════════════════════════════════════
const CATEGORY_IMAGES: Record<string, string> = {
  ClearSoups: "pEGMsjMfVXQ",
  CreamSoups: "mFnbFaCIu1I",
  MainMeat: "sBKLiRcdRTM",
  MainFish: "JlO3-oY5ZlQ",
  MainVegan: "12eHC6FxPyg",
  Sides: "tOYiQxFsPGE",
  ColdSauces: "IGfIGP5ONV0",
  HotSauces: "hrlvr2ZlUNk",
  Salads: "IGfIGP5ONV0",
  HotDesserts: "Y6OgisiGBjM",
  ColdDesserts: "doYk-KIqwJA",
};

const DEFAULT_IMAGE = "sBKLiRcdRTM";

function buildSourceUrl(id: string): string {
  // Timestamp-based IDs (e.g., "1476718406336-bb5a9690ee2a") need photo- prefix
  if (/^\d{13}-/.test(id)) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`;
  }
  // Short IDs (e.g., "MyfbM2QYF4o") use source.unsplash.com for reliable resolution
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;
}

export function getDefaultRecipeImage(category?: string | null, recipeName?: string | null): string {
  // 1. Try keyword match on recipe name
  if (recipeName) {
    for (const [pattern, photoId] of DISH_IMAGES) {
      if (pattern.test(recipeName)) {
        return buildSourceUrl(photoId);
      }
    }
  }

  // 2. Fall back to category image
  const catId = (category && CATEGORY_IMAGES[category]) || DEFAULT_IMAGE;
  return buildSourceUrl(catId);
}

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import i18nInstance from "@/i18n";

// Translations
export type Language = "de" | "en" | "tr" | "uk";

// EU-14 Allergen codes per AT regulation (A-R, skipping I/J/K/Q)
export const ALLERGENS: Record<string, { code: string; [lang: string]: string }> = {
  A: { code: "A", de: "Glutenhaltiges Getreide", en: "Gluten", tr: "Gluten", uk: "Глютен" },
  B: { code: "B", de: "Krebstiere", en: "Crustaceans", tr: "Kabuklular", uk: "Ракоподібні" },
  C: { code: "C", de: "Eier", en: "Eggs", tr: "Yumurta", uk: "Яйця" },
  D: { code: "D", de: "Fisch", en: "Fish", tr: "Balik", uk: "Риба" },
  E: { code: "E", de: "Erdnüsse", en: "Peanuts", tr: "Yer fistigi", uk: "Арахіс" },
  F: { code: "F", de: "Soja", en: "Soy", tr: "Soya", uk: "Соя" },
  G: { code: "G", de: "Milch/Laktose", en: "Milk/Lactose", tr: "Süt", uk: "Молоко" },
  H: { code: "H", de: "Schalenfrüchte", en: "Nuts", tr: "Kabuklu yemisler", uk: "Горіхи" },
  L: { code: "L", de: "Sellerie", en: "Celery", tr: "Kereviz", uk: "Селера" },
  M: { code: "M", de: "Senf", en: "Mustard", tr: "Hardal", uk: "Гірчиця" },
  N: { code: "N", de: "Sesam", en: "Sesame", tr: "Susam", uk: "Кунжут" },
  O: { code: "O", de: "Sulfite/Schwefeldioxid", en: "Sulphites", tr: "Sülfitler", uk: "Сульфіти" },
  P: { code: "P", de: "Lupinen", en: "Lupin", tr: "Acibakla", uk: "Люпин" },
  R: { code: "R", de: "Weichtiere", en: "Molluscs", tr: "Yumusakçalar", uk: "Молюски" },
};

export type AllergenCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "L" | "M" | "N" | "O" | "P" | "R";

const TRANSLATIONS = {
  de: {
    dashboard: "Übersicht",
    recipes: "Rezepte",
    haccp: "HACCP",
    reports: "Berichte",
    settings: "Einstellungen",
    home: "Startseite",
    kitchenOverview: "Küchen-Übersicht",
    activeRecipes: "Aktive Rezepte",
    pendingChecks: "Ausstehende Checks",
    logTemperature: "Temperatur erfassen",
    morningCheck: "Morgen-Runde",
    quickActions: "Schnellaktionen",
    recentActivity: "Letzte Aktivitäten",
    searchRecipes: "Rezepte suchen...",
    portions: "Portionen",
    prepTime: "Zubereitung",
    ingredients: "Zutaten",
    preparation: "Zubereitungsschritte",
    allergens: "Allergene",
    all: "Alle",
    save: "Speichern",
    cancel: "Abbrechen",
    language: "Sprache",
    exportPDF: "PDF Exportieren",
    comingSoon: "Demnächst verfügbar",
    fridge: "Kühlgerät",
    temperature: "Temperatur",
    status: "Status",
    user: "Benutzer",
    history: "Verlauf",
    noData: "Keine Daten",
    logCheck: "Messung erfassen",
    saveRecord: "Eintrag speichern",
    clear: "Löschen",
    range: "Bereich",
    lastCheck: "Letzte Prüfung",
    by: "Von",
    exportComplete: "Export abgeschlossen",
    warningRecorded: "Warnung erfasst",
    temperatureRecorded: "Temperatur erfasst",
    selectLanguage: "Sprache wählen",
    filterByAllergen: "Nach Allergen filtern",
    noAllergens: "Keine Allergene",
    addRecipe: "Rezept hinzufügen",
    recipeName: "Rezeptname",
    category: "Kategorie",
    image: "Bild",
    sourceUrl: "Website-Link (optional)",
    addIngredient: "Zutat hinzufügen",
    addStep: "Schritt hinzufügen",
    visitWebsite: "Website besuchen",
    categories: {
      ClearSoups: "Klare Suppen",
      CreamSoups: "Cremesuppen",
      MainMeat: "Haupt-Fleisch",
      MainFish: "Haupt-Fisch",
      MainVegan: "Haupt-Vegan/Vegi",
      Sides: "Beilagen",
      ColdSauces: "Kalte Saucen",
      HotSauces: "Warme Saucen",
      Salads: "Salate",
      HotDesserts: "Warme Dessert",
      ColdDesserts: "Kalte Dessert"
    }
  },
  en: {
    dashboard: "Dashboard",
    recipes: "Recipes",
    haccp: "HACCP",
    reports: "Reports",
    settings: "Settings",
    home: "Home",
    kitchenOverview: "Kitchen Overview",
    activeRecipes: "Active Recipes",
    pendingChecks: "Pending Checks",
    logTemperature: "Log Temperature",
    morningCheck: "Morning Check",
    quickActions: "Quick Actions",
    recentActivity: "Recent Activity",
    searchRecipes: "Search recipes...",
    portions: "Portions",
    prepTime: "Prep Time",
    ingredients: "Ingredients",
    preparation: "Preparation",
    allergens: "Allergens",
    all: "All",
    save: "Save",
    cancel: "Cancel",
    language: "Language",
    exportPDF: "Export PDF",
    comingSoon: "Coming Soon",
    fridge: "Fridge",
    temperature: "Temperature",
    status: "Status",
    user: "User",
    history: "History",
    noData: "No Data",
    logCheck: "Log Check",
    saveRecord: "Save Record",
    clear: "Clear",
    range: "Range",
    lastCheck: "Last check",
    by: "By",
    exportComplete: "Export Complete",
    warningRecorded: "Warning Recorded",
    temperatureRecorded: "Temperature Recorded",
    selectLanguage: "Select Language",
    filterByAllergen: "Filter by Allergen",
    noAllergens: "No Allergens",
    addRecipe: "Add Recipe",
    recipeName: "Recipe Name",
    category: "Category",
    image: "Image",
    sourceUrl: "Website Link (optional)",
    addIngredient: "Add Ingredient",
    addStep: "Add Step",
    visitWebsite: "Visit Website",
    categories: {
      ClearSoups: "Clear Soups",
      CreamSoups: "Cream Soups",
      MainMeat: "Main Meat",
      MainFish: "Main Fish",
      MainVegan: "Main Vegan/Veg",
      Sides: "Sides",
      ColdSauces: "Cold Sauces",
      HotSauces: "Hot Sauces",
      Salads: "Salads",
      HotDesserts: "Hot Desserts",
      ColdDesserts: "Cold Desserts"
    }
  },
  tr: {
    dashboard: "Genel Bakis",
    recipes: "Tarifler",
    haccp: "HACCP",
    reports: "Raporlar",
    settings: "Ayarlar",
    home: "Ana Sayfa",
    kitchenOverview: "Mutfak Genel Bakisi",
    activeRecipes: "Aktif Tarifler",
    pendingChecks: "Bekleyen Kontroller",
    logTemperature: "Sicaklik Kaydet",
    morningCheck: "Sabah Kontrolü",
    quickActions: "Hizli Islemler",
    recentActivity: "Son Aktiviteler",
    searchRecipes: "Tarif ara...",
    portions: "Porsiyon",
    prepTime: "Hazirlama Süresi",
    ingredients: "Malzemeler",
    preparation: "Hazirlama Adimlari",
    allergens: "Alerjenler",
    all: "Tümü",
    save: "Kaydet",
    cancel: "Iptal",
    language: "Dil",
    exportPDF: "PDF Indir",
    comingSoon: "Yakinda",
    fridge: "Buzdolabi",
    temperature: "Sicaklik",
    status: "Durum",
    user: "Kullanici",
    history: "Gecmis",
    noData: "Veri Yok",
    logCheck: "Kontrol Kaydet",
    saveRecord: "Kaydi Kaydet",
    clear: "Temizle",
    range: "Aralik",
    lastCheck: "Son Kontrol",
    by: "Tarafindan",
    exportComplete: "Disa Aktarma Tamamlandi",
    warningRecorded: "Uyari Kaydedildi",
    temperatureRecorded: "Sicaklik Kaydedildi",
    selectLanguage: "Dil Seçin",
    filterByAllergen: "Alerjene Göre Filtrele",
    noAllergens: "Alerjen Yok",
    addRecipe: "Tarif Ekle",
    recipeName: "Tarif Adi",
    category: "Kategori",
    image: "Resim",
    sourceUrl: "Web Sitesi Linki (istege bagli)",
    addIngredient: "Malzeme Ekle",
    addStep: "Adim Ekle",
    visitWebsite: "Web Sitesini Ziyaret Et",
    categories: {
      ClearSoups: "Berrak Çorbalar",
      CreamSoups: "Kremali Çorbalar",
      MainMeat: "Ana Yemek - Et",
      MainFish: "Ana Yemek - Balik",
      MainVegan: "Ana Yemek - Vegan/Vejeteryan",
      Sides: "Garnitürler",
      ColdSauces: "Soguk Soslar",
      HotSauces: "Sicak Soslar",
      Salads: "Salatalar",
      HotDesserts: "Sicak Tatlilar",
      ColdDesserts: "Soguk Tatlilar"
    }
  },
  uk: {
    dashboard: "Огляд",
    recipes: "Рецепти",
    haccp: "HACCP",
    reports: "Звіти",
    settings: "Налаштування",
    home: "Головна",
    kitchenOverview: "Огляд кухні",
    activeRecipes: "Активні рецепти",
    pendingChecks: "Очікують перевірки",
    logTemperature: "Записати температуру",
    morningCheck: "Ранковий огляд",
    quickActions: "Швидкі дії",
    recentActivity: "Остання активність",
    searchRecipes: "Шукати рецепти...",
    portions: "Порції",
    prepTime: "Час приготування",
    ingredients: "Інгредієнти",
    preparation: "Кроки приготування",
    allergens: "Алергени",
    all: "Всі",
    save: "Зберегти",
    cancel: "Скасувати",
    language: "Мова",
    exportPDF: "Експорт PDF",
    comingSoon: "Незабаром",
    fridge: "Холодильник",
    temperature: "Температура",
    status: "Статус",
    user: "Користувач",
    history: "Історія",
    noData: "Немає даних",
    logCheck: "Записати перевірку",
    saveRecord: "Зберегти запис",
    clear: "Очистити",
    range: "Діапазон",
    lastCheck: "Остання перевірка",
    by: "Від",
    exportComplete: "Експорт завершено",
    warningRecorded: "Попередження записано",
    temperatureRecorded: "Температуру записано",
    selectLanguage: "Обрати мову",
    filterByAllergen: "Фільтр за алергеном",
    noAllergens: "Без алергенів",
    addRecipe: "Додати рецепт",
    recipeName: "Назва рецепту",
    category: "Категорія",
    image: "Зображення",
    sourceUrl: "Посилання (необов'язково)",
    addIngredient: "Додати інгредієнт",
    addStep: "Додати крок",
    visitWebsite: "Відвідати сайт",
    categories: {
      ClearSoups: "Прозорі супи",
      CreamSoups: "Крем-супи",
      MainMeat: "Основна страва - м'ясо",
      MainFish: "Основна страва - риба",
      MainVegan: "Основна страва - веган/вег",
      Sides: "Гарніри",
      ColdSauces: "Холодні соуси",
      HotSauces: "Гарячі соуси",
      Salads: "Салати",
      HotDesserts: "Гарячі десерти",
      ColdDesserts: "Холодні десерти"
    }
  }
};

type TranslationSchema = typeof TRANSLATIONS.de;
// Exclude nested objects to ensure t() always returns a string
type StringKeys = { [K in keyof TranslationSchema]: TranslationSchema[K] extends string ? K : never }[keyof TranslationSchema];

export const useTranslation = () => {
  const [lang, setLangState] = useState<Language>(() => {
    // Read from react-i18next's language (single source of truth)
    const i18nLang = i18nInstance.language?.substring(0, 2);
    if (i18nLang === "de" || i18nLang === "en" || i18nLang === "tr" || i18nLang === "uk") return i18nLang;
    return "de";
  });

  // Listen to react-i18next language changes
  useEffect(() => {
    const handleChange = (lng: string) => {
      const short = lng.substring(0, 2) as Language;
      setLangState(short);
    };
    i18nInstance.on("languageChanged", handleChange);
    return () => { i18nInstance.off("languageChanged", handleChange); };
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    // Sync to react-i18next so new-system components also update
    i18nInstance.changeLanguage(newLang);
  }, []);

  const t = (key: StringKeys | string): string => {
    const translations = TRANSLATIONS[lang] as Record<string, any>;
    const val = translations[key];
    if (typeof val === 'string') {
      return val;
    }
    // Fallback to German
    const fallback = (TRANSLATIONS.de as Record<string, any>)[key];
    if (typeof fallback === 'string') {
      return fallback;
    }
    return key;
  };

  const tCat = (cat: string) => {
    const translations = TRANSLATIONS[lang] as Record<string, any>;
    const catMap = translations.categories as Record<string, string> | undefined;
    return catMap?.[cat] || (TRANSLATIONS.de.categories as Record<string, string>)[cat] || cat;
  };

  return { lang, setLang, t, tCat };
};

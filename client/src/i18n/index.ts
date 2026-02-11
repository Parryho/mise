import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import de from "./locales/de.json";
import en from "./locales/en.json";
import tr from "./locales/tr.json";
import uk from "./locales/uk.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      tr: { translation: tr },
      uk: { translation: uk },
    },
    fallbackLng: "de",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "mise-lang",
      caches: ["localStorage"],
    },
  });

export default i18n;

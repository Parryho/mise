import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "en", label: "English", flag: "EN" },
];

interface LanguageSwitcherProps {
  /** Compact mode shows only the flag/code, suitable for headers */
  compact?: boolean;
}

/**
 * LanguageSwitcher - A dropdown to switch between available languages.
 * Saves the selection to localStorage (key: 'mise-lang').
 * Compact design suitable for use in the header or settings page.
 */
export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    // i18next-browser-languagedetector will persist to localStorage automatically
  };

  const currentLang = i18n.language?.substring(0, 2) || "de";

  if (compact) {
    return (
      <Select value={currentLang} onValueChange={handleChange}>
        <SelectTrigger className="w-16 h-8 text-xs gap-1 border-0 bg-transparent">
          <Globe className="h-3.5 w-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.flag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={currentLang} onValueChange={handleChange}>
      <SelectTrigger className="w-40 h-9">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

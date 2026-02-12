import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "en", label: "English", flag: "EN" },
  { code: "tr", label: "Türkçe", flag: "TR" },
  { code: "uk", label: "Українська", flag: "UA" },
];

interface LanguageSwitcherProps {
  /** Compact mode shows inline buttons instead of a dropdown */
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLang = i18n.language?.substring(0, 2) || "de";

  if (compact) {
    return (
      <div className="flex gap-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-colors",
              currentLang === lang.code
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {lang.flag}
          </button>
        ))}
      </div>
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

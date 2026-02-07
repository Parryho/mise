/**
 * Convenience re-export of react-i18next's useTranslation hook.
 *
 * Usage:
 *   import { useTranslation } from "@/hooks/useTranslation";
 *
 *   function MyComponent() {
 *     const { t } = useTranslation();
 *     return <h1>{t("reports.title")}</h1>;
 *   }
 *
 * The `t` function supports nested keys using dot notation:
 *   t("nav.today")       -> "Heute" (de) / "Today" (en)
 *   t("common.save")     -> "Speichern" (de) / "Save" (en)
 *   t("reports.foodCost.title") -> "Food-Cost-Analyse" (de) / "Food Cost Analysis" (en)
 *
 * For interpolation:
 *   t("today.deleteTaskConfirm", { title: "My Task" })
 */
export { useTranslation } from "react-i18next";

import { I18nextProvider } from "react-i18next";
import i18n from "./index";

/**
 * I18nProvider wraps the application with react-i18next's I18nextProvider.
 *
 * Usage: Wrap your <App /> component (or the relevant subtree) with this provider.
 *
 * Example in App.tsx:
 *
 *   import { I18nProvider } from "@/i18n/I18nProvider";
 *
 *   function App() {
 *     return (
 *       <I18nProvider>
 *         <ErrorBoundary>
 *           <QueryClientProvider client={queryClient}>
 *             ...
 *           </QueryClientProvider>
 *         </ErrorBoundary>
 *       </I18nProvider>
 *     );
 *   }
 *
 * Note: This provider initializes i18next with:
 *   - Default language: 'de' (German)
 *   - Fallback language: 'de'
 *   - Language detection: localStorage ('mise-lang') then navigator language
 *   - Supported languages: 'de', 'en'
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

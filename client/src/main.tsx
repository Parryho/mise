import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import App from "./App";
import "./index.css";

// Initialize i18n before React renders
import "./i18n";

// Initialize Sentry before React renders (no-ops if VITE_SENTRY_DSN not set)
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

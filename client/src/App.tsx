import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LocationProvider } from "@/lib/location-context";
import Layout from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

import Login from "@/pages/Login";
import Recipes from "@/pages/Recipes";
import HACCP from "@/pages/HACCP";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Guests from "@/pages/Guests";
import Schedule from "@/pages/Schedule";
import Today from "@/pages/Today";

import Rotation from "@/pages/Rotation";
import RotationPrint from "@/pages/RotationPrint";
import ProductionList from "@/pages/ProductionList";
import ShoppingList from "@/pages/ShoppingList";
import Print from "@/pages/Print";
import Catering from "@/pages/Catering";
import MasterIngredients from "@/pages/MasterIngredients";
import NotFound from "@/pages/not-found";

// Phase 2: New pages
import Suppliers from "@/pages/Suppliers";
import GuestProfiles from "@/pages/GuestProfiles";
import AllergenOverview from "@/pages/AllergenOverview";
import BuffetCards from "@/pages/BuffetCards";
import QRGenerator from "@/pages/QRGenerator";
import PaxTrends from "@/pages/analytics/PaxTrends";
import HaccpCompliance from "@/pages/analytics/HaccpCompliance";
import HaccpAnomalies from "@/pages/analytics/HaccpAnomalies";
import PopularDishes from "@/pages/analytics/PopularDishes";
import FoodCost from "@/pages/analytics/FoodCost";

// Phase 3: AI-Powered pages
import PaxForecast from "@/pages/analytics/PaxForecast";
import WastePrediction from "@/pages/analytics/WastePrediction";
import SmartRotation from "@/pages/SmartRotation";
import RecipeAIImport from "@/pages/RecipeAIImport";
import RecipeSuggestions from "@/pages/RecipeSuggestions";

// Phase 4: Monitoring + Email + GDPR + Backup
import ServerStatus from "@/pages/ServerStatus";
import EmailSettings from "@/pages/EmailSettings";
import BackupRestore from "@/pages/BackupRestore";
import GDPRExport from "@/pages/GDPRExport";

// Phase 6: Agent Team
import AgentTeam from "@/pages/AgentTeam";

// Phase 5: Quiz Feedback + Learning Dashboard
import QuizFeedback from "@/pages/QuizFeedback";
import LearningDashboard from "@/pages/analytics/LearningDashboard";
import MenuQuiz from "@/pages/MenuQuiz";

// Phase 2: Public pages (no auth)
import GuestMenu from "@/pages/public/GuestMenu";
import DigitalSignage from "@/pages/public/DigitalSignage";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/today" />
      </Route>
      <Route path="/recipes/ingredients">
        <Layout><MasterIngredients /></Layout>
      </Route>
      <Route path="/recipes">
        <Layout><Recipes /></Layout>
      </Route>
      <Route path="/quiz">
        <Layout><MenuQuiz /></Layout>
      </Route>
      <Route path="/haccp">
        <Layout><HACCP /></Layout>
      </Route>
      <Route path="/guests">
        <Layout><Guests /></Layout>
      </Route>
      <Route path="/schedule">
        <Layout><Schedule /></Layout>
      </Route>
      <Route path="/menu">
        <Redirect to="/rotation" />
      </Route>
      <Route path="/today">
        <Layout><Today /></Layout>
      </Route>
      <Route path="/reports">
        <Layout><Reports /></Layout>
      </Route>
      <Route path="/reports/pax-trends">
        <Layout><PaxTrends /></Layout>
      </Route>
      <Route path="/reports/haccp-compliance">
        <Layout><HaccpCompliance /></Layout>
      </Route>
      <Route path="/reports/haccp-anomalies">
        <Layout><HaccpAnomalies /></Layout>
      </Route>
      <Route path="/reports/popular-dishes">
        <Layout><PopularDishes /></Layout>
      </Route>
      <Route path="/reports/food-cost">
        <Layout><FoodCost /></Layout>
      </Route>
      <Route path="/reports/allergens">
        <Layout><AllergenOverview /></Layout>
      </Route>
      <Route path="/reports/buffet-cards">
        <Layout><BuffetCards /></Layout>
      </Route>
      <Route path="/reports/qr-codes">
        <Layout><QRGenerator /></Layout>
      </Route>
      <Route path="/reports/pax-forecast">
        <Layout><PaxForecast /></Layout>
      </Route>
      <Route path="/reports/waste-prediction">
        <Layout><WastePrediction /></Layout>
      </Route>
      <Route path="/reports/learning">
        <Layout><LearningDashboard /></Layout>
      </Route>
      <Route path="/recipes/ai-import">
        <Layout><RecipeAIImport /></Layout>
      </Route>
      <Route path="/recipes/suggestions">
        <Layout><RecipeSuggestions /></Layout>
      </Route>
      <Route path="/rotation/smart">
        <Layout><SmartRotation /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><Settings /></Layout>
      </Route>
      <Route path="/settings/server-status">
        <Layout><ServerStatus /></Layout>
      </Route>
      <Route path="/settings/email">
        <Layout><EmailSettings /></Layout>
      </Route>
      <Route path="/settings/backup">
        <Layout><BackupRestore /></Layout>
      </Route>
      <Route path="/settings/gdpr">
        <Layout><GDPRExport /></Layout>
      </Route>
      <Route path="/settings/suppliers">
        <Layout><Suppliers /></Layout>
      </Route>
      <Route path="/settings/guest-profiles">
        <Layout><GuestProfiles /></Layout>
      </Route>
      <Route path="/agent-team">
        <Layout><AgentTeam /></Layout>
      </Route>
      <Route path="/rotation/quiz">
        <Layout><QuizFeedback /></Layout>
      </Route>
      <Route path="/rotation/print">
        <Layout><RotationPrint /></Layout>
      </Route>
      <Route path="/rotation">
        <Layout><Rotation /></Layout>
      </Route>
      <Route path="/production">
        <Layout><ProductionList /></Layout>
      </Route>
      <Route path="/shopping">
        <Layout><ShoppingList /></Layout>
      </Route>
      <Route path="/catering">
        <Layout><Catering /></Layout>
      </Route>
      <Route path="/print">
        <Layout><Print /></Layout>
      </Route>
      <Route path="/login">
        <Redirect to="/today" />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Public routes (no auth required)
  return (
    <Switch>
      <Route path="/speisekarte/:locationSlug/:date?">
        <GuestMenu />
      </Route>
      <Route path="/signage/:locationSlug">
        <DigitalSignage />
      </Route>
      {user ? (
        <Route>
          <AuthenticatedRoutes />
        </Route>
      ) : (
        <>
          <Route path="/login">
            <Login />
          </Route>
          <Route>
            <Redirect to="/login" />
          </Route>
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="mise-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppProvider>
              <LocationProvider>
                <Router />
                <Toaster />
              </LocationProvider>
            </AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

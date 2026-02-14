import { lazy, Suspense } from "react";
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

// Static: Always needed immediately
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import Today from "@/pages/Today";
import NotFound from "@/pages/not-found";

// Lazy-loaded pages — each becomes its own chunk
const Recipes = lazy(() => import("@/pages/Recipes"));
const HACCP = lazy(() => import("@/pages/HACCP"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const GuestsHub = lazy(() => import("@/pages/GuestsHub"));
const Schedule = lazy(() => import("@/pages/Schedule"));
const MenuPlan = lazy(() => import("@/pages/MenuPlan"));
const Rotation = lazy(() => import("@/pages/Rotation"));
const RotationPrint = lazy(() => import("@/pages/RotationPrint"));
const ProductionList = lazy(() => import("@/pages/ProductionList"));
const ShoppingList = lazy(() => import("@/pages/ShoppingList"));
const Print = lazy(() => import("@/pages/Print"));
const MasterIngredients = lazy(() => import("@/pages/MasterIngredients"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const AllergenOverview = lazy(() => import("@/pages/AllergenOverview"));
const BuffetCards = lazy(() => import("@/pages/BuffetCards"));
const QRGenerator = lazy(() => import("@/pages/QRGenerator"));
const PaxTrends = lazy(() => import("@/pages/analytics/PaxTrends"));
const HaccpCompliance = lazy(() => import("@/pages/analytics/HaccpCompliance"));
const HaccpAnomalies = lazy(() => import("@/pages/analytics/HaccpAnomalies"));
const PopularDishes = lazy(() => import("@/pages/analytics/PopularDishes"));
const FoodCost = lazy(() => import("@/pages/analytics/FoodCost"));
const PaxForecast = lazy(() => import("@/pages/analytics/PaxForecast"));
const WastePrediction = lazy(() => import("@/pages/analytics/WastePrediction"));
const SmartRotation = lazy(() => import("@/pages/SmartRotation"));
const RecipeAIImport = lazy(() => import("@/pages/RecipeAIImport"));
const RecipeSuggestions = lazy(() => import("@/pages/RecipeSuggestions"));
const ServerStatus = lazy(() => import("@/pages/ServerStatus"));
const EmailSettings = lazy(() => import("@/pages/EmailSettings"));
const BackupRestore = lazy(() => import("@/pages/BackupRestore"));
const GDPRExport = lazy(() => import("@/pages/GDPRExport"));
const AgentTeam = lazy(() => import("@/pages/AgentTeam"));
const BulkTagEditor = lazy(() => import("@/pages/BulkTagEditor"));
const QuizFeedback = lazy(() => import("@/pages/QuizFeedback"));
const LearningDashboard = lazy(() => import("@/pages/analytics/LearningDashboard"));
const MenuQuiz = lazy(() => import("@/pages/MenuQuiz"));
const GuestMenu = lazy(() => import("@/pages/public/GuestMenu"));
const DigitalSignage = lazy(() => import("@/pages/public/DigitalSignage"));
const OrderList = lazy(() => import("@/pages/OrderList"));
const OrderBoard = lazy(() => import("@/pages/public/OrderBoard"));
const Documents = lazy(() => import("@/pages/Documents"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function AuthenticatedRoutes() {
  return (
    <Suspense fallback={<Layout><PageLoader /></Layout>}>
    <Switch>
      <Route path="/">
        <Redirect to="/today" />
      </Route>
      <Route path="/recipes/tags">
        <Layout><BulkTagEditor /></Layout>
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
        <Layout><GuestsHub /></Layout>
      </Route>
      <Route path="/schedule">
        <Layout><Schedule /></Layout>
      </Route>
      <Route path="/wochenplan">
        <Layout><MenuPlan /></Layout>
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
        <Redirect to="/guests?tab=profiles" />
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
      <Route path="/orders">
        <Layout><OrderList /></Layout>
      </Route>
      <Route path="/documents">
        <Layout><Documents /></Layout>
      </Route>
      <Route path="/catering">
        <Redirect to="/guests?tab=catering" />
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
    </Suspense>
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
    <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path="/speisekarte/:locationSlug/:date?">
        <GuestMenu />
      </Route>
      <Route path="/signage/:locationSlug">
        <DigitalSignage />
      </Route>
      <Route path="/bestellzettel">
        <OrderBoard />
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
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/">
            <Landing />
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </>
      )}
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="mise-theme">
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

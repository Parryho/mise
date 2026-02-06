import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/Layout";

import Recipes from "@/pages/Recipes";
import HACCP from "@/pages/HACCP";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Guests from "@/pages/Guests";
import Schedule from "@/pages/Schedule";
import MenuPlanPage from "@/pages/MenuPlan";
import Today from "@/pages/Today";

import Rotation from "@/pages/Rotation";
import RotationPrint from "@/pages/RotationPrint";
import ProductionList from "@/pages/ProductionList";
import ShoppingList from "@/pages/ShoppingList";
import Print from "@/pages/Print";
import Catering from "@/pages/Catering";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Redirect to="/today" />
      </Route>
      <Route path="/">
        <Redirect to="/today" />
      </Route>
      <Route path="/recipes">
        <Layout><Recipes /></Layout>
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
        <Layout><MenuPlanPage /></Layout>
      </Route>
      <Route path="/today">
        <Layout><Today /></Layout>
      </Route>
      <Route path="/reports">
        <Layout><Reports /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><Settings /></Layout>
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
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Router />
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

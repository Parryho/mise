import type { Express } from "express";
import type { Server } from "http";
import { setupMiddleware } from "./middleware";
import { metricsMiddleware } from "../metrics";
import { registerAuthRoutes } from "./auth";
import { registerRecipeRoutes } from "./recipes";
import { registerHaccpRoutes } from "./haccp";
import { registerMenuPlanRoutes } from "./menu-plans";
import { registerGuestRoutes } from "./guests";
import { registerCateringRoutes } from "./catering";
import { registerScheduleRoutes } from "./schedule";
import { registerRotationRoutes } from "./rotation";
import { registerTaskRoutes } from "./tasks";
import { registerAnalyticsRoutes } from "./analytics";
import { registerAdminRoutes } from "./admin";
import { registerPublicRoutes } from "./public";
import { registerSupplierRoutes } from "./suppliers";
import { registerAgentTeamRoutes } from "./agent-team";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup session, CSRF, default admin
  await setupMiddleware(app);

  // Register all route modules
  registerAuthRoutes(app);
  registerRecipeRoutes(app);
  registerHaccpRoutes(app);
  registerMenuPlanRoutes(app);
  registerGuestRoutes(app);
  registerCateringRoutes(app);
  registerScheduleRoutes(app);
  registerRotationRoutes(app);
  registerTaskRoutes(app);
  registerAnalyticsRoutes(app);
  registerAdminRoutes(app);
  registerPublicRoutes(app);
  registerSupplierRoutes(app);
  registerAgentTeamRoutes(app);

  return httpServer;
}

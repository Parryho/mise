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
import { registerOrderRoutes } from "./orders";
import { registerDocumentRoutes } from "./documents";

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
  registerOrderRoutes(app);
  registerDocumentRoutes(app);

  // M7: API route index
  app.get("/api", (_req, res) => {
    const modules = [
      { module: "auth", prefix: "/api/auth", endpoints: ["POST /register", "POST /login", "POST /logout", "GET /me"] },
      { module: "recipes", prefix: "/api/recipes", endpoints: ["GET /", "GET /:id", "POST /", "PUT /:id", "DELETE /:id", "POST /bulk-tags", "POST /auto-tag"] },
      { module: "haccp", prefix: "/api/haccp", endpoints: ["GET /logs", "POST /logs", "GET /fridges", "POST /fridges"] },
      { module: "menu-plans", prefix: "/api/menu-plans", endpoints: ["GET /week", "POST /", "PUT /:id", "DELETE /:id"] },
      { module: "guests", prefix: "/api/guests", endpoints: ["GET /counts", "POST /counts", "GET /export"] },
      { module: "catering", prefix: "/api/catering", endpoints: ["GET /events", "POST /events", "PUT /events/:id", "DELETE /events/:id"] },
      { module: "schedule", prefix: "/api/schedule", endpoints: ["GET /entries", "POST /entries", "GET /staff", "GET /shift-types"] },
      { module: "rotation", prefix: "/api/rotation", endpoints: ["GET /templates", "POST /templates", "GET /slots/:templateId", "POST /generate"] },
      { module: "tasks", prefix: "/api/tasks", endpoints: ["GET /", "POST /", "PATCH /:id/status", "DELETE /:id"] },
      { module: "analytics", prefix: "/api/analytics", endpoints: ["GET /food-cost", "GET /popular-dishes", "GET /pax-trends"] },
      { module: "admin", prefix: "/api/admin", endpoints: ["GET /users", "PUT /users/:id", "POST /users/create", "DELETE /users/:id"] },
      { module: "suppliers", prefix: "/api/suppliers", endpoints: ["GET /", "POST /", "PUT /:id", "DELETE /:id"] },
      { module: "orders", prefix: "/api/orders", endpoints: ["GET /active", "GET /", "POST /", "PUT /:id", "POST /:id/items", "PUT /items/:itemId", "DELETE /items/:itemId", "POST /:id/scan"] },
      { module: "documents", prefix: "/api/documents", endpoints: ["GET /", "GET /:id", "POST /upload", "PUT /:id", "DELETE /:id", "GET /:id/download"] },
    ];
    res.json({ version: "1.0", modules });
  });

  return httpServer;
}

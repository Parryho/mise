import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipe Categories - Single source of truth for client and server
export const RECIPE_CATEGORIES = [
  { id: "ClearSoups", label: "Klare Suppen", symbol: "🍜" },
  { id: "CreamSoups", label: "Cremesuppen", symbol: "🥣" },
  { id: "MainMeat", label: "Haupt-Fleisch", symbol: "🥩" },
  { id: "MainFish", label: "Haupt-Fisch", symbol: "🐟" },
  { id: "MainVegan", label: "Haupt-Vegan/Vegi", symbol: "🥦" },
  { id: "Sides", label: "Beilagen", symbol: "🥔" },
  { id: "ColdSauces", label: "Kalte Saucen", symbol: "🫙" },
  { id: "HotSauces", label: "Warme Saucen", symbol: "🍲" },
  { id: "Salads", label: "Salate", symbol: "🥬" },
  { id: "HotDesserts", label: "Warme Dessert", symbol: "🍮" },
  { id: "ColdDesserts", label: "Kalte Dessert", symbol: "🍨" },
] as const;

export type RecipeCategoryId = typeof RECIPE_CATEGORIES[number]["id"];

// Session table (managed by connect-pg-simple, defined here so Drizzle doesn't delete it)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// Roles: admin (Küchenchef), souschef, koch, fruehkoch, lehrling, abwasch, guest
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  position: text("position").notNull().default("Koch"),
  role: text("role").notNull().default("guest"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// App settings for visibility control
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// === NEW: Locations (City, SUED, AK) ===
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  defaultPax: integer("default_pax").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
});

// Recipes: MERGED from A dishes + B recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  portions: integer("portions").notNull().default(1),
  prepTime: integer("prep_time").notNull().default(0),
  image: text("image"),
  sourceUrl: text("source_url"),
  steps: text("steps").array().notNull().default([]),
  allergens: text("allergens").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // NEW from A: season and prep instructions
  season: text("season").notNull().default("all"),
  prepInstructions: text("prep_instructions"),
});

// Ingredients: Recipe ingredient items (per recipe)
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  amount: doublePrecision("amount").notNull(),
  unit: text("unit").notNull(),
  allergens: text("allergens").array().notNull().default([]),
});

// === NEW: Master ingredients (Zutatenstammdaten mit Preisen) ===
export const masterIngredients = pgTable("master_ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default("sonstiges"),
  unit: text("unit").notNull().default("g"),
  pricePerUnit: doublePrecision("price_per_unit").notNull().default(0),
  priceUnit: text("price_unit").notNull().default("kg"),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Fridges: Temperature-monitored storage units
export const fridges = pgTable("fridges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tempMin: doublePrecision("temp_min").notNull(),
  tempMax: doublePrecision("temp_max").notNull(),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
});

// HACCP Logs
export const haccpLogs = pgTable("haccp_logs", {
  id: serial("id").primaryKey(),
  fridgeId: integer("fridge_id").references(() => fridges.id, { onDelete: "cascade" }).notNull(),
  temperature: doublePrecision("temperature").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  user: text("user").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
});

// Guest counts per meal: MERGED A + B
export const guestCounts = pgTable("guest_counts", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  meal: text("meal").notNull(),
  adults: integer("adults").notNull().default(0),
  children: integer("children").notNull().default(0),
  notes: text("notes"),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
  source: text("source").notNull().default("manual"),
});

// === NEW: Rotation templates ===
export const rotationTemplates = pgTable("rotation_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  weekCount: integer("week_count").notNull().default(6),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// === NEW: Rotation slots (normalized) ===
export const rotationSlots = pgTable("rotation_slots", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => rotationTemplates.id, { onDelete: "cascade" }).notNull(),
  weekNr: integer("week_nr").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  meal: text("meal").notNull(),
  locationSlug: text("location_slug").notNull(),
  course: text("course").notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
});

// Catering events: MERGED A + B
export const cateringEvents = pgTable("catering_events", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  eventName: text("event_name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  personCount: integer("person_count").notNull(),
  dishes: text("dishes").array().notNull().default([]),
  notes: text("notes"),
  eventType: text("event_type").notNull().default("sonstiges"),
  timeStart: text("time_start"),
  timeEnd: text("time_end"),
  contactPerson: text("contact_person"),
  room: text("room"),
  status: text("status").notNull().default("geplant"),
  airtableId: text("airtable_id"),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
});

// === NEW: Catering menu items ===
export const cateringMenuItems = pgTable("catering_menu_items", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => cateringEvents.id, { onDelete: "cascade" }).notNull(),
  category: text("category").notNull().default("hauptgang"),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  customName: text("custom_name"),
  customAllergens: text("custom_allergens").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
});

// Staff members
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  email: text("email"),
  phone: text("phone"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
});

// Shift types
export const shiftTypes = pgTable("shift_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  color: text("color").notNull().default("#F37021"),
});

// Schedule entries
export const scheduleEntries = pgTable("schedule_entries", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  shiftTypeId: integer("shift_type_id").references(() => shiftTypes.id, { onDelete: "set null" }),
  shift: text("shift"),
  notes: text("notes"),
});

// Menu plans: MERGED A + B
export const menuPlans = pgTable("menu_plans", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  meal: text("meal").notNull(),
  course: text("course").notNull().default("main"),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  portions: integer("portions").notNull().default(1),
  notes: text("notes"),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
  rotationWeekNr: integer("rotation_week_nr"),
});

// === NEW: Menu plan temperatures (HACCP per menu-plan slot) ===
export const menuPlanTemperatures = pgTable("menu_plan_temperatures", {
  id: serial("id").primaryKey(),
  menuPlanId: integer("menu_plan_id").references(() => menuPlans.id, { onDelete: "cascade" }).notNull(),
  dishSlot: text("dish_slot").notNull(),
  tempCore: doublePrecision("temp_core"),
  tempServing: doublePrecision("temp_serving"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  recordedBy: text("recorded_by"),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  note: text("note"),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("open"),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Task Templates
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  items: text("items").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ========================
// Zod Schemas
// ========================

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const registerUserSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  position: z.string().min(1, "Bitte Küchenposition wählen"),
});
export const loginUserSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});
export const insertAppSettingSchema = createInsertSchema(appSettings).omit({ id: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export const insertMasterIngredientSchema = createInsertSchema(masterIngredients).omit({ id: true, createdAt: true });
export const insertFridgeSchema = createInsertSchema(fridges).omit({ id: true });
export const insertHaccpLogSchema = createInsertSchema(haccpLogs).omit({ id: true }).extend({
  timestamp: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export const insertGuestCountSchema = createInsertSchema(guestCounts).omit({ id: true });
export const insertRotationTemplateSchema = createInsertSchema(rotationTemplates).omit({ id: true, createdAt: true });
export const insertRotationSlotSchema = createInsertSchema(rotationSlots).omit({ id: true });
export const insertCateringEventSchema = createInsertSchema(cateringEvents).omit({ id: true });
export const insertCateringMenuItemSchema = createInsertSchema(cateringMenuItems).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertShiftTypeSchema = createInsertSchema(shiftTypes).omit({ id: true });
export const insertScheduleEntrySchema = createInsertSchema(scheduleEntries).omit({ id: true });
export const insertMenuPlanSchema = createInsertSchema(menuPlans).omit({ id: true });
export const insertMenuPlanTemperatureSchema = createInsertSchema(menuPlanTemperatures).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const updateTaskStatusSchema = z.object({ status: z.enum(["open", "done"]) });
export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({ id: true, createdAt: true });

// ========================
// Types
// ========================

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type MasterIngredient = typeof masterIngredients.$inferSelect;
export type InsertMasterIngredient = z.infer<typeof insertMasterIngredientSchema>;
export type Fridge = typeof fridges.$inferSelect;
export type InsertFridge = z.infer<typeof insertFridgeSchema>;
export type HaccpLog = typeof haccpLogs.$inferSelect;
export type InsertHaccpLog = z.infer<typeof insertHaccpLogSchema>;
export type GuestCount = typeof guestCounts.$inferSelect;
export type InsertGuestCount = z.infer<typeof insertGuestCountSchema>;
export type RotationTemplate = typeof rotationTemplates.$inferSelect;
export type InsertRotationTemplate = z.infer<typeof insertRotationTemplateSchema>;
export type RotationSlot = typeof rotationSlots.$inferSelect;
export type InsertRotationSlot = z.infer<typeof insertRotationSlotSchema>;
export type CateringEvent = typeof cateringEvents.$inferSelect;
export type InsertCateringEvent = z.infer<typeof insertCateringEventSchema>;
export type CateringMenuItem = typeof cateringMenuItems.$inferSelect;
export type InsertCateringMenuItem = z.infer<typeof insertCateringMenuItemSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type ShiftType = typeof shiftTypes.$inferSelect;
export type InsertShiftType = z.infer<typeof insertShiftTypeSchema>;
export type ScheduleEntry = typeof scheduleEntries.$inferSelect;
export type InsertScheduleEntry = z.infer<typeof insertScheduleEntrySchema>;
export type MenuPlan = typeof menuPlans.$inferSelect;
export type InsertMenuPlan = z.infer<typeof insertMenuPlanSchema>;
export type MenuPlanTemperature = typeof menuPlanTemperatures.$inferSelect;
export type InsertMenuPlanTemperature = z.infer<typeof insertMenuPlanTemperatureSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

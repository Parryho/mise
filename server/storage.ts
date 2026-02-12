import {
  type User, type InsertUser,
  type Recipe, type InsertRecipe,
  type Ingredient, type InsertIngredient,
  type MasterIngredient, type InsertMasterIngredient,
  type Fridge, type InsertFridge,
  type HaccpLog, type InsertHaccpLog,
  type GuestCount, type InsertGuestCount,
  type CateringEvent, type InsertCateringEvent,
  type CateringMenuItem, type InsertCateringMenuItem,
  type Staff, type InsertStaff,
  type ShiftType, type InsertShiftType,
  type ScheduleEntry, type InsertScheduleEntry,
  type MenuPlan, type InsertMenuPlan,
  type MenuPlanTemperature, type InsertMenuPlanTemperature,
  type AppSetting,
  type Task, type InsertTask,
  type TaskTemplate, type InsertTaskTemplate,
  type Location, type InsertLocation,
  type RotationTemplate, type InsertRotationTemplate,
  type RotationSlot, type InsertRotationSlot,
  type AuditLog,
  type Supplier, type InsertSupplier,
  type SubRecipeLink, type InsertSubRecipeLink,
  type GuestAllergenProfile, type InsertGuestAllergenProfile,
  type AgentTeamRun, type InsertAgentTeamRun,
  type AgentTeamAction, type InsertAgentTeamAction,
  users, recipes, ingredients, masterIngredients, fridges, haccpLogs,
  guestCounts, cateringEvents, cateringMenuItems, staff, shiftTypes,
  scheduleEntries, menuPlans, menuPlanTemperatures, appSettings, tasks,
  taskTemplates, locations, rotationTemplates, rotationSlots, auditLogs,
  suppliers, subRecipeLinks, guestAllergenProfiles,
  agentTeamRuns, agentTeamActions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export class DatabaseStorage {
  // === Users ===
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // === App settings ===
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting;
  }
  async getAllSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings);
  }
  async setSetting(key: string, value: string): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(appSettings).set({ value }).where(eq(appSettings.key, key)).returning();
      return updated;
    }
    const [created] = await db.insert(appSettings).values({ key, value }).returning();
    return created;
  }

  // === Locations ===
  async getLocations(): Promise<Location[]> {
    return db.select().from(locations);
  }
  async getLocation(id: number): Promise<Location | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.id, id));
    return loc;
  }
  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.slug, slug));
    return loc;
  }
  async createLocation(location: InsertLocation): Promise<Location> {
    const [created] = await db.insert(locations).values(location).returning();
    return created;
  }
  async updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined> {
    const [updated] = await db.update(locations).set(location).where(eq(locations.id, id)).returning();
    return updated;
  }

  // === Recipes ===
  async getRecipes(filters?: { q?: string; category?: string; searchIngredients?: boolean; noIngredients?: boolean }): Promise<Recipe[]> {
    if (filters?.searchIngredients && filters?.q && filters.q.length >= 2) {
      // Server-side ingredient search using EXISTS subquery
      const term = `%${filters.q.toLowerCase()}%`;
      return db.select().from(recipes).where(
        sql`EXISTS (
          SELECT 1 FROM ingredients i
          WHERE i.recipe_id = ${recipes.id} AND LOWER(i.name) LIKE ${term}
        )`
      ).orderBy(recipes.name);
    }
    if (filters?.noIngredients) {
      return db.select().from(recipes).where(
        sql`NOT EXISTS (
          SELECT 1 FROM ingredients i
          WHERE i.recipe_id = ${recipes.id}
        )`
      ).orderBy(recipes.name);
    }
    let query = db.select().from(recipes);
    if (filters?.category) {
      query = query.where(eq(recipes.category, filters.category)) as typeof query;
    }
    const results = await query;
    if (filters?.q && filters.q.length >= 2) {
      const searchTerm = filters.q.toLowerCase();
      return results.filter(r => r.name.toLowerCase().includes(searchTerm));
    }
    return results;
  }
  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }
  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }
  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db.update(recipes).set({ ...recipe, updatedAt: new Date() }).where(eq(recipes.id, id)).returning();
    return updated;
  }
  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // === Ingredients (per recipe) ===
  async getIngredients(recipeId: number): Promise<Ingredient[]> {
    return db.select().from(ingredients).where(eq(ingredients.recipeId, recipeId));
  }
  async getIngredientsByRecipeIds(recipeIds: number[]): Promise<Ingredient[]> {
    if (recipeIds.length === 0) return [];
    return db.select().from(ingredients).where(sql`${ingredients.recipeId} = ANY(${recipeIds})`);
  }
  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [created] = await db.insert(ingredients).values(ingredient).returning();
    return created;
  }
  async deleteIngredientsByRecipe(recipeId: number): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
  }

  // === Master Ingredients ===
  async getMasterIngredients(): Promise<MasterIngredient[]> {
    return db.select().from(masterIngredients).orderBy(masterIngredients.name);
  }
  async getMasterIngredient(id: number): Promise<MasterIngredient | undefined> {
    const [mi] = await db.select().from(masterIngredients).where(eq(masterIngredients.id, id));
    return mi;
  }
  async createMasterIngredient(mi: InsertMasterIngredient): Promise<MasterIngredient> {
    const [created] = await db.insert(masterIngredients).values(mi).returning();
    return created;
  }
  async updateMasterIngredient(id: number, mi: Partial<InsertMasterIngredient>): Promise<MasterIngredient | undefined> {
    const [updated] = await db.update(masterIngredients).set(mi).where(eq(masterIngredients.id, id)).returning();
    return updated;
  }
  async deleteMasterIngredient(id: number): Promise<void> {
    await db.delete(masterIngredients).where(eq(masterIngredients.id, id));
  }

  // === Fridges ===
  async getFridges(): Promise<Fridge[]> {
    return db.select().from(fridges);
  }
  async getFridge(id: number): Promise<Fridge | undefined> {
    const [fridge] = await db.select().from(fridges).where(eq(fridges.id, id));
    return fridge;
  }
  async createFridge(fridge: InsertFridge): Promise<Fridge> {
    const [created] = await db.insert(fridges).values(fridge).returning();
    return created;
  }
  async updateFridge(id: number, fridge: Partial<InsertFridge>): Promise<Fridge | undefined> {
    const [updated] = await db.update(fridges).set(fridge).where(eq(fridges.id, id)).returning();
    return updated;
  }
  async deleteFridge(id: number): Promise<void> {
    await db.delete(fridges).where(eq(fridges.id, id));
  }

  // === HACCP Logs ===
  async getHaccpLogs(options?: { limit?: number; offset?: number }): Promise<HaccpLog[]> {
    let query = db.select().from(haccpLogs).orderBy(desc(haccpLogs.timestamp));
    if (options?.limit) query = query.limit(options.limit) as typeof query;
    if (options?.offset) query = query.offset(options.offset) as typeof query;
    return query;
  }
  async getHaccpLogCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(haccpLogs);
    return result[0]?.count ?? 0;
  }
  async getHaccpLogsByFridge(fridgeId: number, options?: { limit?: number; offset?: number }): Promise<HaccpLog[]> {
    let query = db.select().from(haccpLogs).where(eq(haccpLogs.fridgeId, fridgeId)).orderBy(desc(haccpLogs.timestamp));
    if (options?.limit) query = query.limit(options.limit) as typeof query;
    if (options?.offset) query = query.offset(options.offset) as typeof query;
    return query;
  }
  async createHaccpLog(log: InsertHaccpLog): Promise<HaccpLog> {
    const [created] = await db.insert(haccpLogs).values(log).returning();
    return created;
  }

  // === Guest counts ===
  async getGuestCounts(startDate: string, endDate: string, locationId?: number): Promise<GuestCount[]> {
    const conditions = [gte(guestCounts.date, startDate), lte(guestCounts.date, endDate)];
    if (locationId) conditions.push(eq(guestCounts.locationId, locationId));
    return db.select().from(guestCounts).where(and(...conditions));
  }
  async getGuestCountByDateMeal(date: string, meal: string): Promise<GuestCount | undefined> {
    const [count] = await db.select().from(guestCounts).where(and(eq(guestCounts.date, date), eq(guestCounts.meal, meal)));
    return count;
  }
  async createGuestCount(count: InsertGuestCount): Promise<GuestCount> {
    const [created] = await db.insert(guestCounts).values(count).returning();
    return created;
  }
  async updateGuestCount(id: number, count: Partial<InsertGuestCount>): Promise<GuestCount | undefined> {
    const [updated] = await db.update(guestCounts).set(count).where(eq(guestCounts.id, id)).returning();
    return updated;
  }
  async deleteGuestCount(id: number): Promise<void> {
    await db.delete(guestCounts).where(eq(guestCounts.id, id));
  }

  // === Rotation Templates ===
  async getRotationTemplates(): Promise<RotationTemplate[]> {
    return db.select().from(rotationTemplates).orderBy(rotationTemplates.name);
  }
  async getRotationTemplate(id: number): Promise<RotationTemplate | undefined> {
    const [t] = await db.select().from(rotationTemplates).where(eq(rotationTemplates.id, id));
    return t;
  }
  async createRotationTemplate(t: InsertRotationTemplate): Promise<RotationTemplate> {
    const [created] = await db.insert(rotationTemplates).values(t).returning();
    return created;
  }
  async updateRotationTemplate(id: number, t: Partial<InsertRotationTemplate>): Promise<RotationTemplate | undefined> {
    const [updated] = await db.update(rotationTemplates).set(t).where(eq(rotationTemplates.id, id)).returning();
    return updated;
  }
  async deleteRotationTemplate(id: number): Promise<void> {
    await db.delete(rotationTemplates).where(eq(rotationTemplates.id, id));
  }

  // === Rotation Slots ===
  async getRotationSlots(templateId: number): Promise<RotationSlot[]> {
    return db.select().from(rotationSlots).where(eq(rotationSlots.templateId, templateId));
  }
  async getRotationSlotsByWeek(templateId: number, weekNr: number): Promise<RotationSlot[]> {
    return db.select().from(rotationSlots).where(and(eq(rotationSlots.templateId, templateId), eq(rotationSlots.weekNr, weekNr)));
  }
  async createRotationSlot(slot: InsertRotationSlot): Promise<RotationSlot> {
    const [created] = await db.insert(rotationSlots).values(slot).returning();
    return created;
  }
  async createRotationSlots(slots: InsertRotationSlot[]): Promise<RotationSlot[]> {
    if (slots.length === 0) return [];
    return db.insert(rotationSlots).values(slots).returning();
  }
  async updateRotationSlot(id: number, slot: Partial<InsertRotationSlot>): Promise<RotationSlot | undefined> {
    const [updated] = await db.update(rotationSlots).set(slot).where(eq(rotationSlots.id, id)).returning();
    return updated;
  }
  async deleteRotationSlotsByTemplate(templateId: number): Promise<void> {
    await db.delete(rotationSlots).where(eq(rotationSlots.templateId, templateId));
  }
  async clearRotationSlotsByTemplate(templateId: number): Promise<number> {
    const result = await db.update(rotationSlots).set({ recipeId: null }).where(eq(rotationSlots.templateId, templateId)).returning();
    return result.length;
  }
  async clearRotationSlotsByWeek(templateId: number, weekNr: number): Promise<number> {
    const result = await db.update(rotationSlots).set({ recipeId: null }).where(and(eq(rotationSlots.templateId, templateId), eq(rotationSlots.weekNr, weekNr))).returning();
    return result.length;
  }
  async clearRotationSlotsByDay(templateId: number, weekNr: number, dayOfWeek: number): Promise<number> {
    const result = await db.update(rotationSlots).set({ recipeId: null }).where(and(eq(rotationSlots.templateId, templateId), eq(rotationSlots.weekNr, weekNr), eq(rotationSlots.dayOfWeek, dayOfWeek))).returning();
    return result.length;
  }

  // === Catering events ===
  async getCateringEvents(): Promise<CateringEvent[]> {
    return db.select().from(cateringEvents).orderBy(desc(cateringEvents.date));
  }
  async getCateringEvent(id: number): Promise<CateringEvent | undefined> {
    const [event] = await db.select().from(cateringEvents).where(eq(cateringEvents.id, id));
    return event;
  }
  async getCateringEventByAirtableId(airtableId: string): Promise<CateringEvent | undefined> {
    const [event] = await db.select().from(cateringEvents).where(eq(cateringEvents.airtableId, airtableId));
    return event;
  }
  async createCateringEvent(event: InsertCateringEvent): Promise<CateringEvent> {
    const [created] = await db.insert(cateringEvents).values(event).returning();
    return created;
  }
  async updateCateringEvent(id: number, event: Partial<InsertCateringEvent>): Promise<CateringEvent | undefined> {
    const [updated] = await db.update(cateringEvents).set(event).where(eq(cateringEvents.id, id)).returning();
    return updated;
  }
  async deleteCateringEvent(id: number): Promise<void> {
    await db.delete(cateringEvents).where(eq(cateringEvents.id, id));
  }

  // === Catering Menu Items ===
  async getCateringMenuItems(eventId: number): Promise<CateringMenuItem[]> {
    return db.select().from(cateringMenuItems).where(eq(cateringMenuItems.eventId, eventId)).orderBy(cateringMenuItems.sortOrder);
  }
  async createCateringMenuItem(item: InsertCateringMenuItem): Promise<CateringMenuItem> {
    const [created] = await db.insert(cateringMenuItems).values(item).returning();
    return created;
  }
  async updateCateringMenuItem(id: number, item: Partial<InsertCateringMenuItem>): Promise<CateringMenuItem | undefined> {
    const [updated] = await db.update(cateringMenuItems).set(item).where(eq(cateringMenuItems.id, id)).returning();
    return updated;
  }
  async deleteCateringMenuItem(id: number): Promise<void> {
    await db.delete(cateringMenuItems).where(eq(cateringMenuItems.id, id));
  }
  async deleteCateringMenuItemsByEvent(eventId: number): Promise<void> {
    await db.delete(cateringMenuItems).where(eq(cateringMenuItems.eventId, eventId));
  }

  // === Staff ===
  async getStaff(): Promise<Staff[]> {
    return db.select().from(staff);
  }
  async getStaffMember(id: number): Promise<Staff | undefined> {
    const [member] = await db.select().from(staff).where(eq(staff.id, id));
    return member;
  }
  async createStaff(member: InsertStaff): Promise<Staff> {
    const [created] = await db.insert(staff).values(member).returning();
    return created;
  }
  async updateStaff(id: number, member: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updated] = await db.update(staff).set(member).where(eq(staff.id, id)).returning();
    return updated;
  }
  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // === Shift types ===
  async getShiftTypes(): Promise<ShiftType[]> {
    return db.select().from(shiftTypes);
  }
  async getShiftType(id: number): Promise<ShiftType | undefined> {
    const [st] = await db.select().from(shiftTypes).where(eq(shiftTypes.id, id));
    return st;
  }
  async createShiftType(st: InsertShiftType): Promise<ShiftType> {
    const [created] = await db.insert(shiftTypes).values(st).returning();
    return created;
  }
  async updateShiftType(id: number, st: Partial<InsertShiftType>): Promise<ShiftType | undefined> {
    const [updated] = await db.update(shiftTypes).set(st).where(eq(shiftTypes.id, id)).returning();
    return updated;
  }
  async deleteShiftType(id: number): Promise<void> {
    await db.delete(shiftTypes).where(eq(shiftTypes.id, id));
  }

  // === Schedule ===
  async getScheduleEntries(startDate: string, endDate: string): Promise<ScheduleEntry[]> {
    return db.select().from(scheduleEntries).where(and(gte(scheduleEntries.date, startDate), lte(scheduleEntries.date, endDate)));
  }
  async getScheduleEntry(id: number): Promise<ScheduleEntry | undefined> {
    const [entry] = await db.select().from(scheduleEntries).where(eq(scheduleEntries.id, id));
    return entry;
  }
  async createScheduleEntry(entry: InsertScheduleEntry): Promise<ScheduleEntry> {
    const [created] = await db.insert(scheduleEntries).values(entry).returning();
    return created;
  }
  async updateScheduleEntry(id: number, entry: Partial<InsertScheduleEntry>): Promise<ScheduleEntry | undefined> {
    const [updated] = await db.update(scheduleEntries).set(entry).where(eq(scheduleEntries.id, id)).returning();
    return updated;
  }
  async deleteScheduleEntry(id: number): Promise<void> {
    await db.delete(scheduleEntries).where(eq(scheduleEntries.id, id));
  }

  // === Menu plans ===
  async getMenuPlans(startDate: string, endDate: string): Promise<MenuPlan[]> {
    return db.select().from(menuPlans).where(and(gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)));
  }
  async getMenuPlansByDateRange(startDate: string, endDate: string, locationId?: number): Promise<MenuPlan[]> {
    const conditions = [gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)];
    if (locationId) conditions.push(eq(menuPlans.locationId, locationId));
    return db.select().from(menuPlans).where(and(...conditions));
  }
  async getMenuPlan(id: number): Promise<MenuPlan | undefined> {
    const [plan] = await db.select().from(menuPlans).where(eq(menuPlans.id, id));
    return plan;
  }
  async createMenuPlan(plan: InsertMenuPlan): Promise<MenuPlan> {
    const [created] = await db.insert(menuPlans).values(plan).returning();
    return created;
  }
  async createMenuPlans(plans: InsertMenuPlan[]): Promise<MenuPlan[]> {
    if (plans.length === 0) return [];
    return db.insert(menuPlans).values(plans).returning();
  }
  async updateMenuPlan(id: number, plan: Partial<InsertMenuPlan>): Promise<MenuPlan | undefined> {
    const [updated] = await db.update(menuPlans).set(plan).where(eq(menuPlans.id, id)).returning();
    return updated;
  }
  async deleteMenuPlan(id: number): Promise<void> {
    await db.delete(menuPlans).where(eq(menuPlans.id, id));
  }
  async deleteMenuPlansByDateRange(startDate: string, endDate: string): Promise<void> {
    await db.delete(menuPlans).where(and(gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)));
  }

  // === Menu Plan Temperatures ===
  async getMenuPlanTemperatures(menuPlanId: number): Promise<MenuPlanTemperature[]> {
    return db.select().from(menuPlanTemperatures).where(eq(menuPlanTemperatures.menuPlanId, menuPlanId));
  }
  async createMenuPlanTemperature(temp: InsertMenuPlanTemperature): Promise<MenuPlanTemperature> {
    const [created] = await db.insert(menuPlanTemperatures).values(temp).returning();
    return created;
  }
  async updateMenuPlanTemperature(id: number, temp: Partial<InsertMenuPlanTemperature>): Promise<MenuPlanTemperature | undefined> {
    const [updated] = await db.update(menuPlanTemperatures).set(temp).where(eq(menuPlanTemperatures.id, id)).returning();
    return updated;
  }

  // === Tasks ===
  async getTasksByDate(date: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.date, date)).orderBy(desc(tasks.priority));
  }
  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }
  async updateTask(id: number, patch: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning();
    return updated;
  }
  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // === Task Templates ===
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return db.select().from(taskTemplates).orderBy(taskTemplates.name);
  }
  async getTaskTemplate(id: number): Promise<TaskTemplate | undefined> {
    const [t] = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id));
    return t;
  }
  async createTaskTemplate(t: InsertTaskTemplate): Promise<TaskTemplate> {
    const [created] = await db.insert(taskTemplates).values(t).returning();
    return created;
  }
  async updateTaskTemplate(id: number, t: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    const [updated] = await db.update(taskTemplates).set(t).where(eq(taskTemplates.id, id)).returning();
    return updated;
  }
  async deleteTaskTemplate(id: number): Promise<void> {
    await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
  }

  // === Audit Logs ===
  async createAuditLog(log: {
    userId?: string | null;
    userName?: string | null;
    action: string;
    tableName: string;
    recordId?: string | null;
    before?: unknown;
    after?: unknown;
  }): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values({
      userId: log.userId ?? null,
      userName: log.userName ?? null,
      action: log.action,
      tableName: log.tableName,
      recordId: log.recordId ?? null,
      before: log.before ? JSON.stringify(log.before) : null,
      after: log.after ? JSON.stringify(log.after) : null,
    }).returning();
    return created;
  }
  async getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit).offset(offset);
  }

  // === Suppliers ===
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(suppliers.name);
  }
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [s] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return s;
  }
  async createSupplier(s: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(s).returning();
    return created;
  }
  async updateSupplier(id: number, s: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(s).where(eq(suppliers.id, id)).returning();
    return updated;
  }
  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // === Sub-Recipe Links ===
  async getSubRecipeLinks(parentRecipeId: number): Promise<SubRecipeLink[]> {
    return db.select().from(subRecipeLinks).where(eq(subRecipeLinks.parentRecipeId, parentRecipeId));
  }
  async createSubRecipeLink(link: InsertSubRecipeLink): Promise<SubRecipeLink> {
    const [created] = await db.insert(subRecipeLinks).values(link).returning();
    return created;
  }
  async deleteSubRecipeLink(id: number): Promise<void> {
    await db.delete(subRecipeLinks).where(eq(subRecipeLinks.id, id));
  }

  // === Guest Allergen Profiles ===
  async getGuestAllergenProfiles(locationId?: number): Promise<GuestAllergenProfile[]> {
    if (locationId) {
      return db.select().from(guestAllergenProfiles).where(eq(guestAllergenProfiles.locationId, locationId)).orderBy(desc(guestAllergenProfiles.date));
    }
    return db.select().from(guestAllergenProfiles).orderBy(desc(guestAllergenProfiles.date));
  }
  async getGuestAllergenProfile(id: number): Promise<GuestAllergenProfile | undefined> {
    const [p] = await db.select().from(guestAllergenProfiles).where(eq(guestAllergenProfiles.id, id));
    return p;
  }
  async getGuestAllergenProfilesByDateRange(startDate: string, endDate: string, locationId?: number): Promise<GuestAllergenProfile[]> {
    const conditions = [lte(guestAllergenProfiles.date, endDate), gte(sql`COALESCE(${guestAllergenProfiles.dateEnd}, ${guestAllergenProfiles.date})`, startDate)];
    if (locationId) conditions.push(eq(guestAllergenProfiles.locationId, locationId));
    return db.select().from(guestAllergenProfiles).where(and(...conditions));
  }
  async createGuestAllergenProfile(p: InsertGuestAllergenProfile): Promise<GuestAllergenProfile> {
    const [created] = await db.insert(guestAllergenProfiles).values(p).returning();
    return created;
  }
  async updateGuestAllergenProfile(id: number, p: Partial<InsertGuestAllergenProfile>): Promise<GuestAllergenProfile | undefined> {
    const [updated] = await db.update(guestAllergenProfiles).set(p).where(eq(guestAllergenProfiles.id, id)).returning();
    return updated;
  }
  async deleteGuestAllergenProfile(id: number): Promise<void> {
    await db.delete(guestAllergenProfiles).where(eq(guestAllergenProfiles.id, id));
  }

  // === Agent Team Runs ===
  async createTeamRun(run: InsertAgentTeamRun): Promise<AgentTeamRun> {
    const [created] = await db.insert(agentTeamRuns).values(run).returning();
    return created;
  }
  async updateTeamRun(id: number, data: Partial<InsertAgentTeamRun>): Promise<AgentTeamRun | undefined> {
    const [updated] = await db.update(agentTeamRuns).set(data).where(eq(agentTeamRuns.id, id)).returning();
    return updated;
  }
  async getTeamRun(id: number): Promise<AgentTeamRun | undefined> {
    const [run] = await db.select().from(agentTeamRuns).where(eq(agentTeamRuns.id, id));
    return run;
  }
  async getTeamRuns(limit = 20): Promise<AgentTeamRun[]> {
    return db.select().from(agentTeamRuns).orderBy(desc(agentTeamRuns.createdAt)).limit(limit);
  }

  // === Agent Team Actions ===
  async createTeamAction(action: InsertAgentTeamAction): Promise<AgentTeamAction> {
    const [created] = await db.insert(agentTeamActions).values(action).returning();
    return created;
  }
  async updateTeamAction(id: number, data: Partial<InsertAgentTeamAction>): Promise<AgentTeamAction | undefined> {
    const [updated] = await db.update(agentTeamActions).set(data).where(eq(agentTeamActions.id, id)).returning();
    return updated;
  }
  async getTeamActions(runId: number): Promise<AgentTeamAction[]> {
    return db.select().from(agentTeamActions).where(eq(agentTeamActions.runId, runId));
  }
}

export const storage = new DatabaseStorage();

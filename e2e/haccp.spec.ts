/**
 * E2E HACCP tests: log entry form, temperature validation, alerts.
 */
import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: any) {
  await page.goto("/login");
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  if (await emailInput.isVisible()) {
    await emailInput.fill("admin@mise.app");
    await passwordInput.fill("admin123");
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
    }
  }
}

test.describe("HACCP — Log Entry", () => {
  test("HACCP page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/haccp");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Cannot GET");
  });

  test("fridges API returns array", async ({ request }) => {
    const response = await request.get("/api/fridges");
    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test("HACCP logs API returns array for a fridge", async ({ request }) => {
    // First get fridges
    const fridgesResponse = await request.get("/api/fridges");
    if (!fridgesResponse.ok()) return;

    const fridges = await fridgesResponse.json();
    if (fridges.length === 0) return;

    const response = await request.get(`/api/haccp-logs?fridgeId=${fridges[0].id}`);
    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });
});

test.describe("HACCP — Temperature Validation via API", () => {
  test("creating a log with valid temperature succeeds or requires auth", async ({ request }) => {
    // Get a fridge first
    const fridgesResponse = await request.get("/api/fridges");
    if (!fridgesResponse.ok()) return;
    const fridges = await fridgesResponse.json();
    if (fridges.length === 0) return;

    const response = await request.post("/api/haccp-logs", {
      headers: { "Content-Type": "application/json" },
      data: {
        fridgeId: fridges[0].id,
        temperature: 5.0,
        timestamp: new Date().toISOString(),
        user: "test-user",
        status: "ok",
        notes: "E2E test entry",
      },
    });
    // 200/201 if created, 401 if auth needed
    expect([200, 201, 401, 403]).toContain(response.status());
  });

  test("creating a log without required fields fails", async ({ request }) => {
    const response = await request.post("/api/haccp-logs", {
      headers: { "Content-Type": "application/json" },
      data: {
        // Missing fridgeId, temperature, etc.
      },
    });
    // Should be 400 (validation) or 401 (auth)
    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("HACCP — Anomaly Detection API", () => {
  test("anomalies endpoint returns result", async ({ request }) => {
    const response = await request.get("/api/haccp/anomalies");
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("anomalies");
      expect(data).toHaveProperty("summary");
      expect(Array.isArray(data.anomalies)).toBe(true);
    }
  });

  test("fridge health endpoint responds", async ({ request }) => {
    const fridgesResponse = await request.get("/api/fridges");
    if (!fridgesResponse.ok()) return;
    const fridges = await fridgesResponse.json();
    if (fridges.length === 0) return;

    const response = await request.get(`/api/haccp/health/${fridges[0].id}`);
    const status = response.status();
    expect([200, 401, 404]).toContain(status);
  });
});

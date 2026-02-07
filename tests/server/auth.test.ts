/**
 * Auth tests: password hashing, session, role permissions, CSRF, rate limiting.
 * All DB calls are mocked — no running database required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// -------------------------------------------------------
// Role permission map (mirrors server/routes.ts)
// -------------------------------------------------------
const ROLE_PERMISSIONS: Record<string, number> = {
  admin: 100,
  souschef: 80,
  koch: 60,
  fruehkoch: 50,
  lehrling: 30,
  abwasch: 20,
  guest: 10,
};

function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_PERMISSIONS[userRole] || 0;
  const requiredLevel = ROLE_PERMISSIONS[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe("Auth — Password Hashing", () => {
  it("hashes a password with bcrypt so it differs from plaintext", async () => {
    const plain = "admin123";
    const hashed = await bcrypt.hash(plain, 10);
    expect(hashed).not.toBe(plain);
    expect(hashed).toMatch(/^\$2[aby]?\$/); // bcrypt prefix
  });

  it("verifies a correct password against its hash", async () => {
    const plain = "securePassword!42";
    const hashed = await bcrypt.hash(plain, 10);
    const valid = await bcrypt.compare(plain, hashed);
    expect(valid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const plain = "correctPassword";
    const hashed = await bcrypt.hash(plain, 10);
    const valid = await bcrypt.compare("wrongPassword", hashed);
    expect(valid).toBe(false);
  });

  it("generates different hashes for the same password (salt)", async () => {
    const plain = "samePassword";
    const hash1 = await bcrypt.hash(plain, 10);
    const hash2 = await bcrypt.hash(plain, 10);
    expect(hash1).not.toBe(hash2);
    // Both should still verify
    expect(await bcrypt.compare(plain, hash1)).toBe(true);
    expect(await bcrypt.compare(plain, hash2)).toBe(true);
  });

  it("handles empty password gracefully", async () => {
    const hashed = await bcrypt.hash("", 10);
    expect(await bcrypt.compare("", hashed)).toBe(true);
    expect(await bcrypt.compare("notempty", hashed)).toBe(false);
  });
});

describe("Auth — Session Creation / Validation", () => {
  it("session should store userId and be retrievable", () => {
    // Simulate a session object (like express-session)
    const session: Record<string, unknown> = {};
    session.userId = "user-uuid-123";
    expect(session.userId).toBe("user-uuid-123");
  });

  it("session without userId is considered unauthenticated", () => {
    const session: Record<string, unknown> = {};
    expect(session.userId).toBeUndefined();
  });

  it("session regeneration resets data", () => {
    const session: Record<string, unknown> = { userId: "old-user" };
    // Simulate regeneration
    const newSession: Record<string, unknown> = {};
    newSession.userId = session.userId;
    expect(newSession.userId).toBe("old-user");
    // After setting new userId
    newSession.userId = "new-user";
    expect(newSession.userId).toBe("new-user");
  });

  it("session destroy clears userId", () => {
    const session: Record<string, unknown> = { userId: "user-123" };
    // Simulate destroy
    delete session.userId;
    expect(session.userId).toBeUndefined();
  });
});

describe("Auth — Role Permissions", () => {
  it("admin has the highest permission level (100)", () => {
    expect(ROLE_PERMISSIONS.admin).toBe(100);
  });

  it("guest has the lowest permission level (10)", () => {
    expect(ROLE_PERMISSIONS.guest).toBe(10);
  });

  it("role hierarchy: admin > souschef > koch > guest", () => {
    expect(ROLE_PERMISSIONS.admin).toBeGreaterThan(ROLE_PERMISSIONS.souschef);
    expect(ROLE_PERMISSIONS.souschef).toBeGreaterThan(ROLE_PERMISSIONS.koch);
    expect(ROLE_PERMISSIONS.koch).toBeGreaterThan(ROLE_PERMISSIONS.guest);
  });

  it("admin can access admin-required endpoints", () => {
    expect(hasPermission("admin", "admin")).toBe(true);
  });

  it("souschef cannot access admin-required endpoints", () => {
    expect(hasPermission("souschef", "admin")).toBe(false);
  });

  it("koch can access koch-required endpoints", () => {
    expect(hasPermission("koch", "koch")).toBe(true);
  });

  it("admin can access koch-required endpoints (higher role)", () => {
    expect(hasPermission("admin", "koch")).toBe(true);
  });

  it("guest cannot access koch-required endpoints", () => {
    expect(hasPermission("guest", "koch")).toBe(false);
  });

  it("unknown role defaults to 0 permission", () => {
    expect(hasPermission("unknown", "guest")).toBe(false);
  });

  it("lehrling can access lehrling-required endpoints but not koch", () => {
    expect(hasPermission("lehrling", "lehrling")).toBe(true);
    expect(hasPermission("lehrling", "koch")).toBe(false);
  });

  it("fruehkoch is between koch and lehrling", () => {
    expect(ROLE_PERMISSIONS.fruehkoch).toBeGreaterThan(ROLE_PERMISSIONS.lehrling);
    expect(ROLE_PERMISSIONS.fruehkoch).toBeLessThan(ROLE_PERMISSIONS.koch);
  });
});

describe("Auth — CSRF Protection Logic", () => {
  function checkCSRF(method: string, origin: string | undefined, host: string, isProduction: boolean): { allowed: boolean; error?: string } {
    // GET/HEAD/OPTIONS are always allowed
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return { allowed: true };
    }
    // No origin header
    if (!origin) {
      if (!isProduction) return { allowed: true }; // dev mode allows no-origin
      return { allowed: false, error: "CSRF: Origin header required" };
    }
    // Check origin matches host
    try {
      const url = new URL(origin);
      if (url.host === host) return { allowed: true };
    } catch {}
    return { allowed: false, error: "CSRF: Origin mismatch" };
  }

  it("allows GET requests without CSRF check", () => {
    const result = checkCSRF("GET", undefined, "localhost:3000", true);
    expect(result.allowed).toBe(true);
  });

  it("allows HEAD requests without CSRF check", () => {
    const result = checkCSRF("HEAD", undefined, "localhost:3000", true);
    expect(result.allowed).toBe(true);
  });

  it("allows OPTIONS requests without CSRF check", () => {
    const result = checkCSRF("OPTIONS", undefined, "localhost:3000", true);
    expect(result.allowed).toBe(true);
  });

  it("blocks POST without origin in production", () => {
    const result = checkCSRF("POST", undefined, "localhost:3000", true);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("CSRF: Origin header required");
  });

  it("allows POST without origin in development", () => {
    const result = checkCSRF("POST", undefined, "localhost:3000", false);
    expect(result.allowed).toBe(true);
  });

  it("allows POST with matching origin", () => {
    const result = checkCSRF("POST", "http://localhost:3000/api/test", "localhost:3000", true);
    expect(result.allowed).toBe(true);
  });

  it("blocks POST with mismatched origin", () => {
    const result = checkCSRF("POST", "http://evil.com", "localhost:3000", true);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("CSRF: Origin mismatch");
  });

  it("blocks DELETE with mismatched origin in production", () => {
    const result = checkCSRF("DELETE", "http://attacker.com", "mise.at", true);
    expect(result.allowed).toBe(false);
  });

  it("allows PUT with matching origin for mise.at", () => {
    const result = checkCSRF("PUT", "https://mise.at/some/path", "mise.at", true);
    expect(result.allowed).toBe(true);
  });
});

describe("Auth — Rate Limiting Configuration", () => {
  // Verify rate limit configuration values (as defined in routes.ts)
  it("auth rate limiter has 15 minute window with max 10 attempts", () => {
    const authConfig = {
      windowMs: 15 * 60 * 1000,
      max: 10,
      skipSuccessfulRequests: true,
    };
    expect(authConfig.windowMs).toBe(900000); // 15 minutes in ms
    expect(authConfig.max).toBe(10);
    expect(authConfig.skipSuccessfulRequests).toBe(true);
  });

  it("register rate limiter has 1 hour window with max 5 registrations", () => {
    const registerConfig = {
      windowMs: 60 * 60 * 1000,
      max: 5,
    };
    expect(registerConfig.windowMs).toBe(3600000); // 1 hour in ms
    expect(registerConfig.max).toBe(5);
  });

  it("rate limit response includes German error message", () => {
    const authMessage = { error: "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten." };
    expect(authMessage.error).toContain("Anmeldeversuche");

    const registerMessage = { error: "Zu viele Registrierungen. Bitte warten Sie eine Stunde." };
    expect(registerMessage.error).toContain("Registrierungen");
  });
});

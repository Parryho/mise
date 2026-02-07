import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules", "dist", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["server/**/*.ts", "shared/**/*.ts"],
      exclude: ["server/index.ts", "server/vite.ts", "server/static.ts", "**/*.test.ts"],
      thresholds: {
        statements: 60,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@content": path.resolve(__dirname, "content"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: { VSTEP_DB_MODE: "memory", SESSION_SECRET: "test-secret-test-secret-test-secret-123", ADMIN_PASSWORD: "test-admin-password" },
  },
});

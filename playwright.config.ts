import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// Outside the project folder: OneDrive-style sync corrupts live database files.
const E2E_DB_DIR = path.join(os.homedir(), ".vstep-prep", "e2e-db");

const PORT = 3100;
// Test-only values for the local e2e server (never used outside this run).
export const E2E_ADMIN_PASSWORD = "e2e-admin-passphrase-123";

/**
 * End-to-end tests drive the real app in Microsoft Edge (installed on Windows; no browser download needed)
 * against a fresh, seeded PGlite database in .e2e-db. Chromium's fake media flags provide a microphone,
 * so the Speaking recorder can be exercised end to end.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.E2E_CHANNEL ?? "msedge",
    permissions: ["microphone"],
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx tsx scripts/e2e-db.ts && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      PGLITE_DIR: E2E_DB_DIR,
      SESSION_SECRET: "e2e-session-secret-e2e-session-secret-0000",
      ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});

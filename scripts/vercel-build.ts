/**
 * Vercel build: checks the required configuration, applies migrations and seeds the content
 * (both idempotent), then builds. A misconfigured production deploy fails here with a clear
 * message instead of serving 500 errors.
 */
import { execSync } from "node:child_process";

const run = (cmd: string) => execSync(cmd, { stdio: "inherit" });

const missing: string[] = [];
if (!process.env.DATABASE_URL) missing.push("DATABASE_URL (Neon pooled connection string)");
if ((process.env.SESSION_SECRET ?? "").length < 32) missing.push("SESSION_SECRET (at least 32 characters)");
if ((process.env.ADMIN_PASSWORD ?? "").length < 12) missing.push("ADMIN_PASSWORD (at least 12 characters)");

const production = process.env.VERCEL_ENV === "production";
if (missing.length) {
  const msg = `Missing environment variables:\n  - ${missing.join("\n  - ")}\nSet them in Vercel → Project → Settings → Environment Variables, then redeploy.`;
  if (production) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}

if (process.env.DATABASE_URL) {
  run("npm run db:migrate");
  run("npm run db:seed");
}
run("npx next build");

/** Prepares a fresh database for end-to-end tests: wipes PGLITE_DIR, then migrates and seeds it. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = process.env.PGLITE_DIR;
if (!dir || path.resolve(dir) === path.resolve(".")) throw new Error("PGLITE_DIR must point at a dedicated e2e folder");
fs.rmSync(path.resolve(dir), { recursive: true, force: true });
const tsx = process.platform === "win32" ? "npx.cmd" : "npx";
for (const script of ["scripts/migrate.ts", "scripts/seed.ts"]) execFileSync(tsx, ["tsx", script], { stdio: "inherit", env: process.env, shell: process.platform === "win32" });
console.log(`e2e database ready in ${path.resolve(dir)}`);

import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

type Holder = { db?: Promise<Db>; close?: () => Promise<void> };
const g = globalThis as unknown as { __vstepDb?: Holder };
const holder: Holder = (g.__vstepDb ??= {});

/**
 * Database selection:
 *  - DATABASE_URL set        → PostgreSQL via node-postgres (production / staging).
 *  - VSTEP_DB_MODE=memory    → in-memory PGlite (automated tests).
 *  - otherwise (development) → file-backed PGlite in ./.data/pglite, migrated automatically.
 */
export function getDb(): Promise<Db> {
  holder.db ??= createDb().catch((err) => {
    holder.db = undefined;
    throw err;
  });
  return holder.db;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX ?? 5) });
    holder.close = () => pool.end();
    return drizzle(pool, { schema }) as unknown as Db;
  }
  if (process.env.NODE_ENV === "production" && process.env.VSTEP_DB_MODE !== "memory" && process.env.VSTEP_ALLOW_PGLITE !== "1") {
    throw new Error("DATABASE_URL is required in production.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const memory = process.env.VSTEP_DB_MODE === "memory";
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  if (!memory) (await import("node:fs")).mkdirSync(dataDir, { recursive: true });
  const client = memory ? new PGlite() : new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  holder.close = () => client.close();
  return db as unknown as Db;
}

/** Test helper: drop the cached connection so the next getDb() creates a fresh database. */
export async function resetDbForTests() {
  if (holder.close) await holder.close();
  holder.db = undefined;
  holder.close = undefined;
}

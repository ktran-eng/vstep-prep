/** npm run db:migrate — applies SQL migrations in ./drizzle to DATABASE_URL (or the local PGlite dev DB). */
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  const folder = path.join(process.cwd(), "drizzle");
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString: url, max: 1 });
    await migrate(drizzle(pool), { migrationsFolder: folder });
    await pool.end();
    console.log("Migrations applied to DATABASE_URL.");
  } else {
    const { getDb, resetDbForTests } = await import("../src/server/db/client");
    await getDb(); // PGlite client migrates on open
    await resetDbForTests();
    const { pgliteDataDir } = await import("../src/server/db/client");
    console.log(`Migrations applied to local PGlite database (${pgliteDataDir()}).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

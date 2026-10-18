/** npm run db:seed — validates content, then upserts it and publishes immutable test snapshots. */
import fs from "node:fs";
import path from "node:path";
import { loadBundle, loadSources } from "../content/index";
import { validateBundle } from "../src/domain/content-validation";
import { DEFAULT_EXAM_SPEC } from "../src/domain/spec";
import { getDb, resetDbForTests } from "../src/server/db/client";
import { seedDatabase, type AudioManifest } from "../src/server/seed";

async function main() {
  const bundle = loadBundle();
  const errors = validateBundle(bundle, DEFAULT_EXAM_SPEC).filter((i) => i.severity === "error");
  if (errors.length) {
    for (const e of errors) console.error(`ERROR ${e.entity}: ${e.message}`);
    throw new Error(`Content has ${errors.length} validation errors; refusing to seed.`);
  }
  const manifestPath = path.join(process.cwd(), "content", "audio-manifest.json");
  const audio: AudioManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  const db = await getDb();
  await seedDatabase(db, bundle, loadSources(), audio, { force: process.argv.includes("--force") });
  await resetDbForTests();
  const missing = bundle.listening.filter((l) => !audio[l.id]).length;
  console.log(`Seeded: ${bundle.reading.length} reading sets, ${bundle.listening.length} listening sets (${missing} without audio), ${bundle.writing.length} writing prompts, ${bundle.speaking.length} speaking prompts, ${bundle.blueprints.length} tests.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

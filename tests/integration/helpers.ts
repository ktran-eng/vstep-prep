import { getDb, resetDbForTests } from "@/server/db/client";
import { seedDatabase } from "@/server/seed";
import { ensureLearnerRowForTests } from "./learner";
import { loadBundle, loadSources } from "@content/index";
import type { ContentBundle } from "@/domain/content-validation";

/** Fresh in-memory Postgres (PGlite) with Mock 1 plus small practice tests built from Mock 1 content. */
export async function freshDb() {
  await resetDbForTests();
  const db = await getDb();
  const full = loadBundle();
  const bundle: ContentBundle = {
    ...full,
    blueprints: [
      full.blueprints.find((b) => b.id === "mock-1")!,
      {
        id: "practice-test-reading",
        name: "Test reading practice",
        description: "test",
        kind: "practice",
        skill: "reading",
        targetLevel: "B1",
        status: "published",
        sections: [{ skill: "reading", timeLimitMinutes: 15, items: ["rd-m1-night-market"] }],
      },
      {
        id: "practice-test-listening",
        name: "Test listening practice",
        description: "test",
        kind: "practice",
        skill: "listening",
        targetLevel: "B1",
        status: "published",
        sections: [{ skill: "listening", timeLimitMinutes: 15, items: ["ls-m1-p1-train", "ls-m1-p2-trip"] }],
      },
    ],
  };
  await seedDatabase(db, bundle, loadSources(), { "ls-m1-p1-train": { file: "ls-m1-p1-train.mp3", durationSeconds: 10, method: "windows_sapi_dev", voices: {} } });
  return { db, bundle };
}

export async function newLearner(db: Awaited<ReturnType<typeof getDb>>) {
  const id = crypto.randomUUID();
  await ensureLearnerRowForTests(db, id);
  return id;
}

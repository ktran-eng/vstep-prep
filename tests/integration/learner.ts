import type { Db } from "@/server/db/client";
import { learnerPreferences, learners } from "@/server/db/schema";

export async function ensureLearnerRowForTests(db: Db, id: string) {
  await db.insert(learners).values({ id }).onConflictDoNothing();
  await db.insert(learnerPreferences).values({ learnerId: id }).onConflictDoNothing();
}

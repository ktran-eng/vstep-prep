import { eq } from "drizzle-orm";
import type { Db } from "./db/client";
import { learnerPreferences, learners } from "./db/schema";

/** Finds the profile for a (normalised) username, creating it on first use. Safe under concurrent calls. */
export async function findOrCreateByUsername(db: Db, username: string) {
  await db.insert(learners).values({ username }).onConflictDoNothing({ target: learners.username });
  const [row] = await db.select().from(learners).where(eq(learners.username, username));
  if (!row) throw new Error("Could not create profile");
  await db.insert(learnerPreferences).values({ learnerId: row.id }).onConflictDoNothing();
  return row;
}

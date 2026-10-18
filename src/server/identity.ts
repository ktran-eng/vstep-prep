import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { LEARNER_COOKIE, UUID_RE, verify } from "@/lib/signing";
import { getDb } from "./db";
import { learnerPreferences, learners } from "./db/schema";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Reads and verifies the signed learner id. Returns null if missing or tampered. */
export async function readLearnerId(): Promise<string | null> {
  const jar = await cookies();
  const id = await verify(jar.get(LEARNER_COOKIE)?.value);
  return id && UUID_RE.test(id) ? id : null;
}

/** Returns the current learner id, creating the learner row on first use. */
export async function requireLearner(): Promise<string> {
  const id = await readLearnerId();
  if (!id) throw new UnauthorizedError("Missing learner session. Please enable cookies and reload.");
  await ensureLearnerRow(id);
  return id;
}

export async function ensureLearnerRow(id: string) {
  const db = await getDb();
  await db.insert(learners).values({ id }).onConflictDoUpdate({ target: learners.id, set: { lastSeenAt: new Date() } });
  await db.insert(learnerPreferences).values({ learnerId: id }).onConflictDoNothing();
}

export async function getLearnerProfile(id: string) {
  const db = await getDb();
  const [learner] = await db.select().from(learners).where(eq(learners.id, id));
  const [prefs] = await db.select().from(learnerPreferences).where(eq(learnerPreferences.learnerId, id));
  return { learner: learner ?? null, prefs: prefs ?? null };
}

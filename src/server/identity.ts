import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { LEARNER_COOKIE, UUID_RE, sign, verify } from "@/lib/signing";
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

const LAST_SEEN_RESOLUTION_MS = 60 * 60 * 1000;

/** The signed-in learner (id + username), or null. Memoised per request, so layout and page share one query. */
export const currentLearner = cache(async () => {
  const id = await readLearnerId();
  if (!id) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: learners.id, username: learners.username, displayName: learners.displayName, lastSeenAt: learners.lastSeenAt })
    .from(learners)
    .where(eq(learners.id, id));
  return row?.username ? row : null;
});

/**
 * Returns the signed-in learner's id, or sends the visitor to /start to choose a sign-in name.
 * Works in Server Components and Server Actions (redirect is propagated by the action wrapper).
 */
export const requireLearner = cache(async (): Promise<string> => {
  const me = await currentLearner();
  if (!me) {
    const path = (await headers()).get("x-vstep-path");
    redirect(path && path !== "/" ? `/start?next=${encodeURIComponent(path)}` : "/start");
  }
  const now = Date.now();
  if (now - me.lastSeenAt.getTime() > LAST_SEEN_RESOLUTION_MS) {
    const db = await getDb();
    await db.update(learners).set({ lastSeenAt: new Date(now) }).where(eq(learners.id, me.id));
  }
  return me.id;
});

export { findOrCreateByUsername } from "./learners";

export async function setSessionCookie(learnerId: string) {
  (await cookies()).set(LEARNER_COOKIE, await sign(learnerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(LEARNER_COOKIE);
}

export const getLearnerProfile = cache(async (id: string) => {
  const db = await getDb();
  const [[learner], [prefs]] = await Promise.all([
    db.select().from(learners).where(eq(learners.id, id)),
    db.select().from(learnerPreferences).where(eq(learnerPreferences.learnerId, id)),
  ]);
  return { learner: learner ?? null, prefs: prefs ?? null };
});

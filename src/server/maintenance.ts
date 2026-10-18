import { lt, sql } from "drizzle-orm";
import type { Db } from "./db/client";
import { blobs, learners, rateLimits } from "./db/schema";

export const RETENTION = { recordingDays: 180, inactiveLearnerMonths: 24, rateLimitDays: 2 };

/** Applies the retention policy published in the privacy notice. Safe to run repeatedly. */
export async function runRetention(db: Db, now = new Date()) {
  const recCutoff = new Date(now.getTime() - RETENTION.recordingDays * 86_400_000);
  const learnerCutoff = new Date(now);
  learnerCutoff.setMonth(learnerCutoff.getMonth() - RETENTION.inactiveLearnerMonths);
  // speaking_submissions.audio_blob_id is ON DELETE SET NULL, so scores/feedback remain while audio is removed.
  const recordings = await db.delete(blobs).where(lt(blobs.createdAt, recCutoff)).returning({ id: blobs.id });
  const stale = await db.delete(learners).where(lt(learners.lastSeenAt, learnerCutoff)).returning({ id: learners.id });
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < ${new Date(now.getTime() - RETENTION.rateLimitDays * 86_400_000)}`);
  return { recordingsDeleted: recordings.length, learnersDeleted: stale.length };
}

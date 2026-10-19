import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import * as t from "@/server/db/schema";
import { readLearnerId } from "@/server/identity";

/** Data portability: everything stored for the signed-in learner, as JSON (recordings referenced by id, not inlined). */
export async function GET() {
  const learnerId = await readLearnerId();
  if (!learnerId) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const attempts = await db.select().from(t.examAttempts).where(eq(t.examAttempts.learnerId, learnerId));
  const ids = attempts.map((a) => a.id);
  const data = {
    exportedAt: new Date().toISOString(),
    learner: (await db.select().from(t.learners).where(eq(t.learners.id, learnerId)))[0] ?? null,
    preferences: (await db.select().from(t.learnerPreferences).where(eq(t.learnerPreferences.learnerId, learnerId)))[0] ?? null,
    attempts,
    answers: ids.length ? await db.select().from(t.attemptAnswers).where(inArray(t.attemptAnswers.attemptId, ids)) : [],
    writing: await db.select().from(t.writingSubmissions).where(eq(t.writingSubmissions.learnerId, learnerId)),
    speaking: await db
      .select({
        id: t.speakingSubmissions.id,
        promptId: t.speakingSubmissions.promptId,
        attemptId: t.speakingSubmissions.attemptId,
        durationSeconds: t.speakingSubmissions.durationSeconds,
        transcript: t.speakingSubmissions.transcript,
        rubricScores: t.speakingSubmissions.rubricScores,
        feedback: t.speakingSubmissions.feedback,
        selfAssessment: t.speakingSubmissions.selfAssessment,
        submittedAt: t.speakingSubmissions.submittedAt,
        recordingUrl: t.speakingSubmissions.audioBlobId,
      })
      .from(t.speakingSubmissions)
      .where(eq(t.speakingSubmissions.learnerId, learnerId)),
    bookmarks: await db.select().from(t.mistakeBookmarks).where(eq(t.mistakeBookmarks.learnerId, learnerId)),
    vocabulary: await db.select().from(t.vocabularyNotes).where(eq(t.vocabularyNotes.learnerId, learnerId)),
    studyPlan: await db.select().from(t.studyPlanTasks).where(eq(t.studyPlanTasks.learnerId, learnerId)),
  };
  data.speaking = data.speaking.map((s) => ({ ...s, recordingUrl: s.recordingUrl ? `/api/recordings/${s.id}` : null }));
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="vstep-prep-my-data.json"', "Cache-Control": "no-store" },
  });
}

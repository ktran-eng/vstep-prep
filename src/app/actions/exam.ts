"use server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { getActiveSpec, getScoringConfig, rateLimit } from "@/server/ops";
import {
  advanceSection,
  getAttemptView,
  getPracticeTranscript,
  recomputeSummary,
  registerPlay,
  saveAnswer,
  saveWritingDraft,
  startAttempt,
  submitAttempt,
  toggleMark,
} from "@/server/exam-engine";
import { gradeSpeakingSubmission, gradeWritingSubmission } from "@/server/grading/service";
import { InputError, run } from "@/server/action-result";
import { countWords } from "@/domain/text";
import { and, eq } from "drizzle-orm";
import { speakingSubmissions, writingSubmissions } from "@/server/db/schema";

const uuid = z.string().uuid();

export async function startAttemptAction(formData: FormData) {
  const learnerId = await requireLearner();
  const blueprintId = z.string().max(100).parse(formData.get("blueprintId"));
  const mode = z.enum(["exam", "practice"]).parse(formData.get("mode"));
  const db = await getDb();
  const { attemptId } = await startAttempt(db, learnerId, blueprintId, mode);
  redirect(`/attempt/${attemptId}`);
}

export async function getAttemptViewAction(attemptId: string) {
  return run(async () => {
    const learnerId = await requireLearner();
    return getAttemptView(await getDb(), learnerId, uuid.parse(attemptId), await getScoringConfig());
  });
}

export async function saveAnswerAction(input: { attemptId: string; questionId: string; response: string | null; timeSpentDelta?: number }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z
      .object({ attemptId: uuid, questionId: z.string().max(100), response: z.enum(["A", "B", "C", "D"]).nullable(), timeSpentDelta: z.number().optional() })
      .parse(input);
    if (!(await rateLimit(`save:${learnerId}`, 240, 60))) throw new InputError("Too many requests; slow down.");
    return saveAnswer(await getDb(), learnerId, p, await getScoringConfig());
  });
}

export async function toggleMarkAction(input: { attemptId: string; questionId: string; marked: boolean }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ attemptId: uuid, questionId: z.string().max(100), marked: z.boolean() }).parse(input);
    await toggleMark(await getDb(), learnerId, p.attemptId, p.questionId, p.marked, await getScoringConfig());
  });
}

export async function saveWritingAction(input: { attemptId: string; promptId: string; text: string; timeSpentDelta?: number }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ attemptId: uuid, promptId: z.string().max(100), text: z.string().max(20000), timeSpentDelta: z.number().optional() }).parse(input);
    return saveWritingDraft(await getDb(), learnerId, { ...p, wordCount: countWords(p.text) }, await getScoringConfig());
  });
}

function scheduleGrading(learnerId: string, attemptId: string) {
  after(async () => {
    const db = await getDb();
    const ws = await db.select({ id: writingSubmissions.id }).from(writingSubmissions).where(and(eq(writingSubmissions.attemptId, attemptId), eq(writingSubmissions.learnerId, learnerId)));
    for (const w of ws) await gradeWritingSubmission(db, learnerId, w.id).catch((e) => console.error("grading", e));
    const ss = await db.select({ id: speakingSubmissions.id }).from(speakingSubmissions).where(and(eq(speakingSubmissions.attemptId, attemptId), eq(speakingSubmissions.learnerId, learnerId)));
    for (const s of ss) await gradeSpeakingSubmission(db, learnerId, s.id).catch((e) => console.error("grading", e));
    await recomputeSummary(db, attemptId, await getScoringConfig());
  });
}

export async function advanceSectionAction(input: { attemptId: string; expectedSection: number }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ attemptId: uuid, expectedSection: z.number().int().min(0) }).parse(input);
    const a = await advanceSection(await getDb(), learnerId, p.attemptId, p.expectedSection, await getScoringConfig());
    if (a.status !== "in_progress") scheduleGrading(learnerId, a.id);
    return { status: a.status, currentSection: a.currentSection };
  });
}

export async function submitAttemptAction(attemptId: string) {
  return run(async () => {
    const learnerId = await requireLearner();
    const a = await submitAttempt(await getDb(), learnerId, uuid.parse(attemptId), await getScoringConfig());
    scheduleGrading(learnerId, a.id);
    return { status: a.status };
  });
}

/** Re-run grading for an attempt whose Writing/Speaking grading failed or is still pending. */
export async function regradeAttemptAction(attemptId: string) {
  return run(async () => {
    const learnerId = await requireLearner();
    const id = uuid.parse(attemptId);
    const view = await getAttemptView(await getDb(), learnerId, id, await getScoringConfig());
    if (view.attempt.status === "in_progress") throw new InputError("Attempt not finished.");
    scheduleGrading(learnerId, id);
  });
}

export async function registerPlayAction(input: { attemptId: string; audioId: string }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ attemptId: uuid, audioId: z.string().max(100) }).parse(input);
    const spec = await getActiveSpec();
    return registerPlay(await getDb(), learnerId, p.attemptId, p.audioId, spec.listening.strictPlaysAllowed, await getScoringConfig());
  });
}

export async function transcriptAction(input: { attemptId: string; audioId: string }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ attemptId: uuid, audioId: z.string().max(100) }).parse(input);
    return getPracticeTranscript(await getDb(), learnerId, p.attemptId, p.audioId);
  });
}

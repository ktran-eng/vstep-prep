"use server";
import { after } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { blobs, speakingPrompts, speakingSubmissions, writingPrompts, writingSubmissions } from "@/server/db/schema";
import { requireLearner } from "@/server/identity";
import { assertSpeakingWritable } from "@/server/exam-engine";
import { gradeSpeakingSubmission, gradeWritingSubmission } from "@/server/grading/service";
import { getScoringConfig, rateLimit } from "@/server/ops";
import { InputError, run } from "@/server/action-result";
import { validateRecording } from "@/server/audio-upload";
import { countWords } from "@/domain/text";

/* ------------------------------ Writing ------------------------------ */

/** Returns the learner's open standalone draft for a prompt, creating one if needed. */
export async function getOrCreateWritingDraft(promptId: string) {
  const learnerId = await requireLearner();
  const db = await getDb();
  const [p] = await db.select({ id: writingPrompts.id }).from(writingPrompts).where(eq(writingPrompts.id, promptId));
  if (!p) throw new InputError("Prompt not found");
  const [draft] = await db
    .select()
    .from(writingSubmissions)
    .where(and(eq(writingSubmissions.learnerId, learnerId), eq(writingSubmissions.promptId, promptId), isNull(writingSubmissions.attemptId), eq(writingSubmissions.status, "draft")))
    .orderBy(desc(writingSubmissions.startedAt))
    .limit(1);
  if (draft) return draft;
  const [created] = await db.insert(writingSubmissions).values({ learnerId, promptId }).returning();
  return created!;
}

export async function saveWritingDraftAction(input: { submissionId: string; text: string; timeSpentDelta?: number }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ submissionId: z.string().uuid(), text: z.string().max(20000), timeSpentDelta: z.number().min(0).max(600).optional() }).parse(input);
    const db = await getDb();
    const now = new Date();
    const [sub] = await db.select().from(writingSubmissions).where(and(eq(writingSubmissions.id, p.submissionId), eq(writingSubmissions.learnerId, learnerId)));
    if (!sub || sub.attemptId) throw new InputError("Draft not found");
    if (sub.status !== "draft") throw new InputError("This response has already been submitted.");
    await db
      .update(writingSubmissions)
      .set({ responseText: p.text, wordCount: countWords(p.text), updatedAt: now, timeSpentSeconds: sub.timeSpentSeconds + Math.round(p.timeSpentDelta ?? 0) })
      .where(eq(writingSubmissions.id, sub.id));
    return { savedAt: now.toISOString() };
  });
}

export async function submitWritingAction(input: { submissionId: string; text: string; timeSpentDelta?: number }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ submissionId: z.string().uuid(), text: z.string().max(20000), timeSpentDelta: z.number().min(0).max(600).optional() }).parse(input);
    const db = await getDb();
    const now = new Date();
    const [sub] = await db.select().from(writingSubmissions).where(and(eq(writingSubmissions.id, p.submissionId), eq(writingSubmissions.learnerId, learnerId)));
    if (!sub || sub.attemptId) throw new InputError("Draft not found");
    if (sub.status === "submitted") return { id: sub.id }; // idempotent
    if (countWords(p.text) === 0) throw new InputError("Your response is empty.");
    await db
      .update(writingSubmissions)
      .set({ responseText: p.text, wordCount: countWords(p.text), status: "submitted", submittedAt: now, updatedAt: now, timeSpentSeconds: sub.timeSpentSeconds + Math.round(p.timeSpentDelta ?? 0) })
      .where(and(eq(writingSubmissions.id, sub.id), eq(writingSubmissions.status, "draft")));
    after(() => gradeWritingSubmission(db, learnerId, sub.id).then(() => undefined).catch((e) => console.error("grading", e)));
    return { id: sub.id };
  });
}

export async function regradeWritingAction(submissionId: string) {
  return run(async () => {
    const learnerId = await requireLearner();
    const id = z.string().uuid().parse(submissionId);
    const db = await getDb();
    const res = await gradeWritingSubmission(db, learnerId, id);
    return { gradingStatus: res.gradingStatus };
  });
}

/* ------------------------------ Speaking ----------------------------- */

const speakingForm = z.object({
  promptId: z.string().max(100),
  attemptId: z.string().uuid().optional(),
  consent: z.enum(["recording_only", "ai_processing"]),
  durationSeconds: z.coerce.number().min(1).max(600),
});

/** Uploads a recording after the learner explicitly presses submit. Nothing is uploaded while recording. */
export async function submitSpeakingAction(formData: FormData) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = speakingForm.parse({
      promptId: formData.get("promptId"),
      attemptId: formData.get("attemptId") || undefined,
      consent: formData.get("consent"),
      durationSeconds: formData.get("durationSeconds"),
    });
    const file = formData.get("audio");
    if (!(file instanceof Blob)) throw new InputError("No recording received.");
    if (!(await rateLimit(`upload:${learnerId}`, 30, 3600))) throw new InputError("Upload limit reached; try again later.");
    const buf = Buffer.from(await file.arrayBuffer());
    const v = validateRecording(buf, file.type);
    if (!v.ok) throw new InputError(v.error);

    const db = await getDb();
    const [prompt] = await db.select().from(speakingPrompts).where(eq(speakingPrompts.id, p.promptId));
    if (!prompt) throw new InputError("Prompt not found");
    if (p.durationSeconds > prompt.responseSeconds + 60) throw new InputError("Recording is longer than allowed for this part.");

    if (p.attemptId) {
      const mode = await assertSpeakingWritable(db, learnerId, p.attemptId, p.promptId, await getScoringConfig());
      const [existing] = await db
        .select()
        .from(speakingSubmissions)
        .where(and(eq(speakingSubmissions.attemptId, p.attemptId), eq(speakingSubmissions.promptId, p.promptId), eq(speakingSubmissions.learnerId, learnerId)));
      if (existing) {
        if (mode === "exam") throw new InputError("In exam mode each part can be submitted only once.");
        if (existing.audioBlobId) await db.delete(blobs).where(eq(blobs.id, existing.audioBlobId));
        await db.delete(speakingSubmissions).where(eq(speakingSubmissions.id, existing.id));
      }
    }
    const [blob] = await db.insert(blobs).values({ learnerId, mimeType: v.mime, sizeBytes: buf.length, data: buf }).returning({ id: blobs.id });
    const [sub] = await db
      .insert(speakingSubmissions)
      .values({ learnerId, attemptId: p.attemptId ?? null, promptId: p.promptId, audioBlobId: blob!.id, durationSeconds: p.durationSeconds, consentStatus: p.consent })
      .returning({ id: speakingSubmissions.id });
    // Exam attempts are graded after the whole test is submitted; standalone practice is graded now.
    if (!p.attemptId) after(() => gradeSpeakingSubmission(db, learnerId, sub!.id).then(() => undefined).catch((e) => console.error("grading", e)));
    return { id: sub!.id };
  });
}

export async function saveSelfAssessmentAction(input: { submissionId: string; ratings: Record<string, number>; note?: string }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z
      .object({ submissionId: z.string().uuid(), ratings: z.record(z.string().max(40), z.number().int().min(1).max(5)), note: z.string().max(2000).optional() })
      .parse(input);
    const db = await getDb();
    const res = await db
      .update(speakingSubmissions)
      .set({ selfAssessment: { ratings: p.ratings, note: p.note ?? "", at: new Date().toISOString() } })
      .where(and(eq(speakingSubmissions.id, p.submissionId), eq(speakingSubmissions.learnerId, learnerId)))
      .returning({ id: speakingSubmissions.id });
    if (!res.length) throw new InputError("Submission not found");
  });
}

export async function regradeSpeakingAction(submissionId: string) {
  return run(async () => {
    const learnerId = await requireLearner();
    const id = z.string().uuid().parse(submissionId);
    const res = await gradeSpeakingSubmission(await getDb(), learnerId, id);
    return { gradingStatus: res.gradingStatus };
  });
}

export async function deleteRecordingAction(submissionId: string) {
  return run(async () => {
    const learnerId = await requireLearner();
    const id = z.string().uuid().parse(submissionId);
    const db = await getDb();
    const [sub] = await db.select().from(speakingSubmissions).where(and(eq(speakingSubmissions.id, id), eq(speakingSubmissions.learnerId, learnerId)));
    if (!sub) throw new InputError("Submission not found");
    if (sub.audioBlobId) await db.delete(blobs).where(and(eq(blobs.id, sub.audioBlobId), eq(blobs.learnerId, learnerId)));
  });
}

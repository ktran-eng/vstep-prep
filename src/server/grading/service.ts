/** Orchestrates grading: provider selection, cost limits, persistence and failure states. */
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { blobs, learnerPreferences, rateLimits, speakingPrompts, speakingSubmissions, writingPrompts, writingSubmissions } from "../db/schema";
import { anthropicSpeakingGrader, anthropicWritingGrader, PROMPT_VERSION } from "./anthropic";
import { openaiTranscriber } from "./openai";
import type { SpeakingGrader, Transcriber, WritingGrader } from "./types";
import { SPEAKING_RUBRIC, WRITING_RUBRIC } from "@/domain/rubrics";
import type { SpeakingContent } from "@/domain/snapshot";

type Providers = { writing: WritingGrader; speaking: SpeakingGrader; transcriber: Transcriber };
const g = globalThis as unknown as { __vstepProviders?: Providers };

export function getProviders(): Providers {
  return g.__vstepProviders ?? { writing: anthropicWritingGrader, speaking: anthropicSpeakingGrader, transcriber: openaiTranscriber };
}
/** Test hook. */
export function setProvidersForTests(p: Providers | undefined) {
  g.__vstepProviders = p;
}

export function aiGradingConfigured() {
  return { writing: Boolean(process.env.ANTHROPIC_API_KEY), transcription: Boolean(process.env.OPENAI_API_KEY) };
}

/** Daily per-learner cap on AI calls (cost control). */
async function consumeAiQuota(db: Db, learnerId: string): Promise<boolean> {
  const limit = Number(process.env.AI_DAILY_LIMIT_PER_LEARNER ?? 10);
  const day = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const [row] = await db
    .insert(rateLimits)
    .values({ key: `ai:${learnerId}`, windowStart: day, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });
  return (row?.count ?? 1) <= limit;
}

async function targetLevel(db: Db, learnerId: string) {
  const [p] = await db.select({ t: learnerPreferences.targetLevel }).from(learnerPreferences).where(eq(learnerPreferences.learnerId, learnerId));
  return p?.t ?? "B2";
}

export async function gradeWritingSubmission(db: Db, learnerId: string, submissionId: string) {
  const [sub] = await db.select().from(writingSubmissions).where(and(eq(writingSubmissions.id, submissionId), eq(writingSubmissions.learnerId, learnerId)));
  if (!sub) throw new Error("Submission not found");
  if (sub.status !== "submitted" || sub.gradingStatus === "graded") return sub;
  // Claim the job so parallel triggers don't double-bill.
  const claimed = await db
    .update(writingSubmissions)
    .set({ gradingStatus: "pending", gradingError: null, updatedAt: new Date() })
    .where(and(eq(writingSubmissions.id, sub.id), sql`(${writingSubmissions.gradingStatus} <> 'pending' or ${writingSubmissions.updatedAt} < now() - interval '3 minutes')`))
    .returning();
  if (claimed.length === 0) return sub;

  const fail = async (status: "unavailable" | "failed", error: string) => {
    const [row] = await db.update(writingSubmissions).set({ gradingStatus: status, gradingError: error }).where(eq(writingSubmissions.id, sub.id)).returning();
    return row!;
  };
  if (sub.wordCount < 20) return fail("failed", "Response too short to assess (fewer than 20 words).");
  if (!aiGradingConfigured().writing && !g.__vstepProviders) return fail("unavailable", "Automatic grading is not configured on this server.");
  if (!(await consumeAiQuota(db, learnerId))) return fail("failed", "Daily AI feedback limit reached. Try again tomorrow.");

  const [prompt] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, sub.promptId));
  if (!prompt) return fail("failed", "Prompt missing");
  const res = await getProviders().writing.grade({
    task: prompt.taskType as "letter" | "essay",
    instructions: prompt.instructions,
    stimulus: prompt.stimulus,
    requiredPoints: prompt.requiredPoints,
    minWords: prompt.minWords,
    response: sub.responseText,
    wordCount: sub.wordCount,
    targetLevel: await targetLevel(db, learnerId),
  });
  if (!res.ok) return fail(res.status, res.error);
  const [row] = await db
    .update(writingSubmissions)
    .set({
      gradingStatus: "graded",
      rubricScores: res.criterionScores,
      feedback: res.feedback,
      overallScore: res.overall,
      gradingMethod: "ai_estimate",
      gradingModelVersion: `${res.model}/${PROMPT_VERSION}`,
      rubricVersion: WRITING_RUBRIC.id,
      gradedAt: new Date(),
      gradingError: null,
    })
    .where(eq(writingSubmissions.id, sub.id))
    .returning();
  return row!;
}

function speakingPromptText(content: SpeakingContent, instructions: string) {
  if (content.part === 1) return `${instructions}\n${content.topics.map((t) => `${t.name}: ${t.questions.join(" / ")}`).join("\n")}`;
  if (content.part === 2) return `${instructions}\nSituation: ${content.situation}\nOptions: ${content.options.join("; ")}`;
  return `${instructions}\nTopic: ${content.topic}\nIdeas: ${content.ideas.join("; ")}\nFollow-up questions: ${content.followUps.join(" / ")}`;
}

export async function gradeSpeakingSubmission(db: Db, learnerId: string, submissionId: string) {
  const [sub] = await db.select().from(speakingSubmissions).where(and(eq(speakingSubmissions.id, submissionId), eq(speakingSubmissions.learnerId, learnerId)));
  if (!sub) throw new Error("Submission not found");
  if (sub.gradingStatus === "graded") return sub;
  const set = async (v: Partial<typeof speakingSubmissions.$inferInsert>) => {
    const [row] = await db.update(speakingSubmissions).set(v).where(eq(speakingSubmissions.id, sub.id)).returning();
    return row!;
  };
  if (sub.consentStatus !== "ai_processing") return set({ gradingStatus: "unavailable", gradingError: "Learner chose recording-only; no AI processing." });
  const configured = aiGradingConfigured();
  if (!g.__vstepProviders && (!configured.transcription || !configured.writing))
    return set({ gradingStatus: "unavailable", transcriptionStatus: configured.transcription ? sub.transcriptionStatus : "unavailable", gradingError: "Automatic speaking feedback is not configured on this server." });
  if (!(await consumeAiQuota(db, learnerId))) return set({ gradingStatus: "failed", gradingError: "Daily AI feedback limit reached. Try again tomorrow." });
  await set({ gradingStatus: "pending", gradingError: null });

  let transcript = sub.transcript;
  if (!transcript) {
    if (!sub.audioBlobId) return set({ gradingStatus: "failed", gradingError: "Recording missing" });
    const [blob] = await db.select().from(blobs).where(and(eq(blobs.id, sub.audioBlobId), eq(blobs.learnerId, learnerId)));
    if (!blob) return set({ gradingStatus: "failed", gradingError: "Recording missing" });
    const tr = await getProviders().transcriber.transcribe(blob.data, blob.mimeType);
    if (!tr.ok) return set({ transcriptionStatus: tr.status, gradingStatus: tr.status, gradingError: tr.error });
    transcript = tr.text;
    await set({ transcript, transcriptionStatus: "done" });
  }
  if (!transcript || transcript.split(/\s+/).length < 5) return set({ gradingStatus: "failed", gradingError: "Too little speech was detected to give feedback." });

  const [prompt] = await db.select().from(speakingPrompts).where(eq(speakingPrompts.id, sub.promptId));
  if (!prompt) return set({ gradingStatus: "failed", gradingError: "Prompt missing" });
  const res = await getProviders().speaking.grade({
    part: prompt.partNumber,
    promptText: speakingPromptText(prompt.content as SpeakingContent, prompt.instructions),
    transcript,
    durationSeconds: sub.durationSeconds ?? 0,
    targetLevel: await targetLevel(db, learnerId),
  });
  if (!res.ok) return set({ gradingStatus: res.status, gradingError: res.error });
  return set({
    gradingStatus: "graded",
    rubricScores: res.criterionScores,
    feedback: res.feedback,
    overallScore: res.overall,
    gradingModelVersion: `${res.model}/${PROMPT_VERSION}`,
    rubricVersion: SPEAKING_RUBRIC.id,
    gradedAt: new Date(),
    gradingError: null,
  });
}

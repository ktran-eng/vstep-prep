import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, newLearner } from "./helpers";
import type { Db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { gradeSpeakingSubmission, gradeWritingSubmission, setProvidersForTests } from "@/server/grading/service";
import type { SpeakingGrader, Transcriber, WritingGrader } from "@/server/grading/types";
import { advanceSection, recomputeSummary, saveAnswer, getAttemptView, startAttempt, submitAttempt, type ScoreSummary } from "@/server/exam-engine";
import { getDashboard } from "@/server/analytics";
import { runRetention } from "@/server/maintenance";
import { DEFAULT_SCORING_CONFIG as CFG } from "@/domain/spec";

let db: Db;
beforeAll(async () => {
  ({ db } = await freshDb());
});
afterEach(() => setProvidersForTests(undefined));

const crit = (keys: string[], score: number) => keys.map((key) => ({ key, score, evidence: "e", comment: "c" }));

const okWriting: WritingGrader = {
  name: "fake",
  async grade(i) {
    return {
      ok: true,
      model: "fake-model",
      overall: 6.5,
      criterionScores: { task_fulfilment: 7, organisation: 6.5, vocabulary: 6.5, grammar: 6 },
      feedback: { criteria: crit(["task_fulfilment", "organisation", "vocabulary", "grammar"], 6.5), strengths: ["s"], priorities: ["p"], corrections: [], organisationFeedback: "o", missingRequirements: i.wordCount < 120 ? ["too short"] : [], revisionPlan: [], summaryVi: "tóm tắt" },
    };
  },
};
const failingWriting: WritingGrader = { name: "fail", grade: async () => ({ ok: false, status: "failed", error: "Grading timed out; retry later" }) };
const okTranscriber: Transcriber = { name: "fake", transcribe: async () => ({ ok: true, text: "I think the best option is a picnic because it is cheap and fun for everyone", model: "fake-stt" }) };
const okSpeaking: SpeakingGrader = {
  name: "fake",
  grade: async () => ({ ok: true, model: "fake", overall: 6, criterionScores: { task_relevance: 6, fluency_coherence: 6, vocabulary: 6, grammar: 6 }, feedback: { criteria: crit(["task_relevance", "fluency_coherence", "vocabulary", "grammar"], 6), strengths: [], priorities: [], corrections: [], missingRequirements: [], revisionPlan: [], summaryVi: "" } }),
};

async function submittedWriting(learnerId: string, text: string) {
  const [w] = await db
    .insert(t.writingSubmissions)
    .values({ learnerId, promptId: "wr-p-b1-letter-party", responseText: text, wordCount: text.split(/\s+/).length, status: "submitted", submittedAt: new Date() })
    .returning();
  return w!;
}
const LONG = Array.from({ length: 130 }, (_, i) => `word${i}`).join(" ");

describe("writing grading", () => {
  it("is 'unavailable' (never a fabricated score) when no provider key is configured", async () => {
    const learner = await newLearner(db);
    const w = await submittedWriting(learner, LONG);
    const r = await gradeWritingSubmission(db, learner, w.id);
    expect(r.gradingStatus).toBe("unavailable");
    expect(r.overallScore).toBeNull();
    expect(r.responseText).toBe(LONG); // submission is preserved
  });

  it("stores structured rubric feedback with model and rubric versions", async () => {
    setProvidersForTests({ writing: okWriting, speaking: okSpeaking, transcriber: okTranscriber });
    const learner = await newLearner(db);
    const w = await submittedWriting(learner, LONG);
    const r = await gradeWritingSubmission(db, learner, w.id);
    expect(r.gradingStatus).toBe("graded");
    expect(r.overallScore).toBe(6.5);
    expect(r.gradingModelVersion).toMatch(/^fake-model\//);
    expect(r.rubricVersion).toBe("writing-practice-v1");
  });

  it("records provider failures as 'failed' with a safe message, allowing retry", async () => {
    setProvidersForTests({ writing: failingWriting, speaking: okSpeaking, transcriber: okTranscriber });
    const learner = await newLearner(db);
    const w = await submittedWriting(learner, LONG);
    const r = await gradeWritingSubmission(db, learner, w.id);
    expect(r.gradingStatus).toBe("failed");
    expect(r.gradingError).toContain("retry");
    setProvidersForTests({ writing: okWriting, speaking: okSpeaking, transcriber: okTranscriber });
    expect((await gradeWritingSubmission(db, learner, w.id)).gradingStatus).toBe("graded");
  });

  it("enforces the daily AI quota per learner", async () => {
    setProvidersForTests({ writing: okWriting, speaking: okSpeaking, transcriber: okTranscriber });
    process.env.AI_DAILY_LIMIT_PER_LEARNER = "2";
    const learner = await newLearner(db);
    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await gradeWritingSubmission(db, learner, (await submittedWriting(learner, LONG)).id)).gradingStatus);
    delete process.env.AI_DAILY_LIMIT_PER_LEARNER;
    expect(statuses).toEqual(["graded", "graded", "failed"]);
  });

  it("cannot grade another learner's submission", async () => {
    const owner = await newLearner(db);
    const other = await newLearner(db);
    const w = await submittedWriting(owner, LONG);
    await expect(gradeWritingSubmission(db, other, w.id)).rejects.toThrow("Submission not found");
  });
});

describe("speaking grading", () => {
  async function recording(learnerId: string, consent: "recording_only" | "ai_processing") {
    const [blob] = await db.insert(t.blobs).values({ learnerId, mimeType: "audio/webm", sizeBytes: 4, data: Buffer.from([0x1a, 0x45, 0xdf, 0xa3]) }).returning();
    const [s] = await db.insert(t.speakingSubmissions).values({ learnerId, promptId: "sp-p-b1-p2", audioBlobId: blob!.id, durationSeconds: 90, consentStatus: consent }).returning();
    return s!;
  }
  it("respects recording-only consent: nothing is sent to providers", async () => {
    let called = false;
    setProvidersForTests({ writing: okWriting, speaking: okSpeaking, transcriber: { name: "spy", transcribe: async () => ((called = true), { ok: true, text: "x", model: "x" }) } });
    const learner = await newLearner(db);
    const s = await recording(learner, "recording_only");
    const r = await gradeSpeakingSubmission(db, learner, s.id);
    expect(r.gradingStatus).toBe("unavailable");
    expect(called).toBe(false);
  });
  it("transcribes then grades with consent; pronunciation is never machine-scored", async () => {
    setProvidersForTests({ writing: okWriting, speaking: okSpeaking, transcriber: okTranscriber });
    const learner = await newLearner(db);
    const s = await recording(learner, "ai_processing");
    const r = await gradeSpeakingSubmission(db, learner, s.id);
    expect(r.transcriptionStatus).toBe("done");
    expect(r.gradingStatus).toBe("graded");
    expect(Object.keys(r.rubricScores as object)).not.toContain("pronunciation");
  });
});

describe("analytics & results", () => {
  it("dashboard is empty for a new learner and derived from records afterwards", async () => {
    const learner = await newLearner(db);
    const empty = await getDashboard(db, learner);
    expect(empty.counts.sessions).toBe(0);
    expect(empty.trend).toEqual([]);

    const { attemptId } = await startAttempt(db, learner, "practice-test-reading", "practice");
    const v = await getAttemptView(db, learner, attemptId, CFG);
    const qs = v.snapshot.sections[0]!.groups.flatMap((g) => (g.kind === "reading" ? g.questions : []));
    for (const q of qs.slice(0, 5)) await saveAnswer(db, learner, { attemptId, questionId: q.id, response: "A" }, CFG);
    await submitAttempt(db, learner, attemptId, CFG);

    const d = await getDashboard(db, learner);
    expect(d.counts.sessions).toBe(1);
    expect(d.trend).toHaveLength(1);
    expect(d.trend[0]!.skill).toBe("reading");
    const total = d.typeStats.reduce((n, s) => n + s.total, 0);
    expect(total).toBe(10);
  });

  it("mock overall band appears only once all four skills have estimates", async () => {
    setProvidersForTests({ writing: okWriting, speaking: okSpeaking, transcriber: okTranscriber });
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "practice");
    await advanceSection(db, learner, attemptId, 0, CFG);
    await advanceSection(db, learner, attemptId, 1, CFG);
    const done = await submitAttempt(db, learner, attemptId, CFG);
    const s = done.scoreSummary as ScoreSummary;
    expect(s.overall).toBeNull();
    expect(s.skills.find((x) => x.skill === "speaking")!.status).toBe("not_attempted");
    expect(s.official).toBe(false);
    // Empty writing counts as 0 rather than pending.
    const re = await recomputeSummary(db, attemptId, CFG);
    expect((re.scoreSummary as ScoreSummary).skills.find((x) => x.skill === "writing")!.estimate).toBe(0);
  });
});

describe("retention", () => {
  it("deletes recordings older than the retention period but keeps the feedback", async () => {
    const learner = await newLearner(db);
    const [blob] = await db.insert(t.blobs).values({ learnerId: learner, mimeType: "audio/webm", sizeBytes: 1, data: Buffer.from([1]), createdAt: new Date(Date.now() - 200 * 86_400_000) }).returning();
    const [sub] = await db.insert(t.speakingSubmissions).values({ learnerId: learner, promptId: "sp-p-b1-p1", audioBlobId: blob!.id, consentStatus: "recording_only", transcript: "kept" }).returning();
    const r = await runRetention(db);
    expect(r.recordingsDeleted).toBeGreaterThanOrEqual(1);
    const [after] = await db.select().from(t.speakingSubmissions).where(eq(t.speakingSubmissions.id, sub!.id));
    expect(after!.audioBlobId).toBeNull();
    expect(after!.transcript).toBe("kept");
  });
});

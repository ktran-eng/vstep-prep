import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb, newLearner } from "./helpers";
import type { Db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import {
  EngineError,
  advanceSection,
  getAttemptView,
  getPracticeTranscript,
  registerPlay,
  saveAnswer,
  saveWritingDraft,
  selectSection,
  startAttempt,
  submitAttempt,
} from "@/server/exam-engine";
import { publishSnapshot } from "@/server/snapshots";
import { DEFAULT_SCORING_CONFIG as CFG } from "@/domain/spec";
import type { ProtectedSnapshot } from "@/domain/snapshot";

let db: Db;
beforeAll(async () => {
  ({ db } = await freshDb());
});

async function keyFor(attemptId: string) {
  const [a] = await db.select().from(t.examAttempts).where(eq(t.examAttempts.id, attemptId));
  const [s] = await db.select().from(t.blueprintSnapshots).where(eq(t.blueprintSnapshots.id, a!.snapshotId));
  return s!.protectedPayload as ProtectedSnapshot;
}

describe("seeding & snapshots", () => {
  it("publishes an immutable snapshot that meets the mock specification", async () => {
    const [snap] = await db.select().from(t.blueprintSnapshots).where(eq(t.blueprintSnapshots.blueprintId, "mock-1"));
    const pub = snap!.publicPayload as { sections: { skill: string; questionCount: number; timeLimitSeconds: number }[] };
    expect(pub.sections.map((s) => s.skill)).toEqual(["listening", "reading", "writing", "speaking"]);
    expect(pub.sections[0]!.questionCount).toBe(35);
    expect(pub.sections[1]!.questionCount).toBe(40);
    expect(pub.sections.map((s) => s.timeLimitSeconds)).toEqual([2400, 3600, 3600, 720]);
  });

  it("never puts answer keys, transcripts or model answers in the public payload", async () => {
    const [snap] = await db.select().from(t.blueprintSnapshots).where(eq(t.blueprintSnapshots.blueprintId, "mock-1"));
    const json = JSON.stringify(snap!.publicPayload);
    expect(json).not.toMatch(/"(answer|explanation|evidence|distractors|segments|sampleResponse|modelResponse|writingSamples|speakingModels)":/);
    // A transcript sentence must not appear in the public payload.
    expect(json).not.toContain("Passengers for Hai Phong should go to platform six immediately");
  });

  it("re-publishing unchanged content reuses the same snapshot", async () => {
    const [before] = await db.select().from(t.blueprintSnapshots).where(eq(t.blueprintSnapshots.blueprintId, "practice-test-reading"));
    const again = await publishSnapshot(db, "practice-test-reading");
    expect(again.id).toBe(before!.id);
  });
});

describe("attempt lifecycle", () => {
  it("start is idempotent, including concurrent requests", async () => {
    const learner = await newLearner(db);
    const [a, b] = await Promise.all([startAttempt(db, learner, "practice-test-reading", "exam"), startAttempt(db, learner, "practice-test-reading", "exam")]);
    expect(a.attemptId).toBe(b.attemptId);
    const again = await startAttempt(db, learner, "practice-test-reading", "exam");
    expect(again).toEqual({ attemptId: a.attemptId, resumed: true });
    const rows = await db.select().from(t.examAttempts).where(eq(t.examAttempts.learnerId, learner));
    expect(rows).toHaveLength(1);
  });

  it("does not release keys before submission, persists answers, and grades on submit", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "practice-test-reading", "exam");
    const view = await getAttemptView(db, learner, attemptId, CFG);
    expect(view.released.answers).toEqual({});
    expect(view.remainingSeconds).toBeGreaterThan(890);
    const questions = view.snapshot.sections[0]!.groups.flatMap((g) => (g.kind === "reading" ? g.questions : []));
    const keys = await keyFor(attemptId);
    // Answer 7 correctly, 2 wrong, leave 1 blank.
    for (const [i, q] of questions.entries()) {
      if (i === 9) continue;
      const right = keys.answers[q.id]!.answer;
      const wrong = ["A", "B", "C", "D"].find((k) => k !== right)!;
      await saveAnswer(db, learner, { attemptId, questionId: q.id, response: i < 7 ? right : wrong }, CFG);
    }
    // Answers survive a "refresh".
    const reloaded = await getAttemptView(db, learner, attemptId, CFG);
    expect(Object.values(reloaded.answers).filter((a) => a.response).length).toBe(9);
    expect(reloaded.released.answers).toEqual({});

    const done = await submitAttempt(db, learner, attemptId, CFG);
    expect(done.status).toBe("submitted");
    const summary = done.scoreSummary as { skills: { objective: { correct: number; incorrect: number; unanswered: number } }[]; rawCorrect: number };
    expect(summary.skills[0]!.objective).toMatchObject({ correct: 7, incorrect: 2, unanswered: 1 });

    // Idempotent re-submit returns the same stored result.
    const again = await submitAttempt(db, learner, attemptId, CFG);
    expect(again.submittedAt?.getTime()).toBe(done.submittedAt?.getTime());
    expect(again.scoreSummary).toEqual(done.scoreSummary);

    // Keys are released after submission; saving is now rejected.
    const after = await getAttemptView(db, learner, attemptId, CFG);
    expect(Object.keys(after.released.answers)).toHaveLength(10);
    await expect(saveAnswer(db, learner, { attemptId, questionId: questions[9]!.id, response: "A" }, CFG)).rejects.toMatchObject({ code: "closed" });
  });

  it("rejects invalid options and questions from other sections", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "exam");
    const view = await getAttemptView(db, learner, attemptId, CFG);
    const readingQ = view.snapshot.sections[1]!.groups[0]!;
    if (readingQ.kind !== "reading") throw new Error("expected reading");
    await expect(saveAnswer(db, learner, { attemptId, questionId: readingQ.questions[0]!.id, response: "A" }, CFG)).rejects.toMatchObject({ code: "wrong_section" });
    const listenQ = view.snapshot.sections[0]!.groups[0]!;
    if (listenQ.kind !== "listening") throw new Error("expected listening");
    await expect(saveAnswer(db, learner, { attemptId, questionId: listenQ.questions[0]!.id, response: "E" }, CFG)).rejects.toMatchObject({ code: "invalid" });
    await expect(saveAnswer(db, learner, { attemptId, questionId: "not-a-question", response: "A" }, CFG)).rejects.toBeInstanceOf(EngineError);
  });

  it("enforces server-side deadlines: late saves are rejected and the section auto-advances", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "exam");
    // Simulate 41 minutes passing by moving the section deadline into the past.
    await db.update(t.attemptSections).set({ deadlineAt: new Date(Date.now() - 60_000) }).where(and(eq(t.attemptSections.attemptId, attemptId), eq(t.attemptSections.sectionOrder, 0)));
    const view0 = await getAttemptView(db, learner, attemptId, CFG); // lazy expiry happens on read
    expect(view0.attempt.currentSection).toBe(1);
    expect(view0.sections[0]!.submittedAt).not.toBeNull();
    expect(view0.remainingSeconds).toBeGreaterThan(3500); // reading clock starts fresh
    const lq = view0.snapshot.sections[0]!.groups[0]!;
    if (lq.kind !== "listening") throw new Error();
    await expect(saveAnswer(db, learner, { attemptId, questionId: lq.questions[0]!.id, response: "A" }, CFG)).rejects.toMatchObject({ code: "wrong_section" });
    // Exam mode: keys of the closed section are still hidden until the whole attempt ends.
    expect(view0.released.answers).toEqual({});
  });

  it("accepts saves within the grace window but not after it", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "practice-test-reading", "exam");
    const v = await getAttemptView(db, learner, attemptId, CFG);
    const q0 = (v.snapshot.sections[0]!.groups[0] as { questions: { id: string }[] }).questions[0]!;
    await db.update(t.attemptSections).set({ deadlineAt: new Date(Date.now() - 2_000) }).where(eq(t.attemptSections.attemptId, attemptId));
    await expect(saveAnswer(db, learner, { attemptId, questionId: q0.id, response: "A" }, CFG, new Date())).resolves.toBeTruthy();
    await db.update(t.attemptSections).set({ deadlineAt: new Date(Date.now() - 30_000) }).where(eq(t.attemptSections.attemptId, attemptId));
    await expect(saveAnswer(db, learner, { attemptId, questionId: q0.id, response: "B" }, CFG)).rejects.toMatchObject({ code: "expired" });
    const [a] = await db.select().from(t.examAttempts).where(eq(t.examAttempts.id, attemptId));
    expect(a!.status).toBe("submitted");
    expect(a!.completionReason).toBe("time_expired");
  });

  it("advanceSection is idempotent for retried requests", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "practice");
    const r1 = await advanceSection(db, learner, attemptId, 0, CFG);
    const r2 = await advanceSection(db, learner, attemptId, 0, CFG); // duplicate
    expect(r1.currentSection).toBe(1);
    expect(r2.currentSection).toBe(1);
  });

  it("practice mode releases a section's keys after that section, exam mode does not", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "practice");
    expect((await getAttemptView(db, learner, attemptId, CFG)).remainingSeconds).toBeNull(); // untimed
    await advanceSection(db, learner, attemptId, 0, CFG);
    const v = await getAttemptView(db, learner, attemptId, CFG);
    expect(Object.keys(v.released.answers)).toHaveLength(35);
    expect(Object.keys(v.released.transcripts)).toHaveLength(14);
  });
});

describe("authorization boundaries", () => {
  it("another learner cannot read or modify an attempt", async () => {
    const owner = await newLearner(db);
    const intruder = await newLearner(db);
    const { attemptId } = await startAttempt(db, owner, "practice-test-reading", "exam");
    await expect(getAttemptView(db, intruder, attemptId, CFG)).rejects.toMatchObject({ code: "not_found" });
    await expect(submitAttempt(db, intruder, attemptId, CFG)).rejects.toMatchObject({ code: "not_found" });
    await expect(saveAnswer(db, intruder, { attemptId, questionId: "rd-m1-nm-q1", response: "A" }, CFG)).rejects.toMatchObject({ code: "not_found" });
    await expect(getPracticeTranscript(db, intruder, attemptId, "x")).rejects.toMatchObject({ code: "not_found" });
  });

  it("transcripts are protected in exam mode and need one listen in practice mode", async () => {
    const learner = await newLearner(db);
    const exam = await startAttempt(db, learner, "practice-test-listening", "exam");
    await expect(getPracticeTranscript(db, learner, exam.attemptId, "ls-m1-p1-train")).rejects.toMatchObject({ code: "forbidden" });
    const prac = await startAttempt(db, learner, "practice-test-listening", "practice");
    await expect(getPracticeTranscript(db, learner, prac.attemptId, "ls-m1-p1-train")).rejects.toMatchObject({ code: "forbidden" });
    await registerPlay(db, learner, prac.attemptId, "ls-m1-p1-train", 1, CFG);
    const tr = await getPracticeTranscript(db, learner, prac.attemptId, "ls-m1-p1-train");
    expect(tr[0]!.text).toContain("Hai Phong");
  });

  it("limits plays to the configured number in exam mode only", async () => {
    const learner = await newLearner(db);
    const exam = await startAttempt(db, learner, "practice-test-listening", "exam");
    expect((await registerPlay(db, learner, exam.attemptId, "ls-m1-p1-train", 1, CFG)).allowed).toBe(true);
    expect((await registerPlay(db, learner, exam.attemptId, "ls-m1-p1-train", 1, CFG)).allowed).toBe(false);
    const prac = await startAttempt(db, learner, "practice-test-listening", "practice");
    for (let i = 0; i < 3; i++) expect((await registerPlay(db, learner, prac.attemptId, "ls-m1-p1-train", 1, CFG)).allowed).toBe(true);
  });
});

describe("immutability", () => {
  it("editing the bank after an attempt starts does not change that attempt", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "practice-test-reading", "exam");
    const before = await getAttemptView(db, learner, attemptId, CFG);
    await db.update(t.questions).set({ prompt: "EDITED PROMPT" }).where(eq(t.questions.id, "rd-m1-nm-q1"));
    await publishSnapshot(db, "practice-test-reading");
    const after = await getAttemptView(db, learner, attemptId, CFG);
    expect(JSON.stringify(after.snapshot)).toBe(JSON.stringify(before.snapshot));
    // A new attempt by someone else gets the new version.
    const other = await newLearner(db);
    const fresh = await startAttempt(db, other, "practice-test-reading", "exam");
    const fv = await getAttemptView(db, other, fresh.attemptId, CFG);
    expect(JSON.stringify(fv.snapshot)).toContain("EDITED PROMPT");
    expect(fv.snapshot.blueprint.version).toBeGreaterThan(before.snapshot.blueprint.version);
  });
});

describe("practice-mode section selection", () => {
  it("lets a learner go straight to Reading and come back, and refuses this in exam mode", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "practice");
    const jumped = await selectSection(db, learner, attemptId, 1); // Reading first
    expect(jumped.currentSection).toBe(1);
    const v = await getAttemptView(db, learner, attemptId, CFG);
    const rq = v.snapshot.sections[1]!.groups[0]!;
    if (rq.kind !== "reading") throw new Error();
    await saveAnswer(db, learner, { attemptId, questionId: rq.questions[0]!.id, response: "A" }, CFG);
    // Finishing Reading returns to the still-open Listening section, not past it.
    const back = await advanceSection(db, learner, attemptId, 1, CFG);
    expect(back.currentSection).toBe(2); // next open after Reading is Writing
    const back2 = await selectSection(db, learner, attemptId, 0);
    expect(back2.currentSection).toBe(0);
    await expect(selectSection(db, learner, attemptId, 1)).rejects.toMatchObject({ code: "closed" }); // Reading already finished

    const exam = await startAttempt(db, learner, "mock-1", "exam");
    await expect(selectSection(db, learner, exam.attemptId, 1)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("closing another section does not submit an unfinished writing draft", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "practice");
    await selectSection(db, learner, attemptId, 2); // Writing
    await saveWritingDraft(db, learner, { attemptId, promptId: "wr-m1-letter-job", text: "draft text here", wordCount: 3 }, CFG);
    await selectSection(db, learner, attemptId, 1); // switch to Reading, leave writing open
    await advanceSection(db, learner, attemptId, 1, CFG); // finish Reading
    const [w] = await db.select().from(t.writingSubmissions).where(eq(t.writingSubmissions.attemptId, attemptId));
    expect(w!.status).toBe("draft");
  });
});

describe("writing inside a mock", () => {
  it("saves drafts only while the writing section is open and submits them with the attempt", async () => {
    const learner = await newLearner(db);
    const { attemptId } = await startAttempt(db, learner, "mock-1", "practice");
    await expect(saveWritingDraft(db, learner, { attemptId, promptId: "wr-m1-letter-job", text: "x", wordCount: 1 }, CFG)).rejects.toMatchObject({ code: "wrong_section" });
    await advanceSection(db, learner, attemptId, 0, CFG);
    await advanceSection(db, learner, attemptId, 1, CFG);
    await saveWritingDraft(db, learner, { attemptId, promptId: "wr-m1-letter-job", text: "Dear Lan, congratulations", wordCount: 3 }, CFG);
    await saveWritingDraft(db, learner, { attemptId, promptId: "wr-m1-letter-job", text: "Dear Lan, congratulations on the job", wordCount: 6 }, CFG);
    const rows = await db.select().from(t.writingSubmissions).where(eq(t.writingSubmissions.attemptId, attemptId));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("draft");
    await submitAttempt(db, learner, attemptId, CFG);
    const [after] = await db.select().from(t.writingSubmissions).where(eq(t.writingSubmissions.attemptId, attemptId));
    expect(after!.status).toBe("submitted");
  });
});

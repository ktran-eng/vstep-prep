/**
 * Examination engine shared by all four skills.
 *  - The server is authoritative for deadlines (stored per section); the client countdown is cosmetic.
 *  - Expiry is enforced lazily on every read/write, so a closed browser still ends the attempt correctly.
 *  - Start and submit are idempotent (partial unique index + conditional status update).
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "./db/client";
import { attemptAnswers, attemptSections, examAttempts, listeningPlays, speakingSubmissions, writingSubmissions, blueprintSnapshots, testBlueprints } from "./db/schema";
import { latestSnapshot } from "./snapshots";
import { LATE_SAVE_GRACE_MS, computeDeadline, isExpired, remainingSeconds } from "@/domain/timing";
import { estimateObjectiveScore, gradeObjective, overallEstimate, weightedWritingScore, type ObjectiveSummary } from "@/domain/scoring";
import type { ScoringConfig } from "@/domain/spec";
import type { ProtectedSnapshot, PublicSnapshot } from "@/domain/snapshot";

export type Mode = "exam" | "practice";

export class EngineError extends Error {
  constructor(
    public code: "not_found" | "forbidden" | "closed" | "wrong_section" | "invalid" | "expired",
    message: string,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

type Attempt = typeof examAttempts.$inferSelect;

async function loadOwnedAttempt(db: Db, learnerId: string, attemptId: string): Promise<Attempt> {
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) throw new EngineError("not_found", "Attempt not found");
  const [a] = await db.select().from(examAttempts).where(eq(examAttempts.id, attemptId));
  // Same error for "missing" and "someone else's" to avoid leaking existence.
  if (!a || a.learnerId !== learnerId) throw new EngineError("not_found", "Attempt not found");
  return a;
}

async function loadSnapshot(db: Db, snapshotId: string) {
  const [s] = await db.select().from(blueprintSnapshots).where(eq(blueprintSnapshots.id, snapshotId));
  if (!s) throw new EngineError("not_found", "Snapshot missing");
  return { pub: s.publicPayload as PublicSnapshot, prot: s.protectedPayload as ProtectedSnapshot };
}

export async function startAttempt(db: Db, learnerId: string, blueprintId: string, mode: Mode, now = new Date()) {
  const [bp] = await db.select().from(testBlueprints).where(eq(testBlueprints.id, blueprintId));
  if (!bp || bp.status !== "published") throw new EngineError("not_found", "Test not available");

  const existing = await findActive(db, learnerId, blueprintId, mode);
  if (existing) return { attemptId: existing.id, resumed: true };

  const snap = await latestSnapshot(db, blueprintId);
  if (!snap) throw new EngineError("not_found", "Test has no published snapshot");
  const pub = snap.publicPayload as PublicSnapshot;

  try {
    const [created] = await db
      .insert(examAttempts)
      .values({ learnerId, blueprintId, snapshotId: snap.id, blueprintVersion: snap.blueprintVersion, mode, startedAt: now })
      .returning();
    const attempt = created!;
    await db.insert(attemptSections).values(
      pub.sections.map((s, i) => ({
        attemptId: attempt.id,
        sectionOrder: s.order,
        skill: s.skill,
        startedAt: i === 0 ? now : null,
        deadlineAt: i === 0 && mode === "exam" ? computeDeadline(now, s.timeLimitSeconds) : null,
      })),
    );
    return { attemptId: attempt.id, resumed: false };
  } catch (err) {
    // Concurrent start: the partial unique index rejected the duplicate — return the winner.
    const winner = await findActive(db, learnerId, blueprintId, mode);
    if (winner) return { attemptId: winner.id, resumed: true };
    throw err;
  }
}

async function findActive(db: Db, learnerId: string, blueprintId: string, mode: Mode) {
  const [a] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.learnerId, learnerId), eq(examAttempts.blueprintId, blueprintId), eq(examAttempts.mode, mode), eq(examAttempts.status, "in_progress")));
  return a ?? null;
}

/** Closes expired sections and, if the last section expired, finalises the attempt. Returns the fresh attempt row. */
async function enforceDeadlines(db: Db, attempt: Attempt, cfg: ScoringConfig, now: Date): Promise<Attempt> {
  if (attempt.status !== "in_progress" || attempt.mode !== "exam") return attempt;
  let current = attempt;
  // Loop because a long absence can expire several sections in a row... but sections after the current one
  // have not started, so their clocks only start when reached. Only the current section can expire.
  const [sec] = await db
    .select()
    .from(attemptSections)
    .where(and(eq(attemptSections.attemptId, current.id), eq(attemptSections.sectionOrder, current.currentSection)));
  if (sec?.deadlineAt && isExpired(sec.deadlineAt, now)) {
    current = await closeSection(db, current, "time_expired", cfg, sec.deadlineAt);
  }
  return current;
}

async function closeSection(db: Db, attempt: Attempt, reason: "learner_advanced" | "time_expired" | "learner_submitted", cfg: ScoringConfig, at: Date): Promise<Attempt> {
  const sections = await db.select().from(attemptSections).where(eq(attemptSections.attemptId, attempt.id)).orderBy(asc(attemptSections.sectionOrder));
  const cur = sections.find((s) => s.sectionOrder === attempt.currentSection);
  if (!cur) throw new EngineError("invalid", "Section missing");
  // Conditional update guards against double-advance races.
  const closed = await db
    .update(attemptSections)
    .set({ submittedAt: at, completionReason: reason })
    .where(and(eq(attemptSections.attemptId, attempt.id), eq(attemptSections.sectionOrder, cur.sectionOrder), sql`${attemptSections.submittedAt} is null`))
    .returning();
  if (closed.length === 0) {
    const [fresh] = await db.select().from(examAttempts).where(eq(examAttempts.id, attempt.id));
    return fresh!;
  }
  await db
    .update(writingSubmissions)
    .set({ status: "submitted", submittedAt: at, updatedAt: at })
    .where(and(eq(writingSubmissions.attemptId, attempt.id), eq(writingSubmissions.status, "draft")));

  const next = sections.find((s) => s.sectionOrder > cur.sectionOrder);
  if (next && reason !== "learner_submitted") {
    const { pub } = await loadSnapshot(db, attempt.snapshotId);
    const nextPub = pub.sections.find((s) => s.order === next.sectionOrder)!;
    // The next section's clock starts now (not at the old deadline): the learner sees a fresh full limit.
    const startAt = new Date(Math.max(at.getTime(), Date.now()));
    await db
      .update(attemptSections)
      .set({ startedAt: startAt, deadlineAt: attempt.mode === "exam" ? computeDeadline(startAt, nextPub.timeLimitSeconds) : null })
      .where(and(eq(attemptSections.attemptId, attempt.id), eq(attemptSections.sectionOrder, next.sectionOrder)));
    const [updated] = await db
      .update(examAttempts)
      .set({ currentSection: next.sectionOrder, updatedAt: new Date() })
      .where(eq(examAttempts.id, attempt.id))
      .returning();
    return updated!;
  }
  // Last section closed (or explicit submit): finalise the attempt.
  return finalizeAttempt(db, attempt, reason === "time_expired" ? "time_expired" : "learner_submitted", cfg, at);
}

async function finalizeAttempt(db: Db, attempt: Attempt, reason: "time_expired" | "learner_submitted", cfg: ScoringConfig, at: Date): Promise<Attempt> {
  // Only the first finaliser wins; duplicates fall through to the stored result.
  const won = await db
    .update(examAttempts)
    .set({ status: "submitted", submittedAt: at, completionReason: reason, updatedAt: new Date(), scoringConfigVersion: cfg.version })
    .where(and(eq(examAttempts.id, attempt.id), eq(examAttempts.status, "in_progress")))
    .returning();
  if (won.length === 0) {
    const [fresh] = await db.select().from(examAttempts).where(eq(examAttempts.id, attempt.id));
    return fresh!;
  }
  await db.update(attemptSections).set({ submittedAt: at, completionReason: reason }).where(and(eq(attemptSections.attemptId, attempt.id), sql`${attemptSections.submittedAt} is null`));
  await db
    .update(writingSubmissions)
    .set({ status: "submitted", submittedAt: at, updatedAt: at })
    .where(and(eq(writingSubmissions.attemptId, attempt.id), eq(writingSubmissions.status, "draft")));
  await gradeAttemptObjective(db, won[0]!);
  return recomputeSummary(db, attempt.id, cfg);
}

async function gradeAttemptObjective(db: Db, attempt: Attempt) {
  const { pub, prot } = await loadSnapshot(db, attempt.snapshotId);
  const answers = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attempt.id));
  const now = new Date();
  for (const sec of pub.sections) {
    for (const g of sec.groups) {
      if (g.kind !== "reading" && g.kind !== "listening") continue;
      for (const q of g.questions) {
        const key = prot.answers[q.id];
        const a = answers.find((x) => x.questionId === q.id);
        const correct = Boolean(a?.response && key && a.response === key.answer);
        await db
          .insert(attemptAnswers)
          .values({ attemptId: attempt.id, questionId: q.id, sectionOrder: sec.order, response: a?.response ?? null, isCorrect: correct, score: correct ? 1 : 0, gradedAt: now })
          .onConflictDoUpdate({ target: [attemptAnswers.attemptId, attemptAnswers.questionId], set: { isCorrect: correct, score: correct ? 1 : 0, gradedAt: now } });
      }
    }
  }
}

export type SkillResult = {
  skill: string;
  objective?: ObjectiveSummary;
  estimate: number | null; // 0-10 practice estimate (null = not available yet)
  status: "graded" | "pending" | "unavailable" | "not_attempted";
  detail?: string;
};

export type ScoreSummary = {
  skills: SkillResult[];
  overall: { average: number; level: string; vstepLevel: string } | null;
  rawCorrect: number;
  rawTotal: number;
  timeSeconds: number;
  scoringConfigVersion: string;
  official: false;
};

/** (Re)computes the score summary, e.g. after asynchronous Writing/Speaking grading completes. */
export async function recomputeSummary(db: Db, attemptId: string, cfg: ScoringConfig): Promise<Attempt> {
  const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, attemptId));
  if (!attempt) throw new EngineError("not_found", "Attempt not found");
  const { pub, prot } = await loadSnapshot(db, attempt.snapshotId);
  const answers = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
  const writing = await db.select().from(writingSubmissions).where(eq(writingSubmissions.attemptId, attemptId));
  const speaking = await db.select().from(speakingSubmissions).where(eq(speakingSubmissions.attemptId, attemptId));

  const skills: SkillResult[] = [];
  let rawCorrect = 0;
  let rawTotal = 0;
  for (const sec of pub.sections) {
    if (sec.skill === "reading" || sec.skill === "listening") {
      const items = sec.groups.flatMap((g) =>
        g.kind === "reading" || g.kind === "listening"
          ? g.questions.map((q) => ({
              questionId: q.id,
              type: q.type,
              difficulty: q.difficulty,
              response: answers.find((a) => a.questionId === q.id)?.response ?? null,
              correctAnswer: prot.answers[q.id]?.answer ?? "",
            }))
          : [],
      );
      const obj = gradeObjective(items);
      rawCorrect += obj.correct;
      rawTotal += obj.total;
      skills.push({ skill: sec.skill, objective: obj, estimate: estimateObjectiveScore(obj.accuracy, cfg), status: "graded" });
    } else if (sec.skill === "writing") {
      const scores: Record<string, number | null> = {};
      let status: SkillResult["status"] = "graded";
      for (const g of sec.groups) {
        if (g.kind !== "writing") continue;
        const sub = writing.find((w) => w.promptId === g.id);
        if (!sub || sub.wordCount === 0) scores[g.task] = 0;
        else if (sub.gradingStatus === "graded" && sub.overallScore != null) scores[g.task] = sub.overallScore;
        else {
          scores[g.task] = null;
          status = sub.gradingStatus === "unavailable" || sub.gradingStatus === "failed" ? "unavailable" : "pending";
        }
      }
      const est = status === "graded" ? weightedWritingScore(scores.letter ?? 0, scores.essay ?? 0, cfg) : null;
      skills.push({ skill: "writing", estimate: est, status });
    } else {
      const parts = sec.groups.filter((g) => g.kind === "speaking");
      const subs = parts.map((g) => speaking.find((s) => s.promptId === g.id));
      let status: SkillResult["status"] = "graded";
      if (subs.every((s) => !s)) status = "not_attempted";
      else if (subs.some((s) => s && s.gradingStatus !== "graded")) status = subs.some((s) => s && (s.gradingStatus === "unavailable" || s.gradingStatus === "failed")) ? "unavailable" : "pending";
      const vals = subs.map((s) => (s ? (s.overallScore ?? null) : 0));
      const est = status === "graded" && vals.every((v) => v != null) ? Math.round(((vals as number[]).reduce((a, b) => a + b, 0) / vals.length) * 2) / 2 : null;
      skills.push({ skill: "speaking", estimate: est, status, detail: status === "not_attempted" ? "No recordings submitted" : undefined });
    }
  }
  const scoreOf = (s: string) => skills.find((x) => x.skill === s)?.estimate ?? null;
  const overall =
    pub.blueprint.kind === "mock"
      ? overallEstimate({ listening: scoreOf("listening"), reading: scoreOf("reading"), writing: scoreOf("writing"), speaking: scoreOf("speaking") }, cfg)
      : null;
  const end = attempt.submittedAt ?? new Date();
  const summary: ScoreSummary = {
    skills,
    overall: overall ? { average: overall.average, level: overall.band.level, vstepLevel: overall.band.vstepLevel } : null,
    rawCorrect,
    rawTotal,
    timeSeconds: Math.round((end.getTime() - attempt.startedAt.getTime()) / 1000),
    scoringConfigVersion: cfg.version,
    official: false,
  };
  const [updated] = await db
    .update(examAttempts)
    .set({ scoreSummary: summary, totalTimeSeconds: summary.timeSeconds, updatedAt: new Date() })
    .where(eq(examAttempts.id, attemptId))
    .returning();
  return updated!;
}

/** Everything the attempt UI needs. Protected material is included only when the release policy allows. */
export async function getAttemptView(db: Db, learnerId: string, attemptId: string, cfg: ScoringConfig, now = new Date()) {
  let attempt = await loadOwnedAttempt(db, learnerId, attemptId);
  attempt = await enforceDeadlines(db, attempt, cfg, now);
  const { pub, prot } = await loadSnapshot(db, attempt.snapshotId);
  const sections = await db.select().from(attemptSections).where(eq(attemptSections.attemptId, attempt.id)).orderBy(asc(attemptSections.sectionOrder));
  const answers = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attempt.id));
  const writing = await db.select().from(writingSubmissions).where(eq(writingSubmissions.attemptId, attempt.id));
  const speaking = await db.select({ id: speakingSubmissions.id, promptId: speakingSubmissions.promptId, gradingStatus: speakingSubmissions.gradingStatus, durationSeconds: speakingSubmissions.durationSeconds }).from(speakingSubmissions).where(eq(speakingSubmissions.attemptId, attempt.id));
  const plays = await db.select().from(listeningPlays).where(eq(listeningPlays.attemptId, attempt.id));

  const finished = attempt.status !== "in_progress";
  // Release policy: exam → everything after the whole attempt ends. Practice → a section's keys after that section is submitted.
  const releasedSections = new Set(sections.filter((s) => finished || (attempt.mode === "practice" && s.submittedAt)).map((s) => s.sectionOrder));
  const released = filterProtected(pub, prot, releasedSections);
  const cur = sections.find((s) => s.sectionOrder === attempt.currentSection);
  return {
    attempt: {
      id: attempt.id,
      mode: attempt.mode as Mode,
      status: attempt.status,
      currentSection: attempt.currentSection,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      completionReason: attempt.completionReason,
      scoreSummary: (attempt.scoreSummary as ScoreSummary | null) ?? null,
    },
    serverNow: now.toISOString(),
    remainingSeconds: finished ? 0 : remainingSeconds(cur?.deadlineAt ?? null, now),
    sections: sections.map((s) => ({ order: s.sectionOrder, skill: s.skill, startedAt: s.startedAt?.toISOString() ?? null, deadlineAt: s.deadlineAt?.toISOString() ?? null, submittedAt: s.submittedAt?.toISOString() ?? null })),
    snapshot: pub,
    answers: Object.fromEntries(answers.map((a) => [a.questionId, { response: a.response, marked: a.markedForReview, isCorrect: releasedSections.has(a.sectionOrder) ? a.isCorrect : null }])),
    writing: Object.fromEntries(writing.map((w) => [w.promptId, { id: w.id, text: w.responseText, wordCount: w.wordCount, status: w.status, gradingStatus: w.gradingStatus, overallScore: w.overallScore }])),
    speaking: Object.fromEntries(speaking.map((s) => [s.promptId, s])),
    plays: Object.fromEntries(plays.map((p) => [p.audioAssetId, p.plays])),
    released,
  };
}
export type AttemptView = Awaited<ReturnType<typeof getAttemptView>>;

function filterProtected(pub: PublicSnapshot, prot: ProtectedSnapshot, releasedSections: Set<number>): ProtectedSnapshot {
  const out: ProtectedSnapshot = { answers: {}, transcripts: {}, writingSamples: {}, speakingModels: {} };
  for (const s of pub.sections) {
    if (!releasedSections.has(s.order)) continue;
    for (const g of s.groups) {
      if (g.kind === "reading" || g.kind === "listening") for (const q of g.questions) if (prot.answers[q.id]) out.answers[q.id] = prot.answers[q.id]!;
      if (g.kind === "listening" && prot.transcripts[g.id]) out.transcripts[g.id] = prot.transcripts[g.id]!;
      if (g.kind === "writing" && prot.writingSamples[g.id]) out.writingSamples[g.id] = prot.writingSamples[g.id]!;
      if (g.kind === "speaking" && prot.speakingModels[g.id]) out.speakingModels[g.id] = prot.speakingModels[g.id]!;
    }
  }
  return out;
}

async function requireWritable(db: Db, learnerId: string, attemptId: string, cfg: ScoringConfig, now: Date) {
  let attempt = await loadOwnedAttempt(db, learnerId, attemptId);
  if (attempt.status !== "in_progress") throw new EngineError("closed", "This attempt has already been submitted.");
  // Late saves within the grace window are accepted for the section that just expired.
  if (attempt.mode === "exam") {
    const [sec] = await db.select().from(attemptSections).where(and(eq(attemptSections.attemptId, attempt.id), eq(attemptSections.sectionOrder, attempt.currentSection)));
    if (sec?.deadlineAt && isExpired(sec.deadlineAt, now, LATE_SAVE_GRACE_MS)) {
      attempt = await enforceDeadlines(db, attempt, cfg, now);
      throw new EngineError("expired", "Time is up for this section.");
    }
  }
  return attempt;
}

function sectionOfQuestion(pub: PublicSnapshot, questionId: string) {
  for (const s of pub.sections)
    for (const g of s.groups)
      if ((g.kind === "reading" || g.kind === "listening") && g.questions.some((q) => q.id === questionId)) return { section: s, group: g, question: g.questions.find((q) => q.id === questionId)! };
  return null;
}

export async function saveAnswer(
  db: Db,
  learnerId: string,
  input: { attemptId: string; questionId: string; response: string | null; marked?: boolean; timeSpentDelta?: number },
  cfg: ScoringConfig,
  now = new Date(),
) {
  const attempt = await requireWritable(db, learnerId, input.attemptId, cfg, now);
  const { pub } = await loadSnapshot(db, attempt.snapshotId);
  const loc = sectionOfQuestion(pub, input.questionId);
  if (!loc) throw new EngineError("invalid", "Unknown question");
  if (loc.section.order !== attempt.currentSection) throw new EngineError("wrong_section", "That section is closed.");
  if (input.response != null && !loc.question.options.some((o) => o.key === input.response)) throw new EngineError("invalid", "Invalid option");
  const delta = Math.max(0, Math.min(600, Math.round(input.timeSpentDelta ?? 0)));
  await db
    .insert(attemptAnswers)
    .values({ attemptId: attempt.id, questionId: input.questionId, sectionOrder: loc.section.order, response: input.response, markedForReview: input.marked ?? false, timeSpentSeconds: delta, savedAt: now })
    .onConflictDoUpdate({
      target: [attemptAnswers.attemptId, attemptAnswers.questionId],
      set: {
        response: input.response,
        ...(input.marked === undefined ? {} : { markedForReview: input.marked }),
        timeSpentSeconds: sql`${attemptAnswers.timeSpentSeconds} + ${delta}`,
        savedAt: now,
      },
    });
  return { savedAt: now.toISOString() };
}

export async function toggleMark(db: Db, learnerId: string, attemptId: string, questionId: string, marked: boolean, cfg: ScoringConfig) {
  const attempt = await requireWritable(db, learnerId, attemptId, cfg, new Date());
  const { pub } = await loadSnapshot(db, attempt.snapshotId);
  const loc = sectionOfQuestion(pub, questionId);
  if (!loc || loc.section.order !== attempt.currentSection) throw new EngineError("wrong_section", "That section is closed.");
  await db
    .insert(attemptAnswers)
    .values({ attemptId, questionId, sectionOrder: loc.section.order, response: null, markedForReview: marked })
    .onConflictDoUpdate({ target: [attemptAnswers.attemptId, attemptAnswers.questionId], set: { markedForReview: marked } });
}

export async function saveWritingDraft(db: Db, learnerId: string, input: { attemptId: string; promptId: string; text: string; wordCount: number; timeSpentDelta?: number }, cfg: ScoringConfig) {
  const now = new Date();
  const attempt = await requireWritable(db, learnerId, input.attemptId, cfg, now);
  const { pub } = await loadSnapshot(db, attempt.snapshotId);
  const sec = pub.sections.find((s) => s.groups.some((g) => g.kind === "writing" && g.id === input.promptId));
  if (!sec) throw new EngineError("invalid", "Unknown prompt");
  if (sec.order !== attempt.currentSection) throw new EngineError("wrong_section", "That section is closed.");
  const delta = Math.max(0, Math.min(600, Math.round(input.timeSpentDelta ?? 0)));
  await db
    .insert(writingSubmissions)
    .values({ learnerId, attemptId: attempt.id, promptId: input.promptId, responseText: input.text, wordCount: input.wordCount, timeSpentSeconds: delta })
    .onConflictDoUpdate({
      target: [writingSubmissions.attemptId, writingSubmissions.promptId],
      targetWhere: sql`attempt_id is not null`,
      set: { responseText: input.text, wordCount: input.wordCount, updatedAt: now, timeSpentSeconds: sql`${writingSubmissions.timeSpentSeconds} + ${delta}` },
    });
  return { savedAt: now.toISOString() };
}

/** Verifies that a speaking prompt belongs to the attempt's open section; returns the attempt mode. */
export async function assertSpeakingWritable(db: Db, learnerId: string, attemptId: string, promptId: string, cfg: ScoringConfig) {
  const attempt = await requireWritable(db, learnerId, attemptId, cfg, new Date());
  const { pub } = await loadSnapshot(db, attempt.snapshotId);
  const sec = pub.sections.find((s) => s.groups.some((g) => g.kind === "speaking" && g.id === promptId));
  if (!sec) throw new EngineError("invalid", "Unknown prompt");
  if (sec.order !== attempt.currentSection) throw new EngineError("wrong_section", "That section is closed.");
  return attempt.mode as Mode;
}

/** Learner finishes the current section and moves to the next (or finalises after the last). */
export async function advanceSection(db: Db, learnerId: string, attemptId: string, expectedSection: number, cfg: ScoringConfig) {
  const now = new Date();
  const attempt = await loadOwnedAttempt(db, learnerId, attemptId);
  if (attempt.status !== "in_progress") return attempt;
  // Idempotency: a retried request for a section that was already advanced is a no-op.
  if (attempt.currentSection !== expectedSection) return attempt;
  return closeSection(db, attempt, "learner_advanced", cfg, now);
}

/** Final submission. Idempotent: repeated calls return the stored result. */
export async function submitAttempt(db: Db, learnerId: string, attemptId: string, cfg: ScoringConfig) {
  const attempt = await loadOwnedAttempt(db, learnerId, attemptId);
  if (attempt.status !== "in_progress") return attempt;
  return finalizeAttempt(db, attempt, "learner_submitted", cfg, new Date());
}

/** Records a listening play; enforces the strict-mode play limit server-side. */
export async function registerPlay(db: Db, learnerId: string, attemptId: string, audioId: string, maxPlays: number, cfg: ScoringConfig) {
  const attempt = await requireWritable(db, learnerId, attemptId, cfg, new Date());
  const { pub } = await loadSnapshot(db, attempt.snapshotId);
  const sec = pub.sections.find((s) => s.groups.some((g) => g.kind === "listening" && g.id === audioId));
  if (!sec || sec.order !== attempt.currentSection) throw new EngineError("wrong_section", "That section is closed.");
  const [row] = await db
    .insert(listeningPlays)
    .values({ attemptId, audioAssetId: audioId, plays: 1 })
    .onConflictDoUpdate({ target: [listeningPlays.attemptId, listeningPlays.audioAssetId], set: { plays: sql`${listeningPlays.plays} + 1`, updatedAt: new Date() } })
    .returning();
  const plays = row!.plays;
  if (attempt.mode === "exam" && plays > maxPlays) return { allowed: false, plays: maxPlays };
  return { allowed: true, plays };
}

/** Practice-mode transcript access during the attempt (never in exam mode before the attempt ends). */
export async function getPracticeTranscript(db: Db, learnerId: string, attemptId: string, audioId: string) {
  const attempt = await loadOwnedAttempt(db, learnerId, attemptId);
  if (attempt.mode !== "practice" && attempt.status === "in_progress") throw new EngineError("forbidden", "Transcripts are released after the exam.");
  const [p] = await db.select().from(listeningPlays).where(and(eq(listeningPlays.attemptId, attemptId), eq(listeningPlays.audioAssetId, audioId)));
  if (attempt.status === "in_progress" && (!p || p.plays < 1)) throw new EngineError("forbidden", "Listen to the recording at least once first.");
  const { prot } = await loadSnapshot(db, attempt.snapshotId);
  const t = prot.transcripts[audioId];
  if (!t) throw new EngineError("not_found", "Transcript not found");
  return t;
}

export async function listAttempts(db: Db, learnerId: string) {
  return db
    .select({
      id: examAttempts.id,
      blueprintId: examAttempts.blueprintId,
      name: testBlueprints.name,
      kind: testBlueprints.kind,
      skill: testBlueprints.skill,
      mode: examAttempts.mode,
      status: examAttempts.status,
      startedAt: examAttempts.startedAt,
      submittedAt: examAttempts.submittedAt,
      scoreSummary: examAttempts.scoreSummary,
      totalTimeSeconds: examAttempts.totalTimeSeconds,
    })
    .from(examAttempts)
    .innerJoin(testBlueprints, eq(testBlueprints.id, examAttempts.blueprintId))
    .where(eq(examAttempts.learnerId, learnerId))
    .orderBy(sql`${examAttempts.startedAt} desc`);
}

export async function attemptIdsForLearner(db: Db, learnerId: string, ids: string[]) {
  if (!ids.length) return [];
  return db.select({ id: examAttempts.id }).from(examAttempts).where(and(eq(examAttempts.learnerId, learnerId), inArray(examAttempts.id, ids)));
}

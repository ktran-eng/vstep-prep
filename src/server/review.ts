import { and, desc, eq, inArray, ne } from "drizzle-orm";
import type { Db } from "./db/client";
import { attemptAnswers, blueprintSnapshots, examAttempts, mistakeBookmarks, testBlueprints } from "./db/schema";
import type { ProtectedSnapshot, PublicQuestion, PublicSnapshot } from "@/domain/snapshot";

export type ReviewItem = {
  questionId: string;
  attemptId: string;
  testName: string;
  skill: "reading" | "listening";
  groupTitle: string;
  question: PublicQuestion;
  response: string | null;
  answer: string;
  explanation: string;
  evidenceQuote: string;
  context: string | null; // paragraph or transcript segment containing the evidence
  bookmark: { id: string; note: string | null; reviewStatus: string } | null;
  at: Date;
};

/**
 * Error notebook: incorrect/unanswered questions from the learner's finished attempts, plus explicit bookmarks.
 * Only material from finished attempts is used, so answer keys are never exposed early.
 */
export async function getReviewItems(db: Db, learnerId: string, opts: { skill?: string; status?: string } = {}) {
  const attempts = await db
    .select({ id: examAttempts.id, snapshotId: examAttempts.snapshotId, at: examAttempts.submittedAt, name: testBlueprints.name })
    .from(examAttempts)
    .innerJoin(testBlueprints, eq(testBlueprints.id, examAttempts.blueprintId))
    .where(and(eq(examAttempts.learnerId, learnerId), ne(examAttempts.status, "in_progress")))
    .orderBy(desc(examAttempts.submittedAt))
    .limit(30);
  if (!attempts.length) return [];
  const ids = attempts.map((a) => a.id);
  const [wrong, bookmarks, snaps] = await Promise.all([
    db.select().from(attemptAnswers).where(and(inArray(attemptAnswers.attemptId, ids), eq(attemptAnswers.isCorrect, false))),
    db.select().from(mistakeBookmarks).where(eq(mistakeBookmarks.learnerId, learnerId)),
    db
      .select({ id: blueprintSnapshots.id, publicPayload: blueprintSnapshots.publicPayload, protectedPayload: blueprintSnapshots.protectedPayload })
      .from(blueprintSnapshots)
      .where(inArray(blueprintSnapshots.id, [...new Set(attempts.map((a) => a.snapshotId))])),
  ]);

  const seen = new Set<string>();
  const items: ReviewItem[] = [];
  for (const att of attempts) {
    const snap = snaps.find((s) => s.id === att.snapshotId);
    if (!snap) continue;
    const pub = snap.publicPayload as PublicSnapshot;
    const prot = snap.protectedPayload as ProtectedSnapshot;
    const bookmarkedHere = bookmarks.filter((b) => b.attemptId === att.id).map((b) => b.questionId);
    const qids = new Set([...wrong.filter((w) => w.attemptId === att.id).map((w) => w.questionId), ...bookmarkedHere]);
    for (const sec of pub.sections)
      for (const g of sec.groups) {
        if (g.kind !== "reading" && g.kind !== "listening") continue;
        for (const q of g.questions) {
          if (!qids.has(q.id) || seen.has(q.id)) continue;
          const key = prot.answers[q.id];
          if (!key) continue;
          seen.add(q.id);
          const units = g.kind === "reading" ? g.paragraphs.map((p, i) => [`P${i + 1}`, p] as const) : (prot.transcripts[g.id] ?? []).map((s) => [s.id, `${s.speaker}: ${s.text}`] as const);
          const b = bookmarks.find((x) => x.questionId === q.id);
          items.push({
            questionId: q.id,
            attemptId: att.id,
            testName: att.name,
            skill: g.kind,
            groupTitle: g.title,
            question: q,
            response: wrong.find((w) => w.attemptId === att.id && w.questionId === q.id)?.response ?? null,
            answer: key.answer,
            explanation: key.explanation,
            evidenceQuote: key.evidence.quote,
            context: units.find(([id]) => id === key.evidence.ref)?.[1] ?? null,
            bookmark: b ? { id: b.id, note: b.note, reviewStatus: b.reviewStatus } : null,
            at: att.at ?? new Date(),
          });
        }
      }
  }
  return items.filter((i) => (!opts.skill || i.skill === opts.skill) && (!opts.status || (opts.status === "reviewed" ? i.bookmark?.reviewStatus === "reviewed" : i.bookmark?.reviewStatus !== "reviewed")));
}

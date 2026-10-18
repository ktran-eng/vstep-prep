import { and, asc, eq } from "drizzle-orm";
import type { Db } from "./db/client";
import { examAttempts, learnerPreferences, speakingSubmissions, testBlueprints, writingSubmissions } from "./db/schema";
import type { ScoreSummary } from "./exam-engine";
import { buildRecommendations, type TypeStat } from "@/domain/recommendations";

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** All numbers derive from the learner's persisted records; nothing is cached or fabricated. */
export async function getDashboard(db: Db, learnerId: string) {
  const attempts = await db
    .select({
      id: examAttempts.id,
      startedAt: examAttempts.startedAt,
      submittedAt: examAttempts.submittedAt,
      status: examAttempts.status,
      mode: examAttempts.mode,
      totalTimeSeconds: examAttempts.totalTimeSeconds,
      summary: examAttempts.scoreSummary,
      kind: testBlueprints.kind,
      skill: testBlueprints.skill,
      name: testBlueprints.name,
    })
    .from(examAttempts)
    .innerJoin(testBlueprints, eq(testBlueprints.id, examAttempts.blueprintId))
    .where(eq(examAttempts.learnerId, learnerId))
    .orderBy(asc(examAttempts.startedAt));
  const writing = await db.select().from(writingSubmissions).where(and(eq(writingSubmissions.learnerId, learnerId), eq(writingSubmissions.status, "submitted"))).orderBy(asc(writingSubmissions.submittedAt));
  const speaking = await db.select().from(speakingSubmissions).where(eq(speakingSubmissions.learnerId, learnerId)).orderBy(asc(speakingSubmissions.submittedAt));
  const [prefs] = await db.select().from(learnerPreferences).where(eq(learnerPreferences.learnerId, learnerId));

  const done = attempts.filter((a) => a.status !== "in_progress" && a.summary);
  const trend: { date: string; skill: string; score: number; label: string }[] = [];
  const typeMap = new Map<string, TypeStat>();
  const skillAttempts: Record<string, number> = {};
  for (const a of done) {
    const s = a.summary as ScoreSummary;
    for (const sk of s.skills) {
      if (sk.status === "not_attempted") continue;
      skillAttempts[sk.skill] = (skillAttempts[sk.skill] ?? 0) + 1;
      if (sk.estimate != null) trend.push({ date: (a.submittedAt ?? a.startedAt).toISOString(), skill: sk.skill, score: sk.estimate, label: a.name });
      if (sk.objective)
        for (const [type, v] of Object.entries(sk.objective.byType)) {
          const k = `${sk.skill}:${type}`;
          const cur = typeMap.get(k) ?? { skill: sk.skill as "reading" | "listening", type, total: 0, correct: 0 };
          cur.total += v.total;
          cur.correct += v.correct;
          typeMap.set(k, cur);
        }
    }
  }
  // Standalone writing/speaking practice also counts towards trends.
  for (const w of writing) {
    if (!w.attemptId) skillAttempts.writing = (skillAttempts.writing ?? 0) + 1;
    if (!w.attemptId && w.overallScore != null) trend.push({ date: (w.gradedAt ?? w.submittedAt ?? w.startedAt).toISOString(), skill: "writing", score: w.overallScore, label: "Writing practice" });
  }
  for (const sp of speaking) {
    if (!sp.attemptId && sp.overallScore != null) trend.push({ date: (sp.gradedAt ?? sp.submittedAt).toISOString(), skill: "speaking", score: sp.overallScore, label: "Speaking practice" });
  }
  trend.sort((a, b) => a.date.localeCompare(b.date));

  const writingCriteria: Record<string, { avg: number; n: number }> = {};
  for (const w of writing) {
    const scores = w.rubricScores as Record<string, number> | null;
    if (!scores) continue;
    for (const [k, v] of Object.entries(scores)) {
      const c = (writingCriteria[k] ??= { avg: 0, n: 0 });
      c.avg = (c.avg * c.n + v) / (c.n + 1);
      c.n++;
    }
  }
  const speakingCriteria: Record<string, { avg: number; n: number }> = {};
  for (const s of speaking) {
    const scores = s.rubricScores as Record<string, number> | null;
    if (!scores) continue;
    for (const [k, v] of Object.entries(scores)) {
      const c = (speakingCriteria[k] ??= { avg: 0, n: 0 });
      c.avg = (c.avg * c.n + v) / (c.n + 1);
      c.n++;
    }
  }

  const studySeconds =
    done.reduce((n, a) => n + (a.totalTimeSeconds ?? 0), 0) +
    writing.filter((w) => !w.attemptId).reduce((n, w) => n + w.timeSpentSeconds, 0) +
    speaking.filter((s) => !s.attemptId).reduce((n, s) => n + (s.durationSeconds ?? 0), 0);

  // Weekly activity for the last 8 weeks.
  const weeks: { week: string; sessions: number; minutes: number }[] = [];
  const monday = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x.toISOString().slice(0, 10);
  };
  const thisWeek = new Date(monday(new Date()));
  for (let i = 7; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    weeks.push({ week: d.toISOString().slice(0, 10), sessions: 0, minutes: 0 });
  }
  const bump = (date: Date, seconds: number) => {
    const w = weeks.find((x) => x.week === monday(date));
    if (w) {
      w.sessions++;
      w.minutes += Math.round(seconds / 60);
    }
  };
  done.forEach((a) => bump(a.submittedAt ?? a.startedAt, a.totalTimeSeconds ?? 0));
  writing.filter((w) => !w.attemptId).forEach((w) => bump(w.submittedAt ?? w.startedAt, w.timeSpentSeconds));
  speaking.filter((s) => !s.attemptId).forEach((s) => bump(s.submittedAt, s.durationSeconds ?? 0));

  const latestBySkill: Record<string, { score: number; date: string; n: number; avgPrev: number | null }> = {};
  for (const skill of ["listening", "reading", "writing", "speaking"]) {
    const pts = trend.filter((p) => p.skill === skill);
    if (!pts.length) continue;
    const last = pts[pts.length - 1]!;
    const prev = pts.slice(0, -1);
    latestBySkill[skill] = { score: last.score, date: last.date, n: pts.length, avgPrev: prev.length ? prev.reduce((n, p) => n + p.score, 0) / prev.length : null };
  }

  const graded = speaking.filter((s) => s.durationSeconds != null);
  return {
    targetLevel: prefs?.targetLevel ?? "B1",
    targetExamDate: prefs?.targetExamDate ?? null,
    counts: {
      sessions: done.length + writing.filter((w) => !w.attemptId).length + speaking.filter((s) => !s.attemptId).length,
      mocks: done.filter((a) => a.kind === "mock").length,
      inProgress: attempts.filter((a) => a.status === "in_progress").map((a) => ({ id: a.id, name: a.name, mode: a.mode })),
      studyMinutes: Math.round(studySeconds / 60),
    },
    trend,
    latestBySkill,
    typeStats: [...typeMap.values()].sort((a, b) => a.skill.localeCompare(b.skill) || a.type.localeCompare(b.type)),
    writingCriteria,
    speakingCriteria,
    weeks,
    recent: done.slice(-5).reverse().map((a) => ({ id: a.id, name: a.name, date: (a.submittedAt ?? a.startedAt).toISOString(), summary: a.summary as ScoreSummary, mode: a.mode })),
    recommendations: buildRecommendations({
      typeStats: [...typeMap.values()],
      writingCriteria,
      speakingCount: speaking.length,
      speakingAvgSeconds: graded.length ? graded.reduce((n, s) => n + (s.durationSeconds ?? 0), 0) / graded.length : null,
      skillAttempts,
      targetLevel: prefs?.targetLevel ?? "B1",
    }),
  };
}

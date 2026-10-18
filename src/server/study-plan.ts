import { and, asc, eq, gte } from "drizzle-orm";
import type { Db } from "./db/client";
import { examAttempts, learnerPreferences, speakingSubmissions, studyPlanTasks, testBlueprints, writingSubmissions } from "./db/schema";
import { getDashboard } from "./analytics";
import { generateWeeklyPlan, weekStartOf } from "@/domain/study-plan";

const today = () => new Date().toISOString().slice(0, 10);

export async function regenerateWeeklyPlan(db: Db, learnerId: string) {
  const [prefs] = await db.select().from(learnerPreferences).where(eq(learnerPreferences.learnerId, learnerId));
  const dash = await getDashboard(db, learnerId);
  const level = (prefs?.targetLevel ?? "B1").toLowerCase();
  const [mock] = await db.select({ id: testBlueprints.id }).from(testBlueprints).where(and(eq(testBlueprints.kind, "mock"), eq(testBlueprints.status, "published"))).orderBy(asc(testBlueprints.id)).limit(1);
  const tasks = generateWeeklyPlan({
    targetLevel: prefs?.targetLevel ?? "B1",
    studyDays: prefs?.studyDays ?? [1, 2, 3, 4, 5],
    minutesPerDay: prefs?.studyMinutesPerDay ?? 45,
    examDate: prefs?.targetExamDate ?? null,
    today: today(),
    recommendations: dash.recommendations,
    practiceLinks: { reading: `/learn/reading?level=${level.toUpperCase()}`, listening: `/learn/listening?level=${level.toUpperCase()}`, writing: "/learn/writing", speaking: "/learn/speaking" },
    mockHref: mock ? "/mock" : null,
  });
  const week = weekStartOf(today());
  await db.transaction(async (tx) => {
    await tx.delete(studyPlanTasks).where(and(eq(studyPlanTasks.learnerId, learnerId), eq(studyPlanTasks.weekStart, week)));
    if (tasks.length) await tx.insert(studyPlanTasks).values(tasks.map((t) => ({ ...t, learnerId, weekStart: week })));
  });
}

/** Current week's plan. Tasks are auto-completed when the learner finishes matching activity this week. */
export async function getWeeklyPlan(db: Db, learnerId: string) {
  const week = weekStartOf(today());
  let tasks = await db.select().from(studyPlanTasks).where(and(eq(studyPlanTasks.learnerId, learnerId), eq(studyPlanTasks.weekStart, week))).orderBy(asc(studyPlanTasks.dayOfWeek));
  if (!tasks.length) {
    await regenerateWeeklyPlan(db, learnerId);
    tasks = await db.select().from(studyPlanTasks).where(and(eq(studyPlanTasks.learnerId, learnerId), eq(studyPlanTasks.weekStart, week))).orderBy(asc(studyPlanTasks.dayOfWeek));
  }
  const since = new Date(week + "T00:00:00Z");
  const attempts = await db
    .select({ skill: testBlueprints.skill, kind: testBlueprints.kind, at: examAttempts.submittedAt })
    .from(examAttempts)
    .innerJoin(testBlueprints, eq(testBlueprints.id, examAttempts.blueprintId))
    .where(and(eq(examAttempts.learnerId, learnerId), eq(examAttempts.status, "submitted"), gte(examAttempts.submittedAt, since)));
  const writing = await db.select({ at: writingSubmissions.submittedAt }).from(writingSubmissions).where(and(eq(writingSubmissions.learnerId, learnerId), eq(writingSubmissions.status, "submitted"), gte(writingSubmissions.submittedAt, since)));
  const speaking = await db.select({ at: speakingSubmissions.submittedAt }).from(speakingSubmissions).where(and(eq(speakingSubmissions.learnerId, learnerId), gte(speakingSubmissions.submittedAt, since)));
  const done: Record<string, number> = {
    reading: attempts.filter((a) => a.skill === "reading").length,
    listening: attempts.filter((a) => a.skill === "listening").length,
    mock: attempts.filter((a) => a.kind === "mock").length,
    writing: writing.length,
    speaking: speaking.length,
  };
  const used: Record<string, number> = {};
  for (const t of tasks) {
    if (t.completedAt) {
      used[t.skill] = (used[t.skill] ?? 0) + 1;
      continue;
    }
    if ((done[t.skill] ?? 0) > (used[t.skill] ?? 0)) {
      used[t.skill] = (used[t.skill] ?? 0) + 1;
      const now = new Date();
      await db.update(studyPlanTasks).set({ completedAt: now }).where(eq(studyPlanTasks.id, t.id));
      t.completedAt = now;
    }
  }
  return { week, tasks };
}

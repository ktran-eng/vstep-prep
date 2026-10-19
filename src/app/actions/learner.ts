"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { attemptAnswers, examAttempts, learnerPreferences, learners, mistakeBookmarks, studyPlanTasks, vocabularyNotes } from "@/server/db/schema";
import { requireLearner } from "@/server/identity";
import { InputError, run } from "@/server/action-result";
import { LEARNER_COOKIE } from "@/lib/signing";
import { regenerateWeeklyPlan } from "@/server/study-plan";

const YEAR = 60 * 60 * 24 * 365;

export async function setLanguageAction(formData: FormData) {
  const lang = z.enum(["vi", "en"]).parse(formData.get("lang"));
  (await cookies()).set("vstep_lang", lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
  const learnerId = await requireLearner();
  await (await getDb()).update(learners).set({ preferredLanguage: lang, updatedAt: new Date() }).where(eq(learners.id, learnerId));
  revalidatePath("/", "layout");
}

export async function setThemeAction(formData: FormData) {
  const theme = z.enum(["system", "light", "dark"]).parse(formData.get("theme"));
  (await cookies()).set("vstep_theme", theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
  const learnerId = await requireLearner();
  await (await getDb()).update(learnerPreferences).set({ theme, updatedAt: new Date() }).where(eq(learnerPreferences.learnerId, learnerId));
  revalidatePath("/", "layout");
}

const prefsSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  targetLevel: z.enum(["B1", "B2", "C1"]),
  targetExamDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  studyMinutesPerDay: z.coerce.number().int().min(15).max(240),
  studyDays: z.array(z.coerce.number().int().min(1).max(7)).min(1, "Chọn ít nhất 1 ngày học / pick at least one day"),
});

export async function savePreferencesAction(_prev: unknown, formData: FormData) {
  return run(async () => {
    const learnerId = await requireLearner();
    const parsed = prefsSchema.safeParse({
      displayName: formData.get("displayName") ?? undefined,
      targetLevel: formData.get("targetLevel"),
      targetExamDate: formData.get("targetExamDate") ?? "",
      studyMinutesPerDay: formData.get("studyMinutesPerDay"),
      studyDays: formData.getAll("studyDays"),
    });
    if (!parsed.success) throw new InputError(parsed.error.issues.map((i) => i.message).join("; "));
    const p = parsed.data;
    const db = await getDb();
    await db
      .update(learnerPreferences)
      .set({ targetLevel: p.targetLevel, targetExamDate: p.targetExamDate || null, studyMinutesPerDay: p.studyMinutesPerDay, studyDays: [...new Set(p.studyDays)].sort(), updatedAt: new Date() })
      .where(eq(learnerPreferences.learnerId, learnerId));
    await db
      .update(learners)
      .set({ displayName: p.displayName || null, onboardedAt: new Date(), updatedAt: new Date() })
      .where(eq(learners.id, learnerId));
    if (formData.get("regeneratePlan") === "1") await regenerateWeeklyPlan(db, learnerId);
    revalidatePath("/", "layout");
    if (formData.get("redirectTo") === "dashboard") redirect("/dashboard");
    return { saved: true };
  });
}

/* --------------------------- Mistake notebook --------------------------- */

export async function bookmarkAction(input: { questionId: string; attemptId: string; note?: string; reviewStatus?: "to_review" | "reviewed" }) {
  return run(async () => {
    const learnerId = await requireLearner();
    // A bookmark must come from one of the learner's finished attempts containing the question,
    // because the notebook displays answer keys (prevents unlocking keys of unseen questions).
    const p = z
      .object({ questionId: z.string().max(100), attemptId: z.string().uuid(), note: z.string().max(1000).optional(), reviewStatus: z.enum(["to_review", "reviewed"]).default("to_review") })
      .parse(input);
    const db = await getDb();
    const [a] = await db
      .select({ status: examAttempts.status })
      .from(examAttempts)
      .innerJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, examAttempts.id), eq(attemptAnswers.questionId, p.questionId)))
      .where(and(eq(examAttempts.id, p.attemptId), eq(examAttempts.learnerId, learnerId)));
    if (!a || a.status === "in_progress") throw new InputError("Question not available for review");
    await db
      .insert(mistakeBookmarks)
      .values({ learnerId, questionId: p.questionId, attemptId: p.attemptId, note: p.note ?? null, reviewStatus: p.reviewStatus })
      .onConflictDoUpdate({ target: [mistakeBookmarks.learnerId, mistakeBookmarks.questionId], set: { note: p.note ?? null, reviewStatus: p.reviewStatus, updatedAt: new Date() } });
    revalidatePath("/review");
  });
}

export async function updateBookmarkAction(input: { id: string; reviewStatus?: "to_review" | "reviewed"; note?: string; remove?: boolean }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ id: z.string().uuid(), reviewStatus: z.enum(["to_review", "reviewed"]).optional(), note: z.string().max(1000).optional(), remove: z.boolean().optional() }).parse(input);
    const db = await getDb();
    const where = and(eq(mistakeBookmarks.id, p.id), eq(mistakeBookmarks.learnerId, learnerId));
    if (p.remove) await db.delete(mistakeBookmarks).where(where);
    else await db.update(mistakeBookmarks).set({ ...(p.reviewStatus ? { reviewStatus: p.reviewStatus } : {}), ...(p.note !== undefined ? { note: p.note } : {}), updatedAt: new Date() }).where(where);
    revalidatePath("/review");
  });
}

/* ------------------------------ Vocabulary ------------------------------ */

export async function addVocabAction(_prev: unknown, formData: FormData) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z
      .object({ term: z.string().trim().min(1, "Nhập từ / enter a term").max(100), meaning: z.string().trim().max(300).optional(), example: z.string().trim().max(500).optional() })
      .safeParse({ term: formData.get("term"), meaning: formData.get("meaning") || undefined, example: formData.get("example") || undefined });
    if (!p.success) throw new InputError(p.error.issues[0]!.message);
    await (await getDb()).insert(vocabularyNotes).values({ learnerId, ...p.data });
    revalidatePath("/vocabulary");
    return { added: true };
  });
}

export async function quickAddVocabAction(input: { term: string; meaning?: string }) {
  return run(async () => {
    const learnerId = await requireLearner();
    const p = z.object({ term: z.string().trim().min(1).max(100), meaning: z.string().max(300).optional() }).parse(input);
    await (await getDb()).insert(vocabularyNotes).values({ learnerId, term: p.term, meaning: p.meaning ?? null });
  });
}

export async function deleteVocabAction(formData: FormData) {
  const learnerId = await requireLearner();
  const id = z.string().uuid().parse(formData.get("id"));
  await (await getDb()).delete(vocabularyNotes).where(and(eq(vocabularyNotes.id, id), eq(vocabularyNotes.learnerId, learnerId)));
  revalidatePath("/vocabulary");
}

/* ------------------------------ Study plan ------------------------------ */

export async function regeneratePlanAction() {
  const learnerId = await requireLearner();
  await regenerateWeeklyPlan(await getDb(), learnerId);
  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

export async function togglePlanTaskAction(formData: FormData) {
  const learnerId = await requireLearner();
  const id = z.string().uuid().parse(formData.get("id"));
  const done = formData.get("done") === "1";
  await (await getDb())
    .update(studyPlanTasks)
    .set({ completedAt: done ? new Date() : null })
    .where(and(eq(studyPlanTasks.id, id), eq(studyPlanTasks.learnerId, learnerId)));
  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

/* --------------------------- Data rights --------------------------- */

/** Permanently deletes the signed-in learner's profile and every record linked to it, then signs out. */
export async function deleteMyDataAction(formData: FormData) {
  if (formData.get("confirm") !== "DELETE") throw new InputError("Confirmation text did not match.");
  const learnerId = await requireLearner();
  const db = await getDb();
  // FK cascades from learners remove preferences, attempts (→ answers, sections, plays), submissions,
  // recordings (blobs), bookmarks, vocabulary and plan tasks. Rate-limit rows are keyed by id and expire.
  await db.delete(learners).where(eq(learners.id, learnerId));
  const jar = await cookies();
  jar.delete(LEARNER_COOKIE);
  redirect("/?deleted=1");
}

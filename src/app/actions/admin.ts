"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import * as t from "@/server/db/schema";
import { checkAdminPassword, clearAdminSession, createAdminSession, requireAdmin } from "@/server/admin-auth";
import { audit, rateLimit } from "@/server/ops";
import { publishSnapshot } from "@/server/snapshots";
import { blueprintsUsing } from "@/server/admin";
import { InputError, run } from "@/server/action-result";
import { examSpecSchema, scoringConfigSchema } from "@/domain/spec";
import { validateMcq } from "@/domain/content-validation";
import { splitParagraphs } from "@/domain/text";
import { mcqSchema } from "@/domain/content-schema";

const STATUS = z.enum(["draft", "validated", "reviewed", "published", "archived"]);

export async function adminLoginAction(_prev: unknown, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await rateLimit(`admin-login:${ip}`, 10, 900))) return { error: "Quá nhiều lần thử. Vui lòng đợi 15 phút." };
  const password = String(formData.get("password") ?? "");
  if (!checkAdminPassword(password)) {
    await audit("anonymous", "admin.login_failed", "admin", null, { ip });
    return { error: "Mật khẩu không đúng hoặc ADMIN_PASSWORD chưa được cấu hình." };
  }
  await createAdminSession();
  await audit("admin", "admin.login", "admin", null, { ip });
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

/** Re-publishes snapshots for the given blueprints (new immutable version if content changed). */
async function republish(ids: string[]) {
  const db = await getDb();
  for (const id of ids) {
    const [bp] = await db.select().from(t.testBlueprints).where(eq(t.testBlueprints.id, id));
    if (bp?.status === "published") await publishSnapshot(db, id);
  }
}

export async function setQuestionStatusAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().max(100).parse(formData.get("id"));
  const status = STATUS.parse(formData.get("status"));
  const db = await getDb();
  const [q] = await db.update(t.questions).set({ status, ...(status === "reviewed" || status === "published" ? { reviewedBy: actor } : {}), updatedAt: new Date() }).where(eq(t.questions.id, id)).returning();
  if (!q) throw new InputError("Not found");
  await audit(actor, "question.status", "question", id, { status });
  await republish(await blueprintsUsing(db, q));
  revalidatePath("/admin/content");
}

const editSchema = z.object({
  id: z.string().max(100),
  prompt: z.string().min(5).max(500),
  A: z.string().min(1).max(300),
  B: z.string().min(1).max(300),
  C: z.string().min(1).max(300),
  D: z.string().min(1).max(300),
  answer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(20).max(3000),
  evidenceRef: z.string().regex(/^[PS]\d+$/),
  evidenceQuote: z.string().min(3).max(1000),
  difficulty: z.coerce.number().int().min(1).max(5),
});

/** Edits an objective item. The edit is validated (evidence must exist verbatim) before saving and bumps the item version. */
export async function editQuestionAction(_prev: unknown, formData: FormData) {
  return run(async () => {
    const actor = await requireAdmin();
    const p = editSchema.safeParse(Object.fromEntries(formData));
    if (!p.success) throw new InputError(p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    const v = p.data;
    const db = await getDb();
    const [q] = await db.select().from(t.questions).where(eq(t.questions.id, v.id));
    if (!q) throw new InputError("Question not found");
    const [k] = await db.select().from(t.answerKeys).where(eq(t.answerKeys.questionId, v.id));
    let units = new Map<string, string>();
    if (q.passageId) {
      const [ps] = await db.select().from(t.passages).where(eq(t.passages.id, q.passageId));
      units = new Map(splitParagraphs(ps!.content).map((x, i) => [`P${i + 1}`, x]));
    } else if (q.audioAssetId) {
      const [a] = await db.select().from(t.audioAssets).where(eq(t.audioAssets.id, q.audioAssetId));
      const [tr] = await db.select().from(t.transcripts).where(eq(t.transcripts.id, a!.transcriptId));
      units = new Map(tr!.segments.map((s) => [s.id, s.text]));
    }
    const mcq = mcqSchema.parse({
      id: v.id,
      type: q.taskType,
      difficulty: v.difficulty,
      prompt: v.prompt,
      options: { A: v.A, B: v.B, C: v.C, D: v.D },
      answer: v.answer,
      explanation: v.explanation,
      evidence: { ref: v.evidenceRef, quote: v.evidenceQuote },
    });
    const errors = validateMcq(mcq, units, q.passageId ?? q.audioAssetId ?? "").filter((i) => i.severity === "error");
    if (errors.length) throw new InputError(errors.map((e) => e.message).join("; "));
    await db.transaction(async (tx) => {
      await tx.update(t.questions).set({ prompt: v.prompt, difficulty: v.difficulty, version: q.version + 1, updatedAt: new Date(), status: q.status === "published" ? "reviewed" : q.status }).where(eq(t.questions.id, v.id));
      for (const [i, key] of (["A", "B", "C", "D"] as const).entries())
        await tx
          .insert(t.questionOptions)
          .values({ questionId: v.id, optionKey: key, optionText: v[key], displayOrder: i })
          .onConflictDoUpdate({ target: [t.questionOptions.questionId, t.questionOptions.optionKey], set: { optionText: v[key] } });
      await tx
        .update(t.answerKeys)
        .set({ correctAnswer: v.answer, explanation: v.explanation, evidenceReference: { ref: v.evidenceRef, quote: v.evidenceQuote }, distractorNotes: k?.correctAnswer === v.answer ? k.distractorNotes : null })
        .where(eq(t.answerKeys.questionId, v.id));
    });
    await audit(actor, "question.edit", "question", v.id, { fromVersion: q.version, answerChanged: k?.correctAnswer !== v.answer });
    await republish(await blueprintsUsing(db, q));
    revalidatePath(`/admin/content/${v.id}`);
    return { version: q.version + 1 };
  });
}

export async function setPromptStatusAction(formData: FormData) {
  const actor = await requireAdmin();
  const kind = z.enum(["writing", "speaking", "passage"]).parse(formData.get("kind"));
  const id = z.string().max(100).parse(formData.get("id"));
  const status = STATUS.parse(formData.get("status"));
  const db = await getDb();
  const tbl = kind === "writing" ? t.writingPrompts : kind === "speaking" ? t.speakingPrompts : t.passages;
  await db.update(tbl).set({ status, updatedAt: new Date() }).where(eq(tbl.id, id));
  await audit(actor, `${kind}.status`, kind, id, { status });
  revalidatePath("/admin/content");
}

export async function setBlueprintStatusAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().max(100).parse(formData.get("id"));
  const status = z.enum(["draft", "published", "archived"]).parse(formData.get("status"));
  const db = await getDb();
  await db.update(t.testBlueprints).set({ status, updatedAt: new Date() }).where(eq(t.testBlueprints.id, id));
  if (status === "published") await publishSnapshot(db, id);
  await audit(actor, "test.status", "test_blueprint", id, { status });
  revalidatePath("/admin/tests");
}

export async function republishAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().max(100).parse(formData.get("id"));
  const snap = await publishSnapshot(await getDb(), id);
  await audit(actor, "test.snapshot", "test_blueprint", id, { version: snap.blueprintVersion });
  revalidatePath("/admin/tests");
}

export async function setAudioQualityAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().max(100).parse(formData.get("id"));
  const quality = z.enum(["unreviewed", "approved", "rejected"]).parse(formData.get("quality"));
  const db = await getDb();
  await db.update(t.audioAssets).set({ qualityStatus: quality }).where(eq(t.audioAssets.id, id));
  await audit(actor, "audio.quality", "audio_asset", id, { quality, note: String(formData.get("note") ?? "").slice(0, 500) });
  await republish(await blueprintsUsing(db, { audioAssetId: id }));
  revalidatePath("/admin/audio");
}

export async function saveConfigAction(_prev: unknown, formData: FormData) {
  return run(async () => {
    const actor = await requireAdmin();
    const kind = z.enum(["spec", "scoring"]).parse(formData.get("kind"));
    let json: unknown;
    try {
      json = JSON.parse(String(formData.get("payload") ?? ""));
    } catch {
      throw new InputError("Invalid JSON");
    }
    const parsed = (kind === "spec" ? examSpecSchema : scoringConfigSchema).safeParse(json);
    if (!parsed.success) throw new InputError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    const db = await getDb();
    const tbl = kind === "spec" ? t.examSpecifications : t.scoringConfigs;
    const version = parsed.data.version;
    const [dup] = await db.select().from(tbl).where(eq(tbl.version, version));
    if (dup) throw new InputError(`Version ${version} already exists — use a new version string.`);
    await db.transaction(async (tx) => {
      await tx.insert(tbl).values({ version, payload: parsed.data, isActive: true, createdBy: actor });
      await tx.update(tbl).set({ isActive: false }).where(and(ne(tbl.version, version), eq(tbl.isActive, true)));
    });
    await audit(actor, `${kind}.activate`, kind === "spec" ? "exam_specification" : "scoring_config", version, null);
    revalidatePath("/admin/scoring");
    return { version };
  });
}

export async function activateConfigAction(formData: FormData) {
  const actor = await requireAdmin();
  const kind = z.enum(["spec", "scoring"]).parse(formData.get("kind"));
  const version = z.string().max(100).parse(formData.get("version"));
  const db = await getDb();
  const tbl = kind === "spec" ? t.examSpecifications : t.scoringConfigs;
  await db.transaction(async (tx) => {
    await tx.update(tbl).set({ isActive: false }).where(eq(tbl.isActive, true));
    await tx.update(tbl).set({ isActive: true }).where(eq(tbl.version, version));
  });
  await audit(actor, `${kind}.activate`, kind, version, null);
  revalidatePath("/admin/scoring");
}

export async function updateSourceAction(formData: FormData) {
  const actor = await requireAdmin();
  const p = z
    .object({
      id: z.string().max(100),
      lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      confidence: z.enum(["high", "medium", "low"]),
      notes: z.string().max(2000),
    })
    .parse(Object.fromEntries(formData));
  await (await getDb()).update(t.sources).set({ lastVerifiedAt: p.lastVerifiedAt, confidence: p.confidence, notes: p.notes, updatedAt: new Date() }).where(eq(t.sources.id, p.id));
  await audit(actor, "source.update", "source", p.id, { lastVerifiedAt: p.lastVerifiedAt, confidence: p.confidence });
  revalidatePath("/admin/sources");
}

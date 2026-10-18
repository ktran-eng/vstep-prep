import fs from "node:fs";
import path from "node:path";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Db } from "./db/client";
import * as t from "./db/schema";
import { latestSnapshot } from "./snapshots";
import { validateMcq, type Issue } from "@/domain/content-validation";
import { splitParagraphs } from "@/domain/text";
import type { Mcq } from "@/domain/content-schema";

export async function adminOverview(db: Db) {
  const c = async (tbl: PgTable) => (await db.select({ n: count() }).from(tbl))[0]!.n;
  const byStatus = await db.select({ status: t.questions.status, skill: t.questions.skill, n: count() }).from(t.questions).groupBy(t.questions.status, t.questions.skill);
  return {
    questions: await c(t.questions),
    passages: await c(t.passages),
    audio: await c(t.audioAssets),
    writingPrompts: await c(t.writingPrompts),
    speakingPrompts: await c(t.speakingPrompts),
    tests: await c(t.testBlueprints),
    learners: await c(t.learners),
    attempts: await c(t.examAttempts),
    writingSubs: await c(t.writingSubmissions),
    speakingSubs: await c(t.speakingSubmissions),
    byStatus,
  };
}

/** Database-level validation of the live bank (complements the file-level content validator). */
export async function validateLiveContent(db: Db): Promise<Issue[]> {
  const issues: Issue[] = [];
  const qs = await db.select().from(t.questions);
  const opts = await db.select().from(t.questionOptions);
  const keys = await db.select().from(t.answerKeys);
  const passages = await db.select().from(t.passages);
  const audio = await db.select().from(t.audioAssets);
  const trs = await db.select().from(t.transcripts);
  for (const q of qs) {
    if (q.status === "archived") continue;
    const o = opts.filter((x) => x.questionId === q.id);
    const k = keys.find((x) => x.questionId === q.id);
    if (!k) {
      issues.push({ severity: "error", entity: q.id, message: "Missing answer key" });
      continue;
    }
    if (o.length !== 4) issues.push({ severity: "error", entity: q.id, message: `Has ${o.length} options (expected 4)` });
    let units = new Map<string, string>();
    if (q.passageId) {
      const p = passages.find((x) => x.id === q.passageId);
      if (!p) issues.push({ severity: "error", entity: q.id, message: "Passage missing" });
      else units = new Map(splitParagraphs(p.content).map((x, i) => [`P${i + 1}`, x]));
    } else if (q.audioAssetId) {
      const a = audio.find((x) => x.id === q.audioAssetId);
      const tr = a && trs.find((x) => x.id === a.transcriptId);
      if (!a || !tr) issues.push({ severity: "error", entity: q.id, message: "Audio or transcript missing" });
      else units = new Map(tr.segments.map((s) => [s.id, s.text]));
    } else issues.push({ severity: "error", entity: q.id, message: "Question is not linked to a passage or audio" });
    if (units.size && o.length === 4) {
      const mcq: Mcq = {
        id: q.id,
        type: q.taskType as Mcq["type"],
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: Object.fromEntries(o.map((x) => [x.optionKey, x.optionText])) as Mcq["options"],
        answer: k.correctAnswer as Mcq["answer"],
        explanation: k.explanation,
        evidence: k.evidenceReference,
        distractors: k.distractorNotes ?? undefined,
      };
      issues.push(...validateMcq(mcq, units, q.passageId ?? q.audioAssetId ?? ""));
    }
    if (q.status === "published" && q.licenseStatus === "unlicensed") issues.push({ severity: "error", entity: q.id, message: "Unlicensed content is published" });
  }
  for (const a of audio) {
    if (!a.storageKey) issues.push({ severity: "error", entity: a.id, message: "No audio file generated" });
    else if (!fs.existsSync(path.join(process.cwd(), "public", "audio", a.storageKey))) issues.push({ severity: "error", entity: a.id, message: `Audio file ${a.storageKey} not found` });
    if (a.qualityStatus !== "approved") issues.push({ severity: "warning", entity: a.id, message: `Audio quality status: ${a.qualityStatus} (${a.generationMethod})` });
  }
  const bps = await db.select().from(t.testBlueprints).where(eq(t.testBlueprints.status, "published"));
  for (const b of bps) {
    const snap = await latestSnapshot(db, b.id);
    if (!snap) issues.push({ severity: "error", entity: b.id, message: "Published test has no snapshot" });
    else if (snap.blueprintVersion !== b.version) issues.push({ severity: "warning", entity: b.id, message: "Snapshot is older than the blueprint version" });
  }
  return issues;
}

/** Classical item statistics from submitted attempts: facility (p-value) and option choice distribution. */
export async function itemStatistics(db: Db) {
  const rows = await db
    .select({
      questionId: t.attemptAnswers.questionId,
      response: t.attemptAnswers.response,
      isCorrect: t.attemptAnswers.isCorrect,
    })
    .from(t.attemptAnswers)
    .innerJoin(t.examAttempts, eq(t.examAttempts.id, t.attemptAnswers.attemptId))
    .where(and(eq(t.examAttempts.status, "submitted"), sql`${t.attemptAnswers.gradedAt} is not null`));
  const qs = await db.select({ id: t.questions.id, prompt: t.questions.prompt, skill: t.questions.skill, level: t.questions.level, difficulty: t.questions.difficulty, type: t.questions.taskType }).from(t.questions);
  const keys = await db.select({ id: t.answerKeys.questionId, answer: t.answerKeys.correctAnswer }).from(t.answerKeys);
  const stats = new Map<string, { n: number; correct: number; blank: number; choices: Record<string, number> }>();
  for (const r of rows) {
    const s = stats.get(r.questionId) ?? { n: 0, correct: 0, blank: 0, choices: {} };
    s.n++;
    if (r.isCorrect) s.correct++;
    if (!r.response) s.blank++;
    else s.choices[r.response] = (s.choices[r.response] ?? 0) + 1;
    stats.set(r.questionId, s);
  }
  return qs
    .map((q) => {
      const s = stats.get(q.id);
      const p = s && s.n ? s.correct / s.n : null;
      const key = keys.find((k) => k.id === q.id)?.answer ?? "";
      const flags: string[] = [];
      if (s && s.n >= 10) {
        if (p! < 0.2) flags.push("Very hard / possible key error");
        if (p! > 0.95) flags.push("Very easy");
        const top = Object.entries(s.choices).sort((a, b) => b[1] - a[1])[0];
        if (top && top[0] !== key && top[1] > s.correct) flags.push(`Distractor ${top[0]} chosen more than key`);
      }
      return { ...q, key, n: s?.n ?? 0, p, blank: s?.blank ?? 0, choices: s?.choices ?? {}, flags };
    })
    .sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
}

export async function listQuestions(db: Db, f: { skill?: string; level?: string; status?: string; q?: string }, page = 1, pageSize = 50) {
  const conds = [];
  if (f.skill) conds.push(eq(t.questions.skill, f.skill));
  if (f.level) conds.push(eq(t.questions.level, f.level));
  if (f.status) conds.push(eq(t.questions.status, f.status));
  if (f.q) conds.push(sql`(${t.questions.prompt} ilike ${"%" + f.q + "%"} or ${t.questions.id} ilike ${"%" + f.q + "%"})`);
  const where = conds.length ? and(...conds) : undefined;
  const total = (await db.select({ n: count() }).from(t.questions).where(where))[0]!.n;
  const items = await db
    .select()
    .from(t.questions)
    .where(where)
    .orderBy(asc(t.questions.skill), asc(t.questions.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { total, items, page, pageSize };
}

export async function getQuestionFull(db: Db, id: string) {
  const [q] = await db.select().from(t.questions).where(eq(t.questions.id, id));
  if (!q) return null;
  const options = await db.select().from(t.questionOptions).where(eq(t.questionOptions.questionId, id)).orderBy(asc(t.questionOptions.displayOrder));
  const [key] = await db.select().from(t.answerKeys).where(eq(t.answerKeys.questionId, id));
  const [passage] = q.passageId ? await db.select().from(t.passages).where(eq(t.passages.id, q.passageId)) : [];
  const [audio] = q.audioAssetId ? await db.select().from(t.audioAssets).where(eq(t.audioAssets.id, q.audioAssetId)) : [];
  const [tr] = audio ? await db.select().from(t.transcripts).where(eq(t.transcripts.id, audio.transcriptId)) : [];
  return { q, options, key: key ?? null, passage: passage ?? null, audio: audio ?? null, transcript: tr ?? null };
}

/** Blueprints that include a given passage/audio (to re-snapshot after edits). */
export async function blueprintsUsing(db: Db, ref: { passageId?: string | null; audioAssetId?: string | null }) {
  const cond = ref.passageId ? eq(t.testItems.passageId, ref.passageId) : ref.audioAssetId ? eq(t.testItems.audioAssetId, ref.audioAssetId) : sql`false`;
  const rows = await db.selectDistinct({ id: t.testSections.blueprintId }).from(t.testItems).innerJoin(t.testSections, eq(t.testSections.id, t.testItems.sectionId)).where(cond);
  return rows.map((r) => r.id);
}

export async function recentAudit(db: Db, limit = 200) {
  return db.select().from(t.auditLogs).orderBy(desc(t.auditLogs.createdAt)).limit(limit);
}

export async function snapshotsFor(db: Db, ids: string[]) {
  if (!ids.length) return [];
  return db.select({ id: t.blueprintSnapshots.id, blueprintId: t.blueprintSnapshots.blueprintId, version: t.blueprintSnapshots.blueprintVersion, createdAt: t.blueprintSnapshots.createdAt }).from(t.blueprintSnapshots).where(inArray(t.blueprintSnapshots.blueprintId, ids)).orderBy(desc(t.blueprintSnapshots.createdAt));
}

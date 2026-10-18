/** Loads the version-controlled content bundle into the database (idempotent upserts) and publishes snapshots. */
import { eq, sql } from "drizzle-orm";
import type { Db } from "./db/client";
import * as t from "./db/schema";
import type { ContentBundle } from "@/domain/content-validation";
import type { SourceRecord } from "@/domain/content-schema";
import { DEFAULT_EXAM_SPEC, DEFAULT_SCORING_CONFIG } from "@/domain/spec";
import { RUBRICS } from "@/domain/rubrics";
import { countWords } from "@/domain/text";
import { publishSnapshot } from "./snapshots";

export type AudioManifest = Record<string, { file: string; durationSeconds: number; method: string; voices: Record<string, string> }>;

export async function seedDatabase(db: Db, bundle: ContentBundle, sources: SourceRecord[], audio: AudioManifest, opts: { force?: boolean } = {}) {
  const now = new Date();
  for (const s of sources) {
    const v = { ...s, notes: s.notes ?? null };
    await db.insert(t.sources).values(v).onConflictDoUpdate({ target: t.sources.id, set: { ...v, updatedAt: now } });
  }
  await db.insert(t.examSpecifications).values({ version: DEFAULT_EXAM_SPEC.version, payload: DEFAULT_EXAM_SPEC, isActive: true }).onConflictDoNothing();
  await db.insert(t.scoringConfigs).values({ version: DEFAULT_SCORING_CONFIG.version, payload: DEFAULT_SCORING_CONFIG, isActive: true }).onConflictDoNothing();
  // Ensure exactly one active row each (keep an admin-activated version if present).
  for (const tbl of [t.examSpecifications, t.scoringConfigs]) {
    const active = await db.select().from(tbl).where(eq(tbl.isActive, true));
    if (active.length === 0) await db.update(tbl).set({ isActive: true }).where(eq(tbl.version, tbl === t.examSpecifications ? DEFAULT_EXAM_SPEC.version : DEFAULT_SCORING_CONFIG.version));
  }
  for (const r of RUBRICS) {
    const v = { id: r.id, skill: r.skill, version: r.version, name: r.name, isOfficial: r.isOfficial, criteria: r.criteria, notes: r.notes };
    await db.insert(t.rubrics).values(v).onConflictDoUpdate({ target: t.rubrics.id, set: v });
  }

  const meta = (p: { provenance: { type: string; sourceId?: string; license: string }; status: string }) => ({
    provenanceType: p.provenance.type,
    sourceId: p.provenance.sourceId ?? null,
    licenseStatus: p.provenance.license,
    status: p.status,
    updatedAt: now,
  });

  const upsertMcqs = async (
    qs: ContentBundle["reading"][number]["questions"],
    base: { skill: string; level: string; topic: string; passageId?: string; audioAssetId?: string },
    m: ReturnType<typeof meta>,
  ) => {
    let order = 0;
    for (const q of qs) {
      const v = {
        id: q.id,
        skill: base.skill,
        level: base.level,
        topic: base.topic,
        taskType: q.type,
        difficulty: q.difficulty,
        prompt: q.prompt,
        learningObjective: q.objective ?? null,
        passageId: base.passageId ?? null,
        audioAssetId: base.audioAssetId ?? null,
        displayOrder: order++,
        ...m,
      };
      // Questions edited in the admin (version > 1) are not overwritten unless seeding with force.
      const [existing] = await db.select({ version: t.questions.version }).from(t.questions).where(eq(t.questions.id, q.id));
      if (existing && existing.version > 1 && !opts.force) continue;
      await db.insert(t.questions).values(v).onConflictDoUpdate({ target: t.questions.id, set: { ...v, version: 1 } });
      await db.delete(t.questionOptions).where(eq(t.questionOptions.questionId, q.id));
      await db.insert(t.questionOptions).values(
        (["A", "B", "C", "D"] as const).map((k, i) => ({ questionId: q.id, optionKey: k, optionText: q.options[k], displayOrder: i })),
      );
      const key = {
        questionId: q.id,
        correctAnswer: q.answer,
        explanation: q.explanation,
        evidenceReference: q.evidence,
        distractorNotes: q.distractors ?? null,
        vocabularyNotes: q.vocab ?? null,
      };
      await db.insert(t.answerKeys).values(key).onConflictDoUpdate({ target: t.answerKeys.questionId, set: key });
    }
  };

  for (const r of bundle.reading) {
    const m = meta(r);
    const v = { id: r.id, title: r.title, content: r.passage, wordCount: countWords(r.passage), level: r.level, topic: r.topic, ...m };
    await db.insert(t.passages).values(v).onConflictDoUpdate({ target: t.passages.id, set: v });
    await upsertMcqs(r.questions, { skill: "reading", level: r.level, topic: r.topic, passageId: r.id }, m);
  }

  for (const l of bundle.listening) {
    const segs = l.segments.map((s, i) => ({ id: `S${i + 1}`, speaker: s.speaker, text: s.text }));
    await db.insert(t.transcripts).values({ id: `tr-${l.id}`, segments: segs }).onConflictDoUpdate({ target: t.transcripts.id, set: { segments: segs } });
    const a = audio[l.id];
    const v = {
      id: l.id,
      title: l.title,
      transcriptId: `tr-${l.id}`,
      storageKey: a?.file ?? null,
      durationSeconds: a?.durationSeconds ?? null,
      voiceMetadata: a?.voices ?? null,
      generationMethod: a?.method ?? "pending",
      part: l.part,
      level: l.level,
      topic: l.topic,
      licenseStatus: l.provenance.license,
    };
    // Do not reset an admin's quality review when re-seeding unchanged audio.
    await db.insert(t.audioAssets).values(v).onConflictDoUpdate({ target: t.audioAssets.id, set: v });
    await upsertMcqs(l.questions, { skill: "listening", level: l.level, topic: l.topic, audioAssetId: l.id }, meta(l));
  }

  for (const w of bundle.writing) {
    const v = {
      id: w.id,
      taskType: w.task,
      level: w.level,
      title: w.title,
      topic: w.topic,
      instructions: w.instructions,
      stimulus: w.stimulus ?? null,
      requiredPoints: w.requiredPoints,
      minWords: w.minWords,
      suggestedMinutes: w.suggestedMinutes,
      rubricId: "writing-practice-v1",
      sampleResponse: w.sample.text,
      sampleLevel: w.sample.level,
      ...meta(w),
    };
    await db.insert(t.writingPrompts).values(v).onConflictDoUpdate({ target: t.writingPrompts.id, set: v });
  }

  for (const s of bundle.speaking) {
    const v = {
      id: s.id,
      partNumber: s.content.part,
      level: s.level,
      title: s.title,
      topic: s.topic,
      instructions: s.instructions,
      content: s.content,
      preparationSeconds: s.preparationSeconds,
      responseSeconds: s.responseSeconds,
      rubricId: "speaking-practice-v1",
      modelResponse: s.modelResponse,
      usefulLanguage: s.usefulLanguage,
      ...meta(s),
    };
    await db.insert(t.speakingPrompts).values(v).onConflictDoUpdate({ target: t.speakingPrompts.id, set: v });
  }

  for (const b of bundle.blueprints) {
    const v = {
      id: b.id,
      name: b.name,
      description: b.description,
      kind: b.kind,
      skill: b.skill ?? null,
      targetLevel: b.targetLevel,
      durationSeconds: Math.round(b.sections.reduce((n, s) => n + s.timeLimitMinutes * 60, 0)),
      specificationVersion: DEFAULT_EXAM_SPEC.version,
      status: b.status,
      updatedAt: now,
    };
    await db.insert(t.testBlueprints).values(v).onConflictDoUpdate({ target: t.testBlueprints.id, set: v });
    // Rebuild section/item structure (snapshots keep history immutable).
    await db.delete(t.testSections).where(eq(t.testSections.blueprintId, b.id));
    let order = 0;
    for (const sec of b.sections) {
      const sectionId = `${b.id}-s${order}`;
      await db.insert(t.testSections).values({ id: sectionId, blueprintId: b.id, skill: sec.skill, sectionOrder: order, timeLimitSeconds: Math.round(sec.timeLimitMinutes * 60) });
      let i = 0;
      for (const ref of sec.items) {
        await db.insert(t.testItems).values({
          id: `${sectionId}-i${i}`,
          sectionId,
          itemOrder: i,
          passageId: sec.skill === "reading" ? ref : null,
          audioAssetId: sec.skill === "listening" ? ref : null,
          writingPromptId: sec.skill === "writing" ? ref : null,
          speakingPromptId: sec.skill === "speaking" ? ref : null,
        });
        i++;
      }
      order++;
    }
    if (b.status === "published") await publishSnapshot(db, b.id);
  }
  await db.execute(sql`select 1`);
}

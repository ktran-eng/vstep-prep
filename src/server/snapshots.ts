import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "./db/client";
import {
  answerKeys,
  audioAssets,
  blueprintSnapshots,
  passages,
  questionOptions,
  questions,
  speakingPrompts,
  testBlueprints,
  testItems,
  testSections,
  transcripts,
  writingPrompts,
} from "./db/schema";
import { splitParagraphs } from "@/domain/text";
import type { Level, QuestionType, Skill } from "@/domain/content-schema";
import type { ProtectedSnapshot, PublicGroup, PublicQuestion, PublicSnapshot, SpeakingContent } from "@/domain/snapshot";

function provenanceLabel(type: string) {
  return type === "original" ? "Original practice material (not an official VSTEP test)" : type;
}

/** Builds the fully-resolved public/protected payloads for the current version of a blueprint. */
export async function buildSnapshotPayload(db: Db, blueprintId: string) {
  const [bp] = await db.select().from(testBlueprints).where(eq(testBlueprints.id, blueprintId));
  if (!bp) throw new Error(`Blueprint ${blueprintId} not found`);
  const secs = await db.select().from(testSections).where(eq(testSections.blueprintId, blueprintId)).orderBy(asc(testSections.sectionOrder));

  const pub: PublicSnapshot = {
    blueprint: {
      id: bp.id,
      name: bp.name,
      description: bp.description,
      kind: bp.kind as "mock" | "practice",
      skill: (bp.skill as Skill | null) ?? null,
      targetLevel: bp.targetLevel,
      version: bp.version,
      specVersion: bp.specificationVersion,
    },
    sections: [],
  };
  const prot: ProtectedSnapshot = { answers: {}, transcripts: {}, writingSamples: {}, speakingModels: {} };

  for (const sec of secs) {
    const items = await db.select().from(testItems).where(eq(testItems.sectionId, sec.id)).orderBy(asc(testItems.itemOrder));
    const groups: PublicGroup[] = [];
    let number = 0;

    const loadQuestions = async (where: { passageId?: string; audioId?: string }) => {
      const qs = await db
        .select()
        .from(questions)
        .where(where.passageId ? eq(questions.passageId, where.passageId) : eq(questions.audioAssetId, where.audioId!))
        .orderBy(asc(questions.displayOrder));
      const live = qs.filter((q) => q.status !== "archived");
      const ids = live.map((q) => q.id);
      const opts = ids.length ? await db.select().from(questionOptions).where(inArray(questionOptions.questionId, ids)) : [];
      const keys = ids.length ? await db.select().from(answerKeys).where(inArray(answerKeys.questionId, ids)) : [];
      return live.map((q): PublicQuestion => {
        const k = keys.find((x) => x.questionId === q.id);
        if (!k) throw new Error(`Question ${q.id} has no answer key`);
        prot.answers[q.id] = {
          answer: k.correctAnswer,
          explanation: k.explanation,
          evidence: k.evidenceReference,
          distractors: k.distractorNotes ?? null,
          vocab: k.vocabularyNotes ?? null,
        };
        return {
          id: q.id,
          number: ++number,
          prompt: q.prompt,
          type: q.taskType as QuestionType,
          difficulty: q.difficulty,
          options: opts
            .filter((o) => o.questionId === q.id)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((o) => ({ key: o.optionKey, text: o.optionText })),
        };
      });
    };

    for (const it of items) {
      if (it.passageId) {
        const [p] = await db.select().from(passages).where(eq(passages.id, it.passageId));
        if (!p) throw new Error(`Passage ${it.passageId} missing`);
        groups.push({
          kind: "reading",
          id: p.id,
          title: p.title,
          level: p.level as Level,
          topic: p.topic,
          paragraphs: splitParagraphs(p.content),
          questions: await loadQuestions({ passageId: p.id }),
          provenance: provenanceLabel(p.provenanceType),
        });
      } else if (it.audioAssetId) {
        const [a] = await db.select().from(audioAssets).where(eq(audioAssets.id, it.audioAssetId));
        if (!a) throw new Error(`Audio ${it.audioAssetId} missing`);
        const [t] = await db.select().from(transcripts).where(eq(transcripts.id, a.transcriptId));
        prot.transcripts[a.id] = t?.segments ?? [];
        groups.push({
          kind: "listening",
          id: a.id,
          title: a.title,
          part: a.part as 1 | 2 | 3,
          level: a.level as Level,
          topic: a.topic,
          audioUrl: a.storageKey ? `/audio/${a.storageKey}` : null,
          durationSeconds: a.durationSeconds,
          generationMethod: a.generationMethod,
          qualityStatus: a.qualityStatus,
          questions: await loadQuestions({ audioId: a.id }),
          provenance: provenanceLabel("original"),
        });
      } else if (it.writingPromptId) {
        const [w] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, it.writingPromptId));
        if (!w) throw new Error(`Writing prompt ${it.writingPromptId} missing`);
        prot.writingSamples[w.id] = { level: w.sampleLevel, text: w.sampleResponse };
        groups.push({
          kind: "writing",
          id: w.id,
          task: w.taskType as "letter" | "essay",
          level: w.level as Level,
          title: w.title,
          instructions: w.instructions,
          stimulus: w.stimulus,
          requiredPoints: w.requiredPoints,
          minWords: w.minWords,
          suggestedMinutes: w.suggestedMinutes,
          rubricId: w.rubricId,
        });
      } else if (it.speakingPromptId) {
        const [s] = await db.select().from(speakingPrompts).where(eq(speakingPrompts.id, it.speakingPromptId));
        if (!s) throw new Error(`Speaking prompt ${it.speakingPromptId} missing`);
        prot.speakingModels[s.id] = { text: s.modelResponse, usefulLanguage: s.usefulLanguage };
        groups.push({
          kind: "speaking",
          id: s.id,
          part: s.partNumber as 1 | 2 | 3,
          level: s.level as Level,
          title: s.title,
          instructions: s.instructions,
          content: s.content as SpeakingContent,
          preparationSeconds: s.preparationSeconds,
          responseSeconds: s.responseSeconds,
          rubricId: s.rubricId,
        });
      }
    }
    pub.sections.push({ order: sec.sectionOrder, skill: sec.skill as Skill, timeLimitSeconds: sec.timeLimitSeconds, groups, questionCount: number });
  }
  const contentHash = createHash("sha256").update(JSON.stringify([pub, prot])).digest("hex");
  return { pub, prot, contentHash, version: bp.version };
}

/**
 * Creates (or reuses) the immutable snapshot for the blueprint's current version.
 * If the content changed without a version bump, the version is bumped so existing attempts keep their snapshot.
 */
export async function publishSnapshot(db: Db, blueprintId: string) {
  const built = await buildSnapshotPayload(db, blueprintId);
  const [latest] = await db
    .select()
    .from(blueprintSnapshots)
    .where(eq(blueprintSnapshots.blueprintId, blueprintId))
    .orderBy(desc(blueprintSnapshots.blueprintVersion))
    .limit(1);
  if (latest && latest.contentHash === built.contentHash) return latest;
  let version = built.version;
  if (latest && latest.blueprintVersion >= version) {
    version = latest.blueprintVersion + 1;
    await db.update(testBlueprints).set({ version, updatedAt: new Date() }).where(eq(testBlueprints.id, blueprintId));
    built.pub.blueprint.version = version;
  }
  const [row] = await db
    .insert(blueprintSnapshots)
    .values({ blueprintId, blueprintVersion: version, publicPayload: built.pub, protectedPayload: built.prot, contentHash: built.contentHash })
    .returning();
  return row!;
}

export async function latestSnapshot(db: Db, blueprintId: string) {
  const [row] = await db
    .select()
    .from(blueprintSnapshots)
    .where(and(eq(blueprintSnapshots.blueprintId, blueprintId)))
    .orderBy(desc(blueprintSnapshots.blueprintVersion))
    .limit(1);
  return row ?? null;
}

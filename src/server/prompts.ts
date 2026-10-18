import { and, asc, desc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import type { Db } from "./db/client";
import { speakingPrompts, speakingSubmissions, testBlueprints, testItems, testSections, writingPrompts, writingSubmissions } from "./db/schema";

/** Prompt ids used in mock tests are kept out of the open practice lists so mocks stay unseen. */
async function mockPromptIds(db: Db) {
  const rows = await db
    .select({ w: testItems.writingPromptId, s: testItems.speakingPromptId })
    .from(testItems)
    .innerJoin(testSections, eq(testSections.id, testItems.sectionId))
    .innerJoin(testBlueprints, eq(testBlueprints.id, testSections.blueprintId))
    .where(eq(testBlueprints.kind, "mock"));
  return new Set(rows.flatMap((r) => [r.w, r.s]).filter(Boolean) as string[]);
}

export async function listWritingPractice(db: Db, learnerId: string) {
  const hidden = await mockPromptIds(db);
  const prompts = (await db.select().from(writingPrompts).where(inArray(writingPrompts.status, ["reviewed", "published"])).orderBy(asc(writingPrompts.taskType), asc(writingPrompts.level))).filter((p) => !hidden.has(p.id));
  const subs = await db
    .select({ id: writingSubmissions.id, promptId: writingSubmissions.promptId, status: writingSubmissions.status, overallScore: writingSubmissions.overallScore, gradingStatus: writingSubmissions.gradingStatus, at: writingSubmissions.startedAt })
    .from(writingSubmissions)
    .where(and(eq(writingSubmissions.learnerId, learnerId), isNull(writingSubmissions.attemptId)))
    .orderBy(desc(writingSubmissions.startedAt));
  return prompts.map((p) => ({ prompt: p, submissions: subs.filter((s) => s.promptId === p.id) }));
}

export async function getWritingPrompt(db: Db, id: string, allowMock = false) {
  const [p] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, id));
  if (!p || p.status === "archived" || p.status === "draft") return null;
  if (!allowMock && (await mockPromptIds(db)).has(id)) return null;
  return p;
}

export async function listSpeakingPractice(db: Db, learnerId: string) {
  const hidden = await mockPromptIds(db);
  const prompts = (await db.select().from(speakingPrompts).where(inArray(speakingPrompts.status, ["reviewed", "published"])).orderBy(asc(speakingPrompts.partNumber), asc(speakingPrompts.level))).filter((p) => !hidden.has(p.id));
  const subs = await db
    .select({ id: speakingSubmissions.id, promptId: speakingSubmissions.promptId })
    .from(speakingSubmissions)
    .where(and(eq(speakingSubmissions.learnerId, learnerId), isNull(speakingSubmissions.attemptId)));
  return prompts.map((p) => ({ prompt: p, count: subs.filter((s) => s.promptId === p.id).length }));
}

export async function getSpeakingPrompt(db: Db, id: string) {
  const [p] = await db.select().from(speakingPrompts).where(eq(speakingPrompts.id, id));
  if (!p || p.status === "archived" || p.status === "draft") return null;
  if ((await mockPromptIds(db)).has(id)) return null;
  return p;
}

export async function listSpeakingSubmissions(db: Db, learnerId: string, promptId: string) {
  return db
    .select()
    .from(speakingSubmissions)
    .where(and(eq(speakingSubmissions.learnerId, learnerId), eq(speakingSubmissions.promptId, promptId), isNull(speakingSubmissions.attemptId)))
    .orderBy(desc(speakingSubmissions.submittedAt));
}

export async function listWritingHistory(db: Db, learnerId: string, promptId: string) {
  return db
    .select()
    .from(writingSubmissions)
    .where(and(eq(writingSubmissions.learnerId, learnerId), eq(writingSubmissions.promptId, promptId), isNull(writingSubmissions.attemptId), ne(writingSubmissions.status, "draft"), isNotNull(writingSubmissions.submittedAt)))
    .orderBy(desc(writingSubmissions.submittedAt));
}

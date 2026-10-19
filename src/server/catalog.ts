import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "./db/client";
import { blueprintSnapshots, examAttempts, testBlueprints } from "./db/schema";
import type { PublicSnapshot } from "@/domain/snapshot";
import type { ScoreSummary } from "./exam-engine";

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  kind: string;
  skill: string | null;
  targetLevel: string;
  durationMinutes: number;
  questionCount: number;
  topics: string[];
  inProgress: { id: string; mode: string }[];
  lastResult: { id: string; summary: ScoreSummary | null; at: Date } | null;
  attempts: number;
};

type SnapshotMeta = { questionCount: number; topics: string[] };

// Keyed by snapshot id; snapshots are immutable, so the summary never goes stale.
const metaCache = new Map<string, SnapshotMeta>();

function summarise(pub: PublicSnapshot): SnapshotMeta {
  return {
    questionCount: pub.sections.reduce((n, s) => n + s.questionCount, 0),
    topics: [...new Set(pub.sections.flatMap((s) => s.groups.map((g) => ("topic" in g ? g.topic : g.title))))].slice(0, 4),
  };
}

async function snapshotMeta(db: Db, blueprintIds: string[]) {
  if (!blueprintIds.length) return new Map<string, SnapshotMeta>();
  const versions = await db
    .select({ id: blueprintSnapshots.id, blueprintId: blueprintSnapshots.blueprintId })
    .from(blueprintSnapshots)
    .where(inArray(blueprintSnapshots.blueprintId, blueprintIds))
    .orderBy(asc(blueprintSnapshots.blueprintId), desc(blueprintSnapshots.blueprintVersion));
  const latest = new Map<string, string>();
  for (const v of versions) if (!latest.has(v.blueprintId)) latest.set(v.blueprintId, v.id);

  const missing = [...latest.values()].filter((id) => !metaCache.has(id));
  if (missing.length) {
    const rows = await db.select({ id: blueprintSnapshots.id, pub: blueprintSnapshots.publicPayload }).from(blueprintSnapshots).where(inArray(blueprintSnapshots.id, missing));
    for (const r of rows) metaCache.set(r.id, summarise(r.pub as PublicSnapshot));
  }
  return new Map([...latest].flatMap(([bpId, snapId]) => (metaCache.has(snapId) ? [[bpId, metaCache.get(snapId)!] as const] : [])));
}

/** Published tests with the learner's own progress. Only public snapshot data is read. */
export async function listCatalog(db: Db, learnerId: string | null, filter: { kind?: "mock" | "practice"; skill?: string; level?: string }) {
  const conds = [eq(testBlueprints.status, "published")];
  if (filter.kind) conds.push(eq(testBlueprints.kind, filter.kind));
  if (filter.skill) conds.push(eq(testBlueprints.skill, filter.skill));
  if (filter.level) conds.push(eq(testBlueprints.targetLevel, filter.level));
  const [bps, attempts] = await Promise.all([
    db.select().from(testBlueprints).where(and(...conds)).orderBy(asc(testBlueprints.targetLevel), asc(testBlueprints.id)),
    learnerId
      ? db
          .select({ id: examAttempts.id, blueprintId: examAttempts.blueprintId, status: examAttempts.status, mode: examAttempts.mode, summary: examAttempts.scoreSummary, at: examAttempts.startedAt })
          .from(examAttempts)
          .where(eq(examAttempts.learnerId, learnerId))
          .orderBy(desc(examAttempts.startedAt))
      : Promise.resolve([]),
  ]);
  const meta = await snapshotMeta(
    db,
    bps.map((b) => b.id),
  );
  const items: CatalogItem[] = [];
  for (const bp of bps) {
    const m = meta.get(bp.id);
    if (!m) continue;
    const mine = attempts.filter((a) => a.blueprintId === bp.id);
    const done = mine.find((a) => a.status !== "in_progress");
    items.push({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      kind: bp.kind,
      skill: bp.skill,
      targetLevel: bp.targetLevel,
      durationMinutes: Math.round(bp.durationSeconds / 60),
      questionCount: m.questionCount,
      topics: m.topics,
      inProgress: mine.filter((a) => a.status === "in_progress").map((a) => ({ id: a.id, mode: a.mode })),
      lastResult: done ? { id: done.id, summary: done.summary as ScoreSummary | null, at: done.at } : null,
      attempts: mine.length,
    });
  }
  return items;
}

import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { auditLogs, examSpecifications, rateLimits, scoringConfigs } from "./db/schema";
import { DEFAULT_EXAM_SPEC, DEFAULT_SCORING_CONFIG, examSpecSchema, scoringConfigSchema, type ExamSpec, type ScoringConfig } from "@/domain/spec";

export async function audit(actor: string, action: string, entityType: string, entityId: string | null, details?: unknown) {
  const db = await getDb();
  await db.insert(auditLogs).values({ actor, action, entityType, entityId, details: details ?? null });
}

/**
 * Fixed-window rate limiter stored in Postgres (works across serverless instances).
 * Returns true when the call is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = await getDb();
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });
  return (row?.count ?? 1) <= limit;
}

export async function cleanupRateLimits() {
  const db = await getDb();
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < now() - interval '2 days'`);
}

export async function getActiveSpec(): Promise<ExamSpec> {
  const db = await getDb();
  const [row] = await db.select().from(examSpecifications).where(eq(examSpecifications.isActive, true)).limit(1);
  const parsed = examSpecSchema.safeParse(row?.payload);
  return parsed.success ? parsed.data : DEFAULT_EXAM_SPEC;
}

export async function getScoringConfig(version?: string | null): Promise<ScoringConfig> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(scoringConfigs)
    .where(version ? eq(scoringConfigs.version, version) : and(eq(scoringConfigs.isActive, true)))
    .limit(1);
  const parsed = scoringConfigSchema.safeParse(row?.payload);
  return parsed.success ? parsed.data : DEFAULT_SCORING_CONFIG;
}

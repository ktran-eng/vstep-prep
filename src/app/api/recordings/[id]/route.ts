import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { blobs, speakingSubmissions } from "@/server/db/schema";
import { readLearnerId } from "@/server/identity";

/** Streams a learner's own recording. Other learners get 404 (no existence leak). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const learnerId = await readLearnerId();
  if (!learnerId || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const [row] = await db
    .select({ data: blobs.data, mime: blobs.mimeType })
    .from(speakingSubmissions)
    .innerJoin(blobs, eq(blobs.id, speakingSubmissions.audioBlobId))
    .where(and(eq(speakingSubmissions.id, id), eq(speakingSubmissions.learnerId, learnerId), eq(blobs.learnerId, learnerId)));
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.mime, "Cache-Control": "private, no-store", "Content-Length": String(row.data.length) },
  });
}

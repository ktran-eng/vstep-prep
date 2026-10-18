import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/server/db";
import { runRetention } from "@/server/maintenance";

/** Daily retention job. Call with `Authorization: Bearer $CRON_SECRET` (e.g. from Vercel Cron or any scheduler). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || got.length !== secret.length || !timingSafeEqual(Buffer.from(got), Buffer.from(secret))) return new Response("Unauthorized", { status: 401 });
  const result = await runRetention(await getDb());
  return Response.json({ ok: true, ...result });
}

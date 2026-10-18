import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { passages, speakingPrompts, writingPrompts } from "@/server/db/schema";
import { setPromptStatusAction } from "@/app/actions/admin";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Đề Viết/Nói & bài đọc" };
const STATUSES = ["draft", "validated", "reviewed", "published", "archived"];

function StatusForm({ kind, id, status }: { kind: string; id: string; status: string }) {
  return (
    <form action={setPromptStatusAction} className="flex items-center gap-1">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} aria-label={`Status of ${id}`} className="rounded border border-border bg-bg px-1 py-0.5 text-xs">
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <button className="text-xs text-primary hover:underline">Lưu</button>
    </form>
  );
}

export default async function PromptsAdmin() {
  const db = await getDb();
  const w = await db.select().from(writingPrompts).orderBy(asc(writingPrompts.id));
  const s = await db.select().from(speakingPrompts).orderBy(asc(speakingPrompts.id));
  const p = await db.select({ id: passages.id, title: passages.title, level: passages.level, wordCount: passages.wordCount, status: passages.status, provenance: passages.provenanceType }).from(passages).orderBy(asc(passages.id));
  const table = (title: string, rows: { id: string; title: string; meta: string; status: string; kind: string }[]) => (
    <Card className="mb-6">
      <h2 className="mb-2 font-semibold">
        {title} ({rows.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-1.5 pr-3 font-mono text-xs">{r.id}</td>
                <td className="pr-3">{r.title}</td>
                <td className="pr-3 text-muted">{r.meta}</td>
                <td>
                  <StatusForm kind={r.kind} id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
  return (
    <>
      <PageHeader title="Đề Viết/Nói & bài đọc" description="Nội dung gốc được biên soạn trong thư mục /content (quản lý phiên bản bằng git) và nạp bằng npm run db:seed. Trang này quản lý trạng thái phát hành." />
      {table("Bài đọc", p.map((x) => ({ id: x.id, title: x.title, meta: `${x.level} · ${x.wordCount} từ · ${x.provenance}`, status: x.status, kind: "passage" })))}
      {table("Đề Viết", w.map((x) => ({ id: x.id, title: x.title, meta: `${x.taskType} · ${x.level} · ≥${x.minWords} từ · rubric ${x.rubricId}`, status: x.status, kind: "writing" })))}
      {table("Đề Nói", s.map((x) => ({ id: x.id, title: x.title, meta: `Part ${x.partNumber} · ${x.level} · ${x.preparationSeconds}s/${x.responseSeconds}s`, status: x.status, kind: "speaking" })))}
    </>
  );
}

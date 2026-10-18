import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { listQuestions } from "@/server/admin";
import { setQuestionStatusAction } from "@/app/actions/admin";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Ngân hàng câu hỏi" };
const STATUSES = ["draft", "validated", "reviewed", "published", "archived"];

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const r = await listQuestions(await getDb(), { skill: sp.skill, level: sp.level, status: sp.status, q: sp.q?.slice(0, 100) }, page);
  const pages = Math.max(1, Math.ceil(r.total / r.pageSize));
  const qs = (o: Record<string, string | number>) => "?" + new URLSearchParams({ ...(Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Record<string, string>), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) }).toString();
  return (
    <>
      <PageHeader title="Ngân hàng câu hỏi" description={`${r.total} câu. Quy trình: draft → validated → reviewed → published → archived. Sửa câu hỏi sẽ tăng phiên bản và tạo snapshot đề mới; bài làm cũ giữ nguyên phiên bản cũ.`} />
      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <label>
          Kỹ năng
          <select name="skill" defaultValue={sp.skill ?? ""} className="ml-1 rounded border border-border bg-bg px-2 py-1">
            <option value="">—</option>
            <option value="reading">reading</option>
            <option value="listening">listening</option>
          </select>
        </label>
        <label>
          Trình độ
          <select name="level" defaultValue={sp.level ?? ""} className="ml-1 rounded border border-border bg-bg px-2 py-1">
            <option value="">—</option>
            {["B1", "B2", "C1"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select name="status" defaultValue={sp.status ?? ""} className="ml-1 rounded border border-border bg-bg px-2 py-1">
            <option value="">—</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Tìm
          <input name="q" defaultValue={sp.q ?? ""} className="ml-1 rounded border border-border bg-bg px-2 py-1" />
        </label>
        <button className="rounded border border-border px-3 py-1">Lọc</button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Câu hỏi</th>
              <th className="px-3 py-2">Kỹ năng/Trình độ</th>
              <th className="px-3 py-2">Dạng</th>
              <th className="px-3 py-2">v</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {r.items.map((q) => (
              <tr key={q.id} className="border-t border-border align-top">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link href={`/admin/content/${q.id}`} className="text-primary hover:underline">
                    {q.id}
                  </Link>
                </td>
                <td className="max-w-md px-3 py-2">{q.prompt}</td>
                <td className="px-3 py-2">
                  {q.skill} · {q.level}
                </td>
                <td className="px-3 py-2">{q.taskType}</td>
                <td className="px-3 py-2 tabular-nums">{q.version}</td>
                <td className="px-3 py-2">
                  <form action={setQuestionStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={q.id} />
                    <select name="status" defaultValue={q.status} aria-label={`Status of ${q.id}`} className="rounded border border-border bg-bg px-1 py-0.5 text-xs">
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button className="text-xs text-primary hover:underline">Lưu</button>
                  </form>
                  <Badge className="mt-1">{q.provenanceType}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-3 flex items-center gap-3 text-sm">
        {page > 1 && <Link href={qs({ page: page - 1 })}>← Trước</Link>}
        <span>
          Trang {page}/{pages}
        </span>
        {page < pages && <Link href={qs({ page: page + 1 })}>Sau →</Link>}
      </nav>
    </>
  );
}

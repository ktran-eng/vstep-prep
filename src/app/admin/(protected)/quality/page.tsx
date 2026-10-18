import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { itemStatistics } from "@/server/admin";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Thống kê câu hỏi" };

export default async function QualityPage() {
  const rows = await itemStatistics(await getDb());
  const flagged = rows.filter((r) => r.flags.length);
  return (
    <>
      <PageHeader
        title="Thống kê chất lượng câu hỏi"
        description="Độ khó thực nghiệm (p = tỉ lệ trả lời đúng) và phân bố lựa chọn từ các bài đã nộp. Chỉ gắn cờ khi có ≥ 10 lượt trả lời; với mẫu nhỏ, các con số chỉ mang tính tham khảo."
      />
      <p className="mb-3 text-sm">
        {flagged.length} câu bị gắn cờ · {rows.filter((r) => r.n > 0).length}/{rows.length} câu đã có dữ liệu
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted">
            <tr>
              {["ID", "Kỹ năng", "Dạng", "Độ khó dự kiến", "n", "p", "Phân bố (đáp án)", "Bỏ trống", "Cờ"].map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-1.5 font-mono text-xs">
                  <Link href={`/admin/content/${r.id}`} className="text-primary hover:underline">
                    {r.id}
                  </Link>
                </td>
                <td className="px-3">
                  {r.skill} {r.level}
                </td>
                <td className="px-3">{r.type}</td>
                <td className="px-3 tabular-nums">{r.difficulty}/5</td>
                <td className="px-3 tabular-nums">{r.n}</td>
                <td className="px-3 tabular-nums">{r.p == null ? "—" : r.p.toFixed(2)}</td>
                <td className="px-3 font-mono text-xs">
                  {["A", "B", "C", "D"].map((k) => (
                    <span key={k} className={k === r.key ? "font-bold text-success" : ""}>
                      {k}:{r.choices[k] ?? 0}{" "}
                    </span>
                  ))}
                </td>
                <td className="px-3 tabular-nums">{r.blank}</td>
                <td className="px-3">
                  {r.flags.map((f) => (
                    <Badge key={f} tone="warning">
                      {f}
                    </Badge>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { recentAudit } from "@/server/admin";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Nhật ký" };

export default async function AuditPage() {
  const rows = await recentAudit(await getDb());
  return (
    <>
      <PageHeader title="Nhật ký quản trị" description="200 thao tác quản trị gần nhất (đăng nhập, đổi trạng thái, sửa câu hỏi, cấu hình). Không ghi nội dung bài làm của người học." />
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted">
            <tr>
              {["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Chi tiết"].map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-3 py-1.5 whitespace-nowrap">{r.createdAt.toLocaleString("vi-VN")}</td>
                <td className="px-3">{r.actor}</td>
                <td className="px-3 font-mono text-xs">{r.action}</td>
                <td className="px-3 font-mono text-xs">
                  {r.entityType}/{r.entityId}
                </td>
                <td className="px-3 font-mono text-xs">{r.details ? JSON.stringify(r.details) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

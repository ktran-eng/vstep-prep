import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { testBlueprints } from "@/server/db/schema";
import { snapshotsFor } from "@/server/admin";
import { republishAction, setBlueprintStatusAction } from "@/app/actions/admin";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Đề thi" };

export default async function TestsAdmin() {
  const db = await getDb();
  const bps = await db.select().from(testBlueprints).orderBy(asc(testBlueprints.kind), asc(testBlueprints.id));
  const snaps = await snapshotsFor(db, bps.map((b) => b.id));
  return (
    <>
      <PageHeader
        title="Đề thi & bài luyện"
        description="Cấu trúc đề được biên soạn trong content/blueprints.ts và kiểm tra theo đặc tả (số câu, thời gian, phân bố phần). Mỗi lần xuất bản tạo một snapshot bất biến; bài làm luôn gắn với snapshot đã dùng."
      />
      <div className="space-y-3">
        {bps.map((b) => {
          const s = snaps.filter((x) => x.blueprintId === b.id);
          return (
            <Card key={b.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {b.name} <span className="font-mono text-xs text-muted">{b.id}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {b.kind} · {b.skill ?? "4 kỹ năng"} · {b.targetLevel} · {Math.round(b.durationSeconds / 60)} phút · spec {b.specificationVersion}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Phiên bản hiện tại v{b.version} · {s.length} snapshot{s[0] ? ` · mới nhất v${s[0].version} (${s[0].createdAt.toLocaleString("vi-VN")})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.status === "published" ? "success" : "neutral"}>{b.status}</Badge>
                  <form action={setBlueprintStatusAction} className="flex gap-1">
                    <input type="hidden" name="id" value={b.id} />
                    <select name="status" defaultValue={b.status} aria-label={`Status of ${b.id}`} className="rounded border border-border bg-bg px-1 py-0.5 text-xs">
                      {["draft", "published", "archived"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <button className="text-xs text-primary hover:underline">Lưu</button>
                  </form>
                  <form action={republishAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="text-xs text-primary hover:underline">Tạo snapshot</button>
                  </form>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

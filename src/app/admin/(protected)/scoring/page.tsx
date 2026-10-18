import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { examSpecifications, scoringConfigs } from "@/server/db/schema";
import { activateConfigAction } from "@/app/actions/admin";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ConfigEditor } from "./editor";
import { RUBRICS } from "@/domain/rubrics";

export const metadata: Metadata = { title: "Đặc tả & chấm điểm" };

export default async function ScoringAdmin() {
  const db = await getDb();
  const specs = await db.select().from(examSpecifications).orderBy(desc(examSpecifications.createdAt));
  const scs = await db.select().from(scoringConfigs).orderBy(desc(scoringConfigs.createdAt));
  const activeSpec = specs.find((s) => s.isActive) ?? specs[0];
  const activeSc = scs.find((s) => s.isActive) ?? scs[0];
  const versions = (kind: "spec" | "scoring", rows: typeof specs) => (
    <ul className="mt-2 space-y-1 text-sm">
      {rows.map((r) => (
        <li key={r.version} className="flex items-center gap-2">
          <span className="font-mono">{r.version}</span>
          {r.isActive ? (
            <Badge tone="success">active</Badge>
          ) : (
            <form action={activateConfigAction}>
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="version" value={r.version} />
              <button className="text-xs text-primary hover:underline">Kích hoạt</button>
            </form>
          )}
          <span className="text-xs text-muted">
            {r.createdBy} · {r.createdAt.toLocaleString("vi-VN")}
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <PageHeader
        title="Đặc tả đề thi & cấu hình chấm điểm"
        description="Thay đổi được lưu thành phiên bản mới (không ghi đè). Bài làm đã nộp giữ phiên bản cấu hình chấm đã dùng. Thay đổi đặc tả chỉ áp dụng khi kiểm tra/biên soạn đề mới."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Đặc tả đề thi</h2>
          {versions("spec", specs)}
          <ConfigEditor kind="spec" initial={JSON.stringify(activeSpec?.payload ?? {}, null, 2)} />
        </Card>
        <Card>
          <h2 className="font-semibold">Cấu hình chấm điểm (ước tính)</h2>
          {versions("scoring", scs)}
          <ConfigEditor kind="scoring" initial={JSON.stringify(activeSc?.payload ?? {}, null, 2)} />
          <p className="mt-2 text-xs text-muted">objectiveEstimate.method: &quot;linear&quot; hoặc &quot;table&quot; với các điểm {"{accuracy, score}"}. Trường official luôn là false.</p>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="mb-2 font-semibold">Rubric luyện tập (phiên bản trong mã nguồn)</h2>
        {RUBRICS.map((r) => (
          <details key={r.id} className="mb-2 text-sm">
            <summary className="cursor-pointer">
              {r.name} <Badge>{r.isOfficial ? "official" : "practice rubric"}</Badge>
            </summary>
            <p className="mt-1 text-muted">{r.notes}</p>
            <ul className="ml-5 list-disc">
              {r.criteria.map((c) => (
                <li key={c.key}>
                  <b>{c.name}</b>: {c.description}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </Card>
    </>
  );
}

import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { sources } from "@/server/db/schema";
import { updateSourceAction } from "@/app/actions/admin";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Nguồn" };

export default async function SourcesAdmin() {
  const rows = await (await getDb()).select().from(sources).orderBy(asc(sources.id));
  return (
    <>
      <PageHeader title="Danh mục nguồn" description="Bản gốc nằm trong content/sources.json (nạp khi seed). Cập nhật ngày kiểm tra và độ tin cậy sau khi xác minh lại liên kết." />
      <div className="space-y-3">
        {rows.map((s) => (
          <Card key={s.id}>
            <p className="font-semibold">{s.title}</p>
            <p className="text-sm text-muted">
              {s.publisher} · <Badge>{s.sourceType}</Badge> <Badge>{s.permissionStatus}</Badge> <Badge>{s.licenseType}</Badge>
            </p>
            {s.canonicalUrl && (
              <a href={s.canonicalUrl} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-primary hover:underline">
                {s.canonicalUrl}
              </a>
            )}
            <form action={updateSourceAction} className="mt-2 grid gap-2 text-sm md:grid-cols-[10rem_8rem_1fr_auto] md:items-end">
              <input type="hidden" name="id" value={s.id} />
              <label>
                Kiểm tra lần cuối
                <input type="date" name="lastVerifiedAt" defaultValue={s.lastVerifiedAt ?? ""} className="block w-full rounded border border-border bg-bg px-2 py-1" />
              </label>
              <label>
                Độ tin cậy
                <select name="confidence" defaultValue={s.confidence} className="block w-full rounded border border-border bg-bg px-2 py-1">
                  {["high", "medium", "low"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Ghi chú
                <input name="notes" defaultValue={s.notes ?? ""} className="block w-full rounded border border-border bg-bg px-2 py-1" />
              </label>
              <button className="rounded border border-border px-3 py-1">Lưu</button>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { audioAssets, transcripts } from "@/server/db/schema";
import { setAudioQualityAction } from "@/app/actions/admin";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Audio" };

export default async function AudioAdmin() {
  const db = await getDb();
  const rows = await db.select().from(audioAssets).orderBy(asc(audioAssets.id));
  const trs = await db.select().from(transcripts);
  return (
    <>
      <PageHeader title="Audio" description="Nghe từng bản, đối chiếu với transcript (phát âm, bị cắt, độ rõ, khớp nội dung) rồi duyệt hoặc từ chối." />
      <Notice tone="warning" className="mb-4">
        Audio phát triển được tạo bằng giọng Windows (SAPI) — chấp nhận được cho thử nghiệm, nhưng nên tạo lại bằng nhà cung cấp TTS chất lượng cao (npm run audio:generate -- --provider openai --force) hoặc thu âm thật trước khi dùng cho người học thật, rồi duyệt lại.
      </Notice>
      <div className="space-y-3">
        {rows.map((a) => {
          const tr = trs.find((x) => x.id === a.transcriptId);
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{a.title}</p>
                <span className="font-mono text-xs text-muted">{a.id}</span>
                <Badge>Part {a.part}</Badge>
                <Badge>{a.level}</Badge>
                <Badge>{a.generationMethod}</Badge>
                <Badge tone={a.qualityStatus === "approved" ? "success" : a.qualityStatus === "rejected" ? "danger" : "warning"}>{a.qualityStatus}</Badge>
                {a.durationSeconds != null && <span className="text-xs text-muted">{a.durationSeconds}s</span>}
              </div>
              {a.storageKey ? (
                <audio controls preload="none" src={`/audio/${a.storageKey}`} className="mt-2 w-full" />
              ) : (
                <p className="mt-2 text-sm text-danger">Chưa có tệp audio.</p>
              )}
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-muted">Transcript</summary>
                {tr?.segments.map((s) => (
                  <p key={s.id}>
                    <span className="font-mono text-xs text-muted">{s.id}</span> <b>{s.speaker}:</b> {s.text}
                  </p>
                ))}
              </details>
              <form action={setAudioQualityAction} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={a.id} />
                <input name="note" placeholder="Ghi chú kiểm duyệt" className="rounded border border-border bg-bg px-2 py-1" />
                <button name="quality" value="approved" className="rounded border border-success px-2 py-1 text-success">
                  Duyệt
                </button>
                <button name="quality" value="rejected" className="rounded border border-danger px-2 py-1 text-danger">
                  Từ chối
                </button>
                <button name="quality" value="unreviewed" className="rounded border border-border px-2 py-1">
                  Đặt lại
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}

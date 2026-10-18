import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { listSpeakingPractice } from "@/server/prompts";
import { aiGradingConfigured } from "@/server/grading/service";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Luyện Nói" };

const PART = { 1: "Part 1 · Tương tác xã hội", 2: "Part 2 · Thảo luận giải pháp", 3: "Part 3 · Phát triển chủ đề" } as Record<number, string>;

export default async function SpeakingListPage() {
  const learnerId = await requireLearner();
  const { t } = await getDict();
  const rows = await listSpeakingPractice(await getDb(), learnerId);
  const ai = aiGradingConfigured();
  return (
    <>
      <PageHeader
        title={t.nav.speaking}
        crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.speaking }]}
        description="Ghi âm câu trả lời trong trình duyệt, nghe lại và tự đánh giá. Bản ghi chỉ được tải lên khi bạn bấm Nộp."
      />
      {!(ai.writing && ai.transcription) && (
        <Notice tone="warning" className="mb-5" title="Nhận xét tự động chưa được bật">
          Máy chủ chưa cấu hình dịch vụ chép lời/AI. Bạn vẫn có thể ghi âm, nghe lại, tự đánh giá theo checklist và xem câu trả lời mẫu.
        </Notice>
      )}
      {[1, 2, 3].map((part) => (
        <section key={part} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{PART[part]}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {rows
              .filter((r) => r.prompt.partNumber === part)
              .map(({ prompt, count }) => (
                <Card key={prompt.id} as="article">
                  <div className="flex gap-2">
                    <Badge tone="primary">{prompt.level}</Badge>
                    <Badge>{prompt.topic}</Badge>
                  </div>
                  <h3 className="mt-2 font-semibold">
                    <Link href={`/learn/speaking/${prompt.id}`} className="hover:underline">
                      {prompt.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {prompt.preparationSeconds ? `Chuẩn bị ${prompt.preparationSeconds}s · ` : ""}Nói tối đa {Math.round(prompt.responseSeconds / 60)} phút · {count} lần đã nộp
                  </p>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}

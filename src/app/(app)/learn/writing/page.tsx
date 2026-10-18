import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { listWritingPractice } from "@/server/prompts";
import { aiGradingConfigured } from "@/server/grading/service";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Luyện Viết" };

export default async function WritingListPage() {
  const learnerId = await requireLearner();
  const { t } = await getDict();
  const rows = await listWritingPractice(await getDb(), learnerId);
  const ai = aiGradingConfigured();
  return (
    <>
      <PageHeader
        title={t.nav.writing}
        crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.writing }]}
        description="Task 1: thư/email khoảng 120 từ (1/3 điểm). Task 2: bài luận khoảng 250 từ (2/3 điểm). Bài làm được lưu tự động; sau khi nộp bạn nhận nhận xét theo tiêu chí và bài mẫu."
      />
      {!ai.writing && (
        <Notice tone="warning" className="mb-5" title="Chấm tự động chưa được bật">
          Máy chủ chưa cấu hình nhà cung cấp AI. Bài viết vẫn được lưu và bạn có thể so sánh với bài mẫu, nhưng sẽ không có điểm ước tính.
        </Notice>
      )}
      {(["letter", "essay"] as const).map((task) => (
        <section key={task} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{task === "letter" ? "Task 1 · Thư / Email" : "Task 2 · Bài luận"}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows
              .filter((r) => r.prompt.taskType === task)
              .map(({ prompt, submissions }) => {
                const done = submissions.filter((s) => s.status === "submitted");
                const draft = submissions.find((s) => s.status === "draft");
                const best = Math.max(...done.map((s) => s.overallScore ?? -1));
                return (
                  <Card key={prompt.id} as="article">
                    <div className="flex gap-2">
                      <Badge tone="primary">{prompt.level}</Badge>
                      <Badge>{prompt.topic}</Badge>
                    </div>
                    <h3 className="mt-2 font-semibold">
                      <Link href={`/learn/writing/${prompt.id}`} className="hover:underline">
                        {prompt.title}
                      </Link>
                    </h3>
                    <p className="mt-1 line-clamp-3 text-sm text-muted">{prompt.stimulus ?? prompt.instructions}</p>
                    <p className="mt-2 text-xs text-muted">
                      {done.length} lần nộp{best >= 0 ? ` · cao nhất ${best.toFixed(1)}/10 (ước tính)` : ""}
                      {draft ? " · có bản nháp" : ""}
                    </p>
                    <Link href={`/learn/writing/${prompt.id}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                      {draft ? "Tiếp tục viết →" : "Bắt đầu viết →"}
                    </Link>
                  </Card>
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}

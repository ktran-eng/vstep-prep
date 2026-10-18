import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { getReviewItems } from "@/server/review";
import { Badge, Card, EmptyState, PageHeader, cx } from "@/components/ui";
import { Highlight } from "@/components/highlight";
import { ReviewControls } from "@/components/review-controls";
import { TYPE_LABELS, SKILL_VI } from "@/domain/labels";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Ôn lỗi sai" };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ skill?: string; status?: string }> }) {
  const sp = await searchParams;
  const learnerId = await requireLearner();
  const { t } = await getDict();
  const skill = sp.skill === "reading" || sp.skill === "listening" ? sp.skill : undefined;
  const status = sp.status === "reviewed" ? "reviewed" : "to_review";
  const items = await getReviewItems(await getDb(), learnerId, { skill, status });
  const q = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ skill, status, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <PageHeader
        title={t.nav.review}
        crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.review }]}
        description="Sổ lỗi sai tự động tổng hợp các câu bạn làm sai hoặc bỏ trống trong các bài đã nộp, kèm giải thích và căn cứ. Đánh dấu “Đã ôn xong” khi bạn đã hiểu."
      />
      <nav aria-label="Filters" className="mb-5 flex flex-wrap gap-2 text-sm">
        {[
          { label: "Cần ôn", href: q({ status: "to_review" }), active: status === "to_review" },
          { label: "Đã ôn", href: q({ status: "reviewed" }), active: status === "reviewed" },
        ].map((f) => (
          <Link key={f.label} href={f.href} aria-current={f.active ? "page" : undefined} className={cx("rounded-full border px-3 py-1", f.active ? "border-primary bg-primary-soft text-primary" : "border-border")}>
            {f.label}
          </Link>
        ))}
        <span className="mx-2 border-l border-border" />
        {[undefined, "reading", "listening"].map((s) => (
          <Link key={s ?? "all"} href={q({ skill: s ?? "" })} aria-current={skill === s ? "page" : undefined} className={cx("rounded-full border px-3 py-1", skill === s ? "border-primary bg-primary-soft text-primary" : "border-border")}>
            {s ? SKILL_VI[s] : t.common.all}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <EmptyState title={status === "reviewed" ? "Chưa có câu nào được đánh dấu đã ôn" : "Không có lỗi sai cần ôn"}>Hoàn thành bài luyện Đọc hoặc Nghe để các câu sai xuất hiện ở đây.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.questionId}>
              <Card>
                <p className="text-xs text-muted">
                  {SKILL_VI[it.skill]} · {it.testName} · {it.groupTitle} · {it.at.toLocaleDateString("vi-VN")}
                </p>
                <p className="mt-1 font-medium">
                  {it.question.prompt} <Badge>{TYPE_LABELS[it.question.type]}</Badge>
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {it.question.options.map((o) => (
                    <li key={o.key} className={o.key === it.answer ? "font-medium text-success" : o.key === it.response ? "text-danger line-through" : ""}>
                      {o.key}. {o.text}
                      {o.key === it.answer && " ✓"}
                    </li>
                  ))}
                </ul>
                {!it.response && <p className="mt-1 text-xs text-warning">Bạn đã bỏ trống câu này.</p>}
                <p className="mt-2 text-sm">{it.explanation}</p>
                {it.context && (
                  <blockquote className="mt-2 rounded-md border-l-4 border-warning bg-surface-2 p-2 text-sm">
                    <Highlight text={it.context} quote={it.evidenceQuote} />
                  </blockquote>
                )}
                <ReviewControls questionId={it.questionId} attemptId={it.attemptId} bookmark={it.bookmark} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

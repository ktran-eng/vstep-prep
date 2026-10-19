import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { listCatalog } from "@/server/catalog";
import { latestSnapshot } from "@/server/snapshots";
import { startAttemptAction } from "@/app/actions/exam";
import { Badge, Button, ButtonLink, Card, Notice, PageHeader, SkillDot } from "@/components/ui";
import type { PublicSnapshot } from "@/domain/snapshot";
import { SKILL_VI } from "@/domain/labels";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Tổng quan đề thi" };

const DETAIL: Record<string, (s: PublicSnapshot["sections"][number]) => string> = {
  listening: (s) => `${s.questionCount} câu · ${s.groups.length} bài nghe (thông báo, hội thoại, bài giảng)`,
  reading: (s) => `${s.questionCount} câu · ${s.groups.length} bài đọc, độ khó tăng dần B1 → C1`,
  writing: () => "Task 1: thư/email ≥ 120 từ (1/3 điểm) · Task 2: bài luận ≥ 250 từ (2/3 điểm)",
  speaking: () => "Phần 1: tương tác xã hội · Phần 2: thảo luận giải pháp · Phần 3: phát triển chủ đề",
};

export default async function MockOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const learnerId = await requireLearner();
  const db = await getDb();
  const { t } = await getDict();
  const item = (await listCatalog(db, learnerId, { kind: "mock" })).find((i) => i.id === id);
  const snap = item && (await latestSnapshot(db, id));
  if (!item || !snap) notFound();
  const pub = snap.publicPayload as PublicSnapshot;

  const start = (mode: "exam" | "practice", label: string, variant: "primary" | "secondary") => {
    const resume = item.inProgress.find((a) => a.mode === mode);
    if (resume)
      return (
        <ButtonLink href={`/attempt/${resume.id}`} variant={variant}>
          {t.common.resume} ({mode === "exam" ? t.exam.examMode : t.exam.practiceMode})
        </ButtonLink>
      );
    return (
      <form action={startAttemptAction}>
        <input type="hidden" name="blueprintId" value={id} />
        <input type="hidden" name="mode" value={mode} />
        <Button type="submit" variant={variant}>
          {label}
        </Button>
      </form>
    );
  };

  return (
    <>
      <PageHeader
        title={item.name}
        crumbs={[{ href: "/mock", label: t.nav.mock }, { label: t.exam.overview }]}
        description="Đề thi đầy đủ 4 kỹ năng theo định dạng QĐ 729/QĐ-BGDĐT. Một đề dùng chung cho mọi trình độ; bậc B1/B2/C1 được ước tính từ điểm trung bình 4 kỹ năng."
      />
      <ol className="mb-6 grid gap-3 md:grid-cols-2">
        {pub.sections.map((s) => (
          <li key={s.order}>
            <Card className="h-full">
              <p className="flex items-center gap-2 font-semibold">
                <SkillDot skill={s.skill} /> {s.order + 1}. {SKILL_VI[s.skill]} <Badge>{Math.round(s.timeLimitSeconds / 60)} phút</Badge>
              </p>
              <p className="mt-1 text-sm text-muted">{DETAIL[s.skill]?.(s)}</p>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <h2 className="font-semibold">{t.exam.examMode}</h2>
          <p className="mt-1 flex-1 text-sm text-muted">{t.exam.examModeDesc} Làm lần lượt Nghe → Đọc → Viết → Nói; không quay lại phần đã kết thúc.</p>
          <div className="mt-4">{start("exam", t.exam.startExam, "primary")}</div>
        </Card>
        <Card className="flex flex-col">
          <h2 className="font-semibold">{t.exam.practiceMode}</h2>
          <p className="mt-1 flex-1 text-sm text-muted">{t.exam.practiceModeDesc} Có thể chọn làm phần bất kỳ trước (ví dụ vào thẳng Reading).</p>
          <div className="mt-4">{start("practice", t.exam.startPractice, "secondary")}</div>
        </Card>
      </div>
      <Notice tone="warning">
        Nội dung gốc mô phỏng định dạng VSTEP, không phải đề thi chính thức. Phần Nói cần micro; phần Nghe dùng giọng đọc tổng hợp (đã ghi nhãn). {t.common.estimateDisclaimer}
      </Notice>
    </>
  );
}

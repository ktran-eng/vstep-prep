import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { listCatalog } from "@/server/catalog";
import { getActiveSpec } from "@/server/ops";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { TestCard } from "@/components/test-card";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Đề thi thử" };

export default async function MockPage() {
  const learnerId = await requireLearner();
  const { t } = await getDict();
  const items = await listCatalog(await getDb(), learnerId, { kind: "mock" });
  const spec = await getActiveSpec();
  return (
    <>
      <PageHeader
        title={t.nav.mock}
        crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.mock }]}
        description="Đề thi đầy đủ 4 kỹ năng theo cấu trúc VSTEP.3–5. Một đề dùng chung cho mọi trình độ B1–C1; bậc được ước tính từ điểm trung bình."
      />
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Notice tone="warning" title={t.exam.examMode}>
          {t.exam.examModeDesc} Mỗi phần có giờ riêng: Nghe {spec.listening.minutes}′, Đọc {spec.reading.minutes}′, Viết {spec.writing.minutes}′, Nói {spec.speaking.minutes}′. Không thể quay lại phần đã kết thúc.
        </Notice>
        <Notice tone="primary" title={t.exam.practiceMode}>
          {t.exam.practiceModeDesc}
        </Notice>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Chưa có đề thi được xuất bản" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <TestCard key={it.id} item={it} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">{t.common.originalContent} Có thể làm một phần trong một buổi và quay lại sau: bài làm được lưu tự động; ở chế độ thi, đồng hồ của phần đang làm vẫn tiếp tục chạy.</p>
    </>
  );
}

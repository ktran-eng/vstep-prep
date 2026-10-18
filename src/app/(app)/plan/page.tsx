import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { getLearnerProfile, requireLearner } from "@/server/identity";
import { getWeeklyPlan } from "@/server/study-plan";
import { regeneratePlanAction, togglePlanTaskAction } from "@/app/actions/learner";
import { Badge, Button, ButtonLink, Card, PageHeader, ProgressBar } from "@/components/ui";
import { daysUntil } from "@/domain/study-plan";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Kế hoạch học" };
const DAY = ["", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

export default async function PlanPage() {
  const learnerId = await requireLearner();
  const db = await getDb();
  const { t } = await getDict();
  const [{ prefs }, plan] = await Promise.all([getLearnerProfile(learnerId), getWeeklyPlan(db, learnerId)]);
  const done = plan.tasks.filter((x) => x.completedAt).length;
  const left = daysUntil(prefs?.targetExamDate ?? null, new Date().toISOString().slice(0, 10));
  return (
    <>
      <PageHeader
        title={t.nav.plan}
        crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.plan }]}
        description={`Tuần bắt đầu ${new Date(plan.week).toLocaleDateString("vi-VN")}. Mục tiêu ${prefs?.targetLevel ?? "B1"}, ${prefs?.studyMinutesPerDay ?? 45} phút/ngày${left != null && left >= 0 ? `, còn ${left} ngày đến kỳ thi` : ""}.`}
        actions={
          <>
            <ButtonLink href="/settings" variant="secondary">
              Đổi lịch học
            </ButtonLink>
            <form action={regeneratePlanAction}>
              <Button type="submit" variant="secondary">
                Tạo lại kế hoạch
              </Button>
            </form>
          </>
        }
      />
      <Card className="mb-4">
        <p className="mb-2 text-sm">
          Hoàn thành {done}/{plan.tasks.length} hoạt động
        </p>
        <ProgressBar value={done} max={plan.tasks.length || 1} label="Plan progress" tone="success" />
        <p className="mt-2 text-xs text-muted">
          Hoạt động được tự động đánh dấu khi bạn nộp bài thuộc kỹ năng tương ứng trong tuần. Kế hoạch dựa trên kết quả gần đây và thời gian bạn có; nó giúp học đều đặn nhưng không đảm bảo mức điểm cụ thể.
        </p>
      </Card>
      <ol className="space-y-3">
        {plan.tasks.map((x) => (
          <li key={x.id}>
            <Card className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">
                  {DAY[x.dayOfWeek]} · {x.minutes} phút
                </p>
                <p className="font-medium">
                  <Link href={x.href} className="hover:underline">
                    {x.activity}
                  </Link>{" "}
                  <Badge>{x.skill === "mock" ? "Đề thi thử" : x.skill}</Badge>
                </p>
                <p className="text-sm text-muted">Vì sao: {x.reason}</p>
              </div>
              <form action={togglePlanTaskAction}>
                <input type="hidden" name="id" value={x.id} />
                <input type="hidden" name="done" value={x.completedAt ? "0" : "1"} />
                <Button type="submit" variant={x.completedAt ? "ghost" : "secondary"} aria-pressed={Boolean(x.completedAt)}>
                  {x.completedAt ? "✓ Đã xong" : "Đánh dấu xong"}
                </Button>
              </form>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}

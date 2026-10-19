import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { getLearnerProfile, requireLearner } from "@/server/identity";
import { getDashboard } from "@/server/analytics";
import { getWeeklyPlan } from "@/server/study-plan";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, ProgressBar, Stat } from "@/components/ui";
import { HBarChart, TrendChart, WeeklyBars } from "@/components/charts";
import { TYPE_LABELS, SKILL_VI } from "@/domain/labels";
import { SPEAKING_RUBRIC, WRITING_RUBRIC } from "@/domain/rubrics";
import { daysUntil } from "@/domain/study-plan";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Tổng quan" };

const SKILLS = ["listening", "reading", "writing", "speaking"] as const;
const DAY = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default async function DashboardPage() {
  const learnerId = await requireLearner();
  const db = await getDb();
  const { t } = await getDict();
  const [{ learner }, dash, plan] = await Promise.all([getLearnerProfile(learnerId), getDashboard(db, learnerId), getWeeklyPlan(db, learnerId)]);
  const left = daysUntil(dash.targetExamDate, new Date().toISOString().slice(0, 10));
  const planDone = plan.tasks.filter((x) => x.completedAt).length;
  const isNew = dash.counts.sessions === 0;

  return (
    <>
      <PageHeader
        title={learner?.displayName || learner?.username ? `Xin chào, ${learner.displayName || learner.username}` : t.nav.dashboard}
        description={
          <>
            Mục tiêu: <Badge tone="primary">{dash.targetLevel}</Badge>
            {left != null && left >= 0 && <span className="ml-2">· còn {left} ngày đến ngày thi dự kiến</span>}
          </>
        }
        actions={<ButtonLink href="/settings" variant="secondary">Mục tiêu & lịch học</ButtonLink>}
      />

      {!learner?.onboardedAt && (
        <Card className="mb-6 border-primary">
          <h2 className="font-semibold">Bắt đầu: đặt mục tiêu của bạn</h2>
          <p className="mt-1 text-sm text-muted">Chọn trình độ mục tiêu (B1/B2/C1), ngày thi dự kiến và thời gian học mỗi ngày để nhận kế hoạch học hàng tuần.</p>
          <ButtonLink href="/settings?onboarding=1" className="mt-3">
            Thiết lập mục tiêu
          </ButtonLink>
        </Card>
      )}

      {dash.counts.inProgress.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-2 font-semibold">Bài đang làm dở</h2>
          <ul className="space-y-1 text-sm">
            {dash.counts.inProgress.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>
                  {a.name} <Badge>{a.mode === "exam" ? t.exam.examMode : t.exam.practiceMode}</Badge>
                </span>
                <ButtonLink href={`/attempt/${a.id}`} variant="secondary">
                  {t.common.resume}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-label="Summary" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Buổi luyện tập" value={dash.counts.sessions} hint="bài đã nộp" />
        <Stat label="Đề thi thử đầy đủ" value={dash.counts.mocks} />
        <Stat label="Thời gian học" value={`${dash.counts.studyMinutes}′`} hint="từ các bài đã nộp" />
        <Stat label="Kế hoạch tuần này" value={`${planDone}/${plan.tasks.length}`} hint={<Link href="/plan" className="underline">xem kế hoạch</Link>} />
      </section>

      {isNew ? (
        <EmptyState
          title="Chưa có dữ liệu luyện tập"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/learn/reading">Luyện Đọc</ButtonLink>
              <ButtonLink href="/learn/listening" variant="secondary">
                Luyện Nghe
              </ButtonLink>
              <ButtonLink href="/mock" variant="secondary">
                Làm đề thi thử
              </ButtonLink>
            </div>
          }
        >
          Biểu đồ và gợi ý sẽ xuất hiện sau khi bạn nộp bài đầu tiên. Mọi số liệu đều tính từ bài làm thực tế của bạn.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="trend">
            <h2 id="trend" className="mb-2 text-lg font-semibold">
              Xu hướng điểm ước tính theo kỹ năng (0–10)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SKILLS.map((s) => {
                const latest = dash.latestBySkill[s];
                return (
                  <div key={s}>
                    <TrendChart title={`${SKILL_VI[s]} · ${s[0]!.toUpperCase() + s.slice(1)}`} points={dash.trend.filter((p) => p.skill === s)} />
                    {latest?.avgPrev != null && (
                      <p className="mt-1 text-xs text-muted">
                        Gần nhất {latest.score.toFixed(1)} so với trung bình trước đó {latest.avgPrev.toFixed(1)} ({latest.score - latest.avgPrev >= 0 ? "+" : ""}
                        {(latest.score - latest.avgPrev).toFixed(1)}) · {latest.n} lần
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted">Xem dạng bảng</summary>
              <table className="mt-2 w-full text-left">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th scope="col">Ngày</th>
                    <th scope="col">Kỹ năng</th>
                    <th scope="col">Bài</th>
                    <th scope="col">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.trend.map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td>{new Date(p.date).toLocaleDateString("vi-VN")}</td>
                      <td>{SKILL_VI[p.skill]}</td>
                      <td>{p.label}</td>
                      <td className="tabular-nums">{p.score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-semibold">Độ chính xác theo dạng câu (Đọc & Nghe)</h2>
              {dash.typeStats.length === 0 ? (
                <p className="text-sm text-muted">Chưa có bài Đọc/Nghe nào.</p>
              ) : (
                (["reading", "listening"] as const).map((sk) => {
                  const rows = dash.typeStats.filter((s) => s.skill === sk);
                  if (!rows.length) return null;
                  return (
                    <div key={sk} className="mb-4">
                      <h3 className="mb-2 text-sm font-medium text-muted">{SKILL_VI[sk]}</h3>
                      <HBarChart
                        rows={rows.map((r) => ({ label: TYPE_LABELS[r.type] ?? r.type, value: r.correct, max: r.total }))}
                        valueLabel={(v, m) => `${Math.round((100 * v) / m)}% (${v}/${m})`}
                      />
                    </div>
                  );
                })
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">Thời gian học 8 tuần gần đây (phút)</h2>
              <WeeklyBars weeks={dash.weeks} />
              <p className="mt-2 text-xs text-muted">Tổng {dash.weeks.reduce((n, w) => n + w.sessions, 0)} buổi trong 8 tuần.</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-semibold">Viết: điểm theo tiêu chí (trung bình)</h2>
              {Object.keys(dash.writingCriteria).length === 0 ? (
                <p className="text-sm text-muted">Chưa có bài viết nào được chấm.</p>
              ) : (
                <HBarChart
                  rows={WRITING_RUBRIC.criteria.filter((c) => dash.writingCriteria[c.key]).map((c) => ({ label: c.nameVi, value: dash.writingCriteria[c.key]!.avg, max: 10, note: `n=${dash.writingCriteria[c.key]!.n}` }))}
                  valueLabel={(v) => v.toFixed(1)}
                />
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">Nói: điểm theo tiêu chí (trung bình)</h2>
              {Object.keys(dash.speakingCriteria).length === 0 ? (
                <p className="text-sm text-muted">Chưa có bài nói nào được chấm tự động. Bạn vẫn có thể tự đánh giá sau mỗi lần ghi âm.</p>
              ) : (
                <HBarChart
                  rows={SPEAKING_RUBRIC.criteria.filter((c) => dash.speakingCriteria[c.key]).map((c) => ({ label: c.nameVi, value: dash.speakingCriteria[c.key]!.avg, max: 10, note: `n=${dash.speakingCriteria[c.key]!.n}` }))}
                  valueLabel={(v) => v.toFixed(1)}
                />
              )}
            </Card>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Gợi ý luyện tập</h2>
          {dash.recommendations.length === 0 ? (
            <p className="text-sm text-muted">Chưa đủ dữ liệu để đưa ra gợi ý.</p>
          ) : (
            <ul className="space-y-3">
              {dash.recommendations.map((r) => (
                <li key={r.id} className="border-b border-border pb-3 last:border-0">
                  <Link href={r.href} className="font-medium text-primary hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-sm text-muted">Lý do: {r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Kế hoạch tuần này</h2>
            <Link href="/plan" className="text-sm text-primary hover:underline">
              Chi tiết
            </Link>
          </div>
          <ProgressBar value={planDone} max={plan.tasks.length || 1} label="Weekly plan progress" tone="success" />
          <ul className="mt-3 space-y-1.5 text-sm">
            {plan.tasks.map((x) => (
              <li key={x.id} className="flex items-start gap-2">
                <span aria-hidden>{x.completedAt ? "✅" : "⬜"}</span>
                <span>
                  <span className="font-medium">{DAY[x.dayOfWeek]}</span> · <Link href={x.href} className="hover:underline">{x.activity}</Link>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { speakingPrompts, speakingSubmissions, writingPrompts, writingSubmissions } from "@/server/db/schema";
import { requireLearner } from "@/server/identity";
import { listAttempts, type ScoreSummary } from "@/server/exam-engine";
import { Badge, EmptyState, PageHeader, formatDuration } from "@/components/ui";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Lịch sử" };

export default async function HistoryPage() {
  const learnerId = await requireLearner();
  const db = await getDb();
  const { t } = await getDict();
  const attempts = await listAttempts(db, learnerId);
  const writing = await db
    .select({ id: writingSubmissions.id, title: writingPrompts.title, at: writingSubmissions.submittedAt, score: writingSubmissions.overallScore, status: writingSubmissions.gradingStatus })
    .from(writingSubmissions)
    .innerJoin(writingPrompts, eq(writingPrompts.id, writingSubmissions.promptId))
    .where(and(eq(writingSubmissions.learnerId, learnerId), isNull(writingSubmissions.attemptId), eq(writingSubmissions.status, "submitted")))
    .orderBy(desc(writingSubmissions.submittedAt));
  const speaking = await db
    .select({ id: speakingSubmissions.id, promptId: speakingSubmissions.promptId, title: speakingPrompts.title, at: speakingSubmissions.submittedAt, score: speakingSubmissions.overallScore })
    .from(speakingSubmissions)
    .innerJoin(speakingPrompts, eq(speakingPrompts.id, speakingSubmissions.promptId))
    .where(and(eq(speakingSubmissions.learnerId, learnerId), isNull(speakingSubmissions.attemptId)))
    .orderBy(desc(speakingSubmissions.submittedAt));

  const rows = [
    ...attempts.map((a) => {
      const s = a.scoreSummary as ScoreSummary | null;
      return {
        key: a.id,
        at: a.submittedAt ?? a.startedAt,
        kind: a.kind === "mock" ? "Đề thi thử" : a.skill === "reading" ? "Đọc" : "Nghe",
        title: a.name,
        mode: a.mode === "exam" ? t.exam.examMode : t.exam.practiceMode,
        result: a.status === "in_progress" ? "Đang làm" : s ? (s.overall ? `${s.overall.average.toFixed(1)} (${s.overall.level})` : `${s.rawCorrect}/${s.rawTotal}`) : "—",
        time: a.totalTimeSeconds,
        href: a.status === "in_progress" ? `/attempt/${a.id}` : `/attempt/${a.id}/result`,
      };
    }),
    ...writing.map((w) => ({ key: w.id, at: w.at!, kind: "Viết", title: w.title, mode: t.exam.practiceMode, result: w.score != null ? `${w.score.toFixed(1)}/10` : w.status, time: null, href: `/learn/writing/submissions/${w.id}` })),
    ...speaking.map((s) => ({ key: s.id, at: s.at, kind: "Nói", title: s.title, mode: t.exam.practiceMode, result: s.score != null ? `${s.score.toFixed(1)}/10` : "—", time: null, href: `/learn/speaking/${s.promptId}` })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <>
      <PageHeader title={t.nav.history} crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.history }]} description="Tất cả bài làm của bạn trên trình duyệt này." />
      {rows.length === 0 ? (
        <EmptyState title="Chưa có bài làm nào" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase text-muted">
              <tr>
                {["Ngày", "Loại", "Bài", "Chế độ", "Kết quả", "Thời gian"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{r.at.toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-2">
                    <Badge>{r.kind}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={r.href} className="text-primary hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.mode}</td>
                  <td className="px-3 py-2 tabular-nums">{r.result}</td>
                  <td className="px-3 py-2 tabular-nums">{r.time != null ? formatDuration(r.time) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

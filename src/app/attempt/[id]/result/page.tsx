import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { mistakeBookmarks, speakingSubmissions, writingSubmissions } from "@/server/db/schema";
import { currentLearner, requireLearner } from "@/server/identity";
import { EngineError, getAttemptView, type ScoreSummary } from "@/server/exam-engine";
import { getScoringConfig } from "@/server/ops";
import type { SpeakingFeedback, WritingFeedback } from "@/server/grading/types";
import { AppShell } from "@/components/app-shell";
import { Badge, ButtonLink, Card, Notice, PageHeader, ProgressBar, SkillDot, formatDuration } from "@/components/ui";
import { Highlight } from "@/components/highlight";
import { AddVocabButton, AutoRefresh, BookmarkButton, RegradeButton, SelfAssessment } from "@/components/client-bits";
import { GradingStatus, SELF_CHECK, SpeakingFeedbackView, WritingFeedbackView } from "@/components/feedback";
import { SpeakingPromptView } from "@/components/exam/speaking-prompt";
import { getDict } from "@/i18n/server";
import { TYPE_LABELS } from "@/domain/labels";

export const metadata: Metadata = { title: "Kết quả", robots: { index: false } };
export const dynamic = "force-dynamic";

const SKILL: Record<string, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const learnerId = await requireLearner();
  const db = await getDb();
  const { t } = await getDict();
  let view;
  try {
    view = await getAttemptView(db, learnerId, id, await getScoringConfig());
  } catch (e) {
    if (e instanceof EngineError) notFound();
    throw e;
  }
  if (view.attempt.status === "in_progress") redirect(`/attempt/${id}`);
  const summary = view.attempt.scoreSummary as ScoreSummary | null;
  const writing = await db.select().from(writingSubmissions).where(and(eq(writingSubmissions.attemptId, id), eq(writingSubmissions.learnerId, learnerId)));
  const speaking = await db.select().from(speakingSubmissions).where(and(eq(speakingSubmissions.attemptId, id), eq(speakingSubmissions.learnerId, learnerId)));
  const bookmarks = new Set((await db.select({ q: mistakeBookmarks.questionId }).from(mistakeBookmarks).where(eq(mistakeBookmarks.learnerId, learnerId))).map((b) => b.q));
  const pendingGrading = [...writing, ...speaking].some((s) => s.gradingStatus === "pending") || summary?.skills.some((s) => s.status === "pending");
  const isMock = view.snapshot.blueprint.kind === "mock";

  return (
    <AppShell username={(await currentLearner())?.username}>
      <PageHeader
        title={`${t.exam.results}: ${view.snapshot.blueprint.name}`}
        crumbs={[{ href: "/history", label: t.nav.history }, { label: t.exam.results }]}
        description={
          <>
            {view.attempt.mode === "exam" ? t.exam.examMode : t.exam.practiceMode} · {new Date(view.attempt.submittedAt!).toLocaleString("vi-VN")}
            {view.attempt.completionReason === "time_expired" && <Badge tone="warning" className="ml-2">Nộp tự động khi hết giờ / Auto-submitted at time limit</Badge>}
          </>
        }
        actions={<ButtonLink href={isMock ? "/mock" : view.snapshot.blueprint.skill ? `/learn/${view.snapshot.blueprint.skill}` : "/dashboard"} variant="secondary">{t.common.back}</ButtonLink>}
      />
      <AutoRefresh active={Boolean(pendingGrading)} />

      {summary && (
        <section aria-labelledby="sum" className="mb-8 space-y-4">
          <h2 id="sum" className="sr-only">
            Summary
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.skills.map((s) => (
              <Card key={s.skill} className="p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <SkillDot skill={s.skill} /> {SKILL[s.skill]}
                </p>
                {s.objective ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                      {s.objective.correct}/{s.objective.total}
                    </p>
                    <p className="text-xs text-muted">
                      {Math.round(s.objective.accuracy * 100)}% · sai {s.objective.incorrect} · bỏ trống {s.objective.unanswered}
                    </p>
                    <div className="mt-2">
                      <ProgressBar value={s.objective.correct} max={s.objective.total} label={`${SKILL[s.skill]} accuracy`} />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{s.estimate != null ? `${s.estimate.toFixed(1)}` : "—"}</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Ước tính / estimate:{" "}
                  <span className="font-medium text-text">
                    {s.estimate != null ? `${s.estimate.toFixed(1)}/10` : s.status === "pending" ? "đang chấm…" : s.status === "not_attempted" ? "chưa làm" : "không khả dụng"}
                  </span>
                </p>
              </Card>
            ))}
          </div>
          {isMock && (
            <Card>
              <h3 className="font-semibold">Ước tính trình độ / Estimated proficiency</h3>
              {summary.overall ? (
                <p className="mt-1">
                  Trung bình 4 kỹ năng (làm tròn 0,5): <span className="text-xl font-semibold">{summary.overall.average.toFixed(1)}</span> →{" "}
                  <Badge tone="primary">
                    {summary.overall.level === "below_B1" ? "Dưới B1 (không xét bậc)" : `${summary.overall.level} · ${summary.overall.vstepLevel}`}
                  </Badge>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">Cần đủ điểm ước tính của cả 4 kỹ năng (Viết/Nói cần được chấm) để quy đổi bậc. / All four skills need an estimate before a band can be shown.</p>
              )}
              <p className="mt-2 text-xs text-muted">
                Bảng quy đổi theo QĐ 729/QĐ-BGDĐT (4,0–5,5 → B1; 6,0–8,0 → B2; 8,5–10 → C1). Điểm Nghe/Đọc là ước tính tuyến tính (10 × tỉ lệ đúng) vì không có bảng quy đổi chính thức công khai. {t.common.estimateDisclaimer}
              </p>
            </Card>
          )}
          <p className="text-sm text-muted">
            Thời gian làm bài / Time used: {formatDuration(summary.timeSeconds)} · Cấu hình chấm: {summary.scoringConfigVersion}
          </p>
          {summary.skills.some((s) => s.objective) && <TypeBreakdown summary={summary} />}
        </section>
      )}

      {view.snapshot.sections.map((sec) => (
        <section key={sec.order} aria-labelledby={`sec-${sec.order}`} className="mb-10">
          <h2 id={`sec-${sec.order}`} className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <SkillDot skill={sec.skill} /> {SKILL[sec.skill]} — {t.exam.reviewAnswers}
          </h2>
          <div className="space-y-6">
            {sec.groups.map((g) => {
              if (g.kind === "reading" || g.kind === "listening") {
                const units =
                  g.kind === "reading"
                    ? g.paragraphs.map((p, i) => ({ id: `P${i + 1}`, label: `[${i + 1}]`, text: p }))
                    : (view.released.transcripts[g.id] ?? []).map((s) => ({ id: s.id, label: s.speaker, text: s.text }));
                return (
                  <Card key={g.id}>
                    <h3 className="mb-3 font-semibold">
                      {g.title} <Badge>{g.level}</Badge>
                    </h3>
                    {g.kind === "listening" && (
                      <details className="mb-4 rounded-md bg-surface-2 p-3 text-sm">
                        <summary className="cursor-pointer font-medium">{t.exam.transcript}</summary>
                        {g.audioUrl && (
                          <audio controls src={g.audioUrl} className="my-2 w-full" preload="none" />
                        )}
                        {units.map((u) => (
                          <p key={u.id} className="mt-1">
                            <span className="font-semibold">{u.label}:</span> {u.text}
                          </p>
                        ))}
                      </details>
                    )}
                    <ol className="space-y-5">
                      {g.questions.map((q) => {
                        const key = view.released.answers[q.id];
                        const mine = view.answers[q.id]?.response ?? null;
                        const correct = key && mine === key.answer;
                        const unit = key ? units.find((u) => u.id === key.evidence.ref) : undefined;
                        return (
                          <li key={q.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                            <p className="font-medium">
                              {q.number}. {q.prompt}{" "}
                              <Badge tone={!mine ? "warning" : correct ? "success" : "danger"}>{!mine ? t.exam.unanswered : correct ? "✓ Đúng" : "✗ Sai"}</Badge>{" "}
                              <Badge>{TYPE_LABELS[q.type] ?? q.type}</Badge> <Badge>Độ khó {q.difficulty}/5</Badge>
                            </p>
                            <ul className="mt-2 space-y-1 text-sm">
                              {q.options.map((o) => (
                                <li
                                  key={o.key}
                                  className={
                                    key?.answer === o.key
                                      ? "rounded border border-success bg-success-soft px-2 py-1"
                                      : mine === o.key
                                        ? "rounded border border-danger bg-danger-soft px-2 py-1"
                                        : "px-2 py-1"
                                  }
                                >
                                  <span className="font-semibold">{o.key}.</span> {o.text}
                                  {key?.answer === o.key && <span className="ml-2 text-xs font-medium text-success">({t.exam.correctAnswer})</span>}
                                  {mine === o.key && key?.answer !== o.key && <span className="ml-2 text-xs font-medium text-danger">({t.exam.yourAnswer})</span>}
                                  {key?.distractors?.[o.key] && <span className="block text-xs text-muted">↳ {key.distractors[o.key]}</span>}
                                </li>
                              ))}
                            </ul>
                            {key ? (
                              <div className="mt-2 space-y-2 text-sm">
                                <p>
                                  <span className="font-medium">{t.exam.explanation}:</span> {key.explanation}
                                </p>
                                {unit && (
                                  <blockquote className="rounded-md border-l-4 border-warning bg-surface-2 p-2">
                                    <span className="text-xs font-medium text-muted">
                                      {t.exam.evidence} ({g.kind === "reading" ? `đoạn ${unit.label}` : unit.label}):
                                    </span>{" "}
                                    <Highlight text={unit.text} quote={key.evidence.quote} />
                                  </blockquote>
                                )}
                                {key.vocab && key.vocab.length > 0 && (
                                  <p className="text-xs">
                                    <span className="font-medium">{t.exam.vocab}:</span>{" "}
                                    {key.vocab.map((v) => (
                                      <span key={v.term} className="mr-3">
                                        {v.term} — {v.note}
                                        <AddVocabButton term={v.term} meaning={v.note} />
                                      </span>
                                    ))}
                                  </p>
                                )}
                                {!correct && <BookmarkButton questionId={q.id} attemptId={view.attempt.id} initial={bookmarks.has(q.id)} />}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-muted">Đáp án chưa được công bố. / Answer not released.</p>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </Card>
                );
              }
              if (g.kind === "writing") {
                const sub = writing.find((w) => w.promptId === g.id);
                const sample = view.released.writingSamples[g.id];
                return (
                  <Card key={g.id}>
                    <h3 className="font-semibold">
                      {g.task === "letter" ? "Task 1" : "Task 2"}: {g.title}
                    </h3>
                    {!sub || sub.wordCount === 0 ? (
                      <Notice tone="warning" className="mt-2">
                        Không có bài làm. / No response submitted.
                      </Notice>
                    ) : (
                      <div className="mt-3 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <GradingStatus status={sub.gradingStatus} error={sub.gradingError} />
                          <span className="text-sm text-muted">
                            {sub.wordCount} từ / words (min {g.minWords})
                          </span>
                          {(sub.gradingStatus === "failed" || sub.gradingStatus === "unavailable") && <RegradeButton kind="writing" id={sub.id} />}
                        </div>
                        <details className="rounded-md bg-surface-2 p-3">
                          <summary className="cursor-pointer text-sm font-medium">Bài của bạn / Your response</summary>
                          <p className="mt-2 whitespace-pre-wrap font-serif">{sub.responseText}</p>
                        </details>
                        {sub.feedback ? <WritingFeedbackView feedback={sub.feedback as WritingFeedback} overall={sub.overallScore} /> : null}
                      </div>
                    )}
                    {sample && (
                      <details className="mt-4 rounded-md border border-border p-3">
                        <summary className="cursor-pointer text-sm font-medium">Bài mẫu ({sample.level}) / Sample response</summary>
                        <p className="mt-2 whitespace-pre-wrap font-serif text-sm">{sample.text}</p>
                      </details>
                    )}
                  </Card>
                );
              }
              const sub = speaking.find((s) => s.promptId === g.id);
              const model = view.released.speakingModels[g.id];
              return (
                <Card key={g.id}>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SpeakingPromptView group={g} />
                    <div className="space-y-3">
                      {!sub ? (
                        <Notice tone="warning">Không có bản ghi âm. / No recording submitted.</Notice>
                      ) : (
                        <>
                          <GradingStatus status={sub.gradingStatus} error={sub.gradingError} />
                          {sub.audioBlobId && (
                            <audio controls src={`/api/recordings/${sub.id}`} preload="none" className="w-full" />
                          )}
                          {sub.transcript && (
                            <details className="rounded-md bg-surface-2 p-3 text-sm">
                              <summary className="cursor-pointer font-medium">Bản chép lời tự động / Automatic transcript</summary>
                              <p className="mt-2">{sub.transcript}</p>
                            </details>
                          )}
                          {(sub.gradingStatus === "failed" || sub.gradingStatus === "unavailable") && sub.consentStatus === "ai_processing" && <RegradeButton kind="speaking" id={sub.id} />}
                          <details className="rounded-md border border-border p-3">
                            <summary className="cursor-pointer text-sm font-medium">Tự đánh giá / Self-assessment checklist</summary>
                            <div className="mt-2">
                              <SelfAssessment submissionId={sub.id} items={SELF_CHECK} initial={(sub.selfAssessment as { ratings?: Record<string, number> } | null)?.ratings} />
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  </div>
                  {sub?.feedback ? (
                    <div className="mt-4">
                      <SpeakingFeedbackView feedback={sub.feedback as SpeakingFeedback} overall={sub.overallScore} />
                    </div>
                  ) : null}
                  {model && (
                    <details className="mt-4 rounded-md border border-border p-3 text-sm">
                      <summary className="cursor-pointer font-medium">Câu trả lời mẫu / Model response</summary>
                      <p className="mt-2">{model.text}</p>
                      <p className="mt-2 font-medium">Useful language</p>
                      <ul className="ml-5 list-disc">
                        {model.usefulLanguage.map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/dashboard">{t.nav.dashboard}</ButtonLink>
        <ButtonLink href="/review" variant="secondary">
          {t.nav.review}
        </ButtonLink>
        {summary?.skills.some((s) => s.status === "unavailable") && <RegradeButton kind="attempt" id={view.attempt.id} label="Thử chấm lại Viết/Nói / Retry Writing/Speaking grading" />}
      </div>
      <p className="mt-6 text-xs text-muted">
        <Link href="/sources" className="underline">
          Phương pháp tính điểm & nguồn tham khảo
        </Link>
      </p>
    </AppShell>
  );
}

function TypeBreakdown({ summary }: { summary: ScoreSummary }) {
  const rows = summary.skills.flatMap((s) => (s.objective ? Object.entries(s.objective.byType).map(([type, v]) => ({ skill: s.skill, type, ...v })) : []));
  return (
    <Card>
      <h3 className="mb-2 font-semibold">Theo dạng câu hỏi / By question type</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="py-1">
                Kỹ năng
              </th>
              <th scope="col">Dạng câu</th>
              <th scope="col">Đúng</th>
              <th scope="col" className="w-1/3">
                Tỉ lệ
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.skill + r.type} className="border-t border-border">
                <td className="py-1.5">{SKILL[r.skill]}</td>
                <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                <td className="tabular-nums">
                  {r.correct}/{r.total}
                </td>
                <td>
                  <ProgressBar value={r.correct} max={r.total} label={`${TYPE_LABELS[r.type] ?? r.type} accuracy`} tone={r.correct / r.total >= 0.7 ? "success" : r.correct / r.total >= 0.5 ? "warning" : "danger"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { getSpeakingPrompt, listSpeakingSubmissions } from "@/server/prompts";
import { SpeakingPromptView } from "@/components/exam/speaking-prompt";
import { SpeakingPractice } from "@/components/speaking-practice";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";
import { GradingStatus, SELF_CHECK, SpeakingFeedbackView } from "@/components/feedback";
import { AutoRefresh, RegradeButton, SelfAssessment } from "@/components/client-bits";
import type { SpeakingFeedback } from "@/server/grading/types";
import type { SpeakingContent } from "@/domain/snapshot";

export const metadata: Metadata = { title: "Nói" };

export default async function SpeakingPromptPage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  const learnerId = await requireLearner();
  const db = await getDb();
  const prompt = await getSpeakingPrompt(db, promptId);
  if (!prompt) notFound();
  const subs = await listSpeakingSubmissions(db, learnerId, prompt.id);
  const pending = subs.some((s) => s.gradingStatus === "pending" || (s.gradingStatus === "not_requested" && s.consentStatus === "ai_processing"));
  return (
    <>
      <PageHeader
        title={prompt.title}
        crumbs={[{ href: "/learn/speaking", label: "Nói" }, { label: prompt.title }]}
        description={
          <span className="flex gap-2">
            <Badge tone="primary">{prompt.level}</Badge>
            <Badge>Part {prompt.partNumber}</Badge>
          </span>
        }
      />
      <Notice tone="primary" className="mb-4">
        Micro chỉ được bật khi bạn bấm Bắt đầu. Bản ghi nằm trong trình duyệt cho tới khi bạn bấm Nộp. Bạn có thể chọn chỉ lưu để tự nghe lại, hoặc cho phép gửi tới dịch vụ AI để nhận xét.
      </Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <SpeakingPromptView
          group={{ part: prompt.partNumber as 1 | 2 | 3, title: prompt.title, instructions: prompt.instructions, content: prompt.content as SpeakingContent, preparationSeconds: prompt.preparationSeconds, responseSeconds: prompt.responseSeconds }}
        />
        <SpeakingPractice promptId={prompt.id} preparationSeconds={prompt.preparationSeconds} responseSeconds={prompt.responseSeconds} />
      </div>

      <AutoRefresh active={pending} />
      {subs.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Các lần ghi âm</h2>
          {subs.map((s, i) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">#{subs.length - i}</span>
                <span className="text-sm text-muted">
                  {s.submittedAt.toLocaleString("vi-VN")} · {Math.round(s.durationSeconds ?? 0)}s
                </span>
                <GradingStatus status={s.gradingStatus} error={s.gradingError} />
                {(s.gradingStatus === "failed" || s.gradingStatus === "unavailable") && s.consentStatus === "ai_processing" && <RegradeButton kind="speaking" id={s.id} />}
              </div>
              {s.audioBlobId ? (
                <audio controls preload="none" src={`/api/recordings/${s.id}`} className="mt-3 w-full" />
              ) : (
                <p className="mt-2 text-xs text-muted">Bản ghi đã bị xoá.</p>
              )}
              {s.transcript && <p className="mt-3 rounded-md bg-surface-2 p-3 text-sm">{s.transcript}</p>}
              {s.feedback ? (
                <div className="mt-4">
                  <SpeakingFeedbackView feedback={s.feedback as SpeakingFeedback} overall={s.overallScore} />
                </div>
              ) : null}
              <details className="mt-3 rounded-md border border-border p-3" open={!s.feedback && i === 0}>
                <summary className="cursor-pointer text-sm font-medium">Tự đánh giá / Self-assessment</summary>
                <div className="mt-2">
                  <SelfAssessment submissionId={s.id} items={SELF_CHECK} initial={(s.selfAssessment as { ratings?: Record<string, number> } | null)?.ratings} />
                </div>
              </details>
            </Card>
          ))}
          <Card>
            <h2 className="font-semibold">Câu trả lời mẫu</h2>
            <p className="mt-2 text-sm">{prompt.modelResponse}</p>
            <p className="mt-3 font-medium">Useful language</p>
            <ul className="ml-5 list-disc text-sm">
              {prompt.usefulLanguage.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </Card>
        </section>
      )}
      {subs.length === 0 && <p className="mt-6 text-sm text-muted">Câu trả lời mẫu sẽ hiện sau lần ghi âm đầu tiên của bạn.</p>}
    </>
  );
}

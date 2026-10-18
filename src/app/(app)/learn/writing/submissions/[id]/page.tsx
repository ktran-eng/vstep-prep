import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { writingPrompts, writingSubmissions } from "@/server/db/schema";
import { requireLearner } from "@/server/identity";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { GradingStatus, WritingFeedbackView } from "@/components/feedback";
import { AutoRefresh, RegradeButton } from "@/components/client-bits";
import type { WritingFeedback } from "@/server/grading/types";

export const metadata: Metadata = { title: "Kết quả bài viết" };

export default async function WritingSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const learnerId = await requireLearner();
  const db = await getDb();
  const [sub] = await db.select().from(writingSubmissions).where(and(eq(writingSubmissions.id, id), eq(writingSubmissions.learnerId, learnerId)));
  if (!sub || sub.status !== "submitted") notFound();
  const [prompt] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, sub.promptId));
  if (!prompt) notFound();
  return (
    <>
      <PageHeader
        title={prompt.title}
        crumbs={[{ href: "/learn/writing", label: "Viết" }, ...(sub.attemptId ? [] : [{ href: `/learn/writing/${prompt.id}`, label: prompt.title }]), { label: "Kết quả" }]}
        actions={!sub.attemptId ? <ButtonLink href={`/learn/writing/${prompt.id}`}>Viết lại</ButtonLink> : undefined}
      />
      <AutoRefresh active={sub.gradingStatus === "pending" || sub.gradingStatus === "not_requested"} />
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <GradingStatus status={sub.gradingStatus} error={sub.gradingError} />
            <span className="text-sm text-muted">
              {sub.wordCount} từ · nộp lúc {sub.submittedAt?.toLocaleString("vi-VN")}
            </span>
            {(sub.gradingStatus === "failed" || sub.gradingStatus === "unavailable") && <RegradeButton kind="writing" id={sub.id} />}
          </div>
          <h2 className="mt-4 font-semibold">Bài của bạn</h2>
          <p className="mt-2 whitespace-pre-wrap font-serif">{sub.responseText}</p>
        </Card>
        {sub.feedback ? (
          <Card>
            <h2 className="mb-3 font-semibold">Nhận xét theo tiêu chí</h2>
            <WritingFeedbackView feedback={sub.feedback as WritingFeedback} overall={sub.overallScore} />
            <p className="mt-3 text-xs text-muted">
              Mô hình: {sub.gradingModelVersion} · Rubric: {sub.rubricVersion}
            </p>
          </Card>
        ) : null}
        <Card>
          <h2 className="font-semibold">Bài mẫu ({prompt.sampleLevel})</h2>
          <p className="mt-2 whitespace-pre-wrap font-serif text-sm">{prompt.sampleResponse}</p>
        </Card>
      </div>
    </>
  );
}

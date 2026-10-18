import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { getWritingPrompt, listWritingHistory } from "@/server/prompts";
import { getOrCreateWritingDraft } from "@/app/actions/practice";
import { WritingWorkspace } from "@/components/writing-workspace";
import { Badge, Card, PageHeader } from "@/components/ui";
import { GradingStatus } from "@/components/feedback";

export const metadata: Metadata = { title: "Viết" };

export default async function WritingPromptPage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  const learnerId = await requireLearner();
  const db = await getDb();
  const prompt = await getWritingPrompt(db, promptId);
  if (!prompt) notFound();
  const draft = await getOrCreateWritingDraft(prompt.id);
  const history = await listWritingHistory(db, learnerId, prompt.id);
  return (
    <>
      <PageHeader
        title={prompt.title}
        crumbs={[{ href: "/learn/writing", label: "Viết" }, { label: prompt.title }]}
        description={
          <span className="flex flex-wrap gap-2">
            <Badge tone="primary">{prompt.level}</Badge>
            <Badge>{prompt.taskType === "letter" ? "Task 1" : "Task 2"}</Badge>
            <Badge>≥ {prompt.minWords} từ</Badge>
          </span>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="space-y-3 text-sm">
          <p>{prompt.instructions}</p>
          {prompt.stimulus && <blockquote className="whitespace-pre-line rounded-md border-l-4 border-border-strong bg-surface-2 p-3 italic">{prompt.stimulus}</blockquote>}
          <div>
            <p className="font-medium">Bài viết cần đáp ứng / Checklist</p>
            <ul className="ml-5 list-disc">
              {prompt.requiredPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </Card>
        <WritingWorkspace submissionId={draft.id} initialText={draft.responseText} minWords={prompt.minWords} suggestedMinutes={prompt.suggestedMinutes} />
      </div>
      {history.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-2 font-semibold">Các lần nộp trước</h2>
          <ul className="divide-y divide-border text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/learn/writing/submissions/${h.id}`} className="text-primary hover:underline">
                  {h.submittedAt?.toLocaleString("vi-VN")} · {h.wordCount} từ
                </Link>
                <span className="flex items-center gap-2">
                  {h.overallScore != null && <span className="tabular-nums">{h.overallScore.toFixed(1)}/10</span>}
                  <GradingStatus status={h.gradingStatus} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

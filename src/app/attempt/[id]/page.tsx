import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { EngineError, getAttemptView } from "@/server/exam-engine";
import { getActiveSpec, getScoringConfig } from "@/server/ops";
import { ExamRunner } from "@/components/exam/exam-runner";

export const metadata: Metadata = { title: "Bài làm", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const learnerId = await requireLearner();
  let view;
  try {
    view = await getAttemptView(await getDb(), learnerId, id, await getScoringConfig());
  } catch (e) {
    if (e instanceof EngineError) notFound();
    throw e;
  }
  if (view.attempt.status !== "in_progress") redirect(`/attempt/${id}/result`);
  const spec = await getActiveSpec();
  return <ExamRunner initial={view} maxPlays={spec.listening.strictPlaysAllowed} />;
}

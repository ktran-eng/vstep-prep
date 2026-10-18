import type { SpeakingFeedback, WritingFeedback } from "@/server/grading/types";
import { SPEAKING_RUBRIC, WRITING_RUBRIC } from "@/domain/rubrics";
import { Badge, Notice } from "./ui";

export function GradingStatus({ status, error }: { status: string; error?: string | null }) {
  const map: Record<string, { tone: "neutral" | "primary" | "success" | "warning" | "danger"; label: string }> = {
    not_requested: { tone: "neutral", label: "Chưa chấm / Not graded" },
    pending: { tone: "primary", label: "Đang chấm… / Grading…" },
    graded: { tone: "success", label: "Đã có nhận xét AI (ước tính) / AI feedback ready (estimate)" },
    unavailable: { tone: "warning", label: "Chấm tự động không khả dụng / Automatic grading unavailable" },
    failed: { tone: "danger", label: "Chấm thất bại / Grading failed" },
  };
  const s = map[status] ?? map.not_requested!;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={s.tone}>{s.label}</Badge>
      {error && <span className="text-xs text-muted">{error}</span>}
    </div>
  );
}

function CriteriaTable({ criteria, rubric }: { criteria: { key: string; score: number; evidence: string; comment: string }[]; rubric: typeof WRITING_RUBRIC }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">Rubric scores</caption>
        <thead className="text-xs uppercase text-muted">
          <tr>
            <th scope="col" className="py-2 pr-3">
              Criterion
            </th>
            <th scope="col" className="py-2 pr-3">
              Score /10
            </th>
            <th scope="col" className="py-2">
              Evidence & comment
            </th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => {
            const def = rubric.criteria.find((r) => r.key === c.key);
            return (
              <tr key={c.key} className="border-t border-border align-top">
                <th scope="row" className="py-2 pr-3 font-medium">
                  {def?.name ?? c.key}
                  <span className="block text-xs font-normal text-muted">{def?.nameVi}</span>
                </th>
                <td className="py-2 pr-3 text-lg font-semibold tabular-nums">{c.score.toFixed(1)}</td>
                <td className="py-2">
                  <p className="italic text-muted">“{c.evidence}”</p>
                  <p className="mt-1">{c.comment}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="ml-5 list-disc text-sm">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function Corrections({ items }: { items: WritingFeedback["corrections"] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="font-medium">Corrections / Sửa lỗi</h4>
      <ul className="mt-1 space-y-2 text-sm">
        {items.map((c, i) => (
          <li key={i} className="rounded-md border border-border p-2">
            <Badge>{c.category}</Badge>
            <p className="mt-1">
              <del className="text-danger decoration-2">{c.original}</del> → <ins className="font-medium text-success no-underline">{c.suggestion}</ins>
            </p>
            <p className="text-muted">{c.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WritingFeedbackView({ feedback, overall }: { feedback: WritingFeedback; overall: number | null }) {
  return (
    <div className="space-y-4">
      <Notice tone="warning">
        Điểm do AI ước tính theo rubric luyện tập — không phải điểm của giám khảo VSTEP. / AI estimate using a practice rubric — not an official examiner score.
      </Notice>
      {overall != null && (
        <p className="text-sm">
          Estimated task score: <span className="text-2xl font-semibold tabular-nums">{overall.toFixed(1)}</span>/10
        </p>
      )}
      <p className="rounded-md bg-surface-2 p-3 text-sm">{feedback.summaryVi}</p>
      <CriteriaTable criteria={feedback.criteria} rubric={WRITING_RUBRIC} />
      <div className="grid gap-4 md:grid-cols-2">
        <List title="Strengths / Điểm mạnh" items={feedback.strengths} />
        <List title="Priorities / Cần ưu tiên cải thiện" items={feedback.priorities} />
        <List title="Missing task requirements / Ý còn thiếu" items={feedback.missingRequirements} />
        <List title="Revision plan / Kế hoạch sửa bài" items={feedback.revisionPlan} />
      </div>
      <div>
        <h4 className="font-medium">Organisation & coherence</h4>
        <p className="text-sm">{feedback.organisationFeedback}</p>
      </div>
      <Corrections items={feedback.corrections} />
    </div>
  );
}

export function SpeakingFeedbackView({ feedback, overall }: { feedback: SpeakingFeedback; overall: number | null }) {
  return (
    <div className="space-y-4">
      <Notice tone="warning">
        Nhận xét dựa trên bản chép lời tự động; phát âm không được chấm tự động. / Based on an automatic transcript; pronunciation is not machine-scored.
      </Notice>
      {overall != null && (
        <p className="text-sm">
          Estimated score (excluding pronunciation): <span className="text-2xl font-semibold tabular-nums">{overall.toFixed(1)}</span>/10
        </p>
      )}
      <p className="rounded-md bg-surface-2 p-3 text-sm">{feedback.summaryVi}</p>
      <CriteriaTable criteria={feedback.criteria} rubric={SPEAKING_RUBRIC} />
      <div className="grid gap-4 md:grid-cols-2">
        <List title="Strengths / Điểm mạnh" items={feedback.strengths} />
        <List title="Priorities / Cần ưu tiên cải thiện" items={feedback.priorities} />
        <List title="Missing task requirements / Ý còn thiếu" items={feedback.missingRequirements} />
        <List title="Next steps / Bước tiếp theo" items={feedback.revisionPlan} />
      </div>
      <Corrections items={feedback.corrections} />
    </div>
  );
}

export const SELF_CHECK = [
  { key: "task_relevance", label: "I answered every question/point and gave reasons or examples." },
  { key: "fluency_coherence", label: "I kept speaking without long pauses and linked my ideas clearly." },
  { key: "vocabulary", label: "I used topic vocabulary, not only very simple words." },
  { key: "grammar", label: "I used some complex sentences, mostly accurately." },
  { key: "pronunciation", label: "My words, stress and intonation were clear and easy to understand." },
];

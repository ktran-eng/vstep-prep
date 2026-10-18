"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { bookmarkAction, quickAddVocabAction } from "@/app/actions/learner";
import { regradeAttemptAction } from "@/app/actions/exam";
import { regradeSpeakingAction, regradeWritingAction, saveSelfAssessmentAction } from "@/app/actions/practice";
import { Button } from "./ui";

/** Refreshes server data every few seconds while grading is pending (stops after ~3 minutes). */
export function AutoRefresh({ active, intervalMs = 5000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const id = window.setInterval(() => {
      if (++n > 36) return window.clearInterval(id);
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs, router]);
  return active ? (
    <p className="text-xs text-muted" aria-live="polite">
      Đang chờ kết quả chấm, trang sẽ tự cập nhật… / Waiting for grading; this page refreshes automatically…
    </p>
  ) : null;
}

export function BookmarkButton({ questionId, attemptId, initial }: { questionId: string; attemptId: string; initial: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={saved || pending}
      onClick={() =>
        start(async () => {
          const r = await bookmarkAction({ questionId, attemptId });
          if (r.ok) setSaved(true);
        })
      }
      className="text-xs text-primary underline-offset-2 hover:underline disabled:text-muted disabled:no-underline"
    >
      {saved ? "✓ Đã lưu vào sổ lỗi sai / In mistake notebook" : "+ Lưu vào sổ lỗi sai / Save to mistake notebook"}
    </button>
  );
}

export function AddVocabButton({ term, meaning }: { term: string; meaning?: string }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={done || pending}
      aria-label={`Add ${term} to my vocabulary`}
      onClick={() => start(async () => setDone((await quickAddVocabAction({ term, meaning })).ok))}
      className="ml-2 text-xs text-primary hover:underline disabled:text-muted"
    >
      {done ? "✓" : "+ từ vựng"}
    </button>
  );
}

export function RegradeButton({ kind, id, label = "Chấm lại / Retry grading" }: { kind: "attempt" | "writing" | "speaking"; id: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const fn = kind === "attempt" ? regradeAttemptAction : kind === "writing" ? regradeWritingAction : regradeSpeakingAction;
            const r = await fn(id);
            setMsg(r.ok ? null : r.error);
            router.refresh();
          })
        }
      >
        {pending ? "…" : label}
      </Button>
      {msg && <span className="text-xs text-danger">{msg}</span>}
    </span>
  );
}

export function SelfAssessment({ submissionId, items, initial }: { submissionId: string; items: { key: string; label: string }[]; initial?: Record<string, number> }) {
  const [ratings, setRatings] = useState<Record<string, number>>(initial ?? {});
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setState((await saveSelfAssessmentAction({ submissionId, ratings })).ok ? "saved" : "error"));
      }}
      className="space-y-3"
    >
      {items.map((it) => (
        <fieldset key={it.key} className="text-sm">
          <legend>{it.label}</legend>
          <div className="mt-1 flex gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex items-center gap-1">
                <input type="radio" name={it.key} checked={ratings[it.key] === n} onChange={() => setRatings((r) => ({ ...r, [it.key]: n }))} />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <p className="text-xs text-muted">1 = chưa đạt / not yet · 5 = rất tốt / very well</p>
      <Button type="submit" variant="secondary" disabled={pending}>
        Lưu tự đánh giá / Save self-assessment
      </Button>
      <span className="ml-2 text-xs" aria-live="polite">
        {state === "saved" ? "✓ Đã lưu" : state === "error" ? "Lỗi khi lưu" : ""}
      </span>
    </form>
  );
}

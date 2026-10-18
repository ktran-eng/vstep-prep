"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveWritingDraftAction, submitWritingAction } from "@/app/actions/practice";
import { countWords } from "@/domain/text";
import { useT } from "@/i18n/client";
import { Button, cx, formatDuration } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";

/** Standalone writing practice: distraction-minimised editor, soft timer, autosave every few seconds. */
export function WritingWorkspace({ submissionId, initialText, minWords, suggestedMinutes }: { submissionId: string; initialText: string; minWords: number; suggestedMinutes: number }) {
  const { t } = useT();
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerOn, setTimerOn] = useState(false);
  const [left, setLeft] = useState(suggestedMinutes * 60);
  const dirty = useRef(false);
  const textRef = useRef(text);
  const lastAt = useRef(0);
  const words = countWords(text);

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setState("saving");
    try {
      const delta = lastAt.current ? Math.min(600, Math.round((Date.now() - lastAt.current) / 1000)) : 0;
      lastAt.current = Date.now();
      const r = await saveWritingDraftAction({ submissionId, text: textRef.current, timeSpentDelta: delta });
      setState(r.ok ? "saved" : "error");
      if (!r.ok) setError(r.error);
    } catch {
      dirty.current = true;
      setState("error");
    }
  }, [submissionId]);

  useEffect(() => {
    lastAt.current = Date.now();
    const id = window.setInterval(() => void save(), 4000);
    return () => window.clearInterval(id);
  }, [save]);

  // Soft practice timer: pausing keeps the remaining time; resuming continues from it.
  const leftRef = useRef(left);
  useEffect(() => {
    if (!timerOn) return;
    const end = Date.now() + leftRef.current * 1000;
    const id = window.setInterval(() => {
      leftRef.current = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(leftRef.current);
    }, 500);
    return () => window.clearInterval(id);
  }, [timerOn]);

  async function submit() {
    setBusy(true);
    const delta = lastAt.current ? Math.min(600, Math.round((Date.now() - lastAt.current) / 1000)) : 0;
    const r = await submitWritingAction({ submissionId, text, timeSpentDelta: delta });
    setBusy(false);
    setConfirm(false);
    if (!r.ok) setError(r.error);
    else router.push(`/learn/writing/submissions/${r.data.id}`);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setTimerOn((v) => !v)} aria-pressed={timerOn}>
            {timerOn ? "Tạm dừng giờ" : `Bấm giờ ${suggestedMinutes}′`}
          </Button>
          <span role="timer" className={cx("font-mono tabular-nums", left === 0 && "text-danger")}>
            {formatDuration(left)}
          </span>
        </div>
        <span className="text-xs text-muted" aria-live="polite">
          {state === "saving" ? t.common.saving : state === "saved" ? `✓ ${t.common.saved}` : state === "error" ? t.common.saveFailed : ""}
        </span>
      </div>
      <label htmlFor="essay" className="sr-only">
        Your response
      </label>
      <textarea
        id="essay"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          textRef.current = e.target.value;
          dirty.current = true;
        }}
        onBlur={() => void save()}
        spellCheck={false}
        className="h-[55vh] w-full resize-y rounded-md border border-border bg-bg p-3 font-serif text-base leading-relaxed"
        aria-describedby="wc"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p id="wc" className={cx("text-sm tabular-nums", words < minWords ? "text-warning" : "text-success")}>
          {words} {t.common.words} · tối thiểu {minWords}
        </p>
        <Button onClick={() => setConfirm(true)} disabled={words === 0}>
          {t.common.submit}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog open={confirm} title="Nộp bài viết?" confirmLabel={t.common.submit} cancelLabel={t.common.cancel} onCancel={() => setConfirm(false)} onConfirm={submit} busy={busy}>
        <p>Sau khi nộp, bài viết sẽ không thể sửa. Bài sẽ được gửi tới nhà cung cấp AI (Anthropic) để nhận xét nếu máy chủ đã bật tính năng này.</p>
        {words < minWords && <p className="mt-2 font-medium text-warning">Bài của bạn mới có {words} từ, ít hơn yêu cầu {minWords} từ.</p>}
      </ConfirmDialog>
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { bookmarkAction, updateBookmarkAction } from "@/app/actions/learner";
import { Button } from "./ui";

export function ReviewControls({ questionId, attemptId, bookmark }: { questionId: string; attemptId: string; bookmark: { id: string; note: string | null; reviewStatus: string } | null }) {
  const [note, setNote] = useState(bookmark?.note ?? "");
  const [status, setStatus] = useState(bookmark?.reviewStatus ?? "to_review");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-medium" htmlFor={`note-${questionId}`}>
        Ghi chú của bạn / Your note
      </label>
      <textarea id={`note-${questionId}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-md border border-border bg-bg p-2 text-sm" />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = bookmark ? await updateBookmarkAction({ id: bookmark.id, note }) : await bookmarkAction({ questionId, attemptId, note });
              setMsg(r.ok ? "✓ Đã lưu" : r.error);
            })
          }
        >
          Lưu ghi chú
        </Button>
        <Button
          variant={status === "reviewed" ? "ghost" : "secondary"}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const next = status === "reviewed" ? "to_review" : "reviewed";
              const r = bookmark ? await updateBookmarkAction({ id: bookmark.id, reviewStatus: next }) : await bookmarkAction({ questionId, attemptId, note, reviewStatus: next });
              if (r.ok) setStatus(next);
              setMsg(r.ok ? "" : r.error);
            })
          }
        >
          {status === "reviewed" ? "↺ Đánh dấu chưa ôn" : "✓ Đã ôn xong"}
        </Button>
        <span className="text-xs text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
    </div>
  );
}

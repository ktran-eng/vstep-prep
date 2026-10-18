"use client";
import { useActionState, useEffect, useRef } from "react";
import { addVocabAction } from "@/app/actions/learner";
import { Button } from "./ui";

export function VocabForm() {
  const [state, action, pending] = useActionState(addVocabAction, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
      <label className="text-sm">
        <span className="mb-1 block font-medium">Từ / cụm từ *</span>
        <input name="term" required maxLength={100} className="w-full rounded-md border border-border bg-bg px-3 py-2" aria-invalid={state && !state.ok ? true : undefined} aria-describedby="vocab-err" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Nghĩa</span>
        <input name="meaning" maxLength={300} className="w-full rounded-md border border-border bg-bg px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Ví dụ</span>
        <input name="example" maxLength={500} className="w-full rounded-md border border-border bg-bg px-3 py-2" />
      </label>
      <Button type="submit" disabled={pending}>
        Thêm
      </Button>
      <p id="vocab-err" role="status" className="text-sm text-danger md:col-span-4">
        {state && !state.ok ? state.error : ""}
      </p>
    </form>
  );
}

"use client";
import { useActionState } from "react";
import { editQuestionAction } from "@/app/actions/admin";
import { Button } from "@/components/ui";

type Init = { id: string; prompt: string; A: string; B: string; C: string; D: string; answer: string; explanation: string; evidenceRef: string; evidenceQuote: string; difficulty: number };

export function QuestionEditor({ initial }: { initial: Init }) {
  const [state, action, pending] = useActionState(editQuestionAction, null);
  const field = "w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm";
  return (
    <form action={action} className="space-y-3 text-sm">
      <input type="hidden" name="id" value={initial.id} />
      <label className="block">
        Câu hỏi
        <textarea name="prompt" defaultValue={initial.prompt} rows={2} className={field} />
      </label>
      {(["A", "B", "C", "D"] as const).map((k) => (
        <label key={k} className="block">
          Phương án {k}
          <input name={k} defaultValue={initial[k]} className={field} />
        </label>
      ))}
      <div className="flex gap-4">
        <label>
          Đáp án đúng{" "}
          <select name="answer" defaultValue={initial.answer} className="rounded border border-border bg-bg px-2 py-1">
            {["A", "B", "C", "D"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Độ khó{" "}
          <input type="number" name="difficulty" min={1} max={5} defaultValue={initial.difficulty} className="w-16 rounded border border-border bg-bg px-2 py-1" />
        </label>
      </div>
      <label className="block">
        Giải thích (không nhắc chữ cái phương án)
        <textarea name="explanation" defaultValue={initial.explanation} rows={3} className={field} />
      </label>
      <div className="grid grid-cols-[6rem_1fr] gap-2">
        <label>
          Đơn vị
          <input name="evidenceRef" defaultValue={initial.evidenceRef} className={field} />
        </label>
        <label>
          Trích dẫn căn cứ (phải trùng nguyên văn)
          <input name="evidenceQuote" defaultValue={initial.evidenceQuote} className={field} />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        Kiểm tra & lưu phiên bản mới
      </Button>
      <p role="status" className={state && !state.ok ? "text-danger" : "text-success"}>
        {state ? (state.ok ? `✓ Đã lưu phiên bản ${state.data.version}. Câu hỏi chuyển về "reviewed" nếu đang published; snapshot đề liên quan đã được cập nhật.` : state.error) : ""}
      </p>
    </form>
  );
}

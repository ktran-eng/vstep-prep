"use client";
import { useActionState } from "react";
import { savePreferencesAction } from "@/app/actions/learner";
import { Button } from "./ui";

const DAYS = [
  [1, "T2"],
  [2, "T3"],
  [3, "T4"],
  [4, "T5"],
  [5, "T6"],
  [6, "T7"],
  [7, "CN"],
] as const;

export function PreferencesForm({
  initial,
  onboarding,
}: {
  initial: { displayName: string; targetLevel: string; targetExamDate: string; studyMinutesPerDay: number; studyDays: number[] };
  onboarding: boolean;
}) {
  const [state, action, pending] = useActionState(savePreferencesAction, null);
  return (
    <form action={action} className="space-y-4" noValidate>
      {onboarding && <input type="hidden" name="redirectTo" value="dashboard" />}
      <input type="hidden" name="regeneratePlan" value="1" />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Tên hiển thị (không bắt buộc)</span>
        <input name="displayName" defaultValue={initial.displayName} maxLength={60} className="w-full rounded-md border border-border bg-bg px-3 py-2" />
      </label>
      <fieldset className="text-sm">
        <legend className="mb-1 font-medium">Trình độ mục tiêu</legend>
        <div className="flex gap-4">
          {["B1", "B2", "C1"].map((l) => (
            <label key={l} className="flex items-center gap-1.5">
              <input type="radio" name="targetLevel" value={l} defaultChecked={initial.targetLevel === l} /> {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Ngày thi dự kiến</span>
        <input type="date" name="targetExamDate" defaultValue={initial.targetExamDate} className="rounded-md border border-border bg-bg px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Thời gian học mỗi ngày (phút)</span>
        <input type="number" name="studyMinutesPerDay" min={15} max={240} step={5} defaultValue={initial.studyMinutesPerDay} className="w-32 rounded-md border border-border bg-bg px-3 py-2" />
      </label>
      <fieldset className="text-sm">
        <legend className="mb-1 font-medium">Ngày học trong tuần</legend>
        <div className="flex flex-wrap gap-3">
          {DAYS.map(([n, l]) => (
            <label key={n} className="flex items-center gap-1.5">
              <input type="checkbox" name="studyDays" value={n} defaultChecked={initial.studyDays.includes(n)} /> {l}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {onboarding ? "Lưu & bắt đầu" : "Lưu"}
        </Button>
        <p role="status" aria-live="polite" className={state && !state.ok ? "text-sm text-danger" : "text-sm text-success"}>
          {state ? (state.ok ? "✓ Đã lưu và cập nhật kế hoạch tuần" : state.error) : ""}
        </p>
      </div>
    </form>
  );
}

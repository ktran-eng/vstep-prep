"use client";
import { useActionState } from "react";
import { saveConfigAction } from "@/app/actions/admin";
import { Button } from "@/components/ui";

export function ConfigEditor({ kind, initial }: { kind: "spec" | "scoring"; initial: string }) {
  const [state, action, pending] = useActionState(saveConfigAction, null);
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="kind" value={kind} />
      <label className="block text-sm">
        JSON (đổi trường &quot;version&quot; trước khi lưu)
        <textarea name="payload" defaultValue={initial} rows={18} spellCheck={false} className="mt-1 w-full rounded-md border border-border bg-bg p-2 font-mono text-xs" />
      </label>
      <Button type="submit" disabled={pending} variant="secondary">
        Kiểm tra & lưu phiên bản mới
      </Button>
      <p role="status" className={state && !state.ok ? "text-sm text-danger" : "text-sm text-success"}>
        {state ? (state.ok ? `✓ Đã kích hoạt ${state.data.version}` : state.error) : ""}
      </p>
    </form>
  );
}

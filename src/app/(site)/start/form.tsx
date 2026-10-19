"use client";
import { useActionState } from "react";
import { signInAction } from "@/app/actions/session";
import { Button } from "@/components/ui";

export function SignInForm({ next, rule }: { next: string; rule: string }) {
  const [state, action, pending] = useActionState(signInAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Tên đăng nhập</span>
        <input
          name="username"
          required
          minLength={3}
          maxLength={32}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          aria-describedby="username-help username-err"
          aria-invalid={state?.error ? true : undefined}
          className="w-full rounded-md border border-border bg-bg px-3 py-2"
        />
      </label>
      <p id="username-help" className="text-xs text-muted">
        {rule} Không phân biệt chữ hoa/thường.
      </p>
      <p id="username-err" role="alert" className="text-sm text-danger">
        {state?.error}
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang vào…" : "Vào học"}
      </Button>
    </form>
  );
}

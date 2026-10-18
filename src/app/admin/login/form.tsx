"use client";
import { useActionState } from "react";
import { adminLoginAction } from "@/app/actions/admin";
import { Button } from "@/components/ui";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, null);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Admin passphrase</span>
        <input type="password" name="password" required autoComplete="current-password" className="w-full rounded-md border border-border bg-bg px-3 py-2" aria-describedby="login-err" />
      </label>
      <p id="login-err" role="alert" className="text-sm text-danger">
        {state?.error}
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        Đăng nhập
      </Button>
    </form>
  );
}

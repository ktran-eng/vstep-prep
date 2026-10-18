import "server-only";
import { EngineError } from "./exam-engine";
import { UnauthorizedError } from "./identity";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; code?: string };

/** Uniform error handling for server actions: known errors map to safe messages, unknown errors are logged, never leaked. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof EngineError) return { ok: false, error: err.message, code: err.code };
    if (err instanceof UnauthorizedError) return { ok: false, error: err.message, code: "unauthorized" };
    if (err instanceof InputError) return { ok: false, error: err.message, code: "invalid" };
    // Next.js control-flow errors (redirect/notFound) must propagate.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) throw err;
    console.error("[action error]", err);
    return { ok: false, error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại. / Server error, please retry.", code: "server" };
  }
}

export class InputError extends Error {}

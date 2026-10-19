/**
 * Sign-in names. There is no password: the name alone identifies a profile, so names are normalised
 * (trimmed, NFC, lowercase) to make "Lan.Nguyen" and "lan.nguyen" the same person.
 */
export const USERNAME_RULE = "3–32 ký tự: chữ cái (có thể có dấu), chữ số, dấu chấm, gạch dưới hoặc gạch ngang; không có dấu cách.";

export function normaliseUsername(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.normalize("NFC").trim().toLowerCase();
  if (value.length < 3) return { ok: false, error: "Tên đăng nhập cần ít nhất 3 ký tự." };
  if (value.length > 32) return { ok: false, error: "Tên đăng nhập tối đa 32 ký tự." };
  if (!/^[\p{L}\p{N}._-]+$/u.test(value)) return { ok: false, error: `Tên đăng nhập không hợp lệ. ${USERNAME_RULE}` };
  if (/^[._-]|[._-]$/.test(value)) return { ok: false, error: "Tên đăng nhập không được bắt đầu hoặc kết thúc bằng dấu chấm/gạch." };
  return { ok: true, value };
}

/** Only allow redirects to local paths after sign-in (prevents open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  return next;
}

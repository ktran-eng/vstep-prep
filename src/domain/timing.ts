/** Grace period for answers that were in flight when the deadline passed (network latency). */
export const LATE_SAVE_GRACE_MS = 5_000;

export function computeDeadline(startedAt: Date, limitSeconds: number): Date {
  return new Date(startedAt.getTime() + limitSeconds * 1000);
}

export function remainingSeconds(deadline: Date | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  return Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
}

export function isExpired(deadline: Date | null, now: Date = new Date(), graceMs = 0): boolean {
  if (!deadline) return false;
  return now.getTime() > deadline.getTime() + graceMs;
}

export type AttemptStatus = "in_progress" | "submitted" | "expired";
export type AttemptEvent = "save" | "advance_section" | "submit" | "expire";

/** Allowed attempt transitions. Terminal states accept no further events. */
export function nextStatus(current: AttemptStatus, event: AttemptEvent): AttemptStatus | null {
  if (current !== "in_progress") return null;
  switch (event) {
    case "save":
    case "advance_section":
      return "in_progress";
    case "submit":
      return "submitted";
    case "expire":
      return "expired";
  }
}

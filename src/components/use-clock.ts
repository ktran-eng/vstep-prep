"use client";
import { useEffect, useState } from "react";

/**
 * Countdown derived from a server-provided remaining time. `resetKey` restarts it when the server state changes.
 * The client clock is display-only; the server enforces the real deadline.
 */
export function useCountdown(remainingSeconds: number | null, resetKey: string | number) {
  const [left, setLeft] = useState(remainingSeconds);
  useEffect(() => {
    if (remainingSeconds == null) return;
    const end = Date.now() + remainingSeconds * 1000;
    const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    const id = window.setInterval(tick, 500);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [remainingSeconds, resetKey]);
  return remainingSeconds == null ? null : left;
}

/** Seconds elapsed since an ISO timestamp, updated twice a second. */
export function useElapsed(sinceIso: string | null | undefined) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!sinceIso) return;
    const start = Date.parse(sinceIso);
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)));
    const id = window.setInterval(tick, 500);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [sinceIso]);
  return elapsed;
}

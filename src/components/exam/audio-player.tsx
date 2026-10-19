"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/dict";
import { Button, formatDuration } from "../ui";

/**
 * Listening player.
 *  strict: one play (enforced server-side via onBeforePlay), no pause/seek — mirrors the paper exam where audio runs once.
 *  practice: play/pause/seek/replay freely.
 */
export function AudioPlayer({
  src,
  title,
  strict,
  playsUsed,
  maxPlays,
  onBeforePlay,
  onPlayed,
  knownDuration,
}: {
  src: string;
  title: string;
  strict: boolean;
  playsUsed: number;
  maxPlays: number;
  onBeforePlay: () => Promise<{ allowed: boolean; plays: number }>;
  onPlayed?: () => void;
  /** Duration from the audio manifest; browsers mis-estimate length for MP3s without a VBR header. */
  knownDuration?: number | null;
}) {
  const { t } = useT();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [plays, setPlays] = useState(playsUsed);
  const [err, setErr] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const exhausted = strict && plays >= maxPlays && !playing;
  const lastAllowed = useRef(0);
  const shownDur = knownDuration || dur;

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => {
      setPos(a.currentTime);
      if (strict && a.currentTime > lastAllowed.current + 1.5) a.currentTime = lastAllowed.current; // block seeking forward
      lastAllowed.current = Math.max(lastAllowed.current, a.currentTime);
    };
    const onMeta = () => setDur(a.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      onPlayed?.();
    };
    const onError = () => setErr(t.audio.loadError);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onError);
    };
  }, [strict, onPlayed, t.audio.loadError]);

  async function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      if (strict) return;
      a.pause();
      setPlaying(false);
      return;
    }
    setErr(null);
    // A new play (from the start) is counted; resuming a paused practice play is not.
    const fresh = a.currentTime === 0 || a.ended;
    if (fresh) {
      setStarting(true);
      const r = await onBeforePlay().catch(() => ({ allowed: false, plays }));
      setStarting(false);
      setPlays(r.plays);
      if (!r.allowed) {
        setErr(fmt(t.exam.playsLeft, { n: 0 }));
        return;
      }
      a.currentTime = 0;
      lastAllowed.current = 0;
    }
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setErr(t.audio.blocked);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3" role="group" aria-label={`Audio: ${title}`}>
      <audio ref={ref} src={src} preload="metadata" />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggle} disabled={exhausted || starting || (strict && playing)} aria-label={playing ? t.audio.pause : t.audio.play} className="w-28">
          {playing ? (strict ? t.audio.playing : `❚❚ ${t.audio.pause}`) : `▶ ${t.audio.play}`}
        </Button>
        <div className="min-w-40 flex-1">
          <input
            type="range"
            min={0}
            max={shownDur || 0}
            step={0.1}
            value={pos}
            disabled={strict}
            aria-label={t.audio.position}
            aria-valuetext={`${formatDuration(pos)} / ${formatDuration(shownDur)}`}
            onChange={(e) => {
              if (ref.current) ref.current.currentTime = Number(e.target.value);
            }}
            className="w-full accent-[var(--primary)]"
          />
          <div className="flex justify-between text-xs tabular-nums text-muted">
            <span>{formatDuration(pos)}</span>
            <span>{shownDur ? formatDuration(shownDur) : "--:--"}</span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          {t.audio.volume}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVol(v);
              if (ref.current) ref.current.volume = v;
            }}
            aria-label={t.audio.volume}
            className="w-20 accent-[var(--primary)]"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        {strict ? `${t.exam.playOnce} ${fmt(t.exam.playsLeft, { n: Math.max(0, maxPlays - plays) })}` : t.exam.unlimitedPlays}
      </p>
      {err && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {err}
        </p>
      )}
    </div>
  );
}

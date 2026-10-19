"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/dict";
import { Button, Notice, formatDuration } from "../ui";

type Phase = "idle" | "preparing" | "recording" | "recorded" | "submitting" | "submitted" | "error";
type Consent = "recording_only" | "ai_processing";

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

const noopSubscribe = () => () => {};
/** Recording support is only knowable in the browser; the server assumes support to avoid a warning flash. */
function useRecordingSupported() {
  return useSyncExternalStore(
    noopSubscribe,
    () => !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined",
    () => true,
  );
}

/**
 * Speech recorder. Nothing is recorded before the learner presses Start, the microphone is released when
 * recording stops, and audio stays in the browser until the learner chooses a consent option and presses Submit.
 */
export function Recorder({
  preparationSeconds,
  responseSeconds,
  allowRetry,
  alreadySubmitted,
  onSubmit,
}: {
  preparationSeconds: number;
  responseSeconds: number;
  allowRetry: boolean;
  alreadySubmitted: boolean;
  onSubmit: (blob: Blob, durationSeconds: number, consent: Consent) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { t } = useT();
  const r = t.rec;
  const supported = useRecordingSupported();
  const [phase, setPhase] = useState<Phase>(alreadySubmitted ? "submitted" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  // No pre-selected consent: the learner must choose explicitly before submitting.
  const [consent, setConsent] = useState<Consent | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function clearTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function begin() {
    setError(null);
    // Ask for the microphone first so permission problems surface before preparation time is spent.
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const name = (e as DOMException)?.name;
      setError(name === "NotAllowedError" ? r.denied : name === "NotFoundError" ? r.noDevice : r.failedStart);
      setPhase("error");
      return;
    }
    if (preparationSeconds > 0) {
      setPhase("preparing");
      setLeft(preparationSeconds);
      const end = Date.now() + preparationSeconds * 1000;
      timerRef.current = window.setInterval(() => {
        const s = Math.ceil((end - Date.now()) / 1000);
        setLeft(Math.max(0, s));
        if (s <= 0) {
          clearTimer();
          startRecording();
        }
      }, 250);
    } else startRecording();
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onerror = () => {
      setError(r.interrupted);
      setPhase("error");
    };
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
      blobRef.current = blob;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setUrl(urlRef.current);
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
      setPhase(blob.size ? "recorded" : "error");
      if (!blob.size) setError(r.empty);
    };
    recRef.current = rec;
    startRef.current = Date.now();
    rec.start(1000);
    setPhase("recording");
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(s);
      if (s >= responseSeconds) stop();
    }, 250);
  }

  function stop() {
    clearTimer();
    if (recRef.current?.state === "recording") recRef.current.stop();
  }

  async function submit() {
    if (!blobRef.current || !consent) return;
    setPhase("submitting");
    const res = await onSubmit(blobRef.current, Math.max(1, elapsed), consent);
    if (res.ok) setPhase("submitted");
    else {
      setError(res.error ?? r.uploadFailed);
      setPhase("recorded");
    }
  }

  if (!supported)
    return (
      <Notice tone="warning" title={r.unsupportedTitle}>
        {r.unsupported}
      </Notice>
    );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4" data-testid="recorder">
      <div aria-live="polite" className="text-sm">
        {phase === "idle" && <p>{fmt(r.idle, { prep: preparationSeconds > 0 ? fmt(r.idlePrep, { n: preparationSeconds }) : "", max: formatDuration(responseSeconds) })}</p>}
        {phase === "preparing" && (
          <p className="font-medium">
            {r.preparing}: <span className="tabular-nums">{formatDuration(left)}</span>
          </p>
        )}
        {phase === "recording" && (
          <p className="font-medium text-danger">
            ● {r.recording} <span className="tabular-nums">{formatDuration(elapsed)}</span> / {formatDuration(responseSeconds)}
          </p>
        )}
        {phase === "recorded" && <p>{fmt(r.recorded, { d: formatDuration(elapsed) })}</p>}
        {phase === "submitting" && <p>{r.uploading}</p>}
        {phase === "submitted" && <p className="font-medium text-success">✓ {r.submitted}</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(phase === "idle" || phase === "error") && <Button onClick={begin}>{preparationSeconds > 0 ? r.startPrep : r.start}</Button>}
        {phase === "preparing" && (
          <Button
            variant="secondary"
            onClick={() => {
              clearTimer();
              startRecording();
            }}
          >
            {r.skipPrep}
          </Button>
        )}
        {phase === "recording" && (
          <Button variant="danger" onClick={stop}>
            {r.stop}
          </Button>
        )}
        {phase === "recorded" && allowRetry && (
          <Button variant="secondary" onClick={() => setPhase("idle")}>
            {r.again}
          </Button>
        )}
        {phase === "submitted" && allowRetry && (
          <Button variant="secondary" onClick={() => setPhase("idle")}>
            {r.newAttempt}
          </Button>
        )}
      </div>

      {url && (phase === "recorded" || phase === "submitting") && (
        <>
          <audio controls src={url} className="w-full" />
          <fieldset className="space-y-1 text-sm">
            <legend className="font-medium">{r.consent}</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="consent" checked={consent === "ai_processing"} onChange={() => setConsent("ai_processing")} className="mt-1" />
              <span>{r.consentAi}</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="consent" checked={consent === "recording_only"} onChange={() => setConsent("recording_only")} className="mt-1" />
              <span>{r.consentOnly}</span>
            </label>
          </fieldset>
          <Button onClick={submit} disabled={phase === "submitting" || !consent}>
            {r.submit}
          </Button>
        </>
      )}
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Notice, formatDuration } from "../ui";

type Phase = "idle" | "preparing" | "recording" | "recorded" | "submitting" | "submitted" | "error";

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

/**
 * Speech recorder. Audio stays in the browser until the learner presses Submit;
 * nothing is recorded before the learner presses Start, and the microphone is released when recording stops.
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
  onSubmit: (blob: Blob, durationSeconds: number, consent: "recording_only" | "ai_processing") => Promise<{ ok: boolean; error?: string }>;
}) {
  const [phase, setPhase] = useState<Phase>(alreadySubmitted ? "submitted" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState<"recording_only" | "ai_processing">("ai_processing");
  const blobRef = useRef<Blob | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const supported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (url) URL.revokeObjectURL(url);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(
        name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access in your browser's site settings, then try again."
          : name === "NotFoundError"
            ? "No microphone was found. Connect a microphone and try again."
            : "The microphone could not be started.",
      );
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
      setError("Recording was interrupted. Please try again.");
      setPhase("error");
    };
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
      blobRef.current = blob;
      if (url) URL.revokeObjectURL(url);
      setUrl(URL.createObjectURL(blob));
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
      setPhase(blob.size ? "recorded" : "error");
      if (!blob.size) setError("No audio was captured.");
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
    if (!blobRef.current) return;
    setPhase("submitting");
    const r = await onSubmit(blobRef.current, Math.max(1, elapsed), consent);
    if (r.ok) setPhase("submitted");
    else {
      setError(r.error ?? "Upload failed. Your recording is still here — try again.");
      setPhase("recorded");
    }
  }

  if (!supported)
    return (
      <Notice tone="warning" title="Recording not supported">
        This browser cannot record audio. Please use a recent version of Chrome, Edge, Firefox or Safari.
      </Notice>
    );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
      <div aria-live="polite" className="text-sm">
        {phase === "idle" && <p>Press Start when you are ready. {preparationSeconds > 0 ? `You will have ${preparationSeconds} seconds to prepare, then ` : ""}recording runs for up to {formatDuration(responseSeconds)}.</p>}
        {phase === "preparing" && (
          <p className="font-medium">
            Preparation time: <span className="tabular-nums">{formatDuration(left)}</span>
          </p>
        )}
        {phase === "recording" && (
          <p className="font-medium text-danger">
            ● Recording… <span className="tabular-nums">{formatDuration(elapsed)}</span> / {formatDuration(responseSeconds)}
          </p>
        )}
        {phase === "recorded" && <p>Recording ready ({formatDuration(elapsed)}). Listen back, then submit.</p>}
        {phase === "submitting" && <p>Uploading…</p>}
        {phase === "submitted" && <p className="font-medium text-success">✓ Recording submitted.</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(phase === "idle" || phase === "error") && <Button onClick={begin}>{preparationSeconds > 0 ? "Start (prepare)" : "Start recording"}</Button>}
        {phase === "preparing" && (
          <Button
            variant="secondary"
            onClick={() => {
              clearTimer();
              startRecording();
            }}
          >
            Skip preparation
          </Button>
        )}
        {phase === "recording" && (
          <Button variant="danger" onClick={stop}>
            ■ Stop
          </Button>
        )}
        {phase === "recorded" && allowRetry && (
          <Button variant="secondary" onClick={() => setPhase("idle")}>
            Record again
          </Button>
        )}
        {phase === "submitted" && allowRetry && (
          <Button variant="secondary" onClick={() => setPhase("idle")}>
            New attempt
          </Button>
        )}
      </div>

      {url && (phase === "recorded" || phase === "submitting") && (
        <>
          <audio controls src={url} className="w-full" />
          <fieldset className="space-y-1 text-sm">
            <legend className="font-medium">Processing consent</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="consent" checked={consent === "ai_processing"} onChange={() => setConsent("ai_processing")} className="mt-1" />
              <span>Save my recording and send it to the AI providers for transcription and feedback (OpenAI speech-to-text, Anthropic Claude). See the privacy policy.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="consent" checked={consent === "recording_only"} onChange={() => setConsent("recording_only")} className="mt-1" />
              <span>Only save my recording for self-review (no external processing).</span>
            </label>
          </fieldset>
          <Button onClick={submit} disabled={phase === "submitting"}>
            Submit recording
          </Button>
        </>
      )}
    </div>
  );
}

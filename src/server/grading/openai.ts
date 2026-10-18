import type { Transcriber } from "./types";

/** Speech-to-text via OpenAI's transcription endpoint. Audio is sent only after the learner consents to AI processing. */
export const openaiTranscriber: Transcriber = {
  name: "openai",
  async transcribe(audio, mimeType) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, status: "unavailable", error: "OPENAI_API_KEY is not configured" };
    const model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
    const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), `speech.${ext}`);
    form.append("model", model);
    form.append("language", "en");
    form.append("response_format", "json");
    try {
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: AbortSignal.timeout(90_000),
      });
      if (res.status === 401) return { ok: false, status: "unavailable", error: "Invalid OpenAI API key" };
      if (!res.ok) return { ok: false, status: "failed", error: `Transcription provider error (${res.status})` };
      const json = (await res.json()) as { text?: unknown };
      if (typeof json.text !== "string") return { ok: false, status: "failed", error: "Malformed transcription response" };
      return { ok: true, text: json.text.trim(), model };
    } catch {
      return { ok: false, status: "failed", error: "Transcription timed out or failed; retry later" };
    }
  },
};

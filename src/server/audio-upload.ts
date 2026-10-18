/** Validation for learner speech recordings (server-side; never trust the browser's declared type). */
export const MAX_RECORDING_BYTES = 10 * 1024 * 1024;
export const ALLOWED_AUDIO = ["audio/webm", "audio/ogg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/mpeg"] as const;

export function sniffAudio(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "audio/webm";
  if (buf.toString("ascii", 0, 4) === "OggS") return "audio/ogg";
  if (buf.toString("ascii", 4, 8) === "ftyp") return "audio/mp4";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE") return "audio/wav";
  if (buf.toString("ascii", 0, 3) === "ID3" || (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0)) return "audio/mpeg";
  return null;
}

export function validateRecording(buf: Buffer, declaredType: string): { ok: true; mime: string } | { ok: false; error: string } {
  if (buf.length === 0) return { ok: false, error: "The recording is empty." };
  if (buf.length > MAX_RECORDING_BYTES) return { ok: false, error: "The recording is larger than 10 MB." };
  const sniffed = sniffAudio(buf);
  if (!sniffed) return { ok: false, error: "Unsupported audio format." };
  const declared = declaredType.split(";")[0]!.trim();
  if (declared && declared !== sniffed && !(sniffed === "audio/wav" && declared === "audio/x-wav") && !(sniffed === "audio/webm" && declared === "video/webm"))
    return { ok: false, error: "Audio content does not match its declared type." };
  return { ok: true, mime: sniffed };
}

/**
 * npm run audio:generate [-- --provider sapi|openai] [--force] [--only <id>]
 *
 * Renders every listening script to /public/audio/<id>.mp3 and records it in content/audio-manifest.json.
 *  - sapi   (default, development): Windows built-in voices via System.Speech. Clearly labelled as synthetic dev audio.
 *  - openai (production option):    OpenAI TTS (OPENAI_API_KEY). Must still be quality-reviewed in /admin/audio.
 * Segments are joined with short pauses; unchanged scripts are skipped (content hash).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Mp3Encoder } from "@breezystack/lamejs";
import { loadBundle } from "../content/index";
import type { ListeningSet } from "../src/domain/content-schema";

const args = process.argv.slice(2);
const provider = args.includes("--provider") ? args[args.indexOf("--provider") + 1] : "sapi";
const force = args.includes("--force");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const OUT = path.join(process.cwd(), "public", "audio");
const MANIFEST = path.join(process.cwd(), "content", "audio-manifest.json");
const RATE = provider === "openai" ? 24000 : 22050;

type Entry = { file: string; durationSeconds: number; method: string; voices: Record<string, string>; hash: string };

function hashSet(s: ListeningSet) {
  return createHash("sha256").update(JSON.stringify([provider, s.segments])).digest("hex").slice(0, 16);
}

function readWavPcm(file: string): Int16Array {
  const buf = fs.readFileSync(file);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") return new Int16Array(buf.buffer.slice(buf.byteOffset + off + 8, buf.byteOffset + off + 8 + size));
    off += 8 + size + (size % 2);
  }
  throw new Error(`No data chunk in ${file}`);
}

const silence = (seconds: number) => new Int16Array(Math.round(RATE * seconds));

function sapiSegments(sets: ListeningSet[], tmp: string) {
  const jobs = sets.flatMap((s) =>
    s.segments.map((seg, i) => ({
      out: path.join(tmp, `${s.id}-${i}.wav`),
      voice: seg.voice === "male" ? "Microsoft David Desktop" : "Microsoft Zira Desktop",
      rate: s.level === "B1" ? -1 : 0,
      text: seg.text,
    })),
  );
  const jobFile = path.join(tmp, "jobs.json");
  fs.writeFileSync(jobFile, JSON.stringify(jobs), "utf8");
  const ps = `
Add-Type -AssemblyName System.Speech
$jobs = Get-Content -Raw -Encoding UTF8 '${jobFile}' | ConvertFrom-Json
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(${RATE}, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
foreach ($j in $jobs) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice($j.voice)
  $s.Rate = [int]$j.rate
  $s.SetOutputToWaveFile($j.out, $fmt)
  $s.Speak([string]$j.text)
  $s.Dispose()
}`;
  const psFile = path.join(tmp, "synth.ps1");
  fs.writeFileSync(psFile, "﻿" + ps, "utf8");
  execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psFile], { stdio: "inherit" });
  return (s: ListeningSet, i: number) => readWavPcm(path.join(tmp, `${s.id}-${i}.wav`));
}

async function openaiSegment(text: string, voice: "male" | "female"): Promise<Int16Array> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required for --provider openai");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts", voice: voice === "male" ? "onyx" : "nova", input: text, response_format: "pcm" }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS failed: ${res.status} ${await res.text()}`);
  const ab = await res.arrayBuffer();
  return new Int16Array(ab.slice(0, ab.byteLength - (ab.byteLength % 2)));
}

function encodeMp3(pcm: Int16Array): Buffer {
  const enc = new Mp3Encoder(1, RATE, 48);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (out.length) chunks.push(new Uint8Array(out));
  }
  const end = enc.flush();
  if (end.length) chunks.push(new Uint8Array(end));
  return Buffer.concat(chunks);
}

function concat(parts: Int16Array[]) {
  const out = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest: Record<string, Entry> = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const all = loadBundle().listening.filter((s) => !only || s.id === only);
  const todo = all.filter((s) => force || manifest[s.id]?.hash !== hashSet(s) || !fs.existsSync(path.join(OUT, `${s.id}.mp3`)));
  console.log(`${todo.length} of ${all.length} recordings need rendering (provider: ${provider}).`);
  if (!todo.length) return;
  if (provider === "sapi" && process.platform !== "win32") throw new Error("The sapi provider only runs on Windows. Use --provider openai.");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vstep-audio-"));
  const getSapi = provider === "sapi" ? sapiSegments(todo, tmp) : null;
  for (const s of todo) {
    const parts: Int16Array[] = [silence(0.6)];
    for (let i = 0; i < s.segments.length; i++) {
      const seg = s.segments[i]!;
      parts.push(getSapi ? getSapi(s, i) : await openaiSegment(seg.text, seg.voice));
      const nextSpeakerChanges = s.segments[i + 1] && s.segments[i + 1]!.speaker !== seg.speaker;
      parts.push(silence(nextSpeakerChanges ? 0.5 : 0.8));
    }
    const pcm = concat(parts);
    fs.writeFileSync(path.join(OUT, `${s.id}.mp3`), encodeMp3(pcm));
    manifest[s.id] = {
      file: `${s.id}.mp3`,
      durationSeconds: Math.round((pcm.length / RATE) * 10) / 10,
      method: provider === "sapi" ? "windows_sapi_dev" : "openai_tts",
      voices: Object.fromEntries(s.segments.map((g) => [g.speaker, provider === "sapi" ? (g.voice === "male" ? "Microsoft David" : "Microsoft Zira") : g.voice === "male" ? "onyx" : "nova"])),
      hash: hashSet(s),
    };
    console.log(`  ✓ ${s.id} (${manifest[s.id]!.durationSeconds}s)`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
  console.log("Manifest updated. Run `npm run db:seed` to register audio in the database.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

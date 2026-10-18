import {
  blueprintSchema,
  listeningSetSchema,
  readingSetSchema,
  speakingPromptSchema,
  writingPromptSchema,
  type BlueprintContent,
  type ListeningSet,
  type Mcq,
  type ReadingSet,
  type SpeakingPromptContent,
  type WritingPromptContent,
} from "./content-schema";
import type { ExamSpec } from "./spec";
import { containsQuote, countWords, splitParagraphs } from "./text";

export type Issue = { severity: "error" | "warning"; entity: string; message: string };

export type ContentBundle = {
  reading: ReadingSet[];
  listening: ListeningSet[];
  writing: WritingPromptContent[];
  speaking: SpeakingPromptContent[];
  blueprints: BlueprintContent[];
  sourceIds: string[];
};

/** Mentions of a specific option letter in an explanation such as "(B)" or "Option B" or "answer is B". */
function lettersMentionedAsAnswer(explanation: string): string[] {
  const found = new Set<string>();
  // Letters are matched case-sensitively so the article "a" is not mistaken for option A.
  for (const m of explanation.matchAll(/\b(?:[Aa]nswer|[Cc]orrect)\b[^.]{0,20}?\b\(?([A-D])\)?(?=[\s,.;:)]|$)/g)) found.add(m[1]!);
  return [...found];
}

export function validateMcq(q: Mcq, units: Map<string, string>, entity: string): Issue[] {
  const issues: Issue[] = [];
  const e = `${entity}/${q.id}`;
  const texts = Object.values(q.options).map((t) => t.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) issues.push({ severity: "error", entity: e, message: "Duplicate option text" });
  if (!(q.answer in q.options)) issues.push({ severity: "error", entity: e, message: "Answer key not among options" });
  const unit = units.get(q.evidence.ref);
  if (!unit) issues.push({ severity: "error", entity: e, message: `Evidence ref ${q.evidence.ref} does not exist` });
  else if (!containsQuote(unit, q.evidence.quote))
    issues.push({ severity: "error", entity: e, message: `Evidence quote not found verbatim in ${q.evidence.ref}: "${q.evidence.quote.slice(0, 60)}"` });
  const mentioned = lettersMentionedAsAnswer(q.explanation);
  if (mentioned.length && !mentioned.includes(q.answer))
    issues.push({ severity: "error", entity: e, message: `Explanation names ${mentioned.join(",")} as the answer but key is ${q.answer}` });
  if (q.distractors && q.answer in q.distractors) issues.push({ severity: "error", entity: e, message: "Distractor note written for the correct option" });
  if (/\b(?:[Oo]ption|[Aa]nswer|[Cc]hoice)s? [A-D]\b|\([A-D]\)/.test(q.explanation))
    issues.push({ severity: "error", entity: e, message: "Explanation refers to an option letter; letters change when options are shuffled" });
  if (Object.values(q.options).some((t) => /\b(all|none|both) of the above\b/i.test(t)))
    issues.push({ severity: "error", entity: e, message: "Position-dependent option text is not allowed" });
  if (q.type === "vocabulary" && !/["“']/.test(q.prompt) && !/\bword\b|\bphrase\b/i.test(q.prompt))
    issues.push({ severity: "warning", entity: e, message: "Vocabulary item does not quote the target word" });
  return issues;
}

export function readingUnits(set: ReadingSet) {
  return new Map(splitParagraphs(set.passage).map((p, i) => [`P${i + 1}`, p]));
}
export function listeningUnits(set: ListeningSet) {
  return new Map(set.segments.map((s, i) => [`S${i + 1}`, s.text]));
}

export function validateReadingSet(set: ReadingSet): Issue[] {
  const parsed = readingSetSchema.safeParse(set);
  if (!parsed.success) return [{ severity: "error", entity: set.id, message: parsed.error.message }];
  const units = readingUnits(set);
  return set.questions.flatMap((q) => validateMcq(q, units, set.id));
}

export function validateListeningSet(set: ListeningSet): Issue[] {
  const parsed = listeningSetSchema.safeParse(set);
  if (!parsed.success) return [{ severity: "error", entity: set.id, message: parsed.error.message }];
  const units = listeningUnits(set);
  const issues = set.questions.flatMap((q) => validateMcq(q, units, set.id));
  const voices = new Map<string, string>();
  for (const s of set.segments) {
    const prev = voices.get(s.speaker);
    if (prev && prev !== s.voice) issues.push({ severity: "error", entity: set.id, message: `Speaker ${s.speaker} uses two voices` });
    voices.set(s.speaker, s.voice);
  }
  return issues;
}

export function validateWritingPrompt(p: WritingPromptContent): Issue[] {
  const parsed = writingPromptSchema.safeParse(p);
  if (!parsed.success) return [{ severity: "error", entity: p.id, message: parsed.error.message }];
  const issues: Issue[] = [];
  const wc = countWords(p.sample.text);
  if (wc < p.minWords) issues.push({ severity: "error", entity: p.id, message: `Sample response has ${wc} words, below the ${p.minWords}-word requirement` });
  if (p.task === "letter" && !p.stimulus) issues.push({ severity: "warning", entity: p.id, message: "Letter task has no stimulus text" });
  return issues;
}

export function validateSpeakingPrompt(p: SpeakingPromptContent): Issue[] {
  const parsed = speakingPromptSchema.safeParse(p);
  if (!parsed.success) return [{ severity: "error", entity: p.id, message: parsed.error.message }];
  return [];
}

/** Structural validation of a blueprint against the active exam specification. */
export function validateBlueprint(bp: BlueprintContent, bundle: ContentBundle, spec: ExamSpec): Issue[] {
  const parsed = blueprintSchema.safeParse(bp);
  if (!parsed.success) return [{ severity: "error", entity: bp.id, message: parsed.error.message }];
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ severity: "error", entity: bp.id, message });
  const reading = new Map(bundle.reading.map((r) => [r.id, r]));
  const listening = new Map(bundle.listening.map((r) => [r.id, r]));
  const writing = new Map(bundle.writing.map((r) => [r.id, r]));
  const speaking = new Map(bundle.speaking.map((r) => [r.id, r]));
  const lookup = { reading, listening, writing, speaking } as const;

  for (const sec of bp.sections) {
    for (const id of sec.items) {
      const item = lookup[sec.skill].get(id);
      if (!item) err(`${sec.skill} item "${id}" not found`);
      else if (bp.status === "published" && item.status !== "published" && item.status !== "reviewed")
        err(`${sec.skill} item "${id}" is ${item.status}; published tests need reviewed content`);
    }
    if (bp.kind === "practice" && bp.skill && sec.skill !== bp.skill) err(`Practice test for ${bp.skill} contains a ${sec.skill} section`);
  }
  if (bp.kind !== "mock") return issues;

  const order = bp.sections.map((s) => s.skill).join(",");
  if (order !== "listening,reading,writing,speaking") err(`Mock section order must be listening,reading,writing,speaking (got ${order})`);

  const sec = (skill: string) => bp.sections.find((s) => s.skill === skill);
  const L = sec("listening");
  if (L) {
    if (L.timeLimitMinutes !== spec.listening.minutes) err(`Listening time ${L.timeLimitMinutes} ≠ spec ${spec.listening.minutes}`);
    const sets = L.items.map((id) => listening.get(id)).filter(Boolean) as ListeningSet[];
    const total = sets.reduce((n, s) => n + s.questions.length, 0);
    if (total !== spec.listening.totalQuestions) err(`Listening has ${total} questions; spec requires ${spec.listening.totalQuestions}`);
    for (const p of spec.listening.parts) {
      const partSets = sets.filter((s) => s.part === p.part);
      const q = partSets.reduce((n, s) => n + s.questions.length, 0);
      if (q !== p.questions) err(`Listening part ${p.part} has ${q} questions; spec ${p.questions}`);
      if (partSets.length !== p.sets) err(`Listening part ${p.part} has ${partSets.length} recordings; spec ${p.sets}`);
    }
    const parts = sets.map((s) => s.part);
    if (parts.some((p, i) => i > 0 && p < parts[i - 1]!)) err("Listening sets are not ordered by part");
  }
  const R = sec("reading");
  if (R) {
    if (R.timeLimitMinutes !== spec.reading.minutes) err(`Reading time ${R.timeLimitMinutes} ≠ spec ${spec.reading.minutes}`);
    const sets = R.items.map((id) => reading.get(id)).filter(Boolean) as ReadingSet[];
    if (sets.length !== spec.reading.passages) err(`Reading has ${sets.length} passages; spec ${spec.reading.passages}`);
    for (const s of sets)
      if (s.questions.length !== spec.reading.questionsPerPassage) err(`Passage ${s.id} has ${s.questions.length} questions; spec ${spec.reading.questionsPerPassage}`);
    const words = sets.reduce((n, s) => n + countWords(s.passage), 0);
    const [tMin, tMax] = spec.reading.totalWordsTolerance;
    const [rMin, rMax] = spec.reading.totalWordsRange;
    if (words < tMin || words > tMax) err(`Reading total ${words} words outside tolerance ${tMin}-${tMax}`);
    else if (words < rMin || words > rMax)
      issues.push({ severity: "warning", entity: bp.id, message: `Reading total ${words} words outside decree range ${rMin}-${rMax}` });
  }
  const W = sec("writing");
  if (W) {
    if (W.timeLimitMinutes !== spec.writing.minutes) err(`Writing time ${W.timeLimitMinutes} ≠ spec ${spec.writing.minutes}`);
    const tasks = W.items.map((id) => writing.get(id)?.task);
    if (tasks.join(",") !== spec.writing.tasks.map((t) => t.task).join(",")) err(`Writing tasks ${tasks.join(",")} do not match spec`);
    for (const id of W.items) {
      const p = writing.get(id);
      const req = spec.writing.tasks.find((t) => t.task === p?.task);
      if (p && req && p.minWords !== req.minWords) err(`Writing ${id} min words ${p.minWords} ≠ spec ${req.minWords}`);
    }
  }
  const S = sec("speaking");
  if (S) {
    if (S.timeLimitMinutes !== spec.speaking.minutes) err(`Speaking time ${S.timeLimitMinutes} ≠ spec ${spec.speaking.minutes}`);
    const parts = S.items.map((id) => speaking.get(id)?.content.part);
    if (parts.join(",") !== "1,2,3") err(`Speaking parts ${parts.join(",")} must be 1,2,3`);
  }
  for (const skill of ["listening", "reading", "writing", "speaking"]) if (!sec(skill)) err(`Mock is missing ${skill}`);
  return issues;
}

export function validateBundle(bundle: ContentBundle, spec: ExamSpec): Issue[] {
  const issues: Issue[] = [];
  const ids = new Map<string, string>();
  const claim = (id: string, kind: string) => {
    if (ids.has(id)) issues.push({ severity: "error", entity: id, message: `Duplicate id (also a ${ids.get(id)})` });
    ids.set(id, kind);
  };
  for (const r of bundle.reading) {
    claim(r.id, "reading set");
    r.questions.forEach((q) => claim(q.id, "question"));
    issues.push(...validateReadingSet(r));
  }
  for (const l of bundle.listening) {
    claim(l.id, "listening set");
    l.questions.forEach((q) => claim(q.id, "question"));
    issues.push(...validateListeningSet(l));
  }
  for (const w of bundle.writing) {
    claim(w.id, "writing prompt");
    issues.push(...validateWritingPrompt(w));
  }
  for (const s of bundle.speaking) {
    claim(s.id, "speaking prompt");
    issues.push(...validateSpeakingPrompt(s));
  }
  for (const b of bundle.blueprints) {
    claim(b.id, "blueprint");
    issues.push(...validateBlueprint(b, bundle, spec));
  }
  const all = [...bundle.reading, ...bundle.listening, ...bundle.writing, ...bundle.speaking];
  for (const item of all) {
    const src = item.provenance.sourceId;
    if (src && !bundle.sourceIds.includes(src)) issues.push({ severity: "error", entity: item.id, message: `Unknown source ${src}` });
    if (item.provenance.type !== "original" && !src) issues.push({ severity: "error", entity: item.id, message: "Non-original content requires a source" });
    if (item.status === "published" && item.provenance.license === "unlicensed")
      issues.push({ severity: "error", entity: item.id, message: "Unlicensed content cannot be published" });
  }
  // Mocks must not share content with each other (keeps each mock a fresh, unseen paper).
  const used = new Map<string, string>();
  for (const b of bundle.blueprints.filter((b) => b.kind === "mock"))
    for (const s of b.sections)
      for (const id of s.items) {
        if (used.has(id)) issues.push({ severity: "error", entity: b.id, message: `Item ${id} also used in ${used.get(id)}` });
        used.set(id, b.id);
      }
  return issues;
}

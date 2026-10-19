/** Assembles and normalises the version-controlled content bundle. */
import {
  blueprintSchema,
  listeningSetSchema,
  readingSetSchema,
  sourceSchema,
  speakingPromptSchema,
  writingPromptSchema,
  type ListeningSetInput,
  type ReadingSetInput,
} from "@/domain/content-schema";
import type { ContentBundle } from "@/domain/content-validation";
import { shuffleMcq } from "@/domain/shuffle";
import sourcesJson from "./sources.json";
import { readingMock1 } from "./reading/mock1";
import { readingMock2 } from "./reading/mock2";
import { readingMock3 } from "./reading/mock3";
import { readingMock4 } from "./reading/mock4";
import { readingMock5 } from "./reading/mock5";
import { readingPractice } from "./reading/practice";
import { listeningMock1 } from "./listening/mock1";
import { listeningMock2 } from "./listening/mock2";
import { listeningMock3 } from "./listening/mock3";
import { listeningMock4 } from "./listening/mock4";
import { listeningMock5 } from "./listening/mock5";
import { listeningPractice } from "./listening/practice";
import { writingPrompts } from "./writing";
import { speakingPrompts } from "./speaking";
import { blueprints } from "./blueprints";

export const RAW = {
  reading: [...readingMock1, ...readingMock2, ...readingMock3, ...readingMock4, ...readingMock5, ...readingPractice] as ReadingSetInput[],
  listening: [...listeningMock1, ...listeningMock2, ...listeningMock3, ...listeningMock4, ...listeningMock5, ...listeningPractice] as ListeningSetInput[],
};

/** Parses with defaults applied; throws with the offending id if a record is malformed. */
function parseAll<T>(items: unknown[], schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } }, kind: string): T[] {
  return items.map((it) => {
    const r = schema.safeParse(it);
    if (!r.success) throw new Error(`Invalid ${kind} ${(it as { id?: string }).id}: ${r.error.message}`);
    return r.data;
  });
}

export function loadBundle(): ContentBundle {
  const reading = parseAll(RAW.reading, readingSetSchema, "reading set").map((s) => ({ ...s, questions: s.questions.map(shuffleMcq) }));
  const listening = parseAll(RAW.listening, listeningSetSchema, "listening set").map((s) => ({ ...s, questions: s.questions.map(shuffleMcq) }));
  return {
    reading,
    listening,
    writing: parseAll(writingPrompts, writingPromptSchema, "writing prompt"),
    speaking: parseAll(speakingPrompts, speakingPromptSchema, "speaking prompt"),
    blueprints: parseAll(blueprints, blueprintSchema, "blueprint"),
    sourceIds: loadSources().map((s) => s.id),
  };
}

export function loadSources() {
  return parseAll(sourcesJson, sourceSchema, "source");
}

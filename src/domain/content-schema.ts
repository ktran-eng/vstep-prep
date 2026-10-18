/**
 * Version-controlled content format (files under /content). Content is authored here,
 * validated by `npm run content:validate`, and loaded into the database by `npm run db:seed`.
 */
import { z } from "zod";

export const LEVELS = ["B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];
export const SKILLS = ["listening", "reading", "writing", "speaking"] as const;
export type Skill = (typeof SKILLS)[number];

export const QUESTION_TYPES = [
  "main_idea",
  "detail",
  "vocabulary",
  "reference",
  "inference",
  "purpose",
  "attitude",
  "organisation",
  "gist",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const PROVENANCE = ["original", "official_sample", "licensed", "adapted"] as const;
export const STATUSES = ["draft", "validated", "reviewed", "published", "archived"] as const;
export type ContentStatus = (typeof STATUSES)[number];

const level = z.enum(LEVELS);
const optionKey = z.enum(["A", "B", "C", "D"]);

export const provenanceSchema = z.object({
  type: z.enum(PROVENANCE).default("original"),
  sourceId: z.string().optional(),
  license: z.string().default("owned"),
  note: z.string().optional(),
});

export const mcqSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.number().int().min(1).max(5),
  prompt: z.string().min(5),
  options: z.object({ A: z.string().min(1), B: z.string().min(1), C: z.string().min(1), D: z.string().min(1) }),
  answer: optionKey,
  explanation: z.string().min(20),
  /** ref = paragraph id ("P1"…) for reading, segment id ("S1"…) for listening; quote must appear verbatim in that unit. */
  evidence: z.object({ ref: z.string().regex(/^[PS]\d+$/), quote: z.string().min(3) }),
  distractors: z.record(z.string(), z.string()).optional(),
  vocab: z.array(z.object({ term: z.string(), note: z.string() })).optional(),
  objective: z.string().optional(),
});
export type Mcq = z.infer<typeof mcqSchema>;

export const readingSetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  level,
  topic: z.string(),
  status: z.enum(STATUSES).default("reviewed"),
  provenance: provenanceSchema.default({ type: "original", license: "owned" }),
  /** Paragraphs separated by a blank line; paragraph n has id "P{n}". */
  passage: z.string().min(200),
  questions: z.array(mcqSchema).min(1),
});
export type ReadingSet = z.infer<typeof readingSetSchema>;

export const VOICES = ["male", "female"] as const;
export const listeningSetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  level,
  topic: z.string(),
  status: z.enum(STATUSES).default("reviewed"),
  provenance: provenanceSchema.default({ type: "original", license: "owned" }),
  /** Segment n has id "S{n}". */
  segments: z.array(z.object({ speaker: z.string(), voice: z.enum(VOICES), text: z.string().min(2) })).min(1),
  questions: z.array(mcqSchema).min(1),
});
export type ListeningSet = z.infer<typeof listeningSetSchema>;

export const writingPromptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  task: z.enum(["letter", "essay"]),
  level,
  title: z.string(),
  topic: z.string(),
  status: z.enum(STATUSES).default("reviewed"),
  provenance: provenanceSchema.default({ type: "original", license: "owned" }),
  instructions: z.string().min(20),
  stimulus: z.string().optional(),
  requiredPoints: z.array(z.string()).min(1),
  minWords: z.number().int().positive(),
  suggestedMinutes: z.number().int().positive(),
  sample: z.object({ level, text: z.string().min(80) }),
});
export type WritingPromptContent = z.infer<typeof writingPromptSchema>;

const speakingPart1 = z.object({
  part: z.literal(1),
  topics: z.array(z.object({ name: z.string(), questions: z.array(z.string()).min(3) })).length(2),
});
const speakingPart2 = z.object({
  part: z.literal(2),
  situation: z.string().min(20),
  options: z.array(z.string()).length(3),
});
const speakingPart3 = z.object({
  part: z.literal(3),
  topic: z.string().min(5),
  ideas: z.array(z.string()).min(3),
  followUps: z.array(z.string()).min(2),
});

export const speakingPromptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  level,
  title: z.string(),
  topic: z.string(),
  status: z.enum(STATUSES).default("reviewed"),
  provenance: provenanceSchema.default({ type: "original", license: "owned" }),
  instructions: z.string(),
  content: z.discriminatedUnion("part", [speakingPart1, speakingPart2, speakingPart3]),
  preparationSeconds: z.number().int().min(0),
  responseSeconds: z.number().int().positive(),
  modelResponse: z.string().min(80),
  usefulLanguage: z.array(z.string()).min(3),
});
export type SpeakingPromptContent = z.infer<typeof speakingPromptSchema>;

/** A test blueprint as authored. Sections reference content ids. */
export const blueprintSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string(),
  kind: z.enum(["mock", "practice"]),
  skill: z.enum(SKILLS).optional(),
  targetLevel: z.enum(["B1", "B2", "C1", "B1-C1"]),
  status: z.enum(STATUSES).default("published"),
  sections: z
    .array(
      z.object({
        skill: z.enum(SKILLS),
        timeLimitMinutes: z.number().positive(),
        /** reading/listening set ids, writing prompt ids or speaking prompt ids, in order */
        items: z.array(z.string()).min(1),
      }),
    )
    .min(1),
});
export type BlueprintContent = z.infer<typeof blueprintSchema>;

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  canonicalUrl: z.string().url().nullable(),
  sourceType: z.enum(["official_regulation", "institutional", "commercial_prep", "reference", "original"]),
  publicationDate: z.string().nullable(),
  lastVerifiedAt: z.string(),
  licenseType: z.string(),
  permissionStatus: z.enum(["link_only", "public_document", "owned"]),
  attributionText: z.string(),
  contentCovered: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
});
export type SourceRecord = z.infer<typeof sourceSchema>;

/** Authoring types (defaults optional). Content files use these; loaders parse into the output types. */
export type ReadingSetInput = z.input<typeof readingSetSchema>;
export type ListeningSetInput = z.input<typeof listeningSetSchema>;
export type WritingPromptInput = z.input<typeof writingPromptSchema>;
export type SpeakingPromptInput = z.input<typeof speakingPromptSchema>;
export type BlueprintInput = z.input<typeof blueprintSchema>;

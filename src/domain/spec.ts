/**
 * Exam specification and scoring policy (versioned defaults).
 * Seeded into `exam_specifications` / `scoring_configs`; the active DB row is authoritative at runtime
 * and can be changed from /admin/scoring without code changes.
 * Evidence for each value: docs/SPECIFICATION_RESEARCH.md
 */
import { z } from "zod";

export const examSpecSchema = z.object({
  version: z.string(),
  sourceIds: z.array(z.string()),
  listening: z.object({
    minutes: z.number(),
    totalQuestions: z.number().int(),
    parts: z.array(z.object({ part: z.number().int(), questions: z.number().int(), sets: z.number().int(), questionsPerSet: z.number().int() })),
    partSplitVerified: z.boolean(),
    strictPlaysAllowed: z.number().int().min(1),
  }),
  reading: z.object({
    minutes: z.number(),
    passages: z.number().int(),
    questionsPerPassage: z.number().int(),
    totalWordsRange: z.tuple([z.number(), z.number()]),
    totalWordsTolerance: z.tuple([z.number(), z.number()]),
  }),
  writing: z.object({
    minutes: z.number(),
    tasks: z.array(z.object({ task: z.enum(["letter", "essay"]), minWords: z.number().int(), weight: z.number() })),
  }),
  speaking: z.object({
    minutes: z.number(),
    parts: z.array(z.object({ part: z.number().int(), name: z.string(), preparationSeconds: z.number().int(), responseSeconds: z.number().int() })),
    timingVerified: z.boolean(),
  }),
});
export type ExamSpec = z.infer<typeof examSpecSchema>;

export const DEFAULT_EXAM_SPEC: ExamSpec = {
  version: "vstep35-2015.1",
  sourceIds: ["moet-qd-729-2015", "ulis-vstep-test-format", "zim-vstep-sample"],
  listening: {
    minutes: 40,
    totalQuestions: 35,
    parts: [
      { part: 1, questions: 8, sets: 8, questionsPerSet: 1 },
      { part: 2, questions: 12, sets: 3, questionsPerSet: 4 },
      { part: 3, questions: 15, sets: 3, questionsPerSet: 5 },
    ],
    partSplitVerified: false,
    strictPlaysAllowed: 1,
  },
  reading: { minutes: 60, passages: 4, questionsPerPassage: 10, totalWordsRange: [1900, 2050], totalWordsTolerance: [1600, 2600] },
  writing: {
    minutes: 60,
    tasks: [
      { task: "letter", minWords: 120, weight: 1 / 3 },
      { task: "essay", minWords: 250, weight: 2 / 3 },
    ],
  },
  speaking: {
    minutes: 12,
    parts: [
      { part: 1, name: "Social interaction", preparationSeconds: 0, responseSeconds: 180 },
      { part: 2, name: "Solution discussion", preparationSeconds: 60, responseSeconds: 120 },
      { part: 3, name: "Topic development", preparationSeconds: 60, responseSeconds: 240 },
    ],
    timingVerified: false,
  },
};

export const scoringConfigSchema = z.object({
  version: z.string(),
  /** Rounding step for skill and overall scores (decree: 0.5). */
  roundingStep: z.number().positive(),
  /** Band table from QĐ 729/QĐ-BGDĐT, Section II.2. Applied to the rounded 4-skill average. */
  bands: z.array(z.object({ min: z.number(), max: z.number(), level: z.enum(["below_B1", "B1", "B2", "C1"]), vstepLevel: z.string() })),
  /**
   * Objective-skill estimate. No official raw→0-10 table is public, so this is a transparent practice estimate.
   * "linear": estimate = 10 * correct / total. "table": piecewise mapping of accuracy → score.
   */
  objectiveEstimate: z.discriminatedUnion("method", [
    z.object({ method: z.literal("linear") }),
    z.object({ method: z.literal("table"), points: z.array(z.object({ accuracy: z.number().min(0).max(1), score: z.number().min(0).max(10) })).min(2) }),
  ]),
  /** Productive skills: rubric criteria are scored 0-10; skill estimate = weighted mean. */
  writingTaskWeights: z.object({ letter: z.number(), essay: z.number() }),
  official: z.literal(false),
});
export type ScoringConfig = z.infer<typeof scoringConfigSchema>;

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  version: "practice-estimate-1",
  roundingStep: 0.5,
  bands: [
    { min: 0, max: 3.5, level: "below_B1", vstepLevel: "Không xét" },
    { min: 4, max: 5.5, level: "B1", vstepLevel: "Bậc 3" },
    { min: 6, max: 8, level: "B2", vstepLevel: "Bậc 4" },
    { min: 8.5, max: 10, level: "C1", vstepLevel: "Bậc 5" },
  ],
  objectiveEstimate: { method: "linear" },
  writingTaskWeights: { letter: 1 / 3, essay: 2 / 3 },
  official: false,
};

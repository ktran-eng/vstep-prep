import { z } from "zod";

/** Output contract for AI writing feedback. Validated after parsing; scores are clamped and rounded to 0.5. */
export const criterionResultSchema = z.object({
  key: z.string(),
  score: z.number(),
  evidence: z.string(),
  comment: z.string(),
});

export const correctionSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  explanation: z.string(),
  category: z.enum(["grammar", "vocabulary", "spelling", "punctuation", "register", "coherence"]),
});

export const writingFeedbackSchema = z.object({
  criteria: z.array(criterionResultSchema),
  strengths: z.array(z.string()),
  priorities: z.array(z.string()),
  corrections: z.array(correctionSchema),
  organisationFeedback: z.string(),
  missingRequirements: z.array(z.string()),
  revisionPlan: z.array(z.string()),
  summaryVi: z.string(),
});
export type WritingFeedback = z.infer<typeof writingFeedbackSchema>;

export const speakingFeedbackSchema = z.object({
  criteria: z.array(criterionResultSchema),
  strengths: z.array(z.string()),
  priorities: z.array(z.string()),
  corrections: z.array(correctionSchema),
  missingRequirements: z.array(z.string()),
  revisionPlan: z.array(z.string()),
  summaryVi: z.string(),
});
export type SpeakingFeedback = z.infer<typeof speakingFeedbackSchema>;

export type GradingResult<T> =
  | { ok: true; feedback: T; overall: number; criterionScores: Record<string, number>; model: string }
  | { ok: false; status: "unavailable" | "failed"; error: string };

export interface WritingGrader {
  readonly name: string;
  grade(input: { task: "letter" | "essay"; instructions: string; stimulus: string | null; requiredPoints: string[]; minWords: number; response: string; wordCount: number; targetLevel: string }): Promise<GradingResult<WritingFeedback>>;
}

export interface SpeakingGrader {
  readonly name: string;
  grade(input: { part: number; promptText: string; transcript: string; durationSeconds: number; targetLevel: string }): Promise<GradingResult<SpeakingFeedback>>;
}

export interface Transcriber {
  readonly name: string;
  transcribe(audio: Buffer, mimeType: string): Promise<{ ok: true; text: string; model: string } | { ok: false; status: "unavailable" | "failed"; error: string }>;
}

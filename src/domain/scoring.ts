import type { ScoringConfig } from "./spec";

export function roundToStep(value: number, step: number): number {
  // Round half up on the step grid; guard against float noise (e.g. 5.749999).
  return Math.round(Math.round((value / step) * 1e6) / 1e6) * step;
}

export function clampScore(v: number) {
  return Math.min(10, Math.max(0, v));
}

export type ObjectiveItemResult = {
  questionId: string;
  type: string;
  difficulty: number;
  response: string | null;
  correctAnswer: string;
};

export type ObjectiveSummary = {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number; // 0..1 over all items
  byType: Record<string, { total: number; correct: number }>;
  byDifficulty: Record<string, { total: number; correct: number }>;
};

export function gradeObjective(items: ObjectiveItemResult[]): ObjectiveSummary {
  const summary: ObjectiveSummary = { total: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0, byType: {}, byDifficulty: {} };
  for (const it of items) {
    summary.total++;
    const t = (summary.byType[it.type] ??= { total: 0, correct: 0 });
    const d = (summary.byDifficulty[String(it.difficulty)] ??= { total: 0, correct: 0 });
    t.total++;
    d.total++;
    if (it.response == null || it.response === "") summary.unanswered++;
    else if (it.response === it.correctAnswer) {
      summary.correct++;
      t.correct++;
      d.correct++;
    } else summary.incorrect++;
  }
  summary.accuracy = summary.total ? summary.correct / summary.total : 0;
  return summary;
}

/** Practice estimate on the 0–10 scale. Never an official VSTEP score. */
export function estimateObjectiveScore(accuracy: number, cfg: ScoringConfig): number {
  let raw: number;
  if (cfg.objectiveEstimate.method === "linear") raw = 10 * accuracy;
  else {
    const pts = [...cfg.objectiveEstimate.points].sort((a, b) => a.accuracy - b.accuracy);
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    if (accuracy <= first.accuracy) raw = first.score;
    else if (accuracy >= last.accuracy) raw = last.score;
    else {
      let i = 0;
      while (pts[i + 1]!.accuracy < accuracy) i++;
      const a = pts[i]!;
      const b = pts[i + 1]!;
      raw = a.score + ((accuracy - a.accuracy) / (b.accuracy - a.accuracy)) * (b.score - a.score);
    }
  }
  return roundToStep(clampScore(raw), cfg.roundingStep);
}

export function bandFor(average: number, cfg: ScoringConfig) {
  const rounded = roundToStep(average, cfg.roundingStep);
  return cfg.bands.find((b) => rounded >= b.min && rounded <= b.max) ?? cfg.bands[0]!;
}

/** Overall estimate requires all four skills; otherwise returns null (no partial band claims). */
export function overallEstimate(skillScores: Partial<Record<"listening" | "reading" | "writing" | "speaking", number | null>>, cfg: ScoringConfig) {
  const vals = (["listening", "reading", "writing", "speaking"] as const).map((s) => skillScores[s]);
  if (vals.some((v) => v == null)) return null;
  const avg = (vals as number[]).reduce((a, b) => a + b, 0) / 4;
  const rounded = roundToStep(avg, cfg.roundingStep);
  return { average: rounded, band: bandFor(rounded, cfg) };
}

export function weightedWritingScore(letter: number | null, essay: number | null, cfg: ScoringConfig): number | null {
  if (letter == null || essay == null) return null;
  const w = cfg.writingTaskWeights;
  return roundToStep(clampScore((letter * w.letter + essay * w.essay) / (w.letter + w.essay)), cfg.roundingStep);
}

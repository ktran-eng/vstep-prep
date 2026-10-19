import { describe, expect, it } from "vitest";
import { bandFor, estimateObjectiveScore, gradeObjective, overallEstimate, roundToStep, weightedWritingScore } from "@/domain/scoring";
import { DEFAULT_SCORING_CONFIG as CFG, scoringConfigSchema } from "@/domain/spec";
import { containsQuote, countWords, splitParagraphs } from "@/domain/text";
import { computeDeadline, isExpired, nextStatus, remainingSeconds } from "@/domain/timing";
import { shuffleMcq } from "@/domain/shuffle";
import { validateMcq } from "@/domain/content-validation";
import type { Mcq } from "@/domain/content-schema";
import { buildRecommendations } from "@/domain/recommendations";
import { generateWeeklyPlan, weekStartOf } from "@/domain/study-plan";
import { getSessionSecret, sign, verify } from "@/lib/signing";
import { normaliseUsername, safeNextPath } from "@/domain/username";
import { sniffAudio, validateRecording } from "@/server/audio-upload";

describe("scoring", () => {
  it("rounds to the nearest 0.5 (half up), as in QĐ 729", () => {
    expect(roundToStep(5.24, 0.5)).toBe(5);
    expect(roundToStep(5.25, 0.5)).toBe(5.5);
    expect(roundToStep(5.75, 0.5)).toBe(6);
    expect(roundToStep(7.74, 0.5)).toBe(7.5);
    // Values within float noise of a half step are treated as the half step (e.g. 0.1+0.2 artefacts).
    expect(roundToStep(5.7499999999999, 0.5)).toBe(6);
  });

  it("grades objective items and counts unanswered separately", () => {
    const s = gradeObjective([
      { questionId: "1", type: "detail", difficulty: 1, response: "A", correctAnswer: "A" },
      { questionId: "2", type: "detail", difficulty: 2, response: "B", correctAnswer: "A" },
      { questionId: "3", type: "inference", difficulty: 3, response: null, correctAnswer: "C" },
      { questionId: "4", type: "inference", difficulty: 3, response: "", correctAnswer: "C" },
    ]);
    expect(s).toMatchObject({ total: 4, correct: 1, incorrect: 1, unanswered: 2, accuracy: 0.25 });
    expect(s.byType.detail).toEqual({ total: 2, correct: 1 });
    expect(s.byType.inference).toEqual({ total: 2, correct: 0 });
    expect(s.byDifficulty["3"]).toEqual({ total: 2, correct: 0 });
  });

  it("estimates objective scores linearly and via a table", () => {
    expect(estimateObjectiveScore(0, CFG)).toBe(0);
    expect(estimateObjectiveScore(1, CFG)).toBe(10);
    expect(estimateObjectiveScore(23 / 35, CFG)).toBe(6.5); // 6.571 → 6.5
    const table = scoringConfigSchema.parse({ ...CFG, objectiveEstimate: { method: "table", points: [{ accuracy: 0, score: 0 }, { accuracy: 0.5, score: 4 }, { accuracy: 1, score: 10 }] } });
    expect(estimateObjectiveScore(0.25, table)).toBe(2);
    expect(estimateObjectiveScore(0.75, table)).toBe(7);
  });

  it("maps averages to the decree's bands", () => {
    expect(bandFor(3.5, CFG).level).toBe("below_B1");
    expect(bandFor(4, CFG).level).toBe("B1");
    expect(bandFor(5.5, CFG).level).toBe("B1");
    expect(bandFor(5.75, CFG).level).toBe("B2"); // rounds to 6.0
    expect(bandFor(8, CFG).level).toBe("B2");
    expect(bandFor(8.5, CFG).level).toBe("C1");
    expect(bandFor(10, CFG).level).toBe("C1");
  });

  it("requires all four skills for an overall estimate", () => {
    expect(overallEstimate({ listening: 6, reading: 7, writing: null, speaking: 6 }, CFG)).toBeNull();
    const o = overallEstimate({ listening: 6, reading: 7, writing: 5.5, speaking: 6 }, CFG)!;
    expect(o.average).toBe(6); // 6.125 → 6.0
    expect(o.band.level).toBe("B2");
  });

  it("weights writing tasks 1/3 and 2/3", () => {
    expect(weightedWritingScore(9, 6, CFG)).toBe(7);
    expect(weightedWritingScore(null, 6, CFG)).toBeNull();
  });
});

describe("text utilities", () => {
  it("counts words like an examiner", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  Hello, world!  ")).toBe(2);
    expect(countWords("It's a well-known fact — really.")).toBe(5);
    expect(countWords("Line one\n\nLine two")).toBe(4);
  });
  it("splits paragraphs on blank lines", () => {
    expect(splitParagraphs("a\n\nb\r\n\r\nc")).toEqual(["a", "b", "c"]);
  });
  it("matches quotes ignoring curly quotes and whitespace", () => {
    expect(containsQuote("He said “it’s fine”  today.", `it's fine" today`)).toBe(true);
    expect(containsQuote("abc", "abd")).toBe(false);
  });
});

describe("timing", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  it("derives remaining time from the server deadline", () => {
    const d = computeDeadline(start, 60);
    expect(remainingSeconds(d, new Date("2026-01-01T00:00:30Z"))).toBe(30);
    expect(remainingSeconds(d, new Date("2026-01-01T00:02:00Z"))).toBe(0);
    expect(remainingSeconds(null)).toBeNull();
  });
  it("applies a grace window only when asked", () => {
    const d = computeDeadline(start, 60);
    const late = new Date("2026-01-01T00:01:03Z");
    expect(isExpired(d, late)).toBe(true);
    expect(isExpired(d, late, 5000)).toBe(false);
  });
  it("allows no transitions out of terminal states", () => {
    expect(nextStatus("in_progress", "submit")).toBe("submitted");
    expect(nextStatus("submitted", "save")).toBeNull();
    expect(nextStatus("expired", "submit")).toBeNull();
  });
});

const q = (over: Partial<Mcq> = {}): Mcq => ({
  id: "q1",
  type: "detail",
  difficulty: 2,
  prompt: "What colour is the sky?",
  options: { A: "Blue", B: "Green", C: "Red", D: "Black" },
  answer: "A",
  explanation: "The passage states clearly that the sky is blue.",
  evidence: { ref: "P1", quote: "the sky is blue" },
  ...over,
});

describe("item validation", () => {
  const units = new Map([["P1", "On a clear day the sky is blue."]]);
  it("accepts a well-formed item", () => {
    expect(validateMcq(q(), units, "set").filter((i) => i.severity === "error")).toEqual([]);
  });
  it("rejects a fabricated evidence quote", () => {
    expect(validateMcq(q({ evidence: { ref: "P1", quote: "the sky is green" } }), units, "s").map((i) => i.message).join()).toMatch(/not found verbatim/);
  });
  it("rejects a missing evidence unit", () => {
    expect(validateMcq(q({ evidence: { ref: "P9", quote: "x y z" } }), units, "s").map((i) => i.message).join()).toMatch(/does not exist/);
  });
  it("rejects duplicate options", () => {
    expect(validateMcq(q({ options: { A: "Blue", B: "blue", C: "Red", D: "Black" } }), units, "s").map((i) => i.message).join()).toMatch(/Duplicate/);
  });
  it("rejects explanations that contradict or reference letters", () => {
    expect(validateMcq(q({ explanation: "The correct answer is B because of the colour." }), units, "s").some((i) => /names B/.test(i.message))).toBe(true);
    expect(validateMcq(q({ explanation: "Option C is wrong; the text says blue sky." }), units, "s").some((i) => /option letter/.test(i.message))).toBe(true);
  });
  it("does not mistake the article 'a' for option A", () => {
    expect(validateMcq(q({ answer: "A", explanation: "The correct reading needs a careful look at the sky." }), units, "s").filter((i) => i.severity === "error")).toEqual([]);
  });
});

describe("option shuffling", () => {
  it("keeps the correct text attached to the key and is deterministic", () => {
    const orig = q({ id: "abc", distractors: { B: "green is wrong" } });
    const s1 = shuffleMcq(orig);
    expect(s1.options[s1.answer]).toBe("Blue");
    expect(shuffleMcq(orig)).toEqual(s1);
    const bKey = Object.entries(s1.options).find(([, v]) => v === "Green")![0];
    expect(s1.distractors).toEqual({ [bKey]: "green is wrong" });
  });
  it("spreads keys across A–D", () => {
    const dist: Record<string, number> = {};
    for (let i = 0; i < 400; i++) {
      const s = shuffleMcq(q({ id: `item-${i}` }));
      dist[s.answer] = (dist[s.answer] ?? 0) + 1;
    }
    for (const k of ["A", "B", "C", "D"]) expect(dist[k]).toBeGreaterThan(60);
  });
});

describe("recommendations and planning", () => {
  it("only recommends from adequate evidence and states it", () => {
    const recs = buildRecommendations({
      typeStats: [
        { skill: "reading", type: "inference", total: 8, correct: 2 },
        { skill: "reading", type: "detail", total: 2, correct: 0 }, // too few items
      ],
      writingCriteria: {},
      speakingCount: 5,
      speakingAvgSeconds: 120,
      skillAttempts: { reading: 1, listening: 1, writing: 1 },
      targetLevel: "B2",
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]!.reason).toContain("2/8");
    expect(recs[0]!.basedOn).toBe(8);
  });
  it("builds one task per study day and adds a mock close to the exam", () => {
    const tasks = generateWeeklyPlan({
      targetLevel: "B2",
      studyDays: [1, 3, 5],
      minutesPerDay: 60,
      examDate: "2026-11-01",
      today: "2026-10-18",
      recommendations: [],
      practiceLinks: { reading: "/r", listening: "/l", writing: "/w", speaking: "/s" },
      mockHref: "/mock",
    });
    expect(tasks.map((t) => t.dayOfWeek)).toEqual([1, 3, 5]);
    expect(tasks[2]!.skill).toBe("mock");
    expect(weekStartOf("2026-10-18")).toBe("2026-10-12"); // Sunday → Monday of that week
  });
});

describe("sign-in names", () => {
  it("normalises case, whitespace and Unicode form", () => {
    expect(normaliseUsername("  Lan.Nguyen ")).toEqual({ ok: true, value: "lan.nguyen" });
    expect(normaliseUsername("Khải_2026")).toEqual({ ok: true, value: "khải_2026" });
    // Decomposed and precomposed Vietnamese letters map to the same name.
    expect(normaliseUsername("Khải")).toEqual(normaliseUsername("Khải"));
  });
  it("rejects invalid names", () => {
    for (const bad of ["ab", "a".repeat(33), "lan nguyen", "lan@mail", "<script>", ".lan", "lan-"]) expect(normaliseUsername(bad).ok).toBe(false);
  });
  it("only redirects to local paths after sign-in", () => {
    expect(safeNextPath("/mock")).toBe("/mock");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});

describe("security helpers", () => {
  it("signs and verifies values, rejecting tampering", async () => {
    const s = await sign("abc", "k".repeat(32));
    expect(await verify(s, "k".repeat(32))).toBe("abc");
    expect(await verify(s.replace("abc", "abd"), "k".repeat(32))).toBeNull();
    expect(await verify(s, "x".repeat(32))).toBeNull();
    expect(await verify("garbage", "k".repeat(32))).toBeNull();
  });
  it("derives the session key from DATABASE_URL when SESSION_SECRET is unset", () => {
    const saved = { s: process.env.SESSION_SECRET, d: process.env.DATABASE_URL };
    try {
      delete process.env.SESSION_SECRET;
      process.env.DATABASE_URL = "postgres://u:p@host/db";
      const a = getSessionSecret();
      expect(a).toContain("postgres://u:p@host/db");
      process.env.SESSION_SECRET = "s".repeat(32);
      expect(getSessionSecret()).toBe("s".repeat(32));
    } finally {
      process.env.SESSION_SECRET = saved.s;
      if (saved.d === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = saved.d;
    }
  });
  it("sniffs audio formats and rejects disguised files", () => {
    const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffAudio(webm)).toBe("audio/webm");
    expect(validateRecording(webm, "audio/webm;codecs=opus")).toEqual({ ok: true, mime: "audio/webm" });
    expect(validateRecording(Buffer.from("<html><script>alert(1)</script>"), "audio/webm").ok).toBe(false);
    expect(validateRecording(webm, "audio/ogg").ok).toBe(false);
    expect(validateRecording(Buffer.alloc(0), "audio/webm").ok).toBe(false);
  });
});

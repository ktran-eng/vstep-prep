import type { ListeningSetInput } from "@/domain/content-schema";

export type Announcement = {
  id: string;
  title: string;
  topic: string;
  voice: "male" | "female";
  speaker?: string;
  s1: string;
  s2: string;
  prompt: string;
  /** Correct option first; options are shuffled deterministically at load time. */
  options: [string, string, string, string];
  ref: "S1" | "S2";
  quote: string;
  explanation: string;
  difficulty?: number;
};

/** Builds a Part-1 style short announcement with one question. */
export const ann = (a: Announcement): ListeningSetInput => ({
  id: a.id,
  title: a.title,
  part: 1,
  level: "B1",
  topic: a.topic,
  segments: [
    { speaker: a.speaker ?? "Announcer", voice: a.voice, text: a.s1 },
    { speaker: a.speaker ?? "Announcer", voice: a.voice, text: a.s2 },
  ],
  questions: [
    {
      id: `${a.id}-q1`,
      type: "detail",
      difficulty: a.difficulty ?? 2,
      prompt: a.prompt,
      options: { A: a.options[0], B: a.options[1], C: a.options[2], D: a.options[3] },
      answer: "A",
      explanation: a.explanation,
      evidence: { ref: a.ref, quote: a.quote },
    },
  ],
});

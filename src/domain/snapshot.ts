/** Shapes of the immutable blueprint snapshot. `Public*` types are safe to send to a learner before submission. */
import type { Level, QuestionType, Skill } from "./content-schema";

export type PublicQuestion = {
  id: string;
  number: number; // 1-based within the section
  prompt: string;
  type: QuestionType;
  difficulty: number;
  options: { key: string; text: string }[];
};

export type PublicReadingGroup = {
  kind: "reading";
  id: string;
  title: string;
  level: Level;
  topic: string;
  paragraphs: string[];
  questions: PublicQuestion[];
  provenance: string;
};

export type PublicListeningGroup = {
  kind: "listening";
  id: string;
  title: string;
  part: 1 | 2 | 3;
  level: Level;
  topic: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  generationMethod: string;
  qualityStatus: string;
  questions: PublicQuestion[];
  provenance: string;
};

export type PublicWritingGroup = {
  kind: "writing";
  id: string;
  task: "letter" | "essay";
  level: Level;
  title: string;
  instructions: string;
  stimulus: string | null;
  requiredPoints: string[];
  minWords: number;
  suggestedMinutes: number;
  rubricId: string;
};

export type SpeakingContent =
  | { part: 1; topics: { name: string; questions: string[] }[] }
  | { part: 2; situation: string; options: string[] }
  | { part: 3; topic: string; ideas: string[]; followUps: string[] };

export type PublicSpeakingGroup = {
  kind: "speaking";
  id: string;
  part: 1 | 2 | 3;
  level: Level;
  title: string;
  instructions: string;
  content: SpeakingContent;
  preparationSeconds: number;
  responseSeconds: number;
  rubricId: string;
};

export type PublicGroup = PublicReadingGroup | PublicListeningGroup | PublicWritingGroup | PublicSpeakingGroup;

export type PublicSection = {
  order: number;
  skill: Skill;
  timeLimitSeconds: number;
  groups: PublicGroup[];
  questionCount: number;
};

export type PublicSnapshot = {
  blueprint: { id: string; name: string; description: string; kind: "mock" | "practice"; skill: Skill | null; targetLevel: string; version: number; specVersion: string };
  sections: PublicSection[];
};

export type ProtectedAnswer = {
  answer: string;
  explanation: string;
  evidence: { ref: string; quote: string };
  distractors: Record<string, string> | null;
  vocab: { term: string; note: string }[] | null;
};

export type TranscriptSegment = { id: string; speaker: string; text: string };

export type ProtectedSnapshot = {
  answers: Record<string, ProtectedAnswer>;
  transcripts: Record<string, TranscriptSegment[]>;
  writingSamples: Record<string, { level: string; text: string }>;
  speakingModels: Record<string, { text: string; usefulLanguage: string[] }>;
};

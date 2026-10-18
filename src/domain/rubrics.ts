/**
 * Educational practice rubrics. NOT the official VSTEP rating scales (which are not publicly available —
 * see docs/SPECIFICATION_RESEARCH.md §3.5). Criteria follow the dimensions commonly used for VSTEP productive skills.
 */
export type RubricCriterion = { key: string; name: string; nameVi: string; description: string; bands: { score: string; descriptor: string }[] };
export type Rubric = { id: string; skill: "writing" | "speaking"; version: number; name: string; isOfficial: false; criteria: RubricCriterion[]; notes: string };

const bands = (b: [string, string, string, string]) => [
  { score: "0–3", descriptor: b[0] },
  { score: "4–5.5", descriptor: b[1] },
  { score: "6–8", descriptor: b[2] },
  { score: "8.5–10", descriptor: b[3] },
];

export const WRITING_RUBRIC: Rubric = {
  id: "writing-practice-v1",
  skill: "writing",
  version: 1,
  name: "VSTEP-style Writing practice rubric v1",
  isOfficial: false,
  notes: "Each criterion is scored 0–10 in 0.5 steps; the task score is the mean of the four criteria. Practice estimate only.",
  criteria: [
    {
      key: "task_fulfilment",
      name: "Task fulfilment",
      nameVi: "Hoàn thành yêu cầu",
      description: "Covers all required points; appropriate length, register and purpose for the reader.",
      bands: bands([
        "Most required points missing or irrelevant; far below length.",
        "Some points covered but thinly; register inconsistent.",
        "All points covered with some development; register mostly appropriate.",
        "All points fully and relevantly developed; register consistently appropriate.",
      ]),
    },
    {
      key: "organisation",
      name: "Organisation & cohesion",
      nameVi: "Tổ chức & liên kết",
      description: "Logical paragraphing, progression of ideas, linking devices and referencing.",
      bands: bands([
        "Little organisation; ideas hard to follow.",
        "Basic organisation; limited or repetitive linking.",
        "Clear progression; a range of cohesive devices with minor misuse.",
        "Skilful organisation; cohesion is natural and unobtrusive.",
      ]),
    },
    {
      key: "vocabulary",
      name: "Vocabulary",
      nameVi: "Từ vựng",
      description: "Range, precision, collocation and spelling.",
      bands: bands([
        "Very limited range; frequent errors impede meaning.",
        "Adequate for familiar topics; errors noticeable but meaning clear.",
        "Good range incl. less common items; occasional imprecision.",
        "Wide, precise and natural range; rare slips.",
      ]),
    },
    {
      key: "grammar",
      name: "Grammar & accuracy",
      nameVi: "Ngữ pháp",
      description: "Range and accuracy of structures, punctuation.",
      bands: bands([
        "Mostly simple sentences with frequent errors.",
        "Mix of simple and some complex forms; errors common but rarely block meaning.",
        "Variety of complex structures; good control with some errors.",
        "Wide range used flexibly and accurately.",
      ]),
    },
  ],
};

export const SPEAKING_RUBRIC: Rubric = {
  id: "speaking-practice-v1",
  skill: "speaking",
  version: 1,
  name: "VSTEP-style Speaking practice rubric v1",
  isOfficial: false,
  notes:
    "Automatic feedback is based on a speech-to-text transcript. Pronunciation cannot be judged reliably from a transcript, so it is left to self-assessment and is never machine-scored.",
  criteria: [
    {
      key: "task_relevance",
      name: "Task relevance & development",
      nameVi: "Đáp ứng nhiệm vụ",
      description: "Answers the questions, justifies choices, develops ideas with examples.",
      bands: bands(["Off-task or very short answers.", "Relevant but undeveloped.", "Relevant and developed with reasons and examples.", "Fully developed, well-argued, extended discourse."]),
    },
    {
      key: "fluency_coherence",
      name: "Fluency & coherence",
      nameVi: "Độ trôi chảy & mạch lạc",
      description: "Flow, length of turns, logical sequencing and discourse markers.",
      bands: bands(["Frequent breakdowns.", "Some hesitation; simple linking.", "Speaks at length with some hesitation; clear linking.", "Speaks fluently and coherently with natural markers."]),
    },
    {
      key: "vocabulary",
      name: "Vocabulary",
      nameVi: "Từ vựng",
      description: "Range and appropriacy of words and expressions.",
      bands: bands(["Very limited.", "Sufficient for familiar topics.", "Flexible, some idiomatic language.", "Wide, precise, idiomatic."]),
    },
    {
      key: "grammar",
      name: "Grammar",
      nameVi: "Ngữ pháp",
      description: "Range and accuracy of structures.",
      bands: bands(["Frequent basic errors.", "Simple forms mostly accurate.", "Range of complex forms, mostly accurate.", "Consistently accurate and varied."]),
    },
    {
      key: "pronunciation",
      name: "Pronunciation",
      nameVi: "Phát âm",
      description: "Intelligibility, word/sentence stress, intonation. Self-assessed only.",
      bands: bands(["Often unintelligible.", "Generally intelligible with L1 features.", "Clear, mostly accurate stress and intonation.", "Easy to understand; natural prosody."]),
    },
  ],
};

export const RUBRICS = [WRITING_RUBRIC, SPEAKING_RUBRIC];

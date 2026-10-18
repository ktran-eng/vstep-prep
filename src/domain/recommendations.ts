import type { QuestionType } from "./content-schema";

export type TypeStat = { skill: "reading" | "listening"; type: string; total: number; correct: number };
export type Recommendation = { id: string; skill: string; title: string; reason: string; href: string; basedOn: number };

const MIN_ITEMS = 4; // below this we don't draw conclusions
const LOW = 0.6;

const TYPE_LABEL: Record<QuestionType, string> = {
  main_idea: "main idea",
  detail: "specific detail",
  vocabulary: "vocabulary in context",
  reference: "reference words",
  inference: "inference",
  purpose: "author/speaker purpose",
  attitude: "attitude/opinion",
  organisation: "text organisation",
  gist: "gist",
};

/** Rule-based recommendations derived from the learner's own stored results. Every item states its evidence. */
export function buildRecommendations(input: {
  typeStats: TypeStat[];
  writingCriteria: Record<string, { avg: number; n: number }>;
  speakingCount: number;
  speakingAvgSeconds: number | null;
  skillAttempts: Record<string, number>;
  targetLevel: string;
}): Recommendation[] {
  const recs: Recommendation[] = [];
  const weakTypes = input.typeStats
    .filter((s) => s.total >= MIN_ITEMS && s.correct / s.total < LOW)
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
  for (const s of weakTypes.slice(0, 3)) {
    const pct = Math.round((100 * s.correct) / s.total);
    recs.push({
      id: `weak-${s.skill}-${s.type}`,
      skill: s.skill,
      title: `${s.skill === "reading" ? "Reading" : "Listening"}: luyện dạng câu "${TYPE_LABEL[s.type as QuestionType] ?? s.type}"`,
      reason: `Bạn trả lời đúng ${s.correct}/${s.total} câu dạng này (${pct}%).`,
      href: `/learn/${s.skill}?level=${input.targetLevel}`,
      basedOn: s.total,
    });
  }
  const wc = Object.entries(input.writingCriteria).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].avg - b[1].avg)[0];
  if (wc && wc[1].avg < 6) {
    recs.push({
      id: `writing-${wc[0]}`,
      skill: "writing",
      title: `Writing: cải thiện tiêu chí "${wc[0].replace(/_/g, " ")}"`,
      reason: `Điểm ước tính trung bình ${wc[1].avg.toFixed(1)}/10 qua ${wc[1].n} bài viết đã chấm.`,
      href: "/learn/writing",
      basedOn: wc[1].n,
    });
  }
  if (input.speakingCount < 3) {
    recs.push({
      id: "speaking-more",
      skill: "speaking",
      title: "Speaking: luyện thêm các phần nói có tính giờ",
      reason: input.speakingCount === 0 ? "Bạn chưa nộp bài nói nào." : `Mới có ${input.speakingCount} bài nói — chưa đủ dữ liệu để đánh giá độ trôi chảy.`,
      href: "/learn/speaking",
      basedOn: input.speakingCount,
    });
  } else if (input.speakingAvgSeconds != null && input.speakingAvgSeconds < 60) {
    recs.push({
      id: "speaking-length",
      skill: "speaking",
      title: "Speaking: kéo dài câu trả lời",
      reason: `Thời lượng ghi âm trung bình chỉ ${Math.round(input.speakingAvgSeconds)} giây.`,
      href: "/learn/speaking",
      basedOn: input.speakingCount,
    });
  }
  for (const skill of ["reading", "listening", "writing"] as const) {
    if ((input.skillAttempts[skill] ?? 0) === 0)
      recs.push({ id: `start-${skill}`, skill, title: `Bắt đầu luyện ${skill[0]!.toUpperCase() + skill.slice(1)}`, reason: "Chưa có bài làm nào cho kỹ năng này.", href: `/learn/${skill}`, basedOn: 0 });
  }
  return recs.slice(0, 6);
}

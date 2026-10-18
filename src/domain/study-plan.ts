import type { Recommendation } from "./recommendations";

export type PlanInput = {
  targetLevel: string;
  studyDays: number[]; // 1..7
  minutesPerDay: number;
  examDate: string | null;
  today: string; // yyyy-mm-dd
  recommendations: Recommendation[];
  practiceLinks: Record<"reading" | "listening" | "writing" | "speaking", string>;
  mockHref: string | null;
};

export type PlanTask = { dayOfWeek: number; skill: string; activity: string; href: string; minutes: number; reason: string };

export function weekStartOf(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function daysUntil(examDate: string | null, today: string): number | null {
  if (!examDate) return null;
  return Math.round((Date.parse(examDate + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86_400_000);
}

const BASE_ROTATION = ["reading", "listening", "writing", "speaking"] as const;

/**
 * Builds a realistic weekly plan: one focused activity per study day sized to the learner's available time,
 * weighted towards weaknesses, with a full mock when the exam is near. No promises about score gains.
 */
export function generateWeeklyPlan(input: PlanInput): PlanTask[] {
  const days = [...new Set(input.studyDays)].filter((d) => d >= 1 && d <= 7).sort();
  if (!days.length) return [];
  const minutes = Math.max(15, Math.min(240, input.minutesPerDay));
  // First the top recommendations (evidence-based), then an even rotation across the four skills.
  const queue: { skill: string; reason: string; href?: string }[] = input.recommendations
    .slice(0, Math.min(2, days.length))
    .map((r) => ({ skill: r.skill, reason: r.reason, href: r.href }));
  for (let i = 0; queue.length < days.length; i++) {
    queue.push({ skill: BASE_ROTATION[i % BASE_ROTATION.length]!, reason: "Duy trì đều cả bốn kỹ năng." });
  }
  const left = daysUntil(input.examDate, input.today);
  const tasks: PlanTask[] = days.map((day, idx) => {
    const q = queue[idx]!;
    const skill = q.skill as keyof PlanInput["practiceLinks"];
    return {
      dayOfWeek: day,
      skill,
      activity: activityFor(skill, minutes),
      href: q.href ?? input.practiceLinks[skill] ?? "/learn",
      minutes,
      reason: q.reason,
    };
  });
  if (input.mockHref && left != null && left <= 28 && left >= 0 && minutes >= 30) {
    const last = tasks[tasks.length - 1]!;
    tasks[tasks.length - 1] = {
      ...last,
      skill: "mock",
      activity: "Làm một đề thi thử đầy đủ (có thể chia 2 buổi: Nghe+Đọc, Viết+Nói)",
      href: input.mockHref,
      minutes: Math.max(minutes, 120),
      reason: `Còn ${left} ngày đến kỳ thi — luyện phân bổ thời gian trong điều kiện thi.`,
    };
  }
  return tasks;
}

function activityFor(skill: string, minutes: number) {
  switch (skill) {
    case "reading":
      return minutes >= 45 ? "1–2 bài đọc có giờ + xem lại giải thích các câu sai" : "1 bài đọc + ghi chú từ vựng";
    case "listening":
      return "1 bộ bài nghe (chế độ luyện tập) + đối chiếu transcript ở câu sai";
    case "writing":
      return minutes >= 45 ? "Viết 1 bài luận (Task 2) trong 40 phút + sửa theo nhận xét" : "Viết 1 thư/email (Task 1) trong 20 phút";
    case "speaking":
      return "Ghi âm 1 phần thi nói, nghe lại và tự đánh giá theo checklist";
    default:
      return "Luyện tập";
  }
}

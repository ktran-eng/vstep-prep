import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ButtonLink, Card, PageHeader } from "@/components/ui";

const PATHS = {
  b1: {
    title: "Lộ trình B1 (Bậc 3)",
    band: "Điểm trung bình 4,0–5,5",
    can: "Hiểu ý chính của văn bản và bài nói chuẩn mực về chủ đề quen thuộc; xử lý tình huống khi đi lại; viết văn bản đơn giản; mô tả trải nghiệm và trình bày ngắn gọn lý do cho ý kiến.",
    focus: [
      ["Nghe", "Part 1 (thông báo ngắn) và Part 2 (hội thoại): nghe số liệu, thời gian, địa điểm và lý do."],
      ["Đọc", "Câu hỏi chi tiết và ý chính ở bài đọc 1–2; từ vựng trong ngữ cảnh quen thuộc."],
      ["Viết", "Thư/email đủ các ý yêu cầu, đúng giọng văn; bài luận có bố cục 4–5 đoạn rõ ràng."],
      ["Nói", "Part 1: trả lời đầy đủ bằng 2–3 câu có lý do; Part 2: chọn giải pháp và giải thích đơn giản."],
    ],
  },
  b2: {
    title: "Lộ trình B2 (Bậc 4)",
    band: "Điểm trung bình 6,0–8,0",
    can: "Hiểu ý chính văn bản phức tạp về chủ đề cụ thể và trừu tượng; giao tiếp trôi chảy, tự nhiên; viết văn bản rõ ràng, chi tiết và giải thích quan điểm, nêu ưu nhược điểm.",
    focus: [
      ["Nghe", "Part 2–3: thái độ, ý kiến người nói và suy luận; nghe bài giảng có cấu trúc."],
      ["Đọc", "Câu suy luận, quy chiếu và mục đích tác giả ở bài đọc 2–3; quản lý thời gian 60 phút."],
      ["Viết", "Lập luận hai chiều có quan điểm rõ, liên kết đa dạng, từ vựng theo chủ đề."],
      ["Nói", "Part 3: phát triển ý mạch lạc 2–3 phút, dùng ví dụ cụ thể và từ nối."],
    ],
  },
  c1: {
    title: "Lộ trình C1 (Bậc 5)",
    band: "Điểm trung bình 8,5–10",
    can: "Hiểu nhiều loại văn bản khó, dài và nhận biết hàm ý; diễn đạt lưu loát, tức thì; dùng ngôn ngữ linh hoạt cho mục đích xã hội, học thuật, chuyên môn; viết chặt chẽ, chi tiết về chủ đề phức tạp.",
    focus: [
      ["Nghe", "Bài giảng học thuật: lập luận, mức độ chắc chắn của người nói, chi tiết bị phủ định."],
      ["Đọc", "Bài 4 (C1): chức năng đoạn văn, hàm ý, thái độ tinh tế của tác giả."],
      ["Viết", "Lập luận có sắc thái, nhượng bộ và phản bác, từ vựng chính xác, ít lỗi."],
      ["Nói", "Lập luận mở rộng, xử lý câu hỏi phản biện, ngôn ngữ thành ngữ tự nhiên."],
    ],
  },
} as const;

export function generateStaticParams() {
  return Object.keys(PATHS).map((level) => ({ level }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const p = PATHS[(await params).level as keyof typeof PATHS];
  return { title: p?.title ?? "Lộ trình" };
}

export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const p = PATHS[level as keyof typeof PATHS];
  if (!p) notFound();
  const L = level.toUpperCase();
  return (
    <>
      <PageHeader title={p.title} description={p.band} crumbs={[{ href: "/", label: "Trang chủ" }, { label: p.title }]} />
      <Card className="mb-6">
        <h2 className="mb-1 font-semibold">Mô tả năng lực (theo QĐ 729/QĐ-BGDĐT)</h2>
        <p className="text-sm text-muted">{p.can}</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {p.focus.map(([skill, text]) => (
          <Card key={skill}>
            <h3 className="font-semibold">{skill}</h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={`/learn/reading?level=${L}`}>Luyện Đọc {L}</ButtonLink>
        <ButtonLink href={`/learn/listening?level=${L}`} variant="secondary">
          Luyện Nghe {L}
        </ButtonLink>
        <ButtonLink href="/learn/writing" variant="secondary">
          Luyện Viết
        </ButtonLink>
        <ButtonLink href="/learn/speaking" variant="secondary">
          Luyện Nói
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-muted">
        Gợi ý: làm một{" "}
        <Link href="/mock" className="underline">
          đề thi thử
        </Link>{" "}
        để biết điểm xuất phát, sau đó đặt mục tiêu trong phần Cài đặt để nhận kế hoạch học hàng tuần.
      </p>
    </>
  );
}

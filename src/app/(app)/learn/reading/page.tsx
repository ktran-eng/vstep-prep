import type { Metadata } from "next";
import { PracticeCatalog } from "@/components/practice-catalog";

export const metadata: Metadata = { title: "Luyện Đọc" };

export default async function ReadingPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  return (
    <PracticeCatalog
      skill="reading"
      level={level}
      intro="Mỗi bài gồm một bài đọc và các câu hỏi về ý chính, chi tiết, từ vựng trong ngữ cảnh, quy chiếu, suy luận và thái độ tác giả. Sau khi nộp, bạn sẽ thấy đáp án, giải thích và câu căn cứ được đánh dấu trong bài."
    />
  );
}

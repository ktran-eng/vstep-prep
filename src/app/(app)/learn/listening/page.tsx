import type { Metadata } from "next";
import { PracticeCatalog } from "@/components/practice-catalog";

export const metadata: Metadata = { title: "Luyện Nghe" };

export default async function ListeningPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  return (
    <PracticeCatalog
      skill="listening"
      level={level}
      intro="Thông báo ngắn (Part 1), hội thoại (Part 2) và bài giảng (Part 3). Chế độ Luyện tập cho phép nghe lại và xem transcript sau khi nghe; chế độ Thi thử chỉ phát mỗi bài một lần."
    />
  );
}

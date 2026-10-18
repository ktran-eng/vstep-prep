import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { readLearnerId } from "@/server/identity";
import { listCatalog } from "@/server/catalog";
import { PageHeader } from "@/components/ui";
import { TestCard } from "@/components/test-card";

export const metadata: Metadata = { title: "Danh mục đề" };
export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const db = await getDb();
  const learnerId = await readLearnerId();
  const items = await listCatalog(db, learnerId, {});
  const groups = [
    { title: "Đề thi thử đầy đủ", items: items.filter((i) => i.kind === "mock") },
    { title: "Luyện Đọc", items: items.filter((i) => i.skill === "reading") },
    { title: "Luyện Nghe", items: items.filter((i) => i.skill === "listening") },
  ];
  return (
    <>
      <PageHeader title="Danh mục đề" description="Tất cả bài thi và bài luyện đã được xuất bản. Viết và Nói có trang luyện riêng với nhiều đề bài theo từng phần." />
      {groups.map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            {g.title} <span className="text-sm font-normal text-muted">({g.items.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {g.items.map((it) => (
              <TestCard key={it.id} item={it} modes={it.kind === "mock" ? ["exam", "practice"] : ["practice", "exam"]} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

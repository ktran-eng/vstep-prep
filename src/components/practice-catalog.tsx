import Link from "next/link";
import { getDb } from "@/server/db";
import { requireLearner } from "@/server/identity";
import { listCatalog } from "@/server/catalog";
import { cx, EmptyState, PageHeader } from "./ui";
import { TestCard } from "./test-card";
import { getDict } from "@/i18n/server";

const LEVELS = ["B1", "B2", "C1"] as const;

/** Shared Reading/Listening practice catalogue with a level filter. */
export async function PracticeCatalog({ skill, level, intro }: { skill: "reading" | "listening"; level?: string; intro: React.ReactNode }) {
  const learnerId = await requireLearner();
  const { t } = await getDict();
  const lvl = LEVELS.includes(level as (typeof LEVELS)[number]) ? level : undefined;
  const items = await listCatalog(await getDb(), learnerId, { kind: "practice", skill, level: lvl });
  const label = skill === "reading" ? t.nav.reading : t.nav.listening;
  return (
    <>
      <PageHeader title={label} crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label }]} description={intro} />
      <nav aria-label="Level filter" className="mb-5 flex gap-2">
        {[undefined, ...LEVELS].map((l) => (
          <Link
            key={l ?? "all"}
            href={l ? `?level=${l}` : "?"}
            aria-current={lvl === l ? "page" : undefined}
            className={cx("rounded-full border px-3 py-1 text-sm", lvl === l ? "border-primary bg-primary-soft font-medium text-primary" : "border-border hover:bg-surface-2")}
          >
            {l ?? t.common.all}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <EmptyState title="Chưa có bài luyện cho bộ lọc này" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <TestCard key={it.id} item={it} modes={["practice", "exam"]} />
          ))}
        </div>
      )}
    </>
  );
}

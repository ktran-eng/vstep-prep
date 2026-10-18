import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { vocabularyNotes } from "@/server/db/schema";
import { requireLearner } from "@/server/identity";
import { deleteVocabAction } from "@/app/actions/learner";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { VocabForm } from "@/components/vocab-form";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Từ vựng" };

export default async function VocabularyPage() {
  const learnerId = await requireLearner();
  const { t } = await getDict();
  const notes = await (await getDb()).select().from(vocabularyNotes).where(eq(vocabularyNotes.learnerId, learnerId)).orderBy(desc(vocabularyNotes.createdAt));
  return (
    <>
      <PageHeader title={t.nav.vocabulary} crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.vocabulary }]} description="Sổ từ vựng cá nhân. Bạn cũng có thể thêm từ trực tiếp từ phần giải thích đáp án." />
      <Card className="mb-6">
        <VocabForm />
      </Card>
      {notes.length === 0 ? (
        <EmptyState title="Chưa có từ nào" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Từ / cụm từ
                </th>
                <th scope="col" className="px-3 py-2">
                  Nghĩa
                </th>
                <th scope="col" className="px-3 py-2">
                  Ví dụ
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-medium">{n.term}</td>
                  <td className="px-3 py-2">{n.meaning}</td>
                  <td className="px-3 py-2 italic text-muted">{n.example}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteVocabAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-xs text-danger hover:underline" aria-label={`Delete ${n.term}`}>
                        {t.common.delete}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

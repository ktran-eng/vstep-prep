import { notFound } from "next/navigation";
import { getDb } from "@/server/db";
import { getQuestionFull } from "@/server/admin";
import { Badge, Card, PageHeader } from "@/components/ui";
import { splitParagraphs } from "@/domain/text";
import { QuestionEditor } from "./editor";

export default async function QuestionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getQuestionFull(await getDb(), decodeURIComponent(id));
  if (!d) notFound();
  const units = d.passage ? splitParagraphs(d.passage.content).map((p, i) => ({ id: `P${i + 1}`, text: p })) : (d.transcript?.segments ?? []).map((s) => ({ id: s.id, text: `${s.speaker}: ${s.text}` }));
  const opt = (k: string) => d.options.find((o) => o.optionKey === k)?.optionText ?? "";
  return (
    <>
      <PageHeader
        title={d.q.id}
        crumbs={[{ href: "/admin/content", label: "Ngân hàng câu hỏi" }, { label: d.q.id }]}
        description={
          <span className="flex flex-wrap gap-2">
            <Badge>{d.q.skill}</Badge>
            <Badge>{d.q.level}</Badge>
            <Badge>{d.q.taskType}</Badge>
            <Badge>v{d.q.version}</Badge>
            <Badge tone="primary">{d.q.status}</Badge>
            <Badge>{d.q.provenanceType}</Badge>
          </span>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">{d.passage?.title ?? d.audio?.title} — đơn vị căn cứ</h2>
          {d.audio?.storageKey && (
            <audio controls src={`/audio/${d.audio.storageKey}`} className="mb-2 w-full" preload="none" />
          )}
          <ol className="space-y-2 text-sm">
            {units.map((u) => (
              <li key={u.id}>
                <span className="font-mono text-xs text-muted">{u.id}</span> {u.text}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Sửa câu hỏi</h2>
          <QuestionEditor
            initial={{
              id: d.q.id,
              prompt: d.q.prompt,
              A: opt("A"),
              B: opt("B"),
              C: opt("C"),
              D: opt("D"),
              answer: d.key?.correctAnswer ?? "A",
              explanation: d.key?.explanation ?? "",
              evidenceRef: d.key?.evidenceReference.ref ?? "P1",
              evidenceQuote: d.key?.evidenceReference.quote ?? "",
              difficulty: d.q.difficulty,
            }}
          />
        </Card>
      </div>
    </>
  );
}

import Link from "next/link";
import { startAttemptAction } from "@/app/actions/exam";
import type { CatalogItem } from "@/server/catalog";
import { Badge, Button, ButtonLink, Card } from "./ui";

function lastScore(item: CatalogItem) {
  const s = item.lastResult?.summary;
  if (!s) return null;
  if (item.kind === "mock") return s.overall ? `Ước tính ${s.overall.average.toFixed(1)} (${s.overall.level === "below_B1" ? "<B1" : s.overall.level})` : `${s.rawCorrect}/${s.rawTotal} câu đúng (Nghe+Đọc)`;
  return `${s.rawCorrect}/${s.rawTotal} câu đúng`;
}

export function TestCard({ item, modes = ["exam", "practice"] }: { item: CatalogItem; modes?: ("exam" | "practice")[] }) {
  const score = lastScore(item);
  return (
    <Card as="article" className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{item.targetLevel}</Badge>
        {item.questionCount > 0 && <Badge>{item.questionCount} câu</Badge>}
        <Badge>{item.durationMinutes} phút</Badge>
      </div>
      <h3 className="mt-2 text-lg font-semibold">{item.name}</h3>
      <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>
      {item.topics.length > 0 && <p className="mt-2 text-xs text-muted">Chủ đề: {item.topics.join(" · ")}</p>}
      {score && (
        <p className="mt-2 text-sm">
          Lần gần nhất:{" "}
          <Link href={`/attempt/${item.lastResult!.id}/result`} className="font-medium text-primary hover:underline">
            {score}
          </Link>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.inProgress.map((a) => (
          <ButtonLink key={a.id} href={`/attempt/${a.id}`}>
            Tiếp tục ({a.mode === "exam" ? "thi thử" : "luyện tập"})
          </ButtonLink>
        ))}
        {item.kind === "mock" && (
          <ButtonLink href={`/mock/${item.id}`} variant={item.inProgress.length ? "secondary" : "primary"}>
            Xem cấu trúc & bắt đầu
          </ButtonLink>
        )}
        {modes
          .filter((m) => item.kind !== "mock" && !item.inProgress.some((a) => a.mode === m))
          .map((m) => (
            <form key={m} action={startAttemptAction}>
              <input type="hidden" name="blueprintId" value={item.id} />
              <input type="hidden" name="mode" value={m} />
              <Button type="submit" variant={m === modes[0] ? "primary" : "secondary"}>
                {m === "exam" ? "Thi thử (tính giờ)" : "Luyện tập"}
              </Button>
            </form>
          ))}
      </div>
    </Card>
  );
}

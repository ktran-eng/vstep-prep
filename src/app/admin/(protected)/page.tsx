import { getDb } from "@/server/db";
import { adminOverview } from "@/server/admin";
import { aiGradingConfigured } from "@/server/grading/service";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";

export default async function AdminHome() {
  const o = await adminOverview(await getDb());
  const ai = aiGradingConfigured();
  return (
    <>
      <PageHeader title="Tổng quan quản trị" description="Số liệu tổng hợp; không hiển thị dữ liệu của từng người học." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Câu hỏi" value={o.questions} />
        <Stat label="Bài đọc" value={o.passages} />
        <Stat label="Audio" value={o.audio} />
        <Stat label="Đề thi/bài luyện" value={o.tests} />
        <Stat label="Đề Viết" value={o.writingPrompts} />
        <Stat label="Đề Nói" value={o.speakingPrompts} />
        <Stat label="Người học" value={o.learners} />
        <Stat label="Lượt làm bài" value={o.attempts} hint={`${o.writingSubs} bài viết · ${o.speakingSubs} bài nói`} />
      </div>
      <Card className="mt-6">
        <h2 className="mb-2 font-semibold">Nhà cung cấp AI</h2>
        <p className="text-sm">
          Chấm Viết/Nói (Anthropic): <Badge tone={ai.writing ? "success" : "warning"}>{ai.writing ? "đã cấu hình" : "chưa cấu hình"}</Badge> · Chép lời (OpenAI):{" "}
          <Badge tone={ai.transcription ? "success" : "warning"}>{ai.transcription ? "đã cấu hình" : "chưa cấu hình"}</Badge>
        </p>
      </Card>
      <Card className="mt-6">
        <h2 className="mb-2 font-semibold">Câu hỏi theo trạng thái</h2>
        <table className="text-sm">
          <tbody>
            {o.byStatus.map((r) => (
              <tr key={r.skill + r.status}>
                <td className="pr-4">{r.skill}</td>
                <td className="pr-4">
                  <Badge>{r.status}</Badge>
                </td>
                <td className="tabular-nums">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

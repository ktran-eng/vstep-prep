import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { sources } from "@/server/db/schema";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Nguồn & phương pháp" };
export const dynamic = "force-dynamic";

const TYPE: Record<string, string> = {
  official_regulation: "Văn bản chính thức",
  institutional: "Đơn vị tổ chức thi",
  commercial_prep: "Trung tâm luyện thi",
  reference: "Tham khảo",
  original: "Nội dung gốc",
};

export default async function SourcesPage() {
  const rows = await (await getDb()).select().from(sources).orderBy(asc(sources.sourceType));
  return (
    <>
      <PageHeader
        title="Nguồn & phương pháp"
        description="Cách chúng tôi xác định định dạng đề, cách tính điểm ước tính, và nguồn gốc nội dung. Mọi đường dẫn đã được kiểm tra trực tiếp vào ngày ghi bên dưới."
      />
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Phương pháp</h2>
          <ul className="ml-5 mt-2 list-disc space-y-1 text-sm">
            <li>Định dạng đề lấy từ văn bản gốc QĐ 729/QĐ-BGDĐT; chi tiết không có trong văn bản (phân bố 8/12/15 câu Nghe, thời lượng từng phần Nói) được ghi rõ là chưa xác minh và có thể chỉnh trong trang quản trị.</li>
            <li>Điểm Nghe/Đọc: ước tính tuyến tính 10 × tỉ lệ đúng, làm tròn 0,5 — không phải bảng quy đổi chính thức.</li>
            <li>Điểm Viết/Nói: AI ước tính theo rubric luyện tập có phiên bản; không tương đương giám khảo VSTEP. Phát âm không được chấm tự động.</li>
            <li>Quy đổi bậc: theo bảng điểm trung bình trong QĐ 729; chỉ hiển thị khi có đủ 4 kỹ năng.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Nguồn gốc nội dung</h2>
          <p className="mt-2 text-sm">
            Toàn bộ bài đọc, kịch bản nghe, câu hỏi, đề Viết/Nói và bài mẫu là nội dung gốc do nền tảng biên soạn, mô phỏng định dạng VSTEP. Không có đề thi chính thức hay nội dung từ trung tâm khác được sao chép. Các trang luyện thi bên ngoài chỉ
            được liên kết. Audio luyện nghe hiện là giọng đọc tổng hợp (được ghi nhãn).
          </p>
        </Card>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Danh mục nguồn</h2>
      <div className="space-y-3">
        {rows.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={s.sourceType === "official_regulation" ? "success" : s.sourceType === "commercial_prep" ? "neutral" : "primary"}>{TYPE[s.sourceType] ?? s.sourceType}</Badge>
              <Badge>Độ tin cậy: {s.confidence}</Badge>
              <Badge>{s.permissionStatus === "link_only" ? "Chỉ liên kết" : s.permissionStatus === "public_document" ? "Văn bản công khai" : "Sở hữu"}</Badge>
            </div>
            <h3 className="mt-2 font-semibold">{s.title}</h3>
            <p className="text-sm text-muted">
              {s.publisher}
              {s.publicationDate ? ` · ${s.publicationDate}` : ""} · kiểm tra lần cuối {s.lastVerifiedAt}
            </p>
            <p className="mt-1 text-sm">{s.contentCovered}</p>
            {s.notes && <p className="mt-1 text-xs text-muted">{s.notes}</p>}
            {s.canonicalUrl && (
              <a href={s.canonicalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all text-sm text-primary hover:underline">
                {s.canonicalUrl} ↗
              </a>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { validateLiveContent } from "@/server/admin";
import { getActiveSpec } from "@/server/ops";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Kiểm định nội dung" };

export default async function ValidationPage() {
  const issues = await validateLiveContent(await getDb());
  const spec = await getActiveSpec();
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return (
    <>
      <PageHeader
        title="Kiểm định nội dung"
        description={`Kiểm tra tự động trên dữ liệu đang chạy: đáp án tồn tại và nằm trong phương án, không trùng phương án, trích dẫn căn cứ khớp nguyên văn, giải thích không mâu thuẫn đáp án, liên kết bài đọc/audio, tệp audio tồn tại, snapshot đề đã xuất bản. Cấu trúc đề được kiểm tra theo đặc tả ${spec.version} khi chạy npm run content:validate. Kiểm tra tự động không thay thế việc duyệt chất lượng sư phạm bởi người.`}
      />
      <p className="mb-4 text-sm">
        <Badge tone={errors.length ? "danger" : "success"}>{errors.length} lỗi</Badge> <Badge tone={warnings.length ? "warning" : "success"}>{warnings.length} cảnh báo</Badge>
      </p>
      <Card>
        {issues.length === 0 ? (
          <p className="text-sm text-success">Không phát hiện vấn đề.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {[...errors, ...warnings].map((i, n) => (
              <li key={n} className="py-1.5">
                <Badge tone={i.severity === "error" ? "danger" : "warning"}>{i.severity}</Badge> <span className="font-mono text-xs">{i.entity}</span> — {i.message}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Liên hệ" };

export default function ContactPage() {
  const email = process.env.SUPPORT_EMAIL;
  return (
    <>
      <PageHeader title="Liên hệ & hỗ trợ / Contact" />
      <Card className="space-y-3 text-sm">
        {email ? (
          <p>
            Email hỗ trợ:{" "}
            <a href={`mailto:${email}`} className="text-primary underline">
              {email}
            </a>
          </p>
        ) : null}
        <p>Khi báo lỗi nội dung (đáp án sai, giải thích chưa rõ), vui lòng ghi tên đề và số câu. Chúng tôi xem xét mọi báo cáo và cập nhật phiên bản câu hỏi; bài làm cũ của bạn vẫn giữ nguyên phiên bản đề đã dùng.</p>
        <p>Tiến độ được lưu theo tên đăng nhập: vào lại bằng đúng tên đó trên bất kỳ thiết bị nào để tiếp tục. Chúng tôi không thể khôi phục tên đăng nhập đã quên.</p>
      </Card>
    </>
  );
}

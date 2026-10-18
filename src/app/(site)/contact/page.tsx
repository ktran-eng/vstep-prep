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
        ) : (
          <p className="text-muted">Địa chỉ email hỗ trợ chưa được cấu hình (biến môi trường SUPPORT_EMAIL).</p>
        )}
        <p>Khi báo lỗi nội dung (đáp án sai, giải thích chưa rõ), vui lòng ghi tên đề và số câu. Chúng tôi xem xét mọi báo cáo và cập nhật phiên bản câu hỏi; bài làm cũ của bạn vẫn giữ nguyên phiên bản đề đã dùng.</p>
        <p>Lưu ý: chúng tôi không thể khôi phục tiến độ nếu bạn xoá cookie trình duyệt, vì nền tảng không dùng tài khoản.</p>
      </Card>
    </>
  );
}

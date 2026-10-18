import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Điều khoản sử dụng / Terms of use" description="Phiên bản 1 · có hiệu lực từ 18/10/2026" />
      <Card className="space-y-3 text-sm leading-relaxed">
        <p>1. Nền tảng cung cấp tài liệu luyện thi miễn phí cho mục đích học tập cá nhân. Đây không phải dịch vụ chính thức của Bộ GD&ĐT hay của đơn vị tổ chức thi VSTEP nào.</p>
        <p>2. Nội dung đề là tài liệu gốc mô phỏng định dạng VSTEP, không phải đề thi thật. Điểm hiển thị là ước tính luyện tập và không thay thế, không dự đoán chắc chắn kết quả thi chính thức hay việc cấp chứng chỉ.</p>
        <p>3. Nhận xét tự động do AI tạo ra có thể sai sót. Hãy dùng chúng như gợi ý tham khảo.</p>
        <p>4. Bạn không được sao chép hàng loạt, bán lại nội dung, hoặc cố ý truy cập dữ liệu của người khác, phá vỡ cơ chế bảo mật hay gây quá tải hệ thống.</p>
        <p>5. Bạn chịu trách nhiệm về nội dung mình gửi lên (bài viết, ghi âm) và không gửi thông tin nhạy cảm của người khác.</p>
        <p>6. Dịch vụ được cung cấp &ldquo;nguyên trạng&rdquo;; chúng tôi có thể thay đổi hoặc tạm ngưng tính năng và sẽ cập nhật điều khoản tại trang này.</p>
      </Card>
    </>
  );
}

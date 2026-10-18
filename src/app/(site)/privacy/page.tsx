import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Chính sách quyền riêng tư" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Chính sách quyền riêng tư / Privacy policy" description="Phiên bản 1 · có hiệu lực từ 18/10/2026" />
      <div className="space-y-4 text-sm leading-relaxed">
        <Card>
          <h2 className="font-semibold">1. Dữ liệu chúng tôi thu thập</h2>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Mã định danh ẩn danh ngẫu nhiên, lưu trong cookie có chữ ký (không có email, mật khẩu hay tài khoản).</li>
            <li>Tên hiển thị (không bắt buộc), mục tiêu học, ngày thi dự kiến, lịch học, ngôn ngữ và giao diện.</li>
            <li>Bài làm: câu trả lời, thời gian làm bài, bài viết, bản ghi âm phần Nói (chỉ khi bạn bấm Nộp), bản chép lời, nhận xét, ghi chú và từ vựng.</li>
            <li>Nhật ký kỹ thuật tối thiểu cho giới hạn tần suất (theo mã ẩn danh, tự xoá sau 2 ngày).</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">2. Mục đích</h2>
          <p className="mt-2">Lưu tiến độ, chấm điểm, đưa ra nhận xét và gợi ý học tập. Chúng tôi không bán dữ liệu, không dùng quảng cáo hay công cụ theo dõi bên thứ ba.</p>
        </Card>
        <Card>
          <h2 className="font-semibold">3. Ghi âm và xử lý bởi bên thứ ba</h2>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Micro chỉ bật khi bạn bấm Bắt đầu; bản ghi nằm trong trình duyệt cho tới khi bạn bấm Nộp.</li>
            <li>Khi nộp, bạn chọn: chỉ lưu để tự nghe lại, hoặc cho phép xử lý bằng AI.</li>
            <li>Nếu cho phép, bản ghi được gửi tới OpenAI (chép lời) và bản chép lời được gửi tới Anthropic (nhận xét). Bài Viết được gửi tới Anthropic khi bạn nộp, nếu máy chủ bật tính năng chấm tự động.</li>
            <li>Các nhà cung cấp này xử lý dữ liệu theo điều khoản API của họ; chúng tôi không gửi kèm thông tin định danh nào.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">4. Lưu trữ và xoá</h2>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Dữ liệu được lưu trong cơ sở dữ liệu PostgreSQL riêng tư của nền tảng; bản ghi âm chỉ phát được bởi chính trình duyệt đã tạo ra nó.</li>
            <li>Bản ghi âm được giữ tối đa 180 ngày; hồ sơ không hoạt động quá 24 tháng sẽ bị xoá.</li>
            <li>Bạn có thể tải toàn bộ dữ liệu (JSON) hoặc xoá vĩnh viễn trong trang Cài đặt bất cứ lúc nào.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">5. Quyền của bạn</h2>
          <p className="mt-2">Bạn có quyền truy cập, tải về, chỉnh sửa và xoá dữ liệu của mình. Vì không có tài khoản, các thao tác này thực hiện trên chính trình duyệt đang lưu cookie. Liên hệ qua trang Liên hệ nếu cần hỗ trợ.</p>
        </Card>
      </div>
    </>
  );
}

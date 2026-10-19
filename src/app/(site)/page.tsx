import Link from "next/link";
import { ButtonLink, Card, Notice } from "@/components/ui";
import { getDict } from "@/i18n/server";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const { t } = await getDict();
  const features = [
    { title: "Đề thi thử đầy đủ 4 kỹ năng", body: "Nghe 35 câu, Đọc 40 câu, Viết 2 bài, Nói 3 phần theo cấu trúc QĐ 729/QĐ-BGDĐT, tính giờ theo máy chủ, tự động lưu và khôi phục khi mất kết nối." },
    { title: "Giải thích có căn cứ", body: "Mỗi câu Đọc/Nghe có đáp án, giải thích, câu căn cứ được đánh dấu trong bài đọc hoặc transcript, và lý do các phương án khác sai." },
    { title: "Phản hồi Viết & Nói theo tiêu chí", body: "Nhận xét theo rubric luyện tập (hoàn thành nhiệm vụ, tổ chức, từ vựng, ngữ pháp), sửa lỗi kèm giải thích, bài mẫu. Điểm AI luôn được ghi rõ là ước tính." },
    { title: "Theo dõi tiến bộ thật", body: "Biểu đồ và gợi ý tính từ chính bài làm của bạn: độ chính xác theo dạng câu, xu hướng điểm, thời gian học, kế hoạch tuần." },
  ];
  return (
    <>
      {deleted && (
        <Notice tone="success" className="mb-6">
          Toàn bộ dữ liệu của bạn đã được xoá. / All your data has been deleted.
        </Notice>
      )}
      <section className="grid items-center gap-8 py-6 lg:grid-cols-[3fr_2fr] lg:py-12">
        <div>
          <p className="text-sm font-medium text-primary">VSTEP.3–5 · B1 · B2 · C1</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Luyện thi VSTEP hiệu quả, biết rõ mình yếu ở đâu</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{t.tagline}.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/start">Bắt đầu luyện tập</ButtonLink>
            <ButtonLink href="/guide" variant="secondary">
              Tìm hiểu kỳ thi VSTEP
            </ButtonLink>
          </div>
          <p className="mt-3 text-sm text-muted">Miễn phí, không cần mật khẩu — chỉ cần chọn một tên đăng nhập, tiến độ được lưu theo tên đó.</p>
        </div>
        <Card className="text-sm">
          <h2 className="mb-3 font-semibold">Cấu trúc bài thi (QĐ 729/QĐ-BGDĐT)</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="font-medium">Nghe</dt>
            <dd className="text-muted">3 phần · 35 câu · ~40 phút</dd>
            <dt className="font-medium">Đọc</dt>
            <dd className="text-muted">4 bài · 40 câu · 60 phút</dd>
            <dt className="font-medium">Viết</dt>
            <dd className="text-muted">Thư ~120 từ + Luận ~250 từ · 60 phút</dd>
            <dt className="font-medium">Nói</dt>
            <dd className="text-muted">3 phần · 12 phút</dd>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Điểm mỗi kỹ năng 0–10; trung bình 4,0–5,5 → B1, 6,0–8,0 → B2, 8,5–10 → C1.{" "}
            <Link href="/sources" className="underline">
              Nguồn
            </Link>
          </p>
        </Card>
      </section>
      <section className="grid gap-4 py-6 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}>
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted">{f.body}</p>
          </Card>
        ))}
      </section>
      <section className="py-6">
        <h2 className="mb-3 text-xl font-semibold">Lộ trình theo trình độ</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["B1", "B2", "C1"].map((l) => (
            <Link key={l} href={`/levels/${l.toLowerCase()}`} className="block rounded-[var(--radius-card)] border border-border bg-surface p-5 hover:border-primary">
              <p className="text-2xl font-semibold">{l}</p>
              <p className="text-sm text-muted">{l === "B1" ? "Bậc 3 · trung bình 4,0–5,5" : l === "B2" ? "Bậc 4 · trung bình 6,0–8,0" : "Bậc 5 · trung bình 8,5–10"}</p>
            </Link>
          ))}
        </div>
      </section>
      <Notice tone="warning" className="mt-6">
        Đây là nền tảng luyện thi độc lập. Toàn bộ đề là nội dung gốc mô phỏng định dạng VSTEP, không phải đề thi chính thức, và không có liên kết với Bộ GD&ĐT hay các đơn vị tổ chức thi. Kết quả luyện tập không đảm bảo kết quả thi thật.
      </Notice>
    </>
  );
}

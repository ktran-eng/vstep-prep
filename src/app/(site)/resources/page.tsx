import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Tài liệu" };

type Resource = { title: string; url: string; note: string; skills?: string; access?: string; completeness?: "full" | "partial" | "info" };

// Evaluated 2026-10-18 — see docs/research/external-vstep-sources.md. All link-only: none grants permission to copy.
const GROUPS: { group: string; intro?: string; items: Resource[] }[] = [
  {
    group: "Văn bản & thông tin chính thức",
    items: [
      { title: "QĐ 729/QĐ-BGDĐT – Định dạng đề thi VSTEP bậc 3–5", url: "https://www.haui.edu.vn/media/25/uftai-ve-tai-day25445.pdf", note: "Văn bản gốc quy định cấu trúc đề và cách quy đổi điểm.", completeness: "info" },
      { title: "VSTEP – Định dạng đề thi (ULIS, ĐHQGHN)", url: "https://vstep.vnu.edu.vn/dinh-dang-de-thi-vstep-3-5/", note: "Trung tâm Khảo thí – đơn vị phát triển bài thi. Có file định dạng; chưa thấy đề minh hoạ tải được.", completeness: "info" },
      { title: "Bộ Giáo dục và Đào tạo", url: "https://moet.gov.vn/", note: "Cổng thông tin chính thức.", completeness: "info" },
    ],
  },
  {
    group: "Đề thi ngoài (chỉ liên kết)",
    intro:
      "Các đề dưới đây thuộc bản quyền của đơn vị phát hành; nền tảng không được phép sao chép nên chỉ dẫn link. Điều kiện truy cập và mức độ đầy đủ được ghi theo những gì kiểm tra được ngày 18/10/2026.",
    items: [
      {
        title: "Đề thi minh họa VSTEP bậc 3–5 – ĐH Cần Thơ (CFLA)",
        url: "https://cfla.ctu.edu.vn/tai-lieu",
        note: "Đề 4 kỹ năng (2019) kèm đáp án phần Reading.",
        skills: "Nghe · Đọc · Viết · Nói",
        access: "Tải trực tiếp, miễn phí",
        completeness: "partial",
      },
      {
        title: "Đề thi mẫu VSTEP.3-5 4 kỹ năng – ZIM",
        url: "https://zim.vn/de-thi-vstep",
        note: "Đúng cấu trúc QĐ 729; có đáp án Nghe/Đọc, transcript, bài mẫu Viết/Nói; không có giải thích từng câu.",
        skills: "Nghe · Đọc · Viết · Nói",
        access: "Miễn phí, xem trên web",
        completeness: "full",
      },
      {
        title: "Bộ đề B1 / B2 / C1 – Anh Ngữ Vivian (vstep.edu.vn)",
        url: "https://vstep.edu.vn/",
        note: "3 bộ đề 4 kỹ năng có đáp án (theo mô tả của trang; nội dung chưa kiểm chứng).",
        skills: "Nghe · Đọc · Viết · Nói",
        access: "Tải qua biểu mẫu đăng ký thông tin",
        completeness: "full",
      },
      {
        title: "Thi thử online – Anh Ngữ Vivian",
        url: "https://online.vivian.edu.vn/ThiThu",
        note: "Thi thử trực tuyến 4 kỹ năng (theo mô tả của trang).",
        skills: "Nghe · Đọc · Viết · Nói",
        access: "Trực tuyến",
        completeness: "full",
      },
      {
        title: "VSTEP Reading Mock Tests (16 đề) – ACE of English",
        url: "https://aceofenglish.com/vsteptestlibrary/skills/reading/full-tests",
        note: "4 bài / 40 câu / 60 phút; có đáp án và giải thích sau khi nộp.",
        skills: "Đọc",
        access: "Trang ghi miễn phí; có thể cần đăng nhập",
        completeness: "partial",
      },
      {
        title: "VSTEP Listening Full Tests (13 đề) – ACE of English",
        url: "https://aceofenglish.com/vsteptestlibrary/skills/listening/full-tests",
        note: "3 phần / 35 câu; có đáp án và transcript sau khi nộp.",
        skills: "Nghe",
        access: "Trang ghi miễn phí; có thể cần đăng nhập",
        completeness: "partial",
      },
      {
        title: "VSTEP Writing & Speaking – ACE of English",
        url: "https://aceofenglish.com/vstep",
        note: "Đề Viết (2 task) và Nói (3 phần) có nhận xét AI.",
        skills: "Viết · Nói",
        access: "Có thể cần đăng nhập / tín dụng",
        completeness: "partial",
      },
    ],
  },
];

const COMPLETENESS = {
  full: { label: "Đề đủ 4 kỹ năng", tone: "success" as const },
  partial: { label: "Một phần", tone: "warning" as const },
  info: { label: "Thông tin", tone: "neutral" as const },
};

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Tài liệu"
        description="Nguồn chính thức và các đề luyện thi bên ngoài. Đề trong nền tảng là nội dung gốc; tài liệu bên ngoài chỉ được liên kết để tôn trọng bản quyền."
      />
      <Notice tone="primary" className="mb-6">
        Muốn luyện ngay trên nền tảng (có chấm điểm, giải thích, lưu tiến độ)?{" "}
        <Link href="/mock" className="font-medium underline">
          Làm đề thi thử
        </Link>{" "}
        hoặc{" "}
        <Link href="/learn/reading" className="font-medium underline">
          luyện theo kỹ năng
        </Link>
        .
      </Notice>
      {GROUPS.map((g) => (
        <section key={g.group} className="mb-8">
          <h2 className="mb-1 text-lg font-semibold">{g.group}</h2>
          {g.intro && <p className="mb-3 max-w-3xl text-sm text-muted">{g.intro}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {g.items.map((it) => (
              <Card key={it.url + it.title}>
                <div className="mb-1 flex flex-wrap gap-2">
                  {it.completeness && <Badge tone={COMPLETENESS[it.completeness].tone}>{COMPLETENESS[it.completeness].label}</Badge>}
                  {it.skills && <Badge>{it.skills}</Badge>}
                  {g.group.startsWith("Đề thi ngoài") && <Badge tone="neutral">Chỉ liên kết · bản quyền bên ngoài</Badge>}
                </div>
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {it.title} ↗
                </a>
                <p className="mt-1 text-sm text-muted">{it.note}</p>
                {it.access && <p className="mt-1 text-xs text-muted">Truy cập: {it.access}</p>}
              </Card>
            ))}
          </div>
        </section>
      ))}
      <p className="text-sm text-muted">
        Phương pháp đánh giá và điều khoản bản quyền của từng nguồn:{" "}
        <Link href="/sources" className="underline">
          Nguồn & phương pháp
        </Link>
        .
      </p>
    </>
  );
}

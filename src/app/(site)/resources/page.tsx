import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Tài liệu" };

const RESOURCES = [
  {
    group: "Văn bản & thông tin chính thức",
    items: [
      { title: "QĐ 729/QĐ-BGDĐT – Định dạng đề thi VSTEP bậc 3–5", url: "https://www.haui.edu.vn/media/25/uftai-ve-tai-day25445.pdf", note: "Văn bản gốc (bản lưu tại ĐH Công nghiệp Hà Nội)." },
      { title: "VSTEP – Test format (ULIS, ĐHQGHN)", url: "https://vstep.vnu.edu.vn/test-format/", note: "Trung tâm Khảo thí, Trường ĐH Ngoại ngữ – ĐHQGHN." },
      { title: "Bộ Giáo dục và Đào tạo", url: "https://moet.gov.vn/", note: "Cổng thông tin chính thức." },
      { title: "Trường ĐH Ngoại ngữ – ĐHQGHN (ULIS)", url: "https://ulis.vnu.edu.vn/", note: "Đơn vị phát triển bài thi VSTEP." },
    ],
  },
  {
    group: "Tài liệu luyện thi bên ngoài (chỉ liên kết)",
    items: [
      { title: "ZIM Academy – Đề thi mẫu VSTEP", url: "https://zim.vn/de-thi-vstep", note: "Đề mẫu có giải thích (nội dung thuộc ZIM)." },
      { title: "Anh Ngữ Vivian – vstep.edu.vn", url: "https://vstep.edu.vn/", note: "Bài viết và bộ đề tải về." },
      { title: "ACE of English", url: "https://aceofenglish.com/", note: "Nền tảng luyện thi trực tuyến." },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHeader title="Tài liệu" description="Liên kết tới nguồn chính thức và tài liệu tham khảo. Chúng tôi không sao chép nội dung của các trang này; vui lòng tuân thủ điều khoản sử dụng của từng trang." />
      {RESOURCES.map((g) => (
        <section key={g.group} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{g.group}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {g.items.map((it) => (
              <Card key={it.url}>
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {it.title} ↗
                </a>
                <p className="mt-1 text-sm text-muted">{it.note}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Trên nền tảng này</h2>
        <ul className="ml-5 list-disc text-sm">
          <li>
            <Link href="/guide" className="text-primary hover:underline">
              Hướng dẫn kỳ thi và cách tính điểm
            </Link>
          </li>
          <li>
            <Link href="/levels/b1" className="text-primary hover:underline">
              Lộ trình B1
            </Link>{" "}
            ·{" "}
            <Link href="/levels/b2" className="text-primary hover:underline">
              B2
            </Link>{" "}
            ·{" "}
            <Link href="/levels/c1" className="text-primary hover:underline">
              C1
            </Link>
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              Nguồn & phương pháp
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { getActiveSpec } from "@/server/ops";
import { Badge, Card, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Hướng dẫn kỳ thi VSTEP.3–5" };
export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const spec = await getActiveSpec();
  return (
    <>
      <PageHeader
        title="Hướng dẫn kỳ thi VSTEP.3–5"
        description="VSTEP (Vietnamese Standardized Test of English Proficiency) bậc 3–5 là bài thi đánh giá năng lực tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam, tương ứng CEFR B1–C1. Một đề thi dùng chung cho cả ba bậc; bậc được xác định từ điểm trung bình."
      />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Cấu trúc đề thi</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th scope="col" className="py-2">
                    Kỹ năng
                  </th>
                  <th scope="col">Thời gian</th>
                  <th scope="col">Số câu / nhiệm vụ</th>
                  <th scope="col">Dạng bài</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-t border-border">
                  <th scope="row" className="py-2">
                    Nghe
                  </th>
                  <td>~{spec.listening.minutes} phút (gồm thời gian chuyển đáp án)</td>
                  <td>
                    3 phần, {spec.listening.totalQuestions} câu trắc nghiệm
                    <br />
                    <span className="text-xs text-muted">
                      Phân bố thường gặp {spec.listening.parts.map((p) => p.questions).join("/")} {!spec.listening.partSplitVerified && <Badge tone="warning">chưa xác minh từ văn bản gốc</Badge>}
                    </span>
                  </td>
                  <td>Thông báo, hướng dẫn ngắn; hội thoại; bài nói chuyện, bài giảng</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className="py-2">
                    Đọc
                  </th>
                  <td>{spec.reading.minutes} phút</td>
                  <td>
                    {spec.reading.passages} bài đọc, {spec.reading.passages * spec.reading.questionsPerPassage} câu
                  </td>
                  <td>
                    Văn bản bậc 3–5, tổng {spec.reading.totalWordsRange[0]}–{spec.reading.totalWordsRange[1]} từ (theo QĐ 729; trang ULIS ghi 1.900–2.500)
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className="py-2">
                    Viết
                  </th>
                  <td>{spec.writing.minutes} phút</td>
                  <td>2 bài</td>
                  <td>Bài 1: thư/email ~120 từ (1/3 điểm). Bài 2: bài luận ~250 từ (2/3 điểm), dùng lý do và ví dụ cụ thể</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className="py-2">
                    Nói
                  </th>
                  <td>{spec.speaking.minutes} phút</td>
                  <td>3 phần</td>
                  <td>
                    Phần 1: tương tác xã hội (3–6 câu hỏi, 2 chủ đề). Phần 2: thảo luận giải pháp (chọn 1 trong 3 và phản biện 2 giải pháp còn lại). Phần 3: phát triển chủ đề + câu hỏi thảo luận
                    {!spec.speaking.timingVerified && (
                      <span className="mt-1 block text-xs text-muted">
                        Thời lượng từng phần trên nền tảng ({spec.speaking.parts.map((p) => `${Math.round(p.responseSeconds / 60)}′`).join(" / ")}, chuẩn bị 1′ cho phần 2–3) là giả định cấu hình được, chưa xác minh từ văn bản gốc.
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Cách tính điểm và quy đổi bậc</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            <li>Mỗi kỹ năng được chấm trên thang 0–10, làm tròn đến 0,5.</li>
            <li>Điểm trung bình 4 kỹ năng (làm tròn đến 0,5) dùng để xác định bậc.</li>
            <li>Dưới 4,0: không xét bậc · 4,0–5,5: Bậc 3 (B1) · 6,0–8,0: Bậc 4 (B2) · 8,5–10: Bậc 5 (C1).</li>
          </ul>
          <Notice tone="warning" className="mt-3">
            Không có bảng quy đổi chính thức công khai từ số câu đúng Nghe/Đọc sang điểm 0–10. Nền tảng dùng ước tính tuyến tính (10 × tỉ lệ đúng) và luôn ghi rõ là điểm ước tính. Điểm Viết/Nói do AI chấm theo rubric luyện tập, không phải thang chấm chính thức.
          </Notice>
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Mẹo làm bài</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            <li>Nghe: đọc trước câu hỏi, gạch chân từ khoá; chú ý từ chuyển ý (however, actually) vì đáp án thường đến sau chúng.</li>
            <li>Đọc: phân bổ ~15 phút/bài; bài cuối thường khó nhất. Câu từ vựng: đọc câu trước và sau để suy nghĩa.</li>
            <li>Viết: làm Task 2 trước nếu bạn viết chậm — nó chiếm 2/3 điểm. Kiểm tra đủ ý yêu cầu của đề.</li>
            <li>Nói: dùng thời gian chuẩn bị để ghi từ khoá, không viết cả câu. Ở phần 2 hãy nói rõ vì sao 2 giải pháp còn lại kém hơn.</li>
          </ul>
        </Card>
        <p className="text-sm text-muted">
          Nguồn và ghi chú về độ tin cậy:{" "}
          <Link href="/sources" className="underline">
            Nguồn & phương pháp
          </Link>
          .
        </p>
      </div>
    </>
  );
}

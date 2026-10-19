import type { Metadata } from "next";
import { Card, Notice } from "@/components/ui";
import { currentLearner } from "@/server/identity";
import { safeNextPath, USERNAME_RULE } from "@/domain/username";
import { SignInForm } from "./form";

export const metadata: Metadata = { title: "Bắt đầu" };
export const dynamic = "force-dynamic";

export default async function StartPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const me = await currentLearner();
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-2xl font-semibold">Nhập tên đăng nhập</h1>
      <p className="mt-2 text-muted">Không cần mật khẩu. Tiến độ, lịch sử làm bài và bảng tổng quan được lưu theo tên đăng nhập này, dùng lại cùng tên trên bất kỳ máy nào để tiếp tục.</p>
      {me && (
        <Notice tone="primary" className="mt-4">
          Bạn đang dùng tên <b>{me.username}</b>. Nhập tên khác để chuyển sang hồ sơ khác.
        </Notice>
      )}
      <Card className="mt-6">
        <SignInForm next={safeNextPath(next)} rule={USERNAME_RULE} />
      </Card>
      <Notice tone="warning" className="mt-4">
        Vì không có mật khẩu, ai biết tên đăng nhập của bạn đều có thể xem và làm bài trên hồ sơ đó. Hãy chọn tên khó đoán (ví dụ <code>lan.vstep2026</code>) và không dùng thông tin nhạy cảm như số điện thoại hay số CCCD.
      </Notice>
    </div>
  );
}

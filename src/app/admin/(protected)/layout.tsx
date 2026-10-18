import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/server/admin-auth";
import { adminLogoutAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV = [
  ["/admin", "Tổng quan"],
  ["/admin/content", "Ngân hàng câu hỏi"],
  ["/admin/prompts", "Đề Viết/Nói & bài đọc"],
  ["/admin/tests", "Đề thi"],
  ["/admin/audio", "Audio"],
  ["/admin/validation", "Kiểm định nội dung"],
  ["/admin/quality", "Thống kê câu hỏi"],
  ["/admin/scoring", "Đặc tả & chấm điểm"],
  ["/admin/sources", "Nguồn"],
  ["/admin/audit", "Nhật ký"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-enforced: every admin page renders only after this check (actions re-check individually).
  await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-border bg-surface p-4 lg:border-b-0 lg:border-r">
        <p className="mb-3 font-semibold">VSTEP Prep · Admin</p>
        <nav aria-label="Admin">
          <ul className="flex flex-wrap gap-1 lg:block lg:space-y-0.5">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block rounded-md px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-text">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={adminLogoutAction} className="mt-4">
          <button type="submit" className="text-sm text-danger hover:underline">
            Đăng xuất
          </button>
        </form>
      </aside>
      <main id="main" className="min-w-0 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}

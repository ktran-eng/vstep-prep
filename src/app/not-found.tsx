import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto mt-24 max-w-md px-4 text-center">
      <p className="text-5xl font-semibold text-muted">404</p>
      <h1 className="mt-2 text-xl font-semibold">Không tìm thấy trang / Page not found</h1>
      <p className="mt-2 text-sm text-muted">Trang hoặc bài làm này không tồn tại, hoặc không thuộc về trình duyệt của bạn.</p>
      <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg">
        Về trang tổng quan
      </Link>
    </main>
  );
}

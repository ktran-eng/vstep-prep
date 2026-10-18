"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto mt-24 max-w-md px-4 text-center">
      <h1 className="text-xl font-semibold">Đã xảy ra lỗi / Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">Bài làm của bạn đã được lưu tự động. Hãy thử lại; nếu lỗi tiếp diễn, vui lòng liên hệ hỗ trợ{error.digest ? ` (mã lỗi ${error.digest})` : ""}.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg">
        Thử lại / Retry
      </button>
    </main>
  );
}

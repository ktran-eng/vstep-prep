export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <div className="h-8 w-1/3 animate-pulse rounded bg-surface-2" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/client";
import { cx } from "./ui";

const ICONS: Record<string, string> = {
  dashboard: "M3 12l9-8 9 8M5 10v10h14V10",
  mock: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  reading: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16",
  listening: "M4 14v-2a8 8 0 0116 0v2M4 14h3v6H4zM17 14h3v6h-3z",
  writing: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  speaking: "M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v3",
  review: "M4 4h16v12H8l-4 4zM9 9h6M9 12h4",
  vocabulary: "M4 4h7v16H4zM13 4h7v16h-7zM6 8h3M15 8h3",
  plan: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  history: "M12 7v5l3 3M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v4h4",
  resources: "M5 4h14v16l-7-4-7 4z",
  settings: "M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-2-4-2 1-2-2V4h-4v2l-2 2-2-1-2 4 2 1v0l-2 1 2 4 2-1 2 2v2h4v-2l2-2 2 1 2-4z",
};

function Icon({ name }: { name: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();
  // The mobile menu is "open for" a specific path, so navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (fn: (v: boolean) => boolean) => setOpenFor(fn(open) ? pathname : null);

  const items: { key: keyof typeof t.nav; href: string }[] = [
    { key: "dashboard", href: "/dashboard" },
    { key: "mock", href: "/mock" },
    { key: "reading", href: "/learn/reading" },
    { key: "listening", href: "/learn/listening" },
    { key: "writing", href: "/learn/writing" },
    { key: "speaking", href: "/learn/speaking" },
    { key: "review", href: "/review" },
    { key: "vocabulary", href: "/vocabulary" },
    { key: "plan", href: "/plan" },
    { key: "history", href: "/history" },
    { key: "resources", href: "/resources" },
    { key: "settings", href: "/settings" },
  ];

  const nav = (
    <nav aria-label="Main">
      <ul className="space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-text",
                )}
              >
                <Icon name={it.key} />
                {t.nav[it.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-4 overflow-y-auto p-4">
          <Link href="/" className="px-3 text-lg font-semibold tracking-tight">
            {t.appName}
          </Link>
          {nav}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <Link href="/" className="font-semibold">
            {t.appName}
          </Link>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {t.nav.menu}
          </button>
        </header>
        {open && (
          <div id="mobile-nav" className="border-b border-border bg-surface p-3 lg:hidden">
            {nav}
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

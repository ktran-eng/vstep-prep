import Link from "next/link";
import { getDict } from "@/i18n/server";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = await getDict();
  const links = [
    { href: "/guide", label: t.nav.guide },
    { href: "/tests", label: t.nav.tests },
    { href: "/resources", label: t.nav.resources },
    { href: "/sources", label: t.nav.sources },
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {t.appName}
          </Link>
          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted hover:text-text">
                {l.label}
              </Link>
            ))}
            <Link href="/dashboard" className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-fg hover:bg-primary-hover">
              {t.nav.dashboard}
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <p>
            © {new Date().getFullYear()} {t.appName}. {t.common.originalContent}
          </p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/privacy" className="hover:text-text">
              Quyền riêng tư / Privacy
            </Link>
            <Link href="/terms" className="hover:text-text">
              Điều khoản / Terms
            </Link>
            <Link href="/contact" className="hover:text-text">
              Liên hệ / Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

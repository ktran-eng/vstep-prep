import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getDict } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";

export const metadata: Metadata = {
  title: { default: "VSTEP Prep — Luyện thi VSTEP.3–5", template: "%s · VSTEP Prep" },
  description: "Luyện thi VSTEP.3–5 (B1, B2, C1): đề thi thử đủ 4 kỹ năng, giải thích chi tiết, phản hồi Viết/Nói theo tiêu chí và theo dõi tiến bộ.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDict();
  const theme = (await cookies()).get("vstep_theme")?.value;
  const dataTheme = theme === "light" || theme === "dark" ? theme : "system";
  return (
    <html lang={locale} data-theme={dataTheme} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-primary px-3 py-2 text-primary-fg">
          {t.nav.skipToContent}
        </a>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}

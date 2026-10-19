import Link from "next/link";
import type { Metadata } from "next";
import { getLearnerProfile, requireLearner } from "@/server/identity";
import { deleteMyDataAction, setLanguageAction, setThemeAction } from "@/app/actions/learner";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { PreferencesForm } from "@/components/preferences-form";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const { onboarding } = await searchParams;
  const learnerId = await requireLearner();
  const { t, locale } = await getDict();
  const { learner, prefs } = await getLearnerProfile(learnerId);
  return (
    <>
      <PageHeader title={t.nav.settings} crumbs={[{ href: "/dashboard", label: t.nav.dashboard }, { label: t.nav.settings }]} />
      {onboarding && (
        <Notice tone="primary" className="mb-4" title="Chào mừng!">
          Hãy cho biết mục tiêu của bạn. Bạn có thể thay đổi bất cứ lúc nào.
        </Notice>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Mục tiêu & lịch học</h2>
          <PreferencesForm
            onboarding={Boolean(onboarding)}
            initial={{
              displayName: learner?.displayName ?? "",
              targetLevel: prefs?.targetLevel ?? "B1",
              targetExamDate: prefs?.targetExamDate ?? "",
              studyMinutesPerDay: prefs?.studyMinutesPerDay ?? 45,
              studyDays: prefs?.studyDays ?? [1, 2, 3, 4, 5],
            }}
          />
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">
              {t.common.language} & {t.common.theme}
            </h2>
            <form action={setLanguageAction} className="mb-4 flex flex-wrap items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block">{t.common.language}</span>
                <select name="lang" defaultValue={locale} className="rounded-md border border-border bg-bg px-3 py-2">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </label>
              <Button type="submit" variant="secondary">
                {t.common.save}
              </Button>
            </form>
            <form action={setThemeAction} className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block">{t.common.theme}</span>
                <select name="theme" defaultValue={prefs?.theme ?? "system"} className="rounded-md border border-border bg-bg px-3 py-2">
                  <option value="system">Theo hệ thống / System</option>
                  <option value="light">Sáng / Light</option>
                  <option value="dark">Tối / Dark</option>
                </select>
              </label>
              <Button type="submit" variant="secondary">
                {t.common.save}
              </Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">Dữ liệu của bạn</h2>
            <p className="text-sm text-muted">
              Tiến độ được lưu theo tên đăng nhập <b>{learner?.username}</b>. Không có mật khẩu: nhập cùng tên trên máy khác để tiếp tục, và ai biết tên này đều mở được hồ sơ. Xem{" "}
              <Link href="/privacy" className="underline">
                chính sách quyền riêng tư
              </Link>
              .
            </p>
            <a href="/api/me/export" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              ⬇ Tải toàn bộ dữ liệu (JSON)
            </a>
            <form action={deleteMyDataAction} className="mt-4 space-y-2 rounded-md border border-danger p-3">
              <p className="text-sm font-medium text-danger">Xoá vĩnh viễn toàn bộ dữ liệu</p>
              <p className="text-xs text-muted">Bao gồm bài làm, bản ghi âm, ghi chú và kế hoạch học. Không thể hoàn tác. Gõ DELETE để xác nhận.</p>
              <label className="block text-sm">
                <span className="sr-only">Type DELETE</span>
                <input name="confirm" required pattern="DELETE" className="rounded-md border border-border bg-bg px-3 py-2" autoComplete="off" />
              </label>
              <Button type="submit" variant="danger">
                Xoá dữ liệu
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

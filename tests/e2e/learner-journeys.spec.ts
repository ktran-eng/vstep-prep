import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "../../playwright.config";

const uniq = () => `e2e.${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

async function signIn(page: Page, name: string, next = "/dashboard") {
  await page.goto(`/start?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Tên đăng nhập").fill(name);
  await page.getByRole("button", { name: "Vào học" }).click();
  await page.waitForURL((u) => u.pathname === next);
}

async function startPracticeFromCatalog(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole("button", { name: "Luyện tập" }).first().click();
  await page.waitForURL(/\/attempt\//);
}

async function submitWholeAttempt(page: Page) {
  await page.getByRole("button", { name: "Nộp toàn bộ bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận" }).click();
  await page.waitForURL(/\/result$/);
}

test("visitors without a sign-in name are sent to /start and returned afterwards", async ({ page }) => {
  await page.goto("/mock");
  await expect(page).toHaveURL(/\/start\?next=%2Fmock/);
  const name = uniq();
  await page.getByLabel("Tên đăng nhập").fill(name.toUpperCase());
  await page.getByRole("button", { name: "Vào học" }).click();
  await expect(page).toHaveURL(/\/mock$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible(); // normalised to lowercase in the sidebar
});

test("reading practice: answer, survive reload, submit, review explanations, mistake notebook", async ({ page }) => {
  await signIn(page, uniq());
  await startPracticeFromCatalog(page, "/learn/reading?level=B1");
  const radios = page.locator("fieldset").locator('input[type="radio"]');
  // Pick the first option of the first three questions.
  for (const i of [0, 4, 8]) await radios.nth(i).check();
  await expect(page.getByText("✓ Đã lưu")).toBeVisible();
  await page.reload();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(3);
  await submitWholeAttempt(page);
  await expect(page.getByRole("heading", { name: /Kết quả/ })).toBeVisible();
  await expect(page.getByText("Giải thích:").first()).toBeVisible();
  await expect(page.locator("mark").first()).toBeVisible(); // evidence highlighted in the passage
  await page.goto("/review");
  await expect(page.locator("main").getByRole("listitem").first()).toBeVisible(); // wrong/blank items are listed
  await page.goto("/dashboard");
  await expect(page.getByText("Buổi luyện tập")).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu luyện tập")).toHaveCount(0);
});

test("mock exam overview and practice mode allow going straight to Reading", async ({ page }) => {
  await signIn(page, uniq());
  await page.goto("/mock");
  await page.getByRole("link", { name: "Xem cấu trúc & bắt đầu" }).first().click();
  await expect(page.getByText("4. Nói")).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
  await page.waitForURL(/\/attempt\//);
  await page.getByRole("button", { name: "2. Reading" }).click();
  await expect(page.getByText("Bài đọc").first()).toBeVisible();
  await expect(page.locator("[aria-current=step]")).toHaveText(/Reading/);
});

test("strict mock exam: server timer shown, sections locked to official order", async ({ page }) => {
  await signIn(page, uniq());
  await page.goto("/mock/mock-2");
  await page.getByRole("button", { name: "Bắt đầu thi thử (tính giờ)" }).click();
  await page.waitForURL(/\/attempt\//);
  await expect(page.getByRole("timer")).toHaveText(/^(39|40):\d\d$/);
  await expect(page.getByRole("button", { name: "2. Reading" })).toHaveCount(0); // not clickable in exam mode
  // Answer keys/explanations must not be in the page before submission.
  const html = await page.content();
  // Look for the JSON keys (plain or escaped inside the RSC payload); the word itself appears in passages.
  expect(html).not.toMatch(/\\?"(explanation|evidence|distractors|segments)\\?"\s*:/);
  expect(html).not.toMatch(/\\?"answer\\?"\s*:\s*\\?"[A-D]/);
});

test("listening practice: audio plays and the transcript unlocks after one play", async ({ page }) => {
  await signIn(page, uniq());
  await startPracticeFromCatalog(page, "/learn/listening?level=B1");
  const showTranscript = page.getByRole("button", { name: "Xem transcript" });
  await expect(showTranscript).toBeDisabled();
  await page.getByRole("button", { name: "Phát" }).click();
  await expect(showTranscript).toBeEnabled();
  await showTranscript.click();
  await expect(page.locator("p", { hasText: ":" }).filter({ hasText: /Announcer|[A-Z][a-z]+:/ }).first()).toBeVisible();
});

test("writing practice: autosave and submit; without an AI key the status says unavailable (no fake score)", async ({ page }) => {
  await signIn(page, uniq());
  await page.goto("/learn/writing");
  await page.getByRole("link", { name: /Bắt đầu viết/ }).first().click();
  const editor = page.getByLabel("Your response");
  await editor.fill("Dear friend, thank you for your email. ".repeat(20));
  await expect(page.getByText("✓ Đã lưu")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await page.waitForURL(/\/learn\/writing\/submissions\//);
  await expect(page.getByText(/không khả dụng|unavailable/i).first()).toBeVisible({ timeout: 30_000 });
  // Scores render as "6.5/10"; dates like 19/10/2026 must not match.
  await expect(page.getByText(/\b\d{1,2}\.\d\/10\b/)).toHaveCount(0);
});

test("speaking practice: record with a (fake) microphone, choose consent, submit, play back", async ({ page }) => {
  await signIn(page, uniq());
  await page.goto("/learn/speaking");
  await page.getByRole("link").filter({ hasText: /Family|Gia đình|Technology|News/ }).first().click(); // a Part 1 prompt (no preparation time)
  await page.getByRole("button", { name: "Bắt đầu ghi âm" }).click();
  await expect(page.getByText(/Đang ghi âm/)).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Dừng/ }).click();
  const submit = page.getByRole("button", { name: "Nộp bản ghi âm" });
  await expect(submit).toBeDisabled(); // consent must be chosen explicitly
  await page.getByLabel(/Chỉ lưu bản ghi/).check();
  await submit.click();
  await expect(page.getByText("Đã nộp bản ghi âm.")).toBeVisible();
  await page.reload();
  const audio = page.locator('audio[src^="/api/recordings/"]').first();
  await expect(audio).toBeAttached();
  const src = await audio.getAttribute("src");
  const res = await page.request.get(src!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/audio\//);

  // Another learner cannot fetch this recording.
  await page.context().clearCookies();
  await signIn(page, uniq());
  expect((await page.request.get(src!)).status()).toBe(404);
});

test("another learner cannot open someone else's attempt", async ({ page }) => {
  await signIn(page, uniq());
  await startPracticeFromCatalog(page, "/learn/reading?level=B2");
  const attemptUrl = page.url();
  await page.context().clearCookies();
  await signIn(page, uniq());
  const res = await page.goto(attemptUrl);
  await expect(page.getByText(/Không tìm thấy trang/)).toBeVisible();
  expect(res).not.toBeNull();
});

test("admin area is protected server-side and the live content validation is clean", async ({ page }) => {
  await page.goto("/admin/validation");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Admin passphrase").fill("wrong-passphrase-123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.locator("#login-err")).toContainText("không đúng");
  await page.getByLabel("Admin passphrase").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/admin$/);
  await page.goto("/admin/validation");
  await expect(page.getByText("0 lỗi")).toBeVisible();
});

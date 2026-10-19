"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/server/db";
import { clearSessionCookie, findOrCreateByUsername, setSessionCookie } from "@/server/identity";
import { rateLimit } from "@/server/ops";
import { normaliseUsername, safeNextPath } from "@/domain/username";

/** Sign in with a name only: opens the existing profile for that name or creates a new one. */
export async function signInAction(_prev: unknown, formData: FormData): Promise<{ error: string } | undefined> {
  const parsed = normaliseUsername(String(formData.get("username") ?? ""));
  if (!parsed.ok) return { error: parsed.error };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await rateLimit(`signin:${ip}`, 30, 600))) return { error: "Bạn thử quá nhiều lần. Vui lòng đợi vài phút." };
  const learner = await findOrCreateByUsername(await getDb(), parsed.value);
  await setSessionCookie(learner.id);
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect("/start");
}

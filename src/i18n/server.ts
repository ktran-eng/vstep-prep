import "server-only";
import { cookies } from "next/headers";
import { DICTS, type Locale } from "./dict";

export const LANG_COOKIE = "vstep_lang";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "vi";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}

"use client";
import { createContext, useContext } from "react";
import { DICTS, type Dict, type Locale } from "./dict";

const Ctx = createContext<{ locale: Locale; t: Dict }>({ locale: "vi", t: DICTS.vi });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t: DICTS[locale] }}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}

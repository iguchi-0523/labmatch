"use client";

import { createContext, useContext } from "react";
import { getDict, type Locale } from "@/lib/i18n";

interface LocaleCtx {
  locale: Locale;
  t: ReturnType<typeof getDict>;
}

const Ctx = createContext<LocaleCtx | null>(null);

/** Server の layout から locale を受け取り、Client 配下に辞書を配る。 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={{ locale, t: getDict(locale) }}>
      {children}
    </Ctx.Provider>
  );
}

/** Client Component 用フック。Provider 外でも ja で安全に動く。 */
export function useT() {
  const v = useContext(Ctx);
  if (!v) return { locale: "ja" as Locale, t: getDict("ja") };
  return v;
}

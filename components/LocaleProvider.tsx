"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  getDict,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n";

interface LocaleCtx {
  locale: Locale;
  t: ReturnType<typeof getDict>;
  setLocale: (next: Locale) => void;
}

const Ctx = createContext<LocaleCtx | null>(null);

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  const v = m ? decodeURIComponent(m[1]) : null;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/**
 * ロケールをクライアント側で管理する。
 *
 * 以前はサーバー layout が cookie を読んで locale を渡していたが、それだと
 * cookie 依存でサイト全体が動的レンダリングになり、ラボ詳細を ISR キャッシュ
 * できなかった。そこで cookie 読み取りをここ（クライアント）へ移し、サーバーは
 * 既定の ja で静的に描画する。
 *
 * SSR と初回クライアントレンダは必ず ja。マウント後に cookie を読み、en なら
 * 切り替える（hydration mismatch を避けるため初期値は固定）。
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const c = readCookieLocale();
    if (c !== DEFAULT_LOCALE) setLocaleState(c);
    document.documentElement.lang = c;
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // cookie を読む動的ページ（/labs 等）をサーバー側で再描画させる。
      // ラボ詳細は ISR で ja 固定なので影響しない。
      router.refresh();
    },
    [router],
  );

  return (
    <Ctx.Provider value={{ locale, t: getDict(locale), setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

/** Client Component 用フック。Provider 外でも ja で安全に動く。 */
export function useT() {
  const v = useContext(Ctx);
  if (!v) {
    return {
      locale: "ja" as Locale,
      t: getDict("ja"),
      setLocale: () => {},
    };
  }
  return v;
}

"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n";
import { useT } from "./LocaleProvider";

/** ja / en の切替。cookie に保存して router.refresh で再描画。 */
export function LanguageToggle() {
  const router = useRouter();
  const { locale } = useT();

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    // 1 年保持。path=/ で全ページ共通。
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  const label: Record<Locale, string> = { ja: "日本語", en: "English" };

  return (
    <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden text-xs">
      {LOCALES.map((l, i) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-2.5 py-1 transition-colors ${
            locale === l
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } ${i > 0 ? "border-l border-gray-300 dark:border-gray-700" : ""}`}
        >
          {label[l]}
        </button>
      ))}
    </div>
  );
}

"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useT } from "./LocaleProvider";

/** ja / en の切替。cookie 保存と再描画は LocaleProvider.setLocale が担う。 */
export function LanguageToggle() {
  const { locale, setLocale } = useT();

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

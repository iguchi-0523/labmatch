"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "./LocaleProvider";

/**
 * キーワード AND/OR モードの切り替え（即時 URL 反映）。
 *
 * - URL `mode=or` / なし（=and）を真実とする
 * - クリックで router.push、フォーム送信不要
 */

export function KeywordModeToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "or" ? "or" : "and";

  const setMode = (next: "and" | "or") => {
    if (next === mode) return;
    const params = new URLSearchParams(searchParams);
    if (next === "and") params.delete("mode");
    else params.set("mode", "or");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const baseCls =
    "px-3 py-1 text-sm transition-colors cursor-pointer";
  const activeCls = "bg-blue-600 text-white";
  const inactiveCls =
    "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

  const { locale } = useT();

  return (
    <fieldset className="mt-3">
      <legend className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
        {locale === "ja" ? "複数キーワードの組合せ" : "Combine keywords"}
      </legend>
      <div
        role="radiogroup"
        aria-label={locale === "ja" ? "キーワードの組合せモード" : "Keyword combine mode"}
        className="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "and"}
          onClick={() => setMode("and")}
          className={`${baseCls} ${mode === "and" ? activeCls : inactiveCls}`}
        >
          {locale === "ja" ? "AND（すべて含む）" : "AND (all)"}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "or"}
          onClick={() => setMode("or")}
          className={`${baseCls} ${mode === "or" ? activeCls : inactiveCls} border-l border-gray-300 dark:border-gray-700`}
        >
          {locale === "ja" ? "OR（いずれか）" : "OR (any)"}
        </button>
      </div>
    </fieldset>
  );
}

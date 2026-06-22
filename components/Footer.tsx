"use client";

import Link from "next/link";
import { FavoritesNavLink } from "./FavoritesNavLink";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "./LocaleProvider";

const linkCls =
  "text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline";

export function Footer() {
  const { locale, t } = useT();
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600 dark:text-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t.brand}
            </h3>
            <p className="text-xs leading-relaxed">{t.scopeNote}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {locale === "ja" ? "ナビゲーション" : "Navigation"}
            </h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/" className={linkCls}>
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href="/labs" className={linkCls}>
                  {t.searchLabs}
                </Link>
              </li>
              <li>
                <FavoritesNavLink className={linkCls} />
              </li>
              <li>
                <Link href="/about" className={linkCls}>
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkCls}>
                  {t.contact}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkCls}>
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkCls}>
                  {t.terms}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {locale === "ja" ? "データソース" : "Data sources"}
            </h3>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="https://openalex.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                >
                  OpenAlex (CC0)
                </a>
              </li>
              <li>
                <a
                  href="https://kaken.nii.ac.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                >
                  KAKEN (CC BY)
                </a>
              </li>
              <li className="text-gray-500 dark:text-gray-400">
                {locale === "ja"
                  ? "要約・翻訳：Claude（Anthropic）"
                  : "Summaries & translation: Claude (Anthropic)"}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 flex-1 min-w-[200px]">
            <p>
              {locale === "ja"
                ? "※ 各研究室の紹介文・論文翻訳は AI による自動生成です。誤りや古い情報を含む可能性があるため、最終的な判断は研究室の公式情報をご確認ください。"
                : "Lab descriptions and paper translations are AI-generated and may contain errors or outdated information. Confirm with each lab's official source."}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <span>{t.language}</span>
              <LanguageToggle />
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

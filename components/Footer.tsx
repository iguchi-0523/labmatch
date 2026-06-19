import Link from "next/link";
import { FavoritesNavLink } from "./FavoritesNavLink";
import { ThemeToggle } from "./ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600 dark:text-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">ラボマッチ</h3>
            <p className="text-xs leading-relaxed">
              大学の研究室を分野・大学・キーワードから検索できるサイト。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">ナビゲーション</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  href="/"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  トップ
                </Link>
              </li>
              <li>
                <Link
                  href="/labs"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  研究室を検索
                </Link>
              </li>
              <li>
                <FavoritesNavLink className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline" />
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  このサイトについて
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">データソース</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="https://openalex.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  OpenAlex（CC0）
                </a>
              </li>
              <li>
                <a
                  href="https://kaken.nii.ac.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                >
                  KAKEN（CC BY）
                </a>
              </li>
              <li className="text-gray-500 dark:text-gray-400">
                要約・翻訳：Claude（Anthropic）
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 flex-1 min-w-[200px]">
          <p>
            ※ 各研究室の紹介文・論文翻訳は AI
            による自動生成です。誤りや古い情報を含む可能性があるため、最終的な判断は研究室の公式情報をご確認ください。
          </p>
          <p>
            掲載情報の修正・削除のご要望は運営者までお知らせください（個人運営・MVP
            開発中）。
          </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <span>表示モード：</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">ラボマッチ</h3>
            <p className="text-xs leading-relaxed">
              大学の研究室を分野・大学・キーワードから検索できるサイト。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">ナビゲーション</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/" className="hover:underline">
                  トップ
                </Link>
              </li>
              <li>
                <Link href="/labs" className="hover:underline">
                  研究室を検索
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline">
                  このサイトについて
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">データソース</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <a
                  href="https://openalex.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  OpenAlex（CC0）
                </a>
              </li>
              <li>
                <a
                  href="https://kaken.nii.ac.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  KAKEN（CC BY）
                </a>
              </li>
              <li className="text-gray-500">
                要約・翻訳：Claude（Anthropic）
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
          <p>
            ※ 各研究室の紹介文・論文翻訳は AI
            による自動生成です。誤りや古い情報を含む可能性があるため、最終的な判断は研究室の公式情報をご確認ください。
          </p>
          <p>
            掲載情報の修正・削除のご要望は運営者までお知らせください（個人運営・MVP
            開発中）。
          </p>
        </div>
      </div>
    </footer>
  );
}

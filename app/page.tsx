import Link from "next/link";
import { prisma } from "@/lib/db";
import { FavoritesRecommendations } from "@/components/FavoritesRecommendations";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [labCount, workCount, uniCount] = await Promise.all([
    prisma.lab.count({ where: { deletedAt: null } }),
    prisma.work.count(),
    prisma.university.count(),
  ]);

  // サイト全体の構造化データ。SearchAction で Google のサイトリンク検索ボックス、
  // Organization でブランド情報を提示する。
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "ja",
        description:
          "日本の大学・研究機関の研究室を分野・大学・キーワードから検索できるサイト。",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/labs?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
    <section className="min-h-[calc(100vh-3rem)] px-6 py-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-4xl w-full mx-auto">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
            ラボマッチ
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
            大学・研究機関の研究室を、分野・キーワードから検索
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            進学先・研究室配属を考える学生のためのサイト
          </p>

          {/* CTA */}
          <div className="mb-10">
            <Link
              href="/labs"
              className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg shadow-md hover:shadow-lg transition-all"
            >
              研究室を検索する
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* お気に入りからのレコメンド — ファーストビュー直下の主役エリア。
            お気に入り 0 件のときはコンポーネント側で何も描画しない。 */}
        <FavoritesRecommendations
          variant="hero"
          limit={6}
          hideWhenEmpty
          heading="あなたへのおすすめ"
          subheading="お気に入りの研究室と共通タグ・同分野のラボから関連度順に表示しています。"
          showCount
          showFavoritesLink
          className="mb-10 p-5 bg-white/70 dark:bg-gray-900/60 border border-blue-200 dark:border-blue-900 rounded-lg shadow-sm"
        />

        {/* Stats — 横一列で簡潔 */}
        <div className="grid grid-cols-3 max-w-md mx-auto gap-2 mb-8 text-center">
          {[
            { value: labCount.toLocaleString(), label: "研究室" },
            { value: workCount.toLocaleString(), label: "論文" },
            { value: String(uniCount), label: "大学・機関" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {s.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features — 1 行アイコン付きで省スペース */}
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-sm">
          <li className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              分野・大学で絞り込み
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
              階層キーワード × 国公私 + 研究機関 × 8 地方の都道府県
            </p>
          </li>
          <li className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              お気に入りから推薦
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
              気になる研究室を★しておくと、傾向の近いラボを自動で表示
            </p>
          </li>
          <li className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              AI による研究内容の要約
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
              直近 5 年の論文を Claude が平易な日本語に再構成
            </p>
          </li>
        </ul>

        {/* MVP 注記 */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          MVP 開発中。情報は自動収集と AI 生成に基づくため誤りを含む可能性があります（
          <Link
            href="/about"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            このサイトについて
          </Link>
          ）。
        </p>
      </div>
    </section>
    </>
  );
}

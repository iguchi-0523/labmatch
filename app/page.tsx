import Link from "next/link";
import { prisma } from "@/lib/db";
import { FavoritesRecommendations } from "@/components/FavoritesRecommendations";
import { JsonLd } from "@/components/JsonLd";
import { getDict, type Locale } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// トップは 1 時間の ISR。表示するのは収録数の概算だけで、分単位の鮮度は要らない。
// cookie（locale）を読むのをやめたのでキャッシュ対象になる。表示言語の切り替えは
// LocaleProvider がクライアントで行う。
export const revalidate = 3600;

export default async function Home() {
  const [labCount, workCount, uniCount] = await Promise.all([
    prisma.lab.count({ where: { deletedAt: null } }),
    prisma.work.count(),
    prisma.university.count(),
  ]);
  const locale: Locale = "ja";
  const t = getDict(locale);

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
        alternateName: ["labmatch", "labmatch.jp", "ラボマッチ"],
        inLanguage: "ja",
        description:
          "日本の大学・研究機関の研究室を分野・大学・キーワードから検索できるサイト。",
        publisher: { "@id": `${SITE_URL}/#org` },
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
        alternateName: ["labmatch", "labmatch.jp"],
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
            {t.brand}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
            {t.homeTagline}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t.homeSubtitle}
          </p>

          {/* CTA */}
          <div className="mb-10">
            <Link
              href="/labs"
              className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg shadow-md hover:shadow-lg transition-all"
            >
              {t.homeCta}
              <span aria-hidden="true">→</span>
            </Link>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {locale === "ja" ? "一覧から探す:" : "Or browse:"}
              </span>
              <Link
                href="/universities"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === "ja" ? "大学" : "Universities"}
              </Link>
              <Link
                href="/fields"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === "ja" ? "分野" : "Fields"}
              </Link>
              <Link
                href="/areas"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === "ja" ? "地域" : "Regions"}
              </Link>
            </div>
          </div>
        </div>

        {/* お気に入りからのレコメンド — ファーストビュー直下の主役エリア。
            お気に入り 0 件のときはコンポーネント側で何も描画しない。 */}
        <FavoritesRecommendations
          variant="hero"
          limit={6}
          hideWhenEmpty
          heading={locale === "ja" ? "あなたへのおすすめ" : "Recommended for you"}
          subheading={
            locale === "ja"
              ? "お気に入りの研究室と共通タグ・同分野のラボから関連度順に表示しています。"
              : "Labs related to your favorites, ranked by shared tags and field."
          }
          showCount
          showFavoritesLink
          className="mb-10 p-5 bg-white/70 dark:bg-gray-900/60 border border-blue-200 dark:border-blue-900 rounded-lg shadow-sm"
        />

        {/* Stats — 横一列で簡潔 */}
        <div className="grid grid-cols-3 max-w-md mx-auto gap-2 mb-8 text-center">
          {[
            { value: labCount.toLocaleString(), label: t.statLabs },
            { value: workCount.toLocaleString(), label: t.statWorks },
            { value: String(uniCount), label: t.statUnis },
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
          {[
            { title: t.featSearchTitle, body: t.featSearchBody },
            { title: t.featRecoTitle, body: t.featRecoBody },
            { title: t.featAiTitle, body: t.featAiBody },
          ].map((f) => (
            <li
              key={f.title}
              className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                {f.title}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                {f.body}
              </p>
            </li>
          ))}
        </ul>

        {/* MVP 注記 */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          {t.homeMvpNote}
          <Link
            href="/about"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t.homeMvpNoteAbout}
          </Link>
          {t.homeMvpNoteEnd}
        </p>
      </div>
    </section>
    </>
  );
}

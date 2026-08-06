import Link from "next/link";
import { OPERATOR_NAME, SITE_NAME } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";
import { JaOnlyNotice } from "@/components/JaOnlyNotice";

export const metadata = {
  title: "利用規約",
  description: `${SITE_NAME}の利用条件、免責事項、掲載情報の削除依頼について。`,
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  // cookie を読むと CDN キャッシュ不可になるため日本語固定。切替は LocaleProvider。
  const locale: Locale = "ja";
  const t = getDict(locale);
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <nav className="mb-6 text-sm">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t.toTop}
        </Link>
      </nav>
      <JaOnlyNotice />
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        利用規約
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        最終更新: 2026年6月19日
      </p>

      <section className="mb-8">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          この規約は、{OPERATOR_NAME}が運営する{SITE_NAME}（以下「本サービス」）の利用条件を定めるものです。本サービスを使った時点で、この規約に同意したものとみなします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          サービスの内容
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          本サービスは、大学・研究機関の研究室を検索できる情報サイトです。研究室の紹介文・タグ・論文の和訳は、公開データ（OpenAlex・KAKEN
          ほか）をもとに AI で自動生成しています。個人による開発・運営で、現在は MVP（試作）段階です。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          免責事項
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            掲載情報には誤り・古い情報・AI 生成による不正確さが含まれることがあります。内容の正確性・完全性は保証しません。
          </li>
          <li>
            進学・問い合わせなどの判断は、各大学・研究室の公式情報で確認してください。本サービスの情報を使ったことで生じた損害について、運営者は責任を負いません。
          </li>
          <li>
            予告なくサービスの内容変更・中断・終了をすることがあります。
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          禁止事項
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            自動化ツールでの過度なアクセスなど、サーバーに負荷をかける行為
          </li>
          <li>本サービスのデータを無断で大量に複製・再配布する行為</li>
          <li>法令や公序良俗に反する行為</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          掲載情報の削除・修正
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          研究者名・所属などは公開情報に基づいて掲載しています。掲載の停止・修正を希望される場合は、各研究室ページの「削除・修正依頼」フォームからご連絡ください。確認のうえ対応します。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          著作権
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          論文のメタデータは OpenAlex（CC0）と KAKEN（CC
          BY）に由来します。AI
          要約は、公開されている論文要旨から事実情報を抽出して独自に再構成したものです。権利上の問題があると思われる箇所は、上記フォームからお知らせください。
        </p>
      </section>
    </main>
  );
}

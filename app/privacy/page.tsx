import Link from "next/link";
import { CONTACT_EMAIL, OPERATOR_NAME, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}が収集する情報と、その使い方・第三者提供・問い合わせ方法について。`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <nav className="mb-6 text-sm">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        プライバシーポリシー
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        最終更新: 2026年6月19日
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          収集する情報
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          {SITE_NAME}は、サービスの運営に必要な範囲で次の情報を扱います。
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            <span className="font-medium">アクセス情報：</span>
            ページの閲覧数、閲覧されたページ、おおよその地域、参照元、ブラウザの種類など。Vercel
            Analytics で集計しています。個人を特定する Cookie は使っていません。
          </li>
          <li>
            <span className="font-medium">削除・修正依頼フォームの入力内容：</span>
            依頼者のメールアドレスと依頼本文。掲載情報の確認・連絡のためだけに使います。
          </li>
          <li>
            <span className="font-medium">お気に入り：</span>
            研究室のお気に入りはお使いのブラウザ内（localStorage）に保存しています。サーバーへは送信していません。
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          情報の使い道
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>サービスの改善（よく見られるページの把握、不具合の発見）</li>
          <li>削除・修正依頼への対応と連絡</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
          アクセス情報から個人を特定することはありません。集めた情報を広告のための個人プロファイル作成に使うこともありません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          第三者への提供と外部サービス
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          取得した情報を本人の同意なく第三者へ売却・提供することはありません。ただし、サービスの運営に次の外部サービスを使っており、それぞれの規約に従って情報が処理されます。
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>ホスティングとアクセス解析：Vercel</li>
          <li>データベース：Railway（PostgreSQL）</li>
          <li>研究内容の要約・翻訳：Anthropic（Claude）</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
          将来、広告を掲載する場合は、広告事業者が Cookie
          等を用いることがあります。その際は本ポリシーを改定し、掲載前にこのページで告知します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          研究者情報の取り扱い
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          各研究室ページに載せている研究者名・所属・論文は、OpenAlex や
          KAKEN などの公開データに基づきます。掲載の停止や修正を希望される場合は、各研究室ページの「削除・修正依頼」フォームからご連絡ください。
          {OPERATOR_NAME}が確認のうえ対応します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          問い合わせ
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          掲載情報の削除・修正は、各研究室ページのフォームが一番早い窓口です。
          {CONTACT_EMAIL ? (
            <>
              {" "}
              その他のお問い合わせは{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              まで。
            </>
          ) : null}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          改定
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          内容を変更したときは、このページの最終更新日を改めます。大きな変更のときは、トップページなどでも知らせます。
        </p>
      </section>
    </main>
  );
}

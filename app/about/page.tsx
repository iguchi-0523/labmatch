import Link from "next/link";

export const metadata = {
  title: "このサイトについて",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-8">ラボマッチについて</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">目的</h2>
        <p className="text-gray-700 leading-relaxed">
          大学院進学や研究室配属を考える学生が、自分の興味分野に合う大学の研究室を効率よく発見・比較できる場を提供することを目指します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">対象範囲（現時点）</h2>
        <p className="text-gray-700 leading-relaxed">
          生命科学系の主要 9 大学：東京大学・京都大学・大阪大学・東北大学・名古屋大学・九州大学・北海道大学・早稲田大学・慶應義塾大学。
          今後、対象分野（理系全体 → 文系含む全分野）と対象大学を順次拡大します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">データソース</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            <a
              href="https://openalex.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenAlex
            </a>
            ：論文メタデータ（CC0）
          </li>
          <li>
            <a
              href="https://kaken.nii.ac.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              KAKEN
            </a>
            ：科研費課題（CC BY、出典明記の上で利用）
          </li>
          <li>論文タイトルの日本語訳：Claude（Anthropic）で自動翻訳</li>
          <li>研究室紹介文：Claude（Anthropic）で自動生成</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">注意事項</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            各研究室の紹介文は AI による自動生成のため、誤りや古い情報を含む可能性があります。最終的な判断は研究室の公式情報をご確認ください。
          </li>
          <li>
            論文タイトルの日本語訳も自動翻訳のため、専門用語の訳が不自然な場合があります。
          </li>
          <li>
            研究室の構成・連絡先は変動するため、進学・問い合わせ前に各大学のウェブサイトで最新情報をご確認ください。
          </li>
          <li>
            掲載されている個人情報（研究者名・所属）は公開情報ですが、修正・削除のご要望は運営者までお知らせください。
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">運営</h2>
        <p className="text-gray-700 leading-relaxed">
          個人による開発・運営です（MVP 開発中）。
        </p>
      </section>
    </main>
  );
}

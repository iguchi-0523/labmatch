import Link from "next/link";
import { getSiteStats } from "@/lib/stats";
import { getDict, type Locale } from "@/lib/i18n";
import { JaOnlyNotice } from "@/components/JaOnlyNotice";

export const metadata = {
  title: "このサイトについて",
  description:
    "ラボマッチの目的・対象範囲・データソース・よくある質問。OpenAlex と KAKEN を基に、大学と研究機関の研究室情報を AI 要約付きで提供しています。",
  alternates: { canonical: "/about" },
};

// 収録数を DB から動的に出すため 6 時間ごとに再生成（ingest cron と同周期）。
// これにより取り込みが進むたびに本文の数字が自動で最新化される。
export const revalidate = 21600;

export default async function AboutPage() {
  const stats = await getSiteStats();
  // cookie を読むと CDN キャッシュ不可になるため日本語固定。切替は LocaleProvider。
  const locale: Locale = "ja";
  const t = getDict(locale);
  const labApprox = Math.floor(stats.labCount / 100) * 100; // 「約 N 件」用に下 2 桁を丸める
  const workMan = (stats.workCount / 10000).toFixed(1); // 万件
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
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        ラボマッチについて
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          目的
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          大学院進学や研究室配属を考える学生が、自分の興味分野に合う研究室を効率よく発見・比較できる場を提供することを目指します。
          分野・大学・キーワード・お気に入り傾向で絞り込み、AI 要約で研究内容を平易な日本語で把握できます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          対象範囲（現時点）
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          現在 約 {labApprox.toLocaleString()} 研究室・{workMan} 万件の論文を収録しています（
          {stats.completedCount} 機関を取り込み済み）。当初予定していた機関の
          取り込みは一巡し、現在は定期取り込みを止めています。
          最終的には全国の主要大学と公的研究機関のカバーを目指しており、
          対象機関を広げる際に取り込みを再開します。
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            <span className="font-medium">対象機関：</span>
            国立 / 公立 / 私学の大学に加え、OIST・理化学研究所・産業技術総合研究所などの公的研究機関、および医科学研究所・University
            of Tokyo Hospital など 大学内の研究センター・附置研究所も含みます。
          </li>
          <li>
            <span className="font-medium">対象分野：</span>
            理系全分野（物理学 / 化学 / 生物学 / 医学・健康科学 / 工学 / 情報工学 / 数学 / 地球科学・環境 / 農学）。順次拡大予定。
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          主な機能
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            <span className="font-medium">階層キーワード検索：</span>
            学問分野→大領域→サブ領域→leaf
            の 4 階層ツリーから選択。上位を選べばその階層配下のラボがマッチします。
          </li>
          <li>
            <span className="font-medium">複数キーワードの AND / OR 切替：</span>
            「ゲノム編集」と「がん」のどちらも含むラボ、いずれかを含むラボを切替可能。
          </li>
          <li>
            <span className="font-medium">大学・研究機関の階層フィルタ：</span>
            国立／公立／私学／研究機関の区分で絞り込み。
            親大学を選ぶと配下の研究センターも含み、研究センター単独を選ぶと親大学の他のラボは含みません。
          </li>
          <li>
            <span className="font-medium">お気に入り＆おすすめ順：</span>
            研究室を★で保存すると、共通タグ・同分野のラボを関連度順に表示します。
            並び替え「お気に入りからのおすすめ順」も利用可。
          </li>
          <li>
            <span className="font-medium">AI 要約：</span>
            直近 5 年の論文要旨を Claude
            が事実情報として再構成し、研究内容を 200〜400 字程度で要約します。
          </li>
          <li>
            <span className="font-medium">外部リンク：</span>
            researchmap / NRID（KAKEN 研究者）/ 日本の研究.com / Google
            Scholar / OpenAlex / ORCID へワンクリック。
          </li>
          <li>
            <span className="font-medium">ライト / ダーク表示：</span>
            ページ下部のトグルで自動 / 明 / 暗を選択可能。
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          データソース
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            <a
              href="https://openalex.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              OpenAlex
            </a>
            ：研究者・論文メタデータ（CC0）
          </li>
          <li>
            <a
              href="https://kaken.nii.ac.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              KAKEN
            </a>
            ：科研費課題（CC BY、出典明記の上で利用）
          </li>
          <li>論文タイトルの日本語訳：Claude（Anthropic）で自動翻訳</li>
          <li>研究室紹介文の AI 要約：Claude（Anthropic）で事実情報を再構成</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          よくある質問（Q&amp;A）
        </h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. 自分の研究室が表示されていません。なぜ？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              現在は段階的に取り込んでいるため、まだ ingest 対象になっていない大学・機関の研究室はヒットしません。
              また、ヒットの条件として「OpenAlex で works_count ≥ 5、h-index ≥ 3」を最低基準にしているため、論文公開が少ないラボは除外されることがあります。
              修正・追加依頼は各ラボページの「削除・修正依頼」フォームからお寄せください。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. 研究センター（医科学研究所 / CiRA など）はどう扱われていますか？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              OpenAlex 上で大学の lineage 配下として登録されている研究センターは、独立した「研究機関」として表示しつつ、親大学で検索しても配下のラボが含まれるようにしています。
              例：「東京大学」で検索すると University of Tokyo
              Hospital のラボも含みます。「University of Tokyo Hospital」だけを選ぶと、その配下のラボに限定されます。
              なお、OpenAlex に独立 institution として登録されていない学内研究所（一部の附置研究所）は、現状は親大学の中に含めて表示しています。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. 複数の大学に所属している先生はどう表示されますか？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              研究者ごとに 1 つのラボページにまとめ、ヘッダーに主所属と「兼任：◯◯／△△」のかたちで他の所属を並列に表示しています。
              どちらの大学から検索しても同じラボページにたどり着けるよう、所属の M:N
              関係で管理しています。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. AI 要約はどこまで信用できますか？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              要約は直近 5 年で OpenAlex に abstract が公開されている論文のみを対象に、Claude
              で事実情報を再構成しています。原文の語句や構成を踏襲せず、研究の問い・手法・主要な発見を独自表現で簡潔にまとめる方針です。
              ただし AI 生成のため誤りや時代遅れの情報が含まれる可能性があります。最終的な判断は研究室の公式情報でご確認ください。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. お気に入りはどこに保存されますか？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              お使いのブラウザの localStorage に保存しています（サーバーへは送信していません）。
              そのためブラウザのキャッシュをクリアしたり別の端末を使ったりすると見えなくなります。アカウント連携は現時点では未実装です。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. データの更新頻度はどれくらいですか？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              予定していた機関のカバーが一段落したため、現在は定期更新を止めています。
              対象機関を広げるときや、論文・タグ・AI 要約をまとめて更新するときに再開します。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Q. 掲載情報の削除・修正をお願いしたい場合は？
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              各ラボページの下部にある「削除・修正依頼」フォームからご連絡ください。
              大学公式ドメインメールアドレス（<code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">*.ac.jp</code>）からの依頼を優先処理しています。
              72 時間以内に一次返信します。
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          注意事項
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            各研究室の紹介文・タグは AI による自動生成のため、誤りや古い情報を含む可能性があります。
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
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          運営
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          個人による開発・運営です（MVP 開発中）。広告・アフィリエイト等の収益化は将来検討予定です。
        </p>
      </section>
    </main>
  );
}

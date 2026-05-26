import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [labCount, workCount, uniCount] = await Promise.all([
    prisma.lab.count({ where: { deletedAt: null } }),
    prisma.work.count(),
    prisma.university.count(),
  ]);

  return (
    <section className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-6 py-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
          ラボマッチ
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
          大学の研究室を、分野・大学・キーワードから検索
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          進学先・研究室配属を考える学生のためのサイト
        </p>

        {/* CTA — 一画面の中心、ファーストビューから即クリック可能 */}
        <div className="mb-10">
          <Link
            href="/labs"
            className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg shadow-md hover:shadow-lg transition-all"
          >
            研究室を検索する
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Stats — 横一列で簡潔 */}
        <div className="grid grid-cols-3 max-w-md mx-auto gap-2 mb-8">
          {[
            { value: labCount.toLocaleString(), label: "研究室" },
            { value: workCount.toLocaleString(), label: "論文" },
            { value: String(uniCount), label: "大学" },
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
              階層キーワード × 国公私の大学区分 × 8 地方の都道府県
            </p>
          </li>
          <li className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              AI による要約
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
              直近 5 年の論文を Claude が平易な日本語に再構成
            </p>
          </li>
          <li className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              外部リンクで深掘り
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
              researchmap / NRID / Google Scholar / ORCID へワンクリック
            </p>
          </li>
        </ul>

        {/* MVP 注記 — 1 行で控えめに */}
        <p className="text-xs text-gray-500 dark:text-gray-500">
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
  );
}

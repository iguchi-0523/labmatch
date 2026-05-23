import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const QUICK_KEYWORDS = ["細胞", "遺伝子", "がん", "神経", "免疫", "ゲノム"];

export default async function Home() {
  const [labCount, workCount, uniCount] = await Promise.all([
    prisma.lab.count(),
    prisma.work.count(),
    prisma.university.count(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">ラボマッチ</h1>
          <p className="text-lg text-gray-700 mb-2">
            大学の研究室を、分野・大学・キーワードから簡単に検索。
          </p>
          <p className="text-sm text-gray-500 mb-8">
            進学先・研究室配属を考える学生のためのサイト
          </p>

          <form
            action="/labs"
            method="get"
            className="max-w-xl mx-auto flex gap-2"
          >
            <input
              type="text"
              name="q"
              placeholder="キーワード（例: 細胞、神経、ゲノム...）"
              className="flex-1 px-4 py-3 border rounded text-base bg-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              検索
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {QUICK_KEYWORDS.map((kw) => (
              <Link
                key={kw}
                href={`/labs?q=${encodeURIComponent(kw)}`}
                className="text-sm px-3 py-1 bg-white border rounded-full hover:bg-blue-50 hover:border-blue-300 text-gray-700"
              >
                {kw}
              </Link>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-3 max-w-md mx-auto gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{labCount}</div>
              <div className="text-xs text-gray-500">研究室</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {workCount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">論文</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{uniCount}</div>
              <div className="text-xs text-gray-500">大学</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">できること</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 border rounded">
            <h3 className="font-semibold mb-2">分野・大学で絞り込み</h3>
            <p className="text-sm text-gray-600">
              生命科学の 5 分野と 9 大学（旧帝大 + 早慶）から、興味のある研究室を見つけられます。
            </p>
          </div>
          <div className="p-5 border rounded">
            <h3 className="font-semibold mb-2">AI による要約</h3>
            <p className="text-sm text-gray-600">
              直近 5 年の論文から、各研究室の研究内容を AI が平易な日本語でまとめます。
            </p>
          </div>
          <div className="p-5 border rounded">
            <h3 className="font-semibold mb-2">外部データへ即アクセス</h3>
            <p className="text-sm text-gray-600">
              researchmap・KAKEN・OpenAlex など、各研究室の公式情報源にすぐ移動できます。
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/labs"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
          >
            研究室を検索する →
          </Link>
        </div>
      </section>

      {/* MVP notice */}
      <section className="bg-yellow-50 border-y border-yellow-200">
        <div className="max-w-4xl mx-auto px-6 py-6 text-sm text-gray-700">
          <p className="font-semibold mb-1">MVP 開発中</p>
          <p>
            現在は生命科学系の主要 9 大学（旧帝大 + 早慶）から約 80 研究室を収録しています。今後、対象分野・対象大学を順次拡大していきます。各情報は自動収集と AI 要約に基づくため、誤りを含む可能性があります（詳しくは{" "}
            <Link href="/about" className="text-blue-600 hover:underline">
              このサイトについて
            </Link>
            ）。
          </p>
        </div>
      </section>
    </>
  );
}

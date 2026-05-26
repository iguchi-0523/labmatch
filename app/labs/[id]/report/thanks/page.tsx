import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "ご依頼を受け付けました",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportThanksPage({ params }: PageProps) {
  const { id } = await params;
  const labId = Number(id);
  if (Number.isNaN(labId)) notFound();

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <nav className="mb-4 text-sm space-x-2">
        <Link href="/" className="text-blue-600 hover:underline">
          トップ
        </Link>
        <span className="text-gray-400">/</span>
        <Link href="/labs" className="text-blue-600 hover:underline">
          研究室一覧
        </Link>
      </nav>

      <header className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold mb-2">
          ご依頼を受け付けました
        </h1>
      </header>

      <div className="p-5 bg-green-50 border border-green-200 rounded text-sm text-gray-800 space-y-3">
        <p>
          ご連絡ありがとうございました。内容を確認のうえ、
          <span className="font-medium">原則 72 時間以内に一次返信</span>
          をお送りします。
        </p>
        <p>
          確認の結果、以下のいずれかの対応となります：
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 pl-2">
          <li>削除：掲載を取り下げます（論理削除）。</li>
          <li>訂正：該当箇所を修正します。</li>
          <li>
            掲載継続：公開情報に基づく適正な掲載と判断した場合は、理由を添えてご連絡します。
          </li>
        </ul>
      </div>

      <div className="mt-6 flex gap-3 text-sm">
        <Link
          href={`/labs/${labId}`}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          研究室ページへ戻る
        </Link>
        <Link
          href="/labs"
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          検索に戻る
        </Link>
      </div>
    </main>
  );
}

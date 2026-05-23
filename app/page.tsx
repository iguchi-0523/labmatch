import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">ラボマッチ</h1>
      <p className="mb-2 text-gray-700">
        分野・大学・所属学会から、大学の研究室を簡単に検索できるサイト。
      </p>
      <p className="mb-8 text-sm text-gray-500">
        現在 MVP 開発中（生命科学系から段階拡大）。
      </p>
      <Link
        href="/labs"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        研究室一覧を見る →
      </Link>
    </main>
  );
}

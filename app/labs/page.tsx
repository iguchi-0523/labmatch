import Link from "next/link";
import { prisma } from "@/lib/db";

// MVP では毎リクエスト DB から取得（あとで ISR に切り替え可能）
export const dynamic = "force-dynamic";

export default async function LabsPage() {
  const labs = await prisma.lab.findMany({
    include: {
      university: true,
      _count: { select: { works: true } },
    },
    orderBy: { professorName: "asc" },
  });

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-6">研究室一覧</h1>

      {labs.length === 0 ? (
        <p className="text-gray-600">まだ研究室データがありません。</p>
      ) : (
        <ul className="space-y-3">
          {labs.map((lab) => (
            <li key={lab.id}>
              <Link
                href={`/labs/${lab.id}`}
                className="block p-4 border rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-semibold">{lab.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {lab.professorName}・{lab.university.name}
                  {lab.department ? `（${lab.department}）` : ""}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  論文 {lab._count.works} 件
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

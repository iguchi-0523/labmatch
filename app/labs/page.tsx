import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { value: "works", label: "論文数（多い順）" },
  { value: "name", label: "名前順" },
  { value: "new", label: "新着順" },
] as const;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    u?: string | string[];
    p?: string;
    sort?: string;
  }>;
}

function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (v === undefined) return [];
  return [v];
}

export default async function LabsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const universityIds = asArray(params.u)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
  const prefecture = params.p?.trim() ?? "";
  const sort = params.sort ?? "works";

  // WHERE 句を組み立て
  const conditions: Prisma.LabWhereInput[] = [];
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { professorName: { contains: q, mode: "insensitive" } },
        { works: { some: { title: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (universityIds.length > 0) {
    conditions.push({ universityId: { in: universityIds } });
  }
  if (prefecture) {
    conditions.push({ university: { prefecture } });
  }
  const where: Prisma.LabWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  // ORDER BY
  const orderBy: Prisma.LabOrderByWithRelationInput =
    sort === "name"
      ? { professorName: "asc" }
      : sort === "new"
        ? { createdAt: "desc" }
        : { works: { _count: "desc" } };

  // 結果＋ファセット用のマスタを並行取得
  const [matchCount, totalCount, labs, universities, prefectureRows] =
    await Promise.all([
      prisma.lab.count({ where }),
      prisma.lab.count(),
      prisma.lab.findMany({
        where,
        include: {
          university: true,
          _count: { select: { works: true } },
        },
        orderBy,
        take: 100,
      }),
      prisma.university.findMany({ orderBy: { name: "asc" } }),
      prisma.university.findMany({
        where: { prefecture: { not: null } },
        distinct: ["prefecture"],
        select: { prefecture: true },
        orderBy: { prefecture: "asc" },
      }),
    ]);

  const hasFilters =
    q !== "" || universityIds.length > 0 || prefecture !== "";

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-6">研究室検索</h1>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* サイドバー：絞り込み */}
        <aside>
          <form
            method="get"
            action="/labs"
            className="space-y-5 p-4 bg-gray-50 rounded border"
          >
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="q-input"
              >
                キーワード
              </label>
              <input
                id="q-input"
                type="text"
                name="q"
                defaultValue={q}
                placeholder="例: 細胞、神経、ゲノム..."
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                研究室名・主宰者・論文タイトルを対象に検索
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium mb-2">大学</legend>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {universities.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="u"
                      value={u.id}
                      defaultChecked={universityIds.includes(u.id)}
                      className="mr-2"
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-2">都道府県</legend>
              <select
                name="p"
                defaultValue={prefecture}
                className="w-full px-3 py-1.5 border rounded text-sm bg-white"
              >
                <option value="">すべて</option>
                {prefectureRows.map((r) => (
                  <option key={r.prefecture} value={r.prefecture ?? ""}>
                    {r.prefecture}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-2">並び替え</legend>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full px-3 py-1.5 border rounded text-sm bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                絞り込む
              </button>
              <Link
                href="/labs"
                className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-100"
              >
                リセット
              </Link>
            </div>
          </form>
        </aside>

        {/* 結果 */}
        <section>
          <div className="mb-4 text-sm text-gray-600">
            {hasFilters ? (
              <>
                <span className="font-semibold text-gray-900">
                  {matchCount}
                </span>{" "}
                件ヒット（全 {totalCount} 件中）
              </>
            ) : (
              <>
                全{" "}
                <span className="font-semibold text-gray-900">
                  {totalCount}
                </span>{" "}
                件
              </>
            )}
            {labs.length < matchCount && <> — 上位 {labs.length} 件を表示</>}
          </div>

          {labs.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">
              該当する研究室がありません。条件を変えてみてください。
            </p>
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
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { value: "works", label: "論文数（多い順）" },
  { value: "name", label: "名前順" },
  { value: "new", label: "新着順" },
] as const;

// OpenAlex の field id (ASJC ベース) → 日本語ラベル
const FIELD_OPTIONS = [
  { code: "11", label: "農学・生物科学" },
  { code: "13", label: "生化学・分子生物学・遺伝学" },
  { code: "24", label: "免疫学・微生物学" },
  { code: "28", label: "神経科学" },
  { code: "30", label: "薬学・薬理学" },
] as const;

const FIELD_LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  FIELD_OPTIONS.map((f) => [f.code, f.label]),
);

const MIN_WORKS_OPTIONS = [
  { value: "0", label: "指定なし" },
  { value: "5", label: "5 件以上" },
  { value: "10", label: "10 件以上" },
  { value: "15", label: "15 件以上" },
  { value: "20", label: "20 件以上" },
] as const;

// 検索上位の日本語キーワード（ワンクリックで絞り込めるショートカット）
const POPULAR_KEYWORDS = [
  "細胞", "遺伝子", "がん", "マウス", "神経", "タンパク質",
  "免疫", "脳", "腫瘍", "受容体", "ゲノム", "幹細胞",
];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    u?: string | string[];
    p?: string;
    sort?: string;
    f?: string | string[];
    min?: string;
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
  const fieldCodes = asArray(params.f).filter((c) => /^\d+$/.test(c));
  const minWorks = Math.max(0, Number(params.min) || 0);

  // 人気キーワードのチップ用 — 現在の絞り込み（q 以外）を保ったまま q を入れ替える
  const chipHref = (kw: string) => {
    const u = new URLSearchParams();
    for (const id of universityIds) u.append("u", String(id));
    if (prefecture) u.set("p", prefecture);
    for (const code of fieldCodes) u.append("f", code);
    if (minWorks > 0) u.set("min", String(minWorks));
    if (sort !== "works") u.set("sort", sort);
    u.set("q", kw);
    return `/labs?${u.toString()}`;
  };

  // WHERE 句を組み立て
  const conditions: Prisma.LabWhereInput[] = [];
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { professorName: { contains: q, mode: "insensitive" } },
        { aiSummary: { contains: q, mode: "insensitive" } },
        {
          works: {
            some: {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { titleJa: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }
  if (universityIds.length > 0) {
    conditions.push({ universityId: { in: universityIds } });
  }
  if (prefecture) {
    conditions.push({ university: { prefecture } });
  }
  if (fieldCodes.length > 0) {
    conditions.push({ primaryFieldCode: { in: fieldCodes } });
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

  // 全件フェッチ → 論文数で post-filter
  // （Prisma で count フィルタは複雑なので、現状件数なら全件取って絞る方が単純）
  const [totalCount, allMatches, universities, prefectureRows] =
    await Promise.all([
      prisma.lab.count(),
      prisma.lab.findMany({
        where,
        include: {
          university: true,
          _count: { select: { works: true } },
        },
        orderBy,
        take: 200, // 全件は取らない（パフォーマンス対策）。MVP規模では実質全件。
      }),
      prisma.university.findMany({ orderBy: { name: "asc" } }),
      prisma.university.findMany({
        where: { prefecture: { not: null } },
        distinct: ["prefecture"],
        select: { prefecture: true },
        orderBy: { prefecture: "asc" },
      }),
    ]);

  const filtered =
    minWorks > 0
      ? allMatches.filter((l) => l._count.works >= minWorks)
      : allMatches;
  const matchCount = filtered.length;
  const labs = filtered.slice(0, 100);

  const hasFilters =
    q !== "" ||
    universityIds.length > 0 ||
    prefecture !== "" ||
    fieldCodes.length > 0 ||
    minWorks > 0;

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
                研究室名・主宰者・AI要約・論文タイトル（日本語/英語）を対象
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {POPULAR_KEYWORDS.map((kw) => (
                  <Link
                    key={kw}
                    href={chipHref(kw)}
                    className={
                      q === kw
                        ? "text-xs px-2 py-0.5 bg-blue-600 text-white rounded"
                        : "text-xs px-2 py-0.5 bg-white border rounded text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                    }
                  >
                    {kw}
                  </Link>
                ))}
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium mb-2">分野</legend>
              <div className="space-y-1">
                {FIELD_OPTIONS.map((f) => (
                  <label
                    key={f.code}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="f"
                      value={f.code}
                      defaultChecked={fieldCodes.includes(f.code)}
                      className="mr-2"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </fieldset>

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
              <legend className="text-sm font-medium mb-2">
                論文数（下限）
              </legend>
              <select
                name="min"
                defaultValue={String(minWorks)}
                className="w-full px-3 py-1.5 border rounded text-sm bg-white"
              >
                {MIN_WORKS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
              {labs.map((lab) => {
                const fieldJp = lab.primaryFieldCode
                  ? (FIELD_LABEL_BY_CODE[lab.primaryFieldCode] ??
                    lab.primaryFieldName)
                  : null;
                return (
                  <li key={lab.id}>
                    <Link
                      href={`/labs/${lab.id}`}
                      className="block p-4 border rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold">{lab.name}</div>
                        {fieldJp && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded whitespace-nowrap shrink-0">
                            {fieldJp}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {lab.professorName}・{lab.university.name}
                        {lab.department ? `（${lab.department}）` : ""}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        論文 {lab._count.works} 件
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "研究室を検索",
};

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

// テーマ別キーワードツリー
const KEYWORD_GROUPS: { label: string; keywords: string[] }[] = [
  {
    label: "細胞・分子",
    keywords: [
      "細胞", "遺伝子", "タンパク質", "DNA", "RNA",
      "ゲノム", "受容体", "キナーゼ", "ミトコンドリア",
    ],
  },
  {
    label: "神経科学",
    keywords: ["神経", "脳", "シナプス"],
  },
  {
    label: "医学・疾患",
    keywords: [
      "がん", "腫瘍", "免疫", "抗体",
      "アルツハイマー", "パーキンソン", "糖尿病",
    ],
  },
  {
    label: "発生・モデル生物",
    keywords: ["発生", "幹細胞", "アポトーシス", "マウス"],
  },
  {
    label: "技術",
    keywords: ["CRISPR"],
  },
];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    kw?: string | string[];
    mode?: string;
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

function buildKeywordCondition(kw: string): Prisma.LabWhereInput {
  return {
    OR: [
      { name: { contains: kw, mode: "insensitive" } },
      { professorName: { contains: kw, mode: "insensitive" } },
      { aiSummary: { contains: kw, mode: "insensitive" } },
      {
        works: {
          some: {
            OR: [
              { title: { contains: kw, mode: "insensitive" } },
              { titleJa: { contains: kw, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

export default async function LabsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qInput = params.q?.trim() ?? "";
  const kwParams = asArray(params.kw)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  const selectedKeywords = Array.from(
    new Set(qInput ? [...kwParams, qInput] : kwParams),
  );
  const mode = params.mode === "or" ? "or" : "and";
  const universityIds = asArray(params.u)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
  const prefecture = params.p?.trim() ?? "";
  const sort = params.sort ?? "works";
  const fieldCodes = asArray(params.f).filter((c) => /^\d+$/.test(c));
  const minWorks = Math.max(0, Number(params.min) || 0);

  const toggleKeywordHref = (kw: string) => {
    const u = new URLSearchParams();
    for (const id of universityIds) u.append("u", String(id));
    if (prefecture) u.set("p", prefecture);
    for (const code of fieldCodes) u.append("f", code);
    if (minWorks > 0) u.set("min", String(minWorks));
    if (sort !== "works") u.set("sort", sort);
    if (mode !== "and") u.set("mode", mode);

    const isSelected = selectedKeywords.includes(kw);
    const next = isSelected
      ? selectedKeywords.filter((k) => k !== kw)
      : [...selectedKeywords, kw];
    for (const k of next) u.append("kw", k);
    return `/labs?${u.toString()}`;
  };

  const conditions: Prisma.LabWhereInput[] = [];
  if (selectedKeywords.length > 0) {
    const keywordConditions = selectedKeywords.map(buildKeywordCondition);
    if (mode === "and") {
      conditions.push(...keywordConditions);
    } else {
      conditions.push({ OR: keywordConditions });
    }
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

  const orderBy: Prisma.LabOrderByWithRelationInput =
    sort === "name"
      ? { professorName: "asc" }
      : sort === "new"
        ? { createdAt: "desc" }
        : { works: { _count: "desc" } };

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
        take: 200,
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
    selectedKeywords.length > 0 ||
    universityIds.length > 0 ||
    prefecture !== "" ||
    fieldCodes.length > 0 ||
    minWorks > 0;

  // Tailwind の動的クラスは効かないので、明示的にスタイルを切り替える
  const chipBase =
    "inline-block text-sm leading-none px-2.5 py-1.5 rounded-full transition-colors";
  const chipUnselected =
    "bg-white border border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400";
  const chipSelected =
    "bg-blue-600 border border-blue-600 text-white hover:bg-blue-700";

  return (
    <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-2 text-gray-900">研究室検索</h1>
      <p className="text-sm text-gray-600 mb-8">
        キーワード・分野・大学などで絞り込み。複数キーワードは AND / OR で組合せ可。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
        {/* サイドバー：絞り込み */}
        <aside>
          <form
            method="get"
            action="/labs"
            className="space-y-6 p-5 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* キーワード入力 */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-2"
                htmlFor="q-input"
              >
                キーワード検索
              </label>
              <input
                id="q-input"
                type="text"
                name="q"
                defaultValue=""
                placeholder="例: ゲノム編集"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                研究室名・主宰者・AI 要約・論文タイトル（日本語/英語）を対象。
                入力して「絞り込む」で追加されます。
              </p>

              {/* 選択中のキーワード */}
              {selectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-xs text-blue-900 self-center mr-1 font-medium">
                    選択中（{selectedKeywords.length}件）:
                  </span>
                  {selectedKeywords.map((kw) => (
                    <Link
                      key={kw}
                      href={toggleKeywordHref(kw)}
                      className="text-xs px-2 py-0.5 bg-white border border-blue-300 rounded text-blue-900 hover:bg-blue-100 inline-flex items-center gap-1"
                      title="クリックで削除"
                    >
                      {kw} <span className="text-blue-500">×</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* AND / OR */}
              {selectedKeywords.length >= 2 && (
                <fieldset className="mt-3">
                  <legend className="text-xs text-gray-600 mb-1">
                    複数キーワードの組合せ
                  </legend>
                  <div className="flex gap-3 text-sm">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value="and"
                        defaultChecked={mode === "and"}
                        className="mr-1"
                      />
                      AND（すべて含む）
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value="or"
                        defaultChecked={mode === "or"}
                        className="mr-1"
                      />
                      OR（いずれか）
                    </label>
                  </div>
                </fieldset>
              )}

              {/* 既存の kw を hidden で持ち越し */}
              {selectedKeywords
                .filter((k) => k !== qInput)
                .map((k) => (
                  <input key={k} type="hidden" name="kw" value={k} />
                ))}
            </div>

            {/* キーワードツリー */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                よく検索されるキーワード
              </h3>
              <div className="space-y-1.5">
                {KEYWORD_GROUPS.map((group) => (
                  <details
                    key={group.label}
                    open
                    className="group bg-white border border-gray-200 rounded"
                  >
                    <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center justify-between">
                      <span>{group.label}</span>
                      <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                        ▶
                      </span>
                    </summary>
                    <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1 border-t border-gray-100">
                      {group.keywords.map((kw) => {
                        const selected = selectedKeywords.includes(kw);
                        return (
                          <Link
                            key={kw}
                            href={toggleKeywordHref(kw)}
                            className={`${chipBase} ${
                              selected ? chipSelected : chipUnselected
                            }`}
                          >
                            {kw}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* 分野 */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 mb-2 flex items-center justify-between">
                <span>分野</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <div className="space-y-1.5 mt-2 pl-1">
                {FIELD_OPTIONS.map((f) => (
                  <label
                    key={f.code}
                    className="flex items-center text-sm cursor-pointer text-gray-800"
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
            </details>

            {/* 大学 */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 mb-2 flex items-center justify-between">
                <span>大学</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <div className="space-y-1.5 mt-2 pl-1 max-h-64 overflow-y-auto">
                {universities.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center text-sm cursor-pointer text-gray-800"
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
            </details>

            {/* 都道府県・件数・並び替え */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 mb-2 flex items-center justify-between">
                <span>その他の条件</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <div className="space-y-3 mt-2 pl-1">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    都道府県
                  </label>
                  <select
                    name="p"
                    defaultValue={prefecture}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                  >
                    <option value="">すべて</option>
                    {prefectureRows.map((r) => (
                      <option key={r.prefecture} value={r.prefecture ?? ""}>
                        {r.prefecture}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    論文数（下限）
                  </label>
                  <select
                    name="min"
                    defaultValue={String(minWorks)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                  >
                    {MIN_WORKS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    並び替え
                  </label>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </details>

            {/* ボタン */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
              >
                絞り込む
              </button>
              <Link
                href="/labs"
                className="px-3 py-2.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100"
              >
                リセット
              </Link>
            </div>
          </form>
        </aside>

        {/* 結果 */}
        <section>
          <div className="mb-4 text-sm text-gray-700 flex items-baseline gap-2">
            {hasFilters ? (
              <>
                <span className="font-semibold text-lg text-gray-900">
                  {matchCount}
                </span>
                <span>件ヒット（全 {totalCount} 件中）</span>
                {selectedKeywords.length >= 2 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                    {mode === "and" ? "AND" : "OR"}
                  </span>
                )}
              </>
            ) : (
              <>
                <span>全</span>
                <span className="font-semibold text-lg text-gray-900">
                  {totalCount}
                </span>
                <span>件</span>
              </>
            )}
            {labs.length < matchCount && (
              <span className="text-xs text-gray-500 ml-auto">
                上位 {labs.length} 件を表示
              </span>
            )}
          </div>

          {labs.length === 0 ? (
            <p className="text-gray-500 py-12 text-center bg-gray-50 rounded border border-gray-200">
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
                      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-base text-gray-900 leading-snug">
                            {lab.name}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">
                              {lab.professorName}
                            </span>
                            <span className="text-gray-400 mx-1.5">/</span>
                            <span>{lab.university.name}</span>
                            {lab.department && (
                              <span className="text-gray-500">
                                （{lab.department}）
                              </span>
                            )}
                          </div>
                        </div>
                        {fieldJp && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded whitespace-nowrap shrink-0 border border-blue-200">
                            {fieldJp}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <span>論文 {lab._count.works} 件</span>
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

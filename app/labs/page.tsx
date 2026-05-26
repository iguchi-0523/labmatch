import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FavoritesFilter } from "@/components/FavoritesFilter";
import { KeywordModeToggle } from "@/components/KeywordModeToggle";
import { KeywordTreeFilter } from "@/components/KeywordTreeFilter";
import { PrefectureTreeFilter } from "@/components/PrefectureTreeFilter";
import { TagChip } from "@/components/TagChip";
import { UniversityTreeFilter } from "@/components/UniversityTreeFilter";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "研究室を検索",
};

const SORT_OPTIONS = [
  { value: "works", label: "論文数（多い順）" },
  { value: "name", label: "名前順" },
  { value: "new", label: "新着順" },
] as const;

const MIN_WORKS_OPTIONS = [
  { value: "0", label: "指定なし" },
  { value: "5", label: "5 件以上" },
  { value: "10", label: "10 件以上" },
  { value: "15", label: "15 件以上" },
  { value: "20", label: "20 件以上" },
] as const;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    kw?: string | string[];
    mode?: string;
    u?: string | string[];
    p?: string | string[];
    sort?: string;
    f?: string | string[];
    min?: string;
    fav?: string;
    favIds?: string | string[];
    page?: string;
  }>;
}

const PER_PAGE = 50;

function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (v === undefined) return [];
  return [v];
}

/**
 * ページネーション用の表示ページ番号リストを生成。
 * 例: current=6, total=50 → [1, "gap", 4, 5, 6, 7, 8, "gap", 50]
 */
function buildPageList(
  current: number,
  total: number,
  windowSize: number = 2,
): (number | "gap")[] {
  if (total <= 1) return [];
  const pages = new Set<number>([1, total]);
  for (let i = current - windowSize; i <= current + windowSize; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("gap");
    result.push(sorted[i]);
  }
  return result;
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
  const prefectures = asArray(params.p)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sort = params.sort ?? "works";
  const fieldCodes = asArray(params.f).filter((c) => /^\d+$/.test(c));
  const minWorks = Math.max(0, Number(params.min) || 0);
  const onlyFavorites = params.fav === "1";
  const favIds = onlyFavorites
    ? asArray(params.favIds)
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0)
        .slice(0, 200)
    : [];
  const currentPage = Math.max(1, Number(params.page) || 1);

  // 現状の filter 状態を URL パラメータに復元するヘルパー
  // pageOverride を渡せば page だけ差し替えたリンクが作れる
  const buildFilterParams = (opts: {
    keywords?: string[];
    page?: number;
  } = {}): URLSearchParams => {
    const u = new URLSearchParams();
    const kws = opts.keywords ?? selectedKeywords;
    for (const k of kws) u.append("kw", k);
    if (mode !== "and") u.set("mode", mode);
    for (const id of universityIds) u.append("u", String(id));
    for (const p of prefectures) u.append("p", p);
    for (const code of fieldCodes) u.append("f", code);
    if (minWorks > 0) u.set("min", String(minWorks));
    if (sort !== "works") u.set("sort", sort);
    if (onlyFavorites) {
      u.set("fav", "1");
      for (const id of favIds) u.append("favIds", String(id));
    }
    const pageTo = opts.page ?? currentPage;
    if (pageTo > 1) u.set("page", String(pageTo));
    return u;
  };

  const pageHref = (target: number): string =>
    `/labs?${buildFilterParams({ page: target }).toString()}`;

  const toggleKeywordHref = (kw: string) => {
    const isSelected = selectedKeywords.includes(kw);
    const next = isSelected
      ? selectedKeywords.filter((k) => k !== kw)
      : [...selectedKeywords, kw];
    // キーワード切替はページを 1 に戻す
    return `/labs?${buildFilterParams({ keywords: next, page: 1 }).toString()}`;
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
  if (prefectures.length > 0) {
    conditions.push({ university: { prefecture: { in: prefectures } } });
  }
  if (fieldCodes.length > 0) {
    conditions.push({ primaryFieldCode: { in: fieldCodes } });
  }
  if (onlyFavorites) {
    // お気に入り 0 件で fav=1 が来た場合は何も該当しない
    conditions.push({ id: favIds.length > 0 ? { in: favIds } : { in: [-1] } });
  }
  conditions.push({ deletedAt: null });
  const where: Prisma.LabWhereInput = { AND: conditions };

  const orderBy: Prisma.LabOrderByWithRelationInput =
    sort === "name"
      ? { professorName: "asc" }
      : sort === "new"
        ? { createdAt: "desc" }
        : { works: { _count: "desc" } };

  const skip = (currentPage - 1) * PER_PAGE;
  const [totalCount, matchingCount, pageMatches, universities] =
    await Promise.all([
      prisma.lab.count({ where: { deletedAt: null } }),
      prisma.lab.count({ where }),
      prisma.lab.findMany({
        where,
        include: {
          university: true,
          _count: { select: { works: true } },
        },
        orderBy,
        take: PER_PAGE,
        skip,
      }),
      prisma.university.findMany({ orderBy: { name: "asc" } }),
    ]);

  // minWorks は Prisma で直接フィルタできないので取得後にページ内除外
  // （結果としてページ内表示数が 50 未満になることがあるが、件数表示にその旨を補足）
  // tags は ingest/backfill 時に事前計算済み（Lab.tags 列）を読むだけ
  const labs =
    minWorks > 0
      ? pageMatches.filter((l) => l._count.works >= minWorks)
      : pageMatches;
  const matchCount = matchingCount;
  const totalPages = Math.max(1, Math.ceil(matchingCount / PER_PAGE));
  const pageStart = (currentPage - 1) * PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * PER_PAGE, matchingCount);
  const minWorksExcludedOnPage = pageMatches.length - labs.length;

  const hasFilters =
    selectedKeywords.length > 0 ||
    universityIds.length > 0 ||
    prefectures.length > 0 ||
    fieldCodes.length > 0 ||
    minWorks > 0 ||
    onlyFavorites;

  return (
    <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">研究室検索</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        キーワード・分野・大学などで絞り込み。複数キーワードは AND / OR で組合せ可。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
        {/* サイドバー：絞り込み */}
        <aside>
          <form
            method="get"
            action="/labs"
            className="space-y-6 p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
          >
            {/* キーワード入力 */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                研究室名・主宰者・AI 要約・論文タイトル（日本語/英語）を対象。
                入力して「絞り込む」で追加されます。
              </p>

              {/* 選択中のキーワード */}
              {selectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded">
                  <span className="text-xs text-blue-900 dark:text-blue-200 self-center mr-1 font-medium">
                    選択中（{selectedKeywords.length}件）:
                  </span>
                  {selectedKeywords.map((kw) => (
                    <Link
                      key={kw}
                      href={toggleKeywordHref(kw)}
                      className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 inline-flex items-center gap-1"
                      title="クリックで削除"
                    >
                      {kw} <span className="text-blue-500 dark:text-blue-400">×</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* AND / OR（常時表示、即時 URL 反映） */}
              <KeywordModeToggle />
              {/* form submit でもモードを保持できるよう hidden */}
              {mode === "or" && (
                <input type="hidden" name="mode" value="or" />
              )}

              {/* 既存の kw を hidden で持ち越し */}
              {selectedKeywords
                .filter((k) => k !== qInput)
                .map((k) => (
                  <input key={k} type="hidden" name="kw" value={k} />
                ))}
              {/* お気に入りフィルタ状態の hidden 持ち越し */}
              {onlyFavorites && (
                <>
                  <input type="hidden" name="fav" value="1" />
                  {favIds.map((id) => (
                    <input
                      key={id}
                      type="hidden"
                      name="favIds"
                      value={String(id)}
                    />
                  ))}
                </>
              )}
            </div>

            {/* お気に入り絞り込み */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                お気に入り
              </h3>
              <FavoritesFilter />
            </div>

            {/* キーワードツリー */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                キーワード階層
              </h3>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                上位を選ぶと配下のキーワードを一括選択。
                ▶ で開閉、☑/◧/☐ で選択状態を表示。
              </p>
              <KeywordTreeFilter />
            </div>

            {/* 分野フィルタはキーワード階層（大分類）と統合された。
                form submit 時に URL の f= を維持するため hidden input でパススルー */}
            {fieldCodes.map((code) => (
              <input key={code} type="hidden" name="f" value={code} />
            ))}

            {/* 大学：国立 / 公立 / 私学 → 個別大学 */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between">
                <span>大学</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                区分（国立／公立／私学）をクリックでその区分の大学を一括選択。
                ▶ で開閉。
              </p>
              <UniversityTreeFilter
                universities={universities.map((u) => ({ id: u.id, name: u.name }))}
              />
              {/* form submit でも選択を保持するための hidden */}
              {universityIds.map((id) => (
                <input key={id} type="hidden" name="u" value={String(id)} />
              ))}
            </details>

            {/* 地方・都道府県 */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between">
                <span>地方・都道府県</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                地方をクリックするとその地方の県を一括選択。
                ▶ で展開、▼ で閉じる。
              </p>
              <PrefectureTreeFilter />
              {/* form submit でも選択を保持するための hidden */}
              {prefectures.map((p) => (
                <input key={p} type="hidden" name="p" value={p} />
              ))}
            </details>

            {/* 件数・並び替え */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between">
                <span>その他の条件</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <div className="space-y-3 mt-2 pl-1">
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                    論文数（下限）
                  </label>
                  <select
                    name="min"
                    defaultValue={String(minWorks)}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {MIN_WORKS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                    並び替え
                  </label>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                className="px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                リセット
              </Link>
            </div>
          </form>
        </aside>

        {/* 結果 */}
        <section>
          <div className="mb-4 text-sm text-gray-700 dark:text-gray-300 flex items-baseline gap-2">
            {hasFilters ? (
              <>
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {matchCount}
                </span>
                <span>件ヒット（全 {totalCount} 件中）</span>
                {selectedKeywords.length >= 2 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                    {mode === "and" ? "AND" : "OR"}
                  </span>
                )}
              </>
            ) : (
              <>
                <span>全</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {totalCount}
                </span>
                <span>件</span>
              </>
            )}
            {matchCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
                {pageStart}〜{pageEnd} 件目を表示
                {totalPages > 1 && ` / ${totalPages} ページ`}
                {minWorksExcludedOnPage > 0 &&
                  `（minWorks フィルタによりこのページから ${minWorksExcludedOnPage} 件除外）`}
              </span>
            )}
          </div>

          {matchCount === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-12 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
              該当する研究室がありません。条件を変えてみてください。
            </p>
          ) : labs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-12 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
              このページの研究室はすべて minWorks フィルタで除外されました。
              <br />
              <Link
                href={pageHref(1)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                1 ページ目に戻る
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {labs.map((lab) => {
                const fieldJp = lab.primaryFieldCode
                  ? (FIELD_LABEL_BY_CODE[lab.primaryFieldCode] ??
                    lab.primaryFieldName)
                  : null;
                return (
                  <li
                    key={lab.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all overflow-hidden"
                  >
                    <Link href={`/labs/${lab.id}`} className="block p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-snug">
                            {lab.professorName} 研究室
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {lab.university.name}
                            {lab.department && (
                              <span className="text-gray-500 dark:text-gray-400">
                                ・{lab.department}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2 shrink-0">
                          {fieldJp && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap border border-blue-200 dark:border-blue-900 self-center">
                              {fieldJp}
                            </span>
                          )}
                          <FavoriteButton
                            labId={lab.id}
                            size="sm"
                            stopParentLink
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-2">
                        <span>論文 {lab._count.works} 件</span>
                      </div>
                    </Link>
                    {lab.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {lab.tags.slice(0, 8).map((tag) => (
                          <TagChip
                            key={tag}
                            tag={tag}
                            href={toggleKeywordHref(tag)}
                          />
                        ))}
                        {lab.tags.length > 8 && (
                          <span className="text-[10px] leading-none px-1.5 py-0.5 text-gray-500 dark:text-gray-400 self-center">
                            +{lab.tags.length - 8}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="ページ送り"
              className="mt-8 flex items-center justify-center gap-1 flex-wrap text-sm"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400"
                  aria-label="前のページ"
                >
                  ← 前へ
                </Link>
              ) : (
                <span
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  aria-disabled="true"
                >
                  ← 前へ
                </span>
              )}
              {buildPageList(currentPage, totalPages).map((p, idx) =>
                p === "gap" ? (
                  <span
                    key={`gap-${idx}`}
                    className="px-2 text-gray-400 dark:text-gray-600 select-none"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : p === currentPage ? (
                  <span
                    key={p}
                    className="px-3 py-1.5 border border-blue-600 bg-blue-600 text-white rounded font-semibold min-w-[2.5rem] text-center"
                    aria-current="page"
                  >
                    {p}
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 min-w-[2.5rem] text-center"
                  >
                    {p}
                  </Link>
                ),
              )}
              {currentPage < totalPages ? (
                <Link
                  href={pageHref(currentPage + 1)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400"
                  aria-label="次のページ"
                >
                  次へ →
                </Link>
              ) : (
                <span
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  aria-disabled="true"
                >
                  次へ →
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FavoritesFilter } from "@/components/FavoritesFilter";
import { KeywordModeToggle } from "@/components/KeywordModeToggle";
import { KeywordTreeFilter } from "@/components/KeywordTreeFilter";
import { PrefectureTreeFilter } from "@/components/PrefectureTreeFilter";
import { SortSelect } from "@/components/SortSelect";
import { TagChip } from "@/components/TagChip";
import { UniversityTreeFilter } from "@/components/UniversityTreeFilter";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";
import { getI18n } from "@/lib/i18n-server";
import { interpolate } from "@/lib/i18n";
import { buildFavoriteProfile, scoreLabByProfile } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "研究室を検索",
  description:
    "分野・大学・研究機関・キーワードで日本の研究室を絞り込み検索。約 8,700 研究室から、興味に合う進学先・配属先を探せます。AI 要約と論文リスト付き。",
  alternates: { canonical: "/labs" },
  openGraph: {
    title: "研究室を検索 | ラボマッチ",
    description:
      "分野・大学・研究機関・キーワードで日本の研究室を絞り込み検索。AI 要約と論文リスト付き。",
    url: "https://www.labmatch.jp/labs",
  },
};

const VALID_SORTS = ["works", "popular", "name", "new", "recommend"] as const;
type Sort = (typeof VALID_SORTS)[number];
/** sort=recommend のときに DB から取得する候補ラボの上限。
 *  全件 score 計算するためページネーション前に全てを集める必要があり、
 *  暴走防止のためハードキャップを設ける。 */
const RECOMMEND_FETCH_CAP = 2000;

const MIN_WORKS_OPTIONS = [
  { value: "0", label: "指定なし" },
  { value: "5", label: "5 件以上" },
  { value: "10", label: "10 件以上" },
  { value: "15", label: "15 件以上" },
  { value: "20", label: "20 件以上" },
  { value: "30", label: "30 件以上" },
  { value: "50", label: "50 件以上" },
  { value: "75", label: "75 件以上" },
  { value: "100", label: "100 件以上" },
] as const;

interface PageProps {
  searchParams: Promise<{
    q?: string | string[];
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

/**
 * フリーテキスト検索（`q`）の 1 語に対する条件。
 * 研究室名・主宰者・AI 要約・論文タイトル（日英）だけを対象にし、分野タグ
 * （tags 列）は見ない。タグ検索と独立させるため、ここで tags を混ぜない。
 */
function buildTextCondition(term: string): Prisma.LabWhereInput {
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { professorName: { contains: term, mode: "insensitive" } },
      { aiSummary: { contains: term, mode: "insensitive" } },
      {
        works: {
          some: {
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { titleJa: { contains: term, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

/**
 * 分野タグ（`kw`、キーワードツリー / カードのタグチップ由来）の 1 語に対する条件。
 * Lab.tags 列だけを見る。階層タグ（祖先ラベル）も tags に保存済みなので、
 * 上位ノード（"生物学" 等）でもここでマッチする。
 */
function buildTagCondition(tag: string): Prisma.LabWhereInput {
  return { tags: { has: tag } };
}

export default async function LabsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { locale, t } = await getI18n();
  // フリーテキスト検索（研究室名・主宰者・AI 要約・論文タイトル）。`q` に集約。
  const queryTerms = Array.from(
    new Set(
      asArray(params.q)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );
  // 分野タグ（キーワードツリー / カードのタグチップ）。`kw` に集約。
  const tagTerms = Array.from(
    new Set(
      asArray(params.kw)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );
  const mode = params.mode === "or" ? "or" : "and";
  const universityIds = asArray(params.u)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
  const prefectures = asArray(params.p)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sortRaw = params.sort ?? "works";
  const sort: Sort = (VALID_SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as Sort)
    : "works";
  const fieldCodes = asArray(params.f).filter((c) => /^\d+$/.test(c));
  const minWorks = Math.max(0, Number(params.min) || 0);
  const onlyFavorites = params.fav === "1";
  // favIds は (a) onlyFavorites=true、(b) sort=recommend のどちらかで利用する。
  // どちらでもないときは無視（URL に居残っていても影響を与えない）。
  const wantsFavIds = onlyFavorites || sort === "recommend";
  const favIds = wantsFavIds
    ? asArray(params.favIds)
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0)
        .slice(0, 200)
    : [];
  const currentPage = Math.max(1, Number(params.page) || 1);

  // 現状の filter 状態を URL パラメータに復元するヘルパー。
  // queries / tags を個別に差し替えられる（一方を渡さなければ現状維持）。
  const buildFilterParams = (opts: {
    queries?: string[];
    tags?: string[];
    page?: number;
  } = {}): URLSearchParams => {
    const u = new URLSearchParams();
    for (const q of opts.queries ?? queryTerms) u.append("q", q);
    for (const t of opts.tags ?? tagTerms) u.append("kw", t);
    if (mode !== "and") u.set("mode", mode);
    for (const id of universityIds) u.append("u", String(id));
    for (const p of prefectures) u.append("p", p);
    for (const code of fieldCodes) u.append("f", code);
    if (minWorks > 0) u.set("min", String(minWorks));
    if (sort !== "works") u.set("sort", sort);
    if (onlyFavorites) {
      u.set("fav", "1");
      for (const id of favIds) u.append("favIds", String(id));
    } else if (sort === "recommend") {
      // おすすめ順は favIds を保持（ページ間移動で snapshot が消えないように）
      for (const id of favIds) u.append("favIds", String(id));
    }
    const pageTo = opts.page ?? currentPage;
    if (pageTo > 1) u.set("page", String(pageTo));
    return u;
  };

  const pageHref = (target: number): string =>
    `/labs?${buildFilterParams({ page: target }).toString()}`;

  // フリーテキスト語の削除リンク（chip の × 用）
  const removeQueryHref = (term: string) =>
    `/labs?${buildFilterParams({
      queries: queryTerms.filter((q) => q !== term),
      page: 1,
    }).toString()}`;

  // 分野タグの toggle リンク（カードのタグチップ / tag chip の × 用）
  const toggleTagHref = (tag: string) => {
    const next = tagTerms.includes(tag)
      ? tagTerms.filter((t) => t !== tag)
      : [...tagTerms, tag];
    return `/labs?${buildFilterParams({ tags: next, page: 1 }).toString()}`;
  };

  const conditions: Prisma.LabWhereInput[] = [];
  // フリーテキスト群と分野タグ群は別々に組み、それぞれ AND/OR を適用したうえで
  // 互いを AND 結合する（外側 where が AND）。これにより「研究者名 + 分野タグ」を
  // OR にしても、研究者名の条件は必ず残る。
  if (queryTerms.length > 0) {
    const textConds = queryTerms.map(buildTextCondition);
    conditions.push(mode === "and" ? { AND: textConds } : { OR: textConds });
  }
  if (tagTerms.length > 0) {
    const tagConds = tagTerms.map(buildTagCondition);
    conditions.push(mode === "and" ? { AND: tagConds } : { OR: tagConds });
  }
  if (universityIds.length > 0) {
    // 親大学が選択された場合、その配下の子センター（research-institute）の
    // ラボも結果に含める。子センター単独の選択時は親には波及しない。
    const children = await prisma.university.findMany({
      where: { parentId: { in: universityIds } },
      select: { id: true },
    });
    const expanded = new Set<number>(universityIds);
    for (const c of children) expanded.add(c.id);
    // 複数所属対応：affiliations 経由で検索。これにより、どちらの所属大学
    // から検索しても該当 PI がヒットする（Lab は 1 件として返るので重複しない）
    conditions.push({
      affiliations: { some: { universityId: { in: [...expanded] } } },
    });
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
        : sort === "popular"
          ? { viewCount: "desc" }
          : { works: { _count: "desc" } };

  /** 一覧 UI が必要とする lab フィールド一式（親 University も込み） */
  const labInclude = {
    university: { include: { parent: true } },
    _count: { select: { works: true } },
  } satisfies Prisma.LabInclude;
  type LabRow = Prisma.LabGetPayload<{ include: typeof labInclude }>;

  const skip = (currentPage - 1) * PER_PAGE;
  /** sort=recommend かつお気に入りがあるとき、ページネーション前に
   *  全候補をフェッチして score を計算する必要がある。
   *  それ以外は通常通り Prisma で take/skip。 */
  const recommendActive = sort === "recommend" && favIds.length > 0;
  const recommendNeedsFavorites = sort === "recommend" && favIds.length === 0;

  const [totalCount, matchingCount, universities, profile] = await Promise.all([
    prisma.lab.count({ where: { deletedAt: null } }),
    prisma.lab.count({ where }),
    prisma.university.findMany({
      select: { id: true, name: true, category: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    recommendActive ? buildFavoriteProfile(favIds) : Promise.resolve(null),
  ]);

  /** ページ表示用のラボ配列を作る。
   *  - 通常 sort: Prisma で order + take + skip
   *  - recommend sort: 上限 RECOMMEND_FETCH_CAP まで取得→score→sort→ページ切り出し
   */
  let pageMatches: LabRow[];
  let recommendCapped = false;
  if (recommendActive && profile) {
    const candidates = await prisma.lab.findMany({
      where,
      include: labInclude,
      // works の多いものから取りつつ cap。スコアが付くラボは tag/field 同一性で決まるので、
      // works 多いものから見ていけば「実質的に上位」の取りこぼしは少ない。
      orderBy: { works: { _count: "desc" } },
      take: RECOMMEND_FETCH_CAP,
    });
    recommendCapped = matchingCount > RECOMMEND_FETCH_CAP;

    const scored = candidates.map((c) => ({
      lab: c,
      score: scoreLabByProfile(
        {
          id: c.id,
          tags: c.tags,
          primaryFieldCode: c.primaryFieldCode,
        },
        profile,
      ),
    }));
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.lab._count.works - a.lab._count.works;
    });
    pageMatches = scored.slice(skip, skip + PER_PAGE).map((s) => s.lab);
  } else {
    pageMatches = await prisma.lab.findMany({
      where,
      include: labInclude,
      orderBy,
      take: PER_PAGE,
      skip,
    });
  }

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

  const totalSelected = queryTerms.length + tagTerms.length;
  const hasFilters =
    totalSelected > 0 ||
    universityIds.length > 0 ||
    prefectures.length > 0 ||
    fieldCodes.length > 0 ||
    minWorks > 0 ||
    onlyFavorites;

  return (
    <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          {t.toTop}
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t.labsTitle}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        {t.labsIntro}
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
                {t.kwSearch}
              </label>
              <input
                id="q-input"
                type="text"
                name="q"
                defaultValue=""
                placeholder={t.kwPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {t.kwHelp}
              </p>

              {/* 選択中のフリーテキスト語 */}
              {queryTerms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded">
                  <span className="text-xs text-blue-900 dark:text-blue-200 self-center mr-1 font-medium">
                    {t.kwSelected}
                  </span>
                  {queryTerms.map((term) => (
                    <Link
                      key={term}
                      href={removeQueryHref(term)}
                      scroll={false}
                      className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 inline-flex items-center gap-1"
                      title={locale === "ja" ? "クリックで削除" : "Click to remove"}
                    >
                      {term} <span className="text-blue-500 dark:text-blue-400">×</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* 選択中の分野タグ */}
              {tagTerms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded">
                  <span className="text-xs text-emerald-900 dark:text-emerald-200 self-center mr-1 font-medium">
                    {t.tagSelected}
                  </span>
                  {tagTerms.map((tag) => (
                    <Link
                      key={tag}
                      href={toggleTagHref(tag)}
                      scroll={false}
                      className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 inline-flex items-center gap-1"
                      title={locale === "ja" ? "クリックで削除" : "Click to remove"}
                    >
                      {tag} <span className="text-emerald-500 dark:text-emerald-400">×</span>
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

              {/* 既存の q（フリーテキスト語）を hidden で持ち越し。
                  入力欄は defaultValue="" なので、ここで既存語、入力欄で新規語を送る */}
              {queryTerms.map((term) => (
                <input key={term} type="hidden" name="q" value={term} />
              ))}
              {/* 既存の分野タグ kw を hidden で持ち越し */}
              {tagTerms.map((tag) => (
                <input key={tag} type="hidden" name="kw" value={tag} />
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t.favorites}
              </h3>
              <FavoritesFilter />
            </div>

            {/* キーワードツリー */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t.sectKeywordTree}
              </h3>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                {locale === "ja"
                  ? "クリックでそのラベルをタグとして選択。AND 絞り込みでは上位ラベルだけでもその階層でマッチします。▶ で開閉、☑/◧/☐ で選択状態を表示。"
                  : "Click a label to use it as a tag. With AND, a parent label matches its whole branch. ▶ expands; ☑/◧/☐ show selection state."}
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
                <span>{t.sectUniversity}</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                {locale === "ja"
                  ? "区分（国立／公立／私学／研究機関）をクリックでその区分の機関を一括選択。▶ で開閉。"
                  : "Click a category (national / public / private / institute) to select all of its institutions. ▶ toggles."}
              </p>
              <UniversityTreeFilter
                universities={universities.map((u) => ({
                  id: u.id,
                  name: u.name,
                  category: u.category,
                  parentId: u.parentId,
                }))}
              />
              {/* form submit でも選択を保持するための hidden */}
              {universityIds.map((id) => (
                <input key={id} type="hidden" name="u" value={String(id)} />
              ))}
            </details>

            {/* 地方・都道府県 */}
            <details open className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between">
                <span>{t.sectRegion}</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                {locale === "ja"
                  ? "地方をクリックするとその地方の県を一括選択。▶ で展開、▼ で閉じる。"
                  : "Click a region to select all its prefectures. ▶ expands, ▼ collapses."}
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
                <span>{t.sectOther}</span>
                <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <div className="space-y-3 mt-2 pl-1">
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                    {t.minWorks}
                  </label>
                  <select
                    name="min"
                    defaultValue={String(minWorks)}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {MIN_WORKS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.value === "0"
                          ? locale === "ja"
                            ? "指定なし"
                            : "Any"
                          : locale === "ja"
                            ? `${o.value} 件以上`
                            : `${o.value}+`}
                      </option>
                    ))}
                  </select>
                </div>
                {/* 並び替えは即時 URL 反映の Client Component。
                    sort=recommend を選んだ瞬間に localStorage のお気に入りを
                    URL に snapshot するため、form submit に頼らない。 */}
                <SortSelect />
              </div>
            </details>

            {/* ボタン */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
              >
                {t.apply}
              </button>
              <Link
                href="/labs"
                className="px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t.reset}
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
                <span>
                  {locale === "ja"
                    ? `件ヒット（全 ${totalCount} 件中）`
                    : `${t.hits} (${interpolate(t.ofTotal, totalCount)})`}
                </span>
                {(queryTerms.length >= 2 || tagTerms.length >= 2) && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                    {mode === "and" ? "AND" : "OR"}
                  </span>
                )}
              </>
            ) : (
              <>
                {locale === "ja" && <span>全</span>}
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {totalCount}
                </span>
                <span>{locale === "ja" ? "件" : t.statLabs}</span>
              </>
            )}
            {matchCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
                {locale === "ja"
                  ? `${pageStart}〜${pageEnd} 件目を表示`
                  : `${pageStart}–${pageEnd}`}
                {totalPages > 1 &&
                  (locale === "ja"
                    ? ` / ${totalPages} ページ`
                    : ` / ${totalPages} pages`)}
                {minWorksExcludedOnPage > 0 &&
                  (locale === "ja"
                    ? `（minWorks フィルタによりこのページから ${minWorksExcludedOnPage} 件除外）`
                    : ` (${minWorksExcludedOnPage} hidden by min-papers filter)`)}
              </span>
            )}
          </div>

          {recommendNeedsFavorites && (
            <p className="mb-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded px-3 py-2">
              {locale === "ja"
                ? "「お気に入りからのおすすめ順」にはお気に入りが必要です。研究室カードの ☆ で追加するか、別の並び替えを選んでください（現在は通常の順序で表示しています）。"
                : "Sorting by recommendations needs favorites. Add some with the ☆ on lab cards or pick another sort (showing the default order for now)."}
            </p>
          )}
          {recommendActive && (
            <p className="mb-3 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded px-3 py-2">
              {locale === "ja"
                ? `お気に入り ${favIds.length} 件と共通タグ・同分野・同大学のラボを上位にしています。`
                : `Ranking labs that share tags, field and institution with your ${favIds.length} favorites.`}
              {recommendCapped &&
                (locale === "ja"
                  ? ` ヒットが多いため、論文数の多い上位 ${RECOMMEND_FETCH_CAP.toLocaleString()} 件のみをスコアリング対象としています。`
                  : ` With many matches, only the top ${RECOMMEND_FETCH_CAP.toLocaleString()} by paper count are scored.`)}
            </p>
          )}

          {matchCount === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-12 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
              {t.noResults}
            </p>
          ) : labs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-12 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
              {locale === "ja"
                ? "このページの研究室はすべて minWorks フィルタで除外されました。"
                : "Every lab on this page was hidden by the min-papers filter."}
              <br />
              <Link
                href={pageHref(1)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === "ja" ? "1 ページ目に戻る" : "Back to page 1"}
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
                            {lab.professorName} {t.lab}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {lab.university.parent ? (
                              <>
                                {lab.university.parent.name}
                                <span className="text-gray-500 dark:text-gray-400">
                                  ・{lab.university.name}
                                </span>
                              </>
                            ) : (
                              <>{lab.university.name}</>
                            )}
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
                        <span>{interpolate(t.worksCount, lab._count.works)}</span>
                      </div>
                    </Link>
                    {lab.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {lab.tags.slice(0, 8).map((tag) => (
                          <TagChip
                            key={tag}
                            tag={tag}
                            href={toggleTagHref(tag)}
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
              aria-label={locale === "ja" ? "ページ送り" : "Pagination"}
              className="mt-8 flex items-center justify-center gap-1 flex-wrap text-sm"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400"
                  aria-label={locale === "ja" ? "前のページ" : "Previous page"}
                >
                  {locale === "ja" ? "← 前へ" : "← Prev"}
                </Link>
              ) : (
                <span
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  aria-disabled="true"
                >
                  {locale === "ja" ? "← 前へ" : "← Prev"}
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
                  aria-label={locale === "ja" ? "次のページ" : "Next page"}
                >
                  {locale === "ja" ? "次へ →" : "Next →"}
                </Link>
              ) : (
                <span
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  aria-disabled="true"
                >
                  {locale === "ja" ? "次へ →" : "Next →"}
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

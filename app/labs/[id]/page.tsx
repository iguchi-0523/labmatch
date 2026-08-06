import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JsonLd } from "@/components/JsonLd";
import { RelatedLabsSection } from "@/components/RelatedLabsSection";
import { TagChip } from "@/components/TagChip";
import { ViewBeacon } from "@/components/ViewBeacon";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";
import { getDict, type Locale } from "@/lib/i18n";
import { getRelatedLabs } from "@/lib/recommendations";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// ラボ詳細は ISR キャッシュ（CDN 配信 + クロール効率）。force-dynamic をやめ、
// cookie 依存（getI18n）も外した。閲覧数は ViewBeacon → API で加算する。
//
// revalidate は 30 日。1 日（86400）だと 4.9 万ページのキャッシュが毎日切れ、
// クローラの巡回が毎回 origin 再描画に落ちる。1 ページ約 16 KB（gzip）×
// 4.9 万 × 毎日 ≒ 24 GB/月 となり、Hobby の Fast Origin Transfer 10 GB を
// 単独で使い切る（2026-08-05 にこれでチームが Paused になった）。
// ラボの内容は ingest でしか変わらず、ingest 完了後は静的に近い。
// 取り込みを再開して即時反映が要るときは deploy すればキャッシュは飛ぶ。
export const revalidate = 2592000;

// 動的 param ルートを ISR の対象にする（Next.js は generateStaticParams が無いと
// 動的 param を no-store で都度描画する）。空配列＝ビルド時は事前生成せず、初回
// アクセスで描画してキャッシュ。1.7 万→将来 5 万ページでもビルドが膨らまない。
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * ラボ詳細の description（検索スニペット）を作る。
 *
 * GSC 上、流入クエリは研究者名と研究トピック（遺伝子・薬剤・手法名）が中心。
 * トピックでマッチさせるため、分野名と研究テーマ（タグ）を冒頭に出す。
 * 分野は日本語ラベルを使う（旧実装は英語の primaryFieldName をそのまま
 * 出していて「Medicine分野」のような不自然な日本語になっていた）。
 */
function buildLabDescription(opts: {
  professorName: string;
  uniLabel: string;
  fieldLabel: string | null;
  tags: string[];
}): string {
  const field = opts.fieldLabel ? `${opts.fieldLabel}の研究室。` : "研究室。";
  const themes =
    opts.tags.length > 0
      ? `研究テーマ: ${opts.tags.slice(0, 6).join("・")}。`
      : "";
  return `${field}${themes}${opts.professorName}（${opts.uniLabel}）の直近5年の論文を AI が日本語で要約。researchmap・KAKEN などへのリンクもまとめています。`;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const labId = Number(id);
  if (Number.isNaN(labId)) return { title: "見つかりません" };
  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: {
      professorName: true,
      primaryFieldCode: true,
      primaryFieldName: true,
      tags: true,
      deletedAt: true,
      university: { select: { name: true, parent: { select: { name: true } } } },
      _count: { select: { works: true } },
    },
  });
  if (!lab || lab.deletedAt) return { title: "見つかりません" };
  const uniLabel = lab.university.parent
    ? `${lab.university.parent.name}・${lab.university.name}`
    : lab.university.name;
  const fieldLabel = lab.primaryFieldCode
    ? (FIELD_LABEL_BY_CODE[lab.primaryFieldCode] ?? lab.primaryFieldName)
    : lab.primaryFieldName;
  const title = `${lab.professorName} 研究室（${uniLabel}）`;
  const description = buildLabDescription({
    professorName: lab.professorName,
    uniLabel,
    fieldLabel,
    tags: lab.tags,
  });
  const canonical = `/labs/${labId}`;
  // works が薄いラボ詳細は noindex（scaled thin content 回避 + クロール予算の節約）。
  // follow は残し、内部リンク経由のクロールは妨げない。sitemap も同条件で除外。
  const isThin = lab._count.works < 3;
  return {
    title,
    description,
    alternates: { canonical },
    ...(isThin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "profile",
      url: `${SITE_URL}${canonical}`,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function LabDetailPage({ params }: PageProps) {
  const { id } = await params;
  const labId = Number(id);
  if (Number.isNaN(labId)) notFound();

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    include: {
      university: { include: { parent: true } },
      affiliations: {
        include: { university: { include: { parent: true } } },
      },
      works: { orderBy: { year: "desc" } },
      grants: { orderBy: { periodStart: "desc" } },
      labSocieties: { include: { society: true } },
    },
  });

  if (!lab || lab.deletedAt) notFound();

  // ラボ詳細は cookie を読まず日本語固定で描画し、ISR キャッシュ可能にする。
  // UI 言語切替は Footer などクライアント側にのみ効く。
  const locale: Locale = "ja";
  const t = getDict("ja");

  // 閲覧数は ISR キャッシュ下では描画時に増やせない。クライアントの ViewBeacon が
  // /api/labs/[id]/view を叩いて加算する（人気順ソート用）。

  // 関連研究室をタグ・分野・大学から算出
  const relatedLabs = await getRelatedLabs(
    {
      id: lab.id,
      tags: lab.tags,
      primaryFieldCode: lab.primaryFieldCode,
      universityId: lab.universityId,
    },
    8,
  );

  // AI 要約は cron/backfill で事前生成のみ（コスト保護のためオンデマンド生成は廃止）。
  // 「薄グレー」方針：hasAbstract=true の works のみが要約対象。
  const worksWithAbstract = lab.works.filter((w) => w.hasAbstract);

  // 構造化データ：研究者(Person) を主体に、所属大学・直近論文・パンくずを付与。
  // AI と検索エンジンが「誰が・どこで・何を研究しているか」を解釈できるようにする。
  const uniName = lab.university.parent
    ? lab.university.parent.name
    : lab.university.name;
  const subOrg = lab.university.parent ? lab.university.name : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/labs/${lab.id}#profile`,
        url: `${SITE_URL}/labs/${lab.id}`,
        name: `${lab.professorName} 研究室`,
        inLanguage: "ja",
        about: { "@id": `${SITE_URL}/labs/${lab.id}#person` },
        ...(lab.aiSummary ? { description: lab.aiSummary } : {}),
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/labs/${lab.id}#person`,
        name: lab.professorName,
        affiliation: {
          "@type": "Organization",
          name: subOrg ? `${uniName} ${subOrg}` : uniName,
        },
        ...(lab.orcid
          ? { identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: lab.orcid } }
          : {}),
        knowsAbout: lab.tags.slice(0, 12),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ラボマッチ", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "大学から探す",
            item: `${SITE_URL}/universities`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: subOrg ? `${uniName}・${subOrg}` : uniName,
            item: `${SITE_URL}/universities/${lab.universityId}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: `${lab.professorName} 研究室`,
            item: `${SITE_URL}/labs/${lab.id}`,
          },
        ],
      },
    ],
  };

  // 外部リンク用の URL を組み立て（ID が無ければ検索リンクにフォールバック）
  // 全てローマ字氏名（lab.professorName）を使う。
  // researchmap は詳細検索パラメータ `name` + `affiliation`（+ `section` 部局）を併用して
  // 同名異研究者を絞り込む。
  const researchmapDirect = !!lab.researchmapId;
  const researchmapHref = (() => {
    if (researchmapDirect) {
      return `https://researchmap.jp/${lab.researchmapId}`;
    }
    const p = new URLSearchParams();
    p.set("name", lab.professorName);
    p.set("affiliation", lab.university.name);
    if (lab.department) p.set("section", lab.department);
    return `https://researchmap.jp/researchers?${p.toString()}`;
  })();

  // NRID（研究者リゾルバ）— researcherNumber があれば個別ページ、なければフリーワード検索
  // NRID 個別 URL: https://nrid.nii.ac.jp/ja/nrid/{1000+8桁}/
  // フリーワード検索は kw=ローマ字名 + 大学名（+ 部局）の AND 結合で対象を 1 人に絞り込む
  // （絞り込みサイドバーの研究機関/部局フィルタは JS 生成で URL から制御不可のため、
  //  kw 内に同一情報を含める実装に変更）
  const nridDirect = !!lab.researcherNumber;
  const nridHref = (() => {
    if (nridDirect) {
      const digits = lab.researcherNumber!.replace(/\D/g, "");
      const full = digits.startsWith("1000") ? digits : `1000${digits}`;
      return `https://nrid.nii.ac.jp/ja/nrid/${full}/`;
    }
    const kwParts = [
      lab.professorName, // ローマ字氏名
      lab.university.name, // 研究機関
      lab.department ?? "", // 部局（未設定なら空）
    ].filter((s) => s.length > 0);
    return `https://nrid.nii.ac.jp/ja/search/?kw=${encodeURIComponent(
      kwParts.join(" "),
    )}`;
  })();

  // 日本の研究.com（research-er.jp）— サイト内の researcher 検索
  const japaneseResearchHref = `https://research-er.jp/search?keyword=${encodeURIComponent(
    lab.professorName,
  )}`;

  const officialSearchHref = `https://www.google.com/search?q=${encodeURIComponent(
    [lab.university.name, lab.professorName].join(" "),
  )}`;
  const officialDirect = !!lab.officialUrl;

  // Google Scholar 著者検索（名前のみ）
  const googleScholarHref = `https://scholar.google.com/citations?view_op=search_authors&mauthors=${encodeURIComponent(
    lab.professorName,
  )}`;

  // ORCID 直接リンク（id があれば）/ 検索（なければ氏名で）
  const orcidDirect = !!lab.orcid;
  const orcidHref = orcidDirect
    ? `https://orcid.org/${lab.orcid!.replace(/.*\//, "")}`
    : `https://orcid.org/orcid-search/search?searchQuery=${encodeURIComponent(
        lab.professorName,
      )}`;

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <JsonLd data={jsonLd} />
      <ViewBeacon labId={lab.id} />
      <nav className="mb-4 text-sm space-x-2">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          {t.home}
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Link
          href="/universities"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {locale === "ja" ? "大学から探す" : "Universities"}
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Link
          href={`/universities/${lab.universityId}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {subOrg ? `${uniName}・${subOrg}` : uniName}
        </Link>
      </nav>

      <header className="mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100 shrink-0">
            {lab.professorName} {t.lab}
          </h1>
          {/* タグ全件：研究室名と ☆ の間。クリックで /labs?kw=タグ にジャンプ */}
          {lab.tags.length > 0 && (
            <div className="flex-1 min-w-0 flex flex-wrap gap-1 self-center">
              {lab.tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  href={`/labs?kw=${encodeURIComponent(tag)}`}
                />
              ))}
            </div>
          )}
          {lab.tags.length === 0 && <div className="flex-1" />}
          <FavoriteButton labId={lab.id} size="md" />
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          {t.pi}
          {locale === "ja" ? "：" : ": "}
          {lab.professorName}
        </div>
        {/* 主所属 */}
        <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {lab.university.parent
            ? `${lab.university.parent.name}・${lab.university.name}`
            : lab.university.name}
          {lab.department ? `・${lab.department}` : ""}
        </div>
        {/* 兼任所属（複数大学・機関に cross-affiliation の場合のみ表示） */}
        {(() => {
          const others = lab.affiliations
            .filter((a) => a.universityId !== lab.universityId)
            .map((a) => a.university);
          if (others.length === 0) return null;
          return (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {t.joint}：
              {others.map((u, i) => (
                <span key={u.id}>
                  {i > 0 && <span className="mx-1">／</span>}
                  {u.parent ? `${u.parent.name}・${u.name}` : u.name}
                </span>
              ))}
            </div>
          );
        })()}
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {t.aiSummary}
        </h2>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {lab.aiSummary ?? (
            <span className="italic text-gray-500 dark:text-gray-400">
              {worksWithAbstract.length === 0
                ? locale === "ja"
                  ? "出版社方針により論文要旨が公開されていないため、AI 要約は提供していません。論文タイトルと DOI のみ下にてご案内します。"
                  : "No publisher-released abstracts, so no AI summary. Paper titles and DOIs are listed below."
                : locale === "ja"
                  ? "要約はまだ生成されていません。"
                  : "Summary not generated yet."}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {locale === "ja"
            ? "※ AI（Claude）が、公開されている論文要旨から研究の問い・手法・主要な発見を事実情報として抽出・再構成して自動生成しています。誤りを含む可能性があるため、正確性は研究室公式情報でご確認ください。"
            : "Auto-generated by AI (Claude) from published abstracts — research questions, methods and key findings extracted as factual information. The summary itself is in Japanese and may contain errors; confirm with the lab's official source."}
        </p>
      </section>

      {/* 外部リンク（左） + 関連研究室（右）— モバイルでは縦並び */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            {t.externalLinks}
          </h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              {officialDirect ? (
                <a
                  href={lab.officialUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {locale === "ja" ? "公式サイト" : "Official site"}
                </a>
              ) : (
                <a
                  href={officialSearchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {locale === "ja"
                    ? "公式サイト（Google 検索）"
                    : "Official site (Google search)"}
                </a>
              )}
            </li>
            <li>
              <a
                href={researchmapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                researchmap
                {!researchmapDirect &&
                  (locale === "ja" ? "（詳細検索）" : " (advanced search)")}
              </a>
            </li>
            <li>
              <a
                href={nridHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === "ja" ? "NRID（KAKEN 研究者）" : "NRID (KAKEN researcher)"}
                {!nridDirect && (locale === "ja" ? "（検索）" : " (search)")}
              </a>
            </li>
            <li>
              <a
                href={japaneseResearchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {locale === "ja" ? "日本の研究.com（検索）" : "research-er.jp (search)"}
              </a>
            </li>
            <li>
              <a
                href={googleScholarHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Google Scholar{locale === "ja" ? "（検索）" : " (search)"}
              </a>
            </li>
            {lab.openalexAuthorId && (
              <li>
                <a
                  href={lab.openalexAuthorId}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  OpenAlex{locale === "ja" ? "（著者ページ）" : " (author page)"}
                </a>
              </li>
            )}
            <li>
              <a
                href={orcidHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                ORCID{!orcidDirect && (locale === "ja" ? "（検索）" : " (search)")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <RelatedLabsSection
            labs={relatedLabs}
            title={t.relatedLabs}
            emptyMessage={
              locale === "ja"
                ? "共通タグ・同分野のラボが見つかりませんでした（タグ未生成の可能性）。"
                : "No labs found with shared tags or field (tags may not be generated yet)."
            }
            locale={locale}
          />
        </div>
      </section>

      {/* 研究成果（直近 10 件 + 続き） */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {t.researchOutput}
          {locale === "ja" ? `（${lab.works.length} 件）` : ` (${lab.works.length})`}
        </h2>
        {lab.works.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {locale === "ja" ? "まだデータがありません。" : "No data yet."}
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {lab.works.slice(0, 10).map((w) => (
                <li
                  key={w.id}
                  className="p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded"
                >
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    {w.year ? `[${w.year}] ` : ""}
                    {w.sourceUrl ? (
                      <a
                        href={w.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {w.titleJa ?? w.title}
                      </a>
                    ) : (
                      (w.titleJa ?? w.title)
                    )}
                  </div>
                  {w.titleJa && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      {w.title}
                    </div>
                  )}
                  {w.doi && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      DOI: {w.doi}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {lab.works.length > 10 && (
              <details className="mt-3 group">
                <summary className="cursor-pointer inline-block text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline list-none px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded">
                  <span className="group-open:hidden">
                    {locale === "ja"
                      ? `続きを表示（残り ${lab.works.length - 10} 件）`
                      : `Show ${lab.works.length - 10} more`}
                  </span>
                  <span className="hidden group-open:inline">
                    {locale === "ja" ? "閉じる" : "Close"}
                  </span>
                </summary>
                <ul className="space-y-2 mt-3">
                  {lab.works.slice(10).map((w) => (
                    <li
                      key={w.id}
                      className="p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded"
                    >
                      <div className="text-sm text-gray-800 dark:text-gray-200">
                        {w.year ? `[${w.year}] ` : ""}
                        {w.sourceUrl ? (
                          <a
                            href={w.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {w.titleJa ?? w.title}
                          </a>
                        ) : (
                          (w.titleJa ?? w.title)
                        )}
                      </div>
                      {w.titleJa && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                          {w.title}
                        </div>
                      )}
                      {w.doi && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          DOI: {w.doi}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {locale === "ja" ? "科研費" : "KAKENHI grants"}
          {locale === "ja" ? `（${lab.grants.length} 件）` : ` (${lab.grants.length})`}
        </h2>
        {lab.grants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {locale === "ja"
              ? "まだデータがありません（KAKEN 取り込み後に表示）。"
              : "No data yet (shown after KAKEN ingest)."}
          </p>
        ) : (
          <ul className="space-y-2">
            {lab.grants.map((g) => (
              <li key={g.id} className="p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded text-sm">
                <div className="font-medium text-gray-800 dark:text-gray-200">{g.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {g.category}
                  {g.amount
                    ? locale === "ja"
                      ? `・${g.amount.toLocaleString()} 円`
                      : `・¥${g.amount.toLocaleString()}`
                    : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {locale === "ja" ? "所属学会・役職" : "Academic societies & roles"}
          {locale === "ja"
            ? `（${lab.labSocieties.length} 件）`
            : ` (${lab.labSocieties.length})`}
        </h2>
        {lab.labSocieties.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {locale === "ja"
              ? "まだデータがありません（学会データ連携後に表示）。"
              : "No data yet (shown after society data is linked)."}
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {lab.labSocieties.map((ls) => (
              <li key={`${ls.labId}-${ls.societyId}`}>
                {ls.society.name}
                {ls.role ? `（${ls.role}）` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
        {locale === "ja" ? (
          <p>
            掲載情報に誤りがある、または研究室として掲載を希望されない場合は{" "}
            <Link
              href={`/labs/${lab.id}/report`}
              className="text-blue-600 hover:underline"
            >
              こちらから削除・訂正のご依頼
            </Link>
            を承ります。
          </p>
        ) : (
          <p>
            <Link
              href={`/labs/${lab.id}/report`}
              className="text-blue-600 hover:underline"
            >
              {t.reportLink}
            </Link>
          </p>
        )}
      </footer>
    </main>
  );
}

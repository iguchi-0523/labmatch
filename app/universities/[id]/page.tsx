import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { fieldLabelOf } from "@/lib/field-labels";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 大学ハブ（中尾クエリ「○○大学 研究室」等の受け皿 + ラボ詳細への内部リンク源）。
 * 配下の研究室を分野別にまとめ、各ラボ詳細と絞り込み検索の両方へ導線を張る。
 *
 * locale cookie は読まない（日本語固定）。ルートレイアウトが cookie 依存を
 * やめれば ISR キャッシュ対象になる。
 */
export const revalidate = 86400;

// 動的 param を ISR キャッシュ対象にする（空配列＝初回アクセスで描画→キャッシュ）。
export async function generateStaticParams() {
  return [];
}

/** 分野ごとに詳細リンクを並べる上限。超過分は絞り込み検索へ送り、ページ肥大を防ぐ。 */
const PER_FIELD = 24;
/** この件数未満の大学ハブは内容が薄いので noindex（follow は残す）。 */
const NOINDEX_BELOW = 3;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function load(idStr: string) {
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) return null;
  const uni = await prisma.university.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
    },
  });
  if (!uni) return null;
  const universityIds = [uni.id, ...uni.children.map((c) => c.id)];
  const labs = await prisma.lab.findMany({
    where: { deletedAt: null, universityId: { in: universityIds } },
    select: {
      id: true,
      professorName: true,
      department: true,
      primaryFieldCode: true,
      primaryFieldName: true,
      _count: { select: { works: true } },
    },
    orderBy: [{ works: { _count: "desc" } }, { professorName: "asc" }],
  });
  return { uni, labs };
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await load(id);
  if (!data) return { title: "見つかりません", robots: { index: false, follow: false } };
  const { uni, labs } = data;
  const n = labs.length;
  const title = `${uni.name}の研究室一覧（${n}件）`;
  const description = `${uni.name}の研究室を分野別に一覧。研究テーマ・論文・AI 要約から、大学院進学や研究室配属の候補を比較できます。`;
  const canonical = `/universities/${uni.id}`;
  return {
    title,
    description,
    alternates: { canonical },
    ...(n < NOINDEX_BELOW ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonical}`,
    },
  };
}

export default async function UniversityHubPage({ params }: PageProps) {
  const { id } = await params;
  const data = await load(id);
  if (!data) notFound();
  const { uni, labs } = data;

  const fullLabel = uni.parent ? `${uni.parent.name}・${uni.name}` : uni.name;

  // 分野コードでグルーピング（プライマリ分野）
  type Lab = (typeof labs)[number];
  const byField = new Map<string, { code: string | null; label: string; labs: Lab[] }>();
  for (const lab of labs) {
    const key = lab.primaryFieldCode ?? "_none";
    const label =
      fieldLabelOf(lab.primaryFieldCode, lab.primaryFieldName) ?? "その他・未分類";
    const g = byField.get(key) ?? { code: lab.primaryFieldCode, label, labs: [] };
    g.labs.push(lab);
    byField.set(key, g);
  }
  const fieldGroups = [...byField.values()].sort(
    (a, b) => b.labs.length - a.labs.length,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/universities/${uni.id}`,
        url: `${SITE_URL}/universities/${uni.id}`,
        name: `${uni.name}の研究室一覧`,
        inLanguage: "ja",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@type": "Organization", name: uni.name },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "大学から探す",
            item: `${SITE_URL}/universities`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: uni.name,
            item: `${SITE_URL}/universities/${uni.id}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm space-x-2">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          トップ
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Link
          href="/universities"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          大学から探す
        </Link>
        {uni.parent && (
          <>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <Link
              href={`/universities/${uni.parent.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {uni.parent.name}
            </Link>
          </>
        )}
      </nav>

      <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {fullLabel}の研究室一覧
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {labs.length.toLocaleString()} 研究室・{fieldGroups.length} 分野を収録。
          {uni.prefecture ? `所在地：${uni.prefecture}。` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link
            href={`/labs?u=${uni.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            この大学の研究室を絞り込み検索 →
          </Link>
        </div>
      </header>

      {uni.children.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            学内の研究機関・病院
          </h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {uni.children.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/universities/${c.id}`}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-800 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {labs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-12 text-center">
          まだ研究室データがありません。
        </p>
      ) : (
        <div className="space-y-8">
          {fieldGroups.map((g) => {
            const shown = g.labs.slice(0, PER_FIELD);
            const rest = g.labs.length - shown.length;
            const isNumericField = g.code != null && /^\d+$/.test(g.code);
            return (
              <section key={g.code ?? "_none"}>
                <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  {g.label}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    {g.labs.length} 研究室
                  </span>
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {shown.map((lab) => (
                    <li key={lab.id} className="flex items-baseline justify-between gap-2">
                      <Link
                        href={`/labs/${lab.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                      >
                        {lab.professorName} 研究室
                        {lab.department ? (
                          <span className="text-gray-500 dark:text-gray-400">
                            （{lab.department}）
                          </span>
                        ) : null}
                      </Link>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
                        論文 {lab._count.works}
                      </span>
                    </li>
                  ))}
                </ul>
                {rest > 0 && isNumericField && (
                  <p className="mt-2 text-sm">
                    <Link
                      href={`/labs?u=${uni.id}&f=${g.code}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {g.label}の研究室をすべて見る（残り {rest} 件）→
                    </Link>
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 分野ハブ（「○○ 研究室」「○○ 大学院」等の受け皿）。配下の研究室を大学別に
 * まとめ、各ラボ詳細・大学ハブ・絞り込み検索へ導線を張る。
 */
export const revalidate = 86400;

// 動的 param を ISR キャッシュ対象にする（空配列＝初回アクセスで描画→キャッシュ）。
export async function generateStaticParams() {
  return [];
}

/** 大学ごとに詳細リンクを並べる上限。超過は絞り込み検索へ送る。 */
const PER_UNIV = 10;
/** この件数未満の分野ハブは noindex（follow は残す）。 */
const NOINDEX_BELOW = 3;

interface PageProps {
  params: Promise<{ code: string }>;
}

async function load(code: string) {
  const label = FIELD_LABEL_BY_CODE[code];
  if (!label) return null;
  const labs = await prisma.lab.findMany({
    where: { deletedAt: null, primaryFieldCode: code },
    select: {
      id: true,
      professorName: true,
      department: true,
      universityId: true,
      _count: { select: { works: true } },
      university: {
        select: { id: true, name: true, parent: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ works: { _count: "desc" } }, { professorName: "asc" }],
  });
  return { code, label, labs };
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const data = await load(code);
  if (!data) return { title: "見つかりません", robots: { index: false, follow: false } };
  const { label, labs } = data;
  const n = labs.length;
  const title = `${label}の研究室一覧（${n}件）`;
  const description = `${label}分野の研究室を大学別に一覧。研究テーマ・論文・AI 要約から、大学院進学や研究室配属の候補を大学横断で比較できます。`;
  const canonical = `/fields/${code}`;
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

export default async function FieldHubPage({ params }: PageProps) {
  const { code } = await params;
  const data = await load(code);
  if (!data) notFound();
  const { label, labs } = data;

  type Lab = (typeof labs)[number];
  // 大学（親があれば親）でグルーピング
  const byUni = new Map<
    number,
    { id: number; name: string; labs: Lab[] }
  >();
  for (const lab of labs) {
    const top = lab.university.parent ?? lab.university;
    const g = byUni.get(top.id) ?? { id: top.id, name: top.name, labs: [] };
    g.labs.push(lab);
    byUni.set(top.id, g);
  }
  const uniGroups = [...byUni.values()].sort((a, b) => b.labs.length - a.labs.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/fields/${code}`,
        url: `${SITE_URL}/fields/${code}`,
        name: `${label}の研究室一覧`,
        inLanguage: "ja",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "分野から探す",
            item: `${SITE_URL}/fields`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: label,
            item: `${SITE_URL}/fields/${code}`,
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
        <Link href="/fields" className="text-blue-600 dark:text-blue-400 hover:underline">
          分野から探す
        </Link>
      </nav>

      <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {label}の研究室一覧
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {labs.length.toLocaleString()} 研究室・{uniGroups.length} 大学に分布。
        </p>
        <div className="mt-3 text-sm">
          <Link
            href={`/labs?f=${code}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {label}の研究室を絞り込み検索 →
          </Link>
        </div>
      </header>

      {uniGroups.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-12 text-center">
          まだ研究室データがありません。
        </p>
      ) : (
        <div className="space-y-8">
          {uniGroups.map((g) => {
            const shown = g.labs.slice(0, PER_UNIV);
            const rest = g.labs.length - shown.length;
            return (
              <section key={g.id}>
                <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  <Link
                    href={`/universities/${g.id}`}
                    className="text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    {g.name}
                  </Link>
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
                {rest > 0 && (
                  <p className="mt-2 text-sm">
                    <Link
                      href={`/labs?f=${code}&u=${g.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {g.name}の{label}研究室をすべて見る（残り {rest} 件）→
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

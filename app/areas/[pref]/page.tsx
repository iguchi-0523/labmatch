import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { getAllPrefectures, regionOfPrefecture } from "@/lib/prefecture-tree";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 都道府県ハブ。県内の大学・研究機関を一覧し、各大学ハブへ送る地域ランディング。
 * 「東京 研究室」「大阪 大学院 研究室」等の地域クエリを受ける。
 */
export const revalidate = 86400;

// 都道府県は有限の固定集合なので全件ビルド時に事前生成する。
// 空配列だと非 ASCII param（「東京都」等）の on-demand 生成が Vercel で 500 に
// なるため、事前生成して確実にキャッシュさせる。
export async function generateStaticParams() {
  return getAllPrefectures().map((pref) => ({ pref }));
}

const NOINDEX_BELOW = 3;

interface PageProps {
  params: Promise<{ pref: string }>;
}

async function load(prefRaw: string) {
  const pref = decodeURIComponent(prefRaw);
  if (!getAllPrefectures().includes(pref)) return null;

  const [universities, labCounts] = await Promise.all([
    prisma.university.findMany({
      select: { id: true, name: true, category: true, prefecture: true, parentId: true },
    }),
    prisma.lab.groupBy({
      by: ["universityId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countByUni = new Map<number, number>();
  for (const c of labCounts) countByUni.set(c.universityId, c._count._all);
  const childrenByParent = new Map<number, number[]>();
  for (const u of universities) {
    if (u.parentId != null) {
      const arr = childrenByParent.get(u.parentId) ?? [];
      arr.push(u.id);
      childrenByParent.set(u.parentId, arr);
    }
  }
  const totalForUni = (id: number): number => {
    let n = countByUni.get(id) ?? 0;
    for (const cid of childrenByParent.get(id) ?? []) n += countByUni.get(cid) ?? 0;
    return n;
  };

  const unisInPref = universities
    .filter((u) => u.parentId == null && u.prefecture === pref)
    .map((u) => ({ id: u.id, name: u.name, category: u.category, n: totalForUni(u.id) }))
    .filter((u) => u.n > 0)
    .sort((a, b) => b.n - a.n);

  const totalLabs = unisInPref.reduce((a, b) => a + b.n, 0);
  return { pref, unis: unisInPref, totalLabs };
}

export async function generateMetadata({ params }: PageProps) {
  const { pref } = await params;
  const data = await load(pref);
  if (!data) return { title: "見つかりません", robots: { index: false, follow: false } };
  const title = `${data.pref}の大学・研究室一覧`;
  const description = `${data.pref}の大学・研究機関 ${data.unis.length} 校、${data.totalLabs.toLocaleString()} 研究室を一覧。研究テーマ・論文・AI 要約から進学先・配属先を探せます。`;
  const canonical = `/areas/${encodeURIComponent(data.pref)}`;
  return {
    title,
    description,
    alternates: { canonical },
    ...(data.totalLabs < NOINDEX_BELOW ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonical}`,
    },
  };
}

export default async function AreaHubPage({ params }: PageProps) {
  const { pref } = await params;
  const data = await load(pref);
  if (!data) notFound();
  const region = regionOfPrefecture(data.pref);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/areas/${encodeURIComponent(data.pref)}`,
        url: `${SITE_URL}/areas/${encodeURIComponent(data.pref)}`,
        name: `${data.pref}の大学・研究室一覧`,
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
            name: "地域から探す",
            item: `${SITE_URL}/areas`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.pref,
            item: `${SITE_URL}/areas/${encodeURIComponent(data.pref)}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm space-x-2">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          トップ
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Link href="/areas" className="text-blue-600 dark:text-blue-400 hover:underline">
          地域から探す
        </Link>
        {region && (
          <>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="text-gray-500 dark:text-gray-400">{region}</span>
          </>
        )}
      </nav>

      <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {data.pref}の大学・研究室一覧
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.unis.length} 校・{data.totalLabs.toLocaleString()} 研究室。
        </p>
        <div className="mt-3 text-sm">
          <Link
            href={`/labs?p=${encodeURIComponent(data.pref)}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {data.pref}の研究室を絞り込み検索 →
          </Link>
        </div>
      </header>

      {data.unis.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-12 text-center">
          この地域の研究室データはまだありません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {data.unis.map((u) => (
            <li key={u.id} className="flex items-baseline justify-between gap-2">
              <Link
                href={`/universities/${u.id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {u.name}
              </Link>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                {u.n.toLocaleString()} 研究室
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

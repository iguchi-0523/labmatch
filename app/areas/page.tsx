import Link from "next/link";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { REGION_TREE } from "@/lib/prefecture-tree";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 地域ハブの一覧（地方 → 都道府県）。各都道府県ハブ（/areas/[pref]）への内部リンク。
 * 「東京 研究室」「大阪 大学 研究室」のような地域クエリの入口になる。
 */
export const revalidate = 604800;

export const metadata = {
  title: "地域から研究室を探す",
  description:
    "都道府県別に、日本の大学・研究機関の研究室を一覧。地元や志望地域の大学から、研究テーマ・論文・AI 要約で進学先・配属先を探せます。",
  alternates: { canonical: "/areas" },
  openGraph: {
    title: `地域から研究室を探す | ${SITE_NAME}`,
    description: "都道府県別に日本の大学・研究室を一覧できます。",
    url: `${SITE_URL}/areas`,
  },
};

/** 都道府県ごとのラボ数を集計（子センターのラボは親の都道府県へ寄せる）。 */
async function prefectureCounts(): Promise<Map<string, number>> {
  const [universities, labCounts] = await Promise.all([
    prisma.university.findMany({
      select: { id: true, prefecture: true, parentId: true },
    }),
    prisma.lab.groupBy({
      by: ["universityId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);
  const prefById = new Map<number, string | null>();
  const parentById = new Map<number, number | null>();
  for (const u of universities) {
    prefById.set(u.id, u.prefecture);
    parentById.set(u.id, u.parentId);
  }
  const resolvePref = (uniId: number): string | null => {
    const own = prefById.get(uniId) ?? null;
    if (own) return own;
    const parent = parentById.get(uniId);
    return parent ? (prefById.get(parent) ?? null) : null;
  };
  const counts = new Map<string, number>();
  for (const c of labCounts) {
    const pref = resolvePref(c.universityId);
    if (!pref) continue;
    counts.set(pref, (counts.get(pref) ?? 0) + c._count._all);
  }
  return counts;
}

export default async function AreasIndexPage() {
  const counts = await prefectureCounts();
  const totalLabs = [...counts.values()].reduce((a, b) => a + b, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/areas`,
        url: `${SITE_URL}/areas`,
        name: "地域から研究室を探す",
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
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        地域から研究室を探す
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        全国 {totalLabs.toLocaleString()} 研究室を都道府県別に。地域を選ぶと、その地域の大学・研究室を一覧できます。
      </p>

      <div className="space-y-6">
        {REGION_TREE.map((region) => {
          const prefs = region.prefectures
            .map((p) => ({ pref: p, n: counts.get(p) ?? 0 }))
            .filter((p) => p.n > 0);
          if (prefs.length === 0) return null;
          return (
            <section key={region.region}>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-1">
                {region.region}
              </h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
                {prefs.map((p) => (
                  <li key={p.pref}>
                    <Link
                      href={`/areas/${encodeURIComponent(p.pref)}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {p.pref}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      {p.n.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}

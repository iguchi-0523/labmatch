import Link from "next/link";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 大学ハブの一覧ページ。各大学ハブ（/universities/[id]）への内部リンクを束ね、
 * クローラがラボ詳細へ到達する経路の起点になる。
 *
 * このページは locale cookie を読まない（日本語固定）。ルートレイアウトが
 * cookie 依存をやめた時点で ISR キャッシュ対象になるよう revalidate を置く。
 */
export const revalidate = 86400;

const CATEGORY_LABEL: Record<string, string> = {
  national: "国立大学",
  public: "公立大学",
  private: "私立大学",
  "research-institute": "研究機関",
};
const CATEGORY_ORDER = ["national", "public", "private", "research-institute"];

export const metadata = {
  title: "大学・研究機関から研究室を探す",
  description:
    "日本の国立・公立・私立大学と研究機関を一覧。各大学の研究室を分野別にたどり、研究テーマ・論文・AI 要約から進学先・配属先を比較できます。",
  alternates: { canonical: "/universities" },
  openGraph: {
    title: `大学・研究機関から研究室を探す | ${SITE_NAME}`,
    description: "日本の大学・研究機関を一覧。各大学の研究室を分野別に探せます。",
    url: `${SITE_URL}/universities`,
  },
};

type TopUni = {
  id: number;
  name: string;
  category: string | null;
  prefecture: string | null;
};

export default async function UniversitiesIndexPage() {
  const [universities, labCounts] = await Promise.all([
    prisma.university.findMany({
      select: { id: true, name: true, category: true, prefecture: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.lab.groupBy({
      by: ["universityId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countByUni = new Map<number, number>();
  for (const c of labCounts) countByUni.set(c.universityId, c._count._all);

  // 子センター（parent 付き）の件数を親へ畳み込む
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

  const topLevel: TopUni[] = universities.filter((u) => u.parentId == null);

  const groups = new Map<string, TopUni[]>();
  for (const u of topLevel) {
    const key = u.category ?? "other";
    const arr = groups.get(key) ?? [];
    arr.push(u);
    groups.set(key, arr);
  }
  const orderedKeys = [
    ...CATEGORY_ORDER.filter((k) => groups.has(k)),
    ...[...groups.keys()].filter((k) => !CATEGORY_ORDER.includes(k)),
  ];

  const totalLabs = [...countByUni.values()].reduce((a, b) => a + b, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/universities`,
        url: `${SITE_URL}/universities`,
        name: "大学・研究機関から研究室を探す",
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
            name: "大学から探す",
            item: `${SITE_URL}/universities`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          トップ
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        大学・研究機関から研究室を探す
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        日本の大学・研究機関 {topLevel.length} 校、{totalLabs.toLocaleString()}{" "}
        研究室を収録。大学を選ぶと、その研究室を分野別に一覧できます。
      </p>

      <div className="space-y-8">
        {orderedKeys.map((key) => {
          const list = (groups.get(key) ?? [])
            .map((u) => ({ ...u, n: totalForUni(u.id) }))
            .sort((a, b) => b.n - a.n);
          if (list.length === 0) return null;
          return (
            <section key={key}>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-1">
                {CATEGORY_LABEL[key] ?? "その他"}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  {list.length} 校
                </span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {list.map((u) => (
                  <li key={u.id} className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/universities/${u.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {u.name}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                      {u.prefecture ? `${u.prefecture}・` : ""}
                      {u.n.toLocaleString()} 研究室
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

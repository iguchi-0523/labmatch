import Link from "next/link";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 分野ハブの一覧。各分野ハブ（/fields/[code]）への内部リンクを束ねる。
 * 大学ハブが「大学 → 分野」なら、こちらは「分野 → 大学」の逆軸で同じラボ群を
 * 別経路から張り、クロールの網を二重化する。
 *
 * locale cookie は読まない（日本語固定）。レイアウトの cookie 依存が外れれば
 * ISR キャッシュ対象になる。
 */
export const revalidate = 86400;

export const metadata = {
  title: "研究分野から研究室を探す",
  description:
    "医学・工学・化学・生物学・情報科学などの分野別に、日本の大学・研究機関の研究室を一覧。各分野の研究室を大学横断で比較し、進学先・配属先を探せます。",
  alternates: { canonical: "/fields" },
  openGraph: {
    title: `研究分野から研究室を探す | ${SITE_NAME}`,
    description: "分野別に日本の研究室を一覧。大学横断で比較できます。",
    url: `${SITE_URL}/fields`,
  },
};

export default async function FieldsIndexPage() {
  const counts = await prisma.lab.groupBy({
    by: ["primaryFieldCode"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const countByCode = new Map<string, number>();
  for (const c of counts) {
    if (c.primaryFieldCode) countByCode.set(c.primaryFieldCode, c._count._all);
  }

  const fields = Object.entries(FIELD_LABEL_BY_CODE)
    .map(([code, label]) => ({ code, label, n: countByCode.get(code) ?? 0 }))
    .filter((f) => f.n > 0)
    .sort((a, b) => b.n - a.n);

  const totalLabs = [...countByCode.values()].reduce((a, b) => a + b, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/fields`,
        url: `${SITE_URL}/fields`,
        name: "研究分野から研究室を探す",
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
        研究分野から研究室を探す
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        {fields.length} 分野・{totalLabs.toLocaleString()}{" "}
        研究室を収録。分野を選ぶと、その研究室を大学別に一覧できます。
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {fields.map((f) => (
          <li key={f.code} className="flex items-baseline justify-between gap-2">
            <Link
              href={`/fields/${f.code}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {f.label}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
              {f.n.toLocaleString()} 研究室
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}

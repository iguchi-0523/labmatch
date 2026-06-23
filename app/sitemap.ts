import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";
import { SITE_URL } from "@/lib/site";

/**
 * 動的サイトマップ。静的ページ + 大学ハブ + ラボ詳細を列挙する。
 *
 * 大学ハブ（/universities/[id]）はラボ詳細への内部導線も兼ねる。ラボ詳細は
 * works が薄いものを除外し、詳細ページの noindex 方針（works < 3 を noindex）と
 * 揃える。
 *
 * Google の単一サイトマップ上限は 50,000 URL。現在 ≈ 1.8 万 + 大学ハブで余裕が
 * あるが、indexable lab が ~45,000 を超えたら generateSitemaps で分割する。
 *
 * 6 時間ごとに再生成（ingest cron と同周期）。
 */
export const revalidate = 21600;

/** これ未満の works のラボ詳細は noindex 方針に合わせ sitemap からも除外。
 *  app/labs/[id]/page.tsx の generateMetadata と一致させること。 */
const MIN_WORKS_FOR_INDEX = 3;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/labs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/universities`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/fields`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/areas`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const [universities, labs] = await Promise.all([
    prisma.university.findMany({
      select: { id: true, updatedAt: true, prefecture: true, parentId: true },
      orderBy: { id: "asc" },
    }),
    prisma.lab.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        updatedAt: true,
        universityId: true,
        primaryFieldCode: true,
        _count: { select: { works: true } },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  const uniPages: MetadataRoute.Sitemap = universities.map((u) => ({
    url: `${SITE_URL}/universities/${u.id}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 分野ハブ：ラボが付いている分野コードのみ
  const fieldCodes = new Set<string>();
  for (const lab of labs) {
    if (lab.primaryFieldCode && FIELD_LABEL_BY_CODE[lab.primaryFieldCode]) {
      fieldCodes.add(lab.primaryFieldCode);
    }
  }
  const fieldPages: MetadataRoute.Sitemap = [...fieldCodes].map((code) => ({
    url: `${SITE_URL}/fields/${code}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // 地域ハブ：ラボが付いている都道府県のみ（子センターは親の都道府県へ寄せる）
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
  const prefs = new Set<string>();
  for (const lab of labs) {
    const pref = resolvePref(lab.universityId);
    if (pref) prefs.add(pref);
  }
  const areaPages: MetadataRoute.Sitemap = [...prefs].map((pref) => ({
    url: `${SITE_URL}/areas/${encodeURIComponent(pref)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const labPages: MetadataRoute.Sitemap = labs
    .filter((lab) => lab._count.works >= MIN_WORKS_FOR_INDEX)
    .map((lab) => ({
      url: `${SITE_URL}/labs/${lab.id}`,
      lastModified: lab.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticPages, ...uniPages, ...fieldPages, ...areaPages, ...labPages];
}

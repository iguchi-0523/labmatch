import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/**
 * 動的サイトマップ。静的ページ + 全ラボ詳細ページを列挙する。
 *
 * ラボ詳細（約 8,700 件）は外部リンクも内部導線も薄いため、サイトマップが
 * 唯一の発見経路になる。Google の単一サイトマップ上限は 50,000 URL なので
 * 現状は 1 ファイルで足りる。超えたら generateSitemaps で分割する。
 *
 * 6 時間ごとに再生成（ingest cron と同周期）。
 */
export const revalidate = 21600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/labs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const labs = await prisma.lab.findMany({
    where: { deletedAt: null },
    select: { id: true, updatedAt: true },
    orderBy: { id: "asc" },
  });

  const labPages: MetadataRoute.Sitemap = labs.map((lab) => ({
    url: `${SITE_URL}/labs/${lab.id}`,
    lastModified: lab.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...labPages];
}

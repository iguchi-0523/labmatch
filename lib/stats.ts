import { unstable_cache } from "next/cache";
import { prisma } from "./db";

/** 取り込み「完了」とみなす最小ラボ数（子センター合算）。progress-report と揃える。 */
const DONE_THRESHOLD = 50;

export interface SiteStats {
  /** 論理削除を除くラボ総数 */
  labCount: number;
  /** 論文総数 */
  workCount: number;
  /** AI 要約済みラボ数 */
  summarizedCount: number;
  /** 取り込み完了した親大学・独立機関の数（子センター合算で >= 50） */
  completedCount: number;
  /** 完了した機関名（ラボ数の多い順、表示用に上位のみ使う想定） */
  completedNames: string[];
}

/**
 * /about・トップなどで使うサイト全体の集計。
 * 親大学の完了判定は子センター（parentId 一致）のラボも合算する
 * （ingest-next.ts と同じ基準）。
 */
export async function getSiteStats(): Promise<SiteStats> {
  const [labCount, workCount, summarizedCount, universities, grouped] =
    await Promise.all([
      prisma.lab.count({ where: { deletedAt: null } }),
      prisma.work.count(),
      prisma.lab.count({
        where: { deletedAt: null, aiSummary: { not: null } },
      }),
      prisma.university.findMany({
        select: { id: true, name: true, parentId: true },
      }),
      prisma.lab.groupBy({
        by: ["universityId"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

  const countByUni = new Map<number, number>();
  for (const g of grouped) countByUni.set(g.universityId, g._count._all);

  const nameById = new Map(universities.map((u) => [u.id, u.name]));
  const parentById = new Map(universities.map((u) => [u.id, u.parentId]));

  // family root（親自身 or 子センターなら親）ごとにラボ数を合算
  const familyTotal = new Map<number, number>();
  for (const [uniId, n] of countByUni) {
    const root = parentById.get(uniId) ?? uniId;
    familyTotal.set(root, (familyTotal.get(root) ?? 0) + n);
  }

  const completed = [...familyTotal.entries()]
    .filter(([rootId, total]) => total >= DONE_THRESHOLD && nameById.has(rootId))
    .map(([rootId, total]) => ({ name: nameById.get(rootId)!, total }))
    .sort((a, b) => b.total - a.total);

  return {
    labCount,
    workCount,
    summarizedCount,
    completedCount: completed.length,
    completedNames: completed.map((c) => c.name),
  };
}

/**
 * SEO コピー（トップの description / OGP / Twitter カード）用に、ラボ数・論文数を
 * 丸めた表示文字列で返す。
 *
 * unstable_cache で 6 時間キャッシュするので、取り込みの進行に合わせて自動更新
 * されつつ、レイアウトを静的（ISR）に保てる（リクエストごとの DB アクセスを避ける）。
 * 丸めは「実数を上回らない」floor 方向にして誇張を避ける。
 */
export const getSeoCounts = unstable_cache(
  async () => {
    const [labCount, workCount] = await Promise.all([
      prisma.lab.count({ where: { deletedAt: null } }),
      prisma.work.count(),
    ]);
    return {
      // 「約 1.7 万研究室」: 千の位で floor → 0.1 万単位
      labMan: (Math.floor(labCount / 1000) / 10).toFixed(1),
      // 「約 59 万件」: 万の位で floor
      workMan: Math.floor(workCount / 10000),
    };
  },
  ["seo-counts"],
  { revalidate: 21600 },
);

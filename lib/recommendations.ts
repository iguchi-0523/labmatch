import { prisma } from "./db";

/**
 * 関連研究室レコメンド：
 *
 * - 「ある研究室と関連した研究をしているラボ」のスコアリング
 * - 入力ラボのタグ・primaryFieldCode・所属大学を基にスコア計算
 *
 * スコアモデル（直感的、調整可能）:
 *   - 共有タグ 1 件 = +2
 *   - 同じ primaryFieldCode = +5
 *   - 同じ大学 = +1（同分野のクラスタリング助長）
 *   - 同じ大学かつ違う分野 = +0（多様性確保）
 */

export interface RelatedSeed {
  id: number;
  tags: string[];
  primaryFieldCode: string | null;
  universityId: number;
}

export interface RelatedLab {
  id: number;
  name: string;
  professorName: string;
  department: string | null;
  primaryFieldCode: string | null;
  primaryFieldName: string | null;
  tags: string[];
  university: { id: number; name: string };
  _count: { works: number };
  /** スコア（高いほど関連度高） */
  score: number;
  /** 入力ラボと共通するタグ */
  sharedTags: string[];
}

const CANDIDATE_LIMIT = 200;

/**
 * 入力ラボに関連する研究室を返す（自分自身は除外、削除済みも除外）。
 */
export async function getRelatedLabs(
  seed: RelatedSeed,
  limit: number = 8,
): Promise<RelatedLab[]> {
  // タグも fieldCode もない場合は同大学から works 数 desc で返す（fallback）
  if (seed.tags.length === 0 && !seed.primaryFieldCode) {
    const fallback = await prisma.lab.findMany({
      where: {
        id: { not: seed.id },
        deletedAt: null,
        universityId: seed.universityId,
      },
      include: {
        university: { select: { id: true, name: true } },
        _count: { select: { works: true } },
      },
      orderBy: { works: { _count: "desc" } },
      take: limit,
    });
    return fallback.map((l) => ({
      ...l,
      score: 1,
      sharedTags: [],
    }));
  }

  // 候補: 共有タグまたは同 field
  const candidates = await prisma.lab.findMany({
    where: {
      id: { not: seed.id },
      deletedAt: null,
      OR: [
        seed.primaryFieldCode
          ? { primaryFieldCode: seed.primaryFieldCode }
          : { id: { in: [] } },
        seed.tags.length > 0 ? { tags: { hasSome: seed.tags } } : { id: { in: [] } },
      ],
    },
    include: {
      university: { select: { id: true, name: true } },
      _count: { select: { works: true } },
    },
    take: CANDIDATE_LIMIT,
  });

  const seedTagSet = new Set(seed.tags);

  const scored = candidates.map((c) => {
    const sharedTags = c.tags.filter((t) => seedTagSet.has(t));
    const sameField =
      seed.primaryFieldCode && c.primaryFieldCode === seed.primaryFieldCode
        ? 5
        : 0;
    const sameUni = c.universityId === seed.universityId ? 1 : 0;
    const score = sharedTags.length * 2 + sameField + sameUni;
    return {
      id: c.id,
      name: c.name,
      professorName: c.professorName,
      department: c.department,
      primaryFieldCode: c.primaryFieldCode,
      primaryFieldName: c.primaryFieldName,
      tags: c.tags,
      university: c.university,
      _count: c._count,
      score,
      sharedTags,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 同点時は works 数（多い方を上）
    return b._count.works - a._count.works;
  });

  return scored.slice(0, limit);
}

/**
 * 複数ラボの集合（お気に入り）に対し、それらの傾向と関連する研究室を返す。
 * - すべての seed の tags を結合（重複タグは出現回数で重み付け）
 * - primaryFieldCode は最も頻出するものを採用
 */
export async function getRecommendedFromFavorites(
  favLabIds: number[],
  limit: number = 12,
): Promise<RelatedLab[]> {
  if (favLabIds.length === 0) return [];
  const fav = await prisma.lab.findMany({
    where: { id: { in: favLabIds }, deletedAt: null },
    select: {
      id: true,
      tags: true,
      primaryFieldCode: true,
      universityId: true,
    },
  });
  if (fav.length === 0) return [];

  // タグの出現頻度集計
  const tagCount = new Map<string, number>();
  for (const f of fav) {
    for (const t of f.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  }
  const aggregatedTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map((x) => x[0]);

  // 最も多い primaryFieldCode を採用
  const fieldCount = new Map<string, number>();
  for (const f of fav) {
    if (!f.primaryFieldCode) continue;
    fieldCount.set(
      f.primaryFieldCode,
      (fieldCount.get(f.primaryFieldCode) ?? 0) + 1,
    );
  }
  const topField = [...fieldCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // 全ての fav 大学から最頻のものを採用
  const uniCount = new Map<number, number>();
  for (const f of fav) {
    uniCount.set(f.universityId, (uniCount.get(f.universityId) ?? 0) + 1);
  }
  const topUni = [...uniCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  const candidates = await prisma.lab.findMany({
    where: {
      id: { notIn: favLabIds },
      deletedAt: null,
      OR: [
        topField ? { primaryFieldCode: topField } : { id: { in: [] } },
        aggregatedTags.length > 0
          ? { tags: { hasSome: aggregatedTags } }
          : { id: { in: [] } },
      ],
    },
    include: {
      university: { select: { id: true, name: true } },
      _count: { select: { works: true } },
    },
    take: CANDIDATE_LIMIT * 2,
  });

  const aggTagSet = new Set(aggregatedTags);
  const scored = candidates.map((c) => {
    const sharedTags = c.tags.filter((t) => aggTagSet.has(t));
    const sameField =
      topField && c.primaryFieldCode === topField ? 5 : 0;
    const sameUni = c.universityId === topUni ? 1 : 0;
    const score = sharedTags.length * 2 + sameField + sameUni;
    return {
      id: c.id,
      name: c.name,
      professorName: c.professorName,
      department: c.department,
      primaryFieldCode: c.primaryFieldCode,
      primaryFieldName: c.primaryFieldName,
      tags: c.tags,
      university: c.university,
      _count: c._count,
      score,
      sharedTags,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b._count.works - a._count.works;
  });

  return scored.slice(0, limit);
}

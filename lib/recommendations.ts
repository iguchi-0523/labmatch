import { prisma } from "./db";

/**
 * 関連研究室レコメンド：
 *
 * - 「ある研究室と関連した研究をしているラボ」のスコアリング
 * - 共有タグを IDF（希少さ）で重み付けして合算
 *
 * スコアモデル:
 *   - 共有タグ 1 件 = そのタグの IDF = ln(全ラボ数 / そのタグを持つラボ数)
 *     「生物学」のように 9 割が持つタグはほぼ 0 点、「有機合成」のように
 *     1% しか持たないタグは高得点。専門が近いほど上位に来る。
 *   - 同じ primaryFieldCode = 小さなタイブレーク加点
 *
 * 旧モデルの「共有タグ数 × 2」は、ほぼ全ラボが持つ広いタグ（生物学・分子・
 * 医学など）を共有しただけのラボを過大評価していたため IDF に置き換えた。
 * 同じ大学ボーナスは以前に撤去済み。
 */

export interface RelatedSeed {
  id: number;
  tags: string[];
  primaryFieldCode: string | null;
  universityId: number;
}

// ----- タグ IDF（希少さ）キャッシュ -----

interface TagIdf {
  total: number;
  df: Map<string, number>;
  /** 未知タグも含めて IDF を返す。df が無いタグは最大重み扱い。 */
  idf: (tag: string) => number;
}

let idfCache: { value: TagIdf; at: number } | null = null;
const IDF_TTL_MS = 60 * 60 * 1000; // 1 時間

/**
 * 全ラボのタグ出現数（df）を集計して IDF を引けるようにする。
 * 1 時間キャッシュ（ingest で増えても精度に大きな影響は出ない粒度）。
 */
async function getTagIdf(): Promise<TagIdf> {
  const now = Date.now();
  if (idfCache && now - idfCache.at < IDF_TTL_MS) return idfCache.value;

  const rows = await prisma.$queryRaw<{ tag: string; df: bigint }[]>`
    SELECT tag, COUNT(*)::bigint AS df
    FROM (SELECT unnest(tags) AS tag FROM labs WHERE deleted_at IS NULL) t
    GROUP BY tag`;
  const total = await prisma.lab.count({ where: { deletedAt: null } });
  const df = new Map<string, number>();
  for (const r of rows) df.set(r.tag, Number(r.df));

  const value: TagIdf = {
    total,
    df,
    idf: (tag: string) => {
      const d = df.get(tag) ?? 1;
      // ln(total / d)。total/d が 1 未満になっても 0 で下げ止め。
      return Math.max(0, Math.log(total / d));
    },
  };
  idfCache = { value, at: now };
  return value;
}

/** 同じ分野（primaryFieldCode 一致）のタイブレーク加点。希少タグ 1 個ぶん未満に抑える。 */
const SAME_FIELD_BONUS = 0.5;

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

  const { idf } = await getTagIdf();

  // 候補集合は seed の「希少なタグ」で絞る。生物学のような広いタグで集めると
  // 候補が膨れて専門の近いラボが CANDIDATE_LIMIT に埋もれるため、IDF の高い
  // 上位 12 タグだけをマッチ条件に使う（スコア計算は全共有タグで行う）。
  const discriminative = [...seed.tags]
    .sort((a, b) => idf(b) - idf(a))
    .slice(0, 12);
  const matchTags = discriminative.length > 0 ? discriminative : seed.tags;

  const candidates = await prisma.lab.findMany({
    where: {
      id: { not: seed.id },
      deletedAt: null,
      tags: { hasSome: matchTags },
    },
    include: {
      university: { select: { id: true, name: true } },
      _count: { select: { works: true } },
    },
    // 上限に当たった場合でも論文数のある実体ラボを残す
    orderBy: { works: { _count: "desc" } },
    take: CANDIDATE_LIMIT,
  });

  const seedTagSet = new Set(seed.tags);

  const scored = candidates.map((c) => {
    const sharedTags = c.tags.filter((t) => seedTagSet.has(t));
    const tagScore = sharedTags.reduce((s, t) => s + idf(t), 0);
    const sameField =
      seed.primaryFieldCode && c.primaryFieldCode === seed.primaryFieldCode
        ? SAME_FIELD_BONUS
        : 0;
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
      score: tagScore + sameField,
      // 表示用の共通タグは希少な順に並べ、専門的なものが先に見えるように
      sharedTags: [...sharedTags].sort((a, b) => idf(b) - idf(a)),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b._count.works - a._count.works;
  });

  return scored.slice(0, limit);
}

/**
 * 複数ラボの集合（お気に入り）に対し、それらに共通する興味と関連する研究室を返す。
 *
 * 重み付けの考え方：
 *   tagWeight = (お気に入り何件に出たか)^2 × IDF
 *   出現件数を二乗で効かせることで、「複数のお気に入りに共通して現れるタグ」を
 *   1 件にしか出ないタグより強く優遇する。IDF で広いタグ（生物学など）は抑える。
 *   例：5 件中 3 件に出る専門タグ（3^2=9）は、1 件だけの希少タグ（1^2=1）を上回る。
 *   お気に入りが 1 件のときは全タグ count=1 で、単一ラボの関連度と同じ挙動になる。
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

  const { idf } = await getTagIdf();

  // お気に入り横断でタグが「何件のお気に入りに出たか」を数える
  // （1 ラボ内の重複は 1 と数えるため Set で集計）。
  const tagCount = new Map<string, number>();
  for (const f of fav) {
    for (const t of new Set(f.tags)) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  // 共通して現れるほど効くよう出現件数を二乗、希少さで IDF を掛ける
  const tagWeight = new Map<string, number>();
  for (const [t, c] of tagCount) tagWeight.set(t, c * c * idf(t));

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

  // 候補は重み（出現回数 × IDF）の高い上位タグで絞る
  const matchTags = [...tagWeight.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map((x) => x[0]);

  const candidates = await prisma.lab.findMany({
    where: {
      id: { notIn: favLabIds },
      deletedAt: null,
      ...(matchTags.length > 0
        ? { tags: { hasSome: matchTags } }
        : topField
          ? { primaryFieldCode: topField }
          : { id: { in: [] } }),
    },
    include: {
      university: { select: { id: true, name: true } },
      _count: { select: { works: true } },
    },
    orderBy: { works: { _count: "desc" } },
    take: CANDIDATE_LIMIT * 2,
  });

  const scored = candidates.map((c) => {
    const sharedTags = c.tags.filter((t) => tagWeight.has(t));
    const tagScore = sharedTags.reduce(
      (s, t) => s + (tagWeight.get(t) ?? 0),
      0,
    );
    const sameField =
      topField && c.primaryFieldCode === topField ? SAME_FIELD_BONUS : 0;
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
      score: tagScore + sameField,
      sharedTags: [...sharedTags].sort((a, b) => idf(b) - idf(a)),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b._count.works - a._count.works;
  });

  return scored.slice(0, limit);
}

/**
 * お気に入りラボから集約プロファイル（タグ・分野・大学の重み）を作る。
 * 検索結果ページの「おすすめ順」並べ替えで再利用するため切り出した。
 */
export interface FavoriteProfile {
  /** タグ → 重み（お気に入り内の出現回数 × IDF）。希少で頻出のタグほど重い。 */
  tagWeight: Map<string, number>;
  /** 最も多く現れた primaryFieldCode（無ければ null） */
  topField: string | null;
  /** お気に入り ID（自分を結果から除外するため） */
  seedIds: Set<number>;
}

export async function buildFavoriteProfile(
  favIds: number[],
): Promise<FavoriteProfile | null> {
  if (favIds.length === 0) return null;
  const [fav, { idf }] = await Promise.all([
    prisma.lab.findMany({
      where: { id: { in: favIds }, deletedAt: null },
      select: { id: true, tags: true, primaryFieldCode: true },
    }),
    getTagIdf(),
  ]);
  if (fav.length === 0) return null;

  // 何件のお気に入りに出たか（1 ラボ内重複は 1）。共通タグを二乗で優遇し IDF を掛ける。
  const tagCount = new Map<string, number>();
  for (const f of fav) {
    for (const t of new Set(f.tags)) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  const tagWeight = new Map<string, number>();
  for (const [t, c] of tagCount) tagWeight.set(t, c * c * idf(t));

  const fieldCount = new Map<string, number>();
  for (const f of fav) {
    if (!f.primaryFieldCode) continue;
    fieldCount.set(
      f.primaryFieldCode,
      (fieldCount.get(f.primaryFieldCode) ?? 0) + 1,
    );
  }
  const topField =
    [...fieldCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return { tagWeight, topField, seedIds: new Set(favIds) };
}

/**
 * 任意のラボにプロファイルを当ててスコアを計算する。
 * - お気に入り自身は -1（リストの末尾に追いやる）
 * - スコア：共有タグの重み（出現回数 × IDF）合計 + 同分野の小さな加点
 */
export function scoreLabByProfile(
  lab: {
    id: number;
    tags: string[];
    primaryFieldCode: string | null;
  },
  profile: FavoriteProfile,
): number {
  if (profile.seedIds.has(lab.id)) return -1;
  let tagScore = 0;
  for (const t of lab.tags) tagScore += profile.tagWeight.get(t) ?? 0;
  const sameField =
    profile.topField && lab.primaryFieldCode === profile.topField
      ? SAME_FIELD_BONUS
      : 0;
  return tagScore + sameField;
}

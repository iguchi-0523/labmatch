import { getUniversityByName } from "./universities";

/**
 * 大学フィルタ・一覧の表示順を、日本でよく使われる大学群のヒエラルキーで固定する。
 *
 * ここに載る大学は config の key でこの順に最優先で並ぶ。載っていない大学・研究機関は
 * 各カテゴリの末尾に、研究力（config の worksCount）が多い順 → 収録研究室数が多い順で続く。
 *
 * カテゴリ（国立 / 公立 / 私学 / 研究機関）は別ロジックで先に分けるので、この配列に
 * 国立と私立を混ぜて書いてよい。カテゴリ内での相対順だけが効く。
 */
export const UNIVERSITY_ORDER: string[] = [
  // === 国立 ===
  // 旧帝大（序列順）
  "u-tokyo",
  "kyoto-u",
  "osaka-u",
  "tohoku-u",
  "nagoya-u",
  "kyushu-u",
  "hokkaido-u",
  // 一工（東京一工の一工）
  "titech",
  "hit-u",
  // 難関国立（旧帝一工に次ぐ。筑波・医科歯科・神戸・横国）
  "tsukuba-u",
  "tmdu",
  "kobe-u",
  "ynu",
  // 金岡千広（かねおかちひろ：金沢・岡山・千葉・広島）
  "kanazawa-u",
  "okayama-u",
  "chiba-u",
  "hiroshima-u",
  // 電農名繊（電気通信・農工・名工・繊維。config にあるのは農工・名工・繊維）
  "tuat",
  "nitech",
  "kit-jp",
  // 旧六・地方国立・医科単科（新潟/熊本/長崎/浜松医/滋賀医/旭川医）は
  // ここに載せず、下の研究力フォールバックで worksCount 順に続く

  // === 公立 ===
  // 大阪公立・東京都立・横浜市立（難関公立）
  "omu",
  "tmu",
  "ycu",

  // === 私立 ===
  // 早慶
  "waseda-u",
  "keio-u",
  // 上理（上智・東京理科）
  "sophia-u",
  "tus",
  // MARCH（GMARCH の学習院は config になし）
  "meiji-u",
  "aoyama-gakuin",
  "rikkyo-u",
  "chuo-u",
  "hosei-u",
  // 関関同立
  "kansai-u",
  "kwansei-gakuin",
  "doshisha",
  "ritsumeikan",
  // 産近甲龍（config にあるのは近畿のみ）
  "kindai",
  // 私立医大（順天堂・北里・自治医・日本医科・関西医科）は載せず、
  // 下の研究力フォールバックで worksCount 順に続く
];

const RANK_BY_KEY = new Map(UNIVERSITY_ORDER.map((key, i) => [key, i]));

/** 大学名から表示順のヒエラルキー順位を返す。未掲載は最後尾。 */
export function hierarchyRank(name: string): number {
  const key = getUniversityByName(name)?.key;
  const rank = key ? RANK_BY_KEY.get(key) : undefined;
  return rank ?? Number.MAX_SAFE_INTEGER;
}

function configWorksCount(name: string): number {
  return getUniversityByName(name)?.worksCount ?? 0;
}

/**
 * カテゴリ内の並び替え比較関数。ヒエラルキー順位を最優先し、同順位（＝両方とも未掲載）は
 * 研究力（worksCount）→ 収録研究室数（labs）→ 名前 の順で決める。
 */
export function compareUniversities(
  a: { name: string; labs: number },
  b: { name: string; labs: number },
): number {
  const ra = hierarchyRank(a.name);
  const rb = hierarchyRank(b.name);
  if (ra !== rb) return ra - rb;
  const wa = configWorksCount(a.name);
  const wb = configWorksCount(b.name);
  if (wa !== wb) return wb - wa;
  if (a.labs !== b.labs) return b.labs - a.labs;
  return a.name.localeCompare(b.name, "ja");
}

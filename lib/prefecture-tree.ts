/**
 * 都道府県を地方区分でグルーピングしたツリー。
 *
 * 区分は標準的な 8 地方区分（北海道、東北、関東、中部、関西、中国、四国、九州・沖縄）。
 * 三重県は関西（近畿）に含める扱い（伝統的な区分に従う）。
 *
 * 各 leaf は都道府県名（DB の `university.prefecture` 列と同じ表記）。
 */

export interface RegionNode {
  region: string;
  prefectures: string[];
}

export const REGION_TREE: RegionNode[] = [
  {
    region: "北海道",
    prefectures: ["北海道"],
  },
  {
    region: "東北",
    prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  {
    region: "関東",
    prefectures: [
      "茨城県",
      "栃木県",
      "群馬県",
      "埼玉県",
      "千葉県",
      "東京都",
      "神奈川県",
    ],
  },
  {
    region: "中部",
    prefectures: [
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県",
    ],
  },
  {
    region: "関西",
    prefectures: [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県",
    ],
  },
  {
    region: "中国",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
  {
    region: "四国",
    prefectures: ["徳島県", "香川県", "愛媛県", "高知県"],
  },
  {
    region: "九州・沖縄",
    prefectures: [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
      "沖縄県",
    ],
  },
];

export type PrefSelectionState = "none" | "partial" | "all";

export function regionSelectionState(
  region: RegionNode,
  selected: Set<string>,
): PrefSelectionState {
  if (region.prefectures.length === 0) return "none";
  const hit = region.prefectures.filter((p) => selected.has(p)).length;
  if (hit === 0) return "none";
  if (hit === region.prefectures.length) return "all";
  return "partial";
}

/** ツリー全体の都道府県リスト（重複なし） */
export function getAllPrefectures(): string[] {
  return REGION_TREE.flatMap((r) => r.prefectures);
}

/** 都道府県名から所属地方を逆引き */
export function regionOfPrefecture(pref: string): string | null {
  for (const r of REGION_TREE) {
    if (r.prefectures.includes(pref)) return r.region;
  }
  return null;
}

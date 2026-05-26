/**
 * OpenAlex の field id (ASJC ベース) → 日本語ラベル
 * 全 26 分野を網羅。/labs カードや関連研究室セクションで利用。
 */
export const FIELD_LABEL_BY_CODE: Record<string, string> = {
  "10": "学際的",
  "11": "農学・生物科学",
  "12": "人文芸術",
  "13": "生化学・分子生物学・遺伝学",
  "14": "経営学・会計学",
  "15": "化学工学",
  "16": "化学",
  "17": "計算機科学",
  "18": "意思決定科学",
  "19": "地球惑星科学",
  "20": "経済学",
  "21": "エネルギー",
  "22": "工学",
  "23": "環境科学",
  "24": "免疫学・微生物学",
  "25": "材料科学",
  "26": "数学",
  "27": "医学",
  "28": "神経科学",
  "29": "看護学",
  "30": "薬学・薬理学",
  "31": "物理学・天文学",
  "32": "心理学",
  "33": "社会科学",
  "34": "獣医学",
  "35": "歯学",
  "36": "保健専門職",
};

export function fieldLabelOf(
  code: string | null | undefined,
  fallback?: string | null,
): string | null {
  if (!code) return fallback ?? null;
  return FIELD_LABEL_BY_CODE[code] ?? fallback ?? null;
}

import universitiesData from "../config/universities.json";

/**
 * 大学・研究機関の区分。
 * - national / public / private は大学（学位を出す機関）
 * - research-institute は OIST / RIKEN / AIST など、学生を受け入れる公的研究機関。
 *   OIST は学位を出す大学院大学だが、学生像・分野・運営形態が他の大学とは大きく異なる
 *   ため、利用者の検索体験を優先してこのグループに分類する。
 */
export type UniversityCategory =
  | "national"
  | "public"
  | "private"
  | "research-institute";

export interface University {
  key: string;
  name: string;
  nameEn: string;
  category: UniversityCategory;
  prefecture: string;
  phase: number;
  enabled: boolean;
  openalexInstitutionId: string | null;
  /** 親大学の key（OpenAlex の lineage で結ばれていない学内研究所等で使用） */
  parentKey?: string;
  /**
   * true なら `authorships.institutions.id:<ID>` で直接 ingest する
   * （lineage を使わない）。学内研究所で親大学に紐付かないものに使用。
   */
  useDirectIdFilter?: boolean;
}

export type FieldGroup = "life" | "health";

interface FieldGroupConfig {
  ids: number[];
  labels: Record<string, string>;
}

interface UniversitiesConfig {
  version: number;
  lastUpdated: string;
  fields: Record<FieldGroup, FieldGroupConfig>;
  universities: University[];
}

const config = universitiesData as unknown as UniversitiesConfig;

export function getAllUniversities(): University[] {
  return config.universities;
}

export function getEnabledUniversities(): University[] {
  return config.universities.filter((u) => u.enabled);
}

export function getUniversityByKey(key: string): University | undefined {
  return config.universities.find((u) => u.key === key);
}

/** 大学名（日本語表記）から config エントリを逆引き */
export function getUniversityByName(name: string): University | undefined {
  return config.universities.find((u) => u.name === name);
}

export const CATEGORY_LABEL: Record<UniversityCategory, string> = {
  national: "国立",
  public: "公立",
  private: "私学",
  "research-institute": "研究機関",
};

export function getFieldIdsForGroups(groups: FieldGroup[]): number[] {
  const seen = new Set<number>();
  for (const g of groups) {
    for (const id of config.fields[g].ids) seen.add(id);
  }
  return [...seen].sort((a, b) => a - b);
}

export function getFieldLabel(id: number): string | undefined {
  for (const g of Object.values(config.fields)) {
    const label = g.labels[String(id)];
    if (label) return label;
  }
  return undefined;
}

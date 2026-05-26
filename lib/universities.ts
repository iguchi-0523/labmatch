import universitiesData from "../config/universities.json";

export type UniversityCategory = "national" | "public" | "private";

export interface University {
  key: string;
  name: string;
  nameEn: string;
  category: UniversityCategory;
  prefecture: string;
  phase: number;
  enabled: boolean;
  openalexInstitutionId: string | null;
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

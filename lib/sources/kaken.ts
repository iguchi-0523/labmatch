/**
 * KAKEN（科研費）OpenSearch API クライアント。
 *
 * 公式 doc: https://kaken.nii.ac.jp/api/
 * エンドポイント: https://nrid.nii.ac.jp/opensearch/
 *
 * 利用には NII の開発者登録で取得する appid が必要：
 *   1. https://support.nii.ac.jp/ja/cinii/api/developer でアプリ登録
 *   2. 取得した appid を .env に `KAKEN_APP_ID="..."` で保存
 *
 * 商用利用は可。レスポンスは CC BY なので出典明記必須（既に Footer・/about で表記済）。
 */

const BASE = "https://nrid.nii.ac.jp/opensearch/";

export interface KakenGrant {
  /** 課題番号（例: "21H02345"） */
  awardNumber: string;
  /** 課題名 */
  title: string;
  /** 開始年度 / 終了年度 */
  yearFrom?: number;
  yearTo?: number;
  /** 研究種目 */
  category?: string;
  /** 採択区分（基盤 A/B/C 等） */
  subject?: string;
  /** 配分額（円） */
  amount?: number;
  /** PI（研究代表者） */
  principalInvestigator: KakenPI;
  /** 共同研究者（co-investigators） */
  coInvestigators: KakenPI[];
}

export interface KakenPI {
  /** researcher_number（e-Rad / NRID 8 桁） */
  researcherNumber: string;
  /** 漢字氏名 */
  nameJa: string;
  /** ローマ字氏名 */
  nameEn?: string;
  /** 所属（採択時） */
  institutionJa?: string;
  institutionEn?: string;
  /** 部局・職位 */
  section?: string;
  position?: string;
}

interface OpenSearchEntry {
  // KAKEN OpenSearch は Atom 1.0 / JSON で結果を返す
  // 必要なフィールドだけ型を緩く定義
  id?: string;
  title?: string;
  "kaken:awardNumber"?: string;
  "kaken:projectStatus"?: string;
  "kaken:fundingMethod"?: string;
  "kaken:researchField"?: string;
  "kaken:investigators"?: {
    "kaken:investigator": OpenSearchPerson[] | OpenSearchPerson;
  };
  "kaken:researchProject"?: {
    "kaken:totalCost"?: string;
    "kaken:projectPeriod"?: {
      "kaken:projectPeriodFrom"?: string;
      "kaken:projectPeriodTo"?: string;
    };
  };
}

interface OpenSearchPerson {
  "kaken:role"?: string; // "principalInvestigator" | "coInvestigator"
  "kaken:researcherNumber"?: string;
  "kaken:personName"?:
    | { "kaken:fullName"?: string; "@xml:lang"?: string }
    | { "kaken:fullName"?: string; "@xml:lang"?: string }[];
  "kaken:institution"?:
    | { "kaken:institutionName"?: string; "@xml:lang"?: string }
    | { "kaken:institutionName"?: string; "@xml:lang"?: string }[];
  "kaken:department"?:
    | { "kaken:departmentName"?: string; "@xml:lang"?: string }
    | { "kaken:departmentName"?: string; "@xml:lang"?: string }[];
  "kaken:jobTitle"?:
    | { "kaken:jobTitleName"?: string; "@xml:lang"?: string }
    | { "kaken:jobTitleName"?: string; "@xml:lang"?: string }[];
}

/** entry の中の localized 値（ja / en）を 1 つに揃える */
function pickLocalized<T extends Record<string, string | undefined>>(
  v: T | T[] | undefined,
  pref: "ja" | "en",
  textKey: keyof T,
): string | undefined {
  if (!v) return undefined;
  const arr = Array.isArray(v) ? v : [v];
  const exact = arr.find((x) => x["@xml:lang"] === pref);
  return (exact?.[textKey] ?? arr[0]?.[textKey]) as string | undefined;
}

function normalizePerson(p: OpenSearchPerson): KakenPI {
  const num = p["kaken:researcherNumber"] ?? "";
  return {
    researcherNumber: num,
    nameJa: pickLocalized(p["kaken:personName"], "ja", "kaken:fullName") ?? "",
    nameEn: pickLocalized(p["kaken:personName"], "en", "kaken:fullName"),
    institutionJa: pickLocalized(
      p["kaken:institution"],
      "ja",
      "kaken:institutionName",
    ),
    institutionEn: pickLocalized(
      p["kaken:institution"],
      "en",
      "kaken:institutionName",
    ),
    section: pickLocalized(p["kaken:department"], "ja", "kaken:departmentName"),
    position: pickLocalized(p["kaken:jobTitle"], "ja", "kaken:jobTitleName"),
  };
}

function normalizeGrant(e: OpenSearchEntry): KakenGrant | null {
  const inv = e["kaken:investigators"]?.["kaken:investigator"];
  const persons = inv ? (Array.isArray(inv) ? inv : [inv]) : [];
  if (persons.length === 0) return null;
  const pi = persons.find(
    (p) => p["kaken:role"] === "principalInvestigator",
  );
  if (!pi) return null;
  const co = persons
    .filter((p) => p["kaken:role"] !== "principalInvestigator")
    .map(normalizePerson);

  const period = e["kaken:researchProject"]?.["kaken:projectPeriod"];
  const yearFrom = period?.["kaken:projectPeriodFrom"]
    ? Number(period["kaken:projectPeriodFrom"].slice(0, 4))
    : undefined;
  const yearTo = period?.["kaken:projectPeriodTo"]
    ? Number(period["kaken:projectPeriodTo"].slice(0, 4))
    : undefined;

  return {
    awardNumber: e["kaken:awardNumber"] ?? "",
    title: e.title ?? "",
    yearFrom,
    yearTo,
    category: e["kaken:fundingMethod"],
    subject: e["kaken:researchField"],
    amount: e["kaken:researchProject"]?.["kaken:totalCost"]
      ? Number(e["kaken:researchProject"]["kaken:totalCost"])
      : undefined,
    principalInvestigator: normalizePerson(pi),
    coInvestigators: co,
  };
}

interface SearchOpts {
  /** 機関名（部分一致、例: "東京大学医科学研究所"） */
  institutionName?: string;
  /** キーワード（課題名・概要対象） */
  keyword?: string;
  /** 1 ページ件数（最大 500） */
  rows?: number;
  /** ページ番号（1 始まり） */
  page?: number;
  /** appid。省略時は env から */
  appid?: string;
}

interface RawSearchResponse {
  feed?: {
    entry?: OpenSearchEntry[] | OpenSearchEntry;
    "opensearch:totalResults"?: number | string;
  };
}

/**
 * KAKEN OpenSearch で課題を検索する。
 */
export async function searchKakenGrants(
  opts: SearchOpts,
): Promise<{ grants: KakenGrant[]; total: number }> {
  const appid = opts.appid ?? process.env.KAKEN_APP_ID;
  if (!appid) {
    throw new Error(
      "KAKEN_APP_ID が未設定。https://support.nii.ac.jp/ja/cinii/api/developer で取得して .env に保存してください。",
    );
  }
  const params: Record<string, string> = {
    appid,
    format: "json",
    rw: String(opts.rows ?? 100),
    st: String(((opts.page ?? 1) - 1) * (opts.rows ?? 100) + 1),
  };
  if (opts.institutionName) params.i1 = opts.institutionName;
  if (opts.keyword) params.kw = opts.keyword;
  const url = `${BASE}?${new URLSearchParams(params).toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`KAKEN ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as RawSearchResponse;
  const entries = data.feed?.entry;
  const list = entries
    ? Array.isArray(entries)
      ? entries
      : [entries]
    : [];
  const grants: KakenGrant[] = [];
  for (const e of list) {
    const g = normalizeGrant(e);
    if (g) grants.push(g);
  }
  const total = Number(data.feed?.["opensearch:totalResults"] ?? grants.length);
  return { grants, total };
}

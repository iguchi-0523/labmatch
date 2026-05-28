/**
 * researchmap.jp の公開 JSON-LD プロファイルから研究者情報を取得する。
 *
 * - エンドポイント：`https://api.researchmap.jp/{permalink}?format=json`
 *   permalink は research_id（例: "read0090495"）
 * - 認証なしで読める（公開設定の研究者プロファイルのみ）
 * - 検索 API（researchers list）は OAuth が必要なので、本ライブラリは
 *   permalink が既知の場合に限り profile を取得・正規化する用途に絞る。
 *
 * 検索 API 不在のため Route 5 は主に「enrichment」用途：
 *   - OpenAlex / KAKEN で見つけた PI を researchmap で補完
 *   - ユーザが手動入力 / 削除依頼フォームで permalink を提供してきた場合
 */

const BASE = "https://api.researchmap.jp";

interface JsonLdLocalizedString {
  ja?: string;
  en?: string;
}

interface JsonLdAffiliation {
  affiliation?: JsonLdLocalizedString;
  section?: JsonLdLocalizedString;
  job?: JsonLdLocalizedString;
  from_date?: string;
  to_date?: string | null;
  is_present?: boolean;
}

export interface ResearchmapProfile {
  permalink: string;
  familyName: { ja?: string; en?: string };
  givenName: { ja?: string; en?: string };
  fullName: { ja?: string; en?: string };
  affiliations: {
    institution: { ja?: string; en?: string };
    section: { ja?: string; en?: string } | null;
    position: { ja?: string; en?: string } | null;
    isPresent: boolean;
  }[];
  /** ORCID（含まれていれば） */
  orcid: string | null;
  /** researcher_number（含まれていれば、e-Rad ID 8 桁） */
  researcherNumber: string | null;
}

/**
 * researchmap permalink から研究者プロファイルを取得・正規化する。
 * 取得失敗時は null。
 */
export async function fetchResearchmapProfile(
  permalink: string,
): Promise<ResearchmapProfile | null> {
  const url = `${BASE}/${encodeURIComponent(permalink)}?format=json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const txt = await res.text();
  if (txt.trim().startsWith("<")) return null; // HTML が返ったら不正
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(txt);
  } catch {
    return null;
  }

  const fam = (data.family_name as JsonLdLocalizedString | undefined) ?? {};
  const giv = (data.given_name as JsonLdLocalizedString | undefined) ?? {};
  const full: { ja?: string; en?: string } = {};
  if (fam.ja || giv.ja) full.ja = `${fam.ja ?? ""}${giv.ja ?? ""}`.trim();
  if (fam.en || giv.en)
    full.en = `${giv.en ?? ""} ${fam.en ?? ""}`.trim();

  const affsRaw = (data.affiliations as JsonLdAffiliation[] | undefined) ?? [];
  const affiliations = affsRaw.map((a) => ({
    institution: a.affiliation ?? {},
    section: a.section ?? null,
    position: a.job ?? null,
    isPresent: Boolean(a.is_present),
  }));

  // researcher_number, orcid は dedicated key で来る場合と external_ids 配列の
  // 場合がある。両方を試みる。
  let orcid: string | null = (data.orcid_id as string | undefined) ?? null;
  let researcherNumber: string | null =
    (data.researcher_number as string | undefined) ?? null;
  const externalIds = data.external_ids as
    | { id_name?: string; id?: string }[]
    | undefined;
  if (externalIds) {
    for (const x of externalIds) {
      const n = (x.id_name ?? "").toLowerCase();
      if (!orcid && n.includes("orcid") && x.id) orcid = x.id;
      if (!researcherNumber && n.includes("researcher") && x.id)
        researcherNumber = x.id;
    }
  }

  return {
    permalink,
    familyName: fam,
    givenName: giv,
    fullName: full,
    affiliations,
    orcid,
    researcherNumber,
  };
}

/**
 * 既存ラボに researchmap permalink が無い場合に、姓名 + 所属で「あたり」を付ける用途。
 *
 * researchmap には公開 search API が無いため、Google `site:researchmap.jp` 経由の
 * 推定が実用的（Claude / 別ライブラリで実装）。本関数は将来拡張用のフック。
 */
export function buildResearchmapSearchUrl(opts: {
  name: string;
  affiliation?: string;
  section?: string;
}): string {
  const p = new URLSearchParams();
  p.set("name", opts.name);
  if (opts.affiliation) p.set("affiliation", opts.affiliation);
  if (opts.section) p.set("section", opts.section);
  return `https://researchmap.jp/researchers?${p.toString()}`;
}

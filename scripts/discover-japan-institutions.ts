import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";
import { getAllUniversities } from "../lib/universities";

/**
 * 日本の研究機関を OpenAlex で全列挙し、取り込み候補を整理する。
 *
 * 目的：
 *   OpenAlex の lineage に正しく親大学が紐付いていない研究機関
 *   （医科学研究所・IPMU・CiRA 等）は通常の親大学 ingest では拾えない。
 *   このスクリプトは country_code:JP の全 institution を列挙し、
 *
 *   1. 既に config / DB にある（取り込み済 or 登録予定）
 *   2. 未登録だが works_count が大きい（取り込み候補）
 *   3. 名前から親大学が推定できるもの（学内研究所候補）
 *
 *   をそれぞれ表にして stdout に出力する。
 *
 * 使い方:
 *   npx tsx scripts/discover-japan-institutions.ts                   # works>=500 で出力
 *   npx tsx scripts/discover-japan-institutions.ts --min-works=1000  # 閾値変更
 *   npx tsx scripts/discover-japan-institutions.ts --json            # JSON 出力
 */

const OPENALEX = "https://api.openalex.org";
const API_KEY = process.env.OPENALEX_API_KEY || "";

interface OAInstitution {
  id: string;
  display_name: string;
  display_name_acronyms?: string[];
  display_name_alternatives?: string[];
  type?: string;
  works_count?: number;
  lineage?: string[];
  associated_institutions?: { id: string; relationship?: string }[];
  country_code?: string;
}

interface OAList<T> {
  results: T[];
  meta: { next_cursor?: string | null };
}

function shortId(idOrUrl: string): string {
  return idOrUrl.startsWith("http")
    ? (idOrUrl.split("/").pop() ?? idOrUrl)
    : idOrUrl;
}

async function fetchJson<T>(url: string): Promise<T> {
  const u = new URL(url);
  if (API_KEY && !u.searchParams.has("api_key")) {
    u.searchParams.set("api_key", API_KEY);
  }
  const res = await fetch(u.toString());
  if (!res.ok) {
    throw new Error(`OpenAlex ${res.status} ${res.statusText}: ${url}`);
  }
  return res.json() as Promise<T>;
}

async function fetchAllJapanInstitutions(): Promise<OAInstitution[]> {
  const out: OAInstitution[] = [];
  let cursor: string = "*";
  while (cursor) {
    const url = `${OPENALEX}/institutions?filter=country_code:JP&per-page=200&cursor=${cursor}`;
    const data = await fetchJson<OAList<OAInstitution>>(url);
    out.push(...data.results);
    if (!data.meta.next_cursor || data.results.length === 0) break;
    cursor = data.meta.next_cursor;
  }
  return out;
}

interface ParentMatch {
  parentKey: string;
  parentName: string;
  reason: "lineage" | "name";
}

/**
 * institution に「親大学」が推定できるか判定する。
 * lineage に親大学の OpenAlex ID が含まれる、または display_name に親大学名を含む場合。
 */
function findParent(
  inst: OAInstitution,
  configMap: Map<
    string,
    { key: string; name: string; nameEn: string; openalexInstitutionId: string | null }
  >,
): ParentMatch | null {
  // lineage hit
  for (const lineageId of inst.lineage ?? []) {
    const id = shortId(lineageId);
    if (id === shortId(inst.id)) continue;
    for (const cfg of configMap.values()) {
      if (cfg.openalexInstitutionId === id) {
        return {
          parentKey: cfg.key,
          parentName: cfg.name,
          reason: "lineage",
        };
      }
    }
  }
  // name pattern hit
  const instNorm = (inst.display_name ?? "").toLowerCase();
  for (const cfg of configMap.values()) {
    const en = cfg.nameEn.toLowerCase().replace(/^the\s+/, "");
    if (en.length < 8) continue;
    if (instNorm !== cfg.nameEn.toLowerCase() && instNorm.includes(en)) {
      return {
        parentKey: cfg.key,
        parentName: cfg.name,
        reason: "name",
      };
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const minWorks = (() => {
    const a = args.find((s) => s.startsWith("--min-works="));
    return a ? Number(a.split("=")[1]) : 500;
  })();
  const json = args.includes("--json");

  console.log(`Fetching all Japanese institutions from OpenAlex...`);
  const all = await fetchAllJapanInstitutions();
  console.log(`  total: ${all.length} institutions`);

  // 候補として有用なもののみ：教育系・研究施設系のうち works_count が一定以上
  const TYPES_OK = new Set(["education", "facility", "archive", "healthcare"]);
  const candidates = all
    .filter((i) => (i.works_count ?? 0) >= minWorks)
    .filter((i) => !i.type || TYPES_OK.has(i.type))
    .sort((a, b) => (b.works_count ?? 0) - (a.works_count ?? 0));

  // config と DB の状態を読み込み
  const cfg = getAllUniversities();
  const configByOAId = new Map(
    cfg
      .filter((c) => c.openalexInstitutionId)
      .map((c) => [c.openalexInstitutionId!, c]),
  );
  const configByName = new Map(cfg.map((c) => [c.name, c]));
  const configMap = new Map<
    string,
    { key: string; name: string; nameEn: string; openalexInstitutionId: string | null }
  >(cfg.map((c) => [c.key, c]));

  const dbUnis = await prisma.university.findMany({
    include: { _count: { select: { labs: true } } },
  });
  const dbByName = new Map(dbUnis.map((u) => [u.name, u]));

  interface Row {
    oaId: string;
    name: string;
    type?: string;
    worksCount: number;
    inConfig: boolean;
    inDb: boolean;
    dbLabCount: number;
    parent: ParentMatch | null;
  }
  const rows: Row[] = candidates.map((i) => {
    const id = shortId(i.id);
    const inCfg = configByOAId.has(id) || configByName.has(i.display_name);
    const dbRec = dbByName.get(i.display_name);
    return {
      oaId: id,
      name: i.display_name,
      type: i.type,
      worksCount: i.works_count ?? 0,
      inConfig: inCfg,
      inDb: dbRec !== undefined,
      dbLabCount: dbRec?._count.labs ?? 0,
      parent: findParent(i, configMap),
    };
  });

  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    await prisma.$disconnect();
    return;
  }

  // セクション 1: 大型機関で未登録
  const unregistered = rows.filter((r) => !r.inConfig && !r.inDb);
  console.log(`\n=== 未登録の大規模機関（works_count ≥ ${minWorks}）${unregistered.length} 件 ===`);
  console.log(`# OpenAlex_ID         works  type           親推定                          機関名`);
  for (const r of unregistered.slice(0, 80)) {
    const parent = r.parent
      ? `${r.parent.parentName.padEnd(15)} (${r.parent.reason})`
      : "-".padEnd(30);
    console.log(
      `  ${r.oaId.padEnd(18)} ${String(r.worksCount).padStart(7)}  ${(r.type ?? "?").padEnd(13)} ${parent}  ${r.name}`,
    );
  }

  // セクション 2: 親大学推定がある未登録
  const withParent = rows.filter((r) => !r.inConfig && r.parent !== null);
  console.log(`\n=== 親大学推定あり：学内研究所候補 ${withParent.length} 件 ===`);
  for (const r of withParent.slice(0, 50)) {
    console.log(
      `  ${r.oaId.padEnd(18)} ${String(r.worksCount).padStart(7)}  → ${r.parent!.parentName.padEnd(20)} (${r.parent!.reason})  ${r.name}`,
    );
  }

  // セクション 3: 既に config / DB にあるもの
  const inSystem = rows.filter((r) => r.inConfig || r.inDb);
  console.log(`\n=== 取り込み済 / 登録済 ${inSystem.length} 件（参考、works>=${minWorks} のみ）===`);
  for (const r of inSystem.slice(0, 30)) {
    const status = r.inConfig
      ? r.inDb
        ? `cfg+db(${r.dbLabCount})`
        : "cfg"
      : `db(${r.dbLabCount})`;
    console.log(
      `  ${r.oaId.padEnd(18)} ${String(r.worksCount).padStart(7)}  [${status.padEnd(12)}]  ${r.name}`,
    );
  }

  console.log("\n=== サマリ ===");
  console.log(`  全日本機関（OpenAlex）: ${all.length}`);
  console.log(`  works_count ≥ ${minWorks} の候補: ${candidates.length}`);
  console.log(`    既登録: ${inSystem.length}`);
  console.log(`    未登録: ${unregistered.length}`);
  console.log(`      うち親大学推定あり: ${withParent.length}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";
import { getUniversityByKey } from "../lib/universities";
import { extractTagsForLab } from "../lib/tags";
import {
  buildIdentifierAncestorMap,
  getAllTreeIdentifiers,
} from "../lib/keyword-tree";

/**
 * 単一 OpenAlex Institution を直接 ingest するスクリプト。
 *
 * 動機：
 *   - 通常の `ingest-utokyo-life.ts` は親大学の lineage で検索し、その配下の
 *     研究センターを副産物として捉える。しかし「Kavli IPMU」「東大医科学研究所」
 *     等は OpenAlex の lineage に親大学が登録されておらず、lineage 経由では
 *     拾えない。
 *   - そこで institution ID を直接指定し、その institution に紐づく PI のみを
 *     `authorships.institutions.id:Ixxx` で抽出する。
 *
 * 親大学との関係：
 *   - `--parent-key=u-tokyo` を渡すと、その親大学を `University.parent` に
 *     設定して子センターとして表示できる。
 *   - parent-key を省略すれば単独の研究機関として登録する（OIST/RIKEN 等）。
 *
 * 使い方:
 *   npx tsx scripts/ingest-institution-direct.ts \
 *     --institution-id=I166644833 \
 *     --display-name="Kavli IPMU" \
 *     --parent-key=u-tokyo
 *
 *   npx tsx scripts/ingest-institution-direct.ts \
 *     --institution-id=I166644833 \
 *     --display-name="Kavli IPMU" \
 *     --parent-key=u-tokyo \
 *     --dry-run
 */

const OPENALEX = "https://api.openalex.org";
const API_KEY = process.env.OPENALEX_API_KEY || "";
const SINCE_YEAR = new Date().getFullYear() - 5;
const MIN_WORKS_COUNT = 5;
const MIN_H_INDEX = 3;
const MAX_WORKS_PER_PI = 100;
const DISCOVERY_PER_PAGE = 200;

const TAG_CONTEXT = {
  identifiers: getAllTreeIdentifiers(),
  ancestorMap: buildIdentifierAncestorMap(),
};

interface OAInstitutionRef {
  id: string;
  display_name?: string;
  lineage?: string[];
}

interface OAAuthor {
  id: string;
  display_name: string;
  orcid?: string | null;
  works_count?: number;
  summary_stats?: { h_index?: number };
  last_known_institutions?: OAInstitutionRef[];
  topics?: { field?: { id?: string; display_name?: string } }[];
}

interface OAWork {
  id: string;
  title: string | null;
  publication_year?: number;
  publication_date?: string;
  abstract_inverted_index?: Record<string, number[]> | null;
  doi?: string | null;
  cited_by_count?: number;
}

interface OAList<T> {
  results: T[];
  meta: { next_cursor?: string | null };
}

interface OAGroup {
  key: string;
  count: number;
}

function shortId(idOrUrl: string): string {
  return idOrUrl.startsWith("http")
    ? (idOrUrl.split("/").pop() ?? idOrUrl)
    : idOrUrl;
}

function buildUrl(
  path: string,
  params: Record<string, string> = {},
): string {
  const u = new URL(OPENALEX + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  if (API_KEY) u.searchParams.set("api_key", API_KEY);
  return u.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenAlex ${res.status} ${res.statusText}: ${url}`);
  }
  return res.json() as Promise<T>;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delays = [1000, 2000, 4000];
  let lastErr: unknown;
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === delays.length) break;
      console.warn(
        `  retry [${label}] in ${delays[i]}ms: ${
          e instanceof Error ? e.message : e
        }`,
      );
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`unknown error in ${label}`);
}

function reconstructAbstract(
  inv: Record<string, number[]> | null | undefined,
): string | null {
  if (!inv) return null;
  const pos: { word: string; idx: number }[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const p of positions) pos.push({ word, idx: p });
  }
  pos.sort((a, b) => a.idx - b.idx);
  return pos.map((p) => p.word).join(" ");
}

/**
 * institution の PIs を直接 group_by で取得（lineage を使わず、institutions.id 直接）。
 */
async function discoverCandidates(
  institutionId: string,
): Promise<OAGroup[]> {
  const url = buildUrl("/works", {
    filter: [
      `authorships.institutions.id:${institutionId}`,
      `from_publication_date:${SINCE_YEAR}-01-01`,
      "type:article",
    ].join(","),
    group_by: "authorships.author.id",
    per_page: String(DISCOVERY_PER_PAGE),
    sort: "count:desc",
  });
  const data = await withRetry<{ group_by: OAGroup[] }>(
    () => fetchJson(url),
    "discover",
  );
  return data.group_by ?? [];
}

async function fetchAuthor(authorId: string): Promise<OAAuthor> {
  const url = buildUrl(`/authors/${shortId(authorId)}`);
  return withRetry<OAAuthor>(() => fetchJson(url), `author ${shortId(authorId)}`);
}

async function fetchPIWorks(authorId: string): Promise<OAWork[]> {
  const out: OAWork[] = [];
  let cursor: string = "*";
  while (out.length < MAX_WORKS_PER_PI && cursor) {
    const url = buildUrl("/works", {
      filter: [
        `author.id:${shortId(authorId)}`,
        `from_publication_date:${SINCE_YEAR}-01-01`,
        "type:article",
      ].join(","),
      per_page: String(Math.min(100, MAX_WORKS_PER_PI - out.length)),
      sort: "publication_date:desc",
      cursor,
    });
    const data = await withRetry<OAList<OAWork>>(() => fetchJson(url), `works`);
    out.push(...data.results);
    if (!data.meta.next_cursor || data.results.length === 0) break;
    cursor = data.meta.next_cursor;
  }
  return out.slice(0, MAX_WORKS_PER_PI);
}

interface VerifiedPI {
  authorId: string;
  displayName: string;
  orcid: string | null;
  worksCount: number;
  hIndex: number;
  primaryFieldCode: string | null;
  primaryFieldName: string | null;
}

function verifyAuthor(
  author: OAAuthor,
  institutionId: string,
): VerifiedPI | null {
  const insts = author.last_known_institutions ?? [];
  const found = insts.some((inst) => shortId(inst.id) === institutionId);
  if (!found) return null;

  const wc = author.works_count ?? 0;
  if (wc < MIN_WORKS_COUNT) return null;

  const h = author.summary_stats?.h_index ?? 0;
  if (h < MIN_H_INDEX) return null;

  const primary = author.topics?.[0];
  const fieldCode = primary?.field?.id
    ? shortId(primary.field.id).replace(/^fields\//, "")
    : null;
  const fieldName = primary?.field?.display_name ?? null;

  return {
    authorId: author.id,
    displayName: author.display_name,
    orcid: author.orcid ?? null,
    worksCount: wc,
    hIndex: h,
    primaryFieldCode: fieldCode,
    primaryFieldName: fieldName,
  };
}

function parseArgs(argv: string[]) {
  const get = (k: string): string | undefined => {
    const a = argv.find((s) => s.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : undefined;
  };
  return {
    institutionId: get("institution-id"),
    displayName: get("display-name"),
    parentKey: get("parent-key"),
    dryRun: argv.includes("--dry-run"),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.institutionId || !args.displayName) {
    console.error(
      "Usage: --institution-id=Ixxx --display-name=\"Kavli IPMU\" [--parent-key=u-tokyo] [--dry-run]",
    );
    process.exit(1);
  }
  if (!API_KEY) {
    console.error("OPENALEX_API_KEY が .env に未設定");
    process.exit(1);
  }

  // 親大学を解決（オプション）
  let parentUni: { id: number; name: string; prefecture: string | null } | null =
    null;
  let parentCategory: string | null = null;
  if (args.parentKey) {
    const cfg = getUniversityByKey(args.parentKey);
    if (!cfg) {
      console.error(`Parent key "${args.parentKey}" not found in config`);
      process.exit(1);
    }
    const row = await prisma.university.findUnique({
      where: { name: cfg.name },
      select: { id: true, name: true, prefecture: true },
    });
    if (!row) {
      console.error(
        `Parent "${cfg.name}" not found in DB; ingest parent first`,
      );
      process.exit(1);
    }
    parentUni = row;
    parentCategory = cfg.category;
    console.log(`  parent: ${row.name} (id=${row.id})`);
  }

  console.log(
    `\n=== Ingest ${args.displayName} (${args.institutionId}) ===`,
  );
  const start = Date.now();

  // Phase 1: discover candidates
  console.log("[1/3] Discovering candidates...");
  const groups = await discoverCandidates(args.institutionId);
  const candidateIds = groups.map((g) => g.key);
  console.log(`  ${candidateIds.length} candidate authors`);

  // Phase 2: verify
  console.log(`[2/3] Verifying PIs (works≥${MIN_WORKS_COUNT}, h≥${MIN_H_INDEX})...`);
  const verified: VerifiedPI[] = [];
  for (let i = 0; i < candidateIds.length; i += 5) {
    const batch = candidateIds.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const a = await fetchAuthor(id);
          return verifyAuthor(a, args.institutionId!);
        } catch (e) {
          console.warn(
            `  verify ${id} FAIL: ${e instanceof Error ? e.message : e}`,
          );
          return null;
        }
      }),
    );
    for (const v of results) if (v) verified.push(v);
  }
  console.log(`  verified: ${verified.length}`);

  if (args.dryRun) {
    console.log("\n[DRY RUN] not writing to DB. Sample PIs:");
    for (const pi of verified.slice(0, 10)) {
      console.log(`  - ${pi.displayName} (works=${pi.worksCount}, h=${pi.hIndex})`);
    }
    await prisma.$disconnect();
    return;
  }

  // Phase 3: upsert child University + labs + LabAffiliation
  console.log(`[3/3] Upserting University and ${verified.length} labs...`);
  const childUni = await prisma.university.upsert({
    where: { name: args.displayName },
    update: {
      parentId: parentUni?.id ?? null,
      category: parentUni ? "research-institute" : (parentCategory ?? "research-institute"),
      prefecture: parentUni?.prefecture ?? null,
    },
    create: {
      name: args.displayName,
      parentId: parentUni?.id ?? null,
      category: parentUni ? "research-institute" : "research-institute",
      prefecture: parentUni?.prefecture ?? null,
    },
  });
  console.log(`  University: id=${childUni.id}`);

  let labCount = 0;
  let workInserted = 0;
  let labFailed = 0;
  for (const pi of verified) {
    // 個別ラボ単位で try / catch。Railway 接続切れで止まらないように。
    try {
    const works = await fetchPIWorks(pi.authorId).catch(() => [] as OAWork[]);

    // 複数所属：既存ラボがあれば universityId を更新せず、affiliation のみ追加
    const existing = await prisma.lab.findUnique({
      where: { openalexAuthorId: pi.authorId },
      include: { university: { select: { id: true, parentId: true } } },
    });
    let labUniversityId = childUni.id;
    if (existing) {
      const existingFamilyRoot =
        existing.university.parentId ?? existing.university.id;
      const newFamilyRoot = parentUni?.id ?? childUni.id;
      if (existingFamilyRoot !== newFamilyRoot) {
        labUniversityId = existing.universityId; // 別 family なら維持
      }
    }

    const lab = await prisma.lab.upsert({
      where: { openalexAuthorId: pi.authorId },
      update: {
        professorName: pi.displayName,
        universityId: labUniversityId,
        orcid: pi.orcid,
        primaryFieldCode: pi.primaryFieldCode,
        primaryFieldName: pi.primaryFieldName,
        department: null,
      },
      create: {
        universityId: labUniversityId,
        name: `${pi.displayName} 研究室`,
        professorName: pi.displayName,
        openalexAuthorId: pi.authorId,
        orcid: pi.orcid,
        primaryFieldCode: pi.primaryFieldCode,
        primaryFieldName: pi.primaryFieldName,
      },
    });

    // 兼任所属の登録（重複しないように upsert）
    await prisma.labAffiliation.upsert({
      where: {
        labId_universityId: {
          labId: lab.id,
          universityId: childUni.id,
        },
      },
      update: {},
      create: {
        labId: lab.id,
        universityId: childUni.id,
        isPrimary: labUniversityId === childUni.id,
      },
    });
    // 親大学への所属も登録
    if (parentUni) {
      await prisma.labAffiliation.upsert({
        where: {
          labId_universityId: {
            labId: lab.id,
            universityId: parentUni.id,
          },
        },
        update: {},
        create: {
          labId: lab.id,
          universityId: parentUni.id,
          isPrimary: false,
        },
      });
    }
    // 主所属 lab.universityId にも affiliation を登録（既存ラボ移動先用）
    if (labUniversityId !== childUni.id) {
      await prisma.labAffiliation.upsert({
        where: {
          labId_universityId: {
            labId: lab.id,
            universityId: labUniversityId,
          },
        },
        update: { isPrimary: true },
        create: {
          labId: lab.id,
          universityId: labUniversityId,
          isPrimary: true,
        },
      });
    }

    // works insert
    for (const w of works) {
      if (!w.title) continue;
      const exists = await prisma.work.findFirst({
        where: { labId: lab.id, sourceUrl: w.id },
        select: { id: true },
      });
      if (exists) continue;
      const abstract = reconstructAbstract(w.abstract_inverted_index);
      await prisma.work.create({
        data: {
          labId: lab.id,
          title: w.title,
          year: w.publication_year ?? null,
          sourceUrl: w.id,
          doi: w.doi ?? null,
          abstract,
          hasAbstract: abstract !== null,
        },
      });
      workInserted++;
    }

    // タグ再計算
    const labWorks = await prisma.work.findMany({
      where: { labId: lab.id },
      select: { title: true, titleJa: true },
      take: 25,
      orderBy: { year: "desc" },
    });
    const tags = extractTagsForLab(
      { aiSummary: existing?.aiSummary ?? null, works: labWorks },
      TAG_CONTEXT,
      20,
    );
    await prisma.lab.update({
      where: { id: lab.id },
      data: { tags, tagsGeneratedAt: new Date() },
    });

    labCount++;
    } catch (e) {
      labFailed++;
      console.warn(
        `  lab ${pi.displayName} FAIL: ${e instanceof Error ? e.message : e}`,
      );
      // 接続切れ等の一時的エラーから復帰するための小休止
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s — labs=${labCount}, works inserted=${workInserted}, failed=${labFailed}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

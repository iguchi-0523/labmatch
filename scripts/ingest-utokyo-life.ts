import { config } from "dotenv";
// 空文字で先に export されている env を .env で上書き
config({ override: true });
import { prisma } from "../lib/db";
import {
  getEnabledUniversities,
  getFieldIdsForGroups,
  getUniversityByKey,
  type University,
} from "../lib/universities";
import { extractTagsForLab } from "../lib/tags";
import { getAllTreeKeywords } from "../lib/keyword-tree";

// ingest 時に使う tag 候補（プロセス起動時に 1 度だけ読み込み）
const TAG_CANDIDATES = getAllTreeKeywords();

/**
 * 戦略1：OpenAlex から東京大学の生命科学系＋医学系 PI を一括取り込みする。
 *
 * パイプライン:
 *   1. discoverCandidatesForField(fieldId) × 7 fields → 候補 PI を網羅収集（重複排除）
 *   2. verifyPIs() で last_known_institutions.lineage に東大が含まれ、
 *      works_count≥20 / h_index≥5 を満たす PI に絞り込み
 *   3. fetchPIWorks() で各 PI の直近5年・journal-article を最大100件取得
 *   4. Lab を openalexAuthorId キーで upsert、Work を (labId, sourceUrl) で重複排除
 *
 * 想定: 1,000〜1,500 API calls / 10〜15 分
 * 認証: OPENALEX_API_KEY 必須（2026/2/13 以降）。
 *       公式仕様に従い `api_key=KEY` を URL パラメータで送る（Bearer ヘッダではない）。
 *       キー取得は https://openalex.org/settings/api
 *
 * 使い方:
 *   npx tsx scripts/ingest-utokyo-life.ts            # 本実行
 *   npx tsx scripts/ingest-utokyo-life.ts --dry-run  # API 取得のみ、DB 書き込みなし
 *   npx tsx scripts/ingest-utokyo-life.ts --university=u-tokyo  # 大学キー指定
 */

const OPENALEX = "https://api.openalex.org";
const API_KEY = process.env.OPENALEX_API_KEY;
const MAILTO = process.env.OPENALEX_MAILTO;

const SINCE_YEAR = new Date().getFullYear() - 5;
const MIN_WORKS_COUNT = 20;
const MIN_H_INDEX = 5;
const MAX_WORKS_PER_PI = 100;
const PARALLEL = 3;
const DISCOVERY_PER_FIELD = 200; // OpenAlex group_by 上限
const MIN_SUBFIELD_COUNT = 2;    // subfield 内 works=1 のみの著者は捨てる（ノイズ抑制）

interface CliArgs {
  dryRun: boolean;
  universityKey: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  let dryRun = false;
  let universityKey: string | null = null;
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--university=")) universityKey = a.split("=", 2)[1];
    else throw new Error(`Unknown argument: ${a}`);
  }
  return { dryRun, universityKey };
}

// ----- HTTP helpers -----

function buildUrl(
  path: string,
  params: Record<string, string | undefined> = {},
): string {
  const u = new URL(OPENALEX + path);
  if (API_KEY) u.searchParams.set("api_key", API_KEY);
  if (MAILTO) u.searchParams.set("mailto", MAILTO);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) u.searchParams.set(k, v);
  }
  return u.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAlex ${res.status} ${res.statusText}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delays = [1000, 2000, 4000, 8000];
  let lastErr: unknown;
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === delays.length) break;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  retry [${label}] in ${delays[i]}ms: ${msg.slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
  throw lastErr;
}

async function processInBatches<T, U>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<U>,
): Promise<U[]> {
  const results: U[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const batch = await Promise.all(slice.map((it, j) => fn(it, i + j)));
    results.push(...batch);
  }
  return results;
}

function shortId(id: string): string {
  return id.replace(/.*\//, "");
}

function reconstructAbstract(
  inv: Record<string, number[]> | null,
): string | null {
  if (!inv) return null;
  const positions: { word: string; pos: number }[] = [];
  for (const [word, indices] of Object.entries(inv)) {
    for (const i of indices) positions.push({ word, pos: i });
  }
  if (positions.length === 0) return null;
  positions.sort((a, b) => a.pos - b.pos);
  return positions.map((p) => p.word).join(" ");
}

// ----- OpenAlex types -----

interface OAGroup {
  key: string; // 著者ID URL
  key_display_name: string;
  count: number;
}

interface OAGroupResponse {
  group_by: OAGroup[];
}

interface OAInstitutionRef {
  id: string;
  display_name: string;
  lineage?: string[];
}

interface OATopic {
  id: string;
  display_name: string;
  field?: { id: string; display_name: string };
}

interface OAAuthor {
  id: string;
  display_name: string;
  display_name_alternatives?: string[];
  orcid?: string | null;
  works_count?: number;
  summary_stats?: { h_index?: number };
  last_known_institutions?: OAInstitutionRef[];
  topics?: OATopic[];
}

interface OAWork {
  id: string;
  title: string | null;
  publication_year: number | null;
  doi: string | null;
  type: string | null;
  abstract_inverted_index: Record<string, number[]> | null;
}

interface OAList<T> {
  results: T[];
  meta: { count: number; next_cursor?: string | null };
}

// ----- Discovery: 候補 PI を field + subfield の group_by で収集（ユニオン） -----

interface PICandidate {
  authorId: string;
  displayName: string;
  workCountInField: number; // field/subfield のどれかでの最大 count
  matchedFields: Set<number>;
  matchedSubfields: Set<number>;
}

type DiscoveryBucket =
  | { kind: "field"; id: number }
  | { kind: "subfield"; id: number };

function addCandidate(
  map: Map<string, PICandidate>,
  g: OAGroup,
  bucket: DiscoveryBucket,
): void {
  const existing = map.get(g.key);
  if (existing) {
    existing.workCountInField = Math.max(existing.workCountInField, g.count);
    if (bucket.kind === "field") existing.matchedFields.add(bucket.id);
    else existing.matchedSubfields.add(bucket.id);
  } else {
    map.set(g.key, {
      authorId: g.key,
      displayName: g.key_display_name,
      workCountInField: g.count,
      matchedFields: bucket.kind === "field" ? new Set([bucket.id]) : new Set(),
      matchedSubfields:
        bucket.kind === "subfield" ? new Set([bucket.id]) : new Set(),
    });
  }
}

async function discoverCandidatesForField(
  institutionId: string,
  fieldId: number,
): Promise<OAGroup[]> {
  const url = buildUrl("/works", {
    filter: [
      `authorships.institutions.lineage:${institutionId}`,
      `primary_topic.field.id:fields/${fieldId}`,
      `from_publication_date:${SINCE_YEAR}-01-01`,
      "type:article",
    ].join(","),
    group_by: "authorships.author.id",
    per_page: String(DISCOVERY_PER_FIELD),
    sort: "count:desc",
  });
  const data = await withRetry(
    () => fetchJson<OAGroupResponse>(url),
    `discover field=${fieldId}`,
  );
  return data.group_by ?? [];
}

async function fetchSubfieldIdsForField(fieldId: number): Promise<number[]> {
  const url = buildUrl("/subfields", {
    filter: `field.id:fields/${fieldId}`,
    per_page: "200",
  });
  const data = await withRetry(
    () => fetchJson<OAList<{ id: string }>>(url),
    `subfields field=${fieldId}`,
  );
  return data.results.map((s) =>
    Number(shortId(s.id).replace(/^subfields\//, "")),
  );
}

async function discoverCandidatesForSubfield(
  institutionId: string,
  subfieldId: number,
): Promise<OAGroup[]> {
  const url = buildUrl("/works", {
    filter: [
      `authorships.institutions.lineage:${institutionId}`,
      `primary_topic.subfield.id:subfields/${subfieldId}`,
      `from_publication_date:${SINCE_YEAR}-01-01`,
      "type:article",
    ].join(","),
    group_by: "authorships.author.id",
    per_page: String(DISCOVERY_PER_FIELD),
    sort: "count:desc",
  });
  const data = await withRetry(
    () => fetchJson<OAGroupResponse>(url),
    `discover subfield=${subfieldId}`,
  );
  return data.group_by ?? [];
}

async function discoverAllCandidates(
  uni: University,
  fieldIds: number[],
): Promise<Map<string, PICandidate>> {
  if (!uni.openalexInstitutionId) {
    throw new Error(
      `University ${uni.key} has no openalexInstitutionId — fill it in config/universities.json`,
    );
  }
  const instId = uni.openalexInstitutionId;
  const candidates = new Map<string, PICandidate>();

  // [phase 1/2] field-level discovery（top of class を高速に拾う）
  console.log(`  Phase 1: field-level discovery (${fieldIds.length} fields)`);
  for (const fieldId of fieldIds) {
    const groups = await discoverCandidatesForField(instId, fieldId);
    console.log(`    field=${fieldId}: ${groups.length} groups`);
    for (const g of groups) addCandidate(candidates, g, { kind: "field", id: fieldId });
  }
  const afterField = candidates.size;
  console.log(`  → unique after field phase: ${afterField}`);

  // [phase 2/2] subfield-level discovery（field 内の長尾をカバー）
  console.log(`  Phase 2: subfield-level discovery`);
  const subfieldIds: number[] = [];
  for (const fieldId of fieldIds) {
    const subs = await fetchSubfieldIdsForField(fieldId);
    subfieldIds.push(...subs);
  }
  console.log(`    enumerated ${subfieldIds.length} subfields across ${fieldIds.length} fields`);

  const subfieldResults = await processInBatches(
    subfieldIds,
    PARALLEL,
    async (subfieldId) => {
      const groups = await discoverCandidatesForSubfield(instId, subfieldId);
      const usable = groups.filter((g) => g.count >= MIN_SUBFIELD_COUNT);
      return { subfieldId, total: groups.length, usable };
    },
  );
  let usableTotal = 0;
  for (const r of subfieldResults) {
    for (const g of r.usable)
      addCandidate(candidates, g, { kind: "subfield", id: r.subfieldId });
    usableTotal += r.usable.length;
  }
  const added = candidates.size - afterField;
  console.log(
    `    usable group hits: ${usableTotal} across ${subfieldResults.length} subfields`,
  );
  console.log(
    `  → unique after subfield phase: ${candidates.size} (+${added} from subfield-only)`,
  );

  return candidates;
}

// ----- Verification: lineage + works_count + h_index -----

async function fetchAuthor(authorId: string): Promise<OAAuthor> {
  const url = buildUrl(`/authors/${shortId(authorId)}`);
  return withRetry(
    () => fetchJson<OAAuthor>(url),
    `author ${shortId(authorId)}`,
  );
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
  const inLineage = insts.some((inst) => {
    if (shortId(inst.id) === institutionId) return true;
    return (inst.lineage ?? []).some((l) => shortId(l) === institutionId);
  });
  if (!inLineage) return null;

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

// ----- Fetch works for a PI (cursor pagination, up to MAX_WORKS_PER_PI) -----

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
    const data = await withRetry(
      () => fetchJson<OAList<OAWork>>(url),
      `works ${shortId(authorId)}`,
    );
    out.push(...data.results);
    if (!data.meta.next_cursor || data.results.length === 0) break;
    cursor = data.meta.next_cursor;
  }
  return out.slice(0, MAX_WORKS_PER_PI);
}

// ----- DB upsert -----

interface UpsertCounts {
  labsUpserted: number;
  worksInserted: number;
  worksSkipped: number;
}

async function upsertPIAndWorks(
  uni: University,
  pi: VerifiedPI,
  works: OAWork[],
  dryRun: boolean,
): Promise<UpsertCounts> {
  if (dryRun) {
    return { labsUpserted: 1, worksInserted: works.length, worksSkipped: 0 };
  }

  const universityRow = await prisma.university.upsert({
    where: { name: uni.name },
    update: { prefecture: uni.prefecture },
    create: { name: uni.name, prefecture: uni.prefecture },
  });

  const lab = await prisma.lab.upsert({
    where: { openalexAuthorId: pi.authorId },
    update: {
      professorName: pi.displayName,
      universityId: universityRow.id,
      orcid: pi.orcid,
      primaryFieldCode: pi.primaryFieldCode,
      primaryFieldName: pi.primaryFieldName,
    },
    create: {
      universityId: universityRow.id,
      name: `${pi.displayName} 研究室`,
      professorName: pi.displayName,
      openalexAuthorId: pi.authorId,
      orcid: pi.orcid,
      primaryFieldCode: pi.primaryFieldCode,
      primaryFieldName: pi.primaryFieldName,
    },
  });

  let inserted = 0;
  let skipped = 0;
  for (const w of works) {
    if (!w.title) {
      skipped++;
      continue;
    }
    const exists = await prisma.work.findFirst({
      where: { labId: lab.id, sourceUrl: w.id },
      select: { id: true },
    });
    if (exists) {
      skipped++;
      continue;
    }
    const abstract = reconstructAbstract(w.abstract_inverted_index);
    await prisma.work.create({
      data: {
        labId: lab.id,
        title: w.title,
        abstract,
        hasAbstract: abstract !== null,
        year: w.publication_year,
        doi: w.doi,
        sourceUrl: w.id,
        type: w.type ?? "article",
      },
    });
    inserted++;
  }

  // 自動タグ計算（works タイトル + abstract から KEYWORD_TREE leaf を頻度マッチ）
  // aiSummary は別工程で生成されるため、ここでは title + abstract のみが corpus。
  // 後で backfill:tags で aiSummary 込みに再計算可能。
  try {
    const tagSourceWorks = works
      .filter((w) => w.title)
      .map((w) => ({
        title: w.title as string,
        // OpenAlex の reconstructed abstract を titleJa スロットに乗せて corpus に含める
        titleJa: reconstructAbstract(w.abstract_inverted_index),
      }));
    const tags = extractTagsForLab(
      { aiSummary: null, works: tagSourceWorks },
      TAG_CANDIDATES,
      12,
    );
    await prisma.lab.update({
      where: { id: lab.id },
      data: { tags, tagsGeneratedAt: new Date() },
    });
  } catch (e) {
    console.warn(
      `  tag computation failed for ${pi.displayName}: ${e instanceof Error ? e.message : e}`,
    );
  }

  return { labsUpserted: 1, worksInserted: inserted, worksSkipped: skipped };
}

// ----- Main -----

async function processUniversity(
  uni: University,
  fieldIds: number[],
  dryRun: boolean,
) {
  console.log(`\n=== ${uni.name} (${uni.openalexInstitutionId}) ===`);
  const start = Date.now();

  console.log(`[1/3] Discovering candidates across ${fieldIds.length} fields...`);
  const candidates = await discoverAllCandidates(uni, fieldIds);
  console.log(`  Unique candidates: ${candidates.size}`);

  console.log(`[2/3] Verifying PIs (lineage + works_count≥${MIN_WORKS_COUNT} + h_index≥${MIN_H_INDEX})...`);
  const candidateIds = [...candidates.keys()];
  const verified = await processInBatches(candidateIds, PARALLEL, async (id) => {
    try {
      const author = await fetchAuthor(id);
      return verifyAuthor(author, uni.openalexInstitutionId!);
    } catch (e) {
      console.warn(`  verify ${shortId(id)} FAIL: ${e instanceof Error ? e.message : e}`);
      return null;
    }
  });
  const pis = verified.filter((v): v is VerifiedPI => v !== null);
  console.log(`  Verified PIs: ${pis.length} / ${candidateIds.length}`);

  console.log(`[3/3] Fetching works (≤${MAX_WORKS_PER_PI}/PI, ≥${SINCE_YEAR}, type=article)...`);
  let totalLabs = 0;
  let totalWorksInserted = 0;
  let totalWorksSkipped = 0;
  const results = await processInBatches(pis, PARALLEL, async (pi, idx) => {
    try {
      const works = await fetchPIWorks(pi.authorId);
      const counts = await upsertPIAndWorks(uni, pi, works, dryRun);
      if ((idx + 1) % 10 === 0 || idx + 1 === pis.length) {
        console.log(`  [${idx + 1}/${pis.length}] ${pi.displayName}: works=${works.length}, +${counts.worksInserted}/-${counts.worksSkipped}`);
      }
      return counts;
    } catch (e) {
      console.warn(`  fetch ${shortId(pi.authorId)} FAIL: ${e instanceof Error ? e.message : e}`);
      return { labsUpserted: 0, worksInserted: 0, worksSkipped: 0 };
    }
  });
  for (const r of results) {
    totalLabs += r.labsUpserted;
    totalWorksInserted += r.worksInserted;
    totalWorksSkipped += r.worksSkipped;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s — labs=${totalLabs}, works inserted=${totalWorksInserted}, skipped=${totalWorksSkipped}${dryRun ? " (DRY RUN)" : ""}`);
  return { labs: totalLabs, worksInserted: totalWorksInserted, worksSkipped: totalWorksSkipped };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!API_KEY) {
    console.error(
      "ERROR: OPENALEX_API_KEY is not set. After 2026/02/13 the OpenAlex API requires a key.\n" +
        "  1) Create a free account at https://openalex.org/\n" +
        "  2) Copy your key from https://openalex.org/settings/api\n" +
        "  3) Add to .env: OPENALEX_API_KEY=...\n" +
        "  4) Re-run.",
    );
    process.exit(1);
  }

  const targets = args.universityKey
    ? [getUniversityByKey(args.universityKey)].filter(
        (u): u is University => u !== undefined,
      )
    : getEnabledUniversities();

  if (targets.length === 0) {
    console.error("No enabled universities found.");
    process.exit(1);
  }

  const fieldIds = getFieldIdsForGroups(["life", "health"]);
  console.log(
    `Targets: ${targets.map((t) => t.key).join(", ")}\n` +
      `Fields: ${fieldIds.join(",")} (life + health)\n` +
      `Since: ${SINCE_YEAR}-01-01\n` +
      `Dry-run: ${args.dryRun}`,
  );

  for (const uni of targets) {
    if (!uni.openalexInstitutionId) {
      console.warn(`SKIP ${uni.key}: openalexInstitutionId is null`);
      continue;
    }
    await processUniversity(uni, fieldIds, args.dryRun);
  }

  if (!args.dryRun) {
    const uniCount = await prisma.university.count();
    const labCount = await prisma.lab.count({ where: { deletedAt: null } });
    const workCount = await prisma.work.count();
    const withAbs = await prisma.work.count({ where: { hasAbstract: true } });
    console.log(
      `\n=== DB state ===\nuniversities=${uniCount}, labs=${labCount}, works=${workCount} (hasAbstract=${withAbs})`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

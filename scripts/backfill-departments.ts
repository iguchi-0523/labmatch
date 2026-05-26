import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";
import { getUniversityByName } from "../lib/universities";

/**
 * 既存ラボに OpenAlex Author API から「最具体的 institution」を取得して
 * `department` に書き込む。
 *
 * 動機:
 *   ingest-utokyo-life.ts は当初 PI を親大学のみ紐付けで保存しており、
 *   PI が「東京大学 医科学研究所」「東京大学 IPMU」「京大 CiRA」のような
 *   研究センター所属でも、その情報が失われていた。本スクリプトで遡及的に補う。
 *
 * 仕様:
 *   - 対象: department が null かつ openalexAuthorId を持つラボ
 *   - 親大学の OpenAlex InstitutionId は config の `universities.json` から
 *     逆引き（null のときは Institutions API で nameEn から resolve）
 *   - 親大学 lineage を持つ最初の sub-institution を採用
 *   - 並列度 5、約 700 ラボ/分（OpenAlex のレート制限を考慮）
 *
 * 使い方:
 *   npx tsx scripts/backfill-departments.ts             # 全件
 *   npx tsx scripts/backfill-departments.ts --limit=100 # 先頭 100 件のみ
 *   npx tsx scripts/backfill-departments.ts --dry-run   # DB 書き込みなし
 */

const OPENALEX = "https://api.openalex.org";
const PARALLEL = 5;
const API_KEY = process.env.OPENALEX_API_KEY || "";

interface OAInstitutionRef {
  id: string;
  display_name?: string;
  lineage?: string[];
}
interface OAAuthor {
  id: string;
  display_name: string;
  last_known_institutions?: OAInstitutionRef[];
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

/** 大学名から「the」と前後空白を除いた検索用の lowercase 文字列を作る */
function normalizeUniName(s: string): string {
  return s
    .toLowerCase()
    .replace(/^the\s+/, "")
    .trim();
}

/**
 * institution の display_name が、parent の sub-unit と判定できるか。
 *
 * 条件: parent name が name 内に出現し、かつ
 *   - 前の文字が start / 空白 / カンマ
 *   - 後の文字が end / カンマ / ピリオド / 「サブ単位を示す語」（Hospital / Institute / Center 等）の前置空白
 *
 * 例:
 *   "University of Tokyo Hospital"       ✓ (後: " hospital")
 *   "University of Tokyo Health Sciences" ✓ (後: " health")
 *   ", University of Tokyo"               ✓ (前: ',' 後: end)
 *   "Hokkaido University of Science"      ✗ (後: " of science" は許可外)
 */
const SUB_UNIT_TOKENS = [
  "hospital",
  "center",
  "centre",
  "institute",
  "school",
  "graduate",
  "faculty",
  "department",
  "laboratory",
  "research",
  "health",
  "medical",
  "library",
  "museum",
  "observatory",
];

function isSubInstitution(name: string, parentNorm: string): boolean {
  const n = normalizeUniName(name);
  if (n === parentNorm) return false;
  const idx = n.indexOf(parentNorm);
  if (idx === -1) return false;

  const beforeOk =
    idx === 0 || n[idx - 1] === " " || n[idx - 1] === ",";
  if (!beforeOk) return false;

  const endIdx = idx + parentNorm.length;
  if (endIdx >= n.length) return true; // 末尾
  const charAfter = n[endIdx];
  if (charAfter === "," || charAfter === ".") return true;
  if (charAfter === " ") {
    const remaining = n.slice(endIdx + 1);
    return SUB_UNIT_TOKENS.some((t) => remaining.startsWith(t));
  }
  return false;
}

/**
 * 親大学に紐付く最も具体的な institution を選ぶ。
 *
 * 2 段階で見る:
 *   1. OpenAlex の lineage 階層に親大学 ID を含む institution（理研センター等、
 *      正しく親子関係が登録されているケース）
 *   2. lineage には現れないが display_name に親大学名を含む institution
 *      （UTokyo Hospital や Institute of Medical Science of University of Tokyo
 *      などの「co-affiliation だが概念的には大学内」のケース）。
 *      境界条件付きで誤マッチを排除する。
 *
 * 親自身は除外。
 */
function pickMostSpecific(
  insts: OAInstitutionRef[],
  parentId: string,
  parentNameEn: string,
): string | null {
  // 1) lineage hit
  for (const inst of insts) {
    if (shortId(inst.id) === parentId) continue;
    const lineage = inst.lineage ?? [];
    if (lineage.some((l) => shortId(l) === parentId)) {
      return inst.display_name ?? null;
    }
  }
  // 2) name pattern hit（境界条件付き）
  const parentNorm = normalizeUniName(parentNameEn);
  if (parentNorm.length < 6) return null;
  for (const inst of insts) {
    if (shortId(inst.id) === parentId) continue;
    const name = inst.display_name ?? "";
    if (!name || name === parentNameEn) continue;
    if (isSubInstitution(name, parentNorm)) return name;
  }
  return null;
}

/** nameEn から OpenAlex Institution を解決（cache 付き） */
const resolveCache = new Map<string, string>();
async function resolveInstitutionId(nameEn: string): Promise<string> {
  const cached = resolveCache.get(nameEn);
  if (cached) return cached;
  const url = `${OPENALEX}/institutions?search=${encodeURIComponent(
    nameEn,
  )}&filter=country_code:JP&per-page=3`;
  interface OAInstitutionHit {
    id: string;
    display_name: string;
  }
  const result = await withRetry(
    () => fetchJson<{ results: OAInstitutionHit[] }>(url),
    `resolve ${nameEn}`,
  );
  const hits = result.results ?? [];
  if (hits.length === 0) throw new Error(`No institution match for "${nameEn}"`);
  const id = shortId(hits[0].id);
  resolveCache.set(nameEn, id);
  return id;
}

interface UniInfo {
  instId: string;
  nameEn: string;
}

async function getInstitutionInfoForUniversity(
  uniName: string,
): Promise<UniInfo | null> {
  const cfg = getUniversityByName(uniName);
  if (!cfg) {
    console.warn(`  no config entry for university "${uniName}"`);
    return null;
  }
  const instId =
    cfg.openalexInstitutionId ??
    (await resolveInstitutionId(cfg.nameEn).catch((e) => {
      console.warn(
        `  could not resolve institution for "${uniName}": ${
          e instanceof Error ? e.message : e
        }`,
      );
      return null;
    }));
  if (!instId) return null;
  return { instId, nameEn: cfg.nameEn };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  // 大学ごとに institution id を解決（バッチで使い回す）
  const universities = await prisma.university.findMany();
  const uniInfo = new Map<number, UniInfo | null>();
  for (const u of universities) {
    uniInfo.set(u.id, await getInstitutionInfoForUniversity(u.name));
  }

  const labs = await prisma.lab.findMany({
    where: {
      deletedAt: null,
      department: null,
      openalexAuthorId: { not: null },
    },
    select: {
      id: true,
      professorName: true,
      openalexAuthorId: true,
      universityId: true,
    },
    orderBy: { id: "asc" },
    take: limit,
  });
  console.log(
    `Backfilling department for ${labs.length} labs (dryRun=${dryRun})`,
  );

  const start = Date.now();
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (let i = 0; i < labs.length; i += PARALLEL) {
    const batch = labs.slice(i, i + PARALLEL);
    await Promise.all(
      batch.map(async (l) => {
        const info = uniInfo.get(l.universityId);
        if (!info) {
          failed++;
          return;
        }
        try {
          const author = await withRetry(
            () =>
              fetchJson<OAAuthor>(
                `${OPENALEX}/authors/${shortId(l.openalexAuthorId!)}`,
              ),
            `author ${l.id}`,
          );
          const dept = pickMostSpecific(
            author.last_known_institutions ?? [],
            info.instId,
            info.nameEn,
          );
          if (!dept) {
            unchanged++;
            return;
          }
          if (dryRun) {
            console.log(`  [dry] ${l.id} ${l.professorName} → ${dept}`);
          } else {
            await prisma.lab.update({
              where: { id: l.id },
              data: { department: dept },
            });
          }
          updated++;
        } catch (e) {
          console.warn(
            `  lab ${l.id} FAIL: ${e instanceof Error ? e.message : e}`,
          );
          failed++;
        }
      }),
    );
    if ((i + PARALLEL) % 50 === 0 || i + PARALLEL >= labs.length) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `  ${Math.min(i + PARALLEL, labs.length)}/${labs.length} (${elapsed}s) — updated=${updated}, unchanged=${unchanged}, failed=${failed}`,
      );
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s — updated=${updated}, unchanged=${unchanged}, failed=${failed}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

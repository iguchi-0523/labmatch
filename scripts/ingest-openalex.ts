import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * OpenAlex から旧帝大＋早慶の生命科学系研究者の論文を取り込むスクリプト。
 *
 * - 各大学の上位 N 名（生命科学系の論文を多く出している著者）を選ぶ
 * - 著者は OpenAlex 著者ID で識別、論文は OpenAlex Work URL を sourceUrl に保存
 * - polite pool（OPENALEX_MAILTO）を設定した場合は利用（任意）
 */

const OPENALEX = "https://api.openalex.org";
const MAILTO = process.env.OPENALEX_MAILTO;

interface UniDef {
  jpName: string;
  prefecture: string;
  searchQuery: string;
}

// 旧帝大 7校 + 早慶
const UNIVERSITIES: UniDef[] = [
  { jpName: "東京大学", prefecture: "東京都", searchQuery: "University of Tokyo" },
  { jpName: "京都大学", prefecture: "京都府", searchQuery: "Kyoto University" },
  { jpName: "大阪大学", prefecture: "大阪府", searchQuery: "Osaka University" },
  { jpName: "東北大学", prefecture: "宮城県", searchQuery: "Tohoku University" },
  { jpName: "名古屋大学", prefecture: "愛知県", searchQuery: "Nagoya University" },
  { jpName: "九州大学", prefecture: "福岡県", searchQuery: "Kyushu University" },
  { jpName: "北海道大学", prefecture: "北海道", searchQuery: "Hokkaido University" },
  { jpName: "早稲田大学", prefecture: "東京都", searchQuery: "Waseda University" },
  { jpName: "慶應義塾大学", prefecture: "東京都", searchQuery: "Keio University" },
];

const AUTHORS_PER_UNI = 20;
const WORKS_PER_AUTHOR = 25;
const SINCE_YEAR = new Date().getFullYear() - 5;

// OpenAlex のフィールドID（ASJC ベース）— 生命科学系
// 11: Agricultural and Biological Sciences
// 13: Biochemistry, Genetics and Molecular Biology
// 24: Immunology and Microbiology
// 28: Neuroscience
// 30: Pharmacology, Toxicology and Pharmaceutics
const LIFE_SCIENCE_FIELD_IDS = new Set(["11", "13", "24", "28", "30"]);
const CANDIDATE_POOL = 80; // 各大学でこの人数を取り、フィールドで絞り込む

function buildUrl(
  path: string,
  params: Record<string, string | undefined> = {},
) {
  const u = new URL(OPENALEX + path);
  if (MAILTO) u.searchParams.set("mailto", MAILTO);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) u.searchParams.set(k, v);
  }
  return u.toString();
}

async function fetchJson<T>(u: string): Promise<T> {
  const res = await fetch(u);
  if (!res.ok) {
    throw new Error(`OpenAlex ${res.status} ${res.statusText}: ${u}`);
  }
  return res.json() as Promise<T>;
}

interface OAInstitution {
  id: string;
  display_name: string;
  country_code?: string;
  works_count?: number;
}

interface OATopic {
  id: string;
  display_name: string;
  field?: { id: string; display_name: string };
}

interface OAAuthor {
  id: string;
  display_name: string;
  works_count?: number;
  orcid?: string | null;
  topics?: OATopic[];
}

function isLifeScienceAuthor(author: OAAuthor): boolean {
  const primary = author.topics?.[0];
  if (!primary?.field?.id) return false;
  const fieldNum = shortId(primary.field.id).replace(/^fields\//, "");
  return LIFE_SCIENCE_FIELD_IDS.has(fieldNum);
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
  meta: { count: number };
}

function shortId(id: string): string {
  return id.replace(/.*\//, "");
}

function reconstructAbstract(
  invIndex: Record<string, number[]> | null,
): string | null {
  if (!invIndex) return null;
  const positions: { word: string; pos: number }[] = [];
  for (const [word, indices] of Object.entries(invIndex)) {
    for (const i of indices) positions.push({ word, pos: i });
  }
  positions.sort((a, b) => a.pos - b.pos);
  return positions.map((p) => p.word).join(" ");
}

async function findInstitution(name: string): Promise<OAInstitution | null> {
  const u = buildUrl("/institutions", {
    filter: `display_name.search:${name},country_code:JP`,
    per_page: "5",
  });
  const data = await fetchJson<OAList<OAInstitution>>(u);
  // works_count が最大のものをメインキャンパスとみなして採用
  return (
    data.results.sort(
      (a, b) => (b.works_count ?? 0) - (a.works_count ?? 0),
    )[0] ?? null
  );
}

async function findLifeScienceAuthors(
  institutionId: string,
  take: number,
): Promise<OAAuthor[]> {
  // 候補を多めに取り、primary topic が生命科学系のものに絞る
  const u = buildUrl("/authors", {
    filter: `last_known_institutions.id:${shortId(institutionId)}`,
    sort: "works_count:desc",
    per_page: String(CANDIDATE_POOL),
  });
  const data = await fetchJson<OAList<OAAuthor>>(u);
  return data.results.filter(isLifeScienceAuthor).slice(0, take);
}

async function fetchAuthorWorks(
  authorId: string,
  sinceYear: number,
  max: number,
): Promise<OAWork[]> {
  const u = buildUrl("/works", {
    filter:
      `author.id:${shortId(authorId)},` +
      `from_publication_date:${sinceYear}-01-01,` +
      `type:article`,
    per_page: String(max),
    sort: "publication_date:desc",
  });
  const data = await fetchJson<OAList<OAWork>>(u);
  return data.results;
}

async function processUniversity(uni: UniDef) {
  console.log(`\n=== ${uni.jpName} (${uni.searchQuery}) ===`);
  const inst = await findInstitution(uni.searchQuery);
  if (!inst) {
    console.log("  SKIP: institution not found");
    return { labs: 0, works: 0 };
  }
  console.log(
    `  Institution: ${inst.display_name} (${shortId(inst.id)}, works_count=${inst.works_count})`,
  );

  const universityRow = await prisma.university.upsert({
    where: { name: uni.jpName },
    update: { prefecture: uni.prefecture },
    create: { name: uni.jpName, prefecture: uni.prefecture },
  });

  const authors = await findLifeScienceAuthors(inst.id, AUTHORS_PER_UNI);
  console.log(`  Authors fetched: ${authors.length}`);

  let labsProcessed = 0;
  let worksAdded = 0;

  for (const author of authors) {
    const lab = await prisma.lab.upsert({
      where: { openalexAuthorId: author.id },
      update: {
        professorName: author.display_name,
        universityId: universityRow.id,
      },
      create: {
        universityId: universityRow.id,
        name: `${author.display_name} 研究室`,
        professorName: author.display_name,
        openalexAuthorId: author.id,
        orcid: author.orcid ?? null,
      },
    });
    labsProcessed++;

    const works = await fetchAuthorWorks(
      author.id,
      SINCE_YEAR,
      WORKS_PER_AUTHOR,
    );
    let inserted = 0;
    for (const w of works) {
      if (!w.title) continue;
      const exists = await prisma.work.findFirst({
        where: { labId: lab.id, sourceUrl: w.id },
      });
      if (exists) continue;
      await prisma.work.create({
        data: {
          labId: lab.id,
          title: w.title,
          abstract: reconstructAbstract(w.abstract_inverted_index),
          year: w.publication_year,
          doi: w.doi,
          sourceUrl: w.id,
          type: w.type ?? "article",
        },
      });
      inserted++;
    }
    worksAdded += inserted;
  }

  console.log(`  Done: labs=${labsProcessed}, new works=${worksAdded}`);
  return { labs: labsProcessed, works: worksAdded };
}

async function main() {
  console.log(`OpenAlex MAILTO=${MAILTO ?? "(not set, public pool)"}`);
  console.log(
    `Targets: ${UNIVERSITIES.length} universities, ` +
      `${AUTHORS_PER_UNI} authors each, ` +
      `${WORKS_PER_AUTHOR} works/author since ${SINCE_YEAR}`,
  );

  const start = Date.now();
  let totalLabs = 0;
  let totalWorks = 0;

  for (const uni of UNIVERSITIES) {
    try {
      const r = await processUniversity(uni);
      totalLabs += r.labs;
      totalWorks += r.works;
    } catch (e) {
      console.error(`  ERROR for ${uni.jpName}:`, e instanceof Error ? e.message : e);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== Summary ===`);
  console.log(`Time: ${elapsed}s`);
  console.log(`Processed labs: ${totalLabs}, new works inserted: ${totalWorks}`);

  const uniCount = await prisma.university.count();
  const labCount = await prisma.lab.count();
  const workCount = await prisma.work.count();
  console.log(
    `DB state: universities=${uniCount}, labs=${labCount}, works=${workCount}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

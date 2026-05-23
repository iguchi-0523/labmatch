import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * OpenAlex から論文を取得して labs / works に投入する MVP スクリプト。
 * 動作確認用に東京大学の上位著者 2 名のみ取り込む。
 *
 * - polite pool（OPENALEX_MAILTO）を設定した場合は利用（任意）
 * - 著者は OpenAlex 著者ID で識別、論文は OpenAlex Work URL を sourceUrl に保存
 */

const OPENALEX = "https://api.openalex.org";
const MAILTO = process.env.OPENALEX_MAILTO; // 任意（推奨）

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
}

interface OAAuthor {
  id: string;
  display_name: string;
  works_count?: number;
  orcid?: string | null;
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

/** OpenAlex の転置インデックスから本文を復元する */
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
  return data.results[0] ?? null;
}

async function findTopAuthors(
  institutionId: string,
  count: number,
): Promise<OAAuthor[]> {
  const u = buildUrl("/authors", {
    filter: `last_known_institutions.id:${shortId(institutionId)}`,
    sort: "works_count:desc",
    per_page: String(count),
  });
  const data = await fetchJson<OAList<OAAuthor>>(u);
  return data.results;
}

async function fetchAuthorWorks(
  authorId: string,
  sinceYear: number,
): Promise<OAWork[]> {
  const u = buildUrl("/works", {
    filter: `author.id:${shortId(authorId)},from_publication_date:${sinceYear}-01-01,type:article`,
    per_page: "25",
    sort: "publication_date:desc",
  });
  const data = await fetchJson<OAList<OAWork>>(u);
  return data.results;
}

async function main() {
  console.log(`OpenAlex MAILTO=${MAILTO ?? "(not set, public pool)"}`);

  // 東京大学を OpenAlex で取得
  const inst = await findInstitution("University of Tokyo");
  if (!inst) throw new Error("University of Tokyo not found in OpenAlex");
  console.log(`Institution: ${inst.display_name} (${inst.id})`);

  // universities テーブルに upsert
  const universityRow = await prisma.university.upsert({
    where: { name: "東京大学" },
    update: {},
    create: { name: "東京大学", prefecture: "東京都" },
  });

  // 当該機関の上位著者 2 名
  const authors = await findTopAuthors(inst.id, 2);
  console.log(`Top authors: ${authors.length}`);

  const sinceYear = new Date().getFullYear() - 5;

  for (const author of authors) {
    console.log(
      `- ${author.display_name} (${author.id}) works=${author.works_count}`,
    );

    const lab = await prisma.lab.upsert({
      where: { openalexAuthorId: author.id },
      update: { professorName: author.display_name },
      create: {
        universityId: universityRow.id,
        name: `${author.display_name} 研究室`,
        professorName: author.display_name,
        openalexAuthorId: author.id,
        orcid: author.orcid ?? null,
      },
    });

    const works = await fetchAuthorWorks(author.id, sinceYear);
    console.log(`  works since ${sinceYear}: ${works.length}`);

    let inserted = 0;
    for (const w of works) {
      if (!w.title) continue;
      // 重複チェック（labId + sourceUrl）
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
    console.log(`  inserted ${inserted}`);
  }

  const labCount = await prisma.lab.count();
  const workCount = await prisma.work.count();
  console.log(`\nFinal: labs=${labCount} works=${workCount}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

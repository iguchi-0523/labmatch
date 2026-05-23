import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 日本細胞生物学会（JSCB）の役員ページから氏名・所属・役職を抽出して
 * lab_societies に投入する POC スクリプト。
 *
 * - 役員ページ: https://www.jscb.gr.jp/about_us/board_member_list/
 * - 構造: <h3>役職</h3> のあと、各役員ブロックに
 *   <p style="margin-top:var(--wp--preset--spacing--10)">氏名</p>
 *   <p class="has-14-font-size" style="...">所属</p>
 * - マッチ条件: ラボの professorNameJa と一致 かつ university 名が所属の略号から解決可能で一致
 */

const SOCIETY_NAME = "日本細胞生物学会";
const OFFICER_PAGE = "https://www.jscb.gr.jp/about_us/board_member_list/";

// 学会サイトの所属表記の冒頭 → DB の universities.name
const UNI_PREFIX_MAP: Record<string, string> = {
  東大: "東京大学",
  京大: "京都大学",
  阪大: "大阪大学",
  東北大: "東北大学",
  名大: "名古屋大学",
  九大: "九州大学",
  北大: "北海道大学",
  早大: "早稲田大学",
  慶大: "慶應義塾大学",
  慶應: "慶應義塾大学",
};

interface Officer {
  name: string;
  role: string;
  affiliation: string;
}

function resolveUniversity(affiliation: string): string | null {
  for (const [abbrev, full] of Object.entries(UNI_PREFIX_MAP)) {
    if (affiliation.startsWith(abbrev)) return full;
  }
  return null;
}

function parseOfficers(html: string): Officer[] {
  const officers: Officer[] = [];

  // 役職見出しで分割
  const sections = html.split(/<h3 class="wp-block-heading">/);
  // [0] は preamble なのでスキップ

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const roleMatch = section.match(/^([^<]+)<\/h3>/);
    if (!roleMatch) continue;
    const role = roleMatch[1].trim();

    // 氏名 <p> と 所属 <p> のペアをすべて抽出
    const pairRe =
      /<p style="margin-top:var\(--wp--preset--spacing--10\)">([^<]+)<\/p>\s*<p class="has-14-font-size"[^>]*>([^<]+)<\/p>/g;
    let m;
    while ((m = pairRe.exec(section)) !== null) {
      officers.push({
        name: m[1].trim(),
        role,
        affiliation: m[2].trim(),
      });
    }
  }
  return officers;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 labmatch-bot",
      "Accept-Language": "ja",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

async function main() {
  console.log(`Fetching ${OFFICER_PAGE}`);
  const html = await fetchHtml(OFFICER_PAGE);
  const officers = parseOfficers(html);
  console.log(`\n=== Parsed ${officers.length} officers ===`);
  for (const o of officers) {
    console.log(`  ${o.role}: ${o.name} (${o.affiliation})`);
  }

  const society = await prisma.society.upsert({
    where: { name: SOCIETY_NAME },
    update: {},
    create: { name: SOCIETY_NAME },
  });

  let matched = 0;
  let resolvedUni = 0;
  console.log(`\n=== Matching against our labs ===`);
  for (const o of officers) {
    const uniName = resolveUniversity(o.affiliation);
    if (!uniName) {
      // 我々の対象外大学（理研など）
      continue;
    }
    resolvedUni++;
    const lab = await prisma.lab.findFirst({
      where: {
        professorNameJa: o.name,
        university: { name: uniName },
      },
    });
    if (!lab) {
      console.log(
        `  NO LAB: ${o.role} ${o.name} (${uniName}) — おそらく我々の取り込み対象に未収録`,
      );
      continue;
    }
    await prisma.labSociety.upsert({
      where: {
        labId_societyId: { labId: lab.id, societyId: society.id },
      },
      update: { role: o.role },
      create: { labId: lab.id, societyId: society.id, role: o.role },
    });
    matched++;
    console.log(
      `  MATCH: ${o.role} ${o.name} (${uniName}) → ${lab.professorName} (lab ${lab.id})`,
    );
  }
  console.log(
    `\nDone. ${matched} matched, ${resolvedUni} 大学名解決, ${officers.length} parsed.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

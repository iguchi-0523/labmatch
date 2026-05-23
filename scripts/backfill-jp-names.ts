import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 各ラボの professorNameJa を OpenAlex の display_name_alternatives から逆引き。
 * 著者レコードには別表記のリスト（CJK含む）があることが多いので、
 * その中から漢字を含むものを採用する。
 */

const OPENALEX = "https://api.openalex.org";
const MAILTO = process.env.OPENALEX_MAILTO;

interface OAAuthor {
  id: string;
  display_name: string;
  display_name_alternatives?: string[];
}

// CJK Unified Ideographs / Hiragana / Katakana の存在を確認
const CJK_RE = /[一-鿿぀-ゟ゠-ヿ]/;

function buildUrl(path: string): string {
  const u = new URL(OPENALEX + path);
  if (MAILTO) u.searchParams.set("mailto", MAILTO);
  return u.toString();
}

function pickKanjiName(alternatives: string[] | undefined): string | null {
  if (!alternatives || alternatives.length === 0) return null;
  // 漢字 or かな を含むもののうち、最も短いもの（簡潔な氏名表記を優先）
  const cjk = alternatives.filter((n) => CJK_RE.test(n));
  if (cjk.length === 0) return null;
  cjk.sort((a, b) => a.length - b.length);
  return cjk[0];
}

async function main() {
  const labs = await prisma.lab.findMany({
    where: { openalexAuthorId: { not: null }, professorNameJa: null },
    select: { id: true, openalexAuthorId: true, professorName: true },
    orderBy: { id: "asc" },
  });
  console.log(`Looking up Japanese names for ${labs.length} labs via OpenAlex`);

  let found = 0;
  let total = 0;
  for (const lab of labs) {
    if (!lab.openalexAuthorId) continue;
    total++;
    try {
      const short = lab.openalexAuthorId.replace(/.*\//, "");
      const res = await fetch(buildUrl(`/authors/${short}`));
      if (!res.ok) {
        console.log(`  ${lab.professorName}: HTTP ${res.status}`);
        continue;
      }
      const author: OAAuthor = await res.json();
      const ja = pickKanjiName(author.display_name_alternatives);
      if (ja) {
        await prisma.lab.update({
          where: { id: lab.id },
          data: { professorNameJa: ja },
        });
        found++;
        console.log(`  ${found} ${lab.professorName} → ${ja}`);
      }
    } catch (e) {
      console.error(
        `  ${lab.professorName}: ERROR`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(`\nDone. ${found}/${total} labs got Japanese names.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 各ラボに OpenAlex 著者の primary topic field をタグ付けする。
 * - primaryFieldCode: 数値ID (例: "13", "28")
 * - primaryFieldName: OpenAlex の field display_name (例: "Neuroscience")
 * UI 側で日本語ラベルへマッピングして表示する。
 */

const OPENALEX = "https://api.openalex.org";
const MAILTO = process.env.OPENALEX_MAILTO;

interface OAField {
  id: string;
  display_name: string;
}

interface OATopic {
  id: string;
  display_name: string;
  field?: OAField;
}

interface OAAuthor {
  id: string;
  topics?: OATopic[];
}

function buildUrl(path: string): string {
  const u = new URL(OPENALEX + path);
  if (MAILTO) u.searchParams.set("mailto", MAILTO);
  return u.toString();
}

async function fetchAuthor(authorId: string): Promise<OAAuthor> {
  const short = authorId.replace(/.*\//, "");
  const res = await fetch(buildUrl(`/authors/${short}`));
  if (!res.ok) {
    throw new Error(`OpenAlex ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function fieldShortCode(fieldId: string): string {
  // "https://openalex.org/fields/13" → "13"
  return fieldId.replace(/.*\//, "");
}

async function main() {
  const labs = await prisma.lab.findMany({
    where: { openalexAuthorId: { not: null }, primaryFieldName: null },
    select: { id: true, openalexAuthorId: true, name: true },
    orderBy: { id: "asc" },
  });
  console.log(`Tagging ${labs.length} labs with primary field`);

  let done = 0;
  for (const lab of labs) {
    if (!lab.openalexAuthorId) continue;
    try {
      const author = await fetchAuthor(lab.openalexAuthorId);
      const primary = author.topics?.[0];
      if (!primary?.field) {
        console.log(`  SKIP ${lab.name}: no topic field`);
        continue;
      }
      const code = fieldShortCode(primary.field.id);
      await prisma.lab.update({
        where: { id: lab.id },
        data: {
          primaryFieldCode: code,
          primaryFieldName: primary.field.display_name,
        },
      });
      done++;
      console.log(
        `  ${done}/${labs.length} ${lab.name}: ${code} ${primary.field.display_name}`,
      );
    } catch (e) {
      console.error(
        `  ${lab.name}: ERROR`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(`\nFinished. Tagged: ${done}/${labs.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

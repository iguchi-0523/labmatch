import { config } from "dotenv";
// シェル環境に空文字で先に export されている変数があっても .env で上書きする
config({ override: true });
import { prisma } from "../lib/db";
import { generateLabSummary } from "../lib/summary";
import { extractTagsForLab } from "../lib/tags";
import {
  buildIdentifierAncestorMap,
  getAllTreeIdentifiers,
} from "../lib/keyword-tree";

/**
 * aiSummary が未生成のラボを対象に、Claude Haiku で AI 要約を一括生成して保存する。
 * 各ラボごとに、要約の保存と同時に Lab.tags も再計算する（aiSummary を corpus に
 * 含めるため、tags の精度が要約生成後に上がる）。
 *
 * 「薄グレー」方針:
 *   - 要約対象は hasAbstract=true の works のみ（OpenAlex に abstract が残っている＝
 *     出版社による takedown を受けていない論文のみ）
 *   - hasAbstract=true の works が 0 件のラボはスキップ（要約せず、タイトル+DOI のみ表示）
 */

const MAX_WORKS_PER_LAB = 25;
const TAG_CONTEXT = {
  identifiers: getAllTreeIdentifiers(),
  ancestorMap: buildIdentifierAncestorMap(),
};

async function main() {
  const labs = await prisma.lab.findMany({
    where: {
      aiSummary: null,
      deletedAt: null,
      works: { some: { hasAbstract: true } },
    },
    include: {
      works: {
        where: { hasAbstract: true },
        take: MAX_WORKS_PER_LAB,
        orderBy: { year: "desc" },
      },
    },
    orderBy: { id: "asc" },
  });
  console.log(
    `Targets: ${labs.length} labs (with at least 1 hasAbstract=true work)`,
  );

  let done = 0;
  let failed = 0;
  for (const lab of labs) {
    if (lab.works.length === 0) {
      console.log(`  ${lab.id} ${lab.name}: SKIP (no abstract-bearing works)`);
      continue;
    }
    try {
      const summary = await generateLabSummary(
        lab.name,
        lab.works.map((w) => ({
          title: w.title,
          abstract: w.abstract,
          year: w.year,
        })),
      );
      // 要約 + タグを同時に保存（タグは新しい aiSummary を corpus に含めて再計算）
      const tags = extractTagsForLab(
        {
          aiSummary: summary,
          works: lab.works.map((w) => ({ title: w.title, titleJa: w.titleJa })),
        },
        TAG_CONTEXT,
        20,
      );
      await prisma.lab.update({
        where: { id: lab.id },
        data: {
          aiSummary: summary,
          aiSummaryGeneratedAt: new Date(),
          tags,
          tagsGeneratedAt: new Date(),
        },
      });
      done++;
      console.log(
        `  ${done}/${labs.length} ${lab.name} (${summary.length} chars, tags=${tags.length})`,
      );
    } catch (e) {
      failed++;
      console.error(
        `  ${lab.name}: ERROR`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(`\nFinished. Generated: ${done}/${labs.length}, failed: ${failed}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

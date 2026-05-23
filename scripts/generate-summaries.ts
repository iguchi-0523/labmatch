import "dotenv/config";
import { prisma } from "../lib/db";
import { generateLabSummary } from "../lib/summary";

/**
 * aiSummary が未生成のラボを対象に、Claude Haiku で要約を一括生成して保存する。
 * オンデマンド生成（ページ初回閲覧時に走る）の事前実行版。日本語検索のために
 * 全ラボで要約テキストを用意するのが目的。
 */

async function main() {
  const labs = await prisma.lab.findMany({
    where: { aiSummary: null },
    include: { works: { take: 25, orderBy: { year: "desc" } } },
    orderBy: { id: "asc" },
  });
  console.log(`Generating summaries for ${labs.length} labs`);

  let done = 0;
  for (const lab of labs) {
    if (lab.works.length === 0) {
      console.log(`  ${lab.id} ${lab.name}: SKIP (no works)`);
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
      await prisma.lab.update({
        where: { id: lab.id },
        data: { aiSummary: summary, aiSummaryGeneratedAt: new Date() },
      });
      done++;
      console.log(
        `  ${done}/${labs.length} ${lab.name} (${summary.length} chars)`,
      );
    } catch (e) {
      console.error(
        `  ${lab.name}: ERROR`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(`\nFinished. Generated: ${done}/${labs.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

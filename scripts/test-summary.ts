import "dotenv/config";
import { prisma } from "../lib/db";
import { generateLabSummary } from "../lib/summary";

/**
 * 動作確認スクリプト。
 * DB から研究室を1件取得 → Claude Haiku で要約を生成 → 標準出力に表示。
 * （DB は更新しない。実際の保存はページ初回閲覧時に行われる）
 */
async function main() {
  const lab = await prisma.lab.findFirst({
    include: { works: { orderBy: { year: "desc" }, take: 25 } },
  });
  if (!lab) {
    console.log("No labs in DB");
    return;
  }
  console.log(`Lab: ${lab.name}`);
  console.log(`Professor: ${lab.professorName}`);
  console.log(`Works (used): ${lab.works.length}`);
  console.log("");

  const summary = await generateLabSummary(
    lab.name,
    lab.works.map((w) => ({
      title: w.title,
      abstract: w.abstract,
      year: w.year,
    })),
  );

  console.log("--- Generated Summary ---");
  console.log(summary);
  console.log("--- End ---");
  console.log("");
  console.log(`Length: ${summary.length} chars`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

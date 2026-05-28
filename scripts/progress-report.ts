import "dotenv/config";
import { prisma } from "../lib/db";
import { getAllUniversities } from "../lib/universities";

async function main() {
  const unis = await prisma.university.findMany({
    include: { _count: { select: { labs: { where: { deletedAt: null } } } } },
    orderBy: { name: "asc" },
  });
  const parents = unis.filter((u) => u.parentId === null);
  const children = unis.filter((u) => u.parentId !== null);
  const DONE = 50;
  const completeParents = parents.filter((u) => u._count.labs >= DONE);
  const partial = parents.filter((u) => u._count.labs > 0 && u._count.labs < DONE);
  const cfg = getAllUniversities();

  const total = await prisma.lab.count({ where: { deletedAt: null } });
  const works = await prisma.work.count();
  const summarized = await prisma.lab.count({
    where: { deletedAt: null, aiSummary: { not: null } },
  });
  const tagged = await prisma.lab.count({
    where: { deletedAt: null, tags: { isEmpty: false } },
  });

  console.log("=================================");
  console.log("  ラボマッチ 取り込み進捗レポート");
  console.log(`  ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST`);
  console.log("=================================\n");
  console.log(`■ 取り込み完了済み (labs >= ${DONE}): ${completeParents.length}/${cfg.length} 機関 (${Math.round(100 * completeParents.length / cfg.length)}%)`);
  for (const u of completeParents.sort((a, b) => b._count.labs - a._count.labs)) {
    console.log(`  ✓ ${u.name.padEnd(22)} ${u._count.labs} labs`);
  }
  console.log(`\n■ 部分取り込み (1〜${DONE - 1} labs): ${partial.length} 機関`);
  for (const u of partial.sort((a, b) => b._count.labs - a._count.labs)) {
    console.log(`  · ${u.name.padEnd(22)} ${u._count.labs} labs`);
  }
  console.log(`\n■ 子センター (parent 付き、研究機関): ${children.length} 件`);
  for (const u of children.sort((a, b) => b._count.labs - a._count.labs).slice(0, 10)) {
    console.log(`  · ${u.name.slice(0, 55).padEnd(55)} ${u._count.labs} labs`);
  }
  console.log(`\n■ 全体統計`);
  console.log(`  ラボ総数:     ${total.toLocaleString()}`);
  console.log(`  論文総数:     ${works.toLocaleString()}`);
  console.log(`  AI 要約済み:  ${summarized.toLocaleString()} (${Math.round(100 * summarized / total)}%)`);
  console.log(`  タグ付き:     ${tagged.toLocaleString()} (${Math.round(100 * tagged / total)}%)`);
  console.log(`\n■ config に登録されている総数: ${cfg.length} 機関（大学 + 公的研究機関 + 学内研究所）`);
  console.log(`  残: 約 ${cfg.length - completeParents.length} 機関 (4 本/日 cron で約 ${Math.ceil((cfg.length - completeParents.length) / 4)} 日で完走)`);
  
  await prisma.$disconnect();
}
main();

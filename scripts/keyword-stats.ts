import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 候補キーワードについて、「研究室名・主宰者名・論文タイトル」のいずれかに
 * マッチするラボ数を集計する。検索 UI の動作確認用。
 */

const KEYWORDS = [
  // 日本語・一般
  "細胞", "神経", "脳", "がん", "腫瘍", "遺伝子", "ゲノム",
  "免疫", "抗体", "タンパク質", "受容体", "キナーゼ",
  "アポトーシス", "発生", "幹細胞", "シナプス", "ミトコンドリア",
  // 日本語・疾患・モデル生物
  "アルツハイマー", "パーキンソン", "糖尿病", "マウス",
  // 略号は英語のまま
  "DNA", "RNA", "CRISPR",
  // 英語の重要語（比較用）
  "cell", "cancer", "neuron", "immune",
  // 日本人の姓
  "Tanaka", "Suzuki", "Sato", "Hirokawa",
];

async function main() {
  console.log("=== キーワードのヒット数（マッチするラボ数） ===\n");

  const results: { k: string; count: number }[] = [];
  for (const k of KEYWORDS) {
    const count = await prisma.lab.count({
      where: {
        OR: [
          { name: { contains: k, mode: "insensitive" } },
          { professorName: { contains: k, mode: "insensitive" } },
          { aiSummary: { contains: k, mode: "insensitive" } },
          {
            works: {
              some: {
                OR: [
                  { title: { contains: k, mode: "insensitive" } },
                  { titleJa: { contains: k, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
    });
    results.push({ k, count });
  }

  results.sort((a, b) => b.count - a.count);
  for (const { k, count } of results) {
    if (count > 0) {
      console.log(`  ${k.padEnd(18)} ${count.toString().padStart(3)} labs`);
    }
  }

  const hit = results.filter((r) => r.count > 0).length;
  console.log(`\n${hit} / ${KEYWORDS.length} キーワードがヒット`);

  // 大学ごとのラボ数
  console.log("\n=== 大学ごとのラボ数 ===");
  const unis = await prisma.university.findMany({
    include: { _count: { select: { labs: true } } },
    orderBy: { name: "asc" },
  });
  for (const u of unis) {
    console.log(
      `  ${u.name.padEnd(10)} ${u._count.labs.toString().padStart(3)} labs  (${u.prefecture ?? ""})`,
    );
  }

  // サンプル教員名
  console.log("\n=== 主宰者サンプル（先頭20件） ===");
  const sampleLabs = await prisma.lab.findMany({
    take: 20,
    select: {
      professorName: true,
      university: { select: { name: true } },
      _count: { select: { works: true } },
    },
    orderBy: { works: { _count: "desc" } },
  });
  for (const lab of sampleLabs) {
    console.log(
      `  ${lab.professorName.padEnd(30)} ${lab.university.name}  (${lab._count.works} works)`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

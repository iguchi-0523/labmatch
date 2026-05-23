import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 候補キーワードについて、「研究室名・主宰者名・論文タイトル」のいずれかに
 * マッチするラボ数を集計する。検索 UI の動作確認用。
 */

const KEYWORDS = [
  // 英語・一般
  "cell", "protein", "gene", "DNA", "RNA", "neuron", "brain",
  "cancer", "tumor", "stem", "immune", "antibody", "kinase",
  "receptor", "synapse", "molecular", "structural",
  // トピック
  "CRISPR", "neural", "genome", "epigenetic",
  "transcription", "mitochondria", "autophagy", "apoptosis",
  // モデル生物
  "mouse", "Drosophila", "yeast", "zebrafish",
  // 疾患
  "Alzheimer", "Parkinson", "diabetes",
  // 日本語（論文タイトルは英語が多いのでヒットは少ない見込み）
  "細胞", "神経", "脳", "がん", "遺伝子", "免疫",
  // 日本人の姓（OpenAlex の display_name に出る場合）
  "Tanaka", "Yamada", "Suzuki", "Sato", "Yamamoto", "Hirokawa",
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
          { works: { some: { title: { contains: k, mode: "insensitive" } } } },
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

import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";

/**
 * DB 状態のスナップショットを stdout に出力する。
 * GitHub Actions の hourly-monitor から呼ばれて、ジョブログに残す用途。
 */

async function main() {
  const [
    universities,
    labs,
    activeLabs,
    works,
    hasAbstract,
    aiSummary,
    withTags,
    perUni,
  ] = await Promise.all([
    prisma.university.count(),
    prisma.lab.count(),
    prisma.lab.count({ where: { deletedAt: null } }),
    prisma.work.count(),
    prisma.work.count({ where: { hasAbstract: true } }),
    prisma.lab.count({ where: { aiSummary: { not: null } } }),
    prisma.lab.count({ where: { tags: { isEmpty: false } } }),
    prisma.lab.groupBy({
      by: ["universityId"],
      _count: { _all: true },
      orderBy: { _count: { universityId: "desc" } },
      take: 20,
    }),
  ]);

  const uniNames = await prisma.university.findMany({
    where: { id: { in: perUni.map((x) => x.universityId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(uniNames.map((u) => [u.id, u.name]));

  console.log("==== DB STATUS ====");
  console.log(`Generated at: ${new Date().toISOString()}`);
  console.log("");
  console.log(`Universities       : ${universities}`);
  console.log(`Labs (active)      : ${activeLabs} (total ${labs})`);
  console.log(`Works              : ${works.toLocaleString()}`);
  console.log(
    `  with abstract    : ${hasAbstract.toLocaleString()} (${((hasAbstract / Math.max(1, works)) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Labs with AI summary: ${aiSummary} (${((aiSummary / Math.max(1, activeLabs)) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Labs with tags      : ${withTags} (${((withTags / Math.max(1, activeLabs)) * 100).toFixed(1)}%)`,
  );
  console.log("");
  console.log("==== Top universities by lab count ====");
  for (const row of perUni) {
    console.log(
      `  ${(nameById.get(row.universityId) ?? `id=${row.universityId}`).padEnd(20)} ${row._count._all}`,
    );
  }
  console.log("");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

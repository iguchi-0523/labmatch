import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 全ラボの現在の universityId を `LabAffiliation` に primary affiliation として
 * 登録する。複数所属対応の初期化用。冪等。
 */

async function main() {
  const labs = await prisma.lab.findMany({
    where: { deletedAt: null },
    select: { id: true, universityId: true },
    orderBy: { id: "asc" },
  });
  console.log(`Backfilling primary affiliations for ${labs.length} labs`);

  const start = Date.now();
  let inserted = 0;
  let unchanged = 0;
  for (const lab of labs) {
    const r = await prisma.labAffiliation.upsert({
      where: {
        labId_universityId: {
          labId: lab.id,
          universityId: lab.universityId,
        },
      },
      update: { isPrimary: true },
      create: {
        labId: lab.id,
        universityId: lab.universityId,
        isPrimary: true,
      },
    });
    // upsert は created か updated か区別しないので、件数ベースで概算
    if (r.createdAt.getTime() > Date.now() - 5000) inserted++;
    else unchanged++;
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s — inserted≈${inserted}, unchanged≈${unchanged}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

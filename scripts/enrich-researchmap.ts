import "dotenv/config";
import { prisma } from "../lib/db";
import { fetchResearchmapProfile } from "../lib/sources/researchmap";

/**
 * researchmapId が既に DB に入っているラボについて、researchmap の JSON-LD
 * を取得して以下を補完する：
 *
 *   - ORCID（無ければ追記）
 *   - researcherNumber（NRID、無ければ追記）
 *   - 漢字氏名（注：現在 schema には日本語氏名を保存する列が無いため、
 *               将来 schema 拡張時に有効化。今はログ出力のみ）
 *
 * 認証不要で public profile から取得する。
 *
 * 使い方:
 *   npx tsx scripts/enrich-researchmap.ts            # 全件
 *   npx tsx scripts/enrich-researchmap.ts --limit=20
 *   npx tsx scripts/enrich-researchmap.ts --dry-run
 */

const PARALLEL = 3;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const labs = await prisma.lab.findMany({
    where: {
      deletedAt: null,
      researchmapId: { not: null },
    },
    select: {
      id: true,
      professorName: true,
      researchmapId: true,
      orcid: true,
      researcherNumber: true,
    },
    take: limit,
    orderBy: { id: "asc" },
  });
  console.log(
    `Enriching ${labs.length} labs from researchmap (dryRun=${dryRun})`,
  );

  const start = Date.now();
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (let i = 0; i < labs.length; i += PARALLEL) {
    const batch = labs.slice(i, i + PARALLEL);
    await Promise.all(
      batch.map(async (l) => {
        try {
          const profile = await fetchResearchmapProfile(l.researchmapId!);
          if (!profile) {
            failed++;
            return;
          }
          const updates: Record<string, string> = {};
          if (!l.orcid && profile.orcid) updates.orcid = profile.orcid;
          if (!l.researcherNumber && profile.researcherNumber)
            updates.researcherNumber = profile.researcherNumber;

          if (Object.keys(updates).length === 0) {
            unchanged++;
            return;
          }
          if (dryRun) {
            console.log(
              `  [dry] lab ${l.id} ${l.professorName} → ${JSON.stringify(updates)}`,
            );
          } else {
            await prisma.lab.update({
              where: { id: l.id },
              data: updates,
            });
          }
          updated++;
        } catch (e) {
          console.warn(
            `  lab ${l.id} FAIL: ${e instanceof Error ? e.message : e}`,
          );
          failed++;
        }
      }),
    );
    if ((i + PARALLEL) % 30 === 0 || i + PARALLEL >= labs.length) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `  ${Math.min(i + PARALLEL, labs.length)}/${labs.length} (${elapsed}s) — updated=${updated}, unchanged=${unchanged}, failed=${failed}`,
      );
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s — updated=${updated}, unchanged=${unchanged}, failed=${failed}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

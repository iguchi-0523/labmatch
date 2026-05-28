import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";
import { searchKakenGrants } from "../lib/sources/kaken";
import {
  linkAffiliation,
  upsertLabByIdentifiers,
} from "../lib/lab-merge";

/**
 * Route 4: KAKEN（科研費）からの PI 取り込み・dedup スクリプト。
 *
 * - 機関名で検索 → 課題（grants）一覧 → PI（研究代表者）の researcherNumber を抽出
 * - 既存ラボがある場合は researcherNumber / 所属を追記（dedup）
 * - 既存ラボが無い場合は新規作成（OpenAlex 漏れ研究者の救済）
 * - 同時に Grant レコードも upsert（既存 grants テーブル）
 *
 * 利用要件:
 *   NII の appid（KAKEN_APP_ID）を .env に保存。未設定時はエラーで終了。
 *
 * 使い方:
 *   npx tsx scripts/ingest-kaken.ts --institution="東京大学医科学研究所" [--limit=200]
 *   npx tsx scripts/ingest-kaken.ts --institution="京都大学iPS細胞研究所"
 *   npx tsx scripts/ingest-kaken.ts --institution="医科学研究所" --dry-run
 */

const ROWS_PER_PAGE = 100;

interface Args {
  institutionName: string;
  parentName?: string;
  maxGrants?: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (k: string): string | undefined => {
    const a = argv.find((s) => s.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : undefined;
  };
  const institutionName = get("institution");
  if (!institutionName) {
    console.error(
      'Usage: --institution="<機関名>" [--parent="<親大学名>"] [--limit=N] [--dry-run]',
    );
    process.exit(1);
  }
  return {
    institutionName,
    parentName: get("parent"),
    maxGrants: get("limit") ? Number(get("limit")) : undefined,
    dryRun: argv.includes("--dry-run"),
  };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!process.env.KAKEN_APP_ID) {
    console.error("KAKEN_APP_ID が .env に未設定です。");
    console.error(
      "NII の開発者登録（https://support.nii.ac.jp/ja/cinii/api/developer）で",
    );
    console.error('appid を取得して `.env` に `KAKEN_APP_ID="..."` を追加してください。');
    process.exit(1);
  }

  console.log(
    `\n=== KAKEN ingest: "${args.institutionName}" (dryRun=${args.dryRun}) ===`,
  );

  // 1) DB に該当 University があるか確認 / なければ作成
  let universityId: number | null = null;
  let parentId: number | null = null;
  if (args.parentName) {
    const parent = await prisma.university.findUnique({
      where: { name: args.parentName },
      select: { id: true },
    });
    if (!parent) {
      console.error(`Parent "${args.parentName}" not found in DB`);
      process.exit(1);
    }
    parentId = parent.id;
  }
  const existing = await prisma.university.findUnique({
    where: { name: args.institutionName },
    select: { id: true, parentId: true },
  });
  if (existing) {
    universityId = existing.id;
    console.log(`  university id=${universityId} (existing)`);
  } else if (!args.dryRun) {
    const created = await prisma.university.create({
      data: {
        name: args.institutionName,
        parentId,
        category: "research-institute",
      },
    });
    universityId = created.id;
    console.log(`  university id=${universityId} (newly created)`);
  } else {
    console.log(`  university not in DB (would create in non-dry-run)`);
  }

  // 2) KAKEN を pagination で取得
  console.log("[1/2] Searching KAKEN grants...");
  const collected: Awaited<ReturnType<typeof searchKakenGrants>>["grants"] = [];
  let page = 1;
  let total = 0;
  while (true) {
    const { grants, total: t } = await searchKakenGrants({
      institutionName: args.institutionName,
      rows: ROWS_PER_PAGE,
      page,
    });
    total = t;
    collected.push(...grants);
    console.log(
      `  page ${page}: ${grants.length} grants (running total ${collected.length}/${total})`,
    );
    if (collected.length >= total) break;
    if (args.maxGrants && collected.length >= args.maxGrants) break;
    if (grants.length === 0) break;
    page++;
    if (page > 100) break; // safety cap
  }
  console.log(`  total: ${collected.length} grants fetched`);

  if (args.dryRun) {
    console.log("\n[DRY RUN] sample PIs from first 10 grants:");
    for (const g of collected.slice(0, 10)) {
      const pi = g.principalInvestigator;
      console.log(
        `  ${pi.researcherNumber.padEnd(10)} ${(pi.nameJa ?? "").padEnd(15)} ${pi.institutionJa ?? ""} / ${pi.section ?? ""}`,
      );
    }
    await prisma.$disconnect();
    return;
  }

  if (!universityId) {
    throw new Error("universityId not assigned");
  }

  // 3) PI を dedup しつつ Lab / LabAffiliation / Grant に upsert
  console.log("[2/2] Upserting PIs and grants...");
  const seen = new Set<string>();
  let createdLabs = 0;
  let mergedLabs = 0;
  let createdGrants = 0;
  for (const g of collected) {
    const pi = g.principalInvestigator;
    if (!pi.researcherNumber) continue;
    if (!seen.has(pi.researcherNumber)) {
      seen.add(pi.researcherNumber);
      const { created } = await upsertLabByIdentifiers({
        researcherNumber: pi.researcherNumber,
        professorName: pi.nameEn ?? pi.nameJa,
        universityId,
      });
      if (created) createdLabs++;
      else mergedLabs++;
    }
    const lab = await prisma.lab.findUnique({
      where: { researcherNumber: pi.researcherNumber },
      select: { id: true, universityId: true },
    });
    if (!lab) continue;
    await linkAffiliation(
      lab.id,
      universityId,
      lab.universityId === universityId,
    );
    if (parentId) await linkAffiliation(lab.id, parentId, false);

    const existsG = await prisma.grant.findFirst({
      where: { labId: lab.id, awardNumber: g.awardNumber },
      select: { id: true },
    });
    if (!existsG) {
      try {
        await prisma.grant.create({
          data: {
            labId: lab.id,
            awardNumber: g.awardNumber,
            title: g.title,
            category: g.category ?? null,
            subject: g.subject ?? null,
            amount: g.amount ?? null,
            periodStart: g.yearFrom ? new Date(`${g.yearFrom}-04-01`) : null,
            periodEnd: g.yearTo ? new Date(`${g.yearTo}-03-31`) : null,
          },
        });
        createdGrants++;
      } catch (e) {
        console.warn(
          `  grant ${g.awardNumber} FAIL: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
  }
  console.log(
    `\nDone — labs: created=${createdLabs}, merged=${mergedLabs}; grants created=${createdGrants}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

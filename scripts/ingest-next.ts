import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";
import {
  getAllUniversities,
  type University,
} from "../lib/universities";
import { spawn } from "node:child_process";

/**
 * 自動 ingest スクリプト：
 *
 * config から「まだ十分に ingest されていない大学」を 1 校選び、
 * 既存の ingest-utokyo-life.ts を `--university=KEY` で呼び出す。
 *
 * 選定ロジック：
 *   1. config に存在する大学のうち、worksCount が大きい順
 *      （メモリ確定の優先順位＝研究力順）
 *   2. ただし「すでに十分に ingest されている」もの（DB の labs 数が
 *      MIN_LAB_COUNT_TO_CONSIDER_DONE 以上）はスキップ
 *
 * このスクリプトは「1 校だけ」を ingest して終了する。
 * GitHub Actions などで cron 実行することを想定。
 *
 * 環境変数:
 *   - INGEST_NEXT_DRY_RUN=1 で対象選定のみ表示して終了
 *   - INGEST_NEXT_FORCE_KEY=u-tokyo で特定大学を強制指定
 */

const MIN_LAB_COUNT_TO_CONSIDER_DONE = 50;

interface CandidateInfo {
  university: University;
  currentLabCount: number;
}

async function pickNextUniversity(): Promise<CandidateInfo | null> {
  const all = getAllUniversities().filter(
    (u) => u.openalexInstitutionId !== null,
  );

  // worksCount 降順（worksCount 不明は最後）でソート
  const sorted = [...all].sort((a, b) => {
    const aw = (a as unknown as { worksCount?: number }).worksCount ?? 0;
    const bw = (b as unknown as { worksCount?: number }).worksCount ?? 0;
    return bw - aw;
  });

  for (const uni of sorted) {
    const labCount = await prisma.lab.count({
      where: { university: { name: uni.name }, deletedAt: null },
    });
    if (labCount < MIN_LAB_COUNT_TO_CONSIDER_DONE) {
      return { university: uni, currentLabCount: labCount };
    }
  }
  return null;
}

async function main() {
  const force = process.env.INGEST_NEXT_FORCE_KEY;
  const dryRun = process.env.INGEST_NEXT_DRY_RUN === "1";

  let target: CandidateInfo | null;
  if (force) {
    const uni = getAllUniversities().find((u) => u.key === force);
    if (!uni) {
      console.error(`Force key "${force}" not found in config`);
      process.exit(1);
    }
    const labCount = await prisma.lab.count({
      where: { university: { name: uni.name }, deletedAt: null },
    });
    target = { university: uni, currentLabCount: labCount };
  } else {
    target = await pickNextUniversity();
  }

  if (!target) {
    console.log("✓ All configured universities are already ingested.");
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Selected: ${target.university.name} (key=${target.university.key}, current labs=${target.currentLabCount})`,
  );
  if (dryRun) {
    console.log("DRY RUN: not executing ingest.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$disconnect();

  // 既存 ingest-utokyo-life.ts を子プロセスで呼ぶ
  console.log("Spawning ingest-utokyo-life.ts...");
  const child = spawn(
    "npx",
    [
      "tsx",
      "scripts/ingest-utokyo-life.ts",
      `--university=${target.university.key}`,
    ],
    { stdio: "inherit" },
  );
  child.on("exit", (code) => {
    console.log(`\ningest exited with code ${code}`);
    process.exit(code ?? 0);
  });
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

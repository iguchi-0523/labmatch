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

/**
 * 完了判定用の lab 数。親大学自身の lab だけでなく、子センター
 *（parentId が当該大学を指す University）の lab も合算する。
 *
 * 理由：RIKEN のように PI が全員子センター（RIKEN Center for ...）に
 * 振り分けられる機関では、親レコード自体の lab 数が 50 に届かず、
 * ingest-next が毎回その機関を選び直して無限ループしていた（2026-06-18 発覚）。
 */
async function countLabsIncludingChildren(uniName: string): Promise<number> {
  const uni = await prisma.university.findUnique({
    where: { name: uniName },
    select: { id: true },
  });
  if (!uni) return 0;
  return prisma.lab.count({
    where: {
      deletedAt: null,
      OR: [{ universityId: uni.id }, { university: { parentId: uni.id } }],
    },
  });
}

async function pickNextUniversity(): Promise<CandidateInfo | null> {
  // openalexInstitutionId が null の機関も含める（ingest-utokyo-life.ts の
  // 動的解決に任せる）。研究機関カテゴリの大半が当初 null で登録されているため、
  // 旧 filter のままだと 4 本 cron で自動取り込みされない問題があった。
  const all = getAllUniversities();

  // worksCount 降順（worksCount 不明は最後）でソート
  const sorted = [...all].sort((a, b) => {
    const aw = (a as unknown as { worksCount?: number }).worksCount ?? 0;
    const bw = (b as unknown as { worksCount?: number }).worksCount ?? 0;
    return bw - aw;
  });

  for (const uni of sorted) {
    const labCount = await countLabsIncludingChildren(uni.name);
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

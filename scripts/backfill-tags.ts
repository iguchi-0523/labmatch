import "dotenv/config";
import { prisma } from "../lib/db";
import { extractTagsForLab } from "../lib/tags";
import {
  buildIdentifierAncestorMap,
  getAllTreeIdentifiers,
} from "../lib/keyword-tree";

/**
 * 既存ラボの tags を一括計算して DB に保存する。
 *
 * - aiSummary + 直近 25 論文タイトル（日英）から KEYWORD_TREE の識別子を
 *   頻度マッチ（leaf キーワード + 中間ラベル）
 * - マッチした各識別子の祖先ラベルもタグに含める（階層タグ）
 * - 既存タグを上書き（再計算）
 * - 並列度 5、約 1,000 ラボで 10〜20 秒程度を想定
 *
 * 使い方:
 *   npx tsx scripts/backfill-tags.ts            # 全ラボ更新
 *   npx tsx scripts/backfill-tags.ts --only-empty  # tags=[] のラボのみ
 */

const PARALLEL = 5;
const WORKS_PER_LAB = 25;
const MAX_TAGS = 20;

interface Ctx {
  identifiers: ReturnType<typeof getAllTreeIdentifiers>;
  ancestorMap: ReturnType<typeof buildIdentifierAncestorMap>;
}

async function processLab(labId: number, ctx: Ctx) {
  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: {
      id: true,
      name: true,
      aiSummary: true,
      works: {
        select: { title: true, titleJa: true },
        take: WORKS_PER_LAB,
        orderBy: { year: "desc" },
      },
    },
  });
  if (!lab) return { skipped: true };
  const tags = extractTagsForLab(lab, ctx, MAX_TAGS);
  await prisma.lab.update({
    where: { id: lab.id },
    data: { tags, tagsGeneratedAt: new Date() },
  });
  return { id: lab.id, name: lab.name, tagCount: tags.length, tags };
}

async function main() {
  const args = process.argv.slice(2);
  const onlyEmpty = args.includes("--only-empty");

  const labs = await prisma.lab.findMany({
    where: {
      deletedAt: null,
      ...(onlyEmpty ? { tags: { equals: [] } } : {}),
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  console.log(`Backfilling tags for ${labs.length} labs (onlyEmpty=${onlyEmpty})`);

  const ctx: Ctx = {
    identifiers: getAllTreeIdentifiers(),
    ancestorMap: buildIdentifierAncestorMap(),
  };
  console.log(`KEYWORD_TREE identifiers: ${ctx.identifiers.length}`);

  const start = Date.now();
  let done = 0;
  let failed = 0;
  let withTags = 0;

  for (let i = 0; i < labs.length; i += PARALLEL) {
    const batch = labs.slice(i, i + PARALLEL);
    const results = await Promise.all(
      batch.map(async (l) => {
        try {
          return await processLab(l.id, ctx);
        } catch (e) {
          console.error(`  lab ${l.id} FAILED:`, e instanceof Error ? e.message : e);
          return { failed: true };
        }
      }),
    );
    for (const r of results) {
      if ("failed" in r && r.failed) failed++;
      else if ("skipped" in r && r.skipped) continue;
      else {
        done++;
        if (
          r &&
          "tagCount" in r &&
          typeof r.tagCount === "number" &&
          r.tagCount > 0
        ) {
          withTags++;
        }
      }
    }
    if ((i + PARALLEL) % 50 === 0 || i + PARALLEL >= labs.length) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `  ${Math.min(i + PARALLEL, labs.length)}/${labs.length} (${elapsed}s)`,
      );
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s — updated ${done}, withTags=${withTags}, failed=${failed}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

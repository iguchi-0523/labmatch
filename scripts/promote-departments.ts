import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 既存ラボの `department` 値を子 University に昇格する。
 *
 * 変換例:
 *   Lab { universityId=東京大学.id, department="University of Tokyo Hospital" }
 *     ↓
 *   - University { name="University of Tokyo Hospital",
 *                  parentId=東京大学.id, category="research-institute" } を upsert
 *   - Lab を移動: universityId=子.id, department=null
 *
 * 冪等：既存の子 University があれば再利用。department が null のラボはスキップ。
 *
 * 使い方:
 *   npx tsx scripts/promote-departments.ts          # 実行
 *   npx tsx scripts/promote-departments.ts --dry-run
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  // department が non-null のラボを大学別 + department 別で集計
  const labs = await prisma.lab.findMany({
    where: { deletedAt: null, department: { not: null } },
    select: {
      id: true,
      universityId: true,
      department: true,
      university: { select: { id: true, name: true, prefecture: true } },
    },
  });

  // グループ化: (parentUnivId, deptName) → labIds[]
  type Key = string; // `${parentId}::${dept}`
  const groups = new Map<
    Key,
    {
      parentId: number;
      parentName: string;
      parentPrefecture: string | null;
      deptName: string;
      labIds: number[];
    }
  >();
  for (const l of labs) {
    const dept = l.department!;
    const k: Key = `${l.universityId}::${dept}`;
    if (!groups.has(k)) {
      groups.set(k, {
        parentId: l.universityId,
        parentName: l.university.name,
        parentPrefecture: l.university.prefecture,
        deptName: dept,
        labIds: [],
      });
    }
    groups.get(k)!.labIds.push(l.id);
  }

  console.log(
    `Promoting ${groups.size} unique departments → child universities (dryRun=${dryRun})`,
  );

  let createdUnis = 0;
  let movedLabs = 0;
  for (const g of groups.values()) {
    // 子 University 名は「親.name・子.name」と衝突しないように、子の deptName をそのまま使う
    // （deptName は OpenAlex の display_name で英語）
    const childName = g.deptName;
    console.log(
      `  ${g.parentName} → "${childName}" (${g.labIds.length} labs)`,
    );

    if (dryRun) {
      createdUnis++;
      movedLabs += g.labIds.length;
      continue;
    }

    const child = await prisma.university.upsert({
      where: { name: childName },
      update: {
        parentId: g.parentId,
        category: "research-institute",
        prefecture: g.parentPrefecture,
      },
      create: {
        name: childName,
        parentId: g.parentId,
        category: "research-institute",
        prefecture: g.parentPrefecture,
      },
    });

    const r = await prisma.lab.updateMany({
      where: { id: { in: g.labIds } },
      data: { universityId: child.id, department: null },
    });

    createdUnis++;
    movedLabs += r.count;
  }

  console.log(
    `\nDone. created/updated child universities=${createdUnis}, moved labs=${movedLabs}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

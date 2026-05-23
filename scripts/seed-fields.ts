import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * 科研費「審査区分表」の生命科学系サブセット（MVP用）。
 * 全分野へ拡張する際は本リストを差し替え・拡張する。
 * 参考: https://www.jsps.go.jp/j-grantsinaid/02_koubo/shinsa_kubun.html
 */
type FieldDef = { code: string; name: string; parentCode: string | null };

const fields: FieldDef[] = [
  // 大区分
  { code: "D", name: "生物学（大区分）", parentCode: null },
  { code: "H", name: "医歯薬学・生命科学（大区分）", parentCode: null },

  // 中区分（生物学系）
  { code: "43", name: "生物学（中区分）", parentCode: "D" },
  { code: "44", name: "基礎生物学（中区分）", parentCode: "D" },
  { code: "45", name: "植物科学・農芸化学（中区分）", parentCode: "D" },

  // 中区分（医歯薬・生命科学系）
  { code: "52", name: "生化学・分子生物学（中区分）", parentCode: "H" },
  { code: "53", name: "実験動物学・形態機能（中区分）", parentCode: "H" },

  // 小区分（細胞・分子レベルの代表的なもの）
  { code: "43010", name: "分子生物学", parentCode: "43" },
  { code: "43020", name: "構造生物学関連", parentCode: "43" },
  { code: "43030", name: "機能生物化学関連", parentCode: "43" },
  { code: "44010", name: "遺伝・染色体動態関連", parentCode: "44" },
  { code: "44020", name: "細胞生物学関連", parentCode: "44" },
  { code: "44030", name: "発生生物学関連", parentCode: "44" },
  { code: "52010", name: "生化学関連", parentCode: "52" },
  { code: "52020", name: "分子生物学関連", parentCode: "52" },
];

async function main() {
  // 2段階で投入：先に親（parentCode=null）、次に子。
  const parents = fields.filter((f) => !f.parentCode);
  const children = fields.filter((f) => f.parentCode);

  for (const f of parents) {
    await prisma.field.upsert({
      where: { code: f.code },
      update: { name: f.name },
      create: { code: f.code, name: f.name },
    });
  }

  for (const f of children) {
    const parent = await prisma.field.findUnique({
      where: { code: f.parentCode! },
    });
    if (!parent) {
      console.warn(`Parent ${f.parentCode} not found for ${f.code}; skipping`);
      continue;
    }
    await prisma.field.upsert({
      where: { code: f.code },
      update: { name: f.name, parentId: parent.id },
      create: { code: f.code, name: f.name, parentId: parent.id },
    });
  }

  const count = await prisma.field.count();
  console.log(`Fields seeded. total=${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

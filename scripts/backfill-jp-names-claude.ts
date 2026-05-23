import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/db";

/**
 * professorNameJa が未設定のラボについて、Claude Haiku で日本人研究者の漢字表記を推定。
 * - 確信できる場合のみ漢字を返す指示。null になる場合あり。
 * - チャンクごとに JSON 配列で受け取る。
 */

const CHUNK_SIZE = 20;
const MODEL = "claude-haiku-4-5";

const client = new Anthropic();

interface InputItem {
  name: string;
  university: string;
}

async function lookupBatch(items: InputItem[]): Promise<(string | null)[]> {
  const inputJson = JSON.stringify(items);
  const prompt = `以下の研究者リスト（英語表記、所属大学）について、日本人研究者と確信を持って判断できる場合に漢字表記の氏名を返してください。

要件:
- JSON配列で、入力と同じ順序・同じ要素数で返す。
- 確信を持てる場合のみ漢字氏名の文字列（例 "坂口 志文"）。確信できない、または日本人でない場合は null。
- 名前の読み方が複数考えられる場合や、同名の別人物の可能性がある場合は null。
- 推測で当てない。間違った漢字を返すより null の方がはるかに望ましい。
- 出力は JSON 配列のみ。説明文・コードフェンスは不要。

入力（${items.length}件）:
${inputJson}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text response");

  let raw = block.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  if (parsed.length !== items.length) {
    throw new Error(`Expected ${items.length} items, got ${parsed.length}`);
  }
  return parsed.map((v) => (typeof v === "string" && v.trim() ? v : null));
}

async function main() {
  const labs = await prisma.lab.findMany({
    where: { professorNameJa: null },
    include: { university: true },
    orderBy: { id: "asc" },
  });
  console.log(`Looking up Japanese names via Claude for ${labs.length} labs`);

  let filled = 0;
  for (let i = 0; i < labs.length; i += CHUNK_SIZE) {
    const chunk = labs.slice(i, i + CHUNK_SIZE);
    const items = chunk.map((l) => ({
      name: l.professorName,
      university: l.university.name,
    }));
    try {
      const results = await lookupBatch(items);
      for (let j = 0; j < chunk.length; j++) {
        const lab = chunk[j];
        const ja = results[j];
        if (ja) {
          await prisma.lab.update({
            where: { id: lab.id },
            data: { professorNameJa: ja },
          });
          filled++;
          console.log(`  ${filled}: ${lab.professorName} → ${ja}`);
        }
      }
    } catch (e) {
      console.error(
        `  chunk ${i}-${i + chunk.length}: ERROR`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(`\nFinished. Filled ${filled}/${labs.length} labs.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/db";

/**
 * works.title_ja が空のレコードに対し、Claude Haiku で日本語訳を生成して保存する。
 * チャンク単位で投入し、API 利用量と失敗時の影響範囲を抑える。
 */

const CHUNK_SIZE = 30;
const MODEL = "claude-haiku-4-5";

const client = new Anthropic();

async function translateBatch(titles: string[]): Promise<string[]> {
  const inputJson = JSON.stringify(titles);
  const prompt = `次の英語論文タイトルの配列を、自然な日本語に翻訳してください。

要件:
- 各タイトルを簡潔で自然な日本語にしてください（おおむね 100 字以内）。
- 専門用語はカタカナ表記で構いません（例: kinase → キナーゼ、apoptosis → アポトーシス）。
- 略語（DNA, RNA, mRNA, CRISPR など）はそのままで構いません。
- 入力と同じ順序・同じ要素数の文字列配列で返してください。

出力フォーマット: **JSON 配列のみ**。説明文・マークダウン・コードフェンスは不要です。

入力（${titles.length} 件）:
${inputJson}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text response");

  // 念のためコードフェンスを除去
  let raw = block.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  if (parsed.length !== titles.length) {
    throw new Error(`Expected ${titles.length} items, got ${parsed.length}`);
  }
  return parsed.map((s) => String(s));
}

async function main() {
  const works = await prisma.work.findMany({
    where: { titleJa: null },
    select: { id: true, title: true },
    orderBy: { id: "asc" },
  });
  console.log(
    `Translating ${works.length} titles in chunks of ${CHUNK_SIZE} using ${MODEL}`,
  );

  let done = 0;
  for (let i = 0; i < works.length; i += CHUNK_SIZE) {
    const chunk = works.slice(i, i + CHUNK_SIZE);
    const titles = chunk.map((w) => w.title);
    try {
      const translations = await translateBatch(titles);
      await Promise.all(
        chunk.map((w, idx) =>
          prisma.work.update({
            where: { id: w.id },
            data: { titleJa: translations[idx] },
          }),
        ),
      );
      done += chunk.length;
      console.log(`  ${done}/${works.length} done`);
    } catch (e) {
      console.error(
        `  chunk ${i}-${i + chunk.length}: ERROR`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(`\nFinished. Translated: ${done}/${works.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/db";

/**
 * 各ラボの公式サイト URL を Claude に問い合わせ、HTTP で実在確認した上で
 * lab.officialUrl に保存する。
 *
 * - Claude は確信が持てない場合 "null" を返す指示（推測の URL は弾く）
 * - 返された URL を fetch して 2xx/3xx 応答のみ採用
 * - 失敗（ハルシ／死リンク／タイムアウト）は null のまま
 */

const MODEL = "claude-haiku-4-5";
const FETCH_TIMEOUT_MS = 10_000;

const client = new Anthropic();

async function lookupUrl(
  name: string,
  university: string,
): Promise<string | null> {
  const prompt = `次の研究者の所属研究室の公式ウェブサイトの URL を教えてください。

研究者: ${name}
所属: ${university}

要件:
- 知っている場合のみ、その研究室の公式サイト URL を1つだけ返してください（http:// または https:// で始まる完全 URL）。
- 大学のトップページや学部のページではなく、その研究者・研究室の専用ページに限る。
- 確信が持てない場合、または該当ページを知らない場合は "null" とだけ返してください。
- **推測で URL を作らない**。実在しない URL を返すくらいなら "null" のほうが望ましい。
- 説明文や余計な文字は不要。URL 1行、または "null" のみ。`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const text = block.text.trim();
  if (text === "null" || text.length === 0) return null;
  // 先頭の最初の URL を抜く（モデルがたまに装飾を付ける場合に備える）
  const match = text.match(/https?:\/\/[^\s)>"]+/);
  return match ? match[0] : null;
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 labmatch-bot" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res.ok; // 2xx 系のみ採用（redirect は follow 済み）
  } catch {
    return false;
  }
}

async function main() {
  const labs = await prisma.lab.findMany({
    where: { officialUrl: null },
    include: { university: true },
    orderBy: { id: "asc" },
  });
  console.log(`Looking up official URLs for ${labs.length} labs`);

  let suggested = 0;
  let verified = 0;
  let dead = 0;
  for (const lab of labs) {
    try {
      const url = await lookupUrl(lab.professorName, lab.university.name);
      if (!url) {
        // モデルが知らない／自信がない
        continue;
      }
      suggested++;
      const ok = await verifyUrl(url);
      if (!ok) {
        dead++;
        console.log(`  DEAD  ${lab.professorName}: ${url}`);
        continue;
      }
      await prisma.lab.update({
        where: { id: lab.id },
        data: { officialUrl: url },
      });
      verified++;
      console.log(`  OK    ${verified} ${lab.professorName} → ${url}`);
    } catch (e) {
      console.error(
        `  ERROR ${lab.professorName}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(
    `\nFinished. suggested=${suggested} verified=${verified} dead=${dead} skipped=${labs.length - suggested}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

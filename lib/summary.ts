import Anthropic from "@anthropic-ai/sdk";

/**
 * 研究室の直近の研究成果（タイトル＋要旨）から、学生向けの平易な紹介文を生成する。
 * Claude Haiku をオンデマンドで呼び、共通の指示文はプロンプトキャッシュに乗せる。
 */

const SYSTEM_PROMPT = `あなたは、大学の研究室を学生向けに紹介する文章を書く専門家です。

入力として、ある研究室の主宰者の直近の研究成果（論文タイトルと要旨）の一覧が与えられます。これをもとに、その研究室がどのような研究を行っているかを、大学院進学を考える学部生にも分かるよう、平易な日本語で 2〜3 段落（合計 300〜500 字程度）にまとめてください。

執筆上の注意:
- 各論文の要旨をそのまま引用・転載しないこと（著作権の観点から）。完全に自分の言葉で書き換えること。
- 専門用語はなるべく避ける。避けられない場合は短く言い換えを添える。
- 「この研究室は〜について研究しています」のような俯瞰的な紹介から始める。
- 個別の論文を逐一説明するのではなく、テーマやアプローチの共通点を抽出して紹介する。
- 誇張や宣伝的な表現（「世界的に著名」「最先端」「画期的」など）は使わない。事実に即して中立に書く。
- 与えられた情報の範囲を超えた憶測や評価は書かない。
- 「と思われます」「のようです」など曖昧な表現は使わない。断定が難しい場合は「〜に関する研究を行っている」のように事実だけ書く。

出力は紹介文の本文のみを返してください。前置きやタイトル、見出しは不要です。`;

interface WorkInput {
  title: string;
  abstract: string | null;
  year: number | null;
}

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  _client = new Anthropic();
  return _client;
}

export async function generateLabSummary(
  labName: string,
  works: WorkInput[],
): Promise<string> {
  if (works.length === 0) {
    throw new Error("No works provided to summarize.");
  }

  const worksText = works
    .map((w, i) => {
      const head = `[${i + 1}] ${w.year ?? "?"}: ${w.title}`;
      const abs = w.abstract ? `\n  ${w.abstract.slice(0, 800)}` : "";
      return head + abs;
    })
    .join("\n\n");

  const userPrompt =
    `研究室名: ${labName}\n\n` +
    `直近の研究成果（${works.length} 件）:\n\n${worksText}\n\n` +
    `上記をもとに、この研究室の研究内容を学生向けに紹介する 2〜3 段落（300〜500 字程度）の日本語の文章を書いてください。`;

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content.");
  }
  // モデルが付けがちな先頭の Markdown 見出しを除去（システムプロンプトの指示に反する場合のセーフティ）
  return textBlock.text.trim().replace(/^#+[^\n]*\n+/, "");
}

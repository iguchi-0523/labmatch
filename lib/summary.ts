import Anthropic from "@anthropic-ai/sdk";

/**
 * 研究室の直近の研究成果（タイトル＋要旨）から、学生向けの平易な紹介文を生成する。
 * Claude Haiku をオンデマンドで呼び、共通の指示文はプロンプトキャッシュに乗せる。
 */

const SYSTEM_PROMPT = `あなたは、論文要旨の集合から研究室の研究テーマを事実情報として抽出・再構成するアシスタントです。

入力として、ある研究室の主宰者の直近の論文（タイトルと要旨）の一覧が与えられます。これをもとに、研究室の研究内容を学部生にも分かる日本語で 200〜400 字にまとめてください。

抽出する事実:
- 研究の問い：何を解明・解決しようとしているか（対象とする現象・疾患・物質など）
- 手法：どのようなアプローチ・実験系・モデル系を用いているか（in vivo / in vitro / 計算解析 など）
- 主要な発見：複数論文に共通して報告されている知見の方向性
これらを「研究の問い・手法・主要な発見」の順で、それぞれ 1〜3 文に再構成してください。

著作権配慮（最重要）:
- 入力された要旨の語句・文構造を踏襲しないこと。同義語や別の構文で再構成する。
- 個別論文の要旨を逐一翻訳・要約せず、複数論文を横断したテーマレベルの事実だけを抽出する。
- 要旨にしか書かれていない具体的なデータ値・固有の実験条件・新規物質名は転載しない。

書き方の制約:
- 「画期的」「世界的に著名」「最先端」「リード」など評価・宣伝的表現は使わない。
- 「と思われる」「のようだ」など曖昧な推測は使わない。断定が難しい場合は「〜に関する研究を行っている」のように事実のみ書く。
- 与えられた情報の範囲を超えた評価や憶測は書かない。
- 専門用語はなるべく避け、避けられない場合は短い言い換えを添える。

出力は本文のみを返してください（前置き・見出し・タイトルは不要）。`;

interface WorkInput {
  title: string;
  abstract: string | null;
  year: number | null;
}

// OpenAlex の要旨・タイトルにまれに混入する孤立サロゲート（ペアの片割れだけの
// 壊れた UTF-16 文字）を除去する。これが残ると SDK が本文を JSON 化する時点で
// 400 "no low surrogate in string" になり、同じラボが毎回必ず失敗する。
function stripLoneSurrogates(s: string): string {
  return s.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    "",
  );
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
    messages: [{ role: "user", content: stripLoneSurrogates(userPrompt) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content.");
  }
  // モデルが付けがちな先頭の Markdown 見出しを除去（システムプロンプトの指示に反する場合のセーフティ）
  return textBlock.text.trim().replace(/^#+[^\n]*\n+/, "");
}

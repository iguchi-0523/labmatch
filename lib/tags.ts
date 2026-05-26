import {
  buildIdentifierAncestorMap,
  getAllTreeIdentifiers,
} from "./keyword-tree";

/**
 * ラボの研究内容（aiSummary + 論文タイトル日英）から KEYWORD_TREE の
 * 識別子（leaf キーワード + 中間ラベル）を出現頻度でマッチしてタグ化する。
 *
 * 戦略:
 *   - ASCII 識別子（DNA, RNA, CRISPR, AR, OS 等）は `\b` 単語境界で
 *     英文中の部分一致による誤マッチを抑制
 *   - 日本語（または日本語混じり）は substring 一致
 *   - **マッチした各識別子について、その祖先ラベルもタグに追加する**
 *     例: leaf "細胞" がマッチ → "細胞" + "生物学" / "細胞生物学" 等の
 *     祖先ラベルも保存。これにより、ユーザが上位階層で AND 絞り込みしても
 *     当該ラボがヒットする。
 *
 * 出力順:
 *   1. 直接マッチ識別子（count 降順）
 *   2. マッチ識別子の祖先ラベル（出現順、dedupe 済み）
 *
 * 出力は `maxCount` 件まで。
 */
export interface TagSource {
  aiSummary: string | null;
  works: { title: string; titleJa: string | null }[];
}

interface TagExtractionContext {
  identifiers: { id: string; isLeaf: boolean }[];
  ancestorMap: Map<string, string[]>;
}

/** デフォルト・コンテキストは関数呼び出しごとに使い回せるようキャッシュする */
let defaultContext: TagExtractionContext | null = null;
function getDefaultContext(): TagExtractionContext {
  if (defaultContext) return defaultContext;
  defaultContext = {
    identifiers: getAllTreeIdentifiers(),
    ancestorMap: buildIdentifierAncestorMap(),
  };
  return defaultContext;
}

export function extractTagsForLab(
  lab: TagSource,
  ctx: TagExtractionContext = getDefaultContext(),
  maxCount: number = 20,
): string[] {
  const corpusParts: string[] = [];
  if (lab.aiSummary) corpusParts.push(lab.aiSummary);
  for (const w of lab.works) {
    corpusParts.push(w.title);
    if (w.titleJa) corpusParts.push(w.titleJa);
  }
  const corpus = corpusParts.join("\n");
  if (corpus.length === 0) return [];
  const lowerCorpus = corpus.toLowerCase();

  const matched: { id: string; count: number; isLeaf: boolean }[] = [];
  for (const { id, isLeaf } of ctx.identifiers) {
    if (id.length === 0) continue;
    const needle = id.toLowerCase();
    let count = 0;
    if (/^[\x00-\x7F]+$/.test(id)) {
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = lowerCorpus.match(new RegExp(`\\b${escaped}\\b`, "g"));
      count = matches ? matches.length : 0;
    } else {
      let idx = 0;
      while ((idx = lowerCorpus.indexOf(needle, idx)) !== -1) {
        count++;
        idx += needle.length;
      }
    }
    if (count > 0) matched.push({ id, count, isLeaf });
  }
  matched.sort((a, b) => b.count - a.count);

  // 直接マッチ → 祖先ラベル の順に dedupe しながら積む
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  for (const m of matched) {
    push(m.id);
    for (const a of ctx.ancestorMap.get(m.id) ?? []) push(a);
  }
  return out.slice(0, maxCount);
}

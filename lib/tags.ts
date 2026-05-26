import { getAllTreeKeywords } from "./keyword-tree";

/**
 * ラボの研究内容（aiSummary + 論文タイトル日英）から、KEYWORD_TREE の leaf
 * キーワードを出現頻度でマッチしてタグ化する。
 *
 * 戦略:
 *   - ASCII キーワード（DNA, RNA, CRISPR, AR, OS 等）は `\b` 単語境界で
 *     英文中の部分一致による誤マッチを抑制
 *   - 日本語（または日本語混じり）は substring 一致
 *
 * 出力は頻度降順で上位 `maxCount` 件。
 */
export interface TagSource {
  aiSummary: string | null;
  works: { title: string; titleJa: string | null }[];
}

export function extractTagsForLab(
  lab: TagSource,
  candidates: string[] = getAllTreeKeywords(),
  maxCount: number = 12,
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

  const matched: { keyword: string; count: number }[] = [];
  for (const kw of candidates) {
    if (kw.length === 0) continue;
    const needle = kw.toLowerCase();
    let count = 0;
    if (/^[\x00-\x7F]+$/.test(kw)) {
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
    if (count > 0) matched.push({ keyword: kw, count });
  }
  matched.sort((a, b) => b.count - a.count);
  return matched.slice(0, maxCount).map((m) => m.keyword);
}

"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "./LocaleProvider";
import { localizeTag } from "@/lib/labels-en";
import {
  KEYWORD_TREE,
  type KeywordNode,
  getNodeIdentifier,
  nodeSelectionState,
  type NodeSelectionState,
} from "@/lib/keyword-tree";

/**
 * 現在の選択集合から、大分類自身が選ばれている場合の fieldCodes を集めて返す。
 *
 * 旧仕様: 大分類配下の leaf がすべて選択 → fieldCodes 連動
 * 新仕様: 大分類自身（"生物学" 等）が選択 → fieldCodes 連動
 * 階層タグの導入により、上位ノードのクリックは「そのラベルをタグとして
 * 選ぶ」操作に変更されたため、こちらが直感的。
 */
function computeFieldCodesForSelection(selected: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const top of KEYWORD_TREE) {
    if (!top.fieldCodes || top.fieldCodes.length === 0) continue;
    if (selected.has(getNodeIdentifier(top))) {
      for (const code of top.fieldCodes) result.add(code);
    }
  }
  return result;
}

/**
 * キーワード階層ツリーのフィルタ UI。
 *
 * - URL の `kw=...` パラメータが selection の真実
 * - クリックすると、そのノード自身の識別子を toggle する
 *   （leaf は keyword、中間ノードは label。下位の cascade はしない）
 * - 各ノードに expand/collapse 状態（ローカル）と selection 状態（URL 由来）
 * - AND 絞り込みでも、上位ノードを選べばその階層でマッチするラボがヒットする
 *   （labs.tags に祖先ラベルも保存されているため）
 */

const INDICATOR: Record<NodeSelectionState, string> = {
  none: "☐",
  partial: "◧",
  all: "☑",
};

export function KeywordTreeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSet = new Set(
    searchParams
      .getAll("kw")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );

  const navigateWithKeywords = (nextSet: Set<string>) => {
    const nextFieldCodes = computeFieldCodesForSelection(nextSet);
    const next = new URLSearchParams(searchParams);
    next.delete("kw");
    for (const k of nextSet) next.append("kw", k);
    // 大分類の選択状態に応じて field code も同期
    next.delete("f");
    for (const code of nextFieldCodes) next.append("f", code);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-0.5">
      {KEYWORD_TREE.map((node) => (
        <TreeNodeRow
          key={node.label}
          node={node}
          depth={0}
          selectedSet={selectedSet}
          onToggle={navigateWithKeywords}
          initiallyOpen={false}
        />
      ))}
    </div>
  );
}

interface TreeNodeRowProps {
  node: KeywordNode;
  depth: number;
  selectedSet: Set<string>;
  onToggle: (next: Set<string>) => void;
  initiallyOpen: boolean;
}

function TreeNodeRow({
  node,
  depth,
  selectedSet,
  onToggle,
  initiallyOpen,
}: TreeNodeRowProps) {
  const isLeaf = !node.children?.length;
  const state = nodeSelectionState(node, selectedSet);
  // partial 状態のノードはデフォルトで開く（選択中の子が見える）
  const [open, setOpen] = useState(initiallyOpen || state === "partial");
  const { locale } = useT();

  const handleSelect = () => {
    const own = getNodeIdentifier(node);
    const next = new Set(selectedSet);
    if (next.has(own)) next.delete(own);
    else next.add(own);
    onToggle(next);
  };

  const indent = depth * 12;
  const stateCls =
    state === "all"
      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
      : state === "partial"
        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 dark:hover:border-blue-600";
  const fontWeight = depth === 0 ? "font-semibold" : depth === 1 ? "font-medium" : "";

  return (
    <div>
      <div className="flex items-center gap-1" style={{ paddingLeft: indent }}>
        {isLeaf ? (
          <span aria-hidden="true" className="w-4 inline-block" />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={
              open
                ? locale === "ja"
                  ? "閉じる"
                  : "Collapse"
                : locale === "ja"
                  ? "開く"
                  : "Expand"
            }
            aria-expanded={open}
            className="w-4 h-4 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            {open ? "▼" : "▶"}
          </button>
        )}
        <button
          type="button"
          onClick={handleSelect}
          aria-pressed={state === "all"}
          className={`flex-1 inline-flex items-center gap-1.5 px-2 py-1 text-sm rounded border transition-colors ${stateCls} ${fontWeight}`}
        >
          <span className="text-xs leading-none w-3 inline-block">
            {INDICATOR[state]}
          </span>
          <span>{localizeTag(node.label, locale)}</span>
        </button>
      </div>
      {!isLeaf && open && (
        <div className="mt-0.5 space-y-0.5">
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.label}
              node={child}
              depth={depth + 1}
              selectedSet={selectedSet}
              onToggle={onToggle}
              initiallyOpen={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

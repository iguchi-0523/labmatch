"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  REGION_TREE,
  regionSelectionState,
  type PrefSelectionState,
  type RegionNode,
} from "@/lib/prefecture-tree";

/**
 * 都道府県の階層フィルタ UI（地方 → 都道府県の 2 階層）。
 *
 * - URL の `p=...`（複数可）が selection の真実
 * - 地方ノードクリックで配下の都道府県を一括 toggle
 * - 各地方は expand/collapse 可能（partial 状態は自動展開）
 */

const INDICATOR: Record<PrefSelectionState, string> = {
  none: "☐",
  partial: "◧",
  all: "☑",
};

export function PrefectureTreeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSet = new Set(
    searchParams
      .getAll("p")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );

  const navigateWith = (nextSet: Set<string>) => {
    const next = new URLSearchParams(searchParams);
    next.delete("p");
    for (const p of nextSet) next.append("p", p);
    next.delete("page"); // フィルタ変更時はページを 1 に戻す
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-0.5">
      {REGION_TREE.map((region) => (
        <RegionRow
          key={region.region}
          region={region}
          selectedSet={selectedSet}
          onToggle={navigateWith}
        />
      ))}
    </div>
  );
}

interface RegionRowProps {
  region: RegionNode;
  selectedSet: Set<string>;
  onToggle: (next: Set<string>) => void;
}

function RegionRow({ region, selectedSet, onToggle }: RegionRowProps) {
  const state = regionSelectionState(region, selectedSet);
  const [open, setOpen] = useState(state === "partial");

  const handleSelectRegion = () => {
    const next = new Set(selectedSet);
    if (state === "all") {
      for (const p of region.prefectures) next.delete(p);
    } else {
      for (const p of region.prefectures) next.add(p);
    }
    onToggle(next);
  };

  const handleSelectPref = (pref: string) => {
    const next = new Set(selectedSet);
    if (next.has(pref)) next.delete(pref);
    else next.add(pref);
    onToggle(next);
  };

  const regionStateCls =
    state === "all"
      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
      : state === "partial"
        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 dark:hover:border-blue-600";

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "閉じる" : "開く"}
          aria-expanded={open}
          className="w-4 h-4 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          {open ? "▼" : "▶"}
        </button>
        <button
          type="button"
          onClick={handleSelectRegion}
          aria-pressed={state === "all"}
          className={`flex-1 inline-flex items-center gap-1.5 px-2 py-1 text-sm rounded border transition-colors font-medium ${regionStateCls}`}
        >
          <span className="text-xs leading-none w-3 inline-block">
            {INDICATOR[state]}
          </span>
          <span>{region.region}</span>
          <span
            className={`ml-auto text-[10px] ${
              state === "all" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {region.prefectures.length}
          </span>
        </button>
      </div>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-3">
          {region.prefectures.map((pref) => {
            const picked = selectedSet.has(pref);
            const cls = picked
              ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 dark:hover:border-blue-600";
            return (
              <button
                key={pref}
                type="button"
                onClick={() => handleSelectPref(pref)}
                aria-pressed={picked}
                className={`w-full inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border transition-colors ${cls}`}
              >
                <span className="text-xs leading-none w-3 inline-block">
                  {picked ? "☑" : "☐"}
                </span>
                <span>{pref}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

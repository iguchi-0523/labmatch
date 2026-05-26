"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORY_LABEL,
  getUniversityByName,
  type UniversityCategory,
} from "@/lib/universities";

/**
 * 大学の階層フィルタ UI（国立 / 公立 / 私学 → 個別大学の 2 階層）。
 *
 * - URL の `u=ID`（複数可）が selection の真実
 * - 大学のカテゴリは config/universities.json の `category` から逆引き
 *   （DB の University と config の name が一致しないものは "その他" に振り分け）
 * - カテゴリのラベルクリックで配下の大学を一括 toggle
 */

interface UniRef {
  id: number;
  name: string;
}

interface Props {
  universities: UniRef[];
}

type SelectionState = "none" | "partial" | "all";
const INDICATOR: Record<SelectionState, string> = {
  none: "☐",
  partial: "◧",
  all: "☑",
};

type Category = UniversityCategory | "other";
const CATEGORY_ORDER: Category[] = ["national", "public", "private", "other"];
const CATEGORY_DISPLAY: Record<Category, string> = {
  national: CATEGORY_LABEL.national,
  public: CATEGORY_LABEL.public,
  private: CATEGORY_LABEL.private,
  other: "その他",
};

function categorize(unis: UniRef[]): Record<Category, UniRef[]> {
  const grouped: Record<Category, UniRef[]> = {
    national: [],
    public: [],
    private: [],
    other: [],
  };
  for (const u of unis) {
    const cfg = getUniversityByName(u.name);
    const cat: Category = cfg?.category ?? "other";
    grouped[cat].push(u);
  }
  return grouped;
}

function groupState(
  ids: number[],
  selected: Set<number>,
): SelectionState {
  if (ids.length === 0) return "none";
  const hit = ids.filter((id) => selected.has(id)).length;
  if (hit === 0) return "none";
  if (hit === ids.length) return "all";
  return "partial";
}

export function UniversityTreeFilter({ universities }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSet = new Set(
    searchParams
      .getAll("u")
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0),
  );

  const navigateWith = (nextSet: Set<number>) => {
    const next = new URLSearchParams(searchParams);
    next.delete("u");
    for (const id of nextSet) next.append("u", String(id));
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  const grouped = categorize(universities);
  const visibleCategories = CATEGORY_ORDER.filter(
    (c) => grouped[c].length > 0,
  );

  return (
    <div className="space-y-0.5 max-h-80 overflow-y-auto">
      {visibleCategories.map((cat) => (
        <CategoryRow
          key={cat}
          category={cat}
          unis={grouped[cat]}
          selectedSet={selectedSet}
          onToggle={navigateWith}
        />
      ))}
    </div>
  );
}

interface CategoryRowProps {
  category: Category;
  unis: UniRef[];
  selectedSet: Set<number>;
  onToggle: (next: Set<number>) => void;
}

function CategoryRow({
  category,
  unis,
  selectedSet,
  onToggle,
}: CategoryRowProps) {
  const ids = unis.map((u) => u.id);
  const state = groupState(ids, selectedSet);
  const [open, setOpen] = useState(state === "partial");

  const handleSelectCategory = () => {
    const next = new Set(selectedSet);
    if (state === "all") {
      for (const id of ids) next.delete(id);
    } else {
      for (const id of ids) next.add(id);
    }
    onToggle(next);
  };

  const handleSelectUni = (id: number) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onToggle(next);
  };

  const catCls =
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
          onClick={handleSelectCategory}
          aria-pressed={state === "all"}
          className={`flex-1 inline-flex items-center gap-1.5 px-2 py-1 text-sm rounded border transition-colors font-medium ${catCls}`}
        >
          <span className="text-xs leading-none w-3 inline-block">
            {INDICATOR[state]}
          </span>
          <span>{CATEGORY_DISPLAY[category]}</span>
          <span
            className={`ml-auto text-[10px] ${
              state === "all" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {unis.length}
          </span>
        </button>
      </div>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-3">
          {unis.map((u) => {
            const picked = selectedSet.has(u.id);
            const cls = picked
              ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 dark:hover:border-blue-600";
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectUni(u.id)}
                aria-pressed={picked}
                className={`w-full inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border transition-colors ${cls}`}
              >
                <span className="text-xs leading-none w-3 inline-block">
                  {picked ? "☑" : "☐"}
                </span>
                <span className="truncate">{u.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

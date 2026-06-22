"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FAVORITES_EVENT, getFavorites } from "@/lib/favorites-client";
import { useT } from "./LocaleProvider";

/**
 * 検索結果の並び替えセレクト。即時 URL 反映。
 *
 * - 通常 sort=works/name/new は URL の sort= に書くだけ
 * - sort=recommend のときは localStorage のお気に入りを snapshot して
 *   URL に `favIds=...` も埋める（サーバー側でスコアリングするため）
 * - お気に入り 0 件のときは「おすすめ順」を disabled
 */

const SORT_VALUES = ["works", "popular", "name", "new", "recommend"] as const;
type SortValue = (typeof SORT_VALUES)[number];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") ?? "works") as SortValue;

  const [favCount, setFavCount] = useState(0);
  useEffect(() => {
    const update = () => setFavCount(getFavorites().length);
    update();
    window.addEventListener(FAVORITES_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const onChange = (next: SortValue) => {
    const params = new URLSearchParams(searchParams);
    if (next === "works") params.delete("sort");
    else params.set("sort", next);

    if (next === "recommend") {
      const ids = getFavorites();
      params.delete("favIds");
      for (const id of ids) params.append("favIds", String(id));
    }
    // ページは 1 にリセット
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { locale } = useT();
  const labels: Record<SortValue, string> =
    locale === "ja"
      ? {
          works: "論文数（多い順）",
          popular: "人気順（閲覧が多い順）",
          name: "名前順",
          new: "新着順",
          recommend: "お気に入りからのおすすめ順",
        }
      : {
          works: "Most papers",
          popular: "Most viewed",
          name: "Name",
          new: "Newest",
          recommend: "Recommended from favorites",
        };
  const sortByLabel = locale === "ja" ? "並び替え" : "Sort by";
  const needFavSuffix = locale === "ja" ? "（お気に入りを登録してから）" : " (add favorites first)";
  const needFavNote =
    locale === "ja"
      ? "お気に入りが 0 件です。研究室カードの ☆ で追加してください。"
      : "No favorites yet. Add some with the ☆ on lab cards.";

  return (
    <div>
      <label
        className="block text-xs text-gray-700 dark:text-gray-300 mb-1"
        htmlFor="sort-select"
      >
        {sortByLabel}
      </label>
      <select
        id="sort-select"
        value={current}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {SORT_VALUES.map((v) => (
          <option
            key={v}
            value={v}
            disabled={v === "recommend" && favCount === 0}
          >
            {labels[v]}
            {v === "recommend" && favCount === 0 ? needFavSuffix : ""}
          </option>
        ))}
      </select>
      {current === "recommend" && favCount === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          {needFavNote}
        </p>
      )}
    </div>
  );
}

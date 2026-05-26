"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FAVORITES_EVENT, getFavorites } from "@/lib/favorites-client";

/**
 * 検索結果をお気に入り研究室のみに絞り込むチェックボックス。
 *
 * - toggle 時に URL に `fav=1` と `favIds=...` を埋める（snapshot）
 * - お気に入り 0 件の状態では disabled
 * - お気に入りが更新されてもチェックを維持しているとリセット必要 →
 *   "更新" ボタンで再 snapshot
 */

export function FavoritesFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enabled = searchParams.get("fav") === "1";

  const [favCount, setFavCount] = useState(0);
  const [urlIds, setUrlIds] = useState<number[]>([]);

  useEffect(() => {
    const updateCount = () => setFavCount(getFavorites().length);
    updateCount();
    window.addEventListener(FAVORITES_EVENT, updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  useEffect(() => {
    setUrlIds(
      searchParams
        .getAll("favIds")
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0),
    );
  }, [searchParams]);

  const navigateWithFavorites = (turnOn: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (turnOn) {
      const ids = getFavorites();
      next.set("fav", "1");
      next.delete("favIds");
      for (const id of ids) next.append("favIds", String(id));
    } else {
      next.delete("fav");
      next.delete("favIds");
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const disabled = !enabled && favCount === 0;
  const isStale =
    enabled && JSON.stringify([...urlIds].sort()) !== JSON.stringify([...getFavorites()].sort());

  return (
    <div className="space-y-2">
      <label
        className={`flex items-center text-sm gap-2 ${
          disabled
            ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
            : "cursor-pointer text-gray-800 dark:text-gray-200"
        }`}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => navigateWithFavorites(e.target.checked)}
          disabled={disabled}
        />
        <span>
          お気に入りのみ
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            （{favCount} 件登録中）
          </span>
        </span>
      </label>
      {isStale && (
        <button
          type="button"
          onClick={() => navigateWithFavorites(true)}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline ml-6"
        >
          お気に入りが更新されています — 検索条件を再同期
        </button>
      )}
    </div>
  );
}

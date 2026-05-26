"use client";

import { useEffect, useState } from "react";
import {
  FAVORITES_EVENT,
  getFavorites,
  toggleFavorite,
} from "@/lib/favorites-client";

type Size = "sm" | "md";

interface FavoriteButtonProps {
  labId: number;
  size?: Size;
  /** カードの中など、親 Link のクリックを抑止する場合は true */
  stopParentLink?: boolean;
  className?: string;
}

export function FavoriteButton({
  labId,
  size = "md",
  stopParentLink = false,
  className = "",
}: FavoriteButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorited(getFavorites().includes(labId));
    const handler = () => setFavorited(getFavorites().includes(labId));
    window.addEventListener(FAVORITES_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [labId]);

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopParentLink) {
      e.preventDefault();
      e.stopPropagation();
    }
    const { favorited: next } = toggleFavorite(labId);
    setFavorited(next);
  };

  const sizeCls =
    size === "sm"
      ? "w-7 h-7 text-base"
      : "w-9 h-9 text-xl";

  // 未マウント時のニュートラル表示（hydration mismatch 回避）
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 ${sizeCls} ${className}`}
      >
        ☆
      </span>
    );
  }

  const stateCls = favorited
    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:border-amber-400 hover:text-amber-400";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      aria-label={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      title={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      className={`inline-flex items-center justify-center rounded-full border transition-colors ${sizeCls} ${stateCls} ${className}`}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}

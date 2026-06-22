"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FAVORITES_EVENT, getFavorites } from "@/lib/favorites-client";
import { useT } from "./LocaleProvider";

interface FavoritesNavLinkProps {
  className?: string;
  showZero?: boolean;
}

export function FavoritesNavLink({
  className = "",
  showZero = false,
}: FavoritesNavLinkProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setCount(getFavorites().length);
    update();
    window.addEventListener(FAVORITES_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const showCount = count !== null && (count > 0 || showZero);
  const { locale, t } = useT();

  return (
    <Link href="/favorites" className={className}>
      {t.favorites}
      {showCount && (
        <span
          className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] px-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full"
          aria-label={locale === "ja" ? `${count} 件のお気に入り` : `${count} favorites`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

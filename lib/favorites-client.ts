"use client";

/**
 * お気に入り（localStorage ベース、認証なし）
 *
 * - 保存形式: number[]（lab.id の配列）
 * - キー: `labmatch:favorites:v1`
 * - 変更時は custom event `labmatch:favorites-changed` を発火し、別タブからは
 *   `storage` イベントで補足する
 */

export const FAVORITES_KEY = "labmatch:favorites:v1";
export const FAVORITES_EVENT = "labmatch:favorites-changed";

export function getFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

function writeFavorites(ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    // localStorage が無効・容量超過などの場合は無視
  }
}

export function isFavorite(labId: number): boolean {
  return getFavorites().includes(labId);
}

export function addFavorite(labId: number): number[] {
  const current = getFavorites();
  if (current.includes(labId)) return current;
  const next = [...current, labId];
  writeFavorites(next);
  return next;
}

export function removeFavorite(labId: number): number[] {
  const current = getFavorites();
  if (!current.includes(labId)) return current;
  const next = current.filter((id) => id !== labId);
  writeFavorites(next);
  return next;
}

export function toggleFavorite(labId: number): { favorited: boolean; ids: number[] } {
  const current = getFavorites();
  if (current.includes(labId)) {
    const ids = removeFavorite(labId);
    return { favorited: false, ids };
  } else {
    const ids = addFavorite(labId);
    return { favorited: true, ids };
  }
}

export function clearFavorites(): void {
  writeFavorites([]);
}

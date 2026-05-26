/**
 * テーマ設定（localStorage 保存）
 *
 * - 値は "system" | "light" | "dark"
 * - system は OS の `prefers-color-scheme` に従う（初期値）
 * - light / dark でユーザーが明示的に固定可能
 * - 変更時 `labmatch:theme-changed` イベントを発火
 *
 * 描画時の flash を防ぐため、layout.tsx で <head> 内に inline script を入れて
 * React hydrate 前に html.dark の有無を決定する。getInlineScript() がその文字列。
 */

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "labmatch:theme:v1";
export const THEME_EVENT = "labmatch:theme-changed";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return "system";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
  applyResolvedTheme(resolveTheme(theme));
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

/**
 * <head> に入れる inline script。React hydrate 前に
 * localStorage を見て html.dark を立て、白→黒フラッシュを防ぐ。
 */
export function getInlineScript(): string {
  return `(function(){try{var k='${THEME_KEY}';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark'||s==='system')?s:'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;if(r==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
}

"use client";

import { useEffect, useState } from "react";
import {
  THEME_EVENT,
  applyResolvedTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type Theme,
} from "@/lib/theme-client";
import { useT } from "./LocaleProvider";

const THEME_LABELS: Record<"ja" | "en", Record<Theme, string>> = {
  ja: { system: "自動", light: "ライト", dark: "ダーク" },
  en: { system: "Auto", light: "Light", dark: "Dark" },
};
const THEME_ICONS: Record<Theme, string> = {
  system: "🖥",
  light: "☀",
  dark: "🌙",
};
const THEME_ORDER: Theme[] = ["system", "light", "dark"];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    setTheme(stored);

    // system 設定時、OS テーマ変更に追随
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (getStoredTheme() === "system") {
        applyResolvedTheme(resolveTheme("system"));
      }
    };
    mql.addEventListener("change", onSystemChange);

    const onThemeEvent = () => setTheme(getStoredTheme());
    window.addEventListener(THEME_EVENT, onThemeEvent);
    window.addEventListener("storage", onThemeEvent);

    return () => {
      mql.removeEventListener("change", onSystemChange);
      window.removeEventListener(THEME_EVENT, onThemeEvent);
      window.removeEventListener("storage", onThemeEvent);
    };
  }, []);

  const onChange = (next: Theme) => {
    setTheme(next);
    setStoredTheme(next);
  };

  const { locale } = useT();
  const labels = THEME_LABELS[locale];

  return (
    <div
      className={`inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden text-xs ${className}`}
      role="radiogroup"
      aria-label={locale === "ja" ? "表示モード" : "Theme"}
    >
      {THEME_ORDER.map((value) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            role="radio"
            aria-checked={active}
            title={labels[value]}
            className={`px-2 py-1 flex items-center gap-1 transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span aria-hidden="true">{THEME_ICONS[value]}</span>
            <span>{labels[value]}</span>
          </button>
        );
      })}
    </div>
  );
}

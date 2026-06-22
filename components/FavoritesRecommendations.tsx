"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FAVORITES_EVENT, getFavorites } from "@/lib/favorites-client";
import { localizeFieldLabel } from "@/lib/labels-en";
import type { RelatedLab } from "@/lib/recommendations";
import { useT } from "./LocaleProvider";

interface Props {
  /** 取得上限（API に渡す） */
  limit?: number;
  /** 表示するスタイル。`hero` はトップ向けに大きめ、`compact` は /favorites 向けにシンプル */
  variant?: "hero" | "compact";
  /** お気に入りが 0 件のとき、コンポーネント全体を隠すなら true */
  hideWhenEmpty?: boolean;
  /** 見出しテキスト。空文字で見出し非表示 */
  heading?: string;
  /** 見出し下に表示する説明文 */
  subheading?: string;
  /** お気に入りの数を見出しに付与するか */
  showCount?: boolean;
  /** お気に入りページへの導線を表示するか */
  showFavoritesLink?: boolean;
  className?: string;
}

export function FavoritesRecommendations({
  limit = 12,
  variant = "compact",
  hideWhenEmpty = false,
  heading = "",
  subheading = "",
  showCount = false,
  showFavoritesLink = false,
  className = "",
}: Props) {
  const [ids, setIds] = useState<number[] | null>(null);
  const [labs, setLabs] = useState<RelatedLab[]>([]);
  const [loading, setLoading] = useState(false);
  const { locale, t } = useT();

  useEffect(() => {
    const update = () => setIds(getFavorites());
    update();
    window.addEventListener(FAVORITES_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    if (ids === null) return;
    if (ids.length === 0) {
      setLabs([]);
      return;
    }
    setLoading(true);
    fetch(`/api/recommend/from-favorites?ids=${ids.join(",")}&limit=${limit}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { labs: RelatedLab[] }) => {
        setLabs(data.labs);
        setLoading(false);
      })
      .catch(() => {
        setLabs([]);
        setLoading(false);
      });
  }, [ids, limit]);

  // SSR 中・hydration 直後はサイズを安定させるため何も描画しない
  if (ids === null) return null;

  if (ids.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div
        className={`text-sm text-gray-500 dark:text-gray-400 py-6 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 ${className}`}
      >
        {locale === "ja"
          ? "お気に入りに登録された研究室はまだありません。"
          : "No favorite labs yet."}
        <br />
        <Link
          href="/labs"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {locale === "ja" ? "研究室を探す →" : "Find labs →"}
        </Link>
      </div>
    );
  }

  const isHero = variant === "hero";

  return (
    <div className={className}>
      {(heading || showFavoritesLink) && (
        <div className="mb-3 flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            {heading && (
              <h2
                className={`${isHero ? "text-xl" : "text-lg"} font-semibold text-gray-900 dark:text-gray-100`}
              >
                {heading}
                {showCount && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
                    {locale === "ja"
                      ? `（お気に入り ${ids.length} 件から）`
                      : `(from ${ids.length} favorites)`}
                  </span>
                )}
              </h2>
            )}
            {subheading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subheading}
              </p>
            )}
          </div>
          {showFavoritesLink && (
            <Link
              href="/favorites"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              {locale === "ja" ? "お気に入り一覧 →" : "All favorites →"}
            </Link>
          )}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          {locale === "ja" ? "読み込み中…" : "Loading…"}
        </p>
      ) : labs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
          {locale === "ja"
            ? "関連する研究室が見つかりませんでした。お気に入りを増やすと精度が上がります。"
            : "No related labs found. Adding more favorites improves accuracy."}
        </p>
      ) : (
        <ul
          className={
            isHero
              ? "grid grid-cols-1 sm:grid-cols-2 gap-3 text-left"
              : "space-y-2"
          }
        >
          {labs.map((lab) => {
            const fieldJp = localizeFieldLabel(
              lab.primaryFieldCode,
              locale,
              lab.primaryFieldName,
            );
            return (
              <li
                key={lab.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded hover:border-blue-400 dark:hover:border-blue-500 transition-all"
              >
                <Link href={`/labs/${lab.id}`} className="block p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className={`${isHero ? "font-semibold text-sm" : "font-medium text-sm"} text-gray-900 dark:text-gray-100 leading-snug`}
                      >
                        {lab.professorName} {t.lab}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                        {lab.university.name}
                        {lab.department && (
                          <span className="text-gray-500 dark:text-gray-400">
                            ・{lab.department}
                          </span>
                        )}
                      </div>
                    </div>
                    {fieldJp && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap border border-blue-200 dark:border-blue-900 self-center">
                        {fieldJp}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span>
                      {locale === "ja"
                        ? `論文 ${lab._count.works} 件`
                        : `${lab._count.works} papers`}
                    </span>
                    {lab.sharedTags.length > 0 && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">
                          ·
                        </span>
                        <span className="text-blue-700 dark:text-blue-300 truncate">
                          {locale === "ja" ? "共通: " : "Shared: "}
                          {lab.sharedTags.slice(0, 4).join(", ")}
                          {lab.sharedTags.length > 4 &&
                            ` +${lab.sharedTags.length - 4}`}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

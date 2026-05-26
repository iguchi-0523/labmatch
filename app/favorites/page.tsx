"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FAVORITES_EVENT,
  clearFavorites,
  getFavorites,
  removeFavorite,
} from "@/lib/favorites-client";
import { FIELD_LABEL_BY_CODE } from "@/lib/field-labels";
import type { RelatedLab } from "@/lib/recommendations";

interface FavLab {
  id: number;
  name: string;
  professorName: string;
  department: string | null;
  primaryFieldCode: string | null;
  primaryFieldName: string | null;
  university: { id: number; name: string; prefecture: string | null };
  _count: { works: number };
}

export default function FavoritesPage() {
  const [ids, setIds] = useState<number[] | null>(null);
  const [labs, setLabs] = useState<FavLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<RelatedLab[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  // localStorage → ids
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

  // ids → fetch lab data
  useEffect(() => {
    if (ids === null) return;
    if (ids.length === 0) {
      setLabs([]);
      setRecommended([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/labs/by-ids?ids=${ids.join(",")}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { labs: FavLab[] }) => {
        setLabs(data.labs);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
  }, [ids]);

  // ids → fetch recommendations
  useEffect(() => {
    if (ids === null || ids.length === 0) {
      setRecommended([]);
      return;
    }
    setRecLoading(true);
    fetch(`/api/recommend/from-favorites?ids=${ids.join(",")}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { labs: RelatedLab[] }) => {
        setRecommended(data.labs);
        setRecLoading(false);
      })
      .catch(() => {
        setRecommended([]);
        setRecLoading(false);
      });
  }, [ids]);

  const onRemove = (labId: number) => {
    removeFavorite(labId);
    // setIds は FAVORITES_EVENT 経由で更新される
  };

  const onClearAll = () => {
    if (
      window.confirm(
        "お気に入りをすべて削除します。よろしいですか？（やり直しはできません）",
      )
    ) {
      clearFavorites();
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← トップ
        </Link>
      </nav>

      <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800 flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            お気に入り
            {ids !== null && ids.length > 0 && (
              <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                （{ids.length} 件）
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            このブラウザに保存されています。アカウント連携はまだありません。
          </p>
        </div>
        {ids !== null && ids.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 underline"
          >
            すべて削除
          </button>
        )}
      </header>

      {ids === null || loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-12 text-center">
          読み込み中…
        </p>
      ) : ids.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            お気に入りに登録された研究室はまだありません。
          </p>
          <Link
            href="/labs"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          >
            研究室を探す →
          </Link>
        </div>
      ) : error ? (
        <p className="text-red-700 dark:text-red-400 text-sm py-8 text-center">
          読み込みに失敗しました（{error}）。再読み込みしてください。
        </p>
      ) : (
        <ul className="space-y-3">
          {labs.map((lab) => {
            const fieldJp = lab.primaryFieldCode
              ? (FIELD_LABEL_BY_CODE[lab.primaryFieldCode] ??
                lab.primaryFieldName)
              : null;
            return (
              <li key={lab.id} className="relative">
                <Link
                  href={`/labs/${lab.id}`}
                  className="block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 pr-10">
                    <div className="min-w-0">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-snug">
                        {lab.professorName} 研究室
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {lab.university.name}
                        {lab.department && (
                          <span className="text-gray-500 dark:text-gray-400">
                            ・{lab.department}
                          </span>
                        )}
                      </div>
                    </div>
                    {fieldJp && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap shrink-0 border border-blue-200 dark:border-blue-900">
                        {fieldJp}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    論文 {lab._count.works} 件
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => onRemove(lab.id)}
                  aria-label="お気に入りから削除"
                  title="お気に入りから削除"
                  className="absolute top-3 right-3 w-7 h-7 inline-flex items-center justify-center rounded-full border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-400 hover:text-red-500 transition-colors"
                >
                  ★
                </button>
              </li>
            );
          })}
          {ids.length > labs.length && (
            <li className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
              {ids.length - labs.length} 件の研究室は削除されたか見つかりませんでした。
            </li>
          )}
        </ul>
      )}

      {/* レコメンド：お気に入り 1 件以上のとき表示 */}
      {ids !== null && ids.length > 0 && (
        <section className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            あなたへのおすすめ
            {recommended.length > 0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
                ({recommended.length} 件)
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            お気に入りの研究室と共通タグ・同分野のラボから関連度順に表示します。
          </p>
          {recLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              読み込み中…
            </p>
          ) : recommended.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
              関連する研究室が見つかりませんでした。
            </p>
          ) : (
            <ul className="space-y-2">
              {recommended.map((lab) => {
                const fieldJp = lab.primaryFieldCode
                  ? (FIELD_LABEL_BY_CODE[lab.primaryFieldCode] ??
                    lab.primaryFieldName)
                  : null;
                return (
                  <li
                    key={lab.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                  >
                    <Link href={`/labs/${lab.id}`} className="block p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">
                            {lab.professorName} 研究室
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
                        <span>論文 {lab._count.works} 件</span>
                        {lab.sharedTags.length > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-blue-700 dark:text-blue-300">
                              共通: {lab.sharedTags.slice(0, 4).join(", ")}
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
        </section>
      )}
    </main>
  );
}

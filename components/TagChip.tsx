"use client";

import { useRouter } from "next/navigation";
import { useT } from "./LocaleProvider";

/**
 * lab カード内に表示するタグチップ。クリックで親 Link を抑止して
 * router.push で検索フィルタに該当キーワードを追加する。
 */

interface Props {
  tag: string;
  href: string;
}

export function TagChip({ tag, href }: Props) {
  const router = useRouter();
  const { locale } = useT();
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href, { scroll: false });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] leading-none px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
      title={locale === "ja" ? `「${tag}」で絞り込む` : `Filter by "${tag}"`}
    >
      {tag}
    </button>
  );
}

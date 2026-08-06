"use client";

import { useRouter } from "next/navigation";
import { useT } from "./LocaleProvider";
import { localizeTag } from "@/lib/labels-en";

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
  const display = localizeTag(tag, locale);
  return (
    <button
      type="button"
      onClick={onClick}
      className="tag-chip"
      title={locale === "ja" ? `「${display}」で絞り込む` : `Filter by "${display}"`}
    >
      {display}
    </button>
  );
}

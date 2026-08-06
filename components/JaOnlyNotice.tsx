"use client";

import Link from "next/link";
import { useT } from "./LocaleProvider";

/**
 * en ロケールのときだけ、「このページは今は日本語のみ」という注記を出す。
 * about / privacy / terms など、本文を翻訳していないページの先頭に置く。
 * ja のときは何も描画しない。
 *
 * ロケールはクライアントの LocaleProvider から取る。以前はサーバで cookie を
 * 読んで locale を prop で渡していたが、cookie を読むとページが CDN キャッシュ
 * 対象から外れ、リクエストごとに origin 描画 + 転送が発生する。判定をクライアント
 * 側に寄せることで、ページ本体を静的（ISR）に保ったまま注記を出せる。
 */
export function JaOnlyNotice() {
  const { locale } = useT();
  if (locale !== "en") return null;
  return (
    <div className="mb-6 rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      This page is only available in Japanese for now. An English version isn&apos;t
      ready yet — if enough people ask for one, we&apos;ll translate it. You can
      request it from the{" "}
      <Link href="/contact" className="underline hover:no-underline">
        contact page
      </Link>
      .
    </div>
  );
}

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * en ロケールのときだけ、「このページは今は日本語のみ」という注記を出す。
 * about / privacy / terms など、本文を翻訳していないページの先頭に置く。
 * ja のときは何も描画しない。
 */
export function JaOnlyNotice({ locale }: { locale: Locale }) {
  if (locale !== "en") return null;
  return (
    <div className="mb-6 rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      This page is only available in Japanese for now. An English version isn't
      ready yet — if enough people ask for one, we'll translate it. You can
      request it from the{" "}
      <Link href="/contact" className="underline hover:no-underline">
        contact page
      </Link>
      .
    </div>
  );
}

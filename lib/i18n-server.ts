import { cookies } from "next/headers";
import { DEFAULT_LOCALE, getDict, LOCALE_COOKIE, isLocale, type Locale } from "./i18n";

/** Server Component で現在のロケールを cookie から得る。未設定なら ja。 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Server Component 用：ロケールと辞書をまとめて返す。 */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}

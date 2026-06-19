/**
 * サイト全体で使う正規 URL・名称。
 *
 * Vercel で labmatch.jp → www.labmatch.jp の 308 リダイレクトを設定済みなので、
 * 正規 URL（canonical）はリダイレクト先の www を採用する。
 */
export const SITE_URL = "https://www.labmatch.jp";
export const SITE_NAME = "ラボマッチ";

/**
 * 運営者情報。プライバシーポリシー・利用規約・問い合わせ導線で使う。
 *
 * TODO（運営者が記入）:
 *   - OPERATOR_NAME を実際の表示名（本名 or ハンドル）に
 *   - CONTACT_EMAIL を公開してよい連絡先メールに（空のままなら
 *     「削除・修正フォーム経由」の案内だけ表示し、メールは出さない）
 */
export const OPERATOR_NAME = "ラボマッチ運営";
export const CONTACT_EMAIL = "";
/** 一次対応の目安（削除・修正依頼フォームの文言と合わせる） */
export const SUPPORT_SLA_HOURS = 72;

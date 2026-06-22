/**
 * 管理者宛のメール通知。Resend の REST API を fetch で叩く（SDK 依存なし）。
 *
 * 有効化に必要な環境変数（Vercel に設定）:
 *   RESEND_API_KEY      … Resend の API キー
 *   ADMIN_NOTIFY_EMAIL  … 通知先（自分の受信用メール）
 *   RESEND_FROM         … 任意。送信元。未設定なら onboarding@resend.dev
 *                         （ドメイン未検証でも Resend アカウントの本人宛には届く）
 *
 * いずれかが未設定なら何もしない（no-op）。送信に失敗してもフォーム本体は
 * 止めないよう、ここで例外を握りつぶし false を返す。
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendMail(subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!apiKey || !to) return false; // 未設定＝通知オフ
  const from = process.env.RESEND_FROM ?? "ラボマッチ <onboarding@resend.dev>";
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[notify] Resend 送信失敗", res.status, detail);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] Resend エラー", e);
    return false;
  }
}

const ADMIN_URL = "https://www.labmatch.jp/admin";

export async function notifyNewContact(msg: {
  id: number;
  category: string;
  email: string;
  subject: string | null;
  body: string;
  locale: string;
}): Promise<void> {
  const subject = `[ラボマッチ] お問い合わせ ${msg.category} #${msg.id}`;
  const text = [
    `種別: ${msg.category}`,
    `言語: ${msg.locale}`,
    `送信者: ${msg.email}`,
    `件名: ${msg.subject ?? "(なし)"}`,
    "",
    msg.body,
    "",
    `一覧: ${ADMIN_URL}`,
  ].join("\n");
  await sendMail(subject, text);
}

export async function notifyNewReport(r: {
  id: number;
  labId: number;
  reportType: string;
  reporterEmail: string;
  reporterEmailDomain: string;
  reason: string;
}): Promise<void> {
  const subject = `[ラボマッチ] 掲載依頼 ${r.reportType} lab#${r.labId} #${r.id}`;
  const text = [
    `種別: ${r.reportType}`,
    `対象ラボ: https://www.labmatch.jp/labs/${r.labId}`,
    `依頼者: ${r.reporterEmail} (${r.reporterEmailDomain})`,
    "",
    r.reason,
    "",
    `一覧: ${ADMIN_URL}`,
  ].join("\n");
  await sendMail(subject, text);
}

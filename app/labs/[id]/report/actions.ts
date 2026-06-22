"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notifyNewReport } from "@/lib/notify";

export interface ReportFormState {
  errors?: {
    reporterEmail?: string;
    reportType?: string;
    reason?: string;
  };
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REPORT_TYPES = new Set(["removal", "correction"]);

export async function submitReport(
  labId: number,
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const reporterEmail = String(formData.get("reporterEmail") ?? "").trim();
  const reporterAffiliation = String(
    formData.get("reporterAffiliation") ?? "",
  ).trim();
  const reportType = String(formData.get("reportType") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  const errors: NonNullable<ReportFormState["errors"]> = {};
  if (!EMAIL_RE.test(reporterEmail)) {
    errors.reporterEmail = "メールアドレスの形式が正しくありません。";
  }
  if (!REPORT_TYPES.has(reportType)) {
    errors.reportType = "依頼種別を選択してください。";
  }
  if (reason.length < 10) {
    errors.reason = "依頼内容は 10 文字以上で記入してください。";
  } else if (reason.length > 4000) {
    errors.reason = "依頼内容は 4000 文字以内で記入してください。";
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: { id: true },
  });
  if (!lab) {
    return { message: "該当する研究室が見つかりませんでした。" };
  }

  const emailDomain =
    reporterEmail.split("@", 2)[1]?.toLowerCase().trim() ?? "";

  const created = await prisma.labReport.create({
    data: {
      labId,
      reporterEmail,
      reporterEmailDomain: emailDomain,
      reporterAffiliation: reporterAffiliation || null,
      reason,
      reportType,
      status: "pending",
    },
  });

  // 管理者へメール通知（環境変数未設定なら no-op、失敗してもここで握りつぶす）
  await notifyNewReport(created);

  redirect(`/labs/${labId}/report/thanks`);
}

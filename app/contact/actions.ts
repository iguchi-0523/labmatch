"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notifyNewContact } from "@/lib/notify";

export interface ContactFormState {
  errors?: { email?: string; category?: string; body?: string };
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = new Set(["question", "feature", "other"]);

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const locale = String(formData.get("locale") ?? "ja").trim();

  const errors: NonNullable<ContactFormState["errors"]> = {};
  if (!EMAIL_RE.test(email)) errors.email = "invalid_email";
  if (!CATEGORIES.has(category)) errors.category = "invalid_category";
  if (body.length < 10) errors.body = "too_short";
  else if (body.length > 4000) errors.body = "too_long";
  if (Object.keys(errors).length > 0) return { errors };

  const created = await prisma.contactMessage.create({
    data: {
      email,
      category,
      subject: subject || null,
      body,
      locale: locale === "en" ? "en" : "ja",
      status: "new",
    },
  });

  // 管理者へメール通知（環境変数未設定なら no-op、失敗してもここで握りつぶす）
  await notifyNewContact(created);

  redirect("/contact/thanks");
}

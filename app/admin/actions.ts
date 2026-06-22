"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const CONTACT_STATUSES = new Set(["new", "read", "done"]);
const REPORT_STATUSES = new Set([
  "pending",
  "reviewing",
  "removed",
  "kept",
  "corrected",
]);

export async function setContactStatus(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(id) || !CONTACT_STATUSES.has(status)) return;
  await prisma.contactMessage.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}

export async function setReportStatus(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(id) || !REPORT_STATUSES.has(status)) return;
  const resolved = status === "removed" || status === "kept" || status === "corrected";
  await prisma.labReport.update({
    where: { id },
    data: {
      status,
      resolutionNote: note || null,
      resolvedAt: resolved ? new Date() : null,
    },
  });
  revalidatePath("/admin");
}

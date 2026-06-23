import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * ラボ閲覧数の加算のみを行う。ISR キャッシュされるラボ詳細ページの代わりに、
 * クライアントの ViewBeacon がここを叩いて viewCount を増やす（人気順ソート用）。
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const labId = Number(id);
  if (!Number.isInteger(labId) || labId <= 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await prisma.lab
    .update({ where: { id: labId }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}

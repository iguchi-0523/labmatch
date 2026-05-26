import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * 複数のラボ ID を受け取り、ラボ情報を返す。お気に入りページ用。
 * 入力: ?ids=1,2,3
 * 上限: 200 件（DoS 抑止）
 * 論理削除されたラボは含めない。
 */

const MAX_IDS = 200;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  const uniqueIds = [...new Set(ids)].slice(0, MAX_IDS);

  if (uniqueIds.length === 0) {
    return NextResponse.json({ labs: [] });
  }

  const labs = await prisma.lab.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: {
      id: true,
      name: true,
      professorName: true,
      department: true,
      primaryFieldCode: true,
      primaryFieldName: true,
      university: { select: { id: true, name: true, prefecture: true } },
      _count: { select: { works: true } },
    },
  });

  // 入力 ID の順序を保ったまま返す（直感的な並び）
  const labMap = new Map(labs.map((l) => [l.id, l]));
  const ordered = uniqueIds
    .map((id) => labMap.get(id))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);

  return NextResponse.json({ labs: ordered });
}

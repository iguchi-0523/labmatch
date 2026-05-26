import { NextResponse } from "next/server";
import { getRecommendedFromFavorites } from "@/lib/recommendations";

/**
 * お気に入りの研究室群から関連する研究室を推薦する。
 * 入力: ?ids=1,2,3
 * 上限: 100 件のお気に入り入力、12 件の推薦結果
 */

const MAX_INPUT = 100;
const MAX_RESULTS = 12;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  const uniqueIds = [...new Set(ids)].slice(0, MAX_INPUT);

  if (uniqueIds.length === 0) {
    return NextResponse.json({ labs: [] });
  }

  const recommended = await getRecommendedFromFavorites(
    uniqueIds,
    MAX_RESULTS,
  );

  return NextResponse.json({ labs: recommended });
}

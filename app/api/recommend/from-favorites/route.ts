import { NextResponse } from "next/server";
import { getRecommendedFromFavorites } from "@/lib/recommendations";

/**
 * お気に入りの研究室群から関連する研究室を推薦する。
 * 入力: ?ids=1,2,3&limit=12
 * 上限: 100 件のお気に入り入力、24 件まで推薦
 */

const MAX_INPUT = 100;
const DEFAULT_RESULTS = 12;
const MAX_RESULTS = 24;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  const uniqueIds = [...new Set(ids)].slice(0, MAX_INPUT);

  const rawLimit = Number(searchParams.get("limit"));
  const limit = Math.min(
    MAX_RESULTS,
    Math.max(
      1,
      Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_RESULTS,
    ),
  );

  if (uniqueIds.length === 0) {
    return NextResponse.json({ labs: [] });
  }

  const recommended = await getRecommendedFromFavorites(uniqueIds, limit);

  return NextResponse.json({ labs: recommended });
}

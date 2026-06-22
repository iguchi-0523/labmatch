import { PrismaClient } from "@prisma/client";

// Next.js のホットリロードで複数の PrismaClient が作られないようにシングルトン化
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * サーバーレス（Vercel）向けに 1 インスタンスあたりの接続数を絞る。
 *
 * Railway Hobby Postgres は max_connections=100。プールが無い状態で Vercel が
 * 同時インスタンスを増やすと、各インスタンスが既定（CPU 数×2+1）ぶんの接続を
 * 開いて上限に当たり、/（force-dynamic）等が 500 になる（2026-06-22 発生）。
 * connection_limit を小さくして、多数インスタンス × 少数接続でも 100 を
 * 超えにくくする。秘密情報は env のまま、クエリパラメータだけ付与する。
 */
function buildDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  try {
    const u = new URL(base);
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", "3");
    }
    if (!u.searchParams.has("pool_timeout")) {
      u.searchParams.set("pool_timeout", "20");
    }
    return u.toString();
  } catch {
    return base;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: buildDatasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

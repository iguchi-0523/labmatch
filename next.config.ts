import type { NextConfig } from "next";

/**
 * `/labs` は searchParams を読むので描画自体は毎リクエスト走る。Next.js は
 * この種のルートに `private, no-store` を付けるため、放っておくと CDN を
 * 素通りして 1 リクエストごとに origin 描画 + 転送が発生する。1 枚 gzip 約
 * 67 KB あり、Hobby の Fast Origin Transfer 10 GB/月を最も食っていた。
 *
 * cookie 依存を外したのでレスポンスは URL だけで決まる。ここで s-maxage を
 * 明示して CDN に載せ、同じ URL の 2 回目以降を edge で返す。
 * stale-while-revalidate を長く取り、期限切れでも古い版を即返しつつ裏で
 * 更新する（クローラの再訪が origin に落ちない）。
 *
 * ただしお気に入り由来の URL（fav / favIds / sort=recommend）は閲覧者ごとに
 * 中身が変わるので、`missing` で除外して従来どおり都度描画にする。
 */
const CDN_CACHE = "public, s-maxage=3600, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/labs",
        missing: [
          { type: "query", key: "fav" },
          { type: "query", key: "favIds" },
        ],
        headers: [{ key: "Cache-Control", value: CDN_CACHE }],
      },
    ];
  },
};

export default nextConfig;

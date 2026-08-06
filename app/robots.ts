import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt。
 *
 * 方針は「流入を返すボットは通し、返さないボットは断る」。収録が 4.9 万研究室に
 * なった結果、1 クローラの全巡回だけで 4.9 万ページ（gzip 約 16 KB/枚）を
 * 取りに来る。全面許可のままだと巡回コストがボットの数だけ倍になり、
 * Hobby の Fast Origin Transfer 10 GB/月を使い切る（2026-08-05 に実際に
 * チームが Paused になった）。
 *
 * 通すもの：
 *   - `*`（Googlebot ほか一般の検索クローラ）
 *   - Bingbot（Bing / Copilot の索引）
 *   - OAI-SearchBot、Perplexity-User、ChatGPT-User
 *     いずれも回答内にリンクを出す、または利用者の操作で都度取りに来る種類。
 *
 * 断るもの（学習用の一括収集で、流入を返さない）：
 *   - GPTBot、ClaudeBot、Claude-Web、anthropic-ai、PerplexityBot
 *   - Google-Extended、Applebot-Extended
 *     この 2 つは「AI 学習に使うか」だけを制御する。拒否しても Google 検索・
 *     Apple の検索索引からは外れない。
 *
 * `/labs?` はファセット検索の結果ページ。組み合わせで URL が増える一方、
 * 中身はラボ詳細と重複するので索引価値が薄い。クロール予算をラボ詳細と
 * ハブページに寄せる。`/labs` 本体と `/labs/<id>` は対象外なので通る。
 */
export default function robots(): MetadataRoute.Robots {
  const common = ["/api/", "/favorites", "/labs?"];
  const allowAll = { allow: "/", disallow: common };
  const denyAll = { disallow: "/" };
  return {
    rules: [
      { userAgent: "*", ...allowAll },
      { userAgent: "Bingbot", ...allowAll },
      // 回答にリンクを出す / 利用者操作で都度取得する AI ボットは通す
      { userAgent: "OAI-SearchBot", ...allowAll },
      { userAgent: "ChatGPT-User", ...allowAll },
      { userAgent: "Perplexity-User", ...allowAll },
      // 学習目的の一括収集は断る（流入が返らないのに巡回コストだけ乗る）
      { userAgent: "GPTBot", ...denyAll },
      { userAgent: "ClaudeBot", ...denyAll },
      { userAgent: "Claude-Web", ...denyAll },
      { userAgent: "anthropic-ai", ...denyAll },
      { userAgent: "PerplexityBot", ...denyAll },
      { userAgent: "Google-Extended", ...denyAll },
      { userAgent: "Applebot-Extended", ...denyAll },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

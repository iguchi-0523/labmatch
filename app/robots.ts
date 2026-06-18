import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt。検索・AI クローラに全ページの巡回を許可し、サイトマップを示す。
 *
 * AI 検索エンジン（ChatGPT search / Perplexity / Google AI Overviews 等）の
 * ボットを明示的に許可している。これらを拒否すると AI 経由の流入が断たれる。
 * 一方 /api と /favorites は索引対象にしない（前者は JSON、後者は個人ごとの
 * localStorage 依存で公開価値がない）。
 */
export default function robots(): MetadataRoute.Robots {
  const allowAll = { allow: "/", disallow: ["/api/", "/favorites"] };
  return {
    rules: [
      { userAgent: "*", ...allowAll },
      // 主要 AI クローラを明示許可
      { userAgent: "GPTBot", ...allowAll },
      { userAgent: "OAI-SearchBot", ...allowAll },
      { userAgent: "ChatGPT-User", ...allowAll },
      { userAgent: "ClaudeBot", ...allowAll },
      { userAgent: "Claude-Web", ...allowAll },
      { userAgent: "anthropic-ai", ...allowAll },
      { userAgent: "PerplexityBot", ...allowAll },
      { userAgent: "Perplexity-User", ...allowAll },
      { userAgent: "Google-Extended", ...allowAll },
      { userAgent: "Applebot-Extended", ...allowAll },
      { userAgent: "Bingbot", ...allowAll },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

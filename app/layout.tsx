import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { getInlineScript } from "@/lib/theme-client";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESC =
  "日本の大学・研究機関の研究室を、分野・大学・キーワードから検索できるサイト。約 8,700 研究室・31 万件の論文を収録し、各研究室の研究内容を AI 要約で確認できます。大学院進学や研究室配属を考える学生向け。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ラボマッチ — 大学・研究機関の研究室を分野・キーワードから検索",
    template: "%s | ラボマッチ",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "研究室 検索",
    "大学 研究室",
    "研究室配属",
    "大学院 進学",
    "研究室 探し",
    "ラボ 検索",
    "教授 研究内容",
    "研究分野 検索",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "ラボマッチ — 大学・研究機関の研究室を分野・キーワードから検索",
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: "ラボマッチ — 大学・研究機関の研究室検索",
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* React hydrate 前に html.dark を反映して flash を防ぐ */}
        <script dangerouslySetInnerHTML={{ __html: getInlineScript() }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

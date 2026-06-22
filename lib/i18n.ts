/**
 * 軽量 i18n（UI ラベルのみ）。
 *
 * 研究室データ（氏名・論文タイトル）は元々英語、AI 要約は日本語のまま。
 * このサイトは日本の大学・研究機関の研究室が対象という前提なので、
 * 既定ロケールは ja。en は海外からの利用者向けに UI だけ切り替える。
 *
 * ロケールは cookie（LOCALE_COOKIE）で保持。URL ルーティングは使わない。
 */

export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";
export const LOCALE_COOKIE = "labmatch_locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

const ja = {
  // 共通
  brand: "ラボマッチ",
  toTop: "← トップ",
  home: "トップ",
  searchLabs: "研究室を検索",
  about: "このサイトについて",
  privacy: "プライバシーポリシー",
  terms: "利用規約",
  contact: "お問い合わせ",
  favorites: "お気に入り",
  language: "言語",
  // 対象スコープ（日本の研究室であることの明記）
  scopeNote: "日本の大学・研究機関の研究室が対象です。",
  // トップ
  homeTagline: "大学・研究機関の研究室を、分野・キーワードから検索",
  homeSubtitle: "進学先・研究室配属を考える学生のためのサイト",
  homeCta: "研究室を検索する",
  statLabs: "研究室",
  statWorks: "論文",
  statUnis: "大学・機関",
  featSearchTitle: "分野・大学で絞り込み",
  featSearchBody: "階層キーワード × 国公私 + 研究機関 × 8 地方の都道府県",
  featRecoTitle: "お気に入りから推薦",
  featRecoBody: "気になる研究室を★しておくと、傾向の近いラボを自動で表示",
  featAiTitle: "AI による研究内容の要約",
  featAiBody: "直近 5 年の論文を Claude が平易な日本語に再構成",
  homeMvpNote:
    "MVP 開発中。情報は自動収集と AI 生成に基づくため誤りを含む可能性があります（",
  homeMvpNoteAbout: "このサイトについて",
  homeMvpNoteEnd: "）。",
  // 検索ページ
  labsTitle: "研究室検索",
  labsIntro:
    "キーワード・分野・大学などで絞り込み。複数キーワードは AND / OR で組合せ可。",
  kwSearch: "キーワード検索",
  kwPlaceholder: "例: ゲノム編集",
  kwHelp:
    "研究室名・主宰者・AI 要約・論文タイトル（日本語/英語）を対象。入力して「絞り込む」で追加されます。",
  kwSelected: "キーワード:",
  tagSelected: "分野タグ:",
  sectKeywordTree: "キーワード階層",
  sectUniversity: "大学",
  sectRegion: "地方・都道府県",
  sectOther: "その他の条件",
  minWorks: "論文数（下限）",
  sortBy: "並び替え",
  apply: "絞り込む",
  reset: "リセット",
  hits: "件ヒット",
  ofTotal: "全 {n} 件中",
  noResults: "該当する研究室がありません。条件を変えてみてください。",
  worksCount: "論文 {n} 件",
  lab: "研究室",
  // ラボ詳細
  breadcrumbLabs: "研究室一覧",
  pi: "主宰者",
  joint: "兼任",
  aiSummary: "AI 要約（直近 5 年の研究成果）",
  externalLinks: "外部リンク",
  researchOutput: "研究成果",
  relatedLabs: "関連研究室",
  reportLink: "この研究室の情報の削除・修正を依頼する",
  // フォーム共通
  formEmail: "メールアドレス",
  formSubmit: "送信する",
  formRequired: "必須",
  // contact
  contactTitle: "お問い合わせ",
  contactIntro:
    "サイトへの質問・機能のご要望・その他のご連絡はこちらから。特定の研究室の削除・修正は、各研究室ページのフォームをご利用ください。",
  contactCategory: "種別",
  contactCatQuestion: "質問",
  contactCatFeature: "機能の要望",
  contactCatOther: "その他",
  contactSubject: "件名（任意）",
  contactBody: "内容",
  contactBodyPlaceholder: "ご質問やご要望を具体的にお書きください。",
  contactThanks: "送信しました",
  contactThanksBody:
    "お問い合わせありがとうございます。内容を確認します。返信が必要な場合は、いただいたメールアドレスにご連絡します。",
} as const;

type Dict = { readonly [K in keyof typeof ja]: string };

const en: Dict = {
  brand: "LabMatch",
  toTop: "← Home",
  home: "Home",
  searchLabs: "Search labs",
  about: "About",
  privacy: "Privacy policy",
  terms: "Terms of use",
  contact: "Contact",
  favorites: "Favorites",
  language: "Language",
  scopeNote: "Covers research labs at universities and institutes in Japan.",
  homeTagline:
    "Search labs at Japanese universities and institutes by field and keyword",
  homeSubtitle:
    "For students choosing a graduate program or lab placement in Japan",
  homeCta: "Search labs",
  statLabs: "labs",
  statWorks: "papers",
  statUnis: "institutions",
  featSearchTitle: "Filter by field and institution",
  featSearchBody:
    "Hierarchical keywords, national/public/private + institutes, all prefectures",
  featRecoTitle: "Recommendations from favorites",
  featRecoBody:
    "Star labs you like and we surface ones with similar research",
  featAiTitle: "AI summaries of research",
  featAiBody:
    "Recent papers condensed by Claude (summaries are in Japanese)",
  homeMvpNote:
    "In development (MVP). Data is auto-collected and AI-generated, so it may contain errors (",
  homeMvpNoteAbout: "about this site",
  homeMvpNoteEnd: ").",
  labsTitle: "Lab search",
  labsIntro:
    "Filter by keyword, field and institution. Combine keywords with AND / OR.",
  kwSearch: "Keyword search",
  kwPlaceholder: "e.g. genome editing",
  kwHelp:
    "Matches lab name, PI, AI summary and paper titles (JA/EN). Type and press Apply to add.",
  kwSelected: "Keywords:",
  tagSelected: "Field tags:",
  sectKeywordTree: "Field keywords",
  sectUniversity: "Institution",
  sectRegion: "Region / prefecture",
  sectOther: "Other filters",
  minWorks: "Min. papers",
  sortBy: "Sort by",
  apply: "Apply",
  reset: "Reset",
  hits: " results",
  ofTotal: "of {n}",
  noResults: "No labs match. Try changing the filters.",
  worksCount: "{n} papers",
  lab: "Lab",
  breadcrumbLabs: "All labs",
  pi: "Principal investigator",
  joint: "Also at",
  aiSummary: "AI summary (research from the last 5 years)",
  externalLinks: "External links",
  researchOutput: "Publications",
  relatedLabs: "Related labs",
  reportLink: "Request removal or correction of this lab's information",
  formEmail: "Email",
  formSubmit: "Send",
  formRequired: "required",
  contactTitle: "Contact",
  contactIntro:
    "Questions, feature requests, or anything else about the site. To remove or correct a specific lab, use the form on that lab's page.",
  contactCategory: "Type",
  contactCatQuestion: "Question",
  contactCatFeature: "Feature request",
  contactCatOther: "Other",
  contactSubject: "Subject (optional)",
  contactBody: "Message",
  contactBodyPlaceholder: "Please describe your question or request.",
  contactThanks: "Sent",
  contactThanksBody:
    "Thanks for reaching out. We'll review it and reply to your email if a response is needed.",
};

export const dictionaries: Record<Locale, Dict> = { ja, en };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/** "全 {n} 件中" のような {n} 置換 */
export function interpolate(template: string, n: number | string): string {
  return template.replace("{n}", String(n));
}

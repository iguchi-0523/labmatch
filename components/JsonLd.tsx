/**
 * JSON-LD 構造化データを <script type="application/ld+json"> として埋め込む。
 *
 * 検索エンジンと AI が、サイト・研究者・大学をエンティティとして解釈できるように
 * する。Server Component で描画されるため、初回 HTML に含まれてクローラが確実に読む。
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // 構造化データは固定の自前データのみ。ユーザー入力は流し込まない
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

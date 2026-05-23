import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateLabSummary } from "@/lib/summary";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const labId = Number(id);
  if (Number.isNaN(labId)) return { title: "見つかりません" };
  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: {
      name: true,
      professorName: true,
      professorNameJa: true,
      university: { select: { name: true } },
    },
  });
  if (!lab) return { title: "見つかりません" };
  const displayName = lab.professorNameJa ?? lab.professorName;
  return {
    title: `${displayName} 研究室`,
    description: `${displayName}（${lab.university.name}）の研究室紹介ページ。直近 5 年の研究成果と AI 要約。`,
  };
}

export default async function LabDetailPage({ params }: PageProps) {
  const { id } = await params;
  const labId = Number(id);
  if (Number.isNaN(labId)) notFound();

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    include: {
      university: true,
      works: { orderBy: { year: "desc" } },
      grants: { orderBy: { periodStart: "desc" } },
      labSocieties: { include: { society: true } },
    },
  });

  if (!lab) notFound();

  // AI 要約：未生成かつ論文があれば、初回閲覧時にオンデマンド生成 → DB にキャッシュ
  if (!lab.aiSummary && lab.works.length > 0) {
    try {
      const summary = await generateLabSummary(
        lab.name,
        lab.works.slice(0, 25).map((w) => ({
          title: w.title,
          abstract: w.abstract,
          year: w.year,
        })),
      );
      await prisma.lab.update({
        where: { id: lab.id },
        data: { aiSummary: summary, aiSummaryGeneratedAt: new Date() },
      });
      lab.aiSummary = summary;
    } catch (e) {
      console.error("AI summary generation failed:", e);
    }
  }

  // 外部リンク用の URL を組み立て（ID が無ければ検索リンクにフォールバック）
  const nameForSearch = lab.professorNameJa ?? lab.professorName;
  const displayName = lab.professorNameJa ?? lab.professorName;

  const researchmapHref = lab.researchmapId
    ? `https://researchmap.jp/${lab.researchmapId}`
    : `https://researchmap.jp/researchers?name=${encodeURIComponent(nameForSearch)}`;
  const researchmapDirect = !!lab.researchmapId;

  const kakenHref = lab.researcherNumber
    ? `https://kaken.nii.ac.jp/ja/search/?kw=${encodeURIComponent(lab.researcherNumber)}`
    : `https://kaken.nii.ac.jp/ja/search/?kw=${encodeURIComponent(nameForSearch)}`;
  const kakenDirect = !!lab.researcherNumber;

  const officialSearchHref = `https://www.google.com/search?q=${encodeURIComponent(
    [nameForSearch, lab.university.name, "研究室"].join(" "),
  )}`;
  const officialDirect = !!lab.officialUrl;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <nav className="mb-4 text-sm space-x-2">
        <Link href="/" className="text-blue-600 hover:underline">
          トップ
        </Link>
        <span className="text-gray-400">/</span>
        <Link href="/labs" className="text-blue-600 hover:underline">
          研究室一覧
        </Link>
      </nav>

      <header className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold mb-2">{displayName} 研究室</h1>
        <div className="text-gray-700">
          主宰者：{displayName}
          {lab.professorNameJa && (
            <span className="text-gray-500 ml-2 text-sm">
              ({lab.professorName})
            </span>
          )}
        </div>
        <div className="text-gray-600 text-sm mt-1">
          {lab.university.name}
          {lab.department ? `・${lab.department}` : ""}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          AI 要約（直近 5 年の研究成果）
        </h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700 whitespace-pre-wrap">
          {lab.aiSummary ?? (
            <span className="italic text-gray-500">
              要約はまだ生成されていません。
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ※ AI（Claude）が論文情報をもとに自動生成。誤りを含む可能性があるため、正確性は研究室公式情報でご確認ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          研究成果（{lab.works.length} 件）
        </h2>
        {lab.works.length === 0 ? (
          <p className="text-gray-500 text-sm">まだデータがありません。</p>
        ) : (
          <ul className="space-y-2">
            {lab.works.map((w) => (
              <li key={w.id} className="p-3 border rounded">
                <div className="text-sm">
                  {w.year ? `[${w.year}] ` : ""}
                  {w.sourceUrl ? (
                    <a
                      href={w.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {w.titleJa ?? w.title}
                    </a>
                  ) : (
                    (w.titleJa ?? w.title)
                  )}
                </div>
                {w.titleJa && (
                  <div className="text-xs text-gray-500 mt-1 italic">
                    {w.title}
                  </div>
                )}
                {w.doi && (
                  <div className="text-xs text-gray-500 mt-1">DOI: {w.doi}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          科研費（{lab.grants.length} 件）
        </h2>
        {lab.grants.length === 0 ? (
          <p className="text-gray-500 text-sm">
            まだデータがありません（KAKEN 取り込み後に表示）。
          </p>
        ) : (
          <ul className="space-y-2">
            {lab.grants.map((g) => (
              <li key={g.id} className="p-3 border rounded text-sm">
                <div className="font-medium">{g.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {g.category}
                  {g.amount ? `・${g.amount.toLocaleString()} 円` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          所属学会・役職（{lab.labSocieties.length} 件）
        </h2>
        {lab.labSocieties.length === 0 ? (
          <p className="text-gray-500 text-sm">
            まだデータがありません（学会データ連携後に表示）。
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {lab.labSocieties.map((ls) => (
              <li key={`${ls.labId}-${ls.societyId}`}>
                {ls.society.name}
                {ls.role ? `（${ls.role}）` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">外部リンク</h2>
        <ul className="space-y-1.5 text-sm">
          {/* 公式サイト */}
          <li className="flex items-baseline gap-2">
            {officialDirect ? (
              <a
                href={lab.officialUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                公式サイト
              </a>
            ) : (
              <>
                <a
                  href={officialSearchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  公式サイトを検索
                </a>
                <span className="text-xs text-gray-500">
                  （Google で「氏名 + 大学 + 研究室」を検索）
                </span>
              </>
            )}
          </li>

          {/* researchmap */}
          <li className="flex items-baseline gap-2">
            <a
              href={researchmapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              researchmap
              {!researchmapDirect && "（検索）"}
            </a>
            {!researchmapDirect && (
              <span className="text-xs text-gray-500">
                ※プロフィール ID 未取得。氏名で検索結果を開きます
              </span>
            )}
          </li>

          {/* KAKEN */}
          <li className="flex items-baseline gap-2">
            <a
              href={kakenHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              KAKEN（科研費）
              {!kakenDirect && "（検索）"}
            </a>
            {!kakenDirect && (
              <span className="text-xs text-gray-500">
                ※研究者番号未取得。氏名で検索します
              </span>
            )}
          </li>

          {/* OpenAlex */}
          {lab.openalexAuthorId && (
            <li>
              <a
                href={lab.openalexAuthorId}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAlex（著者ページ）
              </a>
            </li>
          )}

          {/* ORCID */}
          {lab.orcid && (
            <li>
              <a
                href={`https://orcid.org/${lab.orcid.replace(/.*\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                ORCID
              </a>
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}

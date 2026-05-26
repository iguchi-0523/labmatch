import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReportForm } from "./ReportForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "掲載に関するご依頼",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const labId = Number(id);
  if (Number.isNaN(labId)) notFound();

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: {
      id: true,
      name: true,
      professorName: true,
      deletedAt: true,
      university: { select: { name: true } },
    },
  });
  if (!lab || lab.deletedAt) notFound();

  const displayName = lab.professorName;

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <nav className="mb-4 text-sm space-x-2">
        <Link href="/" className="text-blue-600 hover:underline">
          トップ
        </Link>
        <span className="text-gray-400">/</span>
        <Link href="/labs" className="text-blue-600 hover:underline">
          研究室一覧
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          href={`/labs/${lab.id}`}
          className="text-blue-600 hover:underline"
        >
          {displayName} 研究室
        </Link>
      </nav>

      <header className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold mb-2">掲載に関するご依頼</h1>
        <div className="text-sm text-gray-700">
          対象：{displayName} 研究室（{lab.university.name}）
        </div>
      </header>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-gray-800 space-y-2">
        <p>
          本サイトは OpenAlex・KAKEN 等の公開情報をもとに、研究室情報を自動収集・整形して掲載しています。
        </p>
        <p>
          記載に誤りがある、または研究室として掲載を希望されない場合は、下記フォームよりご連絡ください。
          <span className="font-medium">原則 72 時間以内に一次返信</span>します。
          大学公式ドメイン（<code>*.ac.jp</code>）からのご依頼は優先的に処理いたします。
        </p>
      </div>

      <ReportForm labId={lab.id} />
    </main>
  );
}

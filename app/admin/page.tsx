import Link from "next/link";
import { prisma } from "@/lib/db";
import { setContactStatus, setReportStatus } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "管理",
  robots: { index: false, follow: false },
};

const jstDate = (d: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(d);

const CONTACT_BADGE: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  read: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};
const REPORT_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  removed: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  kept: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  corrected:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};
const REPORT_STATUS_OPTIONS = [
  "pending",
  "reviewing",
  "removed",
  "kept",
  "corrected",
];

export default async function AdminPage() {
  const [contacts, reports, newContacts, pendingReports] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { id: "desc" }, take: 200 }),
    prisma.labReport.findMany({
      orderBy: { id: "desc" },
      take: 200,
      include: {
        lab: {
          select: {
            professorName: true,
            university: { select: { name: true } },
          },
        },
      },
    }),
    prisma.contactMessage.count({ where: { status: "new" } }),
    prisma.labReport.count({ where: { status: "pending" } }),
  ]);

  const btn =
    "text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800";

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 text-gray-800 dark:text-gray-200">
      <div className="mb-8 flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          管理
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          未対応: お問い合わせ {newContacts} 件 / 掲載依頼 {pendingReports} 件
        </p>
      </div>

      {/* お問い合わせ */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          お問い合わせ（{contacts.length}）
        </h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            まだありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${CONTACT_BADGE[c.status] ?? ""}`}
                  >
                    {c.status}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {c.category}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {c.locale}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 ml-auto">
                    {jstDate(c.createdAt)} · #{c.id}
                  </span>
                </div>
                <div className="text-sm mb-1">
                  <a
                    href={`mailto:${c.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {c.email}
                  </a>
                  {c.subject && (
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {c.subject}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {c.body}
                </p>
                <div className="mt-3 flex gap-2">
                  {(["new", "read", "done"] as const)
                    .filter((s) => s !== c.status)
                    .map((s) => (
                      <form key={s} action={setContactStatus}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value={s} />
                        <button type="submit" className={btn}>
                          → {s}
                        </button>
                      </form>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 掲載依頼（削除・修正） */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          掲載依頼・削除/修正（{reports.length}）
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            まだありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${REPORT_BADGE[r.status] ?? ""}`}
                  >
                    {r.status}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {r.reportType}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 ml-auto">
                    {jstDate(r.createdAt)} · #{r.id}
                  </span>
                </div>
                <div className="text-sm mb-1">
                  <Link
                    href={`/labs/${r.labId}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {r.lab.professorName} 研究室
                  </Link>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {r.lab.university.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <a
                    href={`mailto:${r.reporterEmail}`}
                    className="hover:underline"
                  >
                    {r.reporterEmail}
                  </a>{" "}
                  ({r.reporterEmailDomain})
                  {r.reporterAffiliation && ` · ${r.reporterAffiliation}`}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {r.reason}
                </p>
                {r.resolutionNote && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    メモ: {r.resolutionNote}
                  </p>
                )}
                <form
                  action={setReportStatus}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    {REPORT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="note"
                    defaultValue={r.resolutionNote ?? ""}
                    placeholder="対応メモ（任意）"
                    className="flex-1 min-w-[12rem] text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <button type="submit" className={btn}>
                    更新
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

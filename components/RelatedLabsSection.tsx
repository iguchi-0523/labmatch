import Link from "next/link";
import type { RelatedLab } from "@/lib/recommendations";
import type { Locale } from "@/lib/i18n";
import { localizeFieldLabel } from "@/lib/labels-en";
import { FavoriteButton } from "./FavoriteButton";

interface Props {
  labs: RelatedLab[];
  title?: string;
  emptyMessage?: string;
  locale?: Locale;
}

export function RelatedLabsSection({
  labs,
  title = "関連研究室",
  emptyMessage = "関連する研究室が見つかりませんでした。",
  locale = "ja",
}: Props) {
  const labSuffix = locale === "ja" ? "研究室" : "Lab";
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
        {title}
        {labs.length > 0 && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
            {locale === "ja" ? `(${labs.length} 件)` : `(${labs.length})`}
          </span>
        )}
      </h2>
      {labs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {labs.map((lab) => {
            const fieldJp = localizeFieldLabel(
              lab.primaryFieldCode,
              locale,
              lab.primaryFieldName,
            );
            return (
              <li
                key={lab.id}
                className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded hover:border-blue-400 dark:hover:border-blue-500 transition-all"
              >
                <Link href={`/labs/${lab.id}`} className="block p-3">
                  <div className="flex items-start justify-between gap-3 pr-10">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">
                        {lab.professorName} {labSuffix}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                        {lab.university.name}
                        {lab.department && (
                          <span className="text-gray-500 dark:text-gray-400">
                            ・{lab.department}
                          </span>
                        )}
                      </div>
                    </div>
                    {fieldJp && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap border border-blue-200 dark:border-blue-900 self-center">
                        {fieldJp}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span>
                      {locale === "ja"
                        ? `論文 ${lab._count.works} 件`
                        : `${lab._count.works} papers`}
                    </span>
                    {lab.sharedTags.length > 0 && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-blue-700 dark:text-blue-300">
                          {locale === "ja" ? "共通: " : "Shared: "}
                          {lab.sharedTags.slice(0, 4).join(", ")}
                          {lab.sharedTags.length > 4 &&
                            ` +${lab.sharedTags.length - 4}`}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
                <div className="absolute top-2 right-2">
                  <FavoriteButton
                    labId={lab.id}
                    size="sm"
                    stopParentLink
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

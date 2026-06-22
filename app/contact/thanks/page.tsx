import Link from "next/link";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.contactThanks, robots: { index: false } };
}

export default async function ContactThanksPage() {
  const { t } = await getI18n();
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center text-gray-800 dark:text-gray-200">
      <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
        {t.contactThanks}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
        {t.contactThanksBody}
      </p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
      >
        {t.home}
      </Link>
    </main>
  );
}

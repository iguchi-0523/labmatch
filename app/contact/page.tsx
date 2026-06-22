import Link from "next/link";
import { ContactForm } from "./ContactForm";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t.contactTitle,
    description: t.contactIntro,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const { t } = await getI18n();
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <nav className="mb-6 text-sm">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t.toTop}
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
        {t.contactTitle}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
        {t.contactIntro}
      </p>
      <ContactForm />
    </main>
  );
}

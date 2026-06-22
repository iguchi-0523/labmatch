"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useT } from "@/components/LocaleProvider";
import { submitContact, type ContactFormState } from "./actions";

const INITIAL: ContactFormState = {};

function SubmitButton({ label, sending }: { label: string; sending: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2.5 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? sending : label}
    </button>
  );
}

export function ContactForm() {
  const { locale, t } = useT();
  const [state, formAction] = useActionState(submitContact, INITIAL);
  const errors = state.errors ?? {};

  const errMsg: Record<string, string> = {
    invalid_email:
      locale === "ja"
        ? "メールアドレスの形式が正しくありません。"
        : "Please enter a valid email address.",
    invalid_category:
      locale === "ja" ? "種別を選択してください。" : "Please choose a type.",
    too_short:
      locale === "ja"
        ? "内容は 10 文字以上で記入してください。"
        : "Please write at least 10 characters.",
    too_long:
      locale === "ja"
        ? "内容は 4000 文字以内で記入してください。"
        : "Please keep it under 4000 characters.",
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <fieldset>
        <legend className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t.contactCategory} <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { v: "question", label: t.contactCatQuestion },
            { v: "feature", label: t.contactCatFeature },
            { v: "other", label: t.contactCatOther },
          ].map((o, i) => (
            <label key={o.v} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={o.v}
                defaultChecked={i === 0}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {errors.category && (
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            {errMsg[errors.category] ?? errors.category}
          </p>
        )}
      </fieldset>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1"
        >
          {t.formEmail} <span className="text-red-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputCls}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            {errMsg[errors.email] ?? errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1"
        >
          {t.contactSubject}
        </label>
        <input id="subject" name="subject" type="text" className={inputCls} />
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1"
        >
          {t.contactBody} <span className="text-red-600">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          minLength={10}
          maxLength={4000}
          className={inputCls}
          placeholder={t.contactBodyPlaceholder}
          aria-invalid={!!errors.body}
        />
        {errors.body && (
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            {errMsg[errors.body] ?? errors.body}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <SubmitButton
          label={t.formSubmit}
          sending={locale === "ja" ? "送信中…" : "Sending…"}
        />
      </div>
    </form>
  );
}

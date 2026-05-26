"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitReport, type ReportFormState } from "./actions";

const INITIAL_STATE: ReportFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2.5 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "送信中…" : "依頼を送信"}
    </button>
  );
}

export function ReportForm({ labId }: { labId: number }) {
  const action = submitReport.bind(null, labId);
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div className="p-3 border border-red-300 bg-red-50 text-red-800 text-sm rounded">
          {state.message}
        </div>
      )}

      <div>
        <label
          htmlFor="reporterEmail"
          className="block text-sm font-semibold text-gray-900 mb-1"
        >
          メールアドレス <span className="text-red-600">*</span>
        </label>
        <input
          id="reporterEmail"
          name="reporterEmail"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.reporterEmail}
          aria-describedby={errors.reporterEmail ? "err-email" : undefined}
        />
        <p className="text-xs text-gray-500 mt-1">
          大学公式ドメイン（<code>*.ac.jp</code>）からの依頼は優先処理いたします。
          ご返信のみに使用し、第三者に開示しません。
        </p>
        {errors.reporterEmail && (
          <p id="err-email" className="text-xs text-red-700 mt-1">
            {errors.reporterEmail}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reporterAffiliation"
          className="block text-sm font-semibold text-gray-900 mb-1"
        >
          ご所属（任意）
        </label>
        <input
          id="reporterAffiliation"
          name="reporterAffiliation"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例：◯◯大学 △△研究室 助教"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-semibold text-gray-900 mb-2">
          依頼の種類 <span className="text-red-600">*</span>
        </legend>
        <div className="space-y-1.5 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="reportType"
              value="removal"
              defaultChecked
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">掲載の削除</span>
              <span className="block text-xs text-gray-500">
                掲載自体を取り下げてほしい場合
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="reportType"
              value="correction"
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">記載内容の訂正</span>
              <span className="block text-xs text-gray-500">
                AI 要約・所属・氏名・論文情報などの誤りを訂正してほしい場合
              </span>
            </span>
          </label>
        </div>
        {errors.reportType && (
          <p className="text-xs text-red-700 mt-1">{errors.reportType}</p>
        )}
      </fieldset>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-semibold text-gray-900 mb-1"
        >
          依頼内容 <span className="text-red-600">*</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={6}
          minLength={10}
          maxLength={4000}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="削除をご希望の理由、または訂正したい箇所と正しい内容をご記入ください。"
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? "err-reason" : undefined}
        />
        <p className="text-xs text-gray-500 mt-1">10〜4000 文字。</p>
        {errors.reason && (
          <p id="err-reason" className="text-xs text-red-700 mt-1">
            {errors.reason}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200">
        <SubmitButton />
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          ご依頼から 72 時間以内に一次返信いたします。
          内容を確認のうえ、削除・訂正・掲載継続のいずれかの対応をご連絡します。
          公開情報のみを掲載しているため、掲載継続となる場合があります。
        </p>
      </div>
    </form>
  );
}

-- サイト全体への問い合わせ（質問・要望）。ラボに紐づかない
CREATE TABLE "contact_messages" (
  "id"         SERIAL NOT NULL,
  "email"      TEXT NOT NULL,
  "category"   TEXT NOT NULL DEFAULT 'question',
  "subject"    TEXT,
  "body"       TEXT NOT NULL,
  "locale"     TEXT NOT NULL DEFAULT 'ja',
  "status"     TEXT NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");
CREATE INDEX "contact_messages_category_idx" ON "contact_messages"("category");

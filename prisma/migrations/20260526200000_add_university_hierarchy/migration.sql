-- 大学階層対応：parent_id（自己参照）と category（national/public/private/research-institute）を追加
ALTER TABLE "universities" ADD COLUMN "parent_id" INTEGER;
ALTER TABLE "universities" ADD COLUMN "category" TEXT;

ALTER TABLE "universities" ADD CONSTRAINT "universities_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "universities"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "universities_parent_id_idx" ON "universities"("parent_id");

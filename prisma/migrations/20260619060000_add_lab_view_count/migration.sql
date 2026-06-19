-- 人気順ソート用：ラボ詳細ページの閲覧数
ALTER TABLE "labs" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "labs_view_count_idx" ON "labs"("view_count");

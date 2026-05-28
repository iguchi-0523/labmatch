-- Grant に課題番号（KAKEN 由来）と細目を追加
ALTER TABLE "grants" ADD COLUMN "award_number" TEXT;
ALTER TABLE "grants" ADD COLUMN "subject" TEXT;
CREATE INDEX "grants_award_number_idx" ON "grants"("award_number");

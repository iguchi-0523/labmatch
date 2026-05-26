-- AlterTable
ALTER TABLE "labs" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "works" ADD COLUMN     "has_abstract" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "reporter_email" TEXT NOT NULL,
    "reporter_email_domain" TEXT NOT NULL,
    "reporter_affiliation" TEXT,
    "reason" TEXT NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'removal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_reports_lab_id_idx" ON "lab_reports"("lab_id");

-- CreateIndex
CREATE INDEX "lab_reports_status_idx" ON "lab_reports"("status");

-- CreateIndex
CREATE INDEX "lab_reports_reporter_email_domain_idx" ON "lab_reports"("reporter_email_domain");

-- CreateIndex
CREATE INDEX "labs_deleted_at_idx" ON "labs"("deleted_at");

-- CreateIndex
CREATE INDEX "works_has_abstract_idx" ON "works"("has_abstract");

-- Backfill: existing works with non-null abstract should be flagged true
UPDATE "works" SET "has_abstract" = TRUE WHERE "abstract" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

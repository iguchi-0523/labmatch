-- 複数所属対応：Lab と University の多対多関係テーブル
CREATE TABLE "lab_affiliations" (
  "lab_id"        INTEGER NOT NULL,
  "university_id" INTEGER NOT NULL,
  "is_primary"    BOOLEAN NOT NULL DEFAULT false,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_affiliations_pkey" PRIMARY KEY ("lab_id", "university_id")
);

ALTER TABLE "lab_affiliations" ADD CONSTRAINT "lab_affiliations_lab_id_fkey"
  FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_affiliations" ADD CONSTRAINT "lab_affiliations_university_id_fkey"
  FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "lab_affiliations_university_id_idx" ON "lab_affiliations"("university_id");

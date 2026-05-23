-- CreateTable
CREATE TABLE "universities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "prefecture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "professor_name" TEXT NOT NULL,
    "department" TEXT,
    "official_url" TEXT,
    "researcher_number" TEXT,
    "researchmap_id" TEXT,
    "openalex_author_id" TEXT,
    "orcid" TEXT,
    "ai_summary" TEXT,
    "ai_summary_generated_at" TIMESTAMP(3),
    "ai_summary_source_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "year" INTEGER,
    "doi" TEXT,
    "source_url" TEXT,
    "type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grants" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "amount" INTEGER,
    "category" TEXT,
    "kaken_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_fields" (
    "lab_id" INTEGER NOT NULL,
    "field_id" INTEGER NOT NULL,

    CONSTRAINT "lab_fields_pkey" PRIMARY KEY ("lab_id","field_id")
);

-- CreateTable
CREATE TABLE "societies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_societies" (
    "lab_id" INTEGER NOT NULL,
    "society_id" INTEGER NOT NULL,
    "role" TEXT,

    CONSTRAINT "lab_societies_pkey" PRIMARY KEY ("lab_id","society_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "labs_researcher_number_key" ON "labs"("researcher_number");

-- CreateIndex
CREATE UNIQUE INDEX "labs_researchmap_id_key" ON "labs"("researchmap_id");

-- CreateIndex
CREATE UNIQUE INDEX "labs_openalex_author_id_key" ON "labs"("openalex_author_id");

-- CreateIndex
CREATE UNIQUE INDEX "labs_orcid_key" ON "labs"("orcid");

-- CreateIndex
CREATE INDEX "labs_university_id_idx" ON "labs"("university_id");

-- CreateIndex
CREATE INDEX "works_lab_id_idx" ON "works"("lab_id");

-- CreateIndex
CREATE INDEX "works_year_idx" ON "works"("year");

-- CreateIndex
CREATE INDEX "grants_lab_id_idx" ON "grants"("lab_id");

-- CreateIndex
CREATE UNIQUE INDEX "fields_code_key" ON "fields"("code");

-- CreateIndex
CREATE UNIQUE INDEX "societies_name_key" ON "societies"("name");

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grants" ADD CONSTRAINT "grants_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_fields" ADD CONSTRAINT "lab_fields_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_fields" ADD CONSTRAINT "lab_fields_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_societies" ADD CONSTRAINT "lab_societies_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_societies" ADD CONSTRAINT "lab_societies_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

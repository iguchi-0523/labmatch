-- AlterTable
ALTER TABLE "labs" ADD COLUMN     "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "labs" ADD COLUMN     "tags_generated_at" TIMESTAMP(3);

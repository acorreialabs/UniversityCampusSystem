-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "recurrenceMinAdmission" DOUBLE PRECISION,
ADD COLUMN     "resultsPublishedAt" TIMESTAMP(3),
ADD COLUMN     "resultsPublishedById" TEXT;

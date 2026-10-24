-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('SEMESTER', 'TRIMESTER', 'QUARTER', 'ANNUAL');

-- CreateEnum
CREATE TYPE "GradingScope" AS ENUM ('GLOBAL', 'COURSE', 'SUBJECT', 'PERIOD');

-- DropIndex
DROP INDEX "FinancialStatus_hasDebt_idx";

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "requiredTestCount" INTEGER;

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PeriodType" NOT NULL DEFAULT 'SEMESTER',
    "academicYearId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingConfig" (
    "id" TEXT NOT NULL,
    "scope" "GradingScope" NOT NULL DEFAULT 'COURSE',
    "scopeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "appliesFrom" TIMESTAMP(3),
    "appliesTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodResult" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "averagePercent" DOUBLE PRECISION,
    "averageGrade" INTEGER,
    "creditsAttempted" INTEGER NOT NULL DEFAULT 0,
    "creditsObtained" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_code_key" ON "AcademicYear"("code");

-- CreateIndex
CREATE INDEX "Period_academicYearId_idx" ON "Period"("academicYearId");

-- CreateIndex
CREATE INDEX "Period_closed_idx" ON "Period"("closed");

-- CreateIndex
CREATE UNIQUE INDEX "Period_academicYearId_code_key" ON "Period"("academicYearId", "code");

-- CreateIndex
CREATE INDEX "GradingConfig_scope_scopeId_idx" ON "GradingConfig"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "GradingConfig_active_idx" ON "GradingConfig"("active");

-- CreateIndex
CREATE INDEX "PeriodResult_studentId_idx" ON "PeriodResult"("studentId");

-- CreateIndex
CREATE INDEX "PeriodResult_periodId_idx" ON "PeriodResult"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodResult_periodId_studentId_key" ON "PeriodResult"("periodId", "studentId");

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodResult" ADD CONSTRAINT "PeriodResult_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodResult" ADD CONSTRAINT "PeriodResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('TEST', 'EXAM', 'ASSIGNMENT', 'PRACTICAL', 'ORAL', 'OTHER');

-- CreateEnum
CREATE TYPE "GradingMode" AS ENUM ('PERCENTAGE', 'POINTS', 'SCALE');

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL DEFAULT 'TEST',
    "gradingMode" "GradingMode" NOT NULL DEFAULT 'PERCENTAGE',
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3),
    "subjectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "valuePercent" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "gradedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_subjectId_idx" ON "Assessment"("subjectId");

-- CreateIndex
CREATE INDEX "Assessment_createdById_idx" ON "Assessment"("createdById");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_assessmentId_idx" ON "Grade"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_assessmentId_studentId_key" ON "Grade"("assessmentId", "studentId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

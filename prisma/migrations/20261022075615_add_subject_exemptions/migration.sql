-- CreateTable
CREATE TABLE "SubjectExemption" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "exemptedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectExemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubjectExemption_subjectId_idx" ON "SubjectExemption"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectExemption_studentId_idx" ON "SubjectExemption"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectExemption_subjectId_studentId_key" ON "SubjectExemption"("subjectId", "studentId");

-- AddForeignKey
ALTER TABLE "SubjectExemption" ADD CONSTRAINT "SubjectExemption_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectExemption" ADD CONSTRAINT "SubjectExemption_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectExemption" ADD CONSTRAINT "SubjectExemption_exemptedById_fkey" FOREIGN KEY ("exemptedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

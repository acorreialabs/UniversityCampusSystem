-- CreateTable
CREATE TABLE "FinancialStatus" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hasDebt" BOOLEAN NOT NULL DEFAULT false,
    "outstandingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REGULAR',
    "note" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatus_studentId_key" ON "FinancialStatus"("studentId");

-- CreateIndex
CREATE INDEX "FinancialStatus_hasDebt_idx" ON "FinancialStatus"("hasDebt");

-- AddForeignKey
ALTER TABLE "FinancialStatus" ADD CONSTRAINT "FinancialStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

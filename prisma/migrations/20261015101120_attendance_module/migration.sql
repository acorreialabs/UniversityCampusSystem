-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED');

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "classScheduleId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_studentProfileId_idx" ON "Attendance"("studentProfileId");

-- CreateIndex
CREATE INDEX "Attendance_classScheduleId_idx" ON "Attendance"("classScheduleId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_classScheduleId_studentProfileId_key" ON "Attendance"("classScheduleId", "studentProfileId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classScheduleId_fkey" FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

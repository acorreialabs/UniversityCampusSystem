-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "battery" INTEGER,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "signal" INTEGER;

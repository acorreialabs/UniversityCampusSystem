-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "deviceId" TEXT;

-- CreateIndex
CREATE INDEX "Alert_deviceId_idx" ON "Alert"("deviceId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "Alert" a
SET "deviceId" = d."id"
FROM "Device" d
WHERE a."deviceId" IS NULL
  AND a."title" LIKE 'Dispositivo ' || d."code" || ' %';
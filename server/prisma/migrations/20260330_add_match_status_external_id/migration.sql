-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "Match" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");

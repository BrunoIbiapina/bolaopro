-- AlterTable Pool: add cotasPerParticipant
ALTER TABLE "Pool" ADD COLUMN "cotasPerParticipant" INTEGER NOT NULL DEFAULT 1;

-- AlterTable PoolMember: add numCotas
ALTER TABLE "PoolMember" ADD COLUMN "numCotas" INTEGER NOT NULL DEFAULT 1;

-- AlterTable Prediction: add cotaIndex, drop old unique, add new unique
ALTER TABLE "Prediction" ADD COLUMN "cotaIndex" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "Prediction_userId_matchId_poolId_key";
CREATE UNIQUE INDEX "Prediction_userId_matchId_poolId_cotaIndex_key" ON "Prediction"("userId", "matchId", "poolId", "cotaIndex");

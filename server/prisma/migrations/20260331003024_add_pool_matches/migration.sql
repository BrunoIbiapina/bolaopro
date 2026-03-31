-- CreateTable
CREATE TABLE "PoolMatch" (
    "poolId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolMatch_pkey" PRIMARY KEY ("poolId","matchId")
);

-- CreateIndex
CREATE INDEX "PoolMatch_poolId_idx" ON "PoolMatch"("poolId");

-- CreateIndex
CREATE INDEX "PoolMatch_matchId_idx" ON "PoolMatch"("matchId");

-- AddForeignKey
ALTER TABLE "PoolMatch" ADD CONSTRAINT "PoolMatch_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolMatch" ADD CONSTRAINT "PoolMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

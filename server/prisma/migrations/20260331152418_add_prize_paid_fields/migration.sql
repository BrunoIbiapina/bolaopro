/*
  Warnings:

  - You are about to drop the `PoolMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PoolMember" DROP CONSTRAINT "PoolMember_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PoolMember" DROP CONSTRAINT "PoolMember_userId_fkey";

-- DropTable
DROP TABLE "PoolMember";

-- CreateTable
CREATE TABLE "pool_members" (
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PoolMemberStatus" NOT NULL DEFAULT 'PENDING',
    "numCotas" INTEGER NOT NULL DEFAULT 1,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prize_paid_at" TIMESTAMP(3),
    "prize_amount" DOUBLE PRECISION,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("poolId","userId")
);

-- CreateIndex
CREATE INDEX "pool_members_userId_idx" ON "pool_members"("userId");

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

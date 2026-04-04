-- CreateEnum
CREATE TYPE "CausaCategory" AS ENUM ('POLITICA', 'ESPORTE', 'CLIMA', 'ENTRETENIMENTO', 'NEGOCIOS', 'CULTURA', 'OUTROS');

-- CreateEnum
CREATE TYPE "CausaType" AS ENUM ('BINARY', 'CHOICE', 'NUMERIC');

-- CreateEnum
CREATE TYPE "CausaStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CausaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "NumericMatchMode" AS ENUM ('EXACT', 'CLOSEST');

-- CreateTable
CREATE TABLE "Causa" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" "CausaCategory" NOT NULL DEFAULT 'OUTROS',
    "type" "CausaType" NOT NULL,
    "status" "CausaStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "CausaVisibility" NOT NULL DEFAULT 'PUBLIC',
    "inviteCode" TEXT NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "resolvesAt" TIMESTAMP(3),
    "creatorId" TEXT NOT NULL,
    "resolvedOptionId" TEXT,
    "resolvedNumericValue" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cotasPerParticipant" INTEGER NOT NULL DEFAULT 1,
    "prizePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxVoters" INTEGER,
    "hideVoteCount" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "numericUnit" TEXT,
    "numericMatchMode" "NumericMatchMode" NOT NULL DEFAULT 'CLOSEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Causa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CausaOption" (
    "id" TEXT NOT NULL,
    "causaId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CausaOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CausaVote" (
    "id" TEXT NOT NULL,
    "causaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT,
    "numericValue" DOUBLE PRECISION,
    "numCotas" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,
    "prizeAmount" DOUBLE PRECISION,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CausaVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Causa_inviteCode_key" ON "Causa"("inviteCode");
CREATE INDEX "Causa_creatorId_idx" ON "Causa"("creatorId");
CREATE INDEX "Causa_status_idx" ON "Causa"("status");
CREATE INDEX "Causa_category_idx" ON "Causa"("category");
CREATE INDEX "Causa_deadlineAt_idx" ON "Causa"("deadlineAt");
CREATE INDEX "Causa_inviteCode_idx" ON "Causa"("inviteCode");
CREATE INDEX "Causa_visibility_status_idx" ON "Causa"("visibility", "status");

CREATE INDEX "CausaOption_causaId_idx" ON "CausaOption"("causaId");

CREATE UNIQUE INDEX "CausaVote_causaId_userId_key" ON "CausaVote"("causaId", "userId");
CREATE INDEX "CausaVote_causaId_idx" ON "CausaVote"("causaId");
CREATE INDEX "CausaVote_userId_idx" ON "CausaVote"("userId");
CREATE INDEX "CausaVote_isCorrect_idx" ON "CausaVote"("isCorrect");

-- AddForeignKey
ALTER TABLE "Causa" ADD CONSTRAINT "Causa_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Causa" ADD CONSTRAINT "Causa_resolvedOptionId_fkey" FOREIGN KEY ("resolvedOptionId") REFERENCES "CausaOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CausaOption" ADD CONSTRAINT "CausaOption_causaId_fkey" FOREIGN KEY ("causaId") REFERENCES "Causa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CausaVote" ADD CONSTRAINT "CausaVote_causaId_fkey" FOREIGN KEY ("causaId") REFERENCES "Causa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CausaVote" ADD CONSTRAINT "CausaVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CausaVote" ADD CONSTRAINT "CausaVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CausaOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

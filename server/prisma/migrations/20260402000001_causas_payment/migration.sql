-- AlterTable: add payment fields to CausaVote
ALTER TABLE "CausaVote" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "CausaVote" ADD COLUMN "pixPayload" TEXT;
ALTER TABLE "CausaVote" ADD COLUMN "paymentProofUrl" TEXT;
ALTER TABLE "CausaVote" ADD COLUMN "notifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CausaVote_paymentStatus_idx" ON "CausaVote"("paymentStatus");

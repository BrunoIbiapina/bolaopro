-- AddColumn pixKey to Pool
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "pixKey" TEXT;

-- AddColumn pixPayload to Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "pixPayload" TEXT;

-- AddColumn paymentProofUrl to Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "userNotifiedAt" TIMESTAMP(3);

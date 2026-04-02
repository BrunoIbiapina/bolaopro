-- WhatsApp opt-in fields on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappOptIn"        BOOLEAN   NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappVerifiedAt"   TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappOtp"          TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappOtpExpiresAt" TIMESTAMP(3);

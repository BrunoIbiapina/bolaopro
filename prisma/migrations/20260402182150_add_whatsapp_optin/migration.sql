-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappVerifiedAt" TIMESTAMP(3);

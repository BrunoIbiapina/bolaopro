-- Adicionar valor SCHEDULED ao enum CausaStatus
ALTER TYPE "CausaStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';

-- Adicionar campos isFeatured e scheduledOpenAt à tabela Causa
ALTER TABLE "Causa" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Causa" ADD COLUMN IF NOT EXISTS "scheduledOpenAt" TIMESTAMP(3);

-- Índice para causas em destaque
CREATE INDEX IF NOT EXISTS "Causa_isFeatured_idx" ON "Causa"("isFeatured");
CREATE INDEX IF NOT EXISTS "Causa_status_isFeatured_idx" ON "Causa"("status", "isFeatured");

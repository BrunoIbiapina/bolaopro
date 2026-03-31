-- Migration: add_prize_paid_fields
-- Adiciona campos de controle de pagamento de prêmio ao PoolMember

ALTER TABLE "PoolMember" ADD COLUMN IF NOT EXISTS "prize_paid_at" TIMESTAMP(3);
ALTER TABLE "PoolMember" ADD COLUMN IF NOT EXISTS "prize_amount" DOUBLE PRECISION;

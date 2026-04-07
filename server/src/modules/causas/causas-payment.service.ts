import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generatePixPayload } from '@/common/utils/pix.util';
import { ConfigService } from '@nestjs/config';

const SYSTEM_PIX_KEY   = '86999224515';
const MERCHANT_NAME_DEFAULT = 'Bolao Pro';
const MERCHANT_CITY_DEFAULT = 'Brasil';

@Injectable()
export class CausasPaymentService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ── Gerar / buscar pagamento do usuário ───────────────────────

  async getOrCreatePayment(causaId: string, userId: string) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: { payments: { where: { userId } } },
    });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.entryFee <= 0) throw new BadRequestException('Esta causa é gratuita');

    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    if (!vote) throw new BadRequestException('Vote primeiro para gerar o pagamento');

    const existing = causa.payments[0];
    if (existing) return this.formatPayment(existing);

    const amount  = causa.entryFee * vote.numCotas;
    const txid    = `CAUSA${causaId.slice(-6).toUpperCase()}${userId.slice(-4).toUpperCase()}`;
    const pixKey  = this.config.get<string>('PIX_KEY') ?? SYSTEM_PIX_KEY;
    const merchantName = this.config.get<string>('PIX_MERCHANT_NAME') ?? MERCHANT_NAME_DEFAULT;
    const merchantCity = this.config.get<string>('PIX_MERCHANT_CITY') ?? MERCHANT_CITY_DEFAULT;
    const payload = generatePixPayload({ pixKey, merchantName, merchantCity, amount, txid, description: `Causa ${causa.title.slice(0, 20)}` });

    const payment = await this.prisma.causaPayment.create({
      data: { causaId, userId, amount, numCotas: vote.numCotas, status: 'PENDING' },
    });

    return { ...this.formatPayment(payment), pixPayload: payload, amount };
  }

  async getPaymentStatus(causaId: string, userId: string) {
    const payment = await this.prisma.causaPayment.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    if (!payment) return { paymentStatus: 'NOT_REQUESTED' as const };

    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) throw new NotFoundException('Causa não encontrada');

    const pixKey  = this.config.get<string>('PIX_KEY') ?? SYSTEM_PIX_KEY;
    const vote    = await this.prisma.causaVote.findUnique({ where: { causaId_userId: { causaId, userId } } });
    const txid    = `CAUSA${causaId.slice(-6).toUpperCase()}${userId.slice(-4).toUpperCase()}`;
    const merchantName = this.config.get<string>('PIX_MERCHANT_NAME') ?? MERCHANT_NAME_DEFAULT;
    const merchantCity = this.config.get<string>('PIX_MERCHANT_CITY') ?? MERCHANT_CITY_DEFAULT;
    const payload = generatePixPayload({ pixKey, merchantName, merchantCity, amount: payment.amount, txid, description: `Causa ${causa.title.slice(0, 20)}` });

    return { ...this.formatPayment(payment), pixPayload: payload };
  }

  // ── Usuário avisa que pagou ───────────────────────────────────

  async notifyPaid(causaId: string, userId: string) {
    const payment = await this.prisma.causaPayment.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status === 'PAID') throw new BadRequestException('Pagamento já confirmado');

    return this.prisma.causaPayment.update({
      where: { causaId_userId: { causaId, userId } },
      data: { notifiedAt: new Date() },
    });
  }

  // ── Admin: confirmar pagamento ────────────────────────────────

  async confirmPayment(causaId: string, targetUserId: string, adminId: string) {
    const payment = await this.prisma.causaPayment.findUnique({
      where: { causaId_userId: { causaId, userId: targetUserId } },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status === 'PAID') throw new BadRequestException('Já confirmado');

    return this.prisma.causaPayment.update({
      where: { causaId_userId: { causaId, userId: targetUserId } },
      data: { status: 'PAID', paidAt: new Date(), confirmedBy: adminId },
    });
  }

  // ── Admin: rejeitar pagamento ─────────────────────────────────

  async rejectPayment(causaId: string, targetUserId: string) {
    const payment = await this.prisma.causaPayment.findUnique({
      where: { causaId_userId: { causaId, userId: targetUserId } },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    return this.prisma.causaPayment.update({
      where: { causaId_userId: { causaId, userId: targetUserId } },
      data: { status: 'FAILED' },
    });
  }

  // ── Admin: listar pagamentos de uma causa ─────────────────────

  async listPaymentsByCausa(causaId: string) {
    return this.prisma.causaPayment.findMany({
      where: { causaId },
      include: {
        user: { select: { id: true, fullName: true, avatar: true, email: true, pixKey: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Admin: listar todos os pagamentos de causas ───────────────

  async listAllPayments(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    return this.prisma.causaPayment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatar: true, email: true, pixKey: true } },
        causa: { select: { id: true, title: true, entryFee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Verificar se voto está bloqueado ─────────────────────────

  async isVoteLocked(causaId: string, userId: string): Promise<boolean> {
    const payment = await this.prisma.causaPayment.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    return payment?.status === 'PAID';
  }

  // ── Helper ────────────────────────────────────────────────────

  private formatPayment(p: any) {
    return {
      id:          p.id,
      causaId:     p.causaId,
      userId:      p.userId,
      amount:      p.amount,
      numCotas:    p.numCotas,
      paymentStatus: p.status as 'PENDING' | 'PAID' | 'FAILED',
      notifiedAt:  p.notifiedAt,
      paidAt:      p.paidAt,
      createdAt:   p.createdAt,
      pixKey:      this.config.get<string>('PIX_KEY') ?? SYSTEM_PIX_KEY,
    };
  }
}

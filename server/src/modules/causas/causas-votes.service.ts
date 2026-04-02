import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { VoteCausaDto } from './dto/vote-causa.dto';
import { generatePixPayload } from '@/common/utils/pix.util';

const PLATFORM_PIX_KEY = process.env.PIX_KEY ?? 'bolao@platform.com';
const PLATFORM_NAME    = process.env.PIX_MERCHANT_NAME ?? 'Bolao Pro';
const PLATFORM_CITY    = process.env.PIX_MERCHANT_CITY ?? 'SAO PAULO';

@Injectable()
export class CausasVotesService {
  constructor(private prisma: PrismaService) {}

  // ── Votar / Alterar voto ──────────────────────────────────────

  async vote(causaId: string, userId: string, dto: VoteCausaDto) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: { options: true },
    });

    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.status !== 'OPEN') throw new BadRequestException('Causa não está aberta para votação');
    if (new Date() > causa.deadlineAt) throw new BadRequestException('Prazo de votação encerrado');

    if (causa.creatorId === userId) {
      throw new ForbiddenException('Use a opção de participar ao publicar a causa');
    }

    // Limite de participantes
    if (causa.maxVoters) {
      const count = await this.prisma.causaVote.count({ where: { causaId } });
      const existing = await this.prisma.causaVote.findUnique({
        where: { causaId_userId: { causaId, userId } },
      });
      if (!existing && count >= causa.maxVoters) {
        throw new BadRequestException('Limite de participantes atingido');
      }
    }

    if (causa.type === 'BINARY' || causa.type === 'CHOICE') {
      if (!dto.optionId) throw new BadRequestException('optionId é obrigatório');
      const optionExists = causa.options.some((o) => o.id === dto.optionId);
      if (!optionExists) throw new BadRequestException('Opção inválida para esta causa');
    }

    if (causa.type === 'NUMERIC') {
      if (dto.numericValue === undefined || dto.numericValue === null) {
        throw new BadRequestException('numericValue é obrigatório para causa NUMERIC');
      }
    }

    const numCotas = dto.numCotas ?? 1;
    if (numCotas > causa.cotasPerParticipant) {
      throw new BadRequestException(`Máximo de ${causa.cotasPerParticipant} cotas por participante`);
    }

    const amount = causa.entryFee * numCotas;
    const isFree = causa.entryFee === 0;

    // Gera Pix se pago
    let pixPayload: string | null = null;
    if (!isFree) {
      const txid = `CA${causaId.substring(0, 10)}${userId.substring(0, 10)}`;
      pixPayload = generatePixPayload({
        pixKey: PLATFORM_PIX_KEY,
        merchantName: PLATFORM_NAME,
        merchantCity: PLATFORM_CITY,
        amount,
        txid,
        description: `Causa: ${causa.title.substring(0, 30)}`,
      });
    }

    const vote = await this.prisma.causaVote.upsert({
      where: { causaId_userId: { causaId, userId } },
      create: {
        causaId,
        userId,
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
        paymentStatus: isFree ? 'PAID' : 'PENDING',
        pixPayload,
        isCorrect: null,
        paidAt: isFree ? new Date() : null,
      },
      update: {
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
        pixPayload: pixPayload ?? undefined,
      },
      include: { option: true },
    });

    await this.recalcPrizePool(causaId);

    return {
      ...vote,
      qrCodeBase64: pixPayload ? await this.toQrBase64(pixPayload) : null,
    };
  }

  // ── Criador participa da própria causa ────────────────────────

  async creatorJoin(causaId: string, userId: string, dto: VoteCausaDto) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: { options: true },
    });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.creatorId !== userId) throw new ForbiddenException('Apenas o criador pode usar este endpoint');
    if (causa.status !== 'OPEN') throw new BadRequestException('Causa não está aberta');

    return this.doVote(causa, userId, dto);
  }

  // ── Retirar voto ──────────────────────────────────────────────

  async removeVote(causaId: string, userId: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.status !== 'OPEN' || new Date() > causa.deadlineAt) {
      throw new BadRequestException('Não é possível remover voto após o prazo');
    }

    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    if (!vote) throw new NotFoundException('Voto não encontrado');
    if (vote.paymentStatus === 'PAID' && causa.entryFee > 0) {
      throw new BadRequestException('Pagamento já confirmado — não é possível remover o voto');
    }

    await this.prisma.causaVote.delete({ where: { causaId_userId: { causaId, userId } } });
    await this.recalcPrizePool(causaId);
  }

  // ── Meu voto atual ────────────────────────────────────────────

  async getMyVote(causaId: string, userId: string) {
    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId } },
      include: { option: true },
    });
    if (!vote) return null;

    let qrCodeBase64: string | null = null;
    if (vote.pixPayload && vote.paymentStatus === 'PENDING') {
      qrCodeBase64 = await this.toQrBase64(vote.pixPayload);
    }

    return { ...vote, qrCodeBase64 };
  }

  // ── Usuário notifica que pagou ────────────────────────────────

  async notifyPaid(causaId: string, userId: string) {
    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    if (!vote) throw new NotFoundException('Voto não encontrado');
    if (vote.paymentStatus === 'PAID') throw new BadRequestException('Pagamento já confirmado');

    return this.prisma.causaVote.update({
      where: { causaId_userId: { causaId, userId } },
      data: { notifiedAt: new Date() },
    });
  }

  // ── Criador confirma pagamento de um participante ─────────────

  async confirmPayment(causaId: string, creatorId: string, targetUserId: string, userRole: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.creatorId !== creatorId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas o criador pode confirmar pagamentos');
    }

    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId: targetUserId } },
    });
    if (!vote) throw new NotFoundException('Voto não encontrado');
    if (vote.paymentStatus === 'PAID') throw new BadRequestException('Pagamento já confirmado');

    await this.prisma.causaVote.update({
      where: { causaId_userId: { causaId, userId: targetUserId } },
      data: { paymentStatus: 'PAID', paidAt: new Date() },
    });

    await this.recalcPrizePool(causaId);
    return { message: 'Pagamento confirmado' };
  }

  // ── Criador rejeita pagamento de um participante ─────────────

  async rejectPayment(causaId: string, requesterId: string, targetUserId: string, userRole: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.creatorId !== requesterId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas o criador pode rejeitar pagamentos');
    }

    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId: targetUserId } },
    });
    if (!vote) throw new NotFoundException('Voto não encontrado');
    if (vote.paymentStatus === 'PAID') throw new BadRequestException('Pagamento já confirmado — não pode ser rejeitado');

    await this.prisma.causaVote.update({
      where: { causaId_userId: { causaId, userId: targetUserId } },
      data: { paymentStatus: 'FAILED' },
    });

    return { message: 'Pagamento marcado como não confirmado' };
  }

  // ── Salvar comprovante ────────────────────────────────────────

  async saveProof(causaId: string, userId: string, proofUrl: string) {
    const vote = await this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId } },
    });
    if (!vote) throw new NotFoundException('Voto não encontrado');
    if (vote.paymentStatus === 'PAID') throw new BadRequestException('Pagamento já confirmado');

    return this.prisma.causaVote.update({
      where: { causaId_userId: { causaId, userId } },
      data: { paymentProofUrl: proofUrl },
    });
  }

  // ── Admin: todos os pagamentos pendentes de causas ────────────

  async getAllPendingPaymentsAdmin(userRole: string) {
    if (userRole !== 'ADMIN') throw new ForbiddenException('Acesso restrito a admins');

    return this.prisma.causaVote.findMany({
      where: { paymentStatus: 'PENDING', amount: { gt: 0 } },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        option: { select: { id: true, label: true } },
        causa: { select: { id: true, title: true, entryFee: true, creator: { select: { id: true, fullName: true } } } },
      },
      orderBy: [{ notifiedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // ── Admin: KPIs financeiros de causas ─────────────────────────

  async getCausasFinanceKpis(userRole: string) {
    if (userRole !== 'ADMIN') throw new ForbiddenException('Acesso restrito a admins');

    const [paidAgg, pendingAgg, pendingCount, paidCount, activeCausas] = await Promise.all([
      this.prisma.causaVote.aggregate({ where: { paymentStatus: 'PAID', amount: { gt: 0 } }, _sum: { amount: true } }),
      this.prisma.causaVote.aggregate({ where: { paymentStatus: 'PENDING', amount: { gt: 0 } }, _sum: { amount: true } }),
      this.prisma.causaVote.count({ where: { paymentStatus: 'PENDING', amount: { gt: 0 } } }),
      this.prisma.causaVote.count({ where: { paymentStatus: 'PAID', amount: { gt: 0 } } }),
      this.prisma.causa.count({ where: { status: 'OPEN', entryFee: { gt: 0 } } }),
    ]);

    const totalReceived = paidAgg._sum.amount ?? 0;
    const platformFeeDefault = 0.10;
    const platformRevenue = totalReceived * platformFeeDefault;

    return {
      totalReceived,
      platformRevenue,
      totalPending: pendingAgg._sum.amount ?? 0,
      pendingCount,
      paidCount,
      activeCausas,
    };
  }

  // ── Listar pagamentos pendentes (para o criador) ──────────────

  async getPendingPayments(causaId: string, requesterId: string, userRole: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.creatorId !== requesterId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas o criador pode ver os pagamentos');
    }

    return this.prisma.causaVote.findMany({
      where: { causaId, paymentStatus: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        option: { select: { id: true, label: true } },
      },
      orderBy: [{ notifiedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // ── Voto interno (sem bloqueio de criador) ────────────────────

  private async doVote(causa: any, userId: string, dto: VoteCausaDto) {
    const numCotas = dto.numCotas ?? 1;
    const amount = causa.entryFee * numCotas;
    const isFree = causa.entryFee === 0;

    let pixPayload: string | null = null;
    if (!isFree) {
      const txid = `CA${causa.id.substring(0, 10)}${userId.substring(0, 10)}`;
      pixPayload = generatePixPayload({
        pixKey: PLATFORM_PIX_KEY,
        merchantName: PLATFORM_NAME,
        merchantCity: PLATFORM_CITY,
        amount,
        txid,
        description: `Causa: ${causa.title.substring(0, 30)}`,
      });
    }

    const vote = await this.prisma.causaVote.upsert({
      where: { causaId_userId: { causaId: causa.id, userId } },
      create: {
        causaId: causa.id,
        userId,
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
        paymentStatus: isFree ? 'PAID' : 'PENDING',
        pixPayload,
        isCorrect: null,
        paidAt: isFree ? new Date() : null,
      },
      update: {
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
        pixPayload: pixPayload ?? undefined,
      },
    });

    await this.recalcPrizePool(causa.id);
    return {
      ...vote,
      qrCodeBase64: pixPayload ? await this.toQrBase64(pixPayload) : null,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async toQrBase64(pixPayload: string): Promise<string | null> {
    try {
      return await QRCode.toDataURL(pixPayload, {
        width: 300, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch {
      return null;
    }
  }

  async recalcPrizePool(causaId: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) return;

    // Só conta votos com pagamento confirmado (PAID)
    const agg = await this.prisma.causaVote.aggregate({
      where: { causaId, paymentStatus: 'PAID' },
      _sum: { amount: true },
    });

    const grossPool = agg._sum.amount ?? 0;
    const platformFeeAmount = grossPool * (causa.platformFeePercent / 100);
    const prizePool = grossPool - platformFeeAmount;

    await this.prisma.causa.update({
      where: { id: causaId },
      data: { prizePool, platformFeeAmount },
    });
  }
}

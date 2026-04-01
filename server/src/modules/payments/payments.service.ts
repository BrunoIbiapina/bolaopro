import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { nanoid } from 'nanoid';
import * as QRCode from 'qrcode';
import { generatePixPayload } from '@/common/utils/pix.util';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentStatus(poolId: string, userId: string) {
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');

    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });

    // Admin ou não-membro: retorna status padrão sem erro
    if (!member) {
      return {
        poolId,
        userId,
        entryFee: pool.entryFee,
        numCotas: 0,
        totalAmount: 0,
        paymentStatus: 'NOT_MEMBER',
        paymentId: null,
        paidAt: null,
        pixPayload: null,
        qrCodeBase64: null,
        paymentProofUrl: null,
        hasPixKey: true, // always true — fallback key configured
      };
    }

    const payment = await this.prisma.payment.findFirst({ where: { poolId, userId } });

    const numCotas = member.numCotas ?? 1;
    const totalAmount = pool.entryFee * numCotas;

    // Regenera QR code a partir do payload salvo (base64 não persiste no DB)
    let qrCodeBase64: string | null = null;
    if (payment?.pixPayload) {
      try {
        qrCodeBase64 = await QRCode.toDataURL(payment.pixPayload, {
          width: 300, margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      } catch (_) {}
    }

    return {
      poolId,
      userId,
      entryFee: pool.entryFee,
      numCotas,
      totalAmount,
      paymentStatus: payment?.status ?? (pool.entryFee === 0 ? 'PAID' : 'NOT_REQUESTED'),
      paymentId: payment?.id || null,
      paidAt: payment?.paidAt || null,
      pixPayload: payment?.pixPayload ?? null,
      qrCodeBase64,
      paymentProofUrl: payment?.paymentProofUrl ?? null,
      hasPixKey: true, // always true — fallback key configured
    };
  }

  async generatePaymentLink(poolId: string, userId: string) {
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');

    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });
    const numCotas = member?.numCotas ?? 1;
    const totalAmount = pool.entryFee * numCotas;

    if (pool.entryFee === 0) {
      const existing = await this.prisma.payment.findFirst({ where: { poolId, userId } });
      if (!existing) {
        await this.prisma.payment.create({
          data: { poolId, userId, amount: 0, status: 'PAID', paidAt: new Date(), transactionId: nanoid(16) },
        });
      }
      // Confirm member
      await this.prisma.poolMember.update({
        where: { poolId_userId: { poolId, userId } },
        data: { status: 'CONFIRMED' },
      });
      return { message: 'Bolão gratuito confirmado', paymentLink: null, status: 'FREE', totalAmount: 0 };
    }

    const existing = await this.prisma.payment.findFirst({ where: { poolId, userId } });
    if (existing?.status === 'PAID') throw new BadRequestException('Pagamento já realizado');

    const transactionId = nanoid(16);

    // Gerar payload PIX — usa a chave do bolão ou a chave padrão do sistema
    const activePixKey = pool.pixKey || process.env.PIX_KEY || '0c7b3b45-8cef-470c-a0ba-c9fc5a5ecfcb';
    let pixPayload: string | null = null;
    let qrCodeBase64: string | null = null;
    if (activePixKey) {
      const organizer = await this.prisma.user.findUnique({
        where: { id: pool.organizerId },
        select: { fullName: true },
      });
      pixPayload = generatePixPayload({
        pixKey: activePixKey,
        merchantName: process.env.PIX_MERCHANT_NAME ?? organizer?.fullName ?? 'Bolao Pro',
        merchantCity: process.env.PIX_MERCHANT_CITY ?? 'BRASIL',
        amount: totalAmount,
        txid: transactionId,
        description: pool.name.substring(0, 50),
      });
      qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }

    const payment = await this.prisma.payment.upsert({
      where: { poolId_userId: { poolId, userId } },
      update: { status: 'PENDING', amount: totalAmount, pixPayload },
      create: { poolId, userId, amount: totalAmount, status: 'PENDING', transactionId, pixPayload },
    });

    return {
      message: 'Instruções geradas. Realize o pagamento e clique em "Já paguei".',
      paymentId: payment.id,
      amount: totalAmount,
      numCotas,
      status: 'PENDING',
      pixPayload,
      qrCodeBase64,
    };
  }

  async notifyPaymentSent(poolId: string, userId: string) {
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');

    const payment = await this.prisma.payment.findFirst({ where: { poolId, userId } });
    if (!payment) throw new NotFoundException('Gere as instruções de pagamento antes de confirmar.');
    if (payment.status === 'PAID') throw new BadRequestException('Pagamento já confirmado.');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });

    // Grava a data/hora em que o usuário avisou que pagou
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { userNotifiedAt: new Date() },
    });

    // Notificar admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map((admin) =>
      this.prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Pagamento realizado',
          message: `${user?.fullName ?? 'Um participante'} confirmou o pagamento no bolão "${pool.name}". Valor: R$ ${payment.amount.toFixed(2)}. Verifique e confirme.`,
          type: 'PAYMENT_PENDING',
          poolId,
        },
      })
    ));

    return { message: 'Admin notificado. Aguarde a confirmação.' };
  }

  async confirmPaymentManual(poolId: string, targetUserId: string, requesterId: string) {
    // Only organizer or admin can confirm
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');

    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (pool.organizerId !== requesterId && requester?.role !== 'ADMIN') {
      throw new BadRequestException('Apenas o organizador pode confirmar pagamentos');
    }

    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Participante não encontrado');

    const numCotas = member.numCotas ?? 1;
    const totalAmount = pool.entryFee * numCotas;

    // Upsert payment as PAID
    await this.prisma.payment.upsert({
      where: { poolId_userId: { poolId, userId: targetUserId } },
      update: { status: 'PAID', paidAt: new Date(), amount: totalAmount },
      create: {
        poolId, userId: targetUserId, amount: totalAmount,
        status: 'PAID', paidAt: new Date(), transactionId: nanoid(16),
      },
    });

    // Confirmar membro
    await this.prisma.poolMember.update({
      where: { poolId_userId: { poolId, userId: targetUserId } },
      data: { status: 'CONFIRMED' },
    });

    // Notificar o usuário que o pagamento foi confirmado
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        title: '✅ Pagamento confirmado!',
        message: `Seu pagamento no bolão "${pool.name}" foi confirmado. Você já está participando!`,
        type: 'PAYMENT_CONFIRMED',
        poolId,
      },
    });

    return { message: 'Pagamento confirmado', userId: targetUserId };
  }

  async handlePaymentWebhook(transactionId: string, status: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (status === 'COMPLETED' || status === 'PAID') {
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      const member = await this.prisma.poolMember.findUnique({
        where: {
          poolId_userId: {
            poolId: payment.poolId,
            userId: payment.userId,
          },
        },
      });

      if (member && member.status === 'PENDING') {
        await this.prisma.poolMember.update({
          where: {
            poolId_userId: {
              poolId: payment.poolId,
              userId: payment.userId,
            },
          },
          data: {
            status: 'CONFIRMED',
          },
        });
      }

      return updated;
    } else if (status === 'FAILED' || status === 'REJECTED') {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      });
    }

    return payment;
  }

  async getPendingPaymentsAdmin() {
    return this.prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        pool: { select: { id: true, name: true, entryFee: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async savePaymentProof(poolId: string, userId: string, proofUrl: string) {
    const payment = await this.prisma.payment.findFirst({ where: { poolId, userId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paymentProofUrl: proofUrl },
    });

    // Notificar admins que comprovante foi enviado
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId }, select: { name: true } });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map((admin) =>
      this.prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Comprovante enviado',
          message: `${user?.fullName} enviou o comprovante de pagamento para o bolão "${pool?.name}".`,
          type: 'PAYMENT_PENDING',
          poolId,
        },
      })
    ));

    return { message: 'Comprovante salvo com sucesso', proofUrl };
  }

  async rejectPaymentAdmin(poolId: string, targetUserId: string, requesterId: string) {
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');

    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (pool.organizerId !== requesterId && requester?.role !== 'ADMIN') {
      throw new BadRequestException('Sem permissão');
    }

    await this.prisma.payment.upsert({
      where: { poolId_userId: { poolId, userId: targetUserId } },
      update: { status: 'FAILED' },
      create: {
        poolId,
        userId: targetUserId,
        amount: 0,
        status: 'FAILED',
        transactionId: nanoid(16),
      },
    });

    // Notificar o usuário
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        title: 'Pagamento não confirmado',
        message: `Seu pagamento no bolão "${pool.name}" não foi confirmado. Entre em contato com o organizador.`,
        type: 'PAYMENT_PENDING',
        poolId,
      },
    });

    return { message: 'Pagamento marcado como não concluído' };
  }

  async getAllPaymentsAdmin(filters: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    poolId?: string;
  }) {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.poolId) {
      where.poolId = filters.poolId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (filters.search) {
      where.OR = [
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { pool: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        pool: { select: { id: true, name: true, entryFee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

  async getFinanceKpis() {
    const [paid, pending, failed, poolsWithPayments] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'FAILED' },
        _count: { id: true },
      }),
      this.prisma.payment.findMany({
        where: { status: { in: ['PAID', 'PENDING'] } },
        select: { poolId: true },
        distinct: ['poolId'],
      }),
    ]);

    return {
      totalReceived: paid._sum.amount ?? 0,
      totalPaidCount: paid._count.id,
      totalPending: pending._sum.amount ?? 0,
      totalPendingCount: pending._count.id,
      totalFailedCount: failed._count.id,
      activePools: poolsWithPayments.length,
    };
  }

  async getPoolsWithPayments() {
    const pools = await this.prisma.payment.findMany({
      select: { poolId: true, pool: { select: { id: true, name: true } } },
      distinct: ['poolId'],
      orderBy: { pool: { name: 'asc' } },
    });
    return pools.map((p) => p.pool);
  }

  /**
   * Retorna todos os membros de todos os bolões pagos,
   * cruzando com o registro de pagamento (se existir).
   * Permite ao admin confirmar qualquer membro, mesmo sem registro de pagamento.
   */
  async getAllMembersWithPaymentStatus() {
    // Pega todos os bolões pagos que ainda têm membros PENDING ou CONFIRMED
    const pools = await this.prisma.pool.findMany({
      where: { entryFee: { gt: 0 } },
      select: {
        id: true,
        name: true,
        entryFee: true,
        members: {
          select: {
            userId: true,
            status: true,
            numCotas: true,
            user: { select: { id: true, fullName: true, email: true, avatar: true } },
          },
        },
        payments: {
          select: { userId: true, status: true, amount: true, paidAt: true, createdAt: true, paymentProofUrl: true, userNotifiedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pools
      .map((pool) => {
        const paymentByUser = Object.fromEntries(pool.payments.map((p) => [p.userId, p]));
        const members = pool.members.map((m) => {
          const payment = paymentByUser[m.userId];
          return {
            userId: m.userId,
            user: m.user,
            memberStatus: m.status,
            numCotas: m.numCotas,
            expectedAmount: pool.entryFee * m.numCotas,
            paymentStatus: payment?.status ?? 'NOT_REQUESTED',
            paidAt: payment?.paidAt ?? null,
            requestedAt: payment?.createdAt ?? null,
            hasProof: !!payment?.paymentProofUrl,
            userNotifiedAt: payment?.userNotifiedAt ?? null,
          };
        });

        return {
          pool: { id: pool.id, name: pool.name, entryFee: pool.entryFee },
          members,
          pendingCount: members.filter((m) => m.paymentStatus !== 'PAID').length,
        };
      })
      .filter((p) => p.pendingCount > 0); // só mostra bolões com pendências
  }

  async getPoolPayments(poolId: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    return this.prisma.payment.findMany({
      where: { poolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

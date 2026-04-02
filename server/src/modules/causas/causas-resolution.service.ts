import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ResolveCausaDto } from './dto/resolve-causa.dto';

@Injectable()
export class CausasResolutionService {
  private readonly logger = new Logger(CausasResolutionService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  async resolve(causaId: string, userId: string, userRole: string, dto: ResolveCausaDto) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: { options: true, votes: true },
    });

    if (!causa) throw new NotFoundException('Causa não encontrada');

    if (causa.creatorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas o criador ou admin pode resolver');
    }

    if (causa.status === 'RESOLVED') {
      throw new BadRequestException('Causa já resolvida');
    }

    if (causa.status === 'CANCELLED') {
      throw new BadRequestException('Causa cancelada não pode ser resolvida');
    }

    // Validar entrada conforme o tipo
    if (causa.type === 'BINARY' || causa.type === 'CHOICE') {
      if (!dto.winningOptionId) {
        throw new BadRequestException('winningOptionId é obrigatório');
      }
      const optionExists = causa.options.some((o) => o.id === dto.winningOptionId);
      if (!optionExists) throw new BadRequestException('Opção inválida');
    }

    if (causa.type === 'NUMERIC') {
      if (dto.numericResult === undefined || dto.numericResult === null) {
        throw new BadRequestException('numericResult é obrigatório para causa NUMERIC');
      }
    }

    // Determinar vencedores
    const votes = causa.votes;
    let winners: typeof votes = [];

    if (causa.type === 'BINARY' || causa.type === 'CHOICE') {
      winners = votes.filter((v) => v.optionId === dto.winningOptionId);
    } else if (causa.type === 'NUMERIC') {
      if (causa.numericMatchMode === 'EXACT') {
        winners = votes.filter((v) => v.numericValue === dto.numericResult);
      } else {
        // CLOSEST: encontrar a menor diferença absoluta
        const minDiff = Math.min(
          ...votes.map((v) => Math.abs((v.numericValue ?? 0) - (dto.numericResult ?? 0))),
        );
        winners = votes.filter(
          (v) => Math.abs((v.numericValue ?? 0) - (dto.numericResult ?? 0)) === minDiff,
        );
      }
    }

    const grossPool = votes.reduce((sum, v) => sum + v.amount, 0);
    const platformFee = grossPool * (causa.platformFeePercent / 100);
    const netPool = grossPool - platformFee;

    // Atualizar isCorrect em todos os votos e calcular prêmios
    await this.prisma.$transaction(async (tx) => {
      // Marcar todos como incorretos primeiro
      await tx.causaVote.updateMany({
        where: { causaId },
        data: { isCorrect: false },
      });

      if (winners.length > 0) {
        // Distribuir proporcionalmente pelas cotas dos vencedores
        const totalWinnerCotas = winners.reduce((sum, w) => sum + w.numCotas, 0);

        for (const winner of winners) {
          const prize = totalWinnerCotas > 0
            ? parseFloat((netPool * (winner.numCotas / totalWinnerCotas)).toFixed(2))
            : 0;

          await tx.causaVote.update({
            where: { id: winner.id },
            data: { isCorrect: true, prizeAmount: prize },
          });
        }

        // Atualizar causa: RESOLVED + resultado
        await tx.causa.update({
          where: { id: causaId },
          data: {
            status: 'RESOLVED',
            resolvedOptionId: dto.winningOptionId ?? null,
            resolvedNumericValue: dto.numericResult ?? null,
            resolvedAt: new Date(),
            resolvedBy: userId,
            platformFeeAmount: platformFee,
            prizePool: netPool,
          },
        });
      } else {
        // Sem acertadores: 100% para o sistema
        await tx.causa.update({
          where: { id: causaId },
          data: {
            status: 'RESOLVED',
            resolvedOptionId: dto.winningOptionId ?? null,
            resolvedNumericValue: dto.numericResult ?? null,
            resolvedAt: new Date(),
            resolvedBy: userId,
            // Sistema leva tudo (grossPool): platformFeeAmount = grossPool, prizePool = 0
            platformFeeAmount: grossPool,
            prizePool: 0,
          },
        });
      }
    });

    const resolved = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: {
        creator: { select: { id: true, fullName: true, avatar: true } },
        options: { orderBy: { order: 'asc' } },
        resolvedOption: true,
        _count: { select: { votes: true } },
        votes: {
          include: {
            user: { select: { phone: true, whatsappOptIn: true } },
          },
        },
      },
    });

    // Disparar notificações WhatsApp em background (não bloqueia a resposta)
    if (resolved) {
      this.notifyVoters(resolved).catch((err) =>
        this.logger.error('Erro ao notificar via WhatsApp:', err),
      );
    }

    // Retornar sem os votes populados (manter contrato original)
    const { votes: _votes, ...rest } = resolved as any;
    return rest;
  }

  private async notifyVoters(causa: any): Promise<void> {
    for (const vote of causa.votes ?? []) {
      const { phone, whatsappOptIn } = vote.user ?? {};
      if (!whatsappOptIn || !phone) continue;

      try {
        await this.whatsapp.notifyCausaResolved({
          phone,
          causaTitle: causa.title,
          isWinner: vote.isCorrect === true,
          prize: vote.prizeAmount ?? 0,
        });
        // Marcar notifiedAt
        await this.prisma.causaVote.update({
          where: { id: vote.id },
          data: { notifiedAt: new Date() },
        });
      } catch (err) {
        this.logger.warn(`Falha ao notificar voto ${vote.id}: ${err}`);
      }
    }
  }
}

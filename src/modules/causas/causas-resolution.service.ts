import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResolveCausaDto } from './dto/resolve-causa.dto';

@Injectable()
export class CausasResolutionService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.causa.findUnique({
      where: { id: causaId },
      include: {
        creator: { select: { id: true, fullName: true, avatar: true } },
        options: { orderBy: { order: 'asc' } },
        resolvedOption: true,
        _count: { select: { votes: true } },
      },
    });
  }
}

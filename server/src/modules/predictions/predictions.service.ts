import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavePredictionsDto } from './dto/save-predictions.dto';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async savePredictions(poolId: string, userId: string, saveDto: SavePredictionsDto) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundException('Bolão não encontrado');
    }

    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Você não é membro deste bolão');
    }

    // Bloquear palpites se o pagamento foi marcado como não concluído pelo admin
    if (pool.entryFee > 0) {
      const payment = await this.prisma.payment.findFirst({ where: { poolId, userId } });
      if (payment?.status === 'FAILED') {
        throw new ForbiddenException('Seu pagamento não foi confirmado. Entre em contato com o organizador para participar.');
      }
    }

    const numCotas = member.numCotas ?? 1;
    let saved = 0;
    let skipped = 0;

    for (const predictionItem of saveDto.predictions) {
      const match = await this.prisma.match.findUnique({
        where: { id: predictionItem.matchId },
      });

      // Pular partidas inválidas (sem lançar erro para não cancelar o batch)
      if (!match) { skipped++; continue; }
      if (match.championshipId !== pool.championshipId) { skipped++; continue; }

      // Pular partidas bloqueadas (15 min antes do início ou já começadas)
      const scheduledAt = new Date(match.scheduledAt);
      const lockTime = new Date(scheduledAt.getTime() - 15 * 60 * 1000);
      if (new Date() > lockTime) { skipped++; continue; }

      const cotaIndex = predictionItem.cotaIndex ?? 0;
      if (cotaIndex >= numCotas) continue;

      // findFirst + update/create (não depende de nome de constraint)
      const existing = await this.prisma.prediction.findFirst({
        where: { userId, matchId: predictionItem.matchId, poolId, cotaIndex },
      });

      if (existing) {
        await this.prisma.prediction.update({
          where: { id: existing.id },
          data: {
            homeScore: predictionItem.homeScore,
            awayScore: predictionItem.awayScore,
            knockoutWinnerId: predictionItem.knockoutWinnerId ?? null,
          },
        });
      } else {
        await this.prisma.prediction.create({
          data: {
            userId,
            matchId: predictionItem.matchId,
            poolId,
            homeScore: predictionItem.homeScore,
            awayScore: predictionItem.awayScore,
            knockoutWinnerId: predictionItem.knockoutWinnerId ?? null,
            cotaIndex,
          },
        });
      }

      saved++;
    }

    return {
      message: saved > 0
        ? `${saved} palpite(s) salvo(s)${skipped > 0 ? ` · ${skipped} bloqueado(s)` : ''}`
        : `Todos os palpites estão bloqueados (partidas já iniciadas)`,
      saved,
      skipped,
    };
  }

  async getUserPredictions(poolId: string, userId: string) {
    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Você não é membro deste bolão');
    }

    const predictions = await this.prisma.prediction.findMany({
      where: { poolId, userId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: [
        { cotaIndex: 'asc' },
        { match: { scheduledAt: 'asc' } },
      ],
    });

    return predictions;
  }

  async getPredictionsByRound(poolId: string, userId: string, roundId: string) {
    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Você não é membro deste bolão');
    }

    const predictions = await this.prisma.prediction.findMany({
      where: { poolId, userId, match: { roundId } },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { match: { scheduledAt: 'asc' } },
    });

    return predictions;
  }

  // Retorna palpites agrupados por partida — somente de membros CONFIRMED
  // (palpite de PENDING não aparece para os outros)
  async getGroupPredictions(poolId: string, requestingUserId: string) {
    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId: requestingUserId } },
    });
    if (!member) throw new ForbiddenException('Você não é membro deste bolão');

    // IDs dos membros confirmados
    const confirmedMembers = await this.prisma.poolMember.findMany({
      where: { poolId, status: 'CONFIRMED' },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });
    const confirmedUserIds = confirmedMembers.map((m) => m.userId);

    const predictions = await this.prisma.prediction.findMany({
      where: { poolId, userId: { in: confirmedUserIds } },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: [
        { match: { scheduledAt: 'asc' } },
        { cotaIndex: 'asc' },
        { userId: 'asc' },
      ],
    });

    // Agrupar por matchId
    const matchMap: Record<string, { match: any; predictions: any[] }> = {};
    for (const p of predictions) {
      if (!matchMap[p.matchId]) {
        matchMap[p.matchId] = { match: p.match, predictions: [] };
      }
      matchMap[p.matchId].predictions.push({
        userId: p.userId,
        user: p.user,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        cotaIndex: p.cotaIndex,
      });
    }

    // Incluir partidas sem palpites para mostrar a tabela completa
    const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
    if (pool) {
      const allMatches = await this.prisma.match.findMany({
        where: { championshipId: pool.championshipId },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { scheduledAt: 'asc' },
      });
      for (const m of allMatches) {
        if (!matchMap[m.id]) {
          matchMap[m.id] = { match: m, predictions: [] };
        }
      }
    }

    return {
      myStatus: member.status,
      confirmedCount: confirmedMembers.length,
      matches: Object.values(matchMap).sort(
        (a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime()
      ),
    };
  }

  // Cancela palpites de uma cota (apenas partidas abertas — não bloqueadas)
  async cancelCotaPredictions(poolId: string, userId: string, cotaIndex: number) {
    const member = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });
    if (!member) throw new ForbiddenException('Você não é membro deste bolão');
    if (member.status === 'CONFIRMED') {
      throw new BadRequestException('Não é possível cancelar palpites após confirmar o pagamento');
    }

    // Buscar palpites desta cota
    const predictions = await this.prisma.prediction.findMany({
      where: { poolId, userId, cotaIndex },
      include: { match: { select: { scheduledAt: true, status: true } } },
    });

    let deleted = 0;
    for (const p of predictions) {
      // Só deleta se a partida ainda está aberta (mais de 15 min antes)
      const lockTime = new Date(new Date(p.match.scheduledAt).getTime() - 15 * 60 * 1000);
      if (new Date() < lockTime && p.match.status === 'SCHEDULED') {
        await this.prisma.prediction.delete({ where: { id: p.id } });
        deleted++;
      }
    }

    return { message: `${deleted} palpite(s) cancelado(s)`, deleted };
  }

  async getAllPoolPredictions(poolId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: { poolId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
      orderBy: [
        { cotaIndex: 'asc' },
        { userId: 'asc' },
        { match: { scheduledAt: 'asc' } },
      ],
    });

    return predictions;
  }
}

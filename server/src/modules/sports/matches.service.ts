import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { RegisterMatchResultDto } from './dto/register-match-result.dto';
import { RankingsService } from '../rankings/rankings.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private rankingsService: RankingsService,
  ) {}

  async createMatch(createMatchDto: CreateMatchDto) {
    const championship = await this.prisma.championship.findUnique({
      where: { id: createMatchDto.championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const homeTeam = await this.prisma.team.findUnique({
      where: { id: createMatchDto.homeTeamId },
    });

    if (!homeTeam) {
      throw new NotFoundException('Home team not found');
    }

    const awayTeam = await this.prisma.team.findUnique({
      where: { id: createMatchDto.awayTeamId },
    });

    if (!awayTeam) {
      throw new NotFoundException('Away team not found');
    }

    return this.prisma.match.create({
      data: {
        championshipId: createMatchDto.championshipId,
        homeTeamId: createMatchDto.homeTeamId,
        awayTeamId: createMatchDto.awayTeamId,
        scheduledAt: createMatchDto.scheduledAt,
        roundId: createMatchDto.roundId,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  async getMatchesByChampionship(championshipId: string) {
    return this.prisma.match.findMany({
      where: { championshipId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getMatchById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        championship: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  async registerResult(id: string, registerMatchResultDto: RegisterMatchResultDto) {
    const match = await this.getMatchById(id);

    const updated = await this.prisma.match.update({
      where: { id },
      data: {
        homeScoreResult: registerMatchResultDto.homeScore,
        awayScoreResult: registerMatchResultDto.awayScore,
        knockoutWinnerId: registerMatchResultDto.knockoutWinnerId ?? null,
        status: 'FINISHED',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Buscar todos os bolões afetados: pelo campeonato OU por vínculo direto com a partida
    const [poolsByChamp, poolsByMatch] = await Promise.all([
      this.prisma.pool.findMany({
        where: { championshipId: match.championshipId },
        select: { id: true },
      }),
      this.prisma.poolMatch.findMany({
        where: { matchId: id },
        select: { poolId: true },
      }),
    ]);

    const poolIds = [
      ...new Set([
        ...poolsByChamp.map((p) => p.id),
        ...poolsByMatch.map((pm) => pm.poolId),
      ]),
    ];

    for (const poolId of poolIds) {
      try {
        await this.rankingsService.recalculatePoolRanking(poolId);
      } catch (error) {
        console.error(`Failed to recalculate ranking for pool ${poolId}:`, error);
      }

      // Auto-finalizar bolão se todas as suas partidas estiverem encerradas
      try {
        await this.autoFinalizePoolIfAllMatchesDone(poolId);
      } catch (error) {
        console.error(`Failed to auto-finalize pool ${poolId}:`, error);
      }
    }

    return updated;
  }

  /**
   * Verifica se todas as partidas de um bolão estão FINISHED.
   * Se sim, muda o status do bolão para FINISHED automaticamente.
   */
  private async autoFinalizePoolIfAllMatchesDone(poolId: string): Promise<void> {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      select: { id: true, status: true, championshipId: true },
    });

    if (!pool || pool.status === 'FINISHED') return;

    // Verificar se o bolão usa partidas específicas ou todo o campeonato
    const specificMatches = await this.prisma.poolMatch.findMany({
      where: { poolId },
      include: { match: { select: { status: true } } },
    });

    let allFinished: boolean;

    if (specificMatches.length > 0) {
      // Bolão com partidas específicas — todas devem estar encerradas
      allFinished = specificMatches.every((pm) => pm.match.status === 'FINISHED');
    } else {
      // Bolão usa todas as partidas do campeonato
      const champMatches = await this.prisma.match.findMany({
        where: { championshipId: pool.championshipId },
        select: { status: true },
      });
      allFinished =
        champMatches.length > 0 &&
        champMatches.every((m) => m.status === 'FINISHED');
    }

    if (allFinished) {
      await this.prisma.pool.update({
        where: { id: poolId },
        data: { status: 'FINISHED' },
      });
      console.log(`Pool ${poolId} auto-finalized — all matches are done.`);
    }
  }

  async getAllMatches() {
    return this.prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        championship: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getMatchesByRound(roundId: string) {
    return this.prisma.match.findMany({
      where: { roundId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async deleteMatch(id: string) {
    await this.getMatchById(id);
    await this.prisma.match.delete({ where: { id } });
    return { message: 'Match deleted successfully' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringEngine } from './scoring.engine';
import { TiebreakerEngine } from './tiebreaker.engine';

@Injectable()
export class RankingsService {
  constructor(
    private prisma: PrismaService,
    private scoringEngine: ScoringEngine,
    private tiebreakerEngine: TiebreakerEngine,
  ) {}

  async getRanking(poolId: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      include: { members: true },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    const members = await this.prisma.poolMember.findMany({
      where: { poolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    const ranking: Array<{
      position: number;
      user: any;
      totalScore: number;
      correctResults: number;
      correctWinners: number;
      totalPredictions: number;
    }> = [];

    for (const member of members) {
      const predictions = await this.prisma.prediction.findMany({
        where: {
          poolId,
          userId: member.userId,
        },
        include: {
          match: true,
        },
      });

      let totalScore = 0;
      let correctResults = 0;
      let correctWinners = 0;

      for (const prediction of predictions) {
        if (prediction.match.homeScoreResult !== null && prediction.match.awayScoreResult !== null) {
          const score = this.scoringEngine.calculateScore(
            {
              homeScore: prediction.homeScore,
              awayScore: prediction.awayScore,
              knockoutWinnerId: prediction.knockoutWinnerId ?? undefined,
            },
            {
              homeScore: prediction.match.homeScoreResult,
              awayScore: prediction.match.awayScoreResult,
              winnerId: prediction.match.knockoutWinnerId ?? undefined,
            },
          );

          totalScore += score;

          if (
            prediction.homeScore === prediction.match.homeScoreResult &&
            prediction.awayScore === prediction.match.awayScoreResult
          ) {
            correctResults++;
          }

          if (
            (prediction.homeScore > prediction.awayScore &&
              prediction.match.homeScoreResult > prediction.match.awayScoreResult) ||
            (prediction.homeScore < prediction.awayScore &&
              prediction.match.homeScoreResult < prediction.match.awayScoreResult) ||
            (prediction.homeScore === prediction.awayScore &&
              prediction.match.homeScoreResult === prediction.match.awayScoreResult)
          ) {
            correctWinners++;
          }
        }
      }

      ranking.push({
        position: 0,
        user: member.user,
        totalScore,
        correctResults,
        correctWinners,
        totalPredictions: predictions.length,
      });
    }

    const sortedRanking = this.tiebreakerEngine.sort(
      ranking.map((r) => ({
        userId: r.user.id,
        totalScore: r.totalScore,
        correctResults: r.correctResults,
        correctWinners: r.correctWinners,
        predictions: r.totalPredictions,
      })),
    );

    return sortedRanking.map((entry, index) => {
      const original = ranking.find((r) => r.user.id === entry.userId)!;
      return {
        position: index + 1,
        user: original.user,
        totalScore: entry.totalScore,
        correctResults: entry.correctResults,
        correctWinners: entry.correctWinners,
        totalPredictions: entry.predictions,
      };
    });
  }

  async recalculatePoolRanking(poolId: string) {
    const ranking = await this.getRanking(poolId);
    return ranking;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FootballDataService } from './football-data.service';

@Injectable()
export class FootballDataImportService {
  private readonly logger = new Logger(FootballDataImportService.name);

  constructor(
    private prisma: PrismaService,
    private footballDataService: FootballDataService,
  ) {}

  async importMatch(externalMatchId: number, competitionCode: string) {
    // Fetch match from external API
    const apiMatch = await this.footballDataService.getMatchById(externalMatchId);
    if (!apiMatch) throw new Error('Partida não encontrada na API externa');

    // Upsert championship
    const competition = this.footballDataService
      .getAvailableCompetitions()
      .find((c) => c.code === competitionCode);

    const championship = await this.prisma.championship.upsert({
      where: { code: competitionCode },
      update: {},
      create: {
        name: competition?.name ?? apiMatch.competition.name,
        code: competitionCode,
        description: `Importado de football-data.org`,
      },
    });

    // Upsert home team
    const homeTeam = await this.prisma.team.upsert({
      where: { code: apiMatch.homeTeam.tla },
      update: {
        name: apiMatch.homeTeam.name,
        logo: apiMatch.homeTeam.crest ?? undefined,
      },
      create: {
        name: apiMatch.homeTeam.name,
        code: apiMatch.homeTeam.tla,
        logo: apiMatch.homeTeam.crest ?? undefined,
        country: apiMatch.homeTeam.country ?? competition?.country,
      },
    });

    // Upsert away team
    const awayTeam = await this.prisma.team.upsert({
      where: { code: apiMatch.awayTeam.tla },
      update: {
        name: apiMatch.awayTeam.name,
        logo: apiMatch.awayTeam.crest ?? undefined,
      },
      create: {
        name: apiMatch.awayTeam.name,
        code: apiMatch.awayTeam.tla,
        logo: apiMatch.awayTeam.crest ?? undefined,
        country: apiMatch.awayTeam.country ?? competition?.country,
      },
    });

    // Determine match status
    const statusMap: Record<string, string> = {
      SCHEDULED: 'SCHEDULED',
      TIMED: 'SCHEDULED',
      IN_PLAY: 'LIVE',
      PAUSED: 'LIVE',
      FINISHED: 'FINISHED',
      CANCELLED: 'CANCELLED',
    };

    const matchStatus = statusMap[apiMatch.status] ?? 'SCHEDULED';
    const roundId = apiMatch.matchday ? `Rodada ${apiMatch.matchday}` : null;

    // Check if match already imported (by external ref stored in roundId prefix)
    const externalRef = `ext:${externalMatchId}`;
    const existing = await this.prisma.match.findFirst({
      where: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        championshipId: championship.id,
        scheduledAt: new Date(apiMatch.utcDate),
      },
    });

    if (existing) {
      // Update scores if match has results
      return this.prisma.match.update({
        where: { id: existing.id },
        data: {
          status: matchStatus as any,
          homeScoreResult: apiMatch.score.fullTime.home,
          awayScoreResult: apiMatch.score.fullTime.away,
          externalId: externalRef,
        },
        include: { homeTeam: true, awayTeam: true, championship: true },
      });
    }

    // Create new match
    return this.prisma.match.create({
      data: {
        championshipId: championship.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: new Date(apiMatch.utcDate),
        status: matchStatus as any,
        roundId: roundId ?? externalRef,
        externalId: externalRef,
        homeScoreResult: apiMatch.score.fullTime.home,
        awayScoreResult: apiMatch.score.fullTime.away,
      },
      include: { homeTeam: true, awayTeam: true, championship: true },
    });
  }

  async syncLiveScores() {
    const liveMatches = await this.footballDataService.getLiveMatches();
    const updated: string[] = [];

    for (const apiMatch of liveMatches) {
      const externalRef = `ext:${apiMatch.id}`;
      const match = await this.prisma.match.findFirst({
        where: { externalId: externalRef },
      });

      if (!match) continue;

      await this.prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'LIVE' as any,
          homeScoreResult: apiMatch.score.fullTime.home ?? apiMatch.score.halfTime.home,
          awayScoreResult: apiMatch.score.fullTime.away ?? apiMatch.score.halfTime.away,
        },
      });

      updated.push(match.id);
    }

    return { synced: updated.length, matchIds: updated };
  }
}

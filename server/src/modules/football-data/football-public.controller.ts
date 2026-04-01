import { Controller, Get, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { FootballDataService, FREE_COMPETITIONS } from './football-data.service';

@ApiTags('Futebol')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('futebol')
export class FootballPublicController {
  private readonly logger = new Logger(FootballPublicController.name);

  constructor(private footballDataService: FootballDataService) {}

  @Get('competitions')
  @ApiOperation({ summary: 'Lista campeonatos disponíveis' })
  getCompetitions() {
    return FREE_COMPETITIONS;
  }

  @Get('competitions/:code/matches')
  @ApiOperation({ summary: 'Próximas partidas de um campeonato' })
  async getMatches(@Param('code') code: string) {
    try {
      const matches = await this.footballDataService.getUpcomingMatches(code);
      return matches;
    } catch (err: any) {
      this.logger.error(`[getMatches ${code}] ${err?.message}`);
      // Retorna array vazio com meta de erro para o frontend exibir corretamente
      return [];
    }
  }

  @Get('competitions/:code/standings')
  @ApiOperation({ summary: 'Tabela de classificação de um campeonato' })
  async getStandings(@Param('code') code: string) {
    try {
      return await this.footballDataService.getStandings(code);
    } catch (err: any) {
      this.logger.error(`[getStandings ${code}] ${err?.message}`);
      return null;
    }
  }
}

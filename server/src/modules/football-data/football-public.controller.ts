import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { FootballDataService, FREE_COMPETITIONS } from './football-data.service';

@ApiTags('Futebol')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('futebol')
export class FootballPublicController {
  constructor(private footballDataService: FootballDataService) {}

  @Get('competitions')
  @ApiOperation({ summary: 'Lista campeonatos disponíveis' })
  getCompetitions() {
    return FREE_COMPETITIONS;
  }

  @Get('competitions/:code/matches')
  @ApiOperation({ summary: 'Próximas partidas (7 dias) de um campeonato' })
  getMatches(@Param('code') code: string) {
    return this.footballDataService.getUpcomingMatches(code);
  }

  @Get('competitions/:code/standings')
  @ApiOperation({ summary: 'Tabela de classificação de um campeonato' })
  getStandings(@Param('code') code: string) {
    return this.footballDataService.getStandings(code);
  }
}

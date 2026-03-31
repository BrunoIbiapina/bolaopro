import {
  Controller, Get, Post, Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FootballDataService } from './football-data.service';
import { FootballDataImportService } from './football-data-import.service';

@ApiTags('Football Data')
@Controller('admin/football-data')
export class FootballDataController {
  constructor(
    private footballDataService: FootballDataService,
    private importService: FootballDataImportService,
  ) {}

  @Get('competitions')
  @ApiOperation({ summary: 'List available competitions' })
  getCompetitions() {
    return this.footballDataService.getAvailableCompetitions();
  }

  @Get('competitions/:code/matches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get matches from external API for a competition' })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'LIVE', 'FINISHED'] })
  getMatches(
    @Param('code') code: string,
    @Query('status') status?: 'SCHEDULED' | 'LIVE' | 'FINISHED',
  ) {
    return this.footballDataService.getMatchesByCompetition(code, status);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import a match (and its teams) from external API into the database' })
  importMatch(@Body() body: { externalMatchId: number; competitionCode: string }) {
    return this.importService.importMatch(body.externalMatchId, body.competitionCode);
  }

  @Post('sync-live')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync live match scores into the database' })
  syncLive() {
    return this.importService.syncLiveScores();
  }
}

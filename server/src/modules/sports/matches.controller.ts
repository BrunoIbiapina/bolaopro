import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { RegisterMatchResultDto } from './dto/register-match-result.dto';

@ApiTags('Sports')
@Controller('admin/matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a match (authenticated users)' })
  createMatch(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.createMatch(createMatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all matches or by championship' })
  getMatches(@Query('championshipId') championshipId?: string) {
    if (championshipId) {
      return this.matchesService.getMatchesByChampionship(championshipId);
    }
    return this.matchesService.getAllMatches();
  }

  @Get('round/:roundId')
  @ApiOperation({ summary: 'Get matches by round' })
  getMatchesByRound(@Param('roundId') roundId: string) {
    return this.matchesService.getMatchesByRound(roundId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  getMatchById(@Param('id') id: string) {
    return this.matchesService.getMatchById(id);
  }

  @Patch(':id/result')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register match result (admin only)' })
  registerResult(
    @Param('id') id: string,
    @Body() registerMatchResultDto: RegisterMatchResultDto,
  ) {
    return this.matchesService.registerResult(id, registerMatchResultDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a match (admin only)' })
  deleteMatch(@Param('id') id: string) {
    return this.matchesService.deleteMatch(id);
  }
}

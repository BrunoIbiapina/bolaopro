import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RankingsService } from './rankings.service';

@ApiTags('Rankings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pools/:poolId/ranking')
export class RankingsController {
  constructor(private rankingsService: RankingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get pool ranking' })
  getRanking(@Param('poolId') poolId: string) {
    return this.rankingsService.getRanking(poolId);
  }
}

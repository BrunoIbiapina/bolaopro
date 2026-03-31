import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { ScoringEngine } from './scoring.engine';
import { TiebreakerEngine } from './tiebreaker.engine';

@Module({
  imports: [PrismaModule],
  controllers: [RankingsController],
  providers: [RankingsService, ScoringEngine, TiebreakerEngine],
  exports: [RankingsService],
})
export class RankingsModule {}

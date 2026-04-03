import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RankingsModule } from '../rankings/rankings.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { ChampionshipsController } from './championships.controller';
import { ChampionshipsService } from './championships.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [PrismaModule, RankingsModule, WhatsAppModule],
  controllers: [TeamsController, ChampionshipsController, MatchesController],
  providers: [TeamsService, ChampionshipsService, MatchesService],
  exports: [TeamsService, ChampionshipsService, MatchesService],
})
export class SportsModule {}

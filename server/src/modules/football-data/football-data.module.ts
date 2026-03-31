import { Module } from '@nestjs/common';
import { FootballDataService } from './football-data.service';
import { FootballDataImportService } from './football-data-import.service';
import { FootballDataController } from './football-data.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FootballDataController],
  providers: [FootballDataService, FootballDataImportService],
  exports: [FootballDataService, FootballDataImportService],
})
export class FootballDataModule {}

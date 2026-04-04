import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CausasController } from './causas.controller';
import { CausasService } from './causas.service';
import { CausasVotesService } from './causas-votes.service';
import { CausasResolutionService } from './causas-resolution.service';
import { CausasScheduler } from './causas.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [CausasController],
  providers: [CausasService, CausasVotesService, CausasResolutionService, CausasScheduler],
  exports: [CausasService],
})
export class CausasModule {}

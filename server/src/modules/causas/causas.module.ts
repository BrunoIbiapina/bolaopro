import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CausasController } from './causas.controller';
import { AdminCausasController } from './admin-causas.controller';
import { CausasService } from './causas.service';
import { CausasVotesService } from './causas-votes.service';
import { CausasResolutionService } from './causas-resolution.service';
import { CausasScheduler } from './causas.scheduler';
import { CausasPaymentService } from './causas-payment.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [CausasController, AdminCausasController],
  providers: [CausasService, CausasVotesService, CausasResolutionService, CausasScheduler, CausasPaymentService],
  exports: [CausasService, CausasPaymentService],
})
export class CausasModule {}

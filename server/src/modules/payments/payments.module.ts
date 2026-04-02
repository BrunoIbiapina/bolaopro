import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { AdminPaymentsController, PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, MulterModule.register({}), WhatsAppModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

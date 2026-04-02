import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { PoolsController } from './pools.controller';
import { AdminPoolsController } from './admin-pools.controller';
import { PoolsService } from './pools.service';

@Module({
  imports: [PrismaModule, WhatsAppModule],
  controllers: [PoolsController, AdminPoolsController],
  providers: [PoolsService],
  exports: [PoolsService],
})
export class PoolsModule {}

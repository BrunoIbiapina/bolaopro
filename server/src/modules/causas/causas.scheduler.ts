import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CausasScheduler {
  private readonly logger = new Logger(CausasScheduler.name);

  constructor(private prisma: PrismaService) {}

  // Roda a cada 5 minutos — fecha causas cujo deadline passou
  @Cron(CronExpression.EVERY_5_MINUTES)
  async closeExpiredCausas() {
    const result = await this.prisma.causa.updateMany({
      where: {
        status: 'OPEN',
        deadlineAt: { lte: new Date() },
      },
      data: { status: 'CLOSED' },
    });

    if (result.count > 0) {
      this.logger.log(`Auto-fechamento: ${result.count} causa(s) fechada(s)`);
    }
  }
}

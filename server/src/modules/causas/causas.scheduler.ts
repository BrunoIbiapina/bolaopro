import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CausasScheduler {
  private readonly logger = new Logger(CausasScheduler.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

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

  // Roda a cada 15 minutos — envia lembrete WhatsApp para causas que fecham em ~1h
  @Cron('*/15 * * * *')
  async sendDeadlineReminders() {
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in75min = new Date(now.getTime() + 75 * 60 * 1000);

    // Busca causas abertas cujo deadline cai entre 1h e 1h15 a partir de agora
    // (janela de 15 min para evitar envios duplicados entre execuções do cron)
    const causas = await this.prisma.causa.findMany({
      where: {
        status: 'OPEN',
        deadlineAt: { gte: in1h, lte: in75min },
      },
      include: {
        votes: {
          include: {
            user: { select: { phone: true, whatsappOptIn: true } },
          },
        },
      },
    });

    if (causas.length === 0) return;

    this.logger.log(`Lembretes de prazo: ${causas.length} causa(s) fechando em ~1h`);

    for (const causa of causas) {
      for (const vote of causa.votes) {
        const { phone, whatsappOptIn } = vote.user;
        if (!whatsappOptIn || !phone) continue;

        await this.whatsapp.notifyCausaDeadline({
          phone,
          causaTitle: causa.title,
          hoursLeft: 1,
        }).catch((err) =>
          this.logger.warn(`Falha ao enviar lembrete para ${phone}: ${err}`),
        );
      }
    }
  }
}

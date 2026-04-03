import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly headers: { headers: Record<string, string> };

  constructor() {
    const instanceId = process.env.ZAPI_INSTANCE_ID || '';
    const token = process.env.ZAPI_CLIENT_TOKEN || '';
    this.baseUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}`;
    this.headers = {
      headers: { 'Content-Type': 'application/json', 'Client-Token': token },
    };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55')) return digits;
    return `55${digits}`;
  }

  async sendText(params: { phone: string; message: string }): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(params.phone);
      await axios.post(
        `${this.baseUrl}/send-text`,
        { phone: normalizedPhone, message: params.message },
        this.headers,
      );
      this.logger.log(`Mensagem enviada para ${normalizedPhone}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    }
  }

  async notifyMatchResult(params: {
    phone: string;
    poolName: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    predictedHome: number;
    predictedAway: number;
    isCorrect: boolean;
    pointsEarned: number;
  }): Promise<boolean> {
    const {
      phone, poolName, homeTeam, awayTeam,
      homeScore, awayScore, predictedHome, predictedAway,
      isCorrect, pointsEarned,
    } = params;

    const resultLine = `${homeTeam} *${homeScore} x ${awayScore}* ${awayTeam}`;
    const predLine = `Seu palpite: ${predictedHome} x ${predictedAway}`;

    if (isCorrect) {
      return this.sendText({
        phone,
        message:
          `*Bolao Pro* -- resultado da partida!\n\n` +
          `Bolao: *${poolName}*\n` +
          `${resultLine}\n` +
          `${predLine}\n\n` +
          `Acertou o placar! +${pointsEarned} pontos`,
      });
    }

    return this.sendText({
      phone,
      message:
        `*Bolao Pro* -- resultado da partida!\n\n` +
        `Bolao: *${poolName}*\n` +
        `${resultLine}\n` +
        `${predLine}\n\n` +
        `Dessa vez nao foi, mas ainda ha rodadas pela frente!`,
    });
  }
}

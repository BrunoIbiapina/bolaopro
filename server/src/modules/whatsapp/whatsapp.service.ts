import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface WhatsAppMessage {
  phone: string;   // formato E.164 sem "+": "5511999999999"
  message: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly clientToken: string;

  constructor(private config: ConfigService) {
    const instanceId = this.config.get<string>('ZAPI_INSTANCE_ID');
    const token = this.config.get<string>('ZAPI_TOKEN');
    this.clientToken = this.config.get<string>('ZAPI_CLIENT_TOKEN') ?? '';
    this.enabled = !!(instanceId && token);

    this.baseUrl = this.enabled
      ? `https://api.z-api.io/instances/${instanceId}/token/${token}`
      : '';

    if (!this.enabled) {
      this.logger.warn('WhatsApp (Z-API) não configurado — notificações desativadas');
    }
  }

  /** Envia mensagem de texto simples. Retorna true se enviado. */
  async sendText({ phone, message }: WhatsAppMessage): Promise<boolean> {
    if (!this.enabled) return false;

    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      this.logger.warn(`Número inválido para WhatsApp: ${phone}`);
      return false;
    }

    try {
      await axios.post(
        `${this.baseUrl}/send-text`,
        { phone: normalizedPhone, message },
        {
          headers: {
            'Client-Token': this.clientToken,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        },
      );
      this.logger.log(`WhatsApp enviado para ${normalizedPhone}`);
      return true;
    } catch (err: any) {
      this.logger.error(
        `Falha ao enviar WhatsApp para ${normalizedPhone}: ${err?.response?.data?.message ?? err.message}`,
      );
      return false;
    }
  }

  /** Envia link com card de preview (título, descrição, imagem). */
  async sendLink(params: {
    phone: string;
    message?: string;
    linkUrl: string;
    title: string;
    description: string;
    imageUrl?: string;
  }): Promise<boolean> {
    if (!this.enabled) return false;

    const normalizedPhone = this.normalizePhone(params.phone);
    if (!normalizedPhone) return false;

    try {
      await axios.post(
        `${this.baseUrl}/send-link`,
        {
          phone: normalizedPhone,
          message: params.message ?? '',
          image: params.imageUrl ?? '',
          linkUrl: params.linkUrl,
          title: params.title,
          linkDescription: params.description,
        },
        {
          headers: {
            'Client-Token': this.clientToken,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        },
      );
      this.logger.log(`WhatsApp link enviado para ${normalizedPhone}`);
      return true;
    } catch (err: any) {
      // Fallback para texto simples se send-link falhar
      this.logger.warn(`send-link falhou, tentando texto: ${err?.response?.data?.message ?? err.message}`);
      return this.sendText({
        phone: params.phone,
        message: `${params.title}\n${params.description}\n\n${params.linkUrl}`,
      });
    }
  }

  // ─── Mensagens pré-definidas ───────────────────────────────────

  async sendOtp(phone: string, code: string): Promise<boolean> {
    return this.sendText({
      phone,
      message:
        `*Bolão Pro* — seu código de verificação:\n\n` +
        `*${code}*\n\n` +
        `Válido por 10 minutos. Não compartilhe com ninguém.`,
    });
  }

  async notifyCausaResolved(params: {
    phone: string;
    causaTitle: string;
    isWinner: boolean;
    prize?: number;
  }): Promise<boolean> {
    const { phone, causaTitle, isWinner, prize } = params;

    if (isWinner && prize && prize > 0) {
      return this.sendText({
        phone,
        message:
          `*Bolão Pro* — resultado disponivel!\n\n` +
          `Causa: *${causaTitle}*\n` +
          `Voce acertou! Seu premio e de *R$ ${prize.toFixed(2)}*.\n\n` +
          `Abra o app para ver detalhes e receber via PIX.`,
      });
    }

    if (isWinner) {
      return this.sendText({
        phone,
        message:
          `*Bolão Pro* — resultado disponivel!\n\n` +
          `Causa: *${causaTitle}*\n` +
          `Voce acertou! Confira os detalhes no app.`,
      });
    }

    return this.sendText({
      phone,
      message:
        `*Bolão Pro* — resultado disponivel!\n\n` +
        `Causa: *${causaTitle}*\n` +
        `Desta vez nao foi, mas ja ha novas causas abertas para votar!`,
    });
  }

  async notifyCausaDeadline(params: {
    phone: string;
    causaTitle: string;
    hoursLeft: number;
  }): Promise<boolean> {
    const { phone, causaTitle, hoursLeft } = params;
    return this.sendText({
      phone,
      message:
        `*Bolão Pro* — lembrete!\n\n` +
        `A causa *${causaTitle}* fecha em *${hoursLeft}h*.\n` +
        `Abra o app e registre seu palpite antes que feche!`,
    });
  }

  async notifyPoolInvite(params: {
    phone: string;
    poolName: string;
    inviteCode: string;
  }): Promise<boolean> {
    const { phone, poolName, inviteCode } = params;
    return this.sendText({
      phone,
      message:
        `*Bolão Pro* — voce foi convidado!\n\n` +
        `Participe do bolao *${poolName}*.\n` +
        `Use o codigo *${inviteCode}* no app para entrar.`,
    });
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
      phone,
      poolName,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      predictedHome,
      predictedAway,
      isCorrect,
      pointsEarned,
    } = params;

    const resultLine = `${homeTeam} *${homeScore} x ${awayScore}* ${awayTeam}`;
    const predLine = `Seu palpite: ${predictedHome} x ${predictedAway}`;

    if (isCorrect) {
      return this.sendText({
        phone,
        message:
          `*Bolão Pro* — resultado da partida!\n\n` +
          `Bolão: *${poolName}*\n` +
          `${resultLine}\n` +
          `${predLine}\n\n` +
          `Acertou o placar! +${pointsEarned} pontos`,
      });
    }

    return this.sendText({
      phone,
      message:
        `*Bolão Pro* — resultado da partida!\n\n` +
        `Bolão: *${poolName}*\n` +
        `${resultLine}\n` +
        `${predLine}\n\n` +
        `Dessa vez nao foi, mas ainda ha rodadas pela frente!`,
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────

  /** Normaliza número brasileiro para formato Z-API (55XXXXXXXXXXX) */
  private normalizePhone(raw: string): string | null {
    // Remove tudo que não for dígito
    const digits = raw.replace(/\D/g, '');

    // Já tem DDI 55
    if (digits.startsWith('55') && digits.length >= 12) return digits;

    // Só DDD + número (10 ou 11 dígitos)
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;

    return null;
  }
}

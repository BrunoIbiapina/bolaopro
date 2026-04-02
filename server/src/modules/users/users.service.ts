import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import * as bcrypt from 'bcryptjs';

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  pixKey: true,
  avatar: true,
  bio: true,
  role: true,
  whatsappOptIn: true,
  whatsappVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_SELECT,
    });
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateProfileDto.fullName !== undefined && { fullName: updateProfileDto.fullName }),
        ...(updateProfileDto.phone !== undefined && { phone: updateProfileDto.phone || null }),
        ...(updateProfileDto.pixKey !== undefined && { pixKey: updateProfileDto.pixKey || null }),
        ...(updateProfileDto.avatar !== undefined && { avatar: updateProfileDto.avatar }),
        ...(updateProfileDto.bio !== undefined && { bio: updateProfileDto.bio }),
      },
      select: USER_SELECT,
    });

    return updated;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Conta criada via Google não possui senha para alterar');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ─── WhatsApp OTP ──────────────────────────────────────────────

  async sendWhatsAppOtp(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const phone = user.phone;
    if (!phone) {
      throw new BadRequestException('Cadastre um número de telefone no perfil antes de ativar o WhatsApp');
    }

    // Gerar código OTP de 6 dígitos
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        whatsappOtp: otp,
        whatsappOtpExpiresAt: expiresAt,
      },
    });

    const sent = await this.whatsapp.sendOtp(phone, otp);

    if (!sent) {
      throw new BadRequestException(
        'Não foi possível enviar o código. Verifique se o número está correto e tente novamente.',
      );
    }

    return { message: `Código enviado para ${this.maskPhone(phone)}` };
  }

  async verifyWhatsAppOtp(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.whatsappOtp || !user.whatsappOtpExpiresAt) {
      throw new BadRequestException('Nenhum código pendente. Solicite um novo.');
    }

    if (new Date() > user.whatsappOtpExpiresAt) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    if (user.whatsappOtp !== code.trim()) {
      throw new BadRequestException('Código incorreto.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        whatsappOptIn: true,
        whatsappVerifiedAt: new Date(),
        whatsappOtp: null,
        whatsappOtpExpiresAt: null,
      },
    });

    return { message: 'WhatsApp verificado com sucesso! Você receberá notificações por aqui.' };
  }

  async disableWhatsApp(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        whatsappOptIn: false,
        whatsappVerifiedAt: null,
        whatsappOtp: null,
        whatsappOtpExpiresAt: null,
      },
    });

    return { message: 'Notificações por WhatsApp desativadas.' };
  }

  async testWhatsApp(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.phone) throw new BadRequestException('Nenhum telefone cadastrado no perfil');

    const sent = await this.whatsapp.sendText({
      phone: user.phone,
      message:
        `*Bolão Pro* — teste de conexão!\n\n` +
        `Tudo certo, as notificações estão funcionando.`,
    });

    if (!sent) throw new BadRequestException('Não foi possível enviar. Verifique se a instância Z-API está conectada.');
    return { message: `Mensagem de teste enviada para ${this.maskPhone(user.phone)}` };
  }

  // ─── Stats ─────────────────────────────────────────────────────

  async getStats(id: string) {
    const user = await this.findById(id);

    const poolsParticipating = await this.prisma.poolMember.count({
      where: { userId: id },
    });

    const poolsOrganizing = await this.prisma.pool.count({
      where: { organizerId: id },
    });

    const predictions = await this.prisma.prediction.count({
      where: { userId: id },
    });

    return {
      user,
      stats: {
        poolsParticipating,
        poolsOrganizing,
        predictions,
      },
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return phone;
    return digits.slice(0, -4).replace(/./g, '*') + digits.slice(-4);
  }
}

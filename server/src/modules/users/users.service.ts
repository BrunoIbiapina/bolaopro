import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  pixKey: true,
  avatar: true,
  bio: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}

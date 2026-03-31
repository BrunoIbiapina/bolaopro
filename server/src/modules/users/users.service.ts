import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateProfileDto.fullName && { fullName: updateProfileDto.fullName }),
        ...(updateProfileDto.avatar && { avatar: updateProfileDto.avatar }),
        ...(updateProfileDto.bio && { bio: updateProfileDto.bio }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
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

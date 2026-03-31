import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { UpdatePoolDto } from './dto/update-pool.dto';
import { JoinPoolDto } from './dto/join-pool.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class PoolsService {
  constructor(private prisma: PrismaService) {}

  async createPool(organizerId: string, createPoolDto: CreatePoolDto) {
    const championship = await this.prisma.championship.findUnique({
      where: { id: createPoolDto.championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const inviteCode = nanoid(8);

    const pool = await this.prisma.pool.create({
      data: {
        name: createPoolDto.name,
        description: createPoolDto.description,
        organizerId,
        championshipId: createPoolDto.championshipId,
        entryFee: createPoolDto.entryFee,
        maxParticipants: createPoolDto.maxParticipants,
        rules: createPoolDto.rules,
        inviteCode,
        status: 'OPEN',
      },
      include: {
        championship: true,
        organizer: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    const organizer = await this.prisma.poolMember.create({
      data: {
        poolId: pool.id,
        userId: organizerId,
        status: 'CONFIRMED',
      },
    });

    return {
      ...pool,
      memberCount: 1,
    };
  }

  async listUserPools(userId: string) {
    const pools = await this.prisma.pool.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        championship: true,
        organizer: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pools.map((pool) => ({
      ...pool,
      memberCount: pool._count.members,
    }));
  }

  async getPoolById(id: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: {
        championship: true,
        organizer: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    return {
      ...pool,
      memberCount: pool._count.members,
    };
  }

  async getPoolByInviteCode(inviteCode: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { inviteCode },
      select: {
        id: true,
        name: true,
        description: true,
        entryFee: true,
        maxParticipants: true,
        rules: true,
        status: true,
        organizer: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    return {
      ...pool,
      memberCount: pool._count.members,
    };
  }

  async updatePool(poolId: string, userId: string, updatePoolDto: UpdatePoolDto) {
    const pool = await this.getPoolById(poolId);

    if (pool.organizerId !== userId) {
      throw new ForbiddenException('Only pool organizer can update pool');
    }

    const updated = await this.prisma.pool.update({
      where: { id: poolId },
      data: {
        ...(updatePoolDto.name && { name: updatePoolDto.name }),
        ...(updatePoolDto.description && { description: updatePoolDto.description }),
        ...(updatePoolDto.entryFee !== undefined && { entryFee: updatePoolDto.entryFee }),
        ...(updatePoolDto.maxParticipants && {
          maxParticipants: updatePoolDto.maxParticipants,
        }),
        ...(updatePoolDto.rules && { rules: updatePoolDto.rules }),
      },
      include: {
        championship: true,
        organizer: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return {
      ...updated,
      memberCount: updated._count.members,
    };
  }

  async deletePool(poolId: string, userId: string) {
    const pool = await this.getPoolById(poolId);

    if (pool.organizerId !== userId) {
      throw new ForbiddenException('Only pool organizer can delete pool');
    }

    await this.prisma.pool.delete({
      where: { id: poolId },
    });

    return { message: 'Pool deleted successfully' };
  }

  async joinPool(poolId: string, userId: string, joinPoolDto: JoinPoolDto) {
    const pool = await this.prisma.pool.findFirst({
      where: {
        inviteCode: joinPoolDto.inviteCode,
      },
    });

    if (!pool) {
      throw new BadRequestException('Invalid invite code');
    }

    if (pool.id !== poolId) {
      throw new BadRequestException('Invite code does not match pool');
    }

    const existingMember = await this.prisma.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User already member of this pool');
    }

    const memberCount = await this.prisma.poolMember.count({
      where: { poolId },
    });

    if (memberCount >= pool.maxParticipants) {
      throw new BadRequestException('Pool is full');
    }

    const member = await this.prisma.poolMember.create({
      data: {
        poolId,
        userId,
        status: 'PENDING',
      },
    });

    return member;
  }

  async getPoolMembers(poolId: string) {
    const members = await this.prisma.poolMember.findMany({
      where: { poolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return members;
  }

  async updateMemberStatus(
    poolId: string,
    memberId: string,
    userId: string,
    status: string,
  ) {
    const pool = await this.getPoolById(poolId);

    if (pool.organizerId !== userId) {
      throw new ForbiddenException('Only pool organizer can update member status');
    }

    const member = await this.prisma.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in pool');
    }

    const updated = await this.prisma.poolMember.update({
      where: {
        poolId_userId: {
          poolId,
          userId: memberId,
        },
      },
      data: { status: status as any },
    });

    return updated;
  }

  async leavePool(poolId: string, userId: string) {
    const pool = await this.getPoolById(poolId);

    if (pool.organizerId === userId) {
      throw new BadRequestException('Pool organizer cannot leave the pool');
    }

    const member = await this.prisma.poolMember.findUnique({
      where: {
        poolId_userId: {
          poolId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in pool');
    }

    await this.prisma.poolMember.delete({
      where: {
        poolId_userId: {
          poolId,
          userId,
        },
      },
    });

    return { message: 'Left pool successfully' };
  }

  async listAvailablePools(userId: string) {
    const pools = await this.prisma.pool.findMany({
      where: {
        status: 'OPEN',
        NOT: {
          OR: [
            { organizerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
        championship: true,
        organizer: { select: { id: true, email: true, fullName: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return pools.map((pool) => ({ ...pool, memberCount: pool._count.members }));
  }

  async joinByInviteCode(userId: string, inviteCode: string, numCotas = 1) {
    const pool = await this.prisma.pool.findUnique({
      where: { inviteCode },
      include: {
        poolMatches: { select: { match: { select: { scheduledAt: true, status: true } } } },
        championship: { select: { matches: { select: { scheduledAt: true, status: true } } } },
      },
    });

    if (!pool) throw new BadRequestException('Código de convite inválido');
    if (pool.status !== 'OPEN') throw new BadRequestException('Este bolão não está mais aberto');

    const poolSpecificMatches = (pool as any).poolMatches.map((pm: any) => pm.match);
    const relevantMatches =
      poolSpecificMatches.length > 0
        ? poolSpecificMatches
        : ((pool as any).championship?.matches ?? []);

    if (relevantMatches.length > 0) {
      const lockThresholdMs = 15 * 60 * 1000;
      const now = Date.now();
      const hasOpenMatch = relevantMatches.some(
        (m: any) =>
          m.status !== 'FINISHED' &&
          m.status !== 'LIVE' &&
          new Date(m.scheduledAt).getTime() - lockThresholdMs > now,
      );
      if (!hasOpenMatch) {
        throw new BadRequestException(
          'Não é possível entrar — todas as partidas já iniciaram ou estão prestes a iniciar',
        );
      }
    }

    const existingMember = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId: pool.id, userId } },
    });
    if (existingMember) throw new BadRequestException('Você já está neste bolão');

    const memberCount = await this.prisma.poolMember.count({ where: { poolId: pool.id } });
    if (memberCount >= pool.maxParticipants) throw new BadRequestException('Bolão está cheio');

    const cotas = Math.min(Math.max(1, numCotas), pool.cotasPerParticipant);
    const status = pool.entryFee === 0 ? 'CONFIRMED' : 'PENDING';

    await this.prisma.poolMember.create({
      data: { poolId: pool.id, userId, status: status as any, numCotas: cotas },
    });

    return { ...await this.getPoolById(pool.id), numCotas: cotas, totalAmount: pool.entryFee * cotas };
  }

  async getPrizeInfo(poolId: string, _userId: string) {
    const pool = await this.getPoolById(poolId);
    const confirmedMembers = await (this.prisma.poolMember.findMany as any)({
      where: { poolId, status: 'CONFIRMED' },
      include: { user: { select: { id: true, fullName: true, avatar: true, pixKey: true } } },
    }) as any[];
    const totalCotas = confirmedMembers.reduce((sum, m) => sum + m.numCotas, 0);
    const totalPrize = totalCotas * pool.entryFee;
    const cotasPerParticipant = pool.cotasPerParticipant;
    return {
      totalPrize,
      totalCotas,
      confirmedCount: confirmedMembers.length,
      entryFee: pool.entryFee,
      cotasPerParticipant,
      poolStatus: pool.status,
      members: confirmedMembers.map((m) => ({
        userId: m.userId,
        fullName: (m.user as any).fullName,
        avatar: (m.user as any).avatar,
        pixKey: (m.user as any).pixKey,
        numCotas: m.numCotas,
        prizePaid: (m as any).prizePaid ?? false,
        prizeAmount: (m as any).prizeAmount ?? null,
      })),
    };
  }

  async markPrizePaid(poolId: string, winnerId: string, requesterId: string, prizeAmount: number) {
    const pool = await this.getPoolById(poolId);
    if (pool.organizerId !== requesterId) {
      const user = await this.prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Apenas o organizador pode registrar pagamento de prêmio');
    }
    return this.prisma.poolMember.update({
      where: { poolId_userId: { poolId, userId: winnerId } },
      data: { prizePaid: true, prizeAmount } as any,
    });
  }

  async unmarkPrizePaid(poolId: string, winnerId: string, requesterId: string) {
    const pool = await this.getPoolById(poolId);
    if (pool.organizerId !== requesterId) {
      const user = await this.prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Apenas o organizador pode alterar pagamento de prêmio');
    }
    return this.prisma.poolMember.update({
      where: { poolId_userId: { poolId, userId: winnerId } },
      data: { prizePaid: false, prizeAmount: null } as any,
    });
  }

  async getPoolMatches(poolId: string) {
    const poolMatches = await this.prisma.poolMatch.findMany({
      where: { poolId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    if (poolMatches.length > 0) {
      return poolMatches.map((pm) => pm.match);
    }

    // Fallback: todas as partidas do campeonato do bolão
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      select: { championshipId: true },
    });
    if (!pool?.championshipId) return [];

    return this.prisma.match.findMany({
      where: { championshipId: pool.championshipId },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { UpdatePoolDto } from './dto/update-pool.dto';
import { JoinPoolDto } from './dto/join-pool.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class PoolsService {
  private readonly logger = new Logger(PoolsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  async createPool(organizerId: string, createPoolDto: CreatePoolDto, role?: string) {
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
        cotasPerParticipant: createPoolDto.cotasPerParticipant ?? 1,
        rules: createPoolDto.rules,
        pixKey: createPoolDto.pixKey,
        isPublic: createPoolDto.isPublic ?? false,
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

    // Associar partidas selecionadas ao bolão
    if (createPoolDto.matchIds && createPoolDto.matchIds.length > 0) {
      await this.prisma.poolMatch.createMany({
        data: createPoolDto.matchIds.map((matchId) => ({
          poolId: pool.id,
          matchId,
        })),
      });
    }

    // Adicionar organizador como membro apenas se quiser participar (organizerCotas > 0)
    const organizerParticipates = role !== 'ADMIN' && (createPoolDto.organizerCotas ?? 1) > 0;
    if (organizerParticipates) {
      await this.prisma.poolMember.create({
        data: {
          poolId: pool.id,
          userId: organizerId,
          status: 'PENDING',
          numCotas: createPoolDto.organizerCotas ?? 1,
        },
      });
    }

    // Notificar organizador com card de compartilhamento
    this.notifyPoolCreated(organizerId, pool).catch((err) =>
      this.logger.warn(`Falha ao notificar criação do bolão: ${err}`),
    );

    return {
      ...pool,
      memberCount: organizerParticipates ? 1 : 0,
    };
  }

  private async notifyPoolCreated(organizerId: string, pool: any): Promise<void> {
    const organizer = await this.prisma.user.findUnique({
      where: { id: organizerId },
      select: { phone: true, whatsappOptIn: true },
    });

    if (!organizer?.whatsappOptIn || !organizer.phone) return;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite/${pool.inviteCode}`;
    const entryFee = pool.entryFee > 0
      ? `R$ ${Number(pool.entryFee).toFixed(2)}`
      : 'Gratuito';
    const championship = pool.championship?.name ?? 'Bolão Pro';

    await this.whatsapp.sendLink({
      phone: organizer.phone,
      message: `*Bolão Pro* — seu bolão está pronto! Compartilhe o link abaixo com seus amigos:`,
      linkUrl: inviteUrl,
      title: pool.name,
      description: `${championship} · Entrada: ${entryFee} · Vagas: ${pool.maxParticipants}`,
      imageUrl: `${frontendUrl}/invite/${pool.inviteCode}/opengraph-image`,
    }).catch(() => null);
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
        poolMatches: {
          include: {
            match: {
              select: {
                id: true,
                scheduledAt: true,
                status: true,
                roundId: true,
                homeTeam: { select: { id: true, name: true, code: true, logo: true } },
                awayTeam: { select: { id: true, name: true, code: true, logo: true } },
              },
            },
          },
          orderBy: { match: { scheduledAt: 'asc' } },
        },
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    // Partidas: específicas do pool ou fallback do campeonato
    let matches = pool.poolMatches.map((pm) => pm.match);
    if (matches.length === 0 && pool.championshipId) {
      matches = await this.prisma.match.findMany({
        where: { championshipId: pool.championshipId },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          roundId: true,
          homeTeam: { select: { id: true, name: true, code: true, logo: true } },
          awayTeam: { select: { id: true, name: true, code: true, logo: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 20,
      }) as any[];
    }

    return {
      ...pool,
      memberCount: pool._count.members,
      matches,
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
        championshipId: true,
        championship: { select: { id: true, name: true } },
        organizer: {
          select: { id: true, email: true, fullName: true },
        },
        _count: { select: { members: true } },
        poolMatches: {
          include: {
            match: {
              select: {
                id: true,
                scheduledAt: true,
                status: true,
                roundId: true,
                homeTeam: { select: { id: true, name: true, code: true, logo: true } },
                awayTeam: { select: { id: true, name: true, code: true, logo: true } },
              },
            },
          },
          orderBy: { match: { scheduledAt: 'asc' } },
        },
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    // Fallback: se sem PoolMatch específico, busca todas do campeonato (máx 10 para preview)
    let matches = pool.poolMatches.map((pm) => pm.match);
    if (matches.length === 0 && pool.championshipId) {
      matches = await this.prisma.match.findMany({
        where: { championshipId: pool.championshipId },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          roundId: true,
          homeTeam: { select: { id: true, name: true, code: true, logo: true } },
          awayTeam: { select: { id: true, name: true, code: true, logo: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }) as any[];
    }

    const now = new Date();
    const lockThreshold = 15 * 60 * 1000;
    const allMatchesLocked = matches.length > 0 && matches.every((m: any) => {
      if (m.status === 'FINISHED' || m.status === 'LIVE') return true;
      return now.getTime() > new Date(m.scheduledAt).getTime() - lockThreshold;
    });

    return {
      ...pool,
      memberCount: pool._count.members,
      matches,
      allMatchesLocked,
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
        ...(updatePoolDto.pixKey !== undefined && { pixKey: updatePoolDto.pixKey || null }),
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
            pixKey: true,
            phone: true,
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

    // Organizador não pode sair, a menos que seja ADMIN removendo
    // a própria participação indevida (criada antes do fix)
    if (pool.organizerId === userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== 'ADMIN') {
        throw new BadRequestException('Pool organizer cannot leave the pool');
      }
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
        isPublic: true,
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

    // Notificações WhatsApp em background
    this.notifyPoolJoin(pool.id, userId).catch((err) =>
      this.logger.warn(`Falha nas notificações de entrada no bolão: ${err}`),
    );

    return { ...await this.getPoolById(pool.id), numCotas: cotas, totalAmount: pool.entryFee * cotas };
  }

  private async notifyPoolJoin(poolId: string, newUserId: string): Promise<void> {
    const [pool, newUser] = await Promise.all([
      this.prisma.pool.findUnique({
        where: { id: poolId },
        include: {
          organizer: { select: { id: true, phone: true, whatsappOptIn: true, fullName: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: newUserId },
        select: { fullName: true, phone: true, whatsappOptIn: true },
      }),
    ]);

    if (!pool || !newUser) return;

    // Notificar organizador
    const { phone: orgPhone, whatsappOptIn: orgOptIn } = pool.organizer;
    if (orgOptIn && orgPhone && pool.organizer.id !== newUserId) {
      await this.whatsapp.sendText({
        phone: orgPhone,
        message:
          `*Bolão Pro* — novo participante!\n\n` +
          `*${newUser.fullName}* entrou no bolão *${pool.name}*.\n` +
          `Abra o app para ver os participantes.`,
      }).catch(() => null);
    }

    // Notificar o novo membro (boas-vindas)
    if (newUser.whatsappOptIn && newUser.phone) {
      await this.whatsapp.sendText({
        phone: newUser.phone,
        message:
          `*Bolão Pro* — você entrou!\n\n` +
          `Bem-vindo ao bolão *${pool.name}*.\n` +
          `Abra o app e registre seus palpites antes que as partidas comecem!`,
      }).catch(() => null);
    }
  }

  async getPrizeInfo(poolId: string, userId: string) {
    const pool = await this.getPoolById(poolId);
    const confirmedMembers = await (this.prisma.poolMember.findMany as any)({
      where: { poolId, status: 'CONFIRMED' },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    }) as any[];
    const totalCotas = confirmedMembers.reduce((sum: number, m: any) => sum + (m.numCotas ?? 1), 0);
    const totalPot = totalCotas * (pool.entryFee ?? 0);

    // Buscar membro atual (qualquer status) para myStatus e myContribution
    const myMember = await this.prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });
    const myCotas = (myMember as any)?.numCotas ?? 1;
    const myContribution = myCotas * (pool.entryFee ?? 0);
    const myStatus = myMember?.status ?? null;

    return {
      totalPot,
      totalCotas,
      confirmedMembers: confirmedMembers.length,
      entryFee: pool.entryFee ?? 0,
      myContribution,
      potentialWinIfAlone: totalPot,
      myStatus,
      members: confirmedMembers.map((m: any) => ({
        userId: m.userId,
        fullName: (m.user as any).fullName,
        avatar: (m.user as any).avatar,
        numCotas: m.numCotas,
        prizePaid: m.prizePaid ?? false,
        prizeAmount: m.prizeAmount ?? null,
      })),
    };
  }

  async markPrizePaid(poolId: string, winnerId: string, requesterId: string, prizeAmount: number) {
    const pool = await this.getPoolById(poolId);
    if (pool.organizerId !== requesterId) {
      const user = await this.prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Apenas o organizador pode registrar pagamento de prêmio');
    }

    const result = await this.prisma.poolMember.update({
      where: { poolId_userId: { poolId, userId: winnerId } },
      data: { prizePaid: true, prizeAmount } as any,
    });

    // Notificar vencedor via WhatsApp
    const winner = await this.prisma.user.findUnique({
      where: { id: winnerId },
      select: { phone: true, whatsappOptIn: true },
    });
    if (winner?.whatsappOptIn && winner.phone) {
      await this.whatsapp.sendText({
        phone: winner.phone,
        message:
          `*Bolão Pro* — premio enviado!\n\n` +
          `Seu premio de *R$ ${prizeAmount.toFixed(2)}* do bolao *${pool.name}* foi enviado via PIX.\n` +
          `Verifique sua conta. Parabens!`,
      }).catch(() => null);
    }

    return result;
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

  // ─── Admin-only methods ────────────────────────────────────────────────────

  async listAllPoolsAdmin(filters?: { status?: string; search?: string }) {
    const where: any = {};

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { organizer: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { championship: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const pools = await this.prisma.pool.findMany({
      where,
      include: {
        championship: { select: { id: true, name: true } },
        organizer: { select: { id: true, fullName: true, email: true } },
        _count: { select: { members: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pools.map((pool) => ({
      ...pool,
      memberCount: pool._count.members,
      paymentCount: pool._count.payments,
    }));
  }

  async updatePoolStatusAdmin(poolId: string, status: string) {
    const allowed = ['OPEN', 'CLOSED', 'FINISHED'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status inválido. Use: ${allowed.join(', ')}`);
    }

    const pool = await this.prisma.pool.update({
      where: { id: poolId },
      data: { status: status as any },
      include: {
        championship: { select: { id: true, name: true } },
        organizer: { select: { id: true, fullName: true, email: true } },
        _count: { select: { members: true } },
      },
    });

    // Quando finaliza o bolão, notifica todos os participantes
    if (status === 'FINISHED') {
      this.notifyPoolFinished(poolId, pool.name).catch((err) =>
        this.logger.warn(`Falha ao notificar finalização do bolão: ${err}`),
      );
    }

    return pool;
  }

  private async notifyPoolFinished(poolId: string, poolName: string): Promise<void> {
    const members = await this.prisma.poolMember.findMany({
      where: { poolId },
      include: {
        user: { select: { phone: true, whatsappOptIn: true } },
      },
    });

    for (const member of members) {
      const { phone, whatsappOptIn } = member.user;
      if (!whatsappOptIn || !phone) continue;

      await this.whatsapp.sendText({
        phone,
        message:
          `*Bolão Pro* — resultado disponivel!\n\n` +
          `O bolão *${poolName}* foi finalizado.\n` +
          `Abra o app para ver sua posicao no ranking e o resultado final!`,
      }).catch(() => null);
    }
  }
}

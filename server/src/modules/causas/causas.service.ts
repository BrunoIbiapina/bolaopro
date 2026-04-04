import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCausaDto, CausaType, CausaVisibility } from './dto/create-causa.dto';
import { ListCausasDto, CausaStatusFilter, CausaSortBy } from './dto/list-causas.dto';
import { nanoid } from 'nanoid';

const CAUSA_INCLUDE = {
  creator: { select: { id: true, fullName: true, avatar: true } },
  options: { orderBy: { order: 'asc' as const } },
  _count: { select: { votes: true } },
} as const;

@Injectable()
export class CausasService {
  constructor(private prisma: PrismaService) {}

  // ── Criar ──────────────────────────────────────────────────────

  async create(creatorId: string, dto: CreateCausaDto) {
    const deadline = new Date(dto.deadlineAt);
    if (deadline <= new Date()) {
      throw new BadRequestException('Deadline deve ser no futuro');
    }

    // Validar opções conforme o tipo
    if (dto.type === CausaType.CHOICE) {
      if (!dto.options || dto.options.length < 2) {
        throw new BadRequestException('CHOICE requer ao menos 2 opções');
      }
    }

    const inviteCode = nanoid(8);

    const causa = await this.prisma.causa.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        category: dto.category,
        type: dto.type,
        status: 'DRAFT',
        visibility: dto.visibility ?? CausaVisibility.PUBLIC,
        inviteCode,
        deadlineAt: deadline,
        resolvesAt: dto.resolvesAt ? new Date(dto.resolvesAt) : undefined,
        creatorId,
        entryFee: dto.entryFee ?? 0,
        cotasPerParticipant: dto.cotasPerParticipant ?? 1,
        maxVoters: dto.maxVoters,
        hideVoteCount: dto.hideVoteCount ?? false,
        allowComments: dto.allowComments ?? true,
        numericUnit: dto.numericUnit,
        numericMatchMode: dto.numericMatchMode ?? 'CLOSEST',
        options: dto.type === CausaType.BINARY
          ? {
              create: [
                { label: 'Sim', emoji: '✅', order: 0 },
                { label: 'Não', emoji: '❌', order: 1 },
              ],
            }
          : dto.type === CausaType.CHOICE && dto.options
          ? { create: dto.options.map((o, i) => ({ label: o.label, emoji: o.emoji, order: o.order ?? i })) }
          : undefined,
      },
      include: CAUSA_INCLUDE,
    });

    return causa;
  }

  // ── Publicar (DRAFT → OPEN) ───────────────────────────────────

  async publish(causaId: string, userId: string, userRole: string) {
    const causa = await this.findOneOrFail(causaId);
    this.assertOwnerOrAdmin(causa, userId, userRole);

    if (causa.status !== 'DRAFT') {
      throw new BadRequestException('Somente causas em DRAFT podem ser publicadas');
    }

    return this.prisma.causa.update({
      where: { id: causaId },
      data: { status: 'OPEN' },
      include: CAUSA_INCLUDE,
    });
  }

  // ── Fechar manualmente (OPEN → CLOSED) ────────────────────────

  async close(causaId: string, userId: string, userRole: string) {
    const causa = await this.findOneOrFail(causaId);
    this.assertOwnerOrAdmin(causa, userId, userRole);

    if (causa.status !== 'OPEN') {
      throw new BadRequestException('Apenas causas OPEN podem ser fechadas');
    }

    return this.prisma.causa.update({
      where: { id: causaId },
      data: { status: 'CLOSED' },
      include: CAUSA_INCLUDE,
    });
  }

  // ── Cancelar ──────────────────────────────────────────────────

  async cancel(causaId: string, userId: string, userRole: string) {
    const causa = await this.findOneOrFail(causaId);
    this.assertOwnerOrAdmin(causa, userId, userRole);

    if (causa.status === 'RESOLVED') {
      throw new BadRequestException('Causa já resolvida não pode ser cancelada');
    }

    return this.prisma.causa.update({
      where: { id: causaId },
      data: { status: 'CANCELLED' },
      include: CAUSA_INCLUDE,
    });
  }

  // ── Feed público ──────────────────────────────────────────────

  async listPublic(dto: ListCausasDto) {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: any = {
      visibility: 'PUBLIC',
    };

    // Filtro de status
    if (!dto.status || dto.status === CausaStatusFilter.OPEN) {
      where.status = 'OPEN';
    } else if (dto.status !== CausaStatusFilter.ALL) {
      where.status = dto.status;
    } else {
      where.status = { in: ['OPEN', 'CLOSED', 'RESOLVED'] };
    }

    if (dto.category) where.category = dto.category;
    if (dto.type) where.type = dto.type;
    if (dto.search) {
      where.title = { contains: dto.search, mode: 'insensitive' };
    }

    // Ordenação
    let orderBy: any = { createdAt: 'desc' };
    if (dto.sortBy === CausaSortBy.DEADLINE) orderBy = { deadlineAt: 'asc' };
    if (dto.sortBy === CausaSortBy.POPULAR) orderBy = { votes: { _count: 'desc' } };

    const [items, total] = await Promise.all([
      this.prisma.causa.findMany({
        where,
        include: CAUSA_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.causa.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // ── Minhas causas (criadas + votadas) ─────────────────────────

  async listMy(userId: string) {
    const [created, voted] = await Promise.all([
      this.prisma.causa.findMany({
        where: { creatorId: userId },
        include: CAUSA_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.causaVote.findMany({
        where: { userId },
        include: {
          causa: { include: CAUSA_INCLUDE },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      created,
      voted: voted.map((v) => ({
        ...v.causa,
        myVote: {
          optionId: v.optionId,
          numericValue: v.numericValue,
          numCotas: v.numCotas,
          isCorrect: v.isCorrect,
          prizeAmount: v.prizeAmount,
        },
      })),
    };
  }

  // ── Detalhe de uma causa ──────────────────────────────────────

  async findOne(causaId: string, userId?: string) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: {
        ...CAUSA_INCLUDE,
        resolvedOption: true,
      },
    });

    if (!causa) throw new NotFoundException('Causa não encontrada');

    // Causa privada: só criador ou quem tem o inviteCode
    if (causa.visibility === 'PRIVATE' && causa.creatorId !== userId) {
      // Permite acesso se o usuário já votou (ou seja, foi convidado)
      if (userId) {
        const hasVote = await this.prisma.causaVote.findUnique({
          where: { causaId_userId: { causaId, userId } },
        });
        if (!hasVote) throw new ForbiddenException('Causa privada');
      } else {
        throw new ForbiddenException('Causa privada');
      }
    }

    return causa;
  }

  async findByInviteCode(code: string) {
    const causa = await this.prisma.causa.findUnique({
      where: { inviteCode: code },
      include: CAUSA_INCLUDE,
    });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    return causa;
  }

  // ── Contagem de votos por opção ───────────────────────────────

  async getVotesSummary(causaId: string, requesterId?: string) {
    const causa = await this.findOneOrFail(causaId);

    // Se hideVoteCount e ainda OPEN: só o criador vê contagens
    const hideCount =
      causa.hideVoteCount &&
      causa.status === 'OPEN' &&
      requesterId !== causa.creatorId;

    const votes = await this.prisma.causaVote.groupBy({
      by: ['optionId'],
      where: { causaId },
      _count: { id: true },
      _sum: { numCotas: true },
    });

    const totalVotes = await this.prisma.causaVote.count({ where: { causaId } });

    return {
      totalVotes,
      options: causa.options.map((opt: any) => {
        const stat = votes.find((v: any) => v.optionId === opt.id);
        const count = stat?._count?.id ?? 0;
        const cotas = stat?._sum?.numCotas ?? 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          ...opt,
          voteCount: hideCount ? null : count,
          cotasCount: hideCount ? null : cotas,
          percentage: hideCount ? null : pct,
        };
      }),
    };
  }

  // ── Leaderboard de acertadores ────────────────────────────────

  async getLeaderboard(causaId: string) {
    const winners = await this.prisma.causaVote.findMany({
      where: { causaId, isCorrect: true },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
      orderBy: [{ numCotas: 'desc' }, { createdAt: 'asc' }],
    });

    return winners.map((w, i) => ({
      rank: i + 1,
      user: w.user,
      numCotas: w.numCotas,
      prizeAmount: w.prizeAmount,
      votedAt: w.createdAt,
    }));
  }

  // ── Helpers internos ──────────────────────────────────────────

  async findOneOrFail(causaId: string) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: CAUSA_INCLUDE,
    });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    return causa;
  }

  private assertOwnerOrAdmin(causa: any, userId: string, userRole: string) {
    if (causa.creatorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas o criador ou admin pode fazer isso');
    }
  }
}
